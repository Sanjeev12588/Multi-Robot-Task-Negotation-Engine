import React from 'react';
import { RobotFailureEvent } from '../types';
import { ShieldCheck, AlertOctagon, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';

interface FailureRecoveryPanelProps {
  recentFailures: RobotFailureEvent[];
  coordinatorOnline: boolean;
  localAutonomyActive: boolean;
  onFailRobot: (robotId: string) => void;
  onToggleCoordinator: () => void;
}

export const FailureRecoveryPanel: React.FC<FailureRecoveryPanelProps> = ({
  recentFailures,
  coordinatorOnline,
  localAutonomyActive,
  onFailRobot,
  onToggleCoordinator
}) => {
  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-rose-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Failure Recovery & Autonomy</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFailRobot('R127')}
            className="text-[10px] font-semibold bg-rose-950/80 border border-rose-600/80 text-rose-300 hover:bg-rose-900 px-2 py-0.5 rounded transition cursor-pointer"
          >
            ! Fail R127
          </button>
          <button
            onClick={onToggleCoordinator}
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition cursor-pointer ${
              coordinatorOnline
                ? 'bg-amber-950/80 border-amber-600/80 text-amber-300 hover:bg-amber-900'
                : 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 hover:bg-emerald-900'
            }`}
          >
            {coordinatorOnline ? 'Disconnect Coord' : 'Reconnect Coord'}
          </button>
        </div>
      </div>

      {/* Central Coordinator Autonomy Status Banner */}
      <div className={`p-2.5 rounded-md border text-[11px] mb-2.5 flex items-center justify-between ${
        coordinatorOnline
          ? 'bg-slate-900/60 border-slate-700/60 text-slate-300'
          : 'bg-amber-950/40 border-amber-600/60 text-amber-200'
      }`}>
        <div className="flex items-center gap-2">
          <Radio size={14} className={coordinatorOnline ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} />
          <div>
            <div className="font-mono font-bold text-xs">
              {coordinatorOnline ? 'CENTRAL COORDINATOR: ONLINE' : 'CENTRAL COORDINATOR: OFFLINE'}
            </div>
            <div className="text-[10px] text-slate-400">
              {coordinatorOnline ? 'Global telemetry aggregator active' : 'LOCAL AUTONOMY ACTIVE (Robots negotiating P2P)'}
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
          coordinatorOnline
            ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
            : 'bg-amber-950 border-amber-700 text-amber-400'
        }`}>
          {coordinatorOnline ? 'OPTIMAL' : 'CONTINUING'}
        </span>
      </div>

      {/* Recent Failure Recovery Cards */}
      {recentFailures.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-4">
          <CheckCircle2 size={20} className="mb-1 text-emerald-500/60" />
          <span>Zero hardware dropouts recorded</span>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
          {recentFailures.map((f, idx) => (
            <div key={f.id || idx} className="bg-[#080d19] border border-[#1a2336] rounded-md p-2 text-[11px]">
              <div className="flex items-center justify-between font-mono font-bold text-rose-400 mb-1">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon size={13} />
                  <span>ROBOT FAILURE: {f.robot_id} OFFLINE</span>
                </div>
                <span className="text-emerald-400 text-[10px]">Continuity: {f.mission_continuity}%</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 my-1 bg-black/30 p-1.5 rounded">
                <div>
                  <span className="text-slate-400">Affected Tasks: </span>
                  <span className="text-rose-300">{f.affected_tasks.length > 0 ? f.affected_tasks.join(', ') : 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Recovered: </span>
                  <span className="text-emerald-400 font-bold">
                    {f.reassigned_tasks.length}/{f.affected_tasks.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Recovery Latency: <strong className="text-cyan-400 font-mono">{f.recovery_time_sec} sec</strong></span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <RefreshCw size={10} /> REASSIGNED
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
