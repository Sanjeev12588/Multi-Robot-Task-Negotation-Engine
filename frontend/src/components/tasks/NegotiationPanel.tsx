import React from 'react';
import { Task, BidDetail } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { Award, CheckCircle2, ShieldCheck, Battery, MapPin, AlertTriangle, ArrowRightLeft } from 'lucide-react';

interface NegotiationPanelProps {
  task: Task;
  bids: BidDetail[];
  onReassignTask: (taskId: string) => void;
}

export const NegotiationPanel: React.FC<NegotiationPanelProps> = ({
  task,
  bids,
  onReassignTask,
}) => {
  const winningRobotId = task.owner_robot_id || 'R-021';

  // Sample or actual candidate bids
  const candidateBids = bids.length > 0 ? bids : [
    {
      robot_id: 'R-021',
      task_id: task.id,
      score: 92.4,
      capability_score: 1.0,
      priority_fit: 1.0,
      battery_score: 0.95,
      workload_score: 0.9,
      distance_score: 0.88,
      collision_penalty: 0.0,
      deadline_risk: 0.0,
      reason: 'Capability Match, High Battery, Low Distance',
      timestamp: Date.now(),
    },
    {
      robot_id: 'R-043',
      task_id: task.id,
      score: 81.7,
      capability_score: 1.0,
      priority_fit: 0.9,
      battery_score: 0.85,
      workload_score: 0.8,
      distance_score: 0.75,
      collision_penalty: 0.0,
      deadline_risk: 0.05,
      reason: 'Battery Feasible, Moderate Workload',
      timestamp: Date.now(),
    },
    {
      robot_id: 'R-[104]',
      task_id: task.id,
      score: 74.5,
      capability_score: 0.9,
      priority_fit: 0.8,
      battery_score: 0.7,
      workload_score: 0.75,
      distance_score: 0.65,
      collision_penalty: 0.1,
      deadline_risk: 0.0,
      reason: 'Moderate Distance',
      timestamp: Date.now(),
    },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Task Details Card */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
          <div>
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Task Details</span>
            <h3 className="text-lg font-extrabold text-slate-900 leading-none mt-0.5">{task.id}</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full badge-blue text-xs font-bold">{task.status}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block">Pickup</span>
            <span className="font-mono font-bold text-slate-800">
              ({task.pickup_x.toFixed(1)}, {task.pickup_y.toFixed(1)})
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Drop</span>
            <span className="font-mono font-bold text-slate-800">
              ({task.drop_x.toFixed(1)}, {task.drop_y.toFixed(1)})
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Payload</span>
            <span className="font-bold text-slate-800">{task.payload} kg</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block">Required Capability</span>
            <span className="font-bold text-blue-600">{task.required_capability || 'STANDARD_CARRIER'}</span>
          </div>
        </div>
      </GlassCard>

      {/* Winner Card */}
      <GlassCard className="p-4 border-2 border-emerald-500/40 bg-emerald-50/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
              Auction Winner
            </span>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Score: 92.4 / 100
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <h4 className="text-xl font-black text-slate-900 leading-none">{winningRobotId}</h4>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              Awarded via Decentralized Bidding Protocol
            </p>
          </div>
          <button
            onClick={() => onReassignTask(task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Reassign Task
          </button>
        </div>

        {/* Award Reason Badges */}
        <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Capability Match
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
            <Battery className="w-3 h-3 text-emerald-600" /> Battery Feasible
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
            <MapPin className="w-3 h-3 text-emerald-600" /> Low Distance
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-white text-emerald-800 rounded-lg border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Low Conflict Risk
          </span>
        </div>
      </GlassCard>

      {/* Live Candidate Bids Table */}
      <GlassCard className="p-4">
        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-3">
          Negotiation Candidates & Bids
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
                <th className="pb-2">Robot</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Capability</th>
                <th className="pb-2">Battery</th>
                <th className="pb-2">Distance</th>
                <th className="pb-2">Workload</th>
                <th className="pb-2">Bid Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {candidateBids.map((b, idx) => (
                <tr key={idx} className={b.robot_id === winningRobotId ? 'bg-emerald-50/60 font-bold' : ''}>
                  <td className="py-2.5 font-bold text-slate-900">{b.robot_id}</td>
                  <td className="py-2.5 text-slate-500">Carrier</td>
                  <td className="py-2.5 text-emerald-600 font-bold">100%</td>
                  <td className="py-2.5 font-mono">91%</td>
                  <td className="py-2.5 font-mono">12m</td>
                  <td className="py-2.5">23%</td>
                  <td className="py-2.5 font-mono font-bold text-blue-600">{b.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
