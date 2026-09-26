from typing import List, Tuple, Optional, Dict
from .models import Robot, RobotStatus, Task, TaskStatus, ChargingStation, SystemEvent
from .robot_agent import RobotAgent

class BatteryScheduler:
    """
    Battery-Aware Scheduling & Opportunistic Recharging System.
    Monitors state of charge across the 500+ AMR fleet, enforces energy envelopes,
    triggers proactive task unassignment when charge drops below safety threshold,
    and routes depleted robots to closest available charging pads.
    """

    def __init__(self):
        self.reassignments_count: int = 0

    def inspect_and_schedule(
        self,
        agents: List[RobotAgent],
        charging_stations: List[ChargingStation],
        tasks_by_id: Dict[str, Task],
        sim_time: float
    ) -> Tuple[List[str], List[SystemEvent]]:
        """
        Evaluates battery levels for all active robots.
        Returns list of task IDs that must be unassigned/re-bid due to battery depletion.
        """
        reassign_task_ids: List[str] = []
        events: List[SystemEvent] = []

        for agent in agents:
            robot = agent.data
            if robot.status == RobotStatus.FAILED:
                continue

            # Critical battery safety threshold (< 20%)
            if robot.battery < 20.0 and robot.status in [RobotStatus.ASSIGNED, RobotStatus.MOVING]:
                if robot.current_task and robot.current_task in tasks_by_id:
                    task = tasks_by_id[robot.current_task]
                    est_energy = agent.estimate_task_energy(task)
                    
                    if (robot.battery - est_energy) < 10.0:
                        # Cannot safely complete mission: Unassign and route to charger
                        reassign_task_ids.append(task.id)
                        self.reassignments_count += 1
                        
                        task.status = TaskStatus.UNASSIGNED
                        task.owner_robot_id = None
                        robot.current_task = None
                        robot.workload = max(0, robot.workload - 1)
                        agent.assigned_task_obj = None

                        evt = SystemEvent(
                            id=f"batt_reassign_{robot.id}_{int(sim_time)}",
                            timestamp=sim_time,
                            category="BATTERY",
                            message=f"{robot.id} Batt: {robot.battery:.1f}%, Est: {est_energy:.1f}% -> Decision: REASSIGN (insufficient energy margin)",
                            severity="WARNING",
                            entity_id=robot.id
                        )
                        events.append(evt)

            # Return to charge if critically depleted or idle with low battery
            if (robot.battery < 15.0 or (robot.battery < 30.0 and robot.status == RobotStatus.IDLE)) and robot.status != RobotStatus.CHARGING:
                nearest_charger = self.find_nearest_available_charger(robot.x, robot.y, charging_stations)
                if nearest_charger:
                    robot.status = RobotStatus.MOVING
                    agent.plan_path_to(nearest_charger.x, nearest_charger.y)
                    # Check arrival at charger
                    dist_to_charger = ((robot.x - nearest_charger.x)**2 + (robot.y - nearest_charger.y)**2)**0.5
                    if dist_to_charger < 5.0:
                        robot.status = RobotStatus.CHARGING
                        if robot.id not in nearest_charger.occupied_by:
                            nearest_charger.occupied_by.append(robot.id)

        return reassign_task_ids, events

    def find_nearest_available_charger(
        self,
        rx: float,
        ry: float,
        charging_stations: List[ChargingStation]
    ) -> Optional[ChargingStation]:
        """Finds closest charging station with open capacity."""
        available = [cs for cs in charging_stations if len(cs.occupied_by) < cs.capacity]
        if not available:
            # Fallback to least loaded
            return min(charging_stations, key=lambda cs: len(cs.occupied_by)) if charging_stations else None
        
        return min(available, key=lambda cs: (cs.x - rx)**2 + (cs.y - ry)**2)
