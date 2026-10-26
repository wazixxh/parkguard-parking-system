import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Building, 
  Clock, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types';

interface SettingsViewProps {
  currentUser: User | null;
  onOpenLogin: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onOpenLogin }) => {
  const [settings, setSettings] = useState<Record<string, string>>({
    organization_name: 'ParkGuard Campus Facilities',
    facility_location: 'Main Campus & Corporate Center',
    timezone: 'UTC',
    enforce_capacity_limits: 'true',
    default_grace_period_mins: '15',
    max_duration_hours: '24',
    require_phone_on_register: 'false',
    auto_verify_scans: 'true',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
    } catch (err: any) {
      console.warn('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      const data = await api.updateSettings(settings);
      setSettings(data.settings);
      setNotification({
        type: 'success',
        message: 'System operational settings updated and applied successfully.',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update system settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!currentUser || !isSuperAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-[#12131c] border border-red-900/40 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center mx-auto text-red-400">
          <Sliders className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Super Admin Access Required</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Operational system preferences and parking enforcement policies can only be managed by authorized Super Administrators.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition-all"
        >
          Sign In as Super Admin
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#25283d] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            System & Operational Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure institutional organization profile, facility capacity enforcement, and scanning defaults.
          </p>
        </div>

        <button
          onClick={loadSettings}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 hover:text-white text-xs font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 text-xs animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
            : 'bg-red-950/40 border-red-800/50 text-red-300'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institution Details */}
        <div className="p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#25283d]">
            <Building className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Facility & Organization Profile</h2>
              <p className="text-[11px] text-slate-400">Branding metadata displayed on official vehicle pass cards and reports</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organization / Campus Name</label>
              <input
                type="text"
                required
                value={settings.organization_name || ''}
                onChange={(e) => handleChange('organization_name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Facility Location Description</label>
              <input
                type="text"
                value={settings.facility_location || ''}
                onChange={(e) => handleChange('facility_location', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parking Enforcement & Rules */}
        <div className="p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#25283d]">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">Enforcement Rules & Access Limits</h2>
              <p className="text-[11px] text-slate-400">Rules controlling gate entry permissions, duration limits, and capacity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Capacity Limits Enforcement</label>
              <select
                value={settings.enforce_capacity_limits || 'true'}
                onChange={(e) => handleChange('enforce_capacity_limits', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="true">Strict (Reject vehicle entries when lot is full)</option>
                <option value="false">Relaxed (Allow overflow entries with warnings)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Permitted Duration (Hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={settings.max_duration_hours || '24'}
                onChange={(e) => handleChange('max_duration_hours', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Grace Period for Departures (Minutes)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={settings.default_grace_period_mins || '15'}
                onChange={(e) => handleChange('default_grace_period_mins', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Driver Phone Requirement</label>
              <select
                value={settings.require_phone_on_register || 'false'}
                onChange={(e) => handleChange('require_phone_on_register', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="false">Optional Contact Phone</option>
                <option value="true">Mandatory Contact Phone on Registration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Timezone & System Clock */}
        <div className="p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#25283d]">
            <Clock className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">System Timezone & Clock Standards</h2>
              <p className="text-[11px] text-slate-400">Canonical reference timezone for entry and exit timestamps</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Timezone</label>
              <select
                value={settings.timezone || 'UTC'}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (Eastern)</option>
                <option value="America/Chicago">America/Chicago (Central)</option>
                <option value="America/Denver">America/Denver (Mountain)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Auto Verification on Scan</label>
              <select
                value={settings.auto_verify_scans || 'true'}
                onChange={(e) => handleChange('auto_verify_scans', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white focus:outline-none focus:border-purple-500"
              >
                <option value="true">Immediate Validation & State Display</option>
                <option value="false">Require Manual Confirmation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/60 transition-all border border-purple-400/30 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving System Preferences...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
