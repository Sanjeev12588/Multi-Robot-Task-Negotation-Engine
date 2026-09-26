import React from 'react';
import { BidDetail } from '../types';
import { Gavel, Award, TrendingUp, Cpu } from 'lucide-react';

interface TaskNegotiationPanelProps {
  recentBids: BidDetail[];
  allocationLatencyMs: number;
  successRate: number;
}

export const TaskNegotiationPanel: React.FC<TaskNegotiationPanelProps> = ({
  recentBids,
  allocationLatencyMs,
  successRate
}) => {
  // Group bids by task_id
  const groupedBids: Record<string, BidDetail[]> = {};
  recentBids.forEach(b => {
    if (!groupedBids[b.task_id]) {
      groupedBids[b.task_id] = [];
    }
    groupedBids[b.task_id].push(b);
  });

  const taskIds = Object.keys(groupedBids).slice(0, 3);

  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <Gavel size={16} className="text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Task Negotiation & Bidding</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">
            Latency: <strong className="text-cyan-400">{allocationLatencyMs}ms</strong>
          </span>
          <span className="text-slate-400">
            Success: <strong className="text-emerald-400">{successRate}%</strong>
          </span>
        </div>
      </div>

      {taskIds.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs py-6">
          <Cpu size={24} className="mb-1 text-slate-600 animate-pulse" />
          <span>Awaiting task broadcast auctions...</span>
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto max-h-[280px] pr-1">
          {taskIds.map(tid => {
            const bids = groupedBids[tid];
            const sortedBids = [...bids].sort((a, b) => b.score - a.score);
            const winner = sortedBids[0];

            return (
              <div key={tid} className="bg-[#080d18] border border-[#1a2336] rounded-md p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-cyan-400">TASK {tid}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {sortedBids.length} Candidate Bids
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                    <Award size={12} />
                    <span>WINNER → {winner.robot_id}</span>
                  </div>
                </div>

                {/* Candidate Bids List */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {sortedBids.map(b => (
                    <div
                      key={b.robot_id}
                      className={`text-[10px] font-mono p-1 rounded border flex items-center justify-between ${
                        b.robot_id === winner.robot_id
                          ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300'
                          : 'bg-[#0f172a]/60 border-[#1e293b] text-slate-400'
                      }`}
                    >
                      <span>{b.robot_id}</span>
                      <span className="font-bold">{b.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>

                {/* Winner Reason Breakdown */}
                <div className="text-[10px] text-slate-400 bg-[#0d1527] p-1.5 rounded border border-[#16223b] flex items-start gap-1.5">
                  <TrendingUp size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-300">Award Reason: </span>
                    <span className="font-mono text-slate-400">{winner.reason}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
