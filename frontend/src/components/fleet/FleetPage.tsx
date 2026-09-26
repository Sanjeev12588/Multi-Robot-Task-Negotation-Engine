import React, { useState } from 'react';
import { RobotDetail, RobotType, RobotStatus } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { RobotDetails } from './RobotDetails';
import { Search, Filter, Bot, Battery, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

interface FleetPageProps {
  robots: RobotDetail[];
  onDrainBattery: (robotId: string) => void;
  onFailRobot: (robotId: string) => void;
  onReassignTask: (taskId: string) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({
  robots,
  onDrainBattery,
  onFailRobot,
  onReassignTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRobot, setSelectedRobot] = useState<RobotDetail | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredRobots = robots.filter((r) => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || r.robot_type === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRobots.length / pageSize) || 1;
  const paginatedRobots = filteredRobots.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Fleet</h2>
          <p className="text-xs font-semibold text-slate-500">
            Managing 500+ Heterogeneous Autonomous Mobile Robots
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Robot ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="FAST_PICKER">Fast Picker</option>
            <option value="STANDARD_CARRIER">Standard Carrier</option>
            <option value="HEAVY_CARRIER">Heavy Carrier</option>
            <option value="SUPPORT_ROBOT">Support Robot</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="MOVING">Moving</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IDLE">Idle</option>
            <option value="CHARGING">Charging</option>
            <option value="FAILED">Failed</option>
            <option value="WAITING">Waiting</option>
          </select>
        </div>
      </GlassCard>

      {/* Fleet Table */}
      <GlassCard className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Robot ID</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Battery</th>
              <th className="py-3 px-4">Current Task</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Speed</th>
              <th className="py-3 px-4">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 text-xs font-medium text-slate-800">
            {paginatedRobots.map((robot) => (
              <tr
                key={robot.id}
                onClick={() => setSelectedRobot(robot)}
                className="hover:bg-slate-200/40 cursor-pointer transition"
              >
                <td className="py-3 px-4 font-bold text-blue-600 flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-slate-400" />
                  {robot.id}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-600">{robot.robot_type}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      robot.status === 'FAILED'
                        ? 'badge-red'
                        : robot.status === 'CHARGING'
                        ? 'badge-orange'
                        : robot.status === 'MOVING' || robot.status === 'ASSIGNED'
                        ? 'badge-blue'
                        : 'badge-emerald'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {robot.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 w-28">
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          robot.battery <= 20 ? 'bg-rose-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${robot.battery}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold shrink-0">
                      {Math.round(robot.battery)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 font-bold text-slate-700">
                  {robot.current_task || 'Unassigned'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">
                  ({robot.x.toFixed(1)}, {robot.y.toFixed(1)})
                </td>
                <td className="py-3 px-4 font-semibold">{robot.speed} m/s</td>
                <td className="py-3 px-4 text-emerald-600 font-bold">{Math.round(robot.health)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="p-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredRobots.length)} of {filteredRobots.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Robot Detail Glass Drawer */}
      {selectedRobot && (
        <RobotDetails
          robot={selectedRobot}
          onClose={() => setSelectedRobot(null)}
          onDrainBattery={onDrainBattery}
          onFailRobot={onFailRobot}
          onReassignTask={onReassignTask}
        />
      )}
    </div>
  );
};
