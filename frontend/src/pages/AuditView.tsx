import React, { useState, useEffect } from 'react';
import { 
  History, 
  RefreshCw, 
  Filter, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  AlertCircle 
} from 'lucide-react';
import type { AuditLog, User } from '../types';
import { api } from '../services/api';

interface AuditViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ currentUser, onOpenLogin }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [actionFilter, setActionFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const limit = 25;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const fetchLogs = async () => {
    if (!currentUser || !isSuperAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        page,
        limit,
        action: actionFilter || undefined,
        resource_type: resourceFilter || undefined,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.message || 
        'Failed to retrieve system audit logs.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter, currentUser]);

  const totalPages = Math.ceil(total / limit) || 1;

  if (!currentUser || !isSuperAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-[#12131c] border border-red-900/40 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Super Admin Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system audit trail contains sensitive operational records, security events, and administrative changes. 
          Please authenticate with an authorized Super Administrator account.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition-all"
        >
          Authenticate as Super Admin
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#25283d] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            Security & System Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological, immutable audit records of administrative changes, logins, and operational transitions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d]">
          <Filter className="w-4 h-4 text-purple-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
          >
            <option value="" className="bg-[#181926]">All Actions</option>
            <option value="AUTH_LOGIN" className="bg-[#181926]">AUTH_LOGIN</option>
            <option value="AUTH_PASSWORD_CHANGE" className="bg-[#181926]">AUTH_PASSWORD_CHANGE</option>
            <option value="VEHICLE_CREATE" className="bg-[#181926]">VEHICLE_CREATE</option>
            <option value="VEHICLE_UPDATE" className="bg-[#181926]">VEHICLE_UPDATE</option>
            <option value="VEHICLE_DEACTIVATE" className="bg-[#181926]">VEHICLE_DEACTIVATE</option>
            <option value="TOKEN_REGEN" className="bg-[#181926]">TOKEN_REGEN</option>
            <option value="PARKING_ENTRY" className="bg-[#181926]">PARKING_ENTRY</option>
            <option value="PARKING_EXIT" className="bg-[#181926]">PARKING_EXIT</option>
            <option value="INCIDENT_CREATE" className="bg-[#181926]">INCIDENT_CREATE</option>
            <option value="INCIDENT_UPDATE" className="bg-[#181926]">INCIDENT_UPDATE</option>
            <option value="USER_CREATE" className="bg-[#181926]">USER_CREATE</option>
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181926] border border-[#25283d]">
          <Shield className="w-4 h-4 text-purple-400 shrink-0" />
          <select
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none"
          >
            <option value="" className="bg-[#181926]">All Resource Types</option>
            <option value="user" className="bg-[#181926]">User Accounts</option>
            <option value="vehicle" className="bg-[#181926]">Vehicles</option>
            <option value="parking" className="bg-[#181926]">Parking Operations</option>
            <option value="incident" className="bg-[#181926]">Incidents</option>
            <option value="config" className="bg-[#181926]">Configurations / Zones</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end px-3 py-2 rounded-lg bg-[#12131c] border border-[#25283d] text-xs text-slate-400">
          <span>Total Records: <strong className="text-white font-mono">{total}</strong></span>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="rounded-xl border border-[#25283d] bg-[#12131c] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
            Loading security audit log entries...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No audit records found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181926] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#25283d]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold">Outcome</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#25283d]">
                {logs.map((log) => {
                  const isSuccess = log.outcome.toUpperCase() === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-[#181926]/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-white font-medium">
                        {log.actor_email ? (
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="w-3 h-3 text-slate-400" />
                            <span>{log.actor_email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">System Event</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                        <span className="capitalize">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="font-mono text-slate-500 ml-1">({log.resource_id})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-red-950/60 text-red-300 border border-red-800/40'
                        }`}>
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={log.details || ''}>
                        {log.details || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#25283d] bg-[#181926]/50 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditView;
