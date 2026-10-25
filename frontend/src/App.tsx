import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  Server, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Car, 
  QrCode, 
  Lock, 
  FileText, 
  Wifi,
  WifiOff
} from 'lucide-react';
import apiClient from './services/api';
import Footer from './components/Footer';

interface HealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  database: string;
  timestamp: string;
}

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const response = await apiClient.get<HealthData>('/health');
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealth(response.data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || 
        err.message || 
        'Unable to connect to ParkGuard API server.'
      );
      setHealth(null);
      setLatency(null);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b10] text-[#f3f4f6]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#25283d] bg-[#12131c]/90 backdrop-blur-md px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-950/50 border border-purple-500/30">
              <Shield className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-wider text-white">PARKGUARD</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700/50">
                  SYSTEM CORE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Parking Management & Barcode System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime API status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181926] border border-[#25283d] text-xs">
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  <span className="text-slate-400">Verifying API...</span>
                </>
              ) : health?.status === 'healthy' ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-medium">API Online</span>
                  {latency !== null && (
                    <span className="text-slate-400 hidden md:inline">({latency}ms)</span>
                  )}
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-medium">Connecting</span>
                </>
              )}
            </div>

            <button
              onClick={checkHealth}
              disabled={loading}
              title="Refresh Health Status"
              className="p-2 rounded-lg bg-[#181926] hover:bg-[#1f2033] border border-[#25283d] text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#12131c] via-[#181926] to-[#141224] border border-[#25283d] p-6 lg:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-medium mb-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Stage 1 Foundation Operational
            </div>
            <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Enterprise Controlled Parking & Barcode Ecosystem
            </h1>
            <p className="mt-3 text-sm lg:text-base text-slate-400 leading-relaxed">
              ParkGuard provides mission-critical vehicle tracking, instant QR/barcode credential scanning, automated entry/exit auditing, and role-enforced parking management for controlled institutions and commercial facilities.
            </p>
          </div>
        </section>

        {/* Live Diagnostics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: API Server */}
          <div className="p-5 rounded-xl bg-[#12131c] border border-[#25283d] shadow-sm hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Backend Engine
              </span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">FastAPI</span>
              <span className="text-xs text-purple-400 font-mono">
                {health?.version ? `v${health.version}` : 'v1.0.0'}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Asynchronous Python runtime with Pydantic v2 validation and structured logging.
            </p>
          </div>

          {/* Card 2: Database Connectivity */}
          <div className="p-5 rounded-xl bg-[#12131c] border border-[#25283d] shadow-sm hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Database State
              </span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white capitalize">
                {health?.database || 'Configured'}
              </span>
              <span className="text-xs text-emerald-400">SQLite / PG Ready</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              SQLAlchemy ORM with connection pooling, foreign keys enforcement, and migration hooks.
            </p>
          </div>

          {/* Card 3: Frontend Architecture */}
          <div className="p-5 rounded-xl bg-[#12131c] border border-[#25283d] shadow-sm hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Frontend Client
              </span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">React 19 + Vite</span>
              <span className="text-xs text-purple-400">TypeScript</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Tailwind CSS, modular routing, resilient Axios client, and Vercel-ready SPA routing.
            </p>
          </div>

          {/* Card 4: Security Layer */}
          <div className="p-5 rounded-xl bg-[#12131c] border border-[#25283d] shadow-sm hover:border-purple-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Security Policy
              </span>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">RBAC + JWT</span>
              <span className="text-xs text-emerald-400">Hardened</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Scoped roles, password hashing, sanitized logs, and zero database exposure to client.
            </p>
          </div>
        </section>

        {/* Backend Connectivity Status Box */}
        <section className="p-6 rounded-xl bg-[#12131c] border border-[#25283d] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#25283d] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wifi className="w-5 h-5 text-purple-400" />
                Backend Health & Connectivity Diagnostics
              </h2>
              <p className="text-xs text-slate-400">
                Real-time validation of backend API and database handshake
              </p>
            </div>
            {lastChecked && (
              <span className="text-xs text-slate-400">
                Last checked: <span className="text-slate-300 font-mono">{lastChecked}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              Checking API endpoints and database readiness...
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">API Connection Note</p>
                <p className="text-xs mt-1 text-red-300/90">{error}</p>
                <p className="text-xs mt-2 text-slate-400">
                  Ensure the FastAPI backend server is running via{' '}
                  <code className="text-purple-300 bg-purple-950/40 px-1 py-0.5 rounded">
                    uvicorn backend.app.main:app --reload
                  </code>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#181926] border border-[#25283d]">
                <span className="text-slate-400 block mb-1">Service Status</span>
                <span className="text-emerald-400 font-bold uppercase">{health?.status}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#181926] border border-[#25283d]">
                <span className="text-slate-400 block mb-1">Database Connectivity</span>
                <span className="text-emerald-400 font-bold uppercase">{health?.database}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#181926] border border-[#25283d]">
                <span className="text-slate-400 block mb-1">Server UTC Timestamp</span>
                <span className="text-slate-300 truncate block">{health?.timestamp}</span>
              </div>
            </div>
          )}
        </section>

        {/* System Roadmap & Planned Modules */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            ParkGuard System Modules Roadmap
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] opacity-90">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
                <Car className="w-4 h-4" />
                Vehicle Registry
              </div>
              <p className="text-xs text-slate-400">
                Number plate validation, vehicle types, owner metadata, and multi-field search.
              </p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                Stage 3
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] opacity-90">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
                <QrCode className="w-4 h-4" />
                QR & Barcode Scanning
              </div>
              <p className="text-xs text-slate-400">
                Cryptographic lookup tokens, camera scanning, printable cards, and revocation.
              </p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                Stage 4
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#12131c] border border-[#25283d] opacity-90">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1.5">
                <Activity className="w-4 h-4" />
                Entry & Exit Auditing
              </div>
              <p className="text-xs text-slate-400">
                Duplicate prevention, live parking duration tracking, and concurrency protection.
              </p>
              <span className="inline-block mt-3 text-[10px] font-semibold text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                Stage 5
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Required Footer */}
      <Footer />
    </div>
  );
};

export default App;
