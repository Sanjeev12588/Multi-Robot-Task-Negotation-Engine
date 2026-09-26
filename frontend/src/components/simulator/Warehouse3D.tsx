import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { WarehouseScene } from './WarehouseScene';
import { RobotFleet3D } from './RobotFleet3D';
import { RouteRenderer } from './RouteRenderer';
import { ConflictOverlay } from './ConflictOverlay';
import { MapControls } from './MapControls';
import { CompactRobot, ConflictEvent, DeadlockEvent } from '../../types';

interface Warehouse3DProps {
  robots: CompactRobot[];
  selectedRobotId: string | null;
  onSelectRobot: (robotId: string) => void;
  selectedRobotPath?: [number, number][];
  conflicts?: ConflictEvent[];
  deadlocks?: DeadlockEvent[];
}

export const Warehouse3D: React.FC<Warehouse3DProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  selectedRobotPath = [],
  conflicts = [],
  deadlocks = [],
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'top' | 'isometric'>('3d');
  const [layers, setLayers] = useState({
    zones: true,
    robots: true,
    routes: true,
    conflicts: true,
    deadlocks: true,
    charging: true,
  });

  const controlsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResetView = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleToggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => console.error(err));
      } else {
        document.exitFullscreen().catch((err) => console.error(err));
      }
    }
  };

  // Camera settings per view mode
  const getCameraPosition = (): [number, number, number] => {
    switch (viewMode) {
      case 'top':
        return [0, 95, 0.1];
      case 'isometric':
        return [60, 60, 60];
      case '3d':
      default:
        return [45, 55, 65];
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden bg-[#E2E5E3] border border-white/80 shadow-inner">
      {/* Floating Map Controls & Legend Overlay */}
      <MapControls
        viewMode={viewMode}
        setViewMode={setViewMode}
        onResetView={handleResetView}
        onToggleFullscreen={handleToggleFullscreen}
        layers={layers}
        setLayers={setLayers}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: getCameraPosition(), fov: 45, near: 0.1, far: 1000 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#D5D8D6']} />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={viewMode === 'top' ? 0.05 : Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={150}
        />

        {/* 3D Environment */}
        <WarehouseScene showZones={layers.zones} showCharging={layers.charging} />

        {/* 500+ Simulated Robot Fleet */}
        <RobotFleet3D
          robots={robots}
          selectedRobotId={selectedRobotId}
          onSelectRobot={onSelectRobot}
          showRobots={layers.robots}
        />

        {/* Selected Robot Route */}
        <RouteRenderer
          selectedRobotPath={selectedRobotPath}
          showRoutes={layers.routes}
        />

        {/* Conflicts and Deadlocks Beacons */}
        <ConflictOverlay
          conflicts={conflicts}
          deadlocks={deadlocks}
          showConflicts={layers.conflicts}
          showDeadlocks={layers.deadlocks}
        />
      </Canvas>
    </div>
  );
};
