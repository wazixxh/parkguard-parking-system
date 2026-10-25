import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Building2, 
  ParkingSquare, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Car 
} from 'lucide-react';
import type { Department, ParkingArea, User } from '../types';
import { api } from '../services/api';

interface ZonesViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
}

export const ZonesView: React.FC<ZonesViewProps> = ({ currentUser, onOpenLogin }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'departments'>('areas');

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

  // New Department Form
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '' });
  const [deptSubmitting, setDeptSubmitting] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // New Parking Area Form
  const [areaForm, setAreaForm] = useState({ name: '', code: '', total_capacity: 50 });
  const [areaSubmitting, setAreaSubmitting] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [deptsData, areasData] = await Promise.all([
        api.getDepartments(),
        api.getParkingAreas(),
      ]);
      setDepartments(deptsData);
      setParkingAreas(areasData);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.message || 
        'Failed to load parking zones and departments.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      setDeptError('Name and unique code are required.');
      return;
    }
    setDeptSubmitting(true);
    setDeptError(null);
    try {
      await api.createDepartment(deptForm);
      setNotification({ type: 'success', message: `Department '${deptForm.name}' created successfully.` });
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '' });
      fetchData();
    } catch (err: any) {
      setDeptError(err.response?.data?.error?.message || 'Failed to create department.');
    } finally {
      setDeptSubmitting(false);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaForm.name || !areaForm.code || areaForm.total_capacity < 1) {
      setAreaError('Name, code, and valid capacity (>= 1) are required.');
      return;
    }
    setAreaSubmitting(true);
    setAreaError(null);
    try {
      await api.createParkingArea(areaForm);
      setNotification({ type: 'success', message: `Parking Area '${areaForm.name}' created successfully.` });
      setIsAreaModalOpen(false);
      setAreaForm({ name: '', code: '', total_capacity: 50 });
      fetchData();
    } catch (err: any) {
      setAreaError(err.response?.data?.error?.message || 'Failed to create parking area.');
    } finally {
      setAreaSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#25283d] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-400" />
            Parking Zones & Departments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage institutional departments, allocated parking zones, and capacity thresholds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Zones & Depts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAreaModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all border border-purple-400/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Parking Zone</span>
              </button>
              <button
                onClick={() => setIsDeptModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300' 
            : 'bg-red-950/40 border-red-800/50 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Access Guard for non-logged in or unauthorized */}
      {!currentUser && (
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center justify-between text-xs text-purple-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-400 shrink-0" />
            <span>Sign in as Super Admin to create or modify parking zones and departments.</span>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-[#25283d] pb-2">
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'areas'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181926]'
          }`}
        >
          <ParkingSquare className="w-4 h-4" />
          <span>Parking Zones & Capacity ({parkingAreas.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'departments'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181926]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutional Departments ({departments.length})</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Parking Areas */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Loading parking zone allocations...
            </div>
          ) : parkingAreas.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#12131c] border border-[#25283d] text-center text-slate-400 text-xs">
              No parking zones configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parkingAreas.map((area) => {
                const occupancyPct = area.total_capacity > 0 
                  ? Math.min(100, Math.round((area.occupied_count / area.total_capacity) * 100))
                  : 0;
                const isFull = occupancyPct >= 100;
                const isHigh = occupancyPct >= 80;

                return (
                  <div 
                    key={area.id}
                    className="p-5 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/40">
                          {area.code}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isFull
                            ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                            : isHigh
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}>
                          {isFull ? 'Zone Full' : isHigh ? 'Nearly Full' : 'Available'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1">{area.name}</h3>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Occupancy</span>
                          <span className="font-mono font-semibold text-white">
                            {area.occupied_count} / {area.total_capacity} bays
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-[#181926] rounded-full h-2 overflow-hidden border border-[#25283d]">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isFull ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'
                            }`}
                            style={{ width: `${occupancyPct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                          <span>{area.total_capacity - area.occupied_count} spaces free</span>
                          <span>{occupancyPct}% utilized</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#25283d]/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-purple-400" />
                        Zone Active
                      </span>
                      <span className="font-mono text-slate-500">ID #{area.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Departments */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Loading institutional departments...
            </div>
          ) : departments.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#12131c] border border-[#25283d] text-center text-slate-400 text-xs">
              No departments registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#25283d] bg-[#12131c]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#181926] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#25283d]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-4 font-semibold">Department Name</th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">System ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#25283d]">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-[#181926]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-300">
                        {dept.code}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {dept.name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {dept.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        #{dept.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Department Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#12131c] border border-[#25283d] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#25283d] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                Register Department
              </h2>
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deptError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
                {deptError}
              </div>
            )}

            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Information Technology"
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Unique Code *</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. IT"
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Operational purpose or scope"
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#25283d]">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50"
                >
                  {deptSubmitting ? 'Saving...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parking Area Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#12131c] border border-[#25283d] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#25283d] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ParkingSquare className="w-4 h-4 text-purple-400" />
                Add Parking Zone
              </h2>
              <button 
                onClick={() => setIsAreaModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {areaError && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs">
                {areaError}
              </div>
            )}

            <form onSubmit={handleCreateArea} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Zone / Area Name *</label>
                <input
                  type="text"
                  required
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  placeholder="e.g. Executive Basement Lot"
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Zone Code *</label>
                <input
                  type="text"
                  required
                  value={areaForm.code}
                  onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ZONE-B1"
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white font-mono uppercase focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Total Bay Capacity *</label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  required
                  value={areaForm.total_capacity}
                  onChange={(e) => setAreaForm({ ...areaForm, total_capacity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d] text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#25283d]">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={areaSubmitting}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold disabled:opacity-50"
                >
                  {areaSubmitting ? 'Saving...' : 'Create Parking Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZonesView;
