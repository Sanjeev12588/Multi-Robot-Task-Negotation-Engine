import React, { useState, useEffect, useCallback } from 'react';
import { useFleetmindWebSocket } from './hooks/useFleetmindWebSocket';
import { api } from './services/api';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MissionControl } from './components/dashboard/MissionControl';
import { FleetPage } from './components/fleet/FleetPage';
import { TasksPage } from './components/tasks/TasksPage';
import { ConflictsPage } from './components/coordination/ConflictsPage';
import { BatteryPage } from './components/battery/BatteryPage';
import { FailuresPage } from './components/recovery/FailuresPage';
import { AnalyticsPage } from './components/analytics/AnalyticsPage';
import { ScenarioDrawer } from './components/scenarios/ScenarioDrawer';
import { RobotDetail, Task } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('mission-control');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null);
  const [robotsFull, setRobotsFull] = useState<RobotDetail[]>([]);
  const [tasksFull, setTasksFull] = useState<Task[]>([]);
  const [isScenarioDrawerOpen, setIsScenarioDrawerOpen] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(1);

  // Live Telemetry via WebSocket
  const {
    metrics,
    robotsCompact,
    tasks: tasksWs,
    recentEvents,
    activeConflicts,
    recentDeadlocks,
    recentFailures,
    recentBids,
    setSpeed,
  } = useFleetmindWebSocket();

  // Periodically fetch full state details for tables when in detailed screens
  useEffect(() => {
    let interval: any;
    if (activeTab === 'fleet' || activeTab === 'battery' || activeTab === 'failures') {
      const loadRobots = async () => {
        try {
          const list = await api.getRobots(500);
          setRobotsFull(list);
        } catch (e) {
          console.error('Failed to load full robots list:', e);
        }
      };
      loadRobots();
      interval = setInterval(loadRobots, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'tasks') {
      const loadTasks = async () => {
        try {
          const list = await api.getTasks(200);
          setTasksFull(list);
        } catch (e) {
          console.error('Failed to load tasks list:', e);
        }
      };
      loadTasks();
      interval = setInterval(loadTasks, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  // Engine controls
  const handleStart = async () => {
    try {
      await api.startSimulation();
      setIsRunning(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePause = async () => {
    try {
      await api.stopSimulation();
      setIsRunning(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetSimulation();
      setIsRunning(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetSpeed = (s: number) => {
    setSpeedState(s);
    setSpeed(s);
  };

  // Scenario Execution Router
  const handleTriggerScenario = useCallback(
    async (scenarioId: string) => {
      try {
        switch (scenarioId) {
          case 'emergency-surge':
            await api.triggerEmergencySurge();
            break;
          case 'corridor-conflict':
            await api.triggerCorridorConflict();
            break;
          case 'trigger-deadlock':
            await api.triggerDeadlock();
            break;
          case 'drain-battery': {
            const targetRobot = selectedRobotId || robotsCompact[0]?.id || 'R-001';
            await api.drainBattery(targetRobot, 17.0);
            break;
          }
          case 'fail-robot': {
            const targetRobot = selectedRobotId || robotsCompact[0]?.id || 'R-005';
            await api.failRobot(targetRobot);
            break;
          }
          case 'fail-coordinator':
            await api.toggleCoordinatorFailure();
            break;
          case 'reset-scenario':
            await api.resetSimulation();
            break;
          default:
            break;
        }
      } catch (e) {
        console.error(`Scenario trigger failed [${scenarioId}]:`, e);
      }
    },
    [selectedRobotId, robotsCompact]
  );

  const selectedRobotPath = robotsFull.find((r) => r.id === selectedRobotId)?.planned_path || [];

  return (
    <div className="flex h-screen w-screen bg-[#F1F3F2] text-slate-900 font-sans overflow-hidden">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTriggerScenario={handleTriggerScenario}
        simTime={metrics?.simulation_time || 0}
        speed={speed}
        setSpeed={handleSetSpeed}
      />

      {/* Main Right View Shell */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Persistent Header TopBar */}
        <TopBar
          metrics={metrics}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          isRunning={isRunning}
        />

        {/* Active Screen Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F1F3F2]">
          {activeTab === 'mission-control' && (
            <MissionControl
              metrics={metrics}
              robotsCompact={robotsCompact}
              recentEvents={recentEvents}
              activeConflicts={activeConflicts}
              recentDeadlocks={recentDeadlocks}
              selectedRobotId={selectedRobotId}
              onSelectRobot={setSelectedRobotId}
              selectedRobotPath={selectedRobotPath}
            />
          )}

          {activeTab === 'fleet' && (
            <FleetPage
              robots={
                robotsFull.length > 0
                  ? robotsFull
                  : (robotsCompact.map((c) => ({
                      id: c.id,
                      robot_type: c.type,
                      x: c.x,
                      y: c.y,
                      target_x: null,
                      target_y: null,
                      battery: c.battery,
                      health: 100,
                      speed: 1.5,
                      capacity: 100,
                      workload: 1,
                      current_task: c.current_task,
                      status: c.status,
                      capabilities: ['STANDARD_CARRIER'],
                      planned_path: [],
                      heading: c.heading,
                    })) as RobotDetail[])
              }
              onDrainBattery={(id) => api.drainBattery(id, 17.0)}
              onFailRobot={(id) => api.failRobot(id)}
              onReassignTask={(id) => api.reassignTask(id)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksPage
              tasks={tasksWs.length > 0 ? tasksWs : tasksFull}
              recentBids={recentBids}
              onReassignTask={(id) => api.reassignTask(id)}
              onCreateTask={(data) => api.createTask(data)}
            />
          )}

          {activeTab === 'coordination' && (
            <ConflictsPage
              conflicts={activeConflicts}
              deadlocks={recentDeadlocks}
              onTriggerConflict={() => api.triggerCorridorConflict()}
              onTriggerDeadlock={() => api.triggerDeadlock()}
            />
          )}

          {activeTab === 'battery' && (
            <BatteryPage
              metrics={metrics}
              robots={
                robotsFull.length > 0
                  ? robotsFull
                  : (robotsCompact.map((c) => ({
                      id: c.id,
                      robot_type: c.type,
                      x: c.x,
                      y: c.y,
                      target_x: null,
                      target_y: null,
                      battery: c.battery,
                      health: 100,
                      speed: 1.5,
                      capacity: 100,
                      workload: 1,
                      current_task: c.current_task,
                      status: c.status,
                      capabilities: ['STANDARD_CARRIER'],
                      planned_path: [],
                      heading: c.heading,
                    })) as RobotDetail[])
              }
              onDrainBattery={(id) => api.drainBattery(id, 17.0)}
              onReassignTask={(id) => api.reassignTask(id)}
            />
          )}

          {activeTab === 'failures' && (
            <FailuresPage
              metrics={metrics}
              robots={
                robotsFull.length > 0
                  ? robotsFull
                  : (robotsCompact.map((c) => ({
                      id: c.id,
                      robot_type: c.type,
                      x: c.x,
                      y: c.y,
                      target_x: null,
                      target_y: null,
                      battery: c.battery,
                      health: 100,
                      speed: 1.5,
                      capacity: 100,
                      workload: 1,
                      current_task: c.current_task,
                      status: c.status,
                      capabilities: ['STANDARD_CARRIER'],
                      planned_path: [],
                      heading: c.heading,
                    })) as RobotDetail[])
              }
              failures={recentFailures}
              onFailRobot={(id) => api.failRobot(id)}
              onToggleCoordinator={() => api.toggleCoordinatorFailure()}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsPage metrics={metrics} />}
        </main>
      </div>

      {/* Demo Scenario Drawer Overlay */}
      <ScenarioDrawer
        isOpen={isScenarioDrawerOpen}
        onClose={() => setIsScenarioDrawerOpen(false)}
        onTriggerScenario={handleTriggerScenario}
      />
    </div>
  );
}

export default App;
