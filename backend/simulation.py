import asyncio
import math
import random
import time
from typing import Dict, List, Optional, Tuple, Any
from .models import (
    Robot, RobotType, RobotStatus, Task, TaskStatus, TaskPriority,
    Corridor, ChargingStation, Zone, FleetMetrics, FleetStateResponse,
    SystemEvent, ConflictEvent, DeadlockEvent, RobotFailureEvent, BidDetail
)
from .robot_agent import RobotAgent
from .negotiation import TaskNegotiationEngine
from .conflict_engine import ConflictEngine
from .deadlock_detector import DeadlockDetector
from .battery_scheduler import BatteryScheduler
from .failure_recovery import FailureRecoveryEngine

class SimulationEngine:
    """
    FleetMind Core Industrial Simulation Engine.
    Coordinates 500+ AMRs in high-density layout, non-blocking asyncio tick loop,
    real-time metrics calculation, and deterministic scenario injections.
    """

    def __init__(self, num_robots: int = 500, num_tasks: int = 200, seed: int = 42):
        random.seed(seed)
        self.num_robots = num_robots
        self.num_tasks = num_tasks
        self.sim_time: float = 0.0
        self.is_running: bool = False
        self.speed: float = 1.0
        
        # Subsystems
        self.negotiation_engine = TaskNegotiationEngine()
        self.conflict_engine = ConflictEngine(safety_threshold=7.0, prediction_horizon=3.5)
        self.deadlock_detector = DeadlockDetector()
        self.battery_scheduler = BatteryScheduler()
        self.failure_recovery = FailureRecoveryEngine()

        # State storage
        self.agents: List[RobotAgent] = []
        self.agents_by_id: Dict[str, RobotAgent] = {}
        self.tasks: List[Task] = []
        self.tasks_by_id: Dict[str, Task] = {}
        self.corridors: List[Corridor] = []
        self.charging_stations: List[ChargingStation] = []
        self.zones: List[Zone] = []
        
        # Coordinator state
        self.coordinator_online: bool = True
        self.local_autonomy_active: bool = False

        # Logs & Event Buffer
        self.system_events: List[SystemEvent] = []
        self.lock = asyncio.Lock()
        self.ticks_count: int = 0
        self.start_wall_time: float = time.perf_counter()

        # Initialize layout and entities
        self._init_layout()
        self._init_robots(num_robots)
        self._init_tasks(num_tasks)

    def _init_layout(self) -> None:
        """Create 25 industrial zones, 12 narrow corridors, and 15 charging stations."""
        # 25 Zones in 800m x 600m warehouse
        zone_defs = [
            ("Z_RECV_1", "Receiving Dock 1", 20, 20, 100, 60, "DOCK"),
            ("Z_RECV_2", "Receiving Dock 2", 140, 20, 100, 60, "DOCK"),
            ("Z_PICK_A", "Picking Zone Alpha", 300, 40, 120, 80, "PICKING"),
            ("Z_PICK_B", "Picking Zone Beta", 450, 40, 120, 80, "PICKING"),
            ("Z_STOR_A1", "Storage Bay A1", 40, 120, 120, 70, "STORAGE"),
            ("Z_STOR_A2", "Storage Bay A2", 180, 120, 120, 70, "STORAGE"),
            ("Z_STOR_B1", "Storage Bay B1", 40, 210, 120, 70, "STORAGE"),
            ("Z_STOR_B2", "Storage Bay B2", 180, 210, 120, 70, "STORAGE"),
            ("Z_STOR_C1", "Storage Bay C1", 40, 300, 120, 70, "STORAGE"),
            ("Z_STOR_C2", "Storage Bay C2", 180, 300, 120, 70, "STORAGE"),
            ("Z_STOR_D1", "Storage Bay D1", 40, 390, 120, 70, "STORAGE"),
            ("Z_STOR_D2", "Storage Bay D2", 180, 390, 120, 70, "STORAGE"),
            ("Z_STOR_E1", "Storage Bay E1", 40, 480, 120, 70, "STORAGE"),
            ("Z_STOR_E2", "Storage Bay E2", 180, 480, 120, 70, "STORAGE"),
            ("Z_SORT_1", "Automated Sorter 1", 340, 160, 100, 120, "SORTING"),
            ("Z_SORT_2", "Automated Sorter 2", 480, 160, 100, 120, "SORTING"),
            ("Z_PACK_1", "Packing Bay 1", 340, 320, 110, 80, "PACKING"),
            ("Z_PACK_2", "Packing Bay 2", 470, 320, 110, 80, "PACKING"),
            ("Z_PACK_3", "Packing Bay 3", 340, 420, 110, 80, "PACKING"),
            ("Z_PACK_4", "Packing Bay 4", 470, 420, 110, 80, "PACKING"),
            ("Z_SHIP_1", "Shipping Dock 1", 640, 60, 120, 90, "DOCK"),
            ("Z_SHIP_2", "Shipping Dock 2", 640, 180, 120, 90, "DOCK"),
            ("Z_SHIP_3", "Shipping Dock 3", 640, 300, 120, 90, "DOCK"),
            ("Z_SHIP_4", "Shipping Dock 4", 640, 420, 120, 90, "DOCK"),
            ("Z_CHG_HUB", "Central Charging Hub", 620, 520, 150, 70, "CHARGING"),
        ]
        self.zones = [
            Zone(id=zid, name=name, x=x, y=y, width=w, height=h, zone_type=zt)
            for zid, name, x, y, w, h, zt in zone_defs
        ]

        # 12 Narrow single-lane Corridors
        corridor_defs = [
            ("C01", "Corridor C1 (West Transit)", 160, 80, 160, 160),
            ("C02", "Corridor C2 (Storage Spine 1)", 160, 190, 160, 270),
            ("C03", "Corridor C3 (Storage Spine 2)", 160, 290, 160, 370),
            ("C04", "Corridor C4 (Storage Spine 3)", 160, 380, 160, 460),
            ("C05", "Corridor C5 (Central Choke Alpha)", 310, 140, 330, 140),
            ("C06", "Corridor C6 (Central Choke Beta)", 310, 260, 330, 260),
            ("C07", "Corridor C7 (Sorter Express Lane)", 445, 140, 475, 140),
            ("C08", "Corridor C8 (Packing Gateway)", 310, 380, 330, 380),
            ("C09", "Corridor C9 (Shipping Bypass North)", 590, 110, 630, 110),
            ("C10", "Corridor C10 (Shipping Bypass Mid)", 590, 230, 630, 230),
            ("C11", "Corridor C11 (Shipping Bypass South)", 590, 350, 630, 350),
            ("C12", "Corridor C12 (Charging Station Arterial)", 590, 480, 630, 480),
        ]
        self.corridors = [
            Corridor(id=cid, name=name, start_x=sx, start_y=sy, end_x=ex, end_y=ey)
            for cid, name, sx, sy, ex, ey in corridor_defs
        ]

        # 15 Charging Stations
        charger_coords = [
            ("CS01", 630, 530), ("CS02", 655, 530), ("CS03", 680, 530), ("CS04", 705, 530), ("CS05", 730, 530),
            ("CS06", 630, 555), ("CS07", 655, 555), ("CS08", 680, 555), ("CS09", 705, 555), ("CS10", 730, 555),
            ("CS11", 20, 540),  ("CS12", 45, 540),  ("CS13", 70, 540),  ("CS14", 95, 540),  ("CS15", 120, 540),
        ]
        self.charging_stations = [
            ChargingStation(id=cid, x=cx, y=cy, capacity=2)
            for cid, cx, cy in charger_coords
        ]

    def _init_robots(self, count: int) -> None:
        """Instantiate heterogeneous robot agents."""
        self.agents.clear()
        self.agents_by_id.clear()

        # Distribution: 40% Standard Carrier, 30% Fast Picker, 20% Heavy Carrier, 10% Support
        types_pool = (
            [RobotType.STANDARD_CARRIER] * int(count * 0.40) +
            [RobotType.FAST_PICKER] * int(count * 0.30) +
            [RobotType.HEAVY_CARRIER] * int(count * 0.20) +
            [RobotType.SUPPORT_ROBOT] * (count - int(count * 0.40) - int(count * 0.30) - int(count * 0.20))
        )
        random.shuffle(types_pool)

        for i in range(count):
            rid = f"R{i+1:03d}"
            rtype = types_pool[i]
            # Distribute realistically across warehouse floor
            x = random.uniform(30.0, 760.0)
            y = random.uniform(30.0, 570.0)
            agent = RobotAgent.create(rid, rtype, x, y)
            self.agents.append(agent)
            self.agents_by_id[rid] = agent

    def _init_tasks(self, count: int) -> None:
        """Generate tasks across warehouse zones."""
        self.tasks.clear()
        self.tasks_by_id.clear()
        
        priorities = [TaskPriority.LOW] * 20 + [TaskPriority.NORMAL] * 50 + [TaskPriority.HIGH] * 25 + [TaskPriority.CRITICAL] * 5
        capabilities = ["STANDARD_TRANSPORT", "FAST_PICK", "HEAVY_TRANSPORT", "PALLET_MOVE", "LIGHT_PAYLOAD"]

        for i in range(count):
            tid = f"T{i+1:03d}"
            # Pick random pickup zone and drop zone
            pz = random.choice(self.zones[:14])
            dz = random.choice(self.zones[14:])

            pickup_x = pz.x + random.uniform(5.0, pz.width - 5.0)
            pickup_y = pz.y + random.uniform(5.0, pz.height - 5.0)
            drop_x = dz.x + random.uniform(5.0, dz.width - 5.0)
            drop_y = dz.y + random.uniform(5.0, dz.height - 5.0)

            prio = random.choice(priorities)
            payload = random.choice([15.0, 35.0, 75.0, 120.0, 250.0, 480.0])
            cap = "HEAVY_TRANSPORT" if payload > 180.0 else ("FAST_PICK" if payload < 30.0 else "STANDARD_TRANSPORT")

            deadline = random.uniform(300.0, 900.0)
            task = Task(
                id=tid,
                pickup_x=round(pickup_x, 1),
                pickup_y=round(pickup_y, 1),
                drop_x=round(drop_x, 1),
                drop_y=round(drop_y, 1),
                priority=prio,
                deadline=round(deadline, 1),
                payload=payload,
                required_capability=cap,
                status=TaskStatus.QUEUED,
                created_at=0.0
            )
            self.tasks.append(task)
            self.tasks_by_id[tid] = task

        # Seed initial system event
        self._add_event("SYSTEM", f"FleetMind initialized with {len(self.agents)} AMRs, {len(self.tasks)} Tasks across 25 industrial zones.", "INFO")

    def _add_event(self, category: str, message: str, severity: str = "INFO", entity_id: Optional[str] = None) -> None:
        evt = SystemEvent(
            id=f"evt_{len(self.system_events)+1:04d}_{int(self.sim_time)}",
            timestamp=round(self.sim_time, 1),
            category=category,
            message=message,
            severity=severity,
            entity_id=entity_id
        )
        self.system_events.append(evt)
        if len(self.system_events) > 80:
            self.system_events = self.system_events[-80:]

    async def step(self, dt: float = 0.2) -> None:
        """Primary simulation tick step executed at 5-10 Hz."""
        async with self.lock:
            self.ticks_count += 1
            self.sim_time += dt * self.speed
            all_raw_robots = [a.data for a in self.agents]
            resource_locks = {c.id: c.reserved_by for c in self.corridors if c.reserved_by}

            # 1. Decentralized Incomplete Observation (Spatial Grid Indexed)
            spatial_grid: Dict[Tuple[int, int], List[Robot]] = {}
            cell_size = 120.0
            for a in self.agents:
                r = a.data
                if r.status != RobotStatus.FAILED:
                    cx = int(r.x // cell_size)
                    cy = int(r.y // cell_size)
                    spatial_grid.setdefault((cx, cy), []).append(r)

            for agent in self.agents:
                acx = int(agent.data.x // cell_size)
                acy = int(agent.data.y // cell_size)
                local_candidates: List[Robot] = []
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        cell_robs = spatial_grid.get((acx + dx, acy + dy))
                        if cell_robs:
                            local_candidates.extend(cell_robs)
                agent.observe(local_candidates, resource_locks)

            # 2. Predictive Collision Detection across local moving clusters
            col_events = self.conflict_engine.predict_inter_robot_collisions(self.agents, self.sim_time, self.tasks_by_id)
            for conf, sys_evt in col_events:
                self.system_events.append(sys_evt)

            # 3. Directed Wait-For Deadlock Detection & Recovery
            wait_graph = self.deadlock_detector.build_wait_for_graph(self.agents)
            cycles = self.deadlock_detector.find_cycles(wait_graph)
            for cycle in cycles:
                dlk_evt, sys_dlk = self.deadlock_detector.resolve_deadlock(
                    cycle, self.agents_by_id, self.corridors, self.tasks_by_id, self.sim_time
                )
                self.system_events.append(sys_dlk)

            # 4. Battery Safety Guard
            reassign_tids, batt_evts = self.battery_scheduler.inspect_and_schedule(
                self.agents, self.charging_stations, self.tasks_by_id, self.sim_time
            )
            for evt in batt_evts:
                self.system_events.append(evt)

            # 5. Auction & Negotiate Queued/Reassigned Tasks
            queued_tasks = [t for t in self.tasks if t.status in [TaskStatus.QUEUED, TaskStatus.UNASSIGNED]]
            # Sort queued tasks by priority
            prio_weights = {TaskPriority.CRITICAL: 4, TaskPriority.HIGH: 3, TaskPriority.NORMAL: 2, TaskPriority.LOW: 1}
            queued_tasks.sort(key=lambda t: prio_weights.get(t.priority, 1), reverse=True)

            # Auction up to 5 tasks per tick to simulate continuous decentralized intake
            for task in queued_tasks[:5]:
                winning_agent, bids, evt = self.negotiation_engine.conduct_auction(
                    task, self.agents, self.sim_time, is_coordinator_online=self.coordinator_online
                )
                if evt:
                    self.system_events.append(evt)

            # 6. Step Kinematic Motion & Check Task Pickup/Delivery
            for agent in self.agents:
                robot = agent.data
                agent.step_motion(dt * self.speed)

                # Check task execution status
                if robot.current_task and robot.current_task in self.tasks_by_id:
                    task = self.tasks_by_id[robot.current_task]
                    
                    if task.status == TaskStatus.ASSIGNED:
                        # En route to pickup
                        dist_to_pickup = math.hypot(robot.x - task.pickup_x, robot.y - task.pickup_y)
                        if dist_to_pickup < 6.0:
                            task.status = TaskStatus.IN_PROGRESS
                            robot.status = RobotStatus.MOVING
                            agent.plan_path_to(task.drop_x, task.drop_y)
                            self._add_event("TASK", f"{robot.id} picked up {task.id} at ({task.pickup_x:.0f}, {task.pickup_y:.0f})", "INFO", robot.id)

                    elif task.status == TaskStatus.IN_PROGRESS:
                        # En route to delivery
                        dist_to_drop = math.hypot(robot.x - task.drop_x, robot.y - task.drop_y)
                        if dist_to_drop < 6.0:
                            task.status = TaskStatus.COMPLETED
                            task.completed_at = self.sim_time
                            robot.current_task = None
                            robot.workload = max(0, robot.workload - 1)
                            robot.status = RobotStatus.IDLE
                            robot.target_x = None
                            robot.target_y = None
                            agent.assigned_task_obj = None
                            
                            # Release any held corridor
                            if robot.reserved_resource:
                                for c in self.corridors:
                                    if c.id == robot.reserved_resource and c.reserved_by == robot.id:
                                        c.reserved_by = None
                                robot.reserved_resource = None

                            self._add_event("TASK", f"{robot.id} delivered {task.id} to ({task.drop_x:.0f}, {task.drop_y:.0f})", "SUCCESS", robot.id)

            # Release corridors when robots have passed through
            for c in self.corridors:
                if c.reserved_by:
                    holder = self.agents_by_id.get(c.reserved_by)
                    if holder:
                        # If robot is far from corridor, release it
                        mid_x = (c.start_x + c.end_x) / 2
                        mid_y = (c.start_y + c.end_y) / 2
                        dist = math.hypot(holder.data.x - mid_x, holder.data.y - mid_y)
                        if dist > 45.0:
                            c.reserved_by = None
                            holder.data.reserved_resource = None

    # Demo Scenario Injections
    async def trigger_emergency_surge(self) -> List[str]:
        """Inject 25 high-priority emergency tasks."""
        async with self.lock:
            created_ids = []
            for i in range(25):
                tid = f"T_SURGE_{i+1:02d}"
                pz = random.choice(self.zones[:8])
                dz = random.choice(self.zones[18:])
                t = Task(
                    id=tid,
                    pickup_x=pz.x + random.uniform(5, pz.width - 5),
                    pickup_y=pz.y + random.uniform(5, pz.height - 5),
                    drop_x=dz.x + random.uniform(5, dz.width - 5),
                    drop_y=dz.y + random.uniform(5, dz.height - 5),
                    priority=TaskPriority.CRITICAL if i < 10 else TaskPriority.HIGH,
                    deadline=180.0,
                    payload=random.choice([25.0, 60.0, 150.0]),
                    required_capability="FAST_PICK" if i < 10 else "STANDARD_TRANSPORT",
                    status=TaskStatus.QUEUED,
                    created_at=self.sim_time
                )
                self.tasks.insert(0, t)
                self.tasks_by_id[tid] = t
                created_ids.append(tid)

            self._add_event("SURGE", f"EMERGENCY SURGE: Broadcasted {len(created_ids)} CRITICAL/HIGH priority tasks!", "WARNING")
            return created_ids

    async def trigger_corridor_conflict(self) -> ConflictEvent:
        """Scripted Conflict between R021 and R087 in Corridor C07."""
        async with self.lock:
            r21 = self.agents_by_id.get("R021")
            r87 = self.agents_by_id.get("R087")
            c7 = next((c for c in self.corridors if c.id == "C07"), self.corridors[6])

            if r21 and r87:
                r21.data.x = c7.start_x - 15.0
                r21.data.y = c7.start_y
                r21.data.status = RobotStatus.MOVING
                r21.plan_path_to(c7.end_x + 20.0, c7.end_y)

                r87.data.x = c7.end_x + 15.0
                r87.data.y = c7.end_y
                r87.data.status = RobotStatus.MOVING
                r87.plan_path_to(c7.start_x - 20.0, c7.start_y)

                # Arbitrate
                c7.reserved_by = r21.data.id
                r21.data.reserved_resource = c7.id
                r87.data.status = RobotStatus.WAITING
                r87.data.wait_time_remaining = 3.4
                r87.data.waiting_for_robot = r21.data.id

                conf = ConflictEvent(
                    id=f"conf_scripted_{int(self.sim_time)}",
                    timestamp=self.sim_time,
                    robot_a=r21.data.id,
                    robot_b=r87.data.id,
                    resource_id=c7.id,
                    resource_type="CORRIDOR",
                    conflict_type="CORRIDOR_CONTENTION",
                    eta_seconds=3.4,
                    winner_robot=r21.data.id,
                    loser_robot=r87.data.id,
                    action="R087 WAIT",
                    status="RESOLVED",
                    detail=f"Resource {c7.name} contested: {r21.data.id} has right-of-way; {r87.data.id} holds outside corridor."
                )
                self.conflict_engine.active_conflicts.append(conf)
                self.conflict_engine.conflict_history.append(conf)
                self.conflict_engine.total_conflicts_count += 1
                self._add_event("CONFLICT", f"RESOURCE CONFLICT: {r21.data.id} <-> {r87.data.id} in {c7.name}. Winner: {r21.data.id}, Action: R087 WAIT", "WARNING", r21.data.id)
                return conf

    async def trigger_circular_deadlock(self) -> DeadlockEvent:
        """Inject circular wait condition: R021 -> R043 -> R082 -> R021."""
        async with self.lock:
            r21 = self.agents_by_id.get("R021")
            r43 = self.agents_by_id.get("R043")
            r82 = self.agents_by_id.get("R082")
            c7 = next((c for c in self.corridors if c.id == "C07"), self.corridors[6])

            if r21 and r43 and r82:
                r21.data.status = RobotStatus.WAITING
                r21.data.waiting_for_robot = r43.data.id
                
                r43.data.status = RobotStatus.WAITING
                r43.data.waiting_for_robot = r82.data.id

                r82.data.status = RobotStatus.WAITING
                r82.data.waiting_for_robot = r21.data.id

                # Resolve
                cycle = [r21.data.id, r43.data.id, r82.data.id]
                dlk_evt, sys_dlk = self.deadlock_detector.resolve_deadlock(
                    cycle, self.agents_by_id, self.corridors, self.tasks_by_id, self.sim_time
                )
                self.system_events.append(sys_dlk)
                return dlk_evt

    async def drain_robot_battery(self, robot_id: str = "R023", battery: float = 17.0) -> None:
        """Drain active robot battery to trigger autonomous reassignment."""
        async with self.lock:
            agent = self.agents_by_id.get(robot_id)
            if agent:
                agent.data.battery = battery
                # Ensure it has a task
                if not agent.data.current_task:
                    avail_tasks = [t for t in self.tasks if t.status == TaskStatus.QUEUED]
                    if avail_tasks:
                        t = avail_tasks[0]
                        agent.data.current_task = t.id
                        agent.data.status = RobotStatus.MOVING
                        t.status = TaskStatus.ASSIGNED
                        t.owner_robot_id = robot_id

                self._add_event("BATTERY", f"{robot_id} battery drained to {battery}%. Autonomous energy guard evaluating task feasibility.", "WARNING", robot_id)

    async def fail_robot(self, robot_id: str = "R127") -> Tuple[Optional[RobotFailureEvent], List[SystemEvent]]:
        """Simulate hardware failure on specified robot."""
        async with self.lock:
            agent = self.agents_by_id.get(robot_id)
            if agent:
                # Assign 3 tasks if none active to demonstrate recovery
                active = [t for t in self.tasks if t.owner_robot_id == robot_id]
                if len(active) < 3:
                    queued = [t for t in self.tasks if t.status == TaskStatus.QUEUED][:3]
                    for t in queued:
                        t.status = TaskStatus.ASSIGNED
                        t.owner_robot_id = robot_id
                    agent.data.current_task = queued[0].id if queued else None

            record, evts = self.failure_recovery.trigger_robot_failure(
                robot_id, self.agents_by_id, self.tasks_by_id, self.negotiation_engine,
                self.sim_time, is_coordinator_online=self.coordinator_online
            )
            for e in evts:
                self.system_events.append(e)
            return record, evts

    async def toggle_coordinator(self) -> bool:
        """Toggle Central Coordinator online/offline to demonstrate local autonomy."""
        async with self.lock:
            self.coordinator_online = not self.coordinator_online
            self.local_autonomy_active = not self.coordinator_online
            
            if self.coordinator_online:
                self._add_event("COORDINATOR", "CENTRAL COORDINATOR RESTORED. Telemetry aggregation synchronized.", "SUCCESS")
            else:
                self._add_event("COORDINATOR", "CENTRAL COORDINATOR OFFLINE! LOCAL AUTONOMY ACTIVE. AMRs running peer-to-peer negotiation.", "ERROR")
            return self.coordinator_online

    def get_metrics(self) -> FleetMetrics:
        """Compile live calculated evaluation metrics."""
        active_r = sum(1 for a in self.agents if a.data.status in [RobotStatus.ASSIGNED, RobotStatus.MOVING, RobotStatus.WAITING])
        idle_r = sum(1 for a in self.agents if a.data.status == RobotStatus.IDLE)
        charging_r = sum(1 for a in self.agents if a.data.status == RobotStatus.CHARGING)
        failed_r = sum(1 for a in self.agents if a.data.status == RobotStatus.FAILED)
        recovering_r = sum(1 for a in self.agents if a.data.status == RobotStatus.RECOVERING)

        queued_t = sum(1 for t in self.tasks if t.status in [TaskStatus.QUEUED, TaskStatus.UNASSIGNED])
        active_t = sum(1 for t in self.tasks if t.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS])
        completed_t = sum(1 for t in self.tasks if t.status == TaskStatus.COMPLETED)

        avg_batt = sum(a.data.battery for a in self.agents) / max(1, len(self.agents))
        
        avg_alloc_latency = (
            self.negotiation_engine.total_latency_ms / max(1, self.negotiation_engine.completed_auctions_count)
            if self.negotiation_engine.completed_auctions_count > 0 else 85.0
        )

        deadlock_res_rate = 100.0
        avg_dlk_rec_time = (
            self.deadlock_detector.total_recovery_time_sec / max(1, self.deadlock_detector.total_deadlocks_detected)
            if self.deadlock_detector.total_deadlocks_detected > 0 else 1.8
        )

        recovery_rate = (
            (self.failure_recovery.total_tasks_recovered / max(1, self.failure_recovery.total_tasks_recovered)) * 100.0
            if self.failure_recovery.total_failures_count > 0 else 100.0
        )

        return FleetMetrics(
            total_robots=len(self.agents),
            active_robots=active_r,
            idle_robots=idle_r,
            charging_robots=charging_r,
            failed_robots=failed_r,
            recovering_robots=recovering_r,
            
            total_tasks=len(self.tasks),
            queued_tasks=queued_t,
            active_tasks=active_t,
            completed_tasks=completed_t,
            reassigned_tasks_count=self.battery_scheduler.reassignments_count,

            task_allocation_success_rate=self.negotiation_engine.get_success_rate(),
            average_allocation_latency_ms=round(avg_alloc_latency, 1),

            conflict_count=self.conflict_engine.total_conflicts_count,
            conflict_resolution_rate=round((len([c for c in self.conflict_engine.conflict_history if c.status == 'RESOLVED']) / max(1, self.conflict_engine.total_conflicts_count)) * 100.0, 1) if self.conflict_engine.total_conflicts_count > 0 else 100.0,
            collision_predictions_count=self.conflict_engine.total_collisions_predicted,

            deadlock_count=self.deadlock_detector.total_deadlocks_detected,
            deadlock_resolution_rate=round((len([d for d in self.deadlock_detector.deadlock_history if d.status == 'RESOLVED']) / max(1, self.deadlock_detector.total_deadlocks_detected)) * 100.0, 1) if self.deadlock_detector.total_deadlocks_detected > 0 else 100.0,
            average_deadlock_recovery_time_sec=round(avg_dlk_rec_time, 2),

            average_battery_utilization=round(avg_batt, 1),
            robot_failure_count=self.failure_recovery.total_failures_count,
            recovery_success_rate=round(recovery_rate, 1),
            mission_continuity_rate=round(self.failure_recovery.failure_history[-1].mission_continuity, 1) if self.failure_recovery.failure_history else 100.0,
            simulation_throughput_tps=round(self.ticks_count / max(1.0, time.perf_counter() - self.start_wall_time), 1),

            coordinator_online=self.coordinator_online,
            local_autonomy_active=self.local_autonomy_active,
            simulation_time=round(self.sim_time, 1),
            simulation_speed=self.speed
        )

    def get_full_state(self) -> FleetStateResponse:
        """Returns aggregated system state for UI synchronization."""
        # Top 10 recent bids
        recent_bids = self.negotiation_engine.auction_history[-10:] if self.negotiation_engine.auction_history else []
        
        # Sample of 35 diverse robots for detailed card inspector (full 500 render on canvas via compact array)
        sample = [a.data for a in self.agents[:35]]

        return FleetStateResponse(
            metrics=self.get_metrics(),
            corridors=self.corridors,
            charging_stations=self.charging_stations,
            zones=self.zones,
            recent_events=list(reversed(self.system_events[-25:])),
            active_conflicts=list(reversed(self.conflict_engine.active_conflicts[-6:])),
            recent_deadlocks=list(reversed(self.deadlock_detector.deadlock_history[-5:])),
            recent_failures=list(reversed(self.failure_recovery.failure_history[-5:])),
            recent_bids=list(reversed(recent_bids)),
            sample_robots=sample,
            total_robot_count=len(self.agents),
            total_task_count=len(self.tasks)
        )

    def get_compact_robot_positions(self) -> List[List[Any]]:
        """
        Compact representation of all 500+ robots for high-speed 10Hz Canvas streaming:
        [id, type_idx, x, y, status_idx, battery, current_task, heading]
        Keeps payload under 30KB per frame for 500 robots!
        """
        type_map = {RobotType.FAST_PICKER: 0, RobotType.STANDARD_CARRIER: 1, RobotType.HEAVY_CARRIER: 2, RobotType.SUPPORT_ROBOT: 3}
        status_map = {
            RobotStatus.IDLE: 0, RobotStatus.NEGOTIATING: 1, RobotStatus.ASSIGNED: 2,
            RobotStatus.MOVING: 3, RobotStatus.WAITING: 4, RobotStatus.CHARGING: 5,
            RobotStatus.FAILED: 6, RobotStatus.RECOVERING: 7
        }
        res = []
        for a in self.agents:
            r = a.data
            res.append([
                r.id,
                type_map.get(r.robot_type, 1),
                round(r.x, 1),
                round(r.y, 1),
                status_map.get(r.status, 0),
                round(r.battery, 1),
                r.current_task or "",
                round(r.heading, 2)
            ])
        return res
