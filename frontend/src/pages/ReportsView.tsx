import React from 'react';
import { FileSpreadsheet, Download, Printer, Car, Clock, AlertTriangle, QrCode } from 'lucide-react';
import { api } from '../services/api';

export const ReportsView: React.FC = () => {
  const exportCards = [
    {
      title: 'Vehicle Registry Master Report',
      description: 'Comprehensive list of all registered vehicle permits, license plates, categories, and owner contacts.',
      icon: Car,
      type: 'vehicles' as const,
      color: 'purple',
    },
    {
      title: 'Gate Parking Transactions Audit',
      description: 'Full chronological history of all check-ins, check-outs, gate methods, and calculated parking durations.',
      icon: Clock,
      type: 'transactions' as const,
      color: 'emerald',
    },
    {
      title: 'Security Incidents & Violations',
      description: 'Log of wrong-parking offenses, blocked driveways, stall infringements, and security resolution notes.',
      icon: AlertTriangle,
      type: 'incidents' as const,
      color: 'amber',
    },
    {
      title: 'Credential Verification & Scans Log',
      description: 'Audit trail of all QR and barcode scans performed by parking officers, including successful and blocked scans.',
      icon: QrCode,
      type: 'scans' as const,
      color: 'blue',
    },
  ];

  const handleDownload = (type: 'vehicles' | 'transactions' | 'incidents' | 'scans') => {
    api.downloadCsv(type).catch(err => {
      alert(err.response?.data?.error?.message || "Export failed.");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            Compliance, Auditing & Data Reports
          </h1>
          <p className="text-xs text-slate-400">
            Export structured CSV ledgers, print official parking reports, and generate audit compliance datasets.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-200 text-xs font-semibold border border-[#25283d] transition-colors print:hidden"
        >
          <Printer className="w-4 h-4 text-purple-400" />
          <span>Print Page Summary</span>
        </button>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="p-6 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-lg flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-[#181926] border border-[#25283d] text-purple-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.description}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#25283d] flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold tracking-wider">
                  Format: RFC 4180 CSV
                </span>
                <button
                  onClick={() => handleDownload(c.type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsView;
