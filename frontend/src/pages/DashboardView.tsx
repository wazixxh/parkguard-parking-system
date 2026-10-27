import React, { useState, useEffect } from 'react';
import { 
  Car, 
  ParkingSquare, 
  ArrowDownRight, 
  ArrowUpRight, 
  Users, 
  AlertTriangle, 
  QrCode, 
  PlusCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { api } from '../services/api';
import type { DashboardStats } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenRegister: () => void;
  onOpenEntry: () => void;
  onOpenIncident: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenRegister,
  onOpenEntry,
  onOpenIncident,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch {
      setError('Failed to load dashboard metrics. Reconnecting...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto refresh every 30s
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#12131c] via-[#161726] to-[#12131c] border border-[#25283d] shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Real-time Facility Monitoring
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Security & Parking Operations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Live occupancy metrics, credential scanning analytics, and gate access auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('scanner')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all border border-purple-400/30"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch Scanner</span>
          </button>
          <button
            onClick={onOpenEntry}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 transition-all border border-emerald-400/30"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Log Entry</span>
          </button>
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-200 font-semibold text-xs border border-[#25283d] transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-purple-400" />
            <span>Register Vehicle</span>
          </button>
          <button
            onClick={onOpenIncident}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-semibold text-xs border border-amber-800/40 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Report Incident</span>
          </button>
          <button
            onClick={fetchStats}
            title="Refresh Metrics"
            className="p-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-white font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Vehicles */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Registered</span>
            <Car className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.total_vehicles ?? '—'}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active permits</span>
        </div>

        {/* Currently Parked */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inside Lots</span>
            <ParkingSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{stats?.currently_parked ?? '—'}</span>
            {stats && (
              <span className="text-[11px] font-bold text-slate-400">
                ({stats.occupancy_rate_percent}%)
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Current occupancy</span>
        </div>

        {/* Entered Today */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Entries Today</span>
            <ArrowDownRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.entered_today ?? '—'}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Gate check-ins</span>
        </div>

        {/* Exited Today */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Exits Today</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.exited_today ?? '—'}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Gate departures</span>
        </div>

        {/* Active Staff */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Staff Active</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.active_staff_count ?? '—'}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Enforcement team</span>
        </div>

        {/* Incidents */}
        <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats?.open_incidents_count ?? '—'}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Pending reviews</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart (Responsive SVG) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Daily Traffic Activity (Last 7 Days)</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block"></span> Entries
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block"></span> Exits
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-[#25283d]">
            {stats?.daily_activity_trends.map((item, idx) => {
              const maxVal = Math.max(1, ...stats.daily_activity_trends.map(t => Math.max(t.entries, t.exits)));
              const entryHeight = Math.max(4, Math.round((item.entries / maxVal) * 160));
              const exitHeight = Math.max(4, Math.round((item.exits / maxVal) * 160));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 mb-2">
                    <div 
                      style={{ height: `${entryHeight}px` }} 
                      className="w-3.5 bg-gradient-to-t from-purple-700 to-purple-500 rounded-t-sm transition-all group-hover:brightness-125"
                      title={`${item.date} Entries: ${item.entries}`}
                    />
                    <div 
                      style={{ height: `${exitHeight}px` }} 
                      className="w-3.5 bg-gradient-to-t from-indigo-700 to-indigo-400 rounded-t-sm transition-all group-hover:brightness-125"
                      title={`${item.date} Exits: ${item.exits}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vehicle Category Distribution */}
        <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Vehicles by Category</h2>
          </div>

          <div className="space-y-3">
            {stats?.vehicle_type_distribution.map((cat, i) => {
              const total = stats.total_vehicles || 1;
              const pct = Math.round((cat.count / total) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{cat.type}</span>
                    <span className="text-purple-300 font-bold">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#181926] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Occupancy Progress Bar */}
          <div className="mt-6 pt-4 border-t border-[#25283d]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Facility Occupancy Rate</span>
              <span className={`font-bold ${
                (stats?.occupancy_rate_percent || 0) > 85 ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {stats?.occupancy_rate_percent ?? 0}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#181926] overflow-hidden border border-[#25283d]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-purple-500 to-violet-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(3, stats?.occupancy_rate_percent || 0))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity: Transactions & Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Recent Gate Transactions</h2>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-[#25283d]/60">
            {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
              stats.recent_transactions.map((txn) => (
                <div key={txn.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-black/60 border border-purple-500/40">
                      {txn.plate_number}
                    </span>
                    <div className="hidden sm:block">
                      <div className="text-slate-300 font-medium">{txn.make} {txn.model}</div>
                      <div className="text-[10px] text-slate-500">{txn.owner_name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      txn.status === 'parked'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}>
                      {txn.status}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {new Date(txn.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No recent gate transactions recorded today.
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Recent Security Scans</h2>
            </div>
            <button
              onClick={() => onNavigate('scanner')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Open Scanner →
            </button>
          </div>

          <div className="divide-y divide-[#25283d]/60">
            {stats?.recent_scans && stats.recent_scans.length > 0 ? (
              stats.recent_scans.map((scan) => (
                <div key={scan.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white text-xs">{scan.plate_number || scan.scanned_token}</span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500">({scan.scan_type})</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-xs">{scan.message}</span>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      scan.result === 'success'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-700/50'
                        : scan.result === 'blocked'
                        ? 'bg-red-950/80 text-red-300 border border-red-700/50'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                    }`}>
                      {scan.result}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {new Date(scan.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No recent scans logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
