import React from 'react';
import { BatteryCharging, BatteryWarning, BatteryMedium, Battery, ArrowRight } from 'lucide-react';

interface BatteryMonitorProps {
  robots: any[][]; // [id, type_idx, x, y, status_idx, battery, current_task, heading]
  reassignmentsCount: number;
  avgBattery: number;
  onDrainBattery: (robotId: string, level: number) => void;
}

export const BatteryMonitor: React.FC<BatteryMonitorProps> = ({
  robots,
  reassignmentsCount,
  avgBattery,
  onDrainBattery
}) => {
  // Categorize
  let normalCount = 0;
  let lowCount = 0;
  let criticalCount = 0;
  let chargingCount = 0;

  robots.forEach(r => {
    const batt = r[5];
    const status = r[4];
    if (status === 5) chargingCount++;
    else if (batt > 40) normalCount++;
    else if (batt >= 20) lowCount++;
    else criticalCount++;
  });

  return (
    <div className="bg-[#0b111e] border border-[#1e293b] rounded-lg p-3 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2.5">
        <div className="flex items-center gap-2">
          <BatteryCharging size={16} className="text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Battery-Aware Scheduling</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Reassigned: <strong className="text-amber-400">{reassignmentsCount}</strong>
          </span>
          <button
            onClick={() => onDrainBattery('R023', 17.0)}
            className="text-[10px] font-semibold bg-emerald-950/70 border border-emerald-600/70 text-emerald-300 hover:bg-emerald-900 px-2 py-0.5 rounded transition cursor-pointer"
          >
            ⚡ Drain R023 (17%)
          </button>
        </div>
      </div>

      {/* Distribution Counters */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-[#090e1a] border border-emerald-900/40 p-2 rounded text-center">
          <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1 font-semibold">
            <Battery size={12} /> Normal
          </div>
          <div className="text-base font-bold font-mono text-white mt-0.5">{normalCount}</div>
          <div className="text-[9px] text-slate-500">&gt;40%</div>
        </div>

        <div className="bg-[#090e1a] border border-amber-900/40 p-2 rounded text-center">
          <div className="text-[10px] text-amber-400 flex items-center justify-center gap-1 font-semibold">
            <BatteryMedium size={12} /> Low
          </div>
          <div className="text-base font-bold font-mono text-white mt-0.5">{lowCount}</div>
          <div className="text-[9px] text-slate-500">20-40%</div>
        </div>

        <div className="bg-[#090e1a] border border-rose-900/40 p-2 rounded text-center">
          <div className="text-[10px] text-rose-400 flex items-center justify-center gap-1 font-semibold">
            <BatteryWarning size={12} /> Critical
          </div>
          <div className="text-base font-bold font-mono text-white mt-0.5">{criticalCount}</div>
          <div className="text-[9px] text-slate-500">&lt;20%</div>
        </div>

        <div className="bg-[#090e1a] border border-cyan-900/40 p-2 rounded text-center">
          <div className="text-[10px] text-cyan-400 flex items-center justify-center gap-1 font-semibold">
            <BatteryCharging size={12} /> Charging
          </div>
          <div className="text-base font-bold font-mono text-white mt-0.5">{chargingCount}</div>
          <div className="text-[9px] text-slate-500">15 Hubs</div>
        </div>
      </div>

      {/* Energy Safety Envelope Decision Card */}
      <div className="bg-[#070b14] border border-[#1a253d] rounded-md p-2 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
          <span className="text-cyan-400">R023 Autonomous Energy Guard</span>
          <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">DEFICIT GUARD</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 mb-1.5">
          <div>Current Battery: <strong className="text-amber-400">17.0%</strong></div>
          <div>Est Task Energy: <strong className="text-slate-200">24.2%</strong></div>
        </div>
        <div className="flex items-center justify-between bg-black/40 p-1.5 rounded border border-[#1e293b] text-[10px]">
          <div className="flex items-center gap-1 text-rose-400 font-bold">
            <span>Decision:</span>
            <span className="bg-rose-950 px-1.5 py-0.5 rounded">REASSIGN</span>
          </div>
          <div className="text-slate-400">
            Reason: <span className="text-slate-300">insufficient energy margin</span>
          </div>
        </div>
      </div>
    </div>
  );
};
