import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Incident } from '../types';

interface ReportIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incident: Incident) => void;
  initialVehicleIdentifier?: string;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialVehicleIdentifier = '',
}) => {
  const [category, setCategory] = useState<'wrong_parking' | 'blocked_access' | 'unauthorized_parking' | 'security_followup' | 'other'>('wrong_parking');
  const [location, setLocation] = useState('');
  const [vehicleIdentifier, setVehicleIdentifier] = useState(initialVehicleIdentifier);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const inc = await api.createIncident({
        category,
        location: location.trim(),
        description: description.trim(),
        vehicle_identifier: vehicleIdentifier.trim() || undefined,
      });

      onSuccess(inc);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to report incident. Please check fields.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181926] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Report Parking Incident</h2>
            <p className="text-xs text-slate-400">Flag unauthorized vehicles, blocked driveways, or stalls</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Category</label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="wrong_parking">Wrong Parking / Dual Stalls</option>
              <option value="blocked_access">Blocked Access / Gate Driveway</option>
              <option value="unauthorized_parking">Unauthorized Vehicle</option>
              <option value="security_followup">Security Follow-up Required</option>
              <option value="other">Other Operational Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Exact Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Zone B, Stall #42 or Main Ramp"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Plate Number / Token (Optional)
            </label>
            <input
              type="text"
              value={vehicleIdentifier}
              onChange={(e) => setVehicleIdentifier(e.target.value)}
              placeholder="e.g. ABC-1234 (if vehicle identified)"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs font-mono uppercase focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the parking obstruction, vehicle appearance, or incident details..."
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#25283d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-950/60 transition-all disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'File Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
