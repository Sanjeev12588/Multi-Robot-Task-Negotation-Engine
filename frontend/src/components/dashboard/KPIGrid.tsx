import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { FleetMetrics } from '../../types';
import { GitBranch, CheckCircle2, AlertTriangle, RefreshCw, ArrowRightLeft, BatteryCharging, TrendingUp, TrendingDown } from 'lucide-react';

interface KPIGridProps {
  metrics: FleetMetrics | null;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ metrics }) => {
  const activeTasks = metrics?.active_tasks ?? 127;
  const completedTasks = metrics?.completed_tasks ?? 342;
  const conflicts = metrics?.conflict_count ?? 14;
  const deadlocks = metrics?.deadlock_count ?? 1;
  const reassignments = metrics?.reassigned_tasks_count ?? 17;
  const avgBattery = metrics ? Math.round(metrics.average_battery_utilization) : 72;

  const kpis = [
    {
      label: 'Active Tasks',
      value: activeTasks,
      unit: '',
      change: '+13.4%',
      isPositive: true,
      icon: GitBranch,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Completed Tasks',
      value: completedTasks,
      unit: '',
      change: '+18.7%',
      isPositive: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Active Conflicts',
      value: conflicts,
      unit: '',
      change: '+2.1%',
      isPositive: false,
      icon: AlertTriangle,
      iconBg: 'bg-orange-100 text-orange-600',
    },
    {
      label: 'Deadlocks Detected',
      value: deadlocks,
      unit: '',
      change: '0.0%',
      isPositive: true,
      icon: RefreshCw,
      iconBg: 'bg-rose-100 text-rose-600',
    },
    {
      label: 'Reassignments',
      value: reassignments,
      unit: '',
      change: '+12.0%',
      isPositive: true,
      icon: ArrowRightLeft,
      iconBg: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Avg Battery Level',
      value: `${avgBattery}%`,
      unit: '',
      change: 'Optimal',
      isPositive: true,
      icon: BatteryCharging,
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <GlassCard key={idx} className="p-3.5 flex flex-col justify-between hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${kpi.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div
                className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  kpi.isPositive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                    : 'bg-orange-50 text-orange-700 border border-orange-200/50'
                }`}
              >
                {kpi.isPositive ? (
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-orange-600" />
                )}
                <span>{kpi.change}</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="text-xl font-black text-slate-900 leading-none">{kpi.value}</span>
              <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{kpi.label}</p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
