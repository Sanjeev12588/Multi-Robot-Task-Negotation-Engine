import { FleetStateResponse, RobotDetail, Task, FleetMetrics, BidDetail } from '../types';

const API_BASE = 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error ${res.status}: ${errText}`);
  }
  return res.json();
}

export const api = {
  async getState(): Promise<FleetStateResponse> {
    const res = await fetch(`${API_BASE}/api/state`);
    return handleResponse<FleetStateResponse>(res);
  },

  async getRobots(limit: number = 500): Promise<RobotDetail[]> {
    const res = await fetch(`${API_BASE}/api/robots?limit=${limit}`);
    return handleResponse<RobotDetail[]>(res);
  },

  async getTasks(limit: number = 200): Promise<Task[]> {
    const res = await fetch(`${API_BASE}/api/tasks?limit=${limit}`);
    return handleResponse<Task[]>(res);
  },

  async createTask(data: {
    priority: string;
    pickup_x: number;
    pickup_y: number;
    drop_x: number;
    drop_y: number;
    payload: number;
    required_capability: string;
    deadline?: number;
  }): Promise<{
    status: string;
    task: Task;
    winner: string | null;
    bids: BidDetail[];
    event: any;
  }> {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMetrics(): Promise<FleetMetrics> {
    const res = await fetch(`${API_BASE}/api/metrics`);
    return handleResponse<FleetMetrics>(res);
  },

  async startSimulation(): Promise<{ status: string; sim_time: number }> {
    const res = await fetch(`${API_BASE}/api/simulation/start`, { method: 'POST' });
    return handleResponse(res);
  },

  async stopSimulation(): Promise<{ status: string; sim_time: number }> {
    const res = await fetch(`${API_BASE}/api/simulation/stop`, { method: 'POST' });
    return handleResponse(res);
  },

  async resetSimulation(numRobots = 500, numTasks = 200): Promise<{ status: string; num_robots: number; num_tasks: number }> {
    const res = await fetch(`${API_BASE}/api/simulation/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_robots: numRobots, num_tasks: numTasks }),
    });
    return handleResponse(res);
  },

  async triggerEmergencySurge(): Promise<{ status: string; task_count: number; tasks: Task[] }> {
    const res = await fetch(`${API_BASE}/api/scenario/emergency-surge`, { method: 'POST' });
    return handleResponse(res);
  },

  async triggerCorridorConflict(): Promise<{ status: string; conflict: any }> {
    const res = await fetch(`${API_BASE}/api/scenario/conflict`, { method: 'POST' });
    return handleResponse(res);
  },

  async triggerDeadlock(): Promise<{ status: string; deadlock: any }> {
    const res = await fetch(`${API_BASE}/api/scenario/deadlock`, { method: 'POST' });
    return handleResponse(res);
  },

  async drainBattery(robotId: string, battery: number = 17.0): Promise<{ status: string; robot_id: string; battery: number }> {
    const res = await fetch(`${API_BASE}/api/battery/drain/${robotId}?battery=${battery}`, { method: 'POST' });
    return handleResponse(res);
  },

  async failRobot(robotId: string): Promise<{ status: string; record: any }> {
    const res = await fetch(`${API_BASE}/api/failure/robot/${robotId}`, { method: 'POST' });
    return handleResponse(res);
  },

  async toggleCoordinatorFailure(): Promise<{ coordinator_online: boolean; local_autonomy_active: boolean; status: string }> {
    const res = await fetch(`${API_BASE}/api/failure/coordinator`, { method: 'POST' });
    return handleResponse(res);
  },

  async reassignTask(taskId: string): Promise<{ status: string; task_id: string; new_owner: string | null }> {
    const res = await fetch(`${API_BASE}/api/task/${taskId}/reassign`, { method: 'POST' });
    return handleResponse(res);
  },
};
