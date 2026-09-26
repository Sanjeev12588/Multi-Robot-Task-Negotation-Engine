import time
from typing import List, Dict, Tuple, Optional
from .models import Robot, RobotStatus, Task, TaskStatus, RobotFailureEvent, SystemEvent
from .robot_agent import RobotAgent
from .negotiation import TaskNegotiationEngine

class FailureRecoveryEngine:
    """
    Failure Injection & Autonomous Mission Recovery Engine.
    Handles hardware dropouts, immediate task unbinding, decentralized rebidding,
    and tracks resilience KPIs (Mission Continuity Rate, Mean Recovery Time).
    """

    def __init__(self):
        self.failure_history: List[RobotFailureEvent] = []
        self.total_failures_count: int = 0
        self.total_tasks_recovered: int = 0
        self.total_recovery_time_sec: float = 0.0

    def trigger_robot_failure(
        self,
        robot_id: str,
        agents_by_id: Dict[str, RobotAgent],
        tasks_by_id: Dict[str, Task],
        negotiation_engine: TaskNegotiationEngine,
        sim_time: float,
        is_coordinator_online: bool = True
    ) -> Tuple[Optional[RobotFailureEvent], List[SystemEvent]]:
        """
        Simulates abrupt robot hardware failure (e.g. drive motor stall, comm dropout).
        Isolates the robot, releases assigned tasks, triggers immediate rebidding across peers.
        """
        if robot_id not in agents_by_id:
            return None, []

        agent = agents_by_id[robot_id]
        agent.data.status = RobotStatus.FAILED
        agent.data.health = 0.0
        agent.data.vx = 0.0
        agent.data.vy = 0.0
        agent.data.planned_path = []
        self.total_failures_count += 1

        # Identify all affected tasks (assigned or in progress)
        affected_tasks: List[Task] = []
        for t in tasks_by_id.values():
            if t.owner_robot_id == robot_id and t.status in [TaskStatus.ASSIGNED, TaskStatus.IN_PROGRESS]:
                affected_tasks.append(t)

        affected_task_ids = [t.id for t in affected_tasks]
        reassigned_task_ids: List[str] = []
        events: List[SystemEvent] = []

        fail_event_sys = SystemEvent(
            id=f"fail_sys_{robot_id}_{int(sim_time)}",
            timestamp=sim_time,
            category="FAILURE",
            message=f"ROBOT FAILURE: {robot_id} OFFLINE ({len(affected_tasks)} tasks affected)",
            severity="ERROR",
            entity_id=robot_id
        )
        events.append(fail_event_sys)

        start_recovery_clock = time.perf_counter()
        # Autonomous Recovery: Re-broadcast and rebidding
        available_agents = [a for a in agents_by_id.values() if a.data.id != robot_id and a.data.status != RobotStatus.FAILED]

        for task in affected_tasks:
            # Release task
            task.owner_robot_id = None
            task.status = TaskStatus.UNASSIGNED
            
            # Conduct distributed re-auction
            winner, bids, bid_evt = negotiation_engine.conduct_auction(
                task,
                available_agents,
                sim_time,
                is_coordinator_online=is_coordinator_online
            )
            if winner is not None:
                reassigned_task_ids.append(task.id)
                self.total_tasks_recovered += 1
                if bid_evt:
                    events.append(bid_evt)

        elapsed_sec = time.perf_counter() - start_recovery_clock
        recovery_time = max(0.05, round(elapsed_sec, 3))
        self.total_recovery_time_sec += recovery_time
        
        continuity = 100.0 if (len(affected_tasks) == 0 or len(reassigned_task_ids) == len(affected_tasks)) else round((len(reassigned_task_ids) / len(affected_tasks) * 100.0), 1)

        record = RobotFailureEvent(
            id=f"rec_{robot_id}_{int(sim_time)}",
            timestamp=sim_time,
            robot_id=robot_id,
            affected_tasks=affected_task_ids,
            reassigned_tasks=reassigned_task_ids,
            recovery_time_sec=recovery_time,
            mission_continuity=round(continuity, 1),
            detail=f"{len(reassigned_task_ids)}/{len(affected_task_ids)} tasks reassigned in {recovery_time:.3f}s. Continuity: {continuity:.1f}%"
        )
        self.failure_history.append(record)

        recover_sys = SystemEvent(
            id=f"rec_sys_{robot_id}_{int(sim_time)}",
            timestamp=sim_time,
            category="FAILURE",
            message=f"RECOVERY COMPLETE: {len(reassigned_task_ids)}/{len(affected_task_ids)} tasks recovered in {recovery_time:.1f}s (Continuity: {continuity:.1f}%)",
            severity="SUCCESS",
            entity_id=robot_id
        )
        events.append(recover_sys)

        return record, events
