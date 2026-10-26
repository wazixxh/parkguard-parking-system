import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  QrCode, 
  Car, 
  ParkingSquare, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  Users, 
  Layers, 
  History, 
  LogIn, 
  LogOut, 
  WifiOff, 
  RefreshCw,
  KeyRound,
  Sliders
} from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenChangePassword?: () => void;
  apiOnline: boolean;
  apiLatency: number | null;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenChangePassword,
  apiOnline,
  apiLatency,
  onRefreshHealth,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scan & Verify', icon: QrCode },
    { id: 'vehicles', label: 'Vehicles', icon: Car },
    { id: 'parking', label: 'Live Parking', icon: ParkingSquare },
    { id: 'transactions', label: 'History', icon: Clock },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    ...(isSuperAdmin ? [
      { id: 'staff', label: 'Staff Accounts', icon: Users },
      { id: 'zones', label: 'Zones & Depts', icon: Layers },
      { id: 'audit', label: 'Audit Trail', icon: History },
      { id: 'settings', label: 'Settings', icon: Sliders },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#25283d] bg-[#0f1019]/95 backdrop-blur-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-950/50 border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-wider text-white">PARKGUARD</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50">
                  WEB CORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Parking Management & Barcode System
              </p>
            </div>
          </div>

          {/* Real-time Health Status */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#181926] border border-[#25283d] text-xs">
              {apiOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-medium text-[11px]">API Connected</span>
                  {apiLatency !== null && (
                    <span className="text-slate-400 text-[10px]">({apiLatency}ms)</span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-medium text-[11px]">Reconnecting...</span>
                </>
              )}
              <button 
                onClick={onRefreshHealth}
                title="Ping Server"
                className="text-slate-400 hover:text-white transition-colors ml-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* User Account State */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{currentUser.full_name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isSuperAdmin ? 'text-purple-400' : 'text-emerald-400'
                  }`}>
                    {isSuperAdmin ? 'Super Administrator' : 'Parking Staff'}
                  </span>
                </div>
                <button
                  onClick={onOpenChangePassword}
                  title="Change Password"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181926] hover:bg-[#25283d] border border-[#25283d] text-slate-300 hover:text-white text-xs font-medium transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Password</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition-all border border-purple-400/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-[#25283d]/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181926]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
