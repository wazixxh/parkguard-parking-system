import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { ParkingTransaction, ParkingArea } from '../types';

interface RecordEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txn: ParkingTransaction) => void;
  initialIdentifier?: string;
}

export const RecordEntryModal: React.FC<RecordEntryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialIdentifier = '',
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [entryMethod, setEntryMethod] = useState('qr_scan');
  const [parkingAreaId, setParkingAreaId] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIdentifier(initialIdentifier);
      api.getParkingAreas().then(setParkingAreas).catch(() => {});
    }
  }, [isOpen, initialIdentifier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const txn = await api.recordEntry({
        vehicle_identifier: identifier.trim(),
        entry_method: entryMethod,
        parking_area_id: parkingAreaId,
        notes: notes.trim() || undefined,
      });

      onSuccess(txn);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to record entry. Please check the vehicle status.'
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
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Log Vehicle Entry</h2>
            <p className="text-xs text-slate-400">Authorize entry and record active parking transaction</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vehicle Identifier (Plate, QR Token, or Barcode) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. ABC-1234 or PGQR-XXXX"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs font-mono uppercase tracking-wider focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Method</label>
            <select
              value={entryMethod}
              onChange={(e) => setEntryMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="qr_scan">QR Code Camera Scan</option>
              <option value="barcode_scan">Barcode Scanner</option>
              <option value="manual">Manual Plate Lookup</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Zone</label>
            <select
              value={parkingAreaId || ''}
              onChange={(e) => setParkingAreaId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="">Auto / Vehicle Default Zone</option>
              {parkingAreas.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (Cap: {a.total_capacity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate #1, visitor badge issued..."
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging Entry...' : 'Confirm Vehicle Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordEntryModal;
