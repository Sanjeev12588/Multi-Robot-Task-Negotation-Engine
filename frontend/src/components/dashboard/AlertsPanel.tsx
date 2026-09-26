import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { SystemEvent } from '../../types';
import { AlertCircle, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AlertsPanelProps {
  events: SystemEvent[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ events }) => {
  const alerts = [
    {
      id: 'a1',
      title: 'Low Battery Warning',
      description: '3 robots have battery < 20%',
      type: 'warning',
      action: 'View',
    },
    {
      id: 'a2',
      title: 'High Congestion',
      description: 'Corridor C-07 at 85% capacity',
      type: 'warning',
      action: 'View',
    },
    {
      id: 'a3',
      title: 'Reassignment Completed',
      description: 'Task T-109 reassigned to R-412',
      type: 'info',
      action: 'View',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* System Alerts */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">System Alerts</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">
            3 Active
          </span>
        </div>

        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/70 hover:bg-white transition"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 ${
                    alert.type === 'warning' ? 'text-orange-500' : 'text-blue-600'
                  }`}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none">{alert.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{alert.description}</p>
                </div>
              </div>
              <button className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1">
                {alert.action}
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Events Stream */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Recent Events</h3>
          </div>
          <button className="text-[11px] font-semibold text-blue-600 hover:underline">
            View All →
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">No recent events logged</div>
          ) : (
            events.slice(0, 5).map((evt, idx) => {
              const isError = evt.severity === 'ERROR' || (evt as any).level === 'ERROR';
              const isWarn = evt.severity === 'WARNING' || (evt as any).level === 'WARNING';
              return (
                <div
                  key={evt.id || idx}
                  className="flex items-start justify-between p-2 rounded-xl bg-slate-100/50 border border-slate-200/50 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        isError ? 'text-rose-500' : isWarn ? 'text-orange-500' : 'text-emerald-600'
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">{evt.message}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">{evt.category}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">Just now</span>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </div>
  );
};
