import React from 'react';
import { FleetMetrics } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AnalyticsPageProps {
  metrics: FleetMetrics | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ metrics }) => {
  const efficiency = metrics ? (metrics.mission_continuity_rate * 100).toFixed(1) : '92.4';
  const successRate = metrics ? (metrics.task_allocation_success_rate * 100).toFixed(1) : '98.1';
  const latency = metrics ? Math.round(metrics.average_allocation_latency_ms) : 142;
  const throughput = metrics ? Math.round(metrics.simulation_throughput_tps * 3600) || 153 : 153;

  const throughputData = [
    { time: '10:00', tasks: 120 },
    { time: '10:15', tasks: 135 },
    { time: '10:30', tasks: 142 },
    { time: '10:45', tasks: 160 },
    { time: '11:00', tasks: 153 },
  ];

  const batteryTrendData = [
    { time: '10:00', level: 88 },
    { time: '10:15', level: 82 },
    { time: '10:30', level: 78 },
    { time: '10:45', level: 75 },
    { time: '11:00', level: 73 },
  ];

  const conflictCountData = [
    { time: '10:00', conflicts: 4 },
    { time: '10:15', conflicts: 7 },
    { time: '10:30', conflicts: 12 },
    { time: '10:45', conflicts: 9 },
    { time: '11:00', conflicts: 14 },
  ];

  const tasksCompletedData = [
    { name: 'Fast Picker', value: 142, color: '#059669' },
    { name: 'Standard Carrier', value: 110, color: '#2563EB' },
    { name: 'Heavy Carrier', value: 65, color: '#EA580C' },
    { name: 'Support Robot', value: 25, color: '#64748B' },
  ];

  const robotPerformance = [
    { type: 'Fast Picker', active: 142, completed: 182, efficiency: '96.4%', battery: '76.2%', latency: '118 ms' },
    { type: 'Standard Carrier', active: 200, completed: 156, efficiency: '94.1%', battery: '71.8%', latency: '148 ms' },
    { type: 'Heavy Carrier', active: 108, completed: 86, efficiency: '91.2%', battery: '68.5%', latency: '165 ms' },
    { type: 'Support Robot', active: 50, completed: 32, efficiency: '98.0%', battery: '82.0%', latency: '95 ms' },
  ];

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Analytics & Metrics</h2>
          <p className="text-xs font-semibold text-slate-500">
            Real-Time Mission Intelligence & Fleet Optimization Metrics
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Fleet Efficiency</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{efficiency}%</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">+2.4% vs last hour</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Task Success Rate</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{successRate}%</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-blue-700 font-semibold mt-1">Auction Bidding Feasible</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Allocation Latency</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{latency} ms</span>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">Sub-200ms Target</p>
        </GlassCard>

        <GlassCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Task Throughput</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{throughput} /hr</span>
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">500 AMR Simulation</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Task Throughput Area Chart */}
        <GlassCard className="p-5 space-y-3">
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            Task Throughput Over Time
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip />
                <Area type="monotone" dataKey="tasks" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorThroughput)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Battery Usage Trend Line Chart */}
        <GlassCard className="p-5 space-y-3">
          <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            Average Battery Utilization Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={batteryTrendData}>
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[50, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="level" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Robot Type Performance Breakdown Table */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
          Performance by Robot Type
        </h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400">
              <th className="pb-2">Robot Type</th>
              <th className="pb-2">Active Count</th>
              <th className="pb-2">Completed Tasks</th>
              <th className="pb-2">Efficiency</th>
              <th className="pb-2">Avg Battery</th>
              <th className="pb-2">Avg Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
            {robotPerformance.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-100/50 transition">
                <td className="py-3 font-bold text-slate-900">{row.type}</td>
                <td className="py-3 font-bold text-blue-600">{row.active}</td>
                <td className="py-3 font-bold text-slate-800">{row.completed}</td>
                <td className="py-3 text-emerald-600 font-bold">{row.efficiency}</td>
                <td className="py-3 font-mono">{row.battery}</td>
                <td className="py-3 font-mono text-slate-500">{row.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
