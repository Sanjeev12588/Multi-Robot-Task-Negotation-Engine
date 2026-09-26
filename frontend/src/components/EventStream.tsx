import React, { useState } from 'react';
import { SystemEvent } from '../types';
import { Terminal, Filter } from 'lucide-react';

interface EventStreamProps {
  events: SystemEvent[];
}

export const EventStream: React.FC<EventStreamProps> = ({ events }) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filtered = filterCategory === 'ALL'
    ? events
    : events.filter(e => e.category === filterCategory);

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'AUCTION':
        return 'text-cyan-400 bg-cyan-950/70 border-cyan-800/40';
      case 'CONFLICT':
        return 'text-amber-400 bg-amber-950/70 border-amber-800/40';
      case 'DEADLOCK':
        return 'text-rose-400 bg-rose-950/70 border-rose-800/40';
      case 'BATTERY':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800/40';
      case 'FAILURE':
        return 'text-rose-300 bg-red-950/90 border-red-700/60 font-bold';
      case 'COORDINATOR':
        return 'text-purple-400 bg-purple-950/70 border-purple-800/40';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Telemetry Event Stream</h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 text-[10px]">
          {['ALL', 'AUCTION', 'CONFLICT', 'DEADLOCK', 'FAILURE'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-1.5 py-0.5 rounded transition ${
                filterCategory === cat
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1.5 font-mono text-[11px] pr-1">
        {filtered.map(e => (
          <div
            key={e.id}
            className="flex items-start gap-2 bg-[#070b14] border border-[#141d30] p-1.5 rounded hover:border-[#1e2d4d] transition"
          >
            <span className="text-slate-500 shrink-0 text-[10px]">[T+{e.timestamp.toFixed(1)}s]</span>
            <span className={`text-[9px] px-1 py-0.5 rounded border uppercase shrink-0 font-semibold ${getBadgeStyle(e.category)}`}>
              {e.category}
            </span>
            <span className="text-slate-300 break-all leading-tight">
              {e.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
