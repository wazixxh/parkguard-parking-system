import React, { useState } from 'react';
import { X, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email.trim(), password);
      localStorage.setItem('parkguard_token', data.access_token);
      localStorage.setItem('parkguard_user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: true
      }));
      window.dispatchEvent(new Event('parkguard_auth_change'));
      onSuccess({
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        is_active: true
      });
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
        err.response?.data?.detail ||
        'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@parkguard.com');
      setPassword('Admin@ParkGuard2026!');
    } else {
      setEmail('staff.test@parkguard.com');
      setPassword('StaffPassword2026!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181926] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center border border-purple-500/30">
            <Lock className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Sign In to ParkGuard</h2>
            <p className="text-xs text-slate-400">Authorized personnel and administrator access</p>
          </div>
        </div>

        {/* Quick-Fill Demo Helpers */}
        <div className="mb-5 p-3 rounded-xl bg-[#181926] border border-[#25283d]">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
            Quick Sign-In Credentials
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="py-1.5 px-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-[11px] font-medium text-purple-300 transition-colors text-left"
            >
              <div className="font-bold text-white">Super Admin</div>
              <div className="text-[10px] text-purple-400">admin@parkguard.com</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('staff')}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 transition-colors text-left"
            >
              <div className="font-bold text-white">Parking Staff</div>
              <div className="text-[10px] text-slate-400">staff.test@parkguard.com</div>
            </button>
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
