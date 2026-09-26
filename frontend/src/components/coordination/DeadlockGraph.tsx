import React from 'react';
import { DeadlockEvent } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { Repeat, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';

interface DeadlockGraphProps {
  deadlocks: DeadlockEvent[];
  onResolve?: () => void;
}

export const DeadlockGraph: React.FC<DeadlockGraphProps> = ({ deadlocks, onResolve }) => {
  const currentDeadlock = deadlocks[0] || {
    id: 'D-101',
    participants: ['R-21', 'R-43', 'R-82'],
    yielding_robot: 'R-82',
    resolution_action: 'Yield & Re-route',
    recovery_time_sec: 1.8,
    status: 'RESOLVED',
    detail: 'Circular wait detected on Corridor C-07. R-82 yielded right-of-way.',
  };

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-rose-600 animate-spin" />
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Wait-For Cycle Graph</h3>
            <p className="text-xs font-semibold text-slate-500">Circular Dependency Detection Engine</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full badge-emerald text-xs font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Recovery Active
        </span>
      </div>

      {/* Interactive Wait-For Cycle Node Visualization */}
      <div className="relative h-64 bg-slate-100/60 rounded-2xl border border-slate-200/80 flex items-center justify-center p-4 overflow-hidden">
        {/* Triangle Node Layout for R21 -> R43 -> R82 -> R21 */}
        <div className="relative w-80 h-52 flex items-center justify-center">
          {/* Node 1: R-21 */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-blue-500/30">
              R-21
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1">Holding C-07</span>
          </div>

          {/* Node 2: R-43 */}
          <div className="absolute bottom-2 right-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-blue-500/30">
              R-43
            </div>
            <span className="text-[10px] font-bold text-slate-500 mt-1">Holding C-08</span>
          </div>

          {/* Node 3: R-82 (Yielding) */}
          <div className="absolute bottom-2 left-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
              R-82
            </div>
            <span className="text-[10px] font-bold text-rose-600 mt-1">Yielding Node</span>
          </div>

          {/* Animated Connecting Cycle Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500 stroke-2">
            {/* R-21 -> R-43 */}
            <line x1="170" y1="35" x2="260" y2="150" strokeDasharray="4 4" className="animate-dash" />
            {/* R-43 -> R-82 */}
            <line x1="250" y1="170" x2="70" y2="170" strokeDasharray="4 4" className="animate-dash" />
            {/* R-82 -> R-21 */}
            <line x1="60" y1="150" x2="150" y2="35" strokeDasharray="4 4" className="animate-dash" />
          </svg>
        </div>
      </div>

      {/* Deadlock Resolution Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-slate-500 font-semibold block">Participants</span>
          <span className="font-bold text-slate-900">R-21, R-43, R-82</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Yielding Robot</span>
          <span className="font-bold text-rose-600">R-82 (Lowest Priority)</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Resolution Strategy</span>
          <span className="font-bold text-emerald-600">Sidestep & Re-route</span>
        </div>
        <div>
          <span className="text-slate-500 font-semibold block">Recovery Time</span>
          <span className="font-mono font-bold text-slate-900">1.8 seconds</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onResolve}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <RefreshCw className="w-4 h-4" />
          Trigger Deadlock Resolution
        </button>
      </div>
    </GlassCard>
  );
};
