import React from 'react';
import * as THREE from 'three';

interface RouteRendererProps {
  paths?: Array<{
    id: string;
    points: [number, number][];
    color?: string;
  }>;
  selectedRobotPath?: [number, number][];
  showRoutes?: boolean;
}

export const RouteRenderer: React.FC<RouteRendererProps> = ({
  paths = [],
  selectedRobotPath = [],
  showRoutes = true,
}) => {
  if (!showRoutes) return null;

  const createLineObject = (points: [number, number][], colorStr: string) => {
    if (points.length < 2) return null;
    const vec3Points = points.map(([x, y]) => new THREE.Vector3(x - 50, 0.15, y - 50));
    const geometry = new THREE.BufferGeometry().setFromPoints(vec3Points);
    const material = new THREE.LineBasicMaterial({ color: colorStr, linewidth: 3 });
    return new THREE.Line(geometry, material);
  };

  const selectedLineObj = selectedRobotPath.length >= 2 ? createLineObject(selectedRobotPath, '#2563EB') : null;

  return (
    <group>
      {/* Selected Robot Primary Route */}
      {selectedLineObj && <primitive object={selectedLineObj} />}

      {/* Additional active routes */}
      {paths.map((p) => {
        const lineObj = createLineObject(p.points, p.color || '#059669');
        if (!lineObj) return null;
        return <primitive key={p.id} object={lineObj} />;
      })}
    </group>
  );
};
