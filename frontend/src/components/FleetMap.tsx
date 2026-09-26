import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Corridor, ChargingStation, Zone, ConflictEvent, DeadlockEvent } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, ShieldAlert } from 'lucide-react';

interface FleetMapProps {
  robots: any[][]; // [id, type_idx, x, y, status_idx, battery, current_task, heading]
  corridors: Corridor[];
  chargingStations: ChargingStation[];
  zones: Zone[];
  activeConflicts: ConflictEvent[];
  recentDeadlocks: DeadlockEvent[];
  selectedRobotId: string | null;
  onSelectRobot: (robotId: string | null) => void;
}

const TYPE_NAMES = ['FAST_PICKER', 'STANDARD_CARRIER', 'HEAVY_CARRIER', 'SUPPORT_ROBOT'];
const STATUS_NAMES = ['IDLE', 'NEGOTIATING', 'ASSIGNED', 'MOVING', 'WAITING', 'CHARGING', 'FAILED', 'RECOVERING'];

export const FleetMap: React.FC<FleetMapProps> = ({
  robots,
  corridors,
  chargingStations,
  zones,
  activeConflicts,
  recentDeadlocks,
  selectedRobotId,
  onSelectRobot
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState<number>(1.1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 20, y: 15 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredRobot, setHoveredRobot] = useState<any | null>(null);

  // Redraw canvas on data updates or viewport changes
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    // 1. Grid lines (warehouse floor coordinates: 0 to 800m x 0 to 600m)
    ctx.strokeStyle = '#0e172a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = 0; y <= 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // 2. Draw 25 Industrial Zones
    zones.forEach(z => {
      let fillColor = 'rgba(30, 41, 59, 0.4)';
      let borderColor = '#334155';
      if (z.zone_type === 'DOCK') {
        fillColor = 'rgba(14, 165, 233, 0.08)';
        borderColor = 'rgba(14, 165, 233, 0.4)';
      } else if (z.zone_type === 'PICKING') {
        fillColor = 'rgba(168, 85, 247, 0.08)';
        borderColor = 'rgba(168, 85, 247, 0.4)';
      } else if (z.zone_type === 'PACKING') {
        fillColor = 'rgba(245, 158, 11, 0.08)';
        borderColor = 'rgba(245, 158, 11, 0.4)';
      } else if (z.zone_type === 'CHARGING') {
        fillColor = 'rgba(16, 185, 129, 0.12)';
        borderColor = 'rgba(16, 185, 129, 0.5)';
      } else if (z.zone_type === 'SORTING') {
        fillColor = 'rgba(236, 72, 153, 0.08)';
        borderColor = 'rgba(236, 72, 153, 0.4)';
      }

      ctx.fillStyle = fillColor;
      ctx.fillRect(z.x, z.y, z.width, z.height);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(z.x, z.y, z.width, z.height);

      // Zone label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(z.name, z.x + 6, z.y + 14);
    });

    // 3. Draw 12 Narrow Single-Lane Corridors
    corridors.forEach(c => {
      const isReserved = !!c.reserved_by;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.start_x, c.start_y);
      ctx.lineTo(c.end_x, c.end_y);
      ctx.lineWidth = isReserved ? 14 : 10;
      ctx.strokeStyle = isReserved ? 'rgba(244, 63, 94, 0.35)' : 'rgba(71, 85, 105, 0.3)';
      ctx.stroke();

      // Centerline
      ctx.strokeStyle = isReserved ? '#f43f5e' : '#64748b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(c.start_x, c.start_y);
      ctx.lineTo(c.end_x, c.end_y);
      ctx.stroke();
      ctx.restore();

      // Corridor badge
      const midX = (c.start_x + c.end_x) / 2;
      const midY = (c.start_y + c.end_y) / 2;
      ctx.fillStyle = isReserved ? '#f43f5e' : '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(c.id, midX - 8, midY - 6);
    });

    // 4. Draw 15 Charging Stations
    chargingStations.forEach(cs => {
      const isOccupied = cs.occupied_by.length > 0;
      ctx.save();
      ctx.fillStyle = isOccupied ? 'rgba(16, 185, 129, 0.8)' : 'rgba(51, 65, 85, 0.7)';
      ctx.beginPath();
      ctx.arc(cs.x, cs.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Charging icon glow
      ctx.strokeStyle = isOccupied ? '#10b981' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    });

    // 5. Draw Active Conflict Links & Collision Warning Cones
    activeConflicts.forEach(conf => {
      const rA = robots.find(r => r[0] === conf.robot_a);
      const rB = robots.find(r => r[0] === conf.robot_b);
      if (rA && rB) {
        ctx.save();
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(rA[2], rA[3]);
        ctx.lineTo(rB[2], rB[3]);
        ctx.stroke();

        // Pulsing warning circle on collision zone
        const cx = (rA[2] + rB[2]) / 2;
        const cy = (rA[3] + rB[3]) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#f43f5e';
        ctx.stroke();
        ctx.restore();
      }
    });

    // 6. Draw Circular Deadlock Loops
    recentDeadlocks.forEach(dlk => {
      if (dlk.status === 'RESOLVED') return; // Only draw if active
      const points: [number, number][] = [];
      dlk.participants.forEach(pid => {
        const rob = robots.find(r => r[0] === pid);
        if (rob) points.push([rob[2], rob[3]]);
      });
      if (points.length >= 2) {
        ctx.save();
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(225, 29, 72, 0.15)';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });

    // 7. Draw 500+ Heterogeneous AMRs
    // [id, type_idx, x, y, status_idx, battery, current_task, heading]
    robots.forEach(r => {
      const [id, typeIdx, x, y, statusIdx, battery, task, heading] = r;
      const isSelected = selectedRobotId === id;
      const statusName = STATUS_NAMES[statusIdx];
      const typeName = TYPE_NAMES[typeIdx];

      ctx.save();
      ctx.translate(x, y);

      // Color scheme based on status and type
      let robotColor = '#3b82f6'; // Standard Carrier
      if (typeName === 'FAST_PICKER') robotColor = '#00f0ff';
      else if (typeName === 'HEAVY_CARRIER') robotColor = '#a855f7';
      else if (typeName === 'SUPPORT_ROBOT') robotColor = '#10b981';

      if (statusName === 'FAILED') {
        robotColor = '#f43f5e';
      } else if (statusName === 'WAITING') {
        robotColor = '#f59e0b';
      } else if (statusName === 'CHARGING') {
        robotColor = '#10b981';
      }

      // Draw Selected Glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Shape according to RobotType
      ctx.fillStyle = robotColor;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;

      if (statusName === 'FAILED') {
        // Red X mark
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-5, -5); ctx.lineTo(5, 5);
        ctx.moveTo(5, -5); ctx.lineTo(-5, 5);
        ctx.stroke();
      } else if (typeName === 'FAST_PICKER') {
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -5.5);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(0, 5.5);
        ctx.lineTo(-5.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (typeName === 'HEAVY_CARRIER') {
        // Square shape
        ctx.fillRect(-5, -5, 10, 10);
        ctx.strokeRect(-5, -5, 10, 10);
      } else if (typeName === 'SUPPORT_ROBOT') {
        // Hexagon / Rounded shape
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Standard Carrier: Circle
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Direction Notch
      if (heading !== undefined && statusName === 'MOVING') {
        ctx.rotate(heading);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
      }

      ctx.restore();
    });

    ctx.restore();
  }, [robots, corridors, chargingStations, zones, activeConflicts, recentDeadlocks, selectedRobotId, scale, pan]);

  useEffect(() => {
    render();
  }, [render]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        render();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Canvas Interactions: Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hover detection
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / scale;
    const mouseY = (e.clientY - rect.top - pan.y) / scale;

    const found = robots.find(r => {
      const rx = r[2];
      const ry = r[3];
      return Math.hypot(rx - mouseX, ry - mouseY) < 8.0;
    });

    setHoveredRobot(found || null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / scale;
    const mouseY = (e.clientY - rect.top - pan.y) / scale;

    const clicked = robots.find(r => {
      const rx = r[2];
      const ry = r[3];
      return Math.hypot(rx - mouseX, ry - mouseY) < 12.0;
    });

    if (clicked) {
      onSelectRobot(clicked[0]);
    } else {
      onSelectRobot(null);
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(3.0, Math.max(0.6, prev + delta)));
  };

  const resetView = () => {
    setScale(1.1);
    setPan({ x: 20, y: 15 });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-[#070b14] rounded-lg border border-[#1e293b] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#0b1220]/90 border border-[#1e293b] backdrop-blur-md rounded-md p-1 shadow-lg z-10">
        <button
          onClick={() => handleZoom(0.2)}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#15233e] rounded transition"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#15233e] rounded transition"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-[#15233e] rounded transition"
          title="Reset View"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 bg-[#0a101d]/90 border border-[#1e293b] backdrop-blur-md rounded-md p-2.5 text-[11px] shadow-lg flex flex-wrap gap-x-4 gap-y-1.5 z-10 max-w-[500px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#00f0ff] inline-block"></span>
          <span className="text-slate-300">Fast Picker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] inline-block"></span>
          <span className="text-slate-300">Standard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#a855f7] inline-block"></span>
          <span className="text-slate-300">Heavy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block"></span>
          <span className="text-slate-300">Support</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block"></span>
          <span className="text-amber-400">Waiting/Yield</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#f43f5e] font-bold text-center leading-none text-[9px] text-white">✕</span>
          <span className="text-rose-400">Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 border-t-2 border-dashed border-[#f43f5e] inline-block"></span>
          <span className="text-slate-300">Conflict / Cycle</span>
        </div>
      </div>

      {/* Tooltip on Hover */}
      {hoveredRobot && (
        <div
          className="absolute pointer-events-none bg-[#0a1120] border border-cyan-500/50 rounded-md p-2 shadow-2xl text-[11px] z-20"
          style={{
            left: `${hoveredRobot[2] * scale + pan.x + 12}px`,
            top: `${hoveredRobot[3] * scale + pan.y - 25}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3 font-mono font-bold text-cyan-400">
            <span>{hoveredRobot[0]}</span>
            <span className="text-slate-400 text-[10px]">{TYPE_NAMES[hoveredRobot[1]]}</span>
          </div>
          <div className="text-slate-300 mt-0.5">
            Status: <span className="font-semibold text-amber-300">{STATUS_NAMES[hoveredRobot[4]]}</span>
          </div>
          <div className="text-slate-300">
            Battery: <span className="font-mono text-emerald-400">{hoveredRobot[5]}%</span>
          </div>
          {hoveredRobot[6] && (
            <div className="text-slate-400 text-[10px]">
              Task: <span className="text-white">{hoveredRobot[6]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
