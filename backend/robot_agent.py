import math
import random
from typing import Dict, List, Optional, Tuple, Any
from .models import Robot, RobotType, RobotStatus, Task, TaskPriority, BidDetail

class RobotAgent:
    """
    Decentralized Autonomous Mobile Robot (AMR) Agent.
    Implements local observation, auction bidding, resource negotiation,
    predictive collision detection, wait-dependency tracking, and battery protection.
    """

    def __init__(self, robot: Robot, comm_radius: float = 120.0):
        self.data = robot
        self.comm_radius = comm_radius
        self.local_peers: Dict[str, Tuple[float, float, float]] = {}  # peer_id -> (x, y, heading)
        self.local_resource_locks: Dict[str, str] = {}  # resource_id -> holder_robot_id
        self.assigned_task_obj: Optional[Task] = None

    @classmethod
    def create(cls, robot_id: str, robot_type: RobotType, x: float, y: float, comm_radius: float = 120.0) -> 'RobotAgent':
        capabilities_map = {
            RobotType.FAST_PICKER: ["FAST_PICK", "LIGHT_PAYLOAD", "STANDARD_TRANSPORT"],
            RobotType.STANDARD_CARRIER: ["STANDARD_TRANSPORT", "MEDIUM_PAYLOAD", "PALLET_MOVE"],
            RobotType.HEAVY_CARRIER: ["HEAVY_TRANSPORT", "BULK_PAYLOAD", "PALLET_MOVE", "CONTAINER_LIFT"],
            RobotType.SUPPORT_ROBOT: ["MAINTENANCE", "FAST_PICK", "LIGHT_PAYLOAD", "BATTERY_TENDER"]
        }
        
        speed_map = {
            RobotType.FAST_PICKER: 4.2,
            RobotType.STANDARD_CARRIER: 2.8,
            RobotType.HEAVY_CARRIER: 1.6,
            RobotType.SUPPORT_ROBOT: 3.2
        }
        
        capacity_map = {
            RobotType.FAST_PICKER: 40.0,
            RobotType.STANDARD_CARRIER: 180.0,
            RobotType.HEAVY_CARRIER: 650.0,
            RobotType.SUPPORT_ROBOT: 80.0
        }

        robot = Robot(
            id=robot_id,
            robot_type=robot_type,
            x=x,
            y=y,
            battery=random.uniform(70.0, 100.0),
            health=100.0,
            speed=speed_map[robot_type],
            capacity=capacity_map[robot_type],
            capabilities=capabilities_map[robot_type],
            status=RobotStatus.IDLE
        )
        return cls(robot, comm_radius)

    def observe(self, all_robots: List[Robot], visible_resources: Dict[str, str]) -> None:
        """
        Incomplete Information Model:
        Observe only robots within communication radius (default 120m).
        Does NOT have access to global map state.
        """
        self.local_peers.clear()
        for r in all_robots:
            if r.id == self.data.id or r.status == RobotStatus.FAILED:
                continue
            dist = math.hypot(r.x - self.data.x, r.y - self.data.y)
            if dist <= self.comm_radius:
                self.local_peers[r.id] = (r.x, r.y, r.heading)
        
        self.local_resource_locks = visible_resources.copy()

    def evaluate_task(self, task: Task) -> Tuple[bool, str]:
        """Check capability, payload capacity, and battery viability."""
        if self.data.status in [RobotStatus.FAILED, RobotStatus.CHARGING]:
            return False, f"Robot is in {self.data.status} status"
        
        if self.data.battery < 20.0:
            return False, f"Battery critically low ({self.data.battery:.1f}%), needs charging"

        if task.payload > self.data.capacity:
            return False, f"Payload {task.payload}kg exceeds capacity {self.data.capacity}kg"

        if task.required_capability and task.required_capability not in self.data.capabilities:
            return False, f"Missing capability '{task.required_capability}'"

        # Energy margin check
        est_energy = self.estimate_task_energy(task)
        if (self.data.battery - est_energy) < 15.0:
            return False, f"Insufficient energy margin (needs {est_energy:.1f}%, has {self.data.battery:.1f}%)"

        return True, "Eligible"

    def estimate_task_energy(self, task: Task) -> float:
        """
        Estimate battery consumption required to complete pickup and delivery.
        Considers distance, payload weight factor, and robot type base drain.
        """
        dist_to_pickup = math.hypot(task.pickup_x - self.data.x, task.pickup_y - self.data.y)
        dist_pickup_to_drop = math.hypot(task.drop_x - task.pickup_x, task.drop_y - task.pickup_y)
        total_dist = dist_to_pickup + dist_pickup_to_drop
        
        drain_rate_per_meter = {
            RobotType.FAST_PICKER: 0.012,
            RobotType.STANDARD_CARRIER: 0.015,
            RobotType.HEAVY_CARRIER: 0.022,
            RobotType.SUPPORT_ROBOT: 0.013
        }[self.data.robot_type]
        
        weight_factor = 1.0 + (task.payload / max(1.0, self.data.capacity)) * 0.4
        return (total_dist * drain_rate_per_meter * weight_factor)

    def calculate_bid(self, task: Task, sim_time: float) -> Optional[BidDetail]:
        """
        Multi-factor decentralized bid calculation:
        bid_score = capability_score + priority_fit + battery_score + workload_score + distance_score - collision_penalty - deadline_risk
        """
        eligible, reason = self.evaluate_task(task)
        if not eligible:
            return None

        # 1. Capability Score (0 to 25)
        # Bonus for specialized match rather than over-allocating heavy carrier to tiny payload
        cap_ratio = min(1.0, task.payload / max(1.0, self.data.capacity))
        capability_score = 15.0 + (10.0 * cap_ratio)
        if self.data.robot_type == RobotType.FAST_PICKER and task.payload < 30.0:
            capability_score += 5.0

        # 2. Priority Fit (0 to 20)
        priority_multipliers = {
            TaskPriority.LOW: 5.0,
            TaskPriority.NORMAL: 10.0,
            TaskPriority.HIGH: 16.0,
            TaskPriority.CRITICAL: 20.0
        }
        priority_fit = priority_multipliers.get(task.priority, 10.0)

        # 3. Battery Score (0 to 25)
        est_energy = self.estimate_task_energy(task)
        remaining_battery = self.data.battery - est_energy
        battery_score = max(0.0, min(25.0, (remaining_battery / 100.0) * 25.0))

        # 4. Workload Score (0 to 15)
        # Fewer existing tasks = higher availability
        workload_score = max(0.0, 15.0 - (self.data.workload * 5.0))
        if self.data.status == RobotStatus.IDLE:
            workload_score += 5.0

        # 5. Distance Score (0 to 20)
        dist_pickup = math.hypot(task.pickup_x - self.data.x, task.pickup_y - self.data.y)
        # Normalize distance (typical warehouse 0-500m)
        distance_score = max(0.0, 20.0 * (1.0 - min(1.0, dist_pickup / 400.0)))

        # 6. Collision Penalty (0 to 10)
        # Estimate congestion near pickup zone based on local peers
        nearby_peers_count = 0
        for peer_id, (px, py, _) in self.local_peers.items():
            if math.hypot(px - task.pickup_x, py - task.pickup_y) < 25.0:
                nearby_peers_count += 1
        collision_penalty = min(10.0, nearby_peers_count * 2.5)

        # 7. Deadline Risk (0 to 15)
        est_travel_time = (dist_pickup + math.hypot(task.drop_x - task.pickup_x, task.drop_y - task.pickup_y)) / max(0.5, self.data.speed)
        time_to_deadline = task.deadline - sim_time
        if time_to_deadline <= 0:
            deadline_risk = 15.0
        elif est_travel_time > time_to_deadline:
            deadline_risk = 12.0
        else:
            deadline_risk = max(0.0, 10.0 * (est_travel_time / max(1.0, time_to_deadline)))

        total_score = (
            capability_score +
            priority_fit +
            battery_score +
            workload_score +
            distance_score -
            collision_penalty -
            deadline_risk
        )
        total_score = max(1.0, round(total_score, 1))

        justification = (
            f"Cap:{capability_score:.1f}, Batt:{battery_score:.1f}, Dist:{distance_score:.1f}, "
            f"Prio:{priority_fit:.1f}, CongestPen:-{collision_penalty:.1f}"
        )

        return BidDetail(
            robot_id=self.data.id,
            task_id=task.id,
            score=total_score,
            capability_score=round(capability_score, 1),
            priority_fit=round(priority_fit, 1),
            battery_score=round(battery_score, 1),
            workload_score=round(workload_score, 1),
            distance_score=round(distance_score, 1),
            collision_penalty=round(collision_penalty, 1),
            deadline_risk=round(deadline_risk, 1),
            reason=justification,
            timestamp=sim_time
        )

    def plan_path_to(self, target_x: float, target_y: float) -> None:
        """Sets target coordinates and basic straight-line path with intermediate waypoints."""
        self.data.target_x = target_x
        self.data.target_y = target_y
        
        # Calculate heading
        dx = target_x - self.data.x
        dy = target_y - self.data.y
        dist = math.hypot(dx, dy)
        if dist > 0.1:
            self.data.heading = math.atan2(dy, dx)
            self.data.vx = (dx / dist) * self.data.speed
            self.data.vy = (dy / dist) * self.data.speed
        else:
            self.data.vx = 0.0
            self.data.vy = 0.0
            
        # Planned path waypoints
        steps = max(2, int(dist / 40.0))
        self.data.planned_path = [
            (self.data.x + (dx * i / steps), self.data.y + (dy * i / steps))
            for i in range(1, steps + 1)
        ]
        self.data.status = RobotStatus.MOVING

    def step_motion(self, dt: float) -> None:
        """Step robot motion forward by dt seconds."""
        if self.data.status in [RobotStatus.FAILED, RobotStatus.WAITING]:
            self.data.vx = 0.0
            self.data.vy = 0.0
            if self.data.status == RobotStatus.WAITING:
                self.data.wait_time_remaining = max(0.0, self.data.wait_time_remaining - dt)
                if self.data.wait_time_remaining <= 0.0:
                    self.data.status = RobotStatus.MOVING
                    self.data.waiting_for_robot = None
            return

        if self.data.status == RobotStatus.CHARGING:
            self.data.battery = min(100.0, self.data.battery + 2.5 * dt)
            if self.data.battery >= 95.0:
                self.data.status = RobotStatus.IDLE
                self.data.target_x = None
                self.data.target_y = None
            return

        if self.data.target_x is None or self.data.target_y is None:
            self.data.status = RobotStatus.IDLE
            self.data.vx = 0.0
            self.data.vy = 0.0
            return

        dx = self.data.target_x - self.data.x
        dy = self.data.target_y - self.data.y
        dist = math.hypot(dx, dy)

        step_dist = self.data.speed * dt
        if dist <= step_dist:
            self.data.x = self.data.target_x
            self.data.y = self.data.target_y
            self.data.vx = 0.0
            self.data.vy = 0.0
            self.data.planned_path = []
        else:
            self.data.heading = math.atan2(dy, dx)
            self.data.vx = (dx / dist) * self.data.speed
            self.data.vy = (dy / dist) * self.data.speed
            self.data.x += self.data.vx * dt
            self.data.y += self.data.vy * dt

        # Natural battery consumption during movement
        base_drain = 0.015 * dt
        self.data.battery = max(0.0, self.data.battery - base_drain)
