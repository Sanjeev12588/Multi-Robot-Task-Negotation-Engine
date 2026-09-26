import React from 'react';
import { Eye, Compass, RotateCcw, Maximize2, Layers } from 'lucide-react';

interface MapControlsProps {
  viewMode: '3d' | 'top' | 'isometric';
  setViewMode: (mode: '3d' | 'top' | 'isometric') => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
  layers: {
    zones: boolean;
    robots: boolean;
    routes: boolean;
    conflicts: boolean;
    deadlocks: boolean;
    charging: boolean;
  };
  setLayers: React.Dispatch<React.SetStateAction<{
    zones: boolean;
    robots: boolean;
    routes: boolean;
    conflicts: boolean;
    deadlocks: boolean;
    charging: boolean;
  }>>;
}

export const MapControls: React.FC<MapControlsProps> = ({
  viewMode,
  setViewMode,
  onResetView,
  onToggleFullscreen,
  layers,
  setLayers,
}) => {
  const [showLayerMenu, setShowLayerMenu] = React.useState(false);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto select-none">
      {/* View Presets & Controls */}
      <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-lg rounded-xl p-1.5 flex items-center gap-1">
        <button
          onClick={() => setViewMode('3d')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
            viewMode === '3d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          3D
        </button>
        <button
          onClick={() => setViewMode('top')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
            viewMode === 'top' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Top View
        </button>
        <button
          onClick={() => setViewMode('isometric')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
            viewMode === 'isometric' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Isometric
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition relative ${
            showLayerMenu ? 'bg-slate-200' : ''
          }`}
          title="Toggle Layers"
        >
          <Layers className="w-4 h-4" />
        </button>

        <button
          onClick={onResetView}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Filter Popover */}
      {showLayerMenu && (
        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-xl rounded-xl p-3 space-y-2 text-xs text-slate-700 w-44">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1 text-[11px] uppercase tracking-wider">
            Map Layers
          </p>
          {(Object.keys(layers) as Array<keyof typeof layers>).map((key) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer hover:text-slate-900 capitalize">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={() => toggleLayer(key)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{key}</span>
            </label>
          ))}
        </div>
      )}

      {/* Floating Legend */}
      <div className="bg-white/80 backdrop-blur-md border border-white/90 shadow-md rounded-xl p-2.5 text-[11px] text-slate-700 space-y-1.5 w-40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span>Active / Healthy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
          <span>Moving / Task</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-xs" />
          <span>Charging</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-xs" />
          <span>Failed / Conflict</span>
        </div>
      </div>
    </div>
  );
};
