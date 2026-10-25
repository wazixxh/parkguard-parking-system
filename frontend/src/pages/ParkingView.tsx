import React, { useState, useEffect } from 'react';
import { 
  ParkingSquare, 
  ArrowDownRight, 
  ArrowUpRight, 
  Search, 
  Clock, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import type { ParkingTransaction } from '../types';

interface ParkingViewProps {
  onOpenEntry: () => void;
}

export const ParkingView: React.FC<ParkingViewProps> = ({ onOpenEntry }) => {
  const [parkedList, setParkedList] = useState<ParkingTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadParkedVehicles();
    const interval = setInterval(loadParkedVehicles, 20000);
    return () => clearInterval(interval);
  }, []);

  const loadParkedVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getCurrentlyParked({
        limit: 100,
        search: search.trim() || undefined,
      });
      setParkedList(data.items);
      setTotal(data.total);
    } catch (err) {
      console.warn("Failed to load parked vehicles", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordExit = async (txn: ParkingTransaction) => {
    if (!window.confirm(`Confirm vehicle exit for ${txn.plate_number}?`)) return;

    try {
      await api.recordExit({
        vehicle_identifier: txn.plate_number,
        exit_method: 'manual',
      });
      setActionSuccess(`Vehicle ${txn.plate_number} exit recorded successfully.`);
      loadParkedVehicles();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record vehicle exit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <ParkingSquare className="w-5 h-5 text-emerald-400" />
            Currently Parked Vehicles ({total})
          </h1>
          <p className="text-xs text-slate-400">
            Real-time tracking of all active vehicles inside campus and facility parking stalls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenEntry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 transition-all border border-emerald-400/30"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Log Vehicle Entry</span>
          </button>
          <button
            onClick={loadParkedVehicles}
            title="Refresh List"
            className="p-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-[#12131c] border border-[#25283d]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => { if (e.key === 'Enter') loadParkedVehicles(); }}
            placeholder="Filter parked vehicles by plate, driver, or transaction ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Parked Vehicles Table */}
      <div className="rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181926] text-slate-400 border-b border-[#25283d] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">License Plate</th>
                <th className="py-3 px-4">Vehicle Details</th>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Parking Stall / Area</th>
                <th className="py-3 px-4">Entry Time</th>
                <th className="py-3 px-4">Elapsed Duration</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25283d]/60">
              {parkedList.length > 0 ? (
                parkedList.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#181926]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white text-sm">
                        {txn.plate_number}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {txn.transaction_id}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{txn.make} {txn.model}</div>
                      <span className="text-[10px] text-purple-300 font-semibold uppercase">{txn.vehicle_type}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {txn.owner_name}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-semibold text-[10px]">
                        {txn.parking_area_name}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {new Date(txn.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {txn.duration_minutes ?? 1} mins
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRecordExit(txn)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition-colors flex items-center gap-1 ml-auto"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Log Exit</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    {loading ? 'Refreshing active vehicles...' : 'No vehicles currently inside parking stalls.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParkingView;
