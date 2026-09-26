import React from 'react';
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  AlertTriangle,
  BatteryCharging,
  ShieldAlert,
  BarChart3,
  Zap,
  GitMerge,
  Repeat,
  BatteryLow,
  XCircle,
  ServerOff,
  RotateCcw,
  Clock,
  Gauge,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTriggerScenario: (scenario: string) => void;
  simTime?: number;
  speed?: number;
  setSpeed?: (speed: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onTriggerScenario,
  simTime = 0,
  speed = 1,
  setSpeed,
}) => {
  const navItems = [
    { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'fleet', label: 'Fleet', icon: Bot },
    { id: 'tasks', label: 'Tasks & Negotiation', icon: GitBranch },
    { id: 'coordination', label: 'Conflicts & Deadlocks', icon: AlertTriangle },
    { id: 'battery', label: 'Battery Management', icon: BatteryCharging },
    { id: 'failures', label: 'Failures & Recovery', icon: ShieldAlert },
    { id: 'analytics', label: 'Analytics & Metrics', icon: BarChart3 },
  ];

  const scenarioItems = [
    { id: 'emergency-surge', label: 'Emergency Surge', icon: Zap },
    { id: 'corridor-conflict', label: 'Corridor Conflict', icon: GitMerge },
    { id: 'trigger-deadlock', label: 'Trigger Deadlock', icon: Repeat },
    { id: 'drain-battery', label: 'Drain Battery', icon: BatteryLow },
    { id: 'fail-robot', label: 'Fail Robot', icon: XCircle },
    { id: 'fail-coordinator', label: 'Fail Coordinator', icon: ServerOff },
    { id: 'reset-scenario', label: 'Reset Scenario', icon: RotateCcw, danger: true },
  ];

  const formatSimTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-64 h-screen bg-[#F8FAF9]/80 backdrop-blur-xl border-r border-[#D9DDDA] flex flex-col justify-between p-4 shrink-0 shadow-sm z-30 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Header Logo */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <img src="/fleetmind-logo.png" alt="FleetMind Logo" className="w-10 h-10 object-contain drop-shadow-xs" />
          <div>
            <h1 className="font-extrabold text-base leading-none tracking-tight text-slate-900">FleetMind</h1>
            <p className="text-[10px] font-semibold text-slate-500 mt-1">Multi-Robot Engine</p>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scenario Controls Section */}
        <div className="pt-2 border-t border-[#E2E5E3]">
          <h2 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            SCENARIO CONTROLS
          </h2>
          <div className="space-y-1">
            {scenarioItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTriggerScenario(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                    item.danger
                      ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.danger ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Simulation Time & Speed Footer */}
      <div className="pt-3 border-t border-[#E2E5E3] space-y-3">
        <div className="bg-slate-100/80 rounded-xl p-2.5 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Sim Time
            </span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              {formatSimTime(simTime)}
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Gauge className="w-3 h-3 text-slate-400" />
              Speed
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed?.(s)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    speed === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
