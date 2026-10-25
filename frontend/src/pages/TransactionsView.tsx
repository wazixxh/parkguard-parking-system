import React, { useState, useEffect } from 'react';
import { Clock, Search, Download, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { ParkingTransaction } from '../types';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<ParkingTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [page, statusFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setTransactions(data.items);
      setTotal(data.total);
    } catch (err) {
      console.warn("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Parking Transaction History
          </h1>
          <p className="text-xs text-slate-400">
            Immutable log of all vehicle check-ins, check-outs, gate methods, and parking durations.
          </p>
        </div>

        <button
          onClick={() => api.downloadCsv('transactions')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-200 text-xs font-semibold border border-[#25283d] transition-colors"
        >
          <Download className="w-4 h-4 text-purple-400" />
          <span>Export Transactions CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#12131c] border border-[#25283d] flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by license plate, transaction ID, or driver..."
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="">All Transactions</option>
            <option value="parked">Currently Parked</option>
            <option value="exited">Exited</option>
          </select>

          <button
            onClick={loadTransactions}
            title="Reload Transactions"
            className="p-2 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181926] text-slate-400 border-b border-[#25283d] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Transaction Code</th>
                <th className="py-3 px-4">Plate & Vehicle</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Entry Time</th>
                <th className="py-3 px-4">Exit Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25283d]/60">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#181926]/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-purple-300 font-bold">
                      {t.transaction_id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-white">{t.plate_number}</div>
                      <div className="text-[10px] text-slate-400">{t.make} {t.model}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {t.owner_name}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      <div>{new Date(t.entry_time).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(t.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {t.exit_time ? (
                        <>
                          <div>{new Date(t.exit_time).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(t.exit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </>
                      ) : (
                        <span className="text-emerald-400 font-medium">Inside</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {t.duration_minutes ? `${t.duration_minutes} min` : 'In Progress'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="capitalize text-[10px] font-semibold text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-[#25283d]">
                        {t.entry_method.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'parked'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    {loading ? 'Loading transactions...' : 'No transactions recorded matching criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#25283d] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{transactions.length}</strong> of <strong className="text-white">{total}</strong> total transactions
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
    </div>
  );
};

export default TransactionsView;
