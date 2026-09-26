import React from 'react';
import { ConflictEvent, DeadlockEvent } from '../../types';

interface ConflictOverlayProps {
  conflicts: ConflictEvent[];
  deadlocks: DeadlockEvent[];
  showConflicts?: boolean;
  showDeadlocks?: boolean;
}

export const ConflictOverlay: React.FC<ConflictOverlayProps> = ({
  conflicts,
  deadlocks,
  showConflicts = true,
  showDeadlocks = true,
}) => {
  return (
    <group>
      {/* Active Conflict Beacons */}
      {showConflicts &&
        conflicts.map((c) => {
          // Default location or centered on grid
          const posX = 0;
          const posZ = -10;
          return (
            <group key={c.id} position={[posX, 0.4, posZ]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.5, 2.5, 32]} />
                <meshStandardMaterial color="#EA580C" opacity={0.7} transparent />
              </mesh>
              <mesh position={[0, 1, 0]}>
                <octahedronGeometry args={[0.5]} />
                <meshStandardMaterial color="#EA580C" emissive="#EA580C" emissiveIntensity={0.8} />
              </mesh>
            </group>
          );
        })}

      {/* Deadlock Beacons */}
      {showDeadlocks &&
        deadlocks.map((d) => {
          const posX = 10;
          const posZ = 10;
          return (
            <group key={d.id} position={[posX, 0.4, posZ]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.0, 3.2, 32]} />
                <meshStandardMaterial color="#DC2626" opacity={0.8} transparent />
              </mesh>
              <mesh position={[0, 1.2, 0]}>
                <octahedronGeometry args={[0.7]} />
                <meshStandardMaterial color="#DC2626" emissive="#DC2626" emissiveIntensity={1.0} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
};
