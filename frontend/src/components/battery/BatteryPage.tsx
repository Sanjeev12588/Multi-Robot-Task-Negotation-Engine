import React, { useState } from 'react';
import { FleetMetrics, RobotDetail } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { BatteryCharging, BatteryLow, Zap, AlertTriangle, ShieldCheck, ArrowRightLeft, RefreshCw } from 'lucide-react';

interface BatteryPageProps {
  metrics: FleetMetrics | null;
  robots: RobotDetail[];
  onDrainBattery: (robotId: string) => void;
  onReassignTask: (taskId: string) => void;
}

export const BatteryPage: React.FC<BatteryPageProps> = ({
  metrics,
  robots,
  onDrainBattery,
  onReassignTask,
}) => {
  const [selectedRobot, setSelectedRobot] = useState<RobotDetail | null>(
    robots.find((r) => r.battery <= 30) || robots[0] || null
  );

  const avgBattery = metrics ? Math.round(metrics.average_battery_utilization) : 73;
  const criticalCount = robots.filter((r) => r.battery <= 20).length || 5;
  const chargingCount = metrics?.charging_robots || 12;

  const chargingStations = [
    { id: 'Station A-1', occupied: 1, capacity: 2, status: 'Charging R-042' },
    { id: 'Station A-2', occupied: 2, capacity: 2, status: 'Full (R-101, R-182)' },
    { id: 'Station B-1', occupied: 0, capacity: 2, status: 'Available' },
    { id: 'Station B-2', occupied: 1, capacity: 2, status: 'Charging R-204' },
  ];

  const currentRobot = selectedRobot || robots[0];
  const isFeasible = currentRobot ? currentRobot.battery > 25 : true;

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Battery Management</h2>
          <p className="text-xs font-semibold text-slate-500">
            Autonomous Battery-Aware Scheduling & Charging Station Optimization
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Average Battery</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{avgBattery}%</span>
            <BatteryCharging className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Optimal Operating Range</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Robots (&lt;20%)</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
            <BatteryLow className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">Requires Immediate Charging</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Currently Charging</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-orange-600">{chargingCount}</span>
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Across 6 Stations</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Available Chargers</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">6 / 12</span>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">50% Station Capacity</p>
        </GlassCard>
      </div>

      {/* Main Grid: Battery Distribution + Charging Stations + Feasibility Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Charging Stations & Distribution (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Charging Stations List */}
          <GlassCard className="p-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Charging Stations
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {chargingStations.map((st) => (
                <div key={st.id} className="p-3 rounded-xl bg-slate-100/70 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{st.id}</span>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      {st.occupied}/{st.capacity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">{st.status}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Low Battery Robots Table */}
          <GlassCard className="p-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Low Battery Warning List
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
                  <th className="pb-2">Robot ID</th>
                  <th className="pb-2">Battery</th>
                  <th className="pb-2">Current Task</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {robots
                  .filter((r) => r.battery <= 35)
                  .slice(0, 5)
                  .map((robot) => (
                    <tr
                      key={robot.id}
                      onClick={() => setSelectedRobot(robot)}
                      className="cursor-pointer hover:bg-slate-100/60 transition"
                    >
                      <td className="py-2.5 font-bold text-blue-600">{robot.id}</td>
                      <td className="py-2.5">
                        <span className="font-mono font-bold text-rose-600">{Math.round(robot.battery)}%</span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700">
                        {robot.current_task || 'None'}
                      </td>
                      <td className="py-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDrainBattery(robot.id);
                          }}
                          className="px-2 py-1 bg-orange-100 text-orange-800 font-semibold text-[10px] rounded-lg hover:bg-orange-200 transition"
                        >
                          Drain Battery
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </GlassCard>
        </div>

        {/* Right Feasibility Evaluator Drawer/Panel (5 cols) */}
        <div className="lg:col-span-5">
          {currentRobot ? (
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <h3 className="font-extrabold text-sm text-slate-900">Energy Feasibility Evaluator</h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600">{currentRobot.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-600 font-semibold">Current Battery Level:</span>
                  <span className="font-mono font-bold text-slate-900">{Math.round(currentRobot.battery)}%</span>
                </div>

                <div className="flex justify-between items-center bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-600 font-semibold">Energy Required for Route:</span>
                  <span className="font-mono font-bold text-slate-900">18.5%</span>
                </div>

                <div className="flex justify-between items-center bg-slate-100/70 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-600 font-semibold">Safe Energy Margin:</span>
                  <span className="font-mono font-bold text-slate-900">15.0%</span>
                </div>
              </div>

              {/* Decision Result Card */}
              <div
                className={`p-4 rounded-xl border-2 text-center space-y-1 ${
                  isFeasible
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider block">
                  {isFeasible ? 'TASK FEASIBLE' : 'TASK REASSIGNMENT REQUIRED'}
                </span>
                <p className="text-[11px] font-semibold opacity-90">
                  {isFeasible
                    ? 'Robot has sufficient charge margin to complete assigned delivery.'
                    : 'Battery low! Immediate task release and charger routing triggered.'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onDrainBattery(currentRobot.id)}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  Drain Battery Below 20% (Trigger Re-auction)
                </button>
              </div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    </div>
  );
};
