import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FleetMetrics,
  CompactRobot,
  SystemEvent,
  ConflictEvent,
  DeadlockEvent,
  RobotFailureEvent,
  BidDetail,
  Task,
} from '../types';

export interface WebSocketTelemetry {
  isConnected: boolean;
  metrics: FleetMetrics | null;
  robotsCompact: CompactRobot[];
  tasks: Task[];
  recentEvents: SystemEvent[];
  activeConflicts: ConflictEvent[];
  recentDeadlocks: DeadlockEvent[];
  recentFailures: RobotFailureEvent[];
  recentBids: BidDetail[];
  setSpeed: (speed: number) => void;
}

export function useFleetmindWebSocket(): WebSocketTelemetry {
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<FleetMetrics | null>(null);
  const [robotsCompact, setRobotsCompact] = useState<CompactRobot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [activeConflicts, setActiveConflicts] = useState<ConflictEvent[]>([]);
  const [recentDeadlocks, setRecentDeadlocks] = useState<DeadlockEvent[]>([]);
  const [recentFailures, setRecentFailures] = useState<RobotFailureEvent[]>([]);
  const [recentBids, setRecentBids] = useState<BidDetail[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INITIAL_STATE') {
            const st = data.state;
            if (st) {
              setMetrics(st.metrics);
              if (st.tasks) setTasks(st.tasks);
              setRecentEvents(st.recent_events || []);
              setActiveConflicts(st.active_conflicts || []);
              setRecentDeadlocks(st.recent_deadlocks || []);
              setRecentFailures(st.recent_failures || []);
              setRecentBids(st.recent_bids || []);
            }
            if (data.robots_compact) {
              setRobotsCompact(data.robots_compact);
            }
          } else if (data.type === 'SIM_TICK') {
            if (data.metrics) setMetrics(data.metrics);
            if (data.robots_compact) setRobotsCompact(data.robots_compact);
            if (data.tasks) setTasks(data.tasks);
            if (data.recent_events) setRecentEvents(data.recent_events);
            if (data.active_conflicts) setActiveConflicts(data.active_conflicts);
            if (data.recent_deadlocks) setRecentDeadlocks(data.recent_deadlocks);
            if (data.recent_failures) setRecentFailures(data.recent_failures);
            if (data.recent_bids) setRecentBids(data.recent_bids);
          }
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket error:', err);
        ws.close();
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const setSpeed = useCallback((speed: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'SPEED', speed }));
    }
  }, []);

  return {
    isConnected,
    metrics,
    robotsCompact,
    tasks,
    recentEvents,
    activeConflicts,
    recentDeadlocks,
    recentFailures,
    recentBids,
    setSpeed,
  };
}
