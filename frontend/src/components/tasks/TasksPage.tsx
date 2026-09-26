import React, { useState } from 'react';
import { Task, BidDetail } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { NegotiationPanel } from './NegotiationPanel';
import { CreateTaskModal } from './CreateTaskModal';
import { GitBranch, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

interface TasksPageProps {
  tasks: Task[];
  recentBids: BidDetail[];
  onReassignTask: (taskId: string) => void;
  onCreateTask: (taskData: any) => Promise<any>;
}

export const TasksPage: React.FC<TasksPageProps> = ({
  tasks,
  recentBids,
  onReassignTask,
  onCreateTask,
}) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(tasks[0] || null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [lastCreatedNotice, setLastCreatedNotice] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'ACTIVE' && (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS')) ||
      (activeTab === 'COMPLETED' && t.status === 'COMPLETED') ||
      (activeTab === 'NEGOTIATING' && t.status === 'NEGOTIATING') ||
      (activeTab === 'UNASSIGNED' && t.status === 'UNASSIGNED');
    return matchesSearch && matchesTab;
  });

  const currentTask = selectedTask || filteredTasks[0] || tasks[0];

  const handleTaskCreated = async (data: any) => {
    const res = await onCreateTask(data);
    if (res && res.task) {
      setSelectedTask(res.task);
      setLastCreatedNotice(`Task ${res.task.id} created & awarded to ${res.winner || 'None'}`);
      setTimeout(() => setLastCreatedNotice(null), 6000);
    }
  };

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Tasks & Negotiation</h2>
          <p className="text-xs font-semibold text-slate-500">
            Decentralized Auction & Bidding Protocol Engine
          </p>
        </div>

        {/* Prominent Create Task Action */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          + Create Mission Task
        </button>
      </div>

      {/* Created Notice Alert */}
      {lastCreatedNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{lastCreatedNotice}</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 uppercase">Live Telemetry Updated</span>
        </div>
      )}

      {/* Main Grid: Left Tasks Table + Right Live Negotiation Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Tasks List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Tab Filter & Search */}
          <GlassCard className="p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
              {['ALL', 'ACTIVE', 'NEGOTIATING', 'COMPLETED', 'UNASSIGNED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl transition capitalize ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.toLowerCase()}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-2 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg w-32 focus:outline-none"
              />
            </div>
          </GlassCard>

          {/* Table */}
          <GlassCard className="overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Payload</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                {filteredTasks.map((task) => {
                  const isSelected = currentTask?.id === task.id;
                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-blue-50/80 font-bold border-l-4 border-blue-600' : 'hover:bg-slate-100/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-blue-600 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        {task.id}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : task.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{task.payload} kg</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {task.owner_robot_id || 'None'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full badge-emerald text-[10px] font-bold">
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </GlassCard>
        </div>

        {/* Right Live Negotiation Inspector (5 cols) */}
        <div className="lg:col-span-5">
          {currentTask ? (
            <NegotiationPanel
              task={currentTask}
              bids={recentBids.filter((b) => b.task_id === currentTask.id)}
              onReassignTask={onReassignTask}
            />
          ) : (
            <GlassCard className="p-8 text-center text-slate-400 text-xs">
              Select a task from the table to inspect live negotiation bids.
            </GlassCard>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTask={handleTaskCreated}
      />
    </div>
  );
};
