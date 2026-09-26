import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { X, Zap, GitMerge, Repeat, BatteryLow, XCircle, ServerOff, RotateCcw, Play } from 'lucide-react';

interface ScenarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerScenario: (scenario: string) => void;
}

export const ScenarioDrawer: React.FC<ScenarioDrawerProps> = ({
  isOpen,
  onClose,
  onTriggerScenario,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'emergency-surge',
      title: 'Emergency Surge',
      desc: 'Inject 25 high-priority tasks across the warehouse to test decentralized bidding capacity.',
      icon: Zap,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'corridor-conflict',
      title: 'Corridor Conflict',
      desc: 'Force two robots into a narrow corridor head-on collision path to evaluate right-of-way arbitration.',
      icon: GitMerge,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      id: 'trigger-deadlock',
      title: 'Trigger Deadlock',
      desc: 'Construct a 3-robot circular wait dependency cycle to trigger distributed deadlock detection.',
      icon: Repeat,
      color: 'bg-rose-100 text-rose-600',
    },
    {
      id: 'drain-battery',
      title: 'Drain Robot Battery',
      desc: 'Drop robot battery level below 20% threshold to verify energy feasibility task release.',
      icon: BatteryLow,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      id: 'fail-robot',
      title: 'Fail Robot',
      desc: 'Simulate hardware offline fault on an active robot to test peer re-auction mission continuity.',
      icon: XCircle,
      color: 'bg-rose-100 text-rose-600',
    },
    {
      id: 'fail-coordinator',
      title: 'Fail Central Coordinator',
      desc: 'Disable central server to demonstrate 100% offline Local Autonomy operation.',
      icon: ServerOff,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      id: 'reset-scenario',
      title: 'Reset Simulation',
      desc: 'Restore simulation engine state to default 500 AMRs and 200 tasks.',
      icon: RotateCcw,
      color: 'bg-slate-200 text-slate-700',
      danger: true,
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white/90 backdrop-blur-2xl border-l border-white shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-none">DEMO SCENARIOS</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Hackathon Jury Interactive Scenarios</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Scenarios */}
        <div className="space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            return (
              <GlassCard key={sc.id} className="p-3.5 space-y-2 hover:border-slate-300 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${sc.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-xs text-slate-900">{sc.title}</h4>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{sc.desc}</p>

                <button
                  onClick={() => {
                    onTriggerScenario(sc.id);
                    onClose();
                  }}
                  className={`w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition ${
                    sc.danger
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Scenario
                </button>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
