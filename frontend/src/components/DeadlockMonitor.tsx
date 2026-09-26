import React from 'react';
import { DeadlockEvent } from '../types';
import { RefreshCw, GitCommit, CheckCircle, Zap } from 'lucide-react';

interface DeadlockMonitorProps {
  recentDeadlocks: DeadlockEvent[];
  deadlockCount: number;
  avgRecoveryTimeSec: number;
  onTriggerDeadlock: () => void;
}

export const DeadlockMonitor: React.FC<DeadlockMonitorProps> = ({
  recentDeadlocks,
  deadlockCount,
  avgRecoveryTimeSec,
  onTriggerDeadlock
}) => {
  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Wait-For Deadlock Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>Deadlocks: <strong className="text-rose-400">{deadlockCount}</strong></span>
            <span>Avg Rec: <strong className="text-emerald-400">{avgRecoveryTimeSec}s</strong></span>
          </div>
          <button
            onClick={onTriggerDeadlock}
            className="text-[10px] font-semibold bg-rose-950/70 border border-rose-600/70 text-rose-300 hover:bg-rose-900 px-2 py-0.5 rounded transition cursor-pointer"
          >
            + Inject Deadlock
          </button>
        </div>
      </div>

      {recentDeadlocks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-6">
          <CheckCircle size={22} className="mb-1 text-emerald-500/60" />
          <span>Directed graph acyclic — Zero active deadlocks</span>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
          {recentDeadlocks.map((d, idx) => (
            <div
              key={d.id || idx}
              className="bg-[#0e1628] border border-rose-900/50 rounded-md p-2.5 text-[11px]"
            >
              <div className="flex items-center justify-between font-mono font-bold mb-1 text-rose-400">
                <div className="flex items-center gap-1.5">
                  <GitCommit size={14} className="text-rose-400" />
                  <span>DEADLOCK #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                </div>
                <span className="text-emerald-400 text-[10px] font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {d.status} ({d.recovery_time_sec}s)
                </span>
              </div>

              {/* Cycle Chain */}
              <div className="font-mono text-[11px] bg-black/40 p-1.5 rounded border border-[#1e293b] text-slate-300 my-1.5">
                <span className="text-slate-400">Wait Cycle: </span>
                {d.participants.map((p, i) => (
                  <span key={p} className="font-semibold text-rose-300">
                    {p} {i < d.participants.length - 1 ? '→ ' : '↺'}
                  </span>
                ))}
              </div>

              <div className="text-[10px] text-slate-300 space-y-0.5">
                <div>
                  <span className="text-slate-400">Resolution: </span>
                  <span className="font-semibold text-amber-300 font-mono">{d.resolution_action}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#1e293b] text-[10px]">
                  <span className="text-slate-400">Recovery Time: <strong className="text-cyan-400 font-mono">{d.recovery_time_sec} sec</strong></span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Zap size={10} /> CONTINUED
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
