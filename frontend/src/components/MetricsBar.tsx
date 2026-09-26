import React from 'react';
import { FleetMetrics } from '../types';
import { CheckCircle2, Clock, Split, RefreshCw, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface MetricsBarProps {
  metrics: FleetMetrics;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics }) => {
  return (
    <div className="bg-[#080d18] border-t border-[#1e293b] px-4 py-2 text-slate-300">
      <div className="flex items-center justify-between gap-4 overflow-x-auto text-[11px] font-mono whitespace-nowrap">
        {/* Metric 1 & 2: Task Allocation & Latency */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <CheckCircle2 size={13} className="text-cyan-400" />
          <span className="text-slate-400">Alloc Success:</span>
          <strong className="text-cyan-300">{metrics.task_allocation_success_rate}%</strong>
          <span className="text-slate-500">({metrics.average_allocation_latency_ms}ms)</span>
        </div>

        {/* Metric 3 & 4: Completed & Active Tasks */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <Clock size={13} className="text-blue-400" />
          <span className="text-slate-400">Tasks:</span>
          <strong className="text-emerald-400">{metrics.completed_tasks} Done</strong>
          <span className="text-slate-400">/</span>
          <strong className="text-blue-300">{metrics.active_tasks} Active</strong>
          <span className="text-slate-500">({metrics.queued_tasks} Queued)</span>
        </div>

        {/* Metric 5, 6, 7: Conflicts & Predictions */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <Split size={13} className="text-amber-400" />
          <span className="text-slate-400">Conflicts:</span>
          <strong className="text-amber-300">{metrics.conflict_count}</strong>
          <span className="text-slate-500">({metrics.collision_predictions_count} Pred, {metrics.conflict_resolution_rate}% Res)</span>
        </div>

        {/* Metric 8, 9, 10: Deadlocks & Recovery Latency */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <RefreshCw size={13} className="text-rose-400" />
          <span className="text-slate-400">Deadlocks:</span>
          <strong className="text-rose-300">{metrics.deadlock_count}</strong>
          <span className="text-slate-500">({metrics.average_deadlock_recovery_time_sec}s avg rec)</span>
        </div>

        {/* Metric 11 & 12: Battery & Reassignments */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <Zap size={13} className="text-emerald-400" />
          <span className="text-slate-400">Avg Batt:</span>
          <strong className="text-emerald-300">{metrics.average_battery_utilization}%</strong>
          <span className="text-slate-500">({metrics.reassigned_tasks_count} Reassigned)</span>
        </div>

        {/* Metric 13, 14, 15: Failures & Continuity */}
        <div className="flex items-center gap-1.5 border-r border-[#1e293b] pr-4">
          <ShieldAlert size={13} className="text-purple-400" />
          <span className="text-slate-400">Failures:</span>
          <strong className="text-purple-300">{metrics.robot_failure_count}</strong>
          <span className="text-slate-500">(Continuity: <strong className="text-emerald-400">{metrics.mission_continuity_rate}%</strong>)</span>
        </div>

        {/* Metric 16: Throughput */}
        <div className="flex items-center gap-1.5">
          <Cpu size={13} className="text-cyan-400" />
          <span className="text-slate-400">Throughput:</span>
          <strong className="text-cyan-300">{metrics.simulation_throughput_tps} TPS</strong>
          <span className="text-slate-500">({metrics.active_robots} AMRs active)</span>
        </div>
      </div>
    </div>
  );
};
