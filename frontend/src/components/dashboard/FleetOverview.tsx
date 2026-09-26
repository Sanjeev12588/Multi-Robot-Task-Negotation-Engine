import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { FleetMetrics } from '../../types';

interface FleetOverviewProps {
  metrics: FleetMetrics | null;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ metrics }) => {
  const total = metrics?.total_robots || 500;
  const active = metrics?.active_robots || 487;
  const idle = metrics?.idle_robots || 12;
  const charging = metrics?.charging_robots || 13;
  const failed = metrics?.failed_robots || 0;

  const activePct = Math.round((active / total) * 100);
  const idlePct = Math.round((idle / total) * 100);
  const chargingPct = Math.round((charging / total) * 100);
  const failedPct = Math.round((failed / total) * 100);

  return (
    <GlassCard className="p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-slate-900">Fleet Overview</h3>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
          Live
        </span>
      </div>

      {/* Donut Metric Display */}
      <div className="relative flex items-center justify-center my-3">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="56"
            stroke="#E2E5E3"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r="56"
            stroke="#059669"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={351}
            strokeDashoffset={351 - (351 * activePct) / 100}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 leading-none">{active}</span>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Active</span>
        </div>
      </div>

      {/* Breakdown Legend */}
      <div className="space-y-2 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Active</span>
          </div>
          <span className="font-bold text-slate-800">{active} ({activePct}%)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Idle</span>
          </div>
          <span className="font-bold text-slate-800">{idle} ({idlePct}%)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Charging</span>
          </div>
          <span className="font-bold text-slate-800">{charging} ({chargingPct}%)</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>Failed</span>
          </div>
          <span className="font-bold text-slate-800">{failed} ({failedPct}%)</span>
        </div>
      </div>
    </GlassCard>
  );
};
