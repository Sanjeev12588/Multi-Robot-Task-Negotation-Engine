import React from 'react';
import { RobotDetail } from '../../types';
import { GlassCard } from '../layout/GlassCard';
import { X, Bot, BatteryLow, XCircle, ArrowRightLeft, Eye, Activity, ShieldCheck, MapPin } from 'lucide-react';

interface RobotDetailsProps {
  robot: RobotDetail | null;
  onClose: () => void;
  onDrainBattery: (robotId: string) => void;
  onFailRobot: (robotId: string) => void;
  onReassignTask: (taskId: string) => void;
  onFollowRobot?: (robotId: string) => void;
}

export const RobotDetails: React.FC<RobotDetailsProps> = ({
  robot,
  onClose,
  onDrainBattery,
  onFailRobot,
  onReassignTask,
  onFollowRobot,
}) => {
  if (!robot) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white/90 backdrop-blur-2xl border-l border-white shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">{robot.id}</h3>
              <span className="text-xs font-semibold text-slate-500">{robot.robot_type}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="my-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              robot.status === 'FAILED'
                ? 'badge-red'
                : robot.status === 'CHARGING'
                ? 'badge-orange'
                : robot.status === 'MOVING' || robot.status === 'ASSIGNED'
                ? 'badge-blue'
                : 'badge-emerald'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {robot.status}
          </span>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <GlassCard className="p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Battery</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black text-slate-900">{Math.round(robot.battery)}%</span>
              <BatteryLow
                className={`w-4 h-4 ${
                  robot.battery <= 20 ? 'text-rose-500' : 'text-emerald-600'
                }`}
              />
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  robot.battery <= 20 ? 'bg-rose-500' : 'bg-emerald-600'
                }`}
                style={{ width: `${robot.battery}%` }}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Health</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-lg font-black text-slate-900">{Math.round(robot.health)}%</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${robot.health}%` }} />
            </div>
          </GlassCard>
        </div>

        {/* Detail Telemetry */}
        <div className="space-y-2.5 text-xs text-slate-700 bg-slate-100/60 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Position (X, Y):</span>
            <span className="font-mono font-bold">({robot.x.toFixed(1)}, {robot.y.toFixed(1)})</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Target (X, Y):</span>
            <span className="font-mono font-bold">
              {robot.target_x !== null ? `(${robot.target_x.toFixed(1)}, ${robot.target_y?.toFixed(1)})` : 'None'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Current Task:</span>
            <span className="font-bold text-blue-600">{robot.current_task || 'Unassigned'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Speed:</span>
            <span className="font-bold">{robot.speed} m/s</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Workload:</span>
            <span className="font-bold">{robot.workload} tasks</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        <button
          onClick={() => onFollowRobot?.(robot.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
        >
          <Eye className="w-4 h-4" />
          Follow Robot on 3D Map
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDrainBattery(robot.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold text-xs rounded-xl transition"
          >
            <BatteryLow className="w-3.5 h-3.5 text-orange-600" />
            Drain Battery
          </button>

          <button
            onClick={() => onFailRobot(robot.id)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold text-xs rounded-xl transition"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Fail Robot
          </button>
        </div>
      </div>
    </div>
  );
};
