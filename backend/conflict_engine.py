import math
from typing import List, Dict, Tuple, Optional
from .models import Robot, Corridor, ConflictEvent, SystemEvent, RobotStatus, TaskPriority, Task
from .robot_agent import RobotAgent

class ConflictEngine:
    """
    Shared Resource Arbiter & Predictive Collision Avoidance System.
    Predicts trajectory conflicts, enforces right-of-way priority rules,
    and manages exclusive corridor reservations.
    """

    def __init__(self, safety_threshold: float = 6.0, prediction_horizon: float = 4.0):
        self.safety_threshold = safety_threshold
        self.prediction_horizon = prediction_horizon
        self.active_conflicts: List[ConflictEvent] = []
        self.conflict_history: List[ConflictEvent] = []
        self.total_conflicts_count: int = 0
        self.total_collisions_predicted: int = 0

    def check_corridor_reservation(
        self,
        agent: RobotAgent,
        corridor: Corridor,
        sim_time: float,
        task: Optional[Task] = None
    ) -> Tuple[bool, Optional[ConflictEvent]]:
        """
        Arbitrate single-lane narrow corridor access.
        If corridor is reserved by another robot, compare priority, battery, and timestamp.
        """
        if corridor.reserved_by is None or corridor.reserved_by == agent.data.id:
            corridor.reserved_by = agent.data.id
            agent.data.reserved_resource = corridor.id
            return True, None

        # Contention detected with current holder
        holder_id = corridor.reserved_by
        if holder_id == agent.data.id:
            return True, None

        # Contention: calculate right-of-way
        # New requester vs Current holder
        # Default: holder keeps it unless requester is CRITICAL priority or emergency battery
        requester_priority = task.priority if task else TaskPriority.NORMAL
        
        is_requester_winner = False
        if requester_priority == TaskPriority.CRITICAL:
            is_requester_winner = True
        elif agent.data.battery < 15.0:
            is_requester_winner = True

        if is_requester_winner:
            winner = agent.data.id
            loser = holder_id
            action = f"{loser} WAIT_YIELD"
            corridor.reserved_by = agent.data.id
            agent.data.reserved_resource = corridor.id
        else:
            winner = holder_id
            loser = agent.data.id
            action = f"{loser} WAIT"
            if agent.data.id not in corridor.queue:
                corridor.queue.append(agent.data.id)
            agent.data.status = RobotStatus.WAITING
            agent.data.wait_time_remaining = 3.0
            agent.data.waiting_for_robot = holder_id

        self.total_conflicts_count += 1
        conflict_event = ConflictEvent(
            id=f"res_conf_{corridor.id}_{int(sim_time * 10)}",
            timestamp=sim_time,
            robot_a=holder_id,
            robot_b=agent.data.id,
            resource_id=corridor.id,
            resource_type="CORRIDOR",
            conflict_type="CORRIDOR_CONTENTION",
            eta_seconds=1.5,
            winner_robot=winner,
            loser_robot=loser,
            action=action,
            status="RESOLVED",
            detail=f"Resource {corridor.name} contested; {winner} awarded right-of-way over {loser}"
        )
        self.active_conflicts.append(conflict_event)
        self.conflict_history.append(conflict_event)
        return is_requester_winner, conflict_event

    def predict_inter_robot_collisions(
        self,
        agents: List[RobotAgent],
        sim_time: float,
        tasks_by_id: Dict[str, Task]
    ) -> List[Tuple[ConflictEvent, SystemEvent]]:
        """
        Predicts future positions across 1.0s, 2.0s, 3.5s horizons.
        If predicted separation < safety_threshold, evaluates right-of-way and yields the loser.
        """
        detected: List[Tuple[ConflictEvent, SystemEvent]] = []
        moving_agents = [a for a in agents if a.data.status == RobotStatus.MOVING and (a.data.vx != 0 or a.data.vy != 0)]
        
        # Check pairwise in local vicinity (spatial partitioning or proximity filter)
        checked_pairs = set()
        for i, agent_a in enumerate(moving_agents):
            ra = agent_a.data
            for j in range(i + 1, len(moving_agents)):
                agent_b = moving_agents[j]
                rb = agent_b.data

                # Quick bounding box distance check
                if abs(ra.x - rb.x) > 35.0 or abs(ra.y - rb.y) > 35.0:
                    continue

                pair_key = tuple(sorted([ra.id, rb.id]))
                if pair_key in checked_pairs:
                    continue
                checked_pairs.add(pair_key)

                # Horizon projections at dt = 1.0, 2.0, 3.2 seconds
                for dt in [1.0, 2.0, 3.2]:
                    future_xa = ra.x + ra.vx * dt
                    future_ya = ra.y + ra.vy * dt
                    future_xb = rb.x + rb.vx * dt
                    future_yb = rb.y + rb.vy * dt

                    sep = math.hypot(future_xa - future_xb, future_ya - future_yb)
                    if sep < self.safety_threshold:
                        # Collision predicted!
                        self.total_collisions_predicted += 1
                        self.total_conflicts_count += 1
                        
                        # Right-of-Way arbitration:
                        # 1. Compare task priority
                        task_a = tasks_by_id.get(ra.current_task or "")
                        task_b = tasks_by_id.get(rb.current_task or "")
                        prio_a = task_a.priority if task_a else TaskPriority.NORMAL
                        prio_b = task_b.priority if task_b else TaskPriority.NORMAL
                        
                        prio_order = {TaskPriority.LOW: 1, TaskPriority.NORMAL: 2, TaskPriority.HIGH: 3, TaskPriority.CRITICAL: 4}
                        
                        if prio_order[prio_a] > prio_order[prio_b]:
                            winner, loser = agent_a, agent_b
                        elif prio_order[prio_b] > prio_order[prio_a]:
                            winner, loser = agent_b, agent_a
                        elif ra.battery < 20.0 and rb.battery >= 20.0:
                            winner, loser = agent_a, agent_b  # Low battery gets right of way to avoid stranding
                        elif rb.battery < 20.0 and ra.battery >= 20.0:
                            winner, loser = agent_b, agent_a
                        elif ra.capacity > rb.capacity:
                            winner, loser = agent_a, agent_b  # Heavier carrier keeps momentum
                        elif rb.capacity > ra.capacity:
                            winner, loser = agent_b, agent_a
                        else:
                            # Deterministic tie-breaker
                            winner, loser = (agent_a, agent_b) if ra.id < rb.id else (agent_b, agent_a)

                        # Enforce yield action
                        loser.data.status = RobotStatus.WAITING
                        loser.data.wait_time_remaining = 2.5
                        loser.data.waiting_for_robot = winner.data.id

                        conf_evt = ConflictEvent(
                            id=f"col_pred_{ra.id}_{rb.id}_{int(sim_time)}",
                            timestamp=sim_time,
                            robot_a=ra.id,
                            robot_b=rb.id,
                            conflict_type="COLLISION_PREDICTED",
                            eta_seconds=round(dt, 1),
                            winner_robot=winner.data.id,
                            loser_robot=loser.data.id,
                            action=f"{loser.data.id} WAIT",
                            status="RESOLVED",
                            detail=f"Predicted sep {sep:.1f}m at ETA {dt:.1f}s. {loser.data.id} yielding right-of-way to {winner.data.id}."
                        )
                        
                        sys_evt = SystemEvent(
                            id=f"sys_col_{ra.id}_{rb.id}_{int(sim_time)}",
                            timestamp=sim_time,
                            category="CONFLICT",
                            message=f"COLLISION PREDICTED: {ra.id} <-> {rb.id} (ETA: {dt:.1f}s) -> Action: {loser.data.id} WAIT",
                            severity="WARNING",
                            entity_id=winner.data.id
                        )

                        self.active_conflicts.append(conf_evt)
                        self.conflict_history.append(conf_evt)
                        detected.append((conf_evt, sys_evt))
                        break  # Handled for this pair

        # Keep active list manageable
        if len(self.active_conflicts) > 8:
            self.active_conflicts = self.active_conflicts[-8:]

        return detected
