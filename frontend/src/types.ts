export type RobotType = 'FAST_PICKER' | 'STANDARD_CARRIER' | 'HEAVY_CARRIER' | 'SUPPORT_ROBOT';

export type RobotStatus = 
  | 'IDLE' 
  | 'NEGOTIATING' 
  | 'ASSIGNED' 
  | 'MOVING' 
  | 'WAITING' 
  | 'CHARGING' 
  | 'FAILED' 
  | 'RECOVERING';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 
  | 'QUEUED' 
  | 'NEGOTIATING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'UNASSIGNED';

export interface Task {
  id: string;
  pickup_x: number;
  pickup_y: number;
  drop_x: number;
  drop_y: number;
  priority: TaskPriority;
  deadline: number;
  payload: number;
  required_capability: string;
  status: TaskStatus;
  owner_robot_id: string | null;
  created_at: number;
  assigned_at?: number | null;
  completed_at?: number | null;
  bids: Record<string, number>;
  bid_reasons: Record<string, string>;
  winning_bid?: number | null;
  winning_reason?: string | null;
}

export interface BidDetail {
  robot_id: string;
  task_id: string;
  score: number;
  capability_score: number;
  priority_fit: number;
  battery_score: number;
  workload_score: number;
  distance_score: number;
  collision_penalty: number;
  deadline_risk: number;
  reason: string;
  timestamp: number;
}

export interface ConflictEvent {
  id: string;
  timestamp: number;
  robot_a: string;
  robot_b: string;
  resource_id?: string | null;
  resource_type?: string | null;
  conflict_type: string;
  eta_seconds: number;
  winner_robot: string;
  loser_robot: string;
  action: string;
  status: string;
  detail: string;
}

export interface DeadlockEvent {
  id: string;
  timestamp: number;
  participants: string[];
  waiting_on: Record<string, string>;
  resource_ids: string[];
  yielding_robot: string;
  resolution_action: string;
  recovery_time_sec: number;
  status: string;
  detail: string;
}

export interface RobotFailureEvent {
  id: string;
  timestamp: number;
  robot_id: string;
  affected_tasks: string[];
  reassigned_tasks: string[];
  recovery_time_sec: number;
  mission_continuity: number;
  detail: string;
}

export interface SystemEvent {
  id: string;
  timestamp: number;
  category: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  entity_id?: string | null;
}

export interface Corridor {
  id: string;
  name: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  width: number;
  reserved_by?: string | null;
  queue: string[];
}

export interface ChargingStation {
  id: string;
  x: number;
  y: number;
  capacity: number;
  occupied_by: string[];
  reserved_by: string[];
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zone_type: string;
}

export interface RobotDetail {
  id: string;
  robot_type: RobotType;
  x: number;
  y: number;
  target_x: number | null;
  target_y: number | null;
  battery: number;
  health: number;
  speed: number;
  capacity: number;
  workload: number;
  current_task: string | null;
  status: RobotStatus;
  capabilities: string[];
  planned_path: [number, number][];
  heading: number;
}

export interface FleetMetrics {
  total_robots: number;
  active_robots: number;
  idle_robots: number;
  charging_robots: number;
  failed_robots: number;
  recovering_robots: number;

  total_tasks: number;
  queued_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  reassigned_tasks_count: number;

  task_allocation_success_rate: number;
  average_allocation_latency_ms: number;

  conflict_count: number;
  conflict_resolution_rate: number;
  collision_predictions_count: number;

  deadlock_count: number;
  deadlock_resolution_rate: number;
  average_deadlock_recovery_time_sec: number;

  average_battery_utilization: number;
  robot_failure_count: number;
  recovery_success_rate: number;
  mission_continuity_rate: number;
  simulation_throughput_tps: number;

  coordinator_online: boolean;
  local_autonomy_active: boolean;
  simulation_time: number;
  simulation_speed: number;
}

export interface CompactRobot {
  id: string;
  type: RobotType;
  x: number;
  y: number;
  status: RobotStatus;
  battery: number;
  current_task: string;
  heading: number;
}
