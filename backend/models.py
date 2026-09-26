from enum import Enum
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

class RobotType(str, Enum):
    FAST_PICKER = "FAST_PICKER"
    STANDARD_CARRIER = "STANDARD_CARRIER"
    HEAVY_CARRIER = "HEAVY_CARRIER"
    SUPPORT_ROBOT = "SUPPORT_ROBOT"

class RobotStatus(str, Enum):
    IDLE = "IDLE"
    NEGOTIATING = "NEGOTIATING"
    ASSIGNED = "ASSIGNED"
    MOVING = "MOVING"
    WAITING = "WAITING"
    CHARGING = "CHARGING"
    FAILED = "FAILED"
    RECOVERING = "RECOVERING"

class TaskPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class TaskStatus(str, Enum):
    QUEUED = "QUEUED"
    NEGOTIATING = "NEGOTIATING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    UNASSIGNED = "UNASSIGNED"

class ResourceType(str, Enum):
    CORRIDOR = "CORRIDOR"
    CHARGING_STATION = "CHARGING_STATION"
    LOADING_ZONE = "LOADING_ZONE"
    INTERSECTION = "INTERSECTION"

class Point(BaseModel):
    x: float
    y: float

class Corridor(BaseModel):
    id: str
    name: str
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    width: float = 8.0
    reserved_by: Optional[str] = None
    queue: List[str] = Field(default_factory=list)

class ChargingStation(BaseModel):
    id: str
    x: float
    y: float
    capacity: int = 1
    occupied_by: List[str] = Field(default_factory=list)
    reserved_by: List[str] = Field(default_factory=list)

class Zone(BaseModel):
    id: str
    name: str
    x: float
    y: float
    width: float
    height: float
    zone_type: str = "STORAGE"  # STORAGE, PICKING, PACKING, CHARGING, DOCK

class Task(BaseModel):
    id: str
    pickup_x: float
    pickup_y: float
    drop_x: float
    drop_y: float
    priority: TaskPriority
    deadline: float  # simulation timestamp in seconds
    payload: float   # kg
    required_capability: str
    status: TaskStatus = TaskStatus.QUEUED
    owner_robot_id: Optional[str] = None
    created_at: float = 0.0
    assigned_at: Optional[float] = None
    completed_at: Optional[float] = None
    bids: Dict[str, float] = Field(default_factory=dict)
    bid_reasons: Dict[str, str] = Field(default_factory=dict)
    winning_bid: Optional[float] = None
    winning_reason: Optional[str] = None

class BidDetail(BaseModel):
    robot_id: str
    task_id: str
    score: float
    capability_score: float
    priority_fit: float
    battery_score: float
    workload_score: float
    distance_score: float
    collision_penalty: float
    deadline_risk: float
    reason: str
    timestamp: float

class ConflictEvent(BaseModel):
    id: str
    timestamp: float
    robot_a: str
    robot_b: str
    resource_id: Optional[str] = None
    resource_type: Optional[str] = None
    conflict_type: str  # CORRIDOR_CONTENTION, INTERSECTION_CROSS, COLLISION_PREDICTED
    eta_seconds: float = 0.0
    winner_robot: str
    loser_robot: str
    action: str  # e.g., "R87 WAIT", "R43 REROUTE"
    status: str = "RESOLVED"  # PREDICTED, ACTIVE, RESOLVED
    detail: str = ""

class DeadlockEvent(BaseModel):
    id: str
    timestamp: float
    participants: List[str]
    waiting_on: Dict[str, str]  # robot_id -> blocked_by_robot_id
    resource_ids: List[str]
    yielding_robot: str
    resolution_action: str
    recovery_time_sec: float
    status: str = "RESOLVED"
    detail: str = ""

class RobotFailureEvent(BaseModel):
    id: str
    timestamp: float
    robot_id: str
    affected_tasks: List[str]
    reassigned_tasks: List[str]
    recovery_time_sec: float
    mission_continuity: float = 100.0  # percentage
    detail: str = ""

class SystemEvent(BaseModel):
    id: str
    timestamp: float
    category: str  # AUCTION, CONFLICT, DEADLOCK, BATTERY, FAILURE, COORDINATOR
    message: str
    severity: str = "INFO"  # INFO, WARNING, ERROR, SUCCESS
    entity_id: Optional[str] = None

class Robot(BaseModel):
    id: str
    robot_type: RobotType
    x: float
    y: float
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    battery: float = 100.0  # 0 to 100%
    health: float = 100.0   # 0 to 100%
    speed: float = 3.0      # m/s
    capacity: float = 100.0 # kg
    workload: int = 0       # tasks in queue
    current_task: Optional[str] = None
    status: RobotStatus = RobotStatus.IDLE
    capabilities: List[str] = Field(default_factory=list)
    local_knowledge: Dict[str, Any] = Field(default_factory=dict)
    planned_path: List[Tuple[float, float]] = Field(default_factory=list)
    heading: float = 0.0    # radians
    vx: float = 0.0
    vy: float = 0.0
    wait_time_remaining: float = 0.0
    waiting_for_robot: Optional[str] = None
    reserved_resource: Optional[str] = None

class FleetMetrics(BaseModel):
    total_robots: int = 500
    active_robots: int = 0
    idle_robots: int = 0
    charging_robots: int = 0
    failed_robots: int = 0
    recovering_robots: int = 0
    
    total_tasks: int = 200
    queued_tasks: int = 0
    active_tasks: int = 0
    completed_tasks: int = 0
    reassigned_tasks_count: int = 0
    
    task_allocation_success_rate: float = 100.0
    average_allocation_latency_ms: float = 85.0
    
    conflict_count: int = 0
    conflict_resolution_rate: float = 100.0
    collision_predictions_count: int = 0
    
    deadlock_count: int = 0
    deadlock_resolution_rate: float = 100.0
    average_deadlock_recovery_time_sec: float = 1.8
    
    average_battery_utilization: float = 84.5
    robot_failure_count: int = 0
    recovery_success_rate: float = 100.0
    mission_continuity_rate: float = 100.0
    simulation_throughput_tps: float = 12.4
    
    coordinator_online: bool = True
    local_autonomy_active: bool = False
    simulation_time: float = 0.0
    simulation_speed: float = 1.0

class FleetStateResponse(BaseModel):
    metrics: FleetMetrics
    corridors: List[Corridor]
    charging_stations: List[ChargingStation]
    zones: List[Zone]
    recent_events: List[SystemEvent]
    active_conflicts: List[ConflictEvent]
    recent_deadlocks: List[DeadlockEvent]
    recent_failures: List[RobotFailureEvent]
    recent_bids: List[BidDetail]
    sample_robots: List[Robot]  # representative subset for detailed inspection if needed
    total_robot_count: int
    total_task_count: int
