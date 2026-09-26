import React from 'react';
import { FleetMetrics } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { ServerOff, CheckCircle2, ShieldAlert, Cpu, Zap, Wifi, ArrowRight } from 'lucide-react';

interface CoordinatorStatusProps {
  metrics: FleetMetrics | null;
  onToggleCoordinator: () => void;
}

export const CoordinatorStatus: React.FC<CoordinatorStatusProps> = ({
  metrics,
  onToggleCoordinator,
}) => {
  const coordinatorOnline = metrics?.coordinator_online ?? true;

  const autonomyFeatures = [
    { label: 'Local Task Negotiation', status: 'ACTIVE', desc: 'Peer-to-peer auction protocol' },
    { label: 'Conflict Resolution', status: 'ACTIVE', desc: 'Corridor right-of-way arbitration' },
    { label: 'Collision Avoidance', status: 'ACTIVE', desc: 'Local trajectory prediction' },
    { label: 'Deadlock Detection', status: 'ACTIVE', desc: 'Distributed wait-for cycle check' },
    { label: 'Battery Management', status: 'ACTIVE', desc: 'Local energy feasibility checks' },
    { label: 'Failure Recovery', status: 'ACTIVE', desc: 'Peer task re-auctions' },
    { label: 'Path Planning', status: 'ACTIVE', desc: 'A* spatial path navigation' },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Primary Coordinator Switcher Banner */}
      <GlassCard className={`p-6 border-2 transition-all ${coordinatorOnline ? 'border-emerald-500/40' : 'border-rose-500/40 bg-rose-50/20'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${coordinatorOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
              <ServerOff className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Central Coordinator Status</h3>
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${coordinatorOnline ? 'badge-emerald' : 'badge-red'}`}>
                  {coordinatorOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {coordinatorOnline
                  ? 'Centralized monitoring active. Toggle button to test complete system fault tolerance.'
                  : 'Central server disabled! Mission control running on 100% peer-to-peer local autonomy.'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleCoordinator}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 ${
              coordinatorOnline
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <ServerOff className="w-4 h-4" />
            {coordinatorOnline ? 'Fail Central Coordinator' : 'Restore Coordinator'}
          </button>
        </div>
      </GlassCard>

      {/* Local Autonomy Active Dashboard */}
      {!coordinatorOnline && (
        <GlassCard className="p-6 bg-gradient-to-r from-blue-50/60 to-emerald-50/60 border border-blue-200/80 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">LOCAL AUTONOMY ACTIVE</h3>
              <p className="text-xs font-semibold text-slate-600">
                Fleet is operating in decentralized mode. All in-field offline functions are running on peer-to-peer coordination.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {autonomyFeatures.map((feat, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/90 border border-white shadow-2xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{feat.label}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">{feat.desc}</p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {feat.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};
