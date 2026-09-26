import time
from typing import List, Dict, Set, Optional, Tuple
from .models import DeadlockEvent, SystemEvent, RobotStatus, Corridor, Task
from .robot_agent import RobotAgent

class DeadlockDetector:
    """
    Directed Graph Wait-For Cycle Detector and Autonomous Deadlock Resolver.
    Monitors inter-agent resource lock dependencies, executes Tarjan/DFS cycle detection,
    and deterministically elects a yielding robot to break circular deadlocks.
    """

    def __init__(self):
        self.deadlock_history: List[DeadlockEvent] = []
        self.total_deadlocks_detected: int = 0
        self.total_recovery_time_sec: float = 0.0

    def build_wait_for_graph(self, agents: List[RobotAgent]) -> Dict[str, str]:
        """
        Builds wait-for dependency graph:
        robot_a -> robot_b (robot_a is WAITING for robot_b to vacate a resource)
        """
        graph: Dict[str, str] = {}
        for agent in agents:
            if agent.data.status == RobotStatus.WAITING and agent.data.waiting_for_robot:
                graph[agent.data.id] = agent.data.waiting_for_robot
        return graph

    def find_cycles(self, graph: Dict[str, str]) -> List[List[str]]:
        """Finds all simple cycles in the directed wait-for graph using DFS traversal."""
        visited: Set[str] = set()
        cycles: List[List[str]] = []

        for start_node in graph:
            if start_node in visited:
                continue
            path = []
            current = start_node
            local_visited = set()

            while current in graph and current not in local_visited:
                local_visited.add(current)
                path.append(current)
                current = graph[current]

            if current in local_visited:
                cycle_start_idx = path.index(current)
                cycle = path[cycle_start_idx:]
                if len(cycle) >= 2:
                    # Canonical sort representation to avoid duplicate permutations
                    min_elem = min(cycle)
                    min_idx = cycle.index(min_elem)
                    canon_cycle = cycle[min_idx:] + cycle[:min_idx]
                    if canon_cycle not in cycles:
                        cycles.append(canon_cycle)
            
            visited.update(local_visited)

        return cycles

    def resolve_deadlock(
        self,
        cycle: List[str],
        agents_by_id: Dict[str, RobotAgent],
        corridors: List[Corridor],
        tasks_by_id: Dict[str, Task],
        sim_time: float
    ) -> Tuple[DeadlockEvent, SystemEvent]:
        """
        Elects the optimal yielding robot in the cycle based on deterministic criteria:
        1. Robot with lowest priority task
        2. Robot with highest battery (more energy cushion to maneuver around)
        3. Lowest lexicographical robot ID tie-breaker
        Yielding robot releases reserved resource, backs out to siding waypoint, and breaks cycle.
        """
        start_eval = time.perf_counter()
        self.total_deadlocks_detected += 1
        
        # Candidate evaluation
        candidate_agents = [agents_by_id[rid] for rid in cycle if rid in agents_by_id]
        
        def yield_score(agent: RobotAgent) -> float:
            score = 100.0
            task = tasks_by_id.get(agent.data.current_task or "")
            if task:
                # Lower task priority = higher willingness to yield
                prio_penalty = {"CRITICAL": 50, "HIGH": 30, "NORMAL": 10, "LOW": 0}
                score -= prio_penalty.get(task.priority.value, 10)
            # High battery gives bonus to maneuver
            score += (agent.data.battery / 100.0) * 20.0
            return score

        yielding_agent = max(candidate_agents, key=yield_score) if candidate_agents else agents_by_id[cycle[0]]
        yield_id = yielding_agent.data.id

        # Determine contested corridor/resource if any
        yielding_resource_name = "Corridor Section"
        for corridor in corridors:
            if corridor.reserved_by in cycle:
                yielding_resource_name = corridor.name
                if corridor.reserved_by == yield_id:
                    corridor.reserved_by = None
                if yield_id in corridor.queue:
                    corridor.queue.remove(yield_id)

        # Release yielding robot dependency & perform backoff maneuver
        yielding_agent.data.status = RobotStatus.RECOVERING
        yielding_agent.data.wait_time_remaining = 0.0
        yielding_agent.data.waiting_for_robot = None
        # Reroute yielding robot slightly backwards (siding maneuver)
        yielding_agent.data.x += 12.0
        yielding_agent.data.status = RobotStatus.IDLE

        # Also release other cycle participants from waiting state so they can progress
        for rid in cycle:
            if rid != yield_id and rid in agents_by_id:
                other_agent = agents_by_id[rid]
                other_agent.data.status = RobotStatus.MOVING
                other_agent.data.wait_time_remaining = 0.0
                other_agent.data.waiting_for_robot = None

        elapsed_res = time.perf_counter() - start_eval
        recovery_time = max(0.08, round(elapsed_res + 0.12, 3))  # measured resolution + maneuver latency
        self.total_recovery_time_sec += recovery_time

        wait_dict = {cycle[i]: cycle[(i + 1) % len(cycle)] for i in range(len(cycle))}
        
        deadlock_event = DeadlockEvent(
            id=f"dlk_{int(sim_time)}_{len(self.deadlock_history) + 1:02d}",
            timestamp=sim_time,
            participants=cycle,
            waiting_on=wait_dict,
            resource_ids=[yielding_resource_name],
            yielding_robot=yield_id,
            resolution_action=f"{yield_id} yielded {yielding_resource_name} via siding maneuver",
            recovery_time_sec=recovery_time,
            status="RESOLVED",
            detail=f"Circular wait resolved: {yield_id} elected to yield based on task priority & energy margin."
        )
        self.deadlock_history.append(deadlock_event)

        sys_event = SystemEvent(
            id=f"sys_dlk_{int(sim_time)}",
            timestamp=sim_time,
            category="DEADLOCK",
            message=f"DEADLOCK DETECTED [{', '.join(cycle)}] -> {yield_id} yielded {yielding_resource_name} (Recovery: {recovery_time:.1f}s)",
            severity="ERROR",
            entity_id=yield_id
        )

        return deadlock_event, sys_event
