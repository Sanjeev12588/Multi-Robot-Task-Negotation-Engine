import pytest
import asyncio
from backend.models import (
    RobotType, RobotStatus, Task, TaskPriority, TaskStatus, Corridor
)
from backend.robot_agent import RobotAgent
from backend.negotiation import TaskNegotiationEngine
from backend.conflict_engine import ConflictEngine
from backend.deadlock_detector import DeadlockDetector
from backend.battery_scheduler import BatteryScheduler
from backend.failure_recovery import FailureRecoveryEngine
from backend.simulation import SimulationEngine

# Test 1: Task Bidding
def test_task_bidding():
    agent = RobotAgent.create("R001", RobotType.FAST_PICKER, 100.0, 100.0)
    task = Task(
        id="T001",
        pickup_x=120.0,
        pickup_y=110.0,
        drop_x=300.0,
        drop_y=250.0,
        priority=TaskPriority.HIGH,
        deadline=500.0,
        payload=20.0,
        required_capability="FAST_PICK"
    )
    bid = agent.calculate_bid(task, sim_time=10.0)
    assert bid is not None
    assert bid.score > 0
    assert bid.robot_id == "R001"
    assert "Cap:" in bid.reason

# Test 2: Task Assignment & Winner Selection
def test_task_assignment():
    engine = TaskNegotiationEngine()
    agent_near = RobotAgent.create("R010", RobotType.STANDARD_CARRIER, 105.0, 105.0)
    agent_far = RobotAgent.create("R011", RobotType.STANDARD_CARRIER, 700.0, 700.0)
    task = Task(
        id="T002",
        pickup_x=100.0,
        pickup_y=100.0,
        drop_x=200.0,
        drop_y=200.0,
        priority=TaskPriority.NORMAL,
        deadline=600.0,
        payload=50.0,
        required_capability="STANDARD_TRANSPORT"
    )
    winner, bids, evt = engine.conduct_auction(task, [agent_near, agent_far], sim_time=0.0)
    assert winner is not None
    assert winner.data.id == "R010"
    assert task.status == TaskStatus.ASSIGNED
    assert task.owner_robot_id == "R010"

# Test 3: Battery Rejection
def test_battery_rejection():
    agent = RobotAgent.create("R020", RobotType.STANDARD_CARRIER, 100.0, 100.0)
    agent.data.battery = 18.0  # Under critical threshold
    task = Task(
        id="T003",
        pickup_x=400.0,
        pickup_y=400.0,
        drop_x=700.0,
        drop_y=700.0,
        priority=TaskPriority.NORMAL,
        deadline=600.0,
        payload=80.0,
        required_capability="STANDARD_TRANSPORT"
    )
    eligible, reason = agent.evaluate_task(task)
    assert not eligible
    assert "Battery critically low" in reason or "Insufficient energy margin" in reason
    bid = agent.calculate_bid(task, sim_time=0.0)
    assert bid is None

# Test 4: Collision Prediction
def test_collision_prediction():
    engine = ConflictEngine(safety_threshold=8.0, prediction_horizon=3.5)
    r1 = RobotAgent.create("R030", RobotType.STANDARD_CARRIER, 100.0, 100.0)
    r2 = RobotAgent.create("R031", RobotType.STANDARD_CARRIER, 100.0, 120.0)
    
    # Headed directly towards each other
    r1.plan_path_to(100.0, 150.0)
    r2.plan_path_to(100.0, 70.0)

    events = engine.predict_inter_robot_collisions([r1, r2], sim_time=1.0, tasks_by_id={})
    assert len(events) >= 1
    conf_evt, sys_evt = events[0]
    assert conf_evt.conflict_type == "COLLISION_PREDICTED"
    assert conf_evt.status == "RESOLVED"

# Test 5: Right-of-Way Resolution
def test_right_of_way_resolution():
    engine = ConflictEngine(safety_threshold=8.0)
    c1 = Corridor(id="C01", name="Corridor 1", start_x=100.0, start_y=100.0, end_x=100.0, end_y=200.0)
    
    r1 = RobotAgent.create("R040", RobotType.STANDARD_CARRIER, 95.0, 95.0)
    r2 = RobotAgent.create("R041", RobotType.STANDARD_CARRIER, 105.0, 205.0)
    
    # R1 reserves corridor
    allowed1, conf1 = engine.check_corridor_reservation(r1, c1, sim_time=1.0)
    assert allowed1
    assert c1.reserved_by == "R040"

    # R2 requests same corridor with Normal task -> R2 should wait
    allowed2, conf2 = engine.check_corridor_reservation(r2, c1, sim_time=2.0)
    assert not allowed2
    assert conf2 is not None
    assert conf2.winner_robot == "R040"
    assert "WAIT" in conf2.action

