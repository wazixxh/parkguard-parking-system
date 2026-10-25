import React, { useState, useEffect } from 'react';
import { X, Car, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Vehicle, Department, ParkingArea } from '../types';

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newVehicle: Vehicle) => void;
}

export const RegisterVehicleModal: React.FC<RegisterVehicleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [parkingAreaId, setParkingAreaId] = useState<number | undefined>();
  const [notes, setNotes] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSelectOptions();
    }
  }, [isOpen]);

  const loadSelectOptions = async () => {
    try {
      const [depts, areas] = await Promise.all([
        api.getDepartments(),
        api.getParkingAreas()
      ]);
      setDepartments(depts);
      setParkingAreas(areas);
      if (depts.length > 0 && !departmentId) setDepartmentId(depts[0].id);
      if (areas.length > 0 && !parkingAreaId) setParkingAreaId(areas[0].id);
    } catch (err) {
      console.warn("Failed to fetch departments/areas", err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const created = await api.createVehicle({
        plate_number: plateNumber.trim(),
        vehicle_type: vehicleType,
        make: make.trim(),
        model: model.trim(),
        color: color.trim() || undefined,
        owner_name: ownerName.trim(),
        owner_phone: ownerPhone.trim() || undefined,
        department_id: departmentId,
        parking_area_id: parkingAreaId,
        notes: notes.trim() || undefined,
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Registration failed. Please check inputs for errors.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181926] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Car className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Register Authorized Vehicle</h2>
            <p className="text-xs text-slate-400">Generate credentials, license tags, and QR identification</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number Plate */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Number Plate <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vehicle Category <span className="text-red-400">*</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="car">Car / Sedan</option>
                <option value="suv">SUV / Crossover</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="van">Van / Minivan</option>
                <option value="truck">Truck / Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Make */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Manufacturer / Make <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota, Honda, Tesla"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Model Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Camry, Civic, Model 3"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Silver, White, Midnight Blue"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorized Driver Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+1 555-0199"
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={departmentId || ''}
                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Parking Area */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Permitted Parking Area</label>
              <select
                value={parkingAreaId || ''}
                onChange={(e) => setParkingAreaId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="">Any Permitted Zone</option>
                {parkingAreas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} (Cap: {a.total_capacity})</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Gate access clearances, permit notes..."
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
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
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Vehicle & Issue QR Pass'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterVehicleModal;
