import React from 'react';
import * as THREE from 'three';

interface WarehouseSceneProps {
  showZones?: boolean;
  showCharging?: boolean;
}

export const WarehouseScene: React.FC<WarehouseSceneProps> = ({
  showZones = true,
  showCharging = true,
}) => {
  // Generate multi-aisle storage rack rows
  const rackRows: Array<{ x: number; z: number }> = [];
  for (let x = -40; x <= 40; x += 16) {
    for (let z = -35; z <= 35; z += 12) {
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue; // Keep central dispatch hub open
      rackRows.push({ x, z });
    }
  }

  // 6 Charging stations matching backend coords
  const chargingStations = [
    { x: -45, z: -45, label: 'CS01' },
    { x: -40, z: -45, label: 'CS02' },
    { x: 40, z: -45, label: 'CS03' },
    { x: 45, z: -45, label: 'CS04' },
    { x: -45, z: 45, label: 'CS05' },
    { x: 45, z: 45, label: 'CS06' },
  ];

  return (
    <group>
      {/* Lighting setup */}
      <ambientLight intensity={0.95} />
      <directionalLight position={[40, 80, 40]} intensity={1.3} castShadow />
      <pointLight position={[0, 30, 0]} intensity={0.6} color="#FFFFFF" />

      {/* Main Concrete Industrial Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color="#E2E5E3" roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Industrial Floor Grid & Guideway Markings */}
      <gridHelper args={[110, 55, '#94A3B8', '#CBD5E1']} position={[0, 0.01, 0]} />

      {/* Perimeter Walls / Structural Pillars */}
      <mesh position={[0, 3, -55]}>
        <boxGeometry args={[110, 6, 0.6]} />
        <meshStandardMaterial color="#CBD5E1" opacity={0.5} transparent />
      </mesh>
      <mesh position={[0, 3, 55]}>
        <boxGeometry args={[110, 6, 0.6]} />
        <meshStandardMaterial color="#CBD5E1" opacity={0.5} transparent />
      </mesh>
      <mesh position={[-55, 3, 0]}>
        <boxGeometry args={[0.6, 6, 110]} />
        <meshStandardMaterial color="#CBD5E1" opacity={0.5} transparent />
      </mesh>
      <mesh position={[55, 3, 0]}>
        <boxGeometry args={[0.6, 6, 110]} />
        <meshStandardMaterial color="#CBD5E1" opacity={0.5} transparent />
      </mesh>

      {/* Storage Racks & Shelf Units */}
      {rackRows.map((pos, idx) => (
        <group key={`rack-${idx}`} position={[pos.x, 0, pos.z]}>
          {/* Steel Support Posts */}
          <mesh position={[-2.4, 2.2, -0.9]}>
            <boxGeometry args={[0.15, 4.4, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </mesh>
          <mesh position={[2.4, 2.2, -0.9]}>
            <boxGeometry args={[0.15, 4.4, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </mesh>
          <mesh position={[-2.4, 2.2, 0.9]}>
            <boxGeometry args={[0.15, 4.4, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </mesh>
          <mesh position={[2.4, 2.2, 0.9]}>
            <boxGeometry args={[0.15, 4.4, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.6} />
          </mesh>

          {/* Shelves */}
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[5.0, 0.1, 2.0]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[5.0, 0.1, 2.0]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <boxGeometry args={[5.0, 0.1, 2.0]} />
            <meshStandardMaterial color="#64748B" />
          </mesh>

          {/* Storage Cargo Boxes */}
          <mesh position={[-1.3, 1.45, 0]}>
            <boxGeometry args={[1.5, 0.8, 1.4]} />
            <meshStandardMaterial color="#D97706" roughness={0.7} />
          </mesh>
          <mesh position={[1.3, 1.45, 0]}>
            <boxGeometry args={[1.6, 0.8, 1.3]} />
            <meshStandardMaterial color="#2563EB" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.85, 0]}>
            <boxGeometry args={[2.2, 0.8, 1.4]} />
            <meshStandardMaterial color="#059669" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Special Industrial Zones Floor Markings */}
      {showZones && (
        <>
          {/* Central Dispatch Hub */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <planeGeometry args={[14, 14]} />
            <meshStandardMaterial color="#3B82F6" opacity={0.15} transparent />
          </mesh>

          {/* Loading Dock A */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-42, 0.02, 0]}>
            <planeGeometry args={[12, 24]} />
            <meshStandardMaterial color="#10B981" opacity={0.15} transparent />
          </mesh>

          {/* Shipping Dock B */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[42, 0.02, 0]}>
            <planeGeometry args={[12, 24]} />
            <meshStandardMaterial color="#F59E0B" opacity={0.15} transparent />
          </mesh>
        </>
      )}

      {/* Charging Station Pads & Towers */}
      {showCharging &&
        chargingStations.map((cs) => (
          <group key={cs.label} position={[cs.x, 0, cs.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <ringGeometry args={[1.2, 2.2, 32]} />
              <meshStandardMaterial color="#EA580C" opacity={0.65} transparent />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.3, 0.4, 1.2, 16]} />
              <meshStandardMaterial color="#EA580C" metalness={0.7} />
            </mesh>
          </group>
        ))}
    </group>
  );
};