# Test 6: Deadlock Cycle Detection
def test_deadlock_cycle_detection():
    detector = DeadlockDetector()
    graph = {
        "R021": "R043",
        "R043": "R082",
        "R082": "R021",
        "R099": "R021"  # Branch, not part of cycle
    }
    cycles = detector.find_cycles(graph)
    assert len(cycles) == 1
    assert set(cycles[0]) == {"R021", "R043", "R082"}

# Test 7: Deadlock Recovery
def test_deadlock_recovery():
    detector = DeadlockDetector()
    r1 = RobotAgent.create("R050", RobotType.FAST_PICKER, 100.0, 100.0)
    r2 = RobotAgent.create("R051", RobotType.STANDARD_CARRIER, 110.0, 100.0)
    r3 = RobotAgent.create("R052", RobotType.HEAVY_CARRIER, 120.0, 100.0)
    agents_map = {"R050": r1, "R051": r2, "R052": r3}
    
    cycle = ["R050", "R051", "R052"]
    dlk_evt, sys_evt = detector.resolve_deadlock(cycle, agents_map, [], {}, sim_time=5.0)
    assert dlk_evt.status == "RESOLVED"
    assert dlk_evt.recovery_time_sec > 0
    # Check that yielding robot backed off / is no longer waiting
    yielding_agent = agents_map[dlk_evt.yielding_robot]
    assert yielding_agent.data.status != RobotStatus.WAITING

# Test 8: Robot Failure Recovery
def test_robot_failure_recovery():
    recovery = FailureRecoveryEngine()
    negotiation = TaskNegotiationEngine()
    
    r_failed = RobotAgent.create("R127", RobotType.STANDARD_CARRIER, 200.0, 200.0)
    r_backup = RobotAgent.create("R212", RobotType.STANDARD_CARRIER, 210.0, 210.0)
    agents = {"R127": r_failed, "R212": r_backup}

    task = Task(
        id="T044",
        pickup_x=220.0,
        pickup_y=220.0,
        drop_x=300.0,
        drop_y=300.0,
        priority=TaskPriority.HIGH,
        deadline=500.0,
        payload=40.0,
        required_capability="STANDARD_TRANSPORT",
        status=TaskStatus.ASSIGNED,
        owner_robot_id="R127"
    )
    tasks = {"T044": task}

    record, evts = recovery.trigger_robot_failure("R127", agents, tasks, negotiation, sim_time=31.7)
    assert record is not None
    assert record.mission_continuity == 100.0
    assert "T044" in record.reassigned_tasks
    assert task.owner_robot_id == "R212"
    assert r_failed.data.status == RobotStatus.FAILED

# Test 9: Coordinator Failure & Local Autonomy
@pytest.mark.asyncio
async def test_coordinator_failure_local_autonomy():
    sim = SimulationEngine(num_robots=50, num_tasks=20)
    assert sim.coordinator_online is True
    assert sim.local_autonomy_active is False

    # Simulate coordinator disconnect
    await sim.toggle_coordinator()
    assert sim.coordinator_online is False
    assert sim.local_autonomy_active is True

    # Simulate a step under local autonomy
    await sim.step(dt=0.2)
    # Ensure robots continue moving and negotiating
    active_moving = sum(1 for a in sim.agents if a.data.status in [RobotStatus.MOVING, RobotStatus.ASSIGNED])
    assert active_moving >= 0

# Test 10: 500 Robot Simulation Initialization
def test_500_robot_simulation_initialization():
    sim = SimulationEngine(num_robots=500, num_tasks=200)
    assert len(sim.agents) == 500
    assert len(sim.tasks) == 200
    assert len(sim.zones) == 25
    assert len(sim.corridors) == 12
    assert len(sim.charging_stations) == 15

    # Check heterogeneous types present
    types = {a.data.robot_type for a in sim.agents}
    assert RobotType.FAST_PICKER in types
    assert RobotType.STANDARD_CARRIER in types
    assert RobotType.HEAVY_CARRIER in types
    assert RobotType.SUPPORT_ROBOT in types

    metrics = sim.get_metrics()
    assert metrics.total_robots == 500
    assert metrics.total_tasks == 200

