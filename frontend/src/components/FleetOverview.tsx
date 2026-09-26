import React from 'react';
import { FleetMetrics } from '../types';
import { Bot, Activity, BatteryCharging, AlertTriangle, ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface FleetOverviewProps {
  metrics: FleetMetrics;
  onToggleCoordinator: () => void;
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ metrics, onToggleCoordinator }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {/* Total Robots */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fleet AMRs</div>
          <div className="text-xl font-bold font-mono text-cyan-400">{metrics.total_robots}</div>
          <div className="text-[10px] text-slate-500">Autonomous Units</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
          <Bot size={18} />
        </div>
      </div>

      {/* Active Moving */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Moving</div>
          <div className="text-xl font-bold font-mono text-blue-400">{metrics.active_robots}</div>
          <div className="text-[10px] text-slate-500">En Route / Working</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
          <Activity size={18} />
        </div>
      </div>

      {/* Idle Ready */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Idle Standby</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{metrics.idle_robots}</div>
          <div className="text-[10px] text-slate-500">Available for Bids</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
          <ShieldCheck size={18} />
        </div>
      </div>

      {/* Charging */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Charging</div>
          <div className="text-xl font-bold font-mono text-amber-400">{metrics.charging_robots}</div>
          <div className="text-[10px] text-slate-500">Avg Batt {metrics.average_battery_utilization}%</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
          <BatteryCharging size={18} />
        </div>
      </div>

      {/* Failed / Offline */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Failed Units</div>
          <div className="text-xl font-bold font-mono text-rose-400">{metrics.failed_robots}</div>
          <div className="text-[10px] text-slate-500">100% Reassigned</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-400">
          <AlertTriangle size={18} />
        </div>
      </div>

      {/* Mission Continuity */}
      <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mission Continuity</div>
          <div className="text-xl font-bold font-mono text-emerald-400">{metrics.mission_continuity_rate}%</div>
          <div className="text-[10px] text-slate-500">Zero Mission Drop</div>
        </div>
        <div className="w-8 h-8 rounded-md bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
          <ShieldCheck size={18} />
        </div>
      </div>

      {/* Central Coordinator Control / Autonomy Toggle */}
      <button
        onClick={onToggleCoordinator}
        className={`rounded-lg p-2.5 border text-left transition relative overflow-hidden group cursor-pointer ${
          metrics.coordinator_online
            ? 'bg-emerald-950/30 border-emerald-700/60 hover:border-emerald-500'
            : 'bg-amber-950/40 border-amber-600 hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-300">Coordination Layer</span>
          {metrics.coordinator_online ? (
            <Wifi size={14} className="text-emerald-400" />
          ) : (
            <WifiOff size={14} className="text-amber-400 animate-pulse" />
          )}
        </div>
        <div className={`text-xs font-bold font-mono mt-1 ${metrics.coordinator_online ? 'text-emerald-400' : 'text-amber-400'}`}>
          {metrics.coordinator_online ? 'CENTRAL OPTIMIZER' : 'LOCAL AUTONOMY'}
        </div>
        <div className="text-[9px] text-slate-400 mt-0.5">
          {metrics.coordinator_online ? 'Status: ONLINE (Click to fail)' : 'PEER-TO-PEER ACTIVE (Click to restore)'}
        </div>
      </button>
    </div>
  );
};
