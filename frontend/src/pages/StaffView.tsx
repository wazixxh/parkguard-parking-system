import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface StaffViewProps {
  onOpenAddStaff: () => void;
}

export const StaffView: React.FC<StaffViewProps> = ({ onOpenAddStaff }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers({ limit: 50 });
      setUsers(data.items);
    } catch (err) {
      console.warn("Could not load users", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: User) => {
    if (!window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} ${user.full_name}?`)) return;
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Action failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Staff Accounts & Role Permissions
          </h1>
          <p className="text-xs text-slate-400">
            Super Administrator console to manage enforcement officers, gate attendants, and system access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            disabled={loading}
            title="Refresh Staff List"
            className="p-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-400 hover:text-white border border-[#25283d] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenAddStaff}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all border border-purple-400/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Staff Account</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181926] text-slate-400 border-b border-[#25283d] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#25283d]/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#181926]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{u.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">UID: {u.id}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-xs">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'super_admin'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                        : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{u.department || 'General'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.is_active ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => toggleStatus(u)}
                      className="px-2.5 py-1 rounded-lg bg-[#181926] hover:bg-[#25283d] text-slate-300 hover:text-white border border-[#25283d] text-[11px]"
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffView;