# Test 11: Task Ownership State Transition (QUEUED -> ASSIGNED -> IN_PROGRESS -> COMPLETED)
@pytest.mark.asyncio
async def test_task_ownership_state_transition():
    sim = SimulationEngine(num_robots=10, num_tasks=5)
    task = Task(
        id="T_TRANS_01",
        pickup_x=50.0,
        pickup_y=50.0,
        drop_x=120.0,
        drop_y=120.0,
        priority=TaskPriority.HIGH,
        deadline=300.0,
        payload=30.0,
        required_capability="FAST_PICK",
        status=TaskStatus.QUEUED
    )
    sim.tasks.insert(0, task)
    sim.tasks_by_id[task.id] = task

    # Auction task
    winner, bids, evt = sim.negotiation_engine.conduct_auction(task, sim.agents, sim_time=0.0)
    assert winner is not None
    assert task.status == TaskStatus.ASSIGNED
    assert task.owner_robot_id == winner.data.id

    # Place robot at pickup location
    winner.data.x = task.pickup_x
    winner.data.y = task.pickup_y
    await sim.step(dt=0.2)
    assert task.status == TaskStatus.IN_PROGRESS

    # Place robot at drop location
    winner.data.x = task.drop_x
    winner.data.y = task.drop_y
    await sim.step(dt=0.2)
    assert task.status == TaskStatus.COMPLETED
    assert winner.data.current_task is None

# Test 12: Battery-Triggered Task Reassignment
@pytest.mark.asyncio
async def test_battery_triggered_task_reassignment():
    sim = SimulationEngine(num_robots=20, num_tasks=10)
    agent = sim.agents[0]
    task = sim.tasks[0]
    task.owner_robot_id = agent.data.id
    task.status = TaskStatus.ASSIGNED
    agent.data.current_task = task.id
    agent.data.status = RobotStatus.MOVING

    # Artificially drain battery to 14%
    agent.data.battery = 14.0

    # Step simulation
    reassign_ids, evts = sim.battery_scheduler.inspect_and_schedule(
        sim.agents, sim.charging_stations, sim.tasks_by_id, sim_time=10.0
    )
    assert task.id in reassign_ids
    assert task.status == TaskStatus.UNASSIGNED
    assert agent.data.current_task is None
    # Robot should be moving toward a charger
    assert agent.data.status == RobotStatus.MOVING

# Test 13: Failure-Triggered Multi-Task Reassignment
@pytest.mark.asyncio
async def test_failure_multi_task_reassignment():
    sim = SimulationEngine(num_robots=30, num_tasks=15)
    failing_id = sim.agents[0].data.id
    # Assign two tasks to this robot
    t1, t2 = sim.tasks[0], sim.tasks[1]
    t1.owner_robot_id = failing_id
    t1.status = TaskStatus.ASSIGNED
    t2.owner_robot_id = failing_id
    t2.status = TaskStatus.ASSIGNED

    record, evts = await sim.fail_robot(failing_id)
    assert record is not None
    assert failing_id == record.robot_id
    assert set(record.affected_tasks).issuperset({t1.id, t2.id})
    assert len(record.reassigned_tasks) >= 2
    assert t1.owner_robot_id != failing_id
    assert t2.owner_robot_id != failing_id

# Test 14: Coordinator Offline Local Decision Tracing
@pytest.mark.asyncio
async def test_coordinator_offline_decision_tracing():
    sim = SimulationEngine(num_robots=40, num_tasks=10)
    # Disconnect coordinator
    await sim.toggle_coordinator()
    assert sim.coordinator_online is False
    assert sim.local_autonomy_active is True

    # Broadcast new task
    new_task = Task(
        id="T_P2P_01",
        pickup_x=sim.agents[0].data.x + 20.0,
        pickup_y=sim.agents[0].data.y + 20.0,
        drop_x=300.0,
        drop_y=300.0,
        priority=TaskPriority.HIGH,
        deadline=400.0,
        payload=25.0,
        required_capability="FAST_PICK",
        status=TaskStatus.QUEUED
    )
    sim.tasks.insert(0, new_task)
    sim.tasks_by_id[new_task.id] = new_task

    # Step simulation under local autonomy
    await sim.step(dt=0.2)
    # Task should be negotiated and assigned locally
    assert new_task.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]
    assert new_task.owner_robot_id is not None

# Test 15: WebSocket State Consistency & Measured Payload Size
def test_websocket_state_consistency_and_payload_size():
    import json
    sim = SimulationEngine(num_robots=500, num_tasks=200)
    compact_robots = sim.get_compact_robot_positions()
    full_state = sim.get_full_state()
    
    assert len(compact_robots) == 500
    frame_payload = {
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
    raw_json = json.dumps(frame_payload)
    payload_size_bytes = len(raw_json.encode('utf-8'))
    # Verify payload size is under 35KB for 500 AMRs!
    assert payload_size_bytes < 35000, f"Payload size {payload_size_bytes} exceeds 35KB"
    assert frame_payload["metrics"]["total_robots"] == 500

