import React from 'react';
import { FleetMetrics } from '../../types';
import { Play, Pause, RotateCcw, Bot, GitBranch, AlertTriangle, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TopBarProps {
  metrics: FleetMetrics | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  metrics,
  onStart,
  onPause,
  onReset,
  isRunning,
}) => {
  const coordinatorOnline = metrics?.coordinator_online ?? true;
  const localAutonomy = metrics?.local_autonomy_active ?? false;

  const activeRobots = metrics?.total_robots ?? 500;
  const activeTasks = metrics?.active_tasks ?? 0;
  const conflicts = metrics?.conflict_count ?? 0;
  const deadlocks = metrics?.deadlock_count ?? 0;

  return (
    <header className="h-16 bg-[#F8FAF9]/80 backdrop-blur-xl border-b border-[#D9DDDA] px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* System Status Indicator */}
      <div className="flex items-center gap-3">
        {coordinatorOnline ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full badge-emerald text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>SYSTEM ONLINE</span>
            <span className="text-[11px] font-normal text-emerald-700 opacity-90 hidden md:inline">
              All Systems Operational
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full badge-red text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>CENTRAL COORDINATOR OFFLINE</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded">
              LOCAL AUTONOMY ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Quick Metrics Pills */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/50 border border-slate-300/40">
          <Bot className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">{activeRobots}+</span>
          <span className="text-slate-500">Robots</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/50 border border-slate-300/40">
          <GitBranch className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-slate-800">{activeTasks}</span>
          <span className="text-slate-500">Active Tasks</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/50 border border-slate-300/40">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-slate-800">{conflicts}</span>
          <span className="text-slate-500">Conflicts</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200/50 border border-slate-300/40">
          <RefreshCw className="w-4 h-4 text-rose-500" />
          <span className="font-bold text-slate-800">{deadlocks}</span>
          <span className="text-slate-500">Deadlocks</span>
        </div>
      </div>

      {/* Engine Controls (Pause, Start, Reset) */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
          >
            <Pause className="w-3.5 h-3.5 text-slate-700" />
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 border border-slate-300/50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </header>
  );
};
