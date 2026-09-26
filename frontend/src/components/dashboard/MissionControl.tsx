import React from 'react';
import { Warehouse3D } from '../simulator/Warehouse3D';
import { FleetOverview } from './FleetOverview';
import { SystemHealth } from './SystemHealth';
import { KPIGrid } from './KPIGrid';
import { AlertsPanel } from './AlertsPanel';
import { FleetMetrics, CompactRobot, SystemEvent, ConflictEvent, DeadlockEvent } from '../../types';

interface MissionControlProps {
  metrics: FleetMetrics | null;
  robotsCompact: CompactRobot[];
  recentEvents: SystemEvent[];
  activeConflicts: ConflictEvent[];
  recentDeadlocks: DeadlockEvent[];
  selectedRobotId: string | null;
  onSelectRobot: (robotId: string) => void;
  selectedRobotPath?: [number, number][];
}

export const MissionControl: React.FC<MissionControlProps> = ({
  metrics,
  robotsCompact,
  recentEvents,
  activeConflicts,
  recentDeadlocks,
  selectedRobotId,
  onSelectRobot,
  selectedRobotPath = [],
}) => {
  return (
    <div className="space-y-4 pb-6 select-none">
      {/* Top Main Section: 3D Simulator (Left 70%) + Right Cards (Right 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[520px]">
        {/* 3D Fleet Map Simulator Hero Canvas */}
        <div className="lg:col-span-8 h-full flex flex-col">
          <Warehouse3D
            robots={robotsCompact}
            selectedRobotId={selectedRobotId}
            onSelectRobot={onSelectRobot}
            selectedRobotPath={selectedRobotPath}
            conflicts={activeConflicts}
            deadlocks={recentDeadlocks}
          />
        </div>

        {/* Right Info Panels */}
        <div className="lg:col-span-4 h-full flex flex-col gap-4">
          <div className="h-1/2">
            <FleetOverview metrics={metrics} />
          </div>
          <div className="h-1/2">
            <SystemHealth metrics={metrics} />
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <KPIGrid metrics={metrics} />

      {/* Alerts and Events Row */}
      <AlertsPanel events={recentEvents} />
    </div>
  );
};
