import React, { useState } from 'react';
import { ConflictEvent, DeadlockEvent } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { DeadlockGraph } from './DeadlockGraph';
import { AlertTriangle, Repeat, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface ConflictsPageProps {
  conflicts: ConflictEvent[];
  deadlocks: DeadlockEvent[];
  onTriggerConflict: () => void;
  onTriggerDeadlock: () => void;
}

export const ConflictsPage: React.FC<ConflictsPageProps> = ({
  conflicts,
  deadlocks,
  onTriggerConflict,
  onTriggerDeadlock,
}) => {
  const [activeTab, setActiveTab] = useState<'conflicts' | 'deadlocks'>('conflicts');
  const [selectedConflict, setSelectedConflict] = useState<ConflictEvent | null>(conflicts[0] || null);

  const currentConflict = selectedConflict || conflicts[0] || {
    id: 'C-101',
    timestamp: Date.now(),
    robot_a: 'R-012',
    robot_b: 'R-043',
    resource_id: 'Corridor C-07',
    conflict_type: 'HEAD_ON_CORRIDOR',
    eta_seconds: 2.4,
    winner_robot: 'R-012',
    loser_robot: 'R-043',
    action: 'R-043 Yields & Waits at Siding',
    status: 'RESOLVED',
    detail: 'Corridor C-07 right-of-way assigned to higher priority heavy carrier R-012.',
  };

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Conflicts & Deadlocks</h2>
          <p className="text-xs font-semibold text-slate-500">
            Real-time Collision Prediction & Spatial Resource Arbitration Engine
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-slate-200/60 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'conflicts' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Conflicts ({conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab('deadlocks')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'deadlocks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Deadlocks ({deadlocks.length})
          </button>
        </div>
      </div>

      {activeTab === 'conflicts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Conflicts List (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <GlassCard className="p-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-500">
                Active Conflict Events ({conflicts.length})
              </span>
              <button
                onClick={onTriggerConflict}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                + Inject Corridor Conflict
              </button>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 px-3">Conflict ID</th>
                    <th className="py-2.5 px-3">Robot A</th>
                    <th className="py-2.5 px-3">Robot B</th>
                    <th className="py-2.5 px-3">Resource</th>
                    <th className="py-2.5 px-3">Winner</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                  {(conflicts.length > 0 ? conflicts : [currentConflict]).map((conf) => (
                    <tr
                      key={conf.id}
                      onClick={() => setSelectedConflict(conf)}
                      className="hover:bg-slate-100/50 cursor-pointer transition"
                    >
                      <td className="py-2.5 px-3 font-bold text-orange-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {conf.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{conf.robot_a}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{conf.robot_b}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-semibold">{conf.resource_id || 'Corridor C-07'}</td>
                      <td className="py-2.5 px-3 text-emerald-600 font-bold">{conf.winner_robot}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full badge-emerald text-[10px] font-bold">
                          {conf.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>

          {/* Right Conflict Schematic Preview (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <h3 className="font-extrabold text-sm text-slate-900">Conflict Details & Schematic</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full badge-orange text-[10px] font-bold">
                  HIGH SEVERITY
                </span>
              </div>

              {/* Schematic Illustration */}
              <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Narrow Corridor C-07 Intersection
                </span>

                <div className="flex items-center justify-between w-full px-4">
                  {/* Robot A */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                      {currentConflict.robot_a}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-1">Winner (Priority)</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center px-2">
                    <div className="h-0.5 w-full bg-slate-300 relative flex items-center justify-center">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-extrabold rounded-full border border-orange-200">
                        Collision ETA {currentConflict.eta_seconds}s
                      </span>
                    </div>
                  </div>

                  {/* Robot B */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                      {currentConflict.robot_b}
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 mt-1">Yielding Node</span>
                  </div>
                </div>
              </div>

              {/* Resolution Explanation */}
              <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Right-of-Way Winner:</span>
                  <span className="font-bold text-emerald-600">{currentConflict.winner_robot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Yielding Robot:</span>
                  <span className="font-bold text-rose-600">{currentConflict.loser_robot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Arbitration Action:</span>
                  <span className="font-bold text-slate-800">{currentConflict.action}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        <DeadlockGraph deadlocks={deadlocks} onResolve={onTriggerDeadlock} />
      )}
    </div>
  );
};
