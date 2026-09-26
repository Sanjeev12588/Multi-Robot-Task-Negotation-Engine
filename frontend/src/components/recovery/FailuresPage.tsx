import React, { useState } from 'react';
import { FleetMetrics, RobotDetail, RobotFailureEvent } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { CoordinatorStatus } from './CoordinatorStatus';
import { ShieldAlert, XCircle, CheckCircle2, ArrowRight, RefreshCw, Cpu } from 'lucide-react';

interface FailuresPageProps {
  metrics: FleetMetrics | null;
  robots: RobotDetail[];
  failures: RobotFailureEvent[];
  onFailRobot: (robotId: string) => void;
  onToggleCoordinator: () => void;
}

export const FailuresPage: React.FC<FailuresPageProps> = ({
  metrics,
  robots,
  failures,
  onFailRobot,
  onToggleCoordinator,
}) => {
  const [activeTab, setActiveTab] = useState<'failures' | 'coordinator'>('failures');
  const [selectedRobotId, setSelectedRobotId] = useState<string>(robots[0]?.id || 'R-005');
  const [failureType, setFailureType] = useState<string>('HARDWARE');

  const recoverySteps = [
    { step: 1, label: 'Failure Detected', time: '10:24:30', status: 'COMPLETE' },
    { step: 2, label: 'Tasks Released', time: '10:24:31', status: 'COMPLETE' },
    { step: 3, label: 'Peer Auction', time: '10:24:32', status: 'COMPLETE' },
    { step: 4, label: 'New Owner Selected', time: '10:24:33', status: 'COMPLETE' },
    { step: 5, label: 'Mission Resumed', time: '10:24:34', status: 'COMPLETE' },
  ];

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Failures & Recovery</h2>
          <p className="text-xs font-semibold text-slate-500">
            Self-Healing Multi-Agent Failure Mitigation Protocol
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="bg-slate-200/60 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('failures')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'failures' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Robot Failures
          </button>
          <button
            onClick={() => setActiveTab('coordinator')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'coordinator' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Coordinator Status
          </button>
        </div>
      </div>

      {activeTab === 'failures' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Failure Simulation Form (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Failure Simulation</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Robot</label>
                  <select
                    value={selectedRobotId}
                    onChange={(e) => setSelectedRobotId(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:outline-none"
                  >
                    {robots.slice(0, 30).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} ({r.robot_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Failure Type</label>
                  <select
                    value={failureType}
                    onChange={(e) => setFailureType(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="HARDWARE">Hardware Failure (Motor Drive)</option>
                    <option value="SENSOR">Sensor Failure (LiDAR Malfunction)</option>
                    <option value="COMM">Communication Timeout (Packet Loss)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => onFailRobot(selectedRobotId)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                Simulate Robot Failure
              </button>
            </GlassCard>

            {/* Quick Metrics */}
            <GlassCard className="p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Recovery Success Rate:</span>
                <span className="font-bold text-emerald-600">100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Avg Recovery Latency:</span>
                <span className="font-mono font-bold text-slate-900">1.7 sec</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Mission Continuity Rate:</span>
                <span className="font-bold text-blue-600">98.5%</span>
              </div>
            </GlassCard>
          </div>

          {/* Recovery Overview & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Active Recovery Status Card */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">Active Recovery Log</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full badge-emerald text-xs font-bold">
                  AUTONOMOUS RECOVERY READY
                </span>
              </div>

              {/* Recovery Step Timeline */}
              <div className="bg-slate-100/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                  Self-Healing Recovery Sequence
                </h4>

                <div className="flex items-center justify-between">
                  {recoverySteps.map((step, idx) => (
                    <React.Fragment key={step.step}>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {step.step}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 mt-1.5 leading-tight">
                          {step.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 mt-0.5">{step.time}</span>
                      </div>

                      {idx < recoverySteps.length - 1 && (
                        <div className="h-0.5 flex-1 bg-emerald-300 mx-2" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Affected Tasks Re-Auction Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Reassigned Tasks Summary
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
                        <th className="pb-2">Task ID</th>
                        <th className="pb-2">Previous Owner</th>
                        <th className="pb-2">New Owner</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="py-2 font-bold text-blue-600">T-145</td>
                        <td className="py-2 text-rose-600 font-bold">R-127 (Failed)</td>
                        <td className="py-2 text-emerald-600 font-bold">R-087</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded-full badge-emerald text-[10px] font-bold">
                            Reassigned
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-blue-600">T-146</td>
                        <td className="py-2 text-rose-600 font-bold">R-127 (Failed)</td>
                        <td className="py-2 text-emerald-600 font-bold">R-091</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded-full badge-emerald text-[10px] font-bold">
                            Reassigned
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        <CoordinatorStatus metrics={metrics} onToggleCoordinator={onToggleCoordinator} />
      )}
    </div>
  );
};
