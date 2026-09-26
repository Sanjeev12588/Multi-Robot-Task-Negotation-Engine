import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { FleetMetrics } from '../../types';

interface SystemHealthProps {
  metrics: FleetMetrics | null;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ metrics }) => {
  const efficiency = metrics ? Math.round(metrics.mission_continuity_rate * 100) : 92;
  const successRate = metrics ? Math.round(metrics.task_allocation_success_rate * 100) : 98;
  const avgBattery = metrics ? Math.round(metrics.average_battery_utilization) : 73;
  const latency = metrics ? Math.round(metrics.average_allocation_latency_ms) : 142;

  return (
    <GlassCard className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-slate-900">System Health</h3>
        <button className="text-[11px] font-semibold text-blue-600 hover:underline">
          Details →
        </button>
      </div>

      <div className="space-y-3.5">
        {/* Fleet Efficiency */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Fleet Efficiency</span>
            <span className="text-slate-900 font-bold">{efficiency}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>

        {/* Task Success Rate */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Task Success Rate</span>
            <span className="text-slate-900 font-bold">{successRate}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Avg Battery Level */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Avg Battery Level</span>
            <span className="text-slate-900 font-bold">{avgBattery}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${avgBattery}%` }}
            />
          </div>
        </div>

        {/* Network Health */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="text-slate-600">Network Health</span>
            <span className="text-slate-900 font-bold">100%</span>
          </div>
          <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Coordination Latency */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
          <span className="font-semibold text-slate-600">Coordination Latency</span>
          <span className="font-mono font-bold text-slate-900">{latency} ms</span>
        </div>
      </div>
    </GlassCard>
  );
};
