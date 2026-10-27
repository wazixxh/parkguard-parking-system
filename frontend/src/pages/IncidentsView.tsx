import React, { useState, useEffect } from 'react';
import { AlertTriangle, PlusCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { Incident } from '../types';

interface IncidentsViewProps {
  onOpenReportIncident: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ onOpenReportIncident }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadIncidents = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getIncidents({ status: statusFilter || undefined });
      setIncidents(data.items);
    } catch (err) {
      console.warn("Failed to load incidents", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleResolve = async (id: number) => {
    if (!resolutionNotes.trim()) {
      alert("Please enter resolution notes explaining how the incident was handled.");
      return;
    }
    try {
      await api.updateIncident(id, {
        status: 'resolved',
        resolution_notes: resolutionNotes.trim(),
      });
      setResolvingId(null);
      setResolutionNotes('');
      loadIncidents();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to resolve incident.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Parking Incidents & Security Violations
          </h1>
          <p className="text-xs text-slate-400">
            Log and review unauthorized parking, blocked driveways, stall infringements, and security follow-ups.
          </p>
        </div>

        <button
          onClick={onOpenReportIncident}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-950/60 transition-all border border-amber-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Incident</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#12131c] border border-[#25283d] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="">All Incident Statuses</option>
            <option value="open">Open Only</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <button
          onClick={loadIncidents}
          className="p-2 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.length > 0 ? (
          incidents.map((inc) => (
            <div key={inc.id} className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-amber-400">{inc.incident_id}</span>
                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#181926] text-slate-300 border border-[#25283d]">
                    {inc.category.replace('_', ' ')}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  inc.status === 'open'
                    ? 'bg-red-950/80 text-red-300 border border-red-700/60'
                    : inc.status === 'under_review'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                }`}>
                  {inc.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Location</span>
                <span className="text-white text-xs font-semibold">{inc.location}</span>
              </div>

              {inc.plate_number && (
                <div className="p-2.5 rounded-lg bg-[#0d0e15] border border-[#25283d] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Identified Vehicle</span>
                    <span className="font-mono font-bold text-white">{inc.plate_number}</span>
                  </div>
                  {inc.owner_phone && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Owner Contact</span>
                      <span className="font-mono text-purple-300 text-xs">{inc.owner_phone}</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed bg-[#0d0e15]/40 p-2.5 rounded-lg">
                {inc.description}
              </p>

              {inc.resolution_notes && (
                <div className="text-xs p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                  <span className="font-bold block text-[10px] uppercase text-emerald-400">Resolution Details:</span>
                  {inc.resolution_notes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#25283d] flex items-center justify-between text-[11px] text-slate-500">
                <span>Reported by {inc.reporter_name} at {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                {inc.status === 'open' && (
                  <button
                    onClick={() => setResolvingId(inc.id)}
                    className="px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs shadow"
                  >
                    Resolve Incident
                  </button>
                )}
              </div>

              {/* In-line Resolution Box */}
              {resolvingId === inc.id && (
                <div className="mt-3 p-3 rounded-xl bg-[#0d0e15] border border-emerald-500/40 space-y-2 animate-fade-in">
                  <label className="block text-[11px] font-semibold text-emerald-400">Enter Action Taken / Resolution Notes:</label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Vehicle towed, driver contacted and repositioned, warning ticket issued..."
                    className="w-full p-2 rounded-lg bg-[#12131c] border border-[#25283d] text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setResolvingId(null)}
                      className="px-3 py-1 rounded bg-[#181926] text-slate-400 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleResolve(inc.id)}
                      className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Confirm Resolution
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-500 text-xs">
            {loading ? 'Loading incidents...' : 'No parking incidents currently on file.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentsView;
