import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'staff' | 'super_admin'>('staff');
  const [department, setDepartment] = useState('Security');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const created = await api.createUser({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        department: department.trim() || undefined,
      });

      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Failed to create staff account. Please verify details.'
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
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Create Staff Account</h2>
            <p className="text-xs text-slate-400">Authorize operational or administrative personnel</p>
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Marcus Vance"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@parkguard.com"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">System Role</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="staff">Parking Staff (Operations & Scanner)</option>
              <option value="super_admin">Super Administrator (Full System Control)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Security, Facilities, Traffic Operations"
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
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaffModal;
