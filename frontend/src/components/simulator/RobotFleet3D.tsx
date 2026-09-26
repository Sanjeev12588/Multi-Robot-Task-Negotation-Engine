import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CompactRobot } from '../../types';
import * as THREE from 'three';

interface RobotFleet3DProps {
  robots: CompactRobot[];
  selectedRobotId: string | null;
  onSelectRobot: (robotId: string) => void;
  showRobots?: boolean;
}

interface SingleRobotProps {
  robot: CompactRobot;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const SingleRobot: React.FC<SingleRobotProps> = ({ robot, isSelected, onSelect }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Target 3D coordinates mapped from 0..100 to -50..50
  const targetX = robot.x - 50;
  const targetZ = robot.y - 50;
  const targetRotation = robot.heading ? (robot.heading * Math.PI) / 180 : 0;

  // Smooth position lerp (10-15% lerp per frame for fluid 60 FPS motion)
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.12;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.12;

      // Smooth rotation lerp
      let diff = targetRotation - groupRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 0.12;
    }
  });

  const getRobotStatusColor = (status: string, battery: number) => {
    if (status === 'FAILED') return '#DC2626'; // Rose Red
    if (status === 'CHARGING' || battery <= 20) return '#EA580C'; // Bright Orange
    if (status === 'MOVING' || status === 'ASSIGNED') return '#2563EB'; // Cobalt Blue
    if (status === 'IDLE' || status === 'WAITING') return '#64748B'; // Muted Slate
    return '#059669'; // Emerald Green
  };

  const color = getRobotStatusColor(robot.status, robot.battery);
  const hasCargo = robot.current_task && (robot.status === 'MOVING' || robot.status === 'ASSIGNED');

  return (
    <group
      ref={groupRef}
      position={[targetX, 0.25, targetZ]}
      rotation={[0, targetRotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(robot.id);
      }}
    >
      {/* AMR Main Metallic Chassis */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.75]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Top Cargo Bay Deck Plate */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.9, 0.04, 0.68]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* LiDAR Sensor Dome (Center Roof) */}
      <mesh position={[0.25, 0.24, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.12, 16]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} />
      </mesh>

      {/* Directional Status Beacon Light (Front) */}
      <mesh position={[0.42, 0.18, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#00F0FF' : color}
          emissive={color}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Wheel Assemblies (4 Industrial AMR Wheels) */}
      <mesh position={[0.28, -0.08, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.28, -0.08, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[0.28, -0.08, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.28, -0.08, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 16]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

      {/* Cargo Package Box (Rendered when carrying task payload) */}
      {hasCargo && (
        <group position={[-0.05, 0.42, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.45, 0.5]} />
            <meshStandardMaterial color="#D97706" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Selection Halo Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]}>
          <ringGeometry args={[0.85, 1.15, 32]} />
          <meshStandardMaterial color="#2563EB" opacity={0.9} transparent />
        </mesh>
      )}
    </group>
  );
};

export const RobotFleet3D: React.FC<RobotFleet3DProps> = ({
  robots,
  selectedRobotId,
  onSelectRobot,
  showRobots = true,
}) => {
  if (!showRobots) return null;

  return (
    <group>
      {robots.map((robot) => (
        <SingleRobot
          key={robot.id}
          robot={robot}
          isSelected={selectedRobotId === robot.id}
          onSelect={onSelectRobot}
        />
      ))}
    </group>
  );
};
