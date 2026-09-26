import React from 'react';
import { ConflictEvent } from '../types';
import { AlertTriangle, ShieldAlert, CheckCircle2, Split } from 'lucide-react';

interface ConflictMonitorProps {
  activeConflicts: ConflictEvent[];
  totalConflicts: number;
  totalPredictions: number;
  onTriggerConflict: () => void;
}

export const ConflictMonitor: React.FC<ConflictMonitorProps> = ({
  activeConflicts,
  totalConflicts,
  totalPredictions,
  onTriggerConflict
}) => {
  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <Split size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Conflict & Collision Arbiter</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Conflicts: <strong className="text-amber-400">{totalConflicts}</strong></span>
            <span>Predictions: <strong className="text-rose-400">{totalPredictions}</strong></span>
          </div>
          <button
            onClick={onTriggerConflict}
            className="text-[10px] font-semibold bg-amber-950/70 border border-amber-600/70 text-amber-300 hover:bg-amber-900 px-2 py-0.5 rounded transition cursor-pointer"
          >
            + Test Conflict
          </button>
        </div>
      </div>

      {activeConflicts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-6">
          <CheckCircle2 size={22} className="mb-1 text-emerald-500/60" />
          <span>No active trajectory or corridor contentions</span>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
          {activeConflicts.map((c, idx) => (
            <div
              key={c.id || idx}
              className={`rounded-md p-2.5 border text-[11px] ${
                c.conflict_type === 'COLLISION_PREDICTED'
                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                  : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between font-mono font-bold mb-1">
                <div className="flex items-center gap-1.5">
                  {c.conflict_type === 'COLLISION_PREDICTED' ? (
                    <AlertTriangle size={13} className="text-rose-400" />
                  ) : (
                    <ShieldAlert size={13} className="text-amber-400" />
                  )}
                  <span>{c.conflict_type}</span>
                </div>
                <span className="text-[10px] text-slate-400">ETA: {c.eta_seconds}s</span>
              </div>

              <div className="font-mono text-xs font-semibold text-white my-1 flex items-center justify-between bg-black/30 px-2 py-1 rounded">
                <span>{c.robot_a} ↔ {c.robot_b}</span>
                <span className="text-cyan-400">{c.resource_id || 'Cross Trajectory'}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-300 mt-1">
                <div>Winner: <strong className="text-emerald-400 font-mono">{c.winner_robot}</strong></div>
                <div>Action: <strong className="text-amber-400 font-mono">{c.action}</strong></div>
                <div className="text-emerald-400 font-semibold">{c.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
