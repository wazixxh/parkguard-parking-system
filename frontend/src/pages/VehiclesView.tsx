import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Search, 
  PlusCircle, 
  Printer, 
  Key, 
  XCircle, 
  RefreshCw,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';
import type { Vehicle } from '../types';
import EditVehicleModal from '../components/EditVehicleModal';

interface VehiclesViewProps {
  onOpenRegister: () => void;
  onOpenPrintCard: (vehicleId: number) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  onOpenRegister,
  onOpenPrintCard,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [selectedVehicleForEdit, setSelectedVehicleForEdit] = useState<Vehicle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, [page, vehicleType, statusFilter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles({
        page,
        limit,
        search: search.trim() || undefined,
        vehicle_type: vehicleType || undefined,
        status: statusFilter || undefined,
      });
      setVehicles(data.items);
      setTotal(data.total);
    } catch (err) {
      console.warn('Failed to load vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadVehicles();
  };

  const handleDeactivate = async (id: number, plate: string) => {
    if (!window.confirm(`Are you sure you want to deactivate vehicle ${plate}? Historical transaction records will be preserved.`)) {
      return;
    }
    try {
      await api.deactivateVehicle(id);
      setActionMessage(`Vehicle ${plate} has been deactivated.`);
      loadVehicles();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to deactivate vehicle.');
    }
  };

  const handleRegenerateTokens = async (id: number, plate: string) => {
    if (!window.confirm(`Regenerate credentials for ${plate}? Any existing printed pass card will be invalidated.`)) {
      return;
    }
    try {
      await api.regenerateTokens(id);
      setActionMessage(`New QR and barcode tokens generated for ${plate}.`);
      loadVehicles();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to regenerate credentials.');
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Car className="w-5 h-5 text-purple-400" />
            Vehicle Permitting & Registry
          </h1>
          <p className="text-xs text-slate-400">
            Maintain authorized vehicles, view assigned parking zones, and print QR windshield credentials.
          </p>
        </div>

        <button
          onClick={onOpenRegister}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all border border-purple-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Vehicle</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between animate-fade-in">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#12131c] border border-[#25283d] flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by plate, driver name, vehicle model, or ID..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-200 text-xs font-semibold border border-[#25283d]"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={vehicleType}
            onChange={(e) => { setVehicleType(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="">All Categories</option>
            <option value="car">Cars / Sedans</option>
            <option value="suv">SUVs</option>
            <option value="motorcycle">Motorcycles</option>
            <option value="van">Vans</option>
            <option value="truck">Trucks</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          <button
            onClick={loadVehicles}
            title="Reload Records"
            className="p-2 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181926] text-slate-400 border-b border-[#25283d] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Pass ID / Plate</th>
                <th className="py-3 px-4">Vehicle Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Driver / Contact</th>
                <th className="py-3 px-4">Live Status</th>
                <th className="py-3 px-4">Permit State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25283d]/60">
              {vehicles.length > 0 ? (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-[#181926]/40 transition-colors">
                    {/* Plate & ID */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white text-sm tracking-wide">
                        {v.plate_number}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {v.vehicle_id}
                      </div>
                    </td>

                    {/* Make & Model */}
                    <td className="py-3 px-4">
                      <div className="text-white font-medium">{v.make} {v.model}</div>
                      {v.color && <div className="text-[10px] text-slate-400">{v.color}</div>}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-purple-300 font-semibold text-[10px]">
                        {v.vehicle_type}
                      </span>
                    </td>

                    {/* Driver */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{v.owner_name}</div>
                      {v.owner_phone && <div className="text-[10px] text-slate-500 font-mono">{v.owner_phone}</div>}
                    </td>

                    {/* Live Parking State */}
                    <td className="py-3 px-4">
                      {v.is_parked ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600 text-emerald-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          PARKED INSIDE
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Off-site</span>
                      )}
                    </td>

                    {/* Permit Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        v.status === 'active'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-700/50'
                          : v.status === 'blocked'
                          ? 'bg-red-950 text-red-300 border border-red-700'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVehicleForEdit(v);
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Vehicle Details"
                          className="p-1.5 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-300 hover:text-white border border-[#25283d] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenPrintCard(v.id)}
                          title="Print Vehicle Pass Card"
                          className="p-1.5 rounded-lg bg-[#181926] hover:bg-[#25283d] text-purple-300 hover:text-white border border-[#25283d] transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRegenerateTokens(v.id, v.plate_number)}
                          title="Regenerate QR & Barcode"
                          className="p-1.5 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d] transition-colors"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        {v.status === 'active' && (
                          <button
                            onClick={() => handleDeactivate(v.id, v.plate_number)}
                            title="Deactivate Vehicle"
                            className="p-1.5 rounded-lg bg-[#181926] hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-[#25283d] transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    {loading ? 'Loading registered vehicles...' : 'No vehicle records matched your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#25283d] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{vehicles.length}</strong> of <strong className="text-white">{total}</strong> registered vehicles
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-[#181926] hover:bg-[#25283d] text-slate-300 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-purple-300 font-bold">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-[#181926] hover:bg-[#25283d] text-slate-300 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        isOpen={isEditModalOpen}
        vehicle={selectedVehicleForEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedVehicleForEdit(null);
        }}
        onSuccess={(updated) => {
          setActionMessage(`Vehicle ${updated.plate_number} updated successfully.`);
          loadVehicles();
        }}
      />
    </div>
  );
};

export default VehiclesView;
