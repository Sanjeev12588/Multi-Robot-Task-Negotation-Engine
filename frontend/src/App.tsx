import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FleetMetrics, Corridor, ChargingStation, Zone, ConflictEvent,
  DeadlockEvent, RobotFailureEvent, BidDetail, SystemEvent
} from './types';
import { FleetMap } from './components/FleetMap';
import { FleetOverview } from './components/FleetOverview';
import { TaskNegotiationPanel } from './components/TaskNegotiationPanel';
import { ConflictMonitor } from './components/ConflictMonitor';
import { DeadlockMonitor } from './components/DeadlockMonitor';
import { BatteryMonitor } from './components/BatteryMonitor';
import { FailureRecoveryPanel } from './components/FailureRecoveryPanel';
import { EventStream } from './components/EventStream';
import { DemoControls } from './components/DemoControls';
import { MetricsBar } from './components/MetricsBar';
import { Bot, Wifi, WifiOff, Radio, Cpu, Layers } from 'lucide-react';

const API_BASE = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000/ws';

export const App: React.FC = () => {
  // State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);

  // Simulation Entities
  const [compactRobots, setCompactRobots] = useState<any[][]>([]);
  const [corridors, setCorridors] = useState<Corridor[]>([]);
  const [chargingStations, setChargingStations] = useState<ChargingStation[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // Subsystem Telemetry
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [activeConflicts, setActiveConflicts] = useState<ConflictEvent[]>([]);
  const [recentDeadlocks, setRecentDeadlocks] = useState<DeadlockEvent[]>([]);
  const [recentFailures, setRecentFailures] = useState<RobotFailureEvent[]>([]);
  const [recentBids, setRecentBids] = useState<BidDetail[]>([]);

  // Default Metrics
  const [metrics, setMetrics] = useState<FleetMetrics>({
    total_robots: 500,
    active_robots: 145,
    idle_robots: 320,
    charging_robots: 35,
    failed_robots: 0,
    recovering_robots: 0,
    total_tasks: 200,
    queued_tasks: 45,
    active_tasks: 145,
    completed_tasks: 10,
    reassigned_tasks_count: 0,
    task_allocation_success_rate: 99.4,
    average_allocation_latency_ms: 85.0,
    conflict_count: 0,
    conflict_resolution_rate: 100.0,
    collision_predictions_count: 0,
    deadlock_count: 0,
    deadlock_resolution_rate: 100.0,
    average_deadlock_recovery_time_sec: 1.8,
    average_battery_utilization: 84.5,
    robot_failure_count: 0,
    recovery_success_rate: 100.0,
    mission_continuity_rate: 100.0,
    simulation_throughput_tps: 12.4,
    coordinator_online: true,
    local_autonomy_active: false,
    simulation_time: 0.0,
    simulation_speed: 1.0,
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch full state over REST
  const fetchFullState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/state`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCorridors(data.corridors);
        setChargingStations(data.charging_stations);
        setZones(data.zones);
        setRecentEvents(data.recent_events || []);
        setActiveConflicts(data.active_conflicts || []);
        setRecentDeadlocks(data.recent_deadlocks || []);
        setRecentFailures(data.recent_failures || []);
        setRecentBids(data.recent_bids || []);
      }
    } catch (e) {
      console.error('Failed to fetch full state:', e);
    }
  }, []);

  // WebSocket Telemetry Connection
  useEffect(() => {
    let isSubscribed = true;

    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) return;
        setIsConnected(true);
        console.log('Connected to FleetMind WebSocket stream.');
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'INITIAL_STATE') {
            const st = payload.state;
            setMetrics(st.metrics);
            setCorridors(st.corridors);
            setChargingStations(st.charging_stations);
            setZones(st.zones);
            setRecentEvents(st.recent_events || []);
            setActiveConflicts(st.active_conflicts || []);
            setRecentDeadlocks(st.recent_deadlocks || []);
            setRecentFailures(st.recent_failures || []);
            setRecentBids(st.recent_bids || []);
            if (payload.robots_compact) {
              setCompactRobots(payload.robots_compact);
            }
          } else if (payload.type === 'SIM_TICK') {
            if (payload.metrics) setMetrics(payload.metrics);
            if (payload.robots_compact) setCompactRobots(payload.robots_compact);
            if (payload.recent_events) setRecentEvents(payload.recent_events);
            if (payload.active_conflicts) setActiveConflicts(payload.active_conflicts);
            if (payload.recent_deadlocks) setRecentDeadlocks(payload.recent_deadlocks);
            if (payload.recent_failures) setRecentFailures(payload.recent_failures);
            if (payload.recent_bids) setRecentBids(payload.recent_bids);
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        setIsConnected(false);
        // Retry connection after 2 seconds
        setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (e) => {
        console.warn('WS error, fallback to REST polling:', e);
        ws.close();
      };
    };

    fetchFullState();
    connectWebSocket();

    // Secondary HTTP fallback heartbeat if WS disconnects
    const interval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchFullState();
      }
    }, 1500);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchFullState]);

  // REST Action Handlers
  const handleTogglePlay = async () => {
    try {
      const endpoint = isRunning ? '/api/simulation/stop' : '/api/simulation/start';
      await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
      setIsRunning(!isRunning);
    } catch (e) {
      console.error('Toggle play failed:', e);
    }
  };

  const handleReset = async (robots: number, tasks: number) => {
    try {
      await fetch(`${API_BASE}/api/simulation/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_robots: robots, num_tasks: tasks }),
      });
      fetchFullState();
    } catch (e) {
      console.error('Reset failed:', e);
    }
  };

  const handleSetSpeed = (speed: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'SPEED', speed }));
    }
  };

  const handleTriggerSurge = async () => {
    try {
      await fetch(`${API_BASE}/api/scenario/emergency-surge`, { method: 'POST' });
    } catch (e) {
      console.error('Trigger surge failed:', e);
    }
  };

  const handleTriggerConflict = async () => {
    try {
      await fetch(`${API_BASE}/api/scenario/conflict`, { method: 'POST' });
    } catch (e) {
      console.error('Trigger conflict failed:', e);
    }
  };

  const handleTriggerDeadlock = async () => {
    try {
      await fetch(`${API_BASE}/api/scenario/deadlock`, { method: 'POST' });
    } catch (e) {
      console.error('Trigger deadlock failed:', e);
    }
  };

  const handleDrainBattery = async (robotId: string = 'R023', level: number = 17.0) => {
    try {
      await fetch(`${API_BASE}/api/battery/drain/${robotId}?battery=${level}`, { method: 'POST' });
    } catch (e) {
      console.error('Drain battery failed:', e);
    }
  };

  const handleFailRobot = async (robotId: string = 'R127') => {
    try {
      await fetch(`${API_BASE}/api/failure/robot/${robotId}`, { method: 'POST' });
    } catch (e) {
      console.error('Fail robot failed:', e);
    }
  };

  const handleToggleCoordinator = async () => {
    try {
      await fetch(`${API_BASE}/api/failure/coordinator`, { method: 'POST' });
    } catch (e) {
      console.error('Toggle coordinator failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Industrial Navigation Bar */}
      <header className="bg-[#0b101d] border-b border-[#1c273e] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold shadow-lg shadow-cyan-500/20">
            <Bot size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-wider font-mono text-white">
                FLEETMIND <span className="text-cyan-400 font-normal text-xs">// AMR ENGINE</span>
              </h1>
              <span className="text-[10px] bg-[#141f38] text-cyan-300 border border-[#22355e] px-1.5 py-0.5 rounded font-mono">
                500+ HETEROGENEOUS AMRs
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Decentralized Multi-Robot Task Negotiation & Resilient Recovery Platform
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#070c17] px-2.5 py-1 rounded border border-[#1b2640]">
            <Radio size={13} className="text-cyan-400 animate-pulse" />
            <span className="text-slate-400">SIM CLOCK:</span>
            <span className="text-cyan-300 font-bold">{metrics.simulation_time.toFixed(1)}s</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${
            metrics.coordinator_online
              ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
              : 'bg-amber-950/50 border-amber-600 text-amber-300 animate-pulse'
          }`}>
            <span className={`w-2 h-2 rounded-full ${metrics.coordinator_online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="font-bold">
              {metrics.coordinator_online ? 'CENTRAL OPTIMIZER' : 'LOCAL AUTONOMY ACTIVE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            {isConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <Wifi size={14} /> LIVE 10Hz
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                <WifiOff size={14} /> RECONNECTING
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 flex flex-col gap-3 max-w-[1920px] mx-auto w-full">
        {/* Section A: Fleet KPI Overview */}
        <FleetOverview metrics={metrics} onToggleCoordinator={handleToggleCoordinator} />

        {/* Section B: Simulation Control & Scripted Sequence */}
        <DemoControls
          isRunning={isRunning}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          onTriggerSurge={handleTriggerSurge}
          onTriggerConflict={handleTriggerConflict}
          onTriggerDeadlock={handleTriggerDeadlock}
          onDrainBattery={() => handleDrainBattery('R023', 17.0)}
          onFailRobot={() => handleFailRobot('R127')}
          onToggleCoordinator={handleToggleCoordinator}
          onSetSpeed={handleSetSpeed}
        />

        {/* Grid Layout: Main Canvas Map + Subsystem Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
          {/* Main Visual: 500+ AMR Interactive Canvas (7 cols on large screens) */}
          <div className="lg:col-span-7 flex flex-col h-[520px] lg:h-auto min-h-[500px]">
            <FleetMap
              robots={compactRobots}
              corridors={corridors}
              chargingStations={chargingStations}
              zones={zones}
              activeConflicts={activeConflicts}
              recentDeadlocks={recentDeadlocks}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
            />
          </div>

          {/* Subsystem Telemetry & Decision Panels (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {/* Row 1: Task Negotiation & Conflict Arbiter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TaskNegotiationPanel
                recentBids={recentBids}
                allocationLatencyMs={metrics.average_allocation_latency_ms}
                successRate={metrics.task_allocation_success_rate}
              />
              <ConflictMonitor
                activeConflicts={activeConflicts}
                totalConflicts={metrics.conflict_count}
                totalPredictions={metrics.collision_predictions_count}
                onTriggerConflict={handleTriggerConflict}
              />
            </div>

            {/* Row 2: Deadlock Detector & Battery-Aware Scheduling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DeadlockMonitor
                recentDeadlocks={recentDeadlocks}
                deadlockCount={metrics.deadlock_count}
                avgRecoveryTimeSec={metrics.average_deadlock_recovery_time_sec}
                onTriggerDeadlock={handleTriggerDeadlock}
              />
              <BatteryMonitor
                robots={compactRobots}
                reassignmentsCount={metrics.reassigned_tasks_count}
                avgBattery={metrics.average_battery_utilization}
                onDrainBattery={handleDrainBattery}
              />
            </div>

            {/* Row 3: Failure Recovery & Real-Time Event Stream */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-[200px]">
              <FailureRecoveryPanel
                recentFailures={recentFailures}
                coordinatorOnline={metrics.coordinator_online}
                localAutonomyActive={metrics.local_autonomy_active}
                onFailRobot={handleFailRobot}
                onToggleCoordinator={handleToggleCoordinator}
              />
              <EventStream events={recentEvents} />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Industrial Telemetry Metrics Bar */}
      <footer className="shrink-0">
        <MetricsBar metrics={metrics} />
      </footer>
    </div>
  );
};

export default App;
