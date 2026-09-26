import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Flame, Split, GitCommit, BatteryLow, AlertTriangle, WifiOff, FastForward } from 'lucide-react';

interface DemoControlsProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: (robots: number, tasks: number) => void;
  onTriggerSurge: () => void;
  onTriggerConflict: () => void;
  onTriggerDeadlock: () => void;
  onDrainBattery: () => void;
  onFailRobot: () => void;
  onToggleCoordinator: () => void;
  onSetSpeed: (speed: number) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  isRunning,
  onTogglePlay,
  onReset,
  onTriggerSurge,
  onTriggerConflict,
  onTriggerDeadlock,
  onDrainBattery,
  onFailRobot,
  onToggleCoordinator,
  onSetSpeed
}) => {
  const [selectedRobotCount, setSelectedRobotCount] = useState<number>(500);
  const [selectedTaskCount, setSelectedTaskCount] = useState<number>(200);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [activeStep, setActiveStep] = useState<number>(0);

  const handleSpeedToggle = () => {
    const nextSpeed = currentSpeed === 1.0 ? 2.5 : (currentSpeed === 2.5 ? 5.0 : 1.0);
    setCurrentSpeed(nextSpeed);
    onSetSpeed(nextSpeed);
  };

  const runScriptedStep = (step: number, action: () => void) => {
    setActiveStep(step);
    action();
  };

  return (
    <div className="bg-[#0c1222] border border-[#1e293b] rounded-lg p-3 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#1e293b]">
        {/* Playback & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-black'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isRunning ? 'Pause Sim' : 'Resume Sim'}</span>
          </button>

          <button
            onClick={handleSpeedToggle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#162035] hover:bg-[#1f2d4a] text-cyan-400 font-mono text-xs border border-[#24355a] transition cursor-pointer"
            title="Simulation Speed Multiplier"
          >
            <FastForward size={14} />
            <span>{currentSpeed}x</span>
          </button>

          <button
            onClick={() => onReset(selectedRobotCount, selectedTaskCount)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#162035] hover:bg-[#1f2d4a] text-slate-300 font-medium text-xs border border-[#24355a] transition cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Fleet Scale Selectors */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">AMRs:</span>
            <select
              value={selectedRobotCount}
              onChange={e => {
                const count = parseInt(e.target.value);
                setSelectedRobotCount(count);
                onReset(count, selectedTaskCount);
              }}
              className="bg-[#090d16] border border-[#22304e] rounded px-2 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={100}>100 AMRs</option>
              <option value={250}>250 AMRs</option>
              <option value={500}>500 AMRs (Default)</option>
              <option value={1000}>1000 AMRs (Stress)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Tasks:</span>
            <select
              value={selectedTaskCount}
              onChange={e => {
                const count = parseInt(e.target.value);
                setSelectedTaskCount(count);
                onReset(selectedRobotCount, count);
              }}
              className="bg-[#090d16] border border-[#22304e] rounded px-2 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={50}>50 Tasks</option>
              <option value={100}>100 Tasks</option>
              <option value={200}>200 Tasks (Default)</option>
              <option value={500}>500 Tasks</option>
            </select>
          </div>
        </div>
      </div>

      {/* Scripted "Warehouse Emergency Surge" Presentation Sequence */}
      <div className="mt-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Jury Evaluation Scripted Sequence ("Warehouse Emergency Surge")
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">1-Click Live Demonstrations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Step 1: Emergency Surge */}
          <button
            onClick={() => runScriptedStep(1, onTriggerSurge)}
            className={`p-2 rounded-md border text-left transition flex flex-col justify-between cursor-pointer ${
              activeStep === 1
                ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                : 'bg-[#101728] border-[#1e2a44] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-rose-400 font-mono">STEP 1</span>
              <Flame size={13} className="text-rose-400" />
            </div>
            <div className="text-xs font-semibold mt-1">Emergency Surge</div>
            <div className="text-[9px] text-slate-400">Broadcast 25 Critical Tasks</div>
          </button>

          {/* Step 2: Corridor Conflict */}
          <button
            onClick={() => runScriptedStep(2, onTriggerConflict)}
            className={`p-2 rounded-md border text-left transition flex flex-col justify-between cursor-pointer ${
              activeStep === 2
                ? 'bg-amber-950/70 border-amber-500 text-amber-200'
                : 'bg-[#101728] border-[#1e2a44] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-amber-400 font-mono">STEP 2</span>
              <Split size={13} className="text-amber-400" />
            </div>
            <div className="text-xs font-semibold mt-1">Corridor Conflict</div>
            <div className="text-[9px] text-slate-400">Right-of-Way Arbitration</div>
          </button>

          {/* Step 3: Circular Deadlock */}
          <button
            onClick={() => runScriptedStep(3, onTriggerDeadlock)}
            className={`p-2 rounded-md border text-left transition flex flex-col justify-between cursor-pointer ${
              activeStep === 3
                ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                : 'bg-[#101728] border-[#1e2a44] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-purple-400 font-mono">STEP 3</span>
              <GitCommit size={13} className="text-purple-400" />
            </div>
            <div className="text-xs font-semibold mt-1">Trigger Deadlock</div>
            <div className="text-[9px] text-slate-400">R21-R43-R82 Cycle Yield</div>
          </button>

          {/* Step 4: Battery Depletion */}
          <button
            onClick={() => runScriptedStep(4, onDrainBattery)}
            className={`p-2 rounded-md border text-left transition flex flex-col justify-between cursor-pointer ${
              activeStep === 4
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                : 'bg-[#101728] border-[#1e2a44] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-emerald-400 font-mono">STEP 4</span>
              <BatteryLow size={13} className="text-emerald-400" />
            </div>
            <div className="text-xs font-semibold mt-1">Drain R023 (17%)</div>
            <div className="text-[9px] text-slate-400">Auto Task Reassignment</div>
          </button>

          {/* Step 5: Fail Robot & Disconnect Coordinator */}
          <button
            onClick={() => runScriptedStep(5, () => { onFailRobot(); onToggleCoordinator(); })}
            className={`p-2 rounded-md border text-left transition flex flex-col justify-between cursor-pointer ${
              activeStep === 5
                ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                : 'bg-[#101728] border-[#1e2a44] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-rose-400 font-mono">STEP 5</span>
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-rose-400" />
                <WifiOff size={12} className="text-amber-400" />
              </div>
            </div>
            <div className="text-xs font-semibold mt-1">Fail Unit + Coordinator</div>
            <div className="text-[9px] text-slate-400">Full Local Autonomy Test</div>
          </button>
        </div>
      </div>
    </div>
  );
};
