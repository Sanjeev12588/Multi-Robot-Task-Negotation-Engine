import React, { useState } from 'react';
import { GlassCard } from '../layout/GlassCard';
import { X, PlusCircle, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { Task, BidDetail } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: {
    priority: string;
    pickup_x: number;
    pickup_y: number;
    drop_x: number;
    drop_y: number;
    payload: number;
    required_capability: string;
    deadline: number;
  }) => Promise<{ task: Task; winner: string | null; bids: BidDetail[] } | void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onCreateTask,
}) => {
  const [priority, setPriority] = useState<string>('NORMAL');
  const [pickupZone, setPickupZone] = useState<string>('STORAGE_A');
  const [dropZone, setDropZone] = useState<string>('SHIPPING_B');
  const [payload, setPayload] = useState<number>(25);
  const [capability, setCapability] = useState<string>('STANDARD_CARRIER');
  const [deadline, setDeadline] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const zoneCoords: Record<string, { x: number; y: number; label: string }> = {
    STORAGE_A: { x: 15.0, y: 20.0, label: 'Storage Zone Alpha (15, 20)' },
    STORAGE_B: { x: 65.0, y: 20.0, label: 'Storage Zone Beta (65, 20)' },
    LOADING_A: { x: 10.0, y: 50.0, label: 'Loading Dock A (10, 50)' },
    CENTRAL_HUB: { x: 50.0, y: 50.0, label: 'Central Dispatch Hub (50, 50)' },
    PACKING_C: { x: 50.0, y: 80.0, label: 'Packing Zone C (50, 80)' },
    SHIPPING_B: { x: 90.0, y: 50.0, label: 'Shipping Dock B (90, 50)' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const p = zoneCoords[pickupZone] || zoneCoords.STORAGE_A;
      const d = zoneCoords[dropZone] || zoneCoords.SHIPPING_B;

      await onCreateTask({
        priority,
        pickup_x: p.x,
        pickup_y: p.y,
        drop_x: d.x,
        drop_y: d.y,
        payload,
        required_capability: capability,
        deadline,
      });

      onClose();
    } catch (err) {
      console.error('Task creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md select-none animate-in fade-in duration-150">
      <GlassCard className="w-full max-w-lg p-6 space-y-5 bg-white/95 border-white shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base leading-none">CREATE MISSION TASK</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Dispatch Task to Real-Time Decentralized Bidding Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Priority & Required Capability */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Task Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Required Capability</label>
              <select
                value={capability}
                onChange={(e) => setCapability(e.target.value)}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STANDARD_CARRIER">Standard Carrier</option>
                <option value="FAST_PICKER">Fast Picker</option>
                <option value="HEAVY_CARRIER">Heavy Carrier</option>
                <option value="SUPPORT_ROBOT">Support Robot</option>
              </select>
            </div>
          </div>

          {/* Pickup and Drop Locations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pickup Location</label>
              <select
                value={pickupZone}
                onChange={(e) => setPickupZone(e.target.value)}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none"
              >
                {Object.keys(zoneCoords).map((k) => (
                  <option key={k} value={k}>
                    {zoneCoords[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Drop Location</label>
              <select
                value={dropZone}
                onChange={(e) => setDropZone(e.target.value)}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none"
              >
                {Object.keys(zoneCoords).map((k) => (
                  <option key={k} value={k}>
                    {zoneCoords[k].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payload & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payload Weight (kg)</label>
              <input
                type="number"
                value={payload}
                min={1}
                max={500}
                onChange={(e) => setPayload(Number(e.target.value))}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Deadline Target (seconds)</label>
              <input
                type="number"
                value={deadline}
                min={30}
                max={1200}
                onChange={(e) => setDeadline(Number(e.target.value))}
                className="w-full bg-slate-100/90 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/25 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              {isSubmitting ? 'Submitting to Auction...' : 'Create & Negotiate'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
