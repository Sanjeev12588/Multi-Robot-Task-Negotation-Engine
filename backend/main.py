import asyncio
import json
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .simulation import SimulationEngine
from .models import FleetStateResponse, FleetMetrics, Task, Robot

# Global Simulation Engine Instance (Default: 500 AMRs, 200 Tasks)
sim = SimulationEngine(num_robots=500, num_tasks=200)
sim_task: Optional[asyncio.Task] = None
connected_clients: List[WebSocket] = []

async def simulation_loop():
    """Background simulation tick runner at 5-10 Hz."""
    while True:
        try:
            if sim.is_running:
                await sim.step(dt=0.2)
            
            # Broadcast state if clients connected
            if connected_clients:
                compact_robots = sim.get_compact_robot_positions()
                full_state = sim.get_full_state()
                payload = {
                    "type": "SIM_TICK",
                    "timestamp": sim.sim_time,
                    "metrics": full_state.metrics.model_dump(),
                    "robots_compact": compact_robots,
                    "recent_events": [e.model_dump() for e in full_state.recent_events[:12]],
                    "active_conflicts": [c.model_dump() for c in full_state.active_conflicts],
                    "recent_deadlocks": [d.model_dump() for d in full_state.recent_deadlocks],
                    "recent_failures": [f.model_dump() for f in full_state.recent_failures],
                    "recent_bids": [b.model_dump() for b in full_state.recent_bids[:6]],
                }
                data_str = json.dumps(payload)
                for ws in list(connected_clients):
                    try:
                        await ws.send_text(data_str)
                    except Exception:
                        if ws in connected_clients:
                            connected_clients.remove(ws)
            
            await asyncio.sleep(0.095)  # Steady ~10 Hz stream rate
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in simulation loop: {e}")
            await asyncio.sleep(0.5)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global sim_task
    sim.is_running = True
    sim_task = asyncio.create_task(simulation_loop())
    yield
    if sim_task:
        sim_task.cancel()

app = FastAPI(
    title="FleetMind API",
    description="Decentralized Multi-Robot Task Negotiation & Recovery Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConfigRequest(BaseModel):
    num_robots: int = 500
    num_tasks: int = 200

@app.get("/")
def read_root():
    return {
        "service": "FleetMind Engine",
        "status": "OPERATIONAL",
        "robots": len(sim.agents),
        "coordinator_online": sim.coordinator_online,
        "local_autonomy_active": sim.local_autonomy_active
    }

@app.get("/api/state", response_model=FleetStateResponse)
def get_state():
    return sim.get_full_state()

@app.get("/api/robots")
def get_robots(limit: int = Query(500, le=1000)):
    return [a.data for a in sim.agents[:limit]]

@app.get("/api/tasks")
def get_tasks(limit: int = Query(200, le=1000)):
    return sim.tasks[:limit]

@app.get("/api/metrics", response_model=FleetMetrics)
def get_metrics():
    return sim.get_metrics()

@app.post("/api/simulation/start")
def start_simulation():
    sim.is_running = True
    return {"status": "RUNNING", "sim_time": sim.sim_time}

@app.post("/api/simulation/stop")
def stop_simulation():
    sim.is_running = False
    return {"status": "STOPPED", "sim_time": sim.sim_time}

@app.post("/api/simulation/reset")
def reset_simulation(req: Optional[ConfigRequest] = None):
    global sim
    num_robots = req.num_robots if req else 500
    num_tasks = req.num_tasks if req else 200
    sim = SimulationEngine(num_robots=num_robots, num_tasks=num_tasks)
    sim.is_running = True
    return {"status": "RESET", "num_robots": num_robots, "num_tasks": num_tasks}

@app.post("/api/scenario/emergency-surge")
async def trigger_emergency_surge():
    created = await sim.trigger_emergency_surge()
    return {"status": "SURGE_TRIGGERED", "task_count": len(created), "tasks": created}

@app.post("/api/scenario/conflict")
async def trigger_conflict():
    conf = await sim.trigger_corridor_conflict()
    return {"status": "CONFLICT_TRIGGERED", "conflict": conf}

@app.post("/api/scenario/deadlock")
async def trigger_deadlock():
    dlk = await sim.trigger_circular_deadlock()
    return {"status": "DEADLOCK_TRIGGERED", "deadlock": dlk}

@app.post("/api/battery/drain/{robot_id}")
async def drain_battery(robot_id: str, battery: float = 17.0):
    await sim.drain_robot_battery(robot_id=robot_id, battery=battery)
    return {"status": "BATTERY_DRAINED", "robot_id": robot_id, "battery": battery}

@app.post("/api/failure/robot/{robot_id}")
async def trigger_robot_failure(robot_id: str):
    record, evts = await sim.fail_robot(robot_id=robot_id)
    if not record:
        raise HTTPException(status_code=404, detail="Robot not found")
    return {"status": "FAILED", "record": record}

@app.post("/api/failure/coordinator")
async def toggle_coordinator_failure():
    online = await sim.toggle_coordinator()
    return {
        "coordinator_online": online,
        "local_autonomy_active": not online,
        "status": "ONLINE" if online else "OFFLINE"
    }

@app.post("/api/task/{task_id}/reassign")
async def reassign_task(task_id: str):
    async with sim.lock:
        if task_id not in sim.tasks_by_id:
            raise HTTPException(status_code=404, detail="Task not found")
        task = sim.tasks_by_id[task_id]
        if task.owner_robot_id:
            prev_agent = sim.agents_by_id.get(task.owner_robot_id)
            if prev_agent:
                prev_agent.data.current_task = None
                prev_agent.data.workload = max(0, prev_agent.data.workload - 1)
        
        task.status = "UNASSIGNED"
        task.owner_robot_id = None
        
        winner, bids, evt = sim.negotiation_engine.conduct_auction(
            task, sim.agents, sim.sim_time, is_coordinator_online=sim.coordinator_online
        )
        if evt:
            sim.system_events.append(evt)
        return {"status": "REASSIGNED", "task_id": task_id, "new_owner": winner.data.id if winner else None}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        # Initial complete handshake state
        initial_state = sim.get_full_state()
        await websocket.send_text(json.dumps({
            "type": "INITIAL_STATE",
            "state": initial_state.model_dump(),
            "robots_compact": sim.get_compact_robot_positions()
        }))
        while True:
            # Handle incoming control messages from UI
            data = await websocket.receive_text()
            msg = json.loads(data)
            action = msg.get("action")
            if action == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
            elif action == "SPEED":
                sim.speed = float(msg.get("speed", 1.0))
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
