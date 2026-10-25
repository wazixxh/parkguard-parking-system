import React from 'react';
import { X, Printer, Shield, CheckCircle } from 'lucide-react';
import type { PrintableCardData } from '../types';

interface PrintableCardModalProps {
  cardData: PrintableCardData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableCardModal: React.FC<PrintableCardModalProps> = ({
  cardData,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !cardData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      {/* Container - hide non-card elements when printing */}
      <div className="relative w-full max-w-lg bg-[#12131c] border border-[#25283d] rounded-2xl shadow-2xl overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between p-4 border-b border-[#25283d] bg-[#181926] print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Printable Vehicle Identification Pass</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#25283d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Actual Pass Card - Formatted for print & screen */}
        <div id="printable-vehicle-pass" className="p-6 print:p-4">
          <div className="rounded-xl border-2 border-purple-500/40 bg-gradient-to-b from-[#181926] to-[#0f1019] p-6 shadow-xl print:border-black print:bg-white print:text-black print:shadow-none">
            {/* Top Pass Card Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20 print:border-black">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-sm print:bg-black">
                  PG
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wider text-white print:text-black">
                    PARKGUARD SECURITY
                  </h3>
                  <p className="text-[10px] text-purple-300 print:text-gray-600 font-semibold tracking-wider uppercase">
                    Official Vehicle Parking Permit
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-400 print:text-gray-700 block">
                  PASS ID: {cardData.vehicle_id}
                </span>
                <span className="text-[9px] text-slate-500 print:text-gray-500 block">
                  ISSUED: {cardData.registration_date}
                </span>
              </div>
            </div>

            {/* Core Identification Body */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-6 items-center">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white print:bg-transparent">
                <img
                  src={cardData.qr_image_data_uri}
                  alt="Vehicle QR Code"
                  className="w-32 h-32 object-contain"
                />
                <span className="text-[9px] font-mono text-slate-800 font-bold mt-1 tracking-wider">
                  SCAN FOR AUDIT
                </span>
              </div>

              {/* Vehicle & Plate Info */}
              <div className="sm:col-span-2 space-y-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 print:text-gray-600 uppercase tracking-wider block">
                    Registration Plate
                  </span>
                  <div className="inline-block mt-1 px-3 py-1 rounded bg-black/60 border-2 border-purple-400 font-mono text-xl font-black text-white tracking-widest shadow-inner print:border-black print:bg-gray-100 print:text-black">
                    {cardData.plate_number}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-gray-600 block">Vehicle Model</span>
                    <span className="font-bold text-white print:text-black">{cardData.make_model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-gray-600 block">Category</span>
                    <span className="font-bold text-purple-300 print:text-black">{cardData.vehicle_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-gray-600 block">Authorized Driver</span>
                    <span className="font-bold text-white print:text-black truncate block">{cardData.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-gray-600 block">Permitted Zone</span>
                    <span className="font-bold text-emerald-400 print:text-black">{cardData.parking_area_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barcode Strip & Footer */}
            <div className="pt-3 border-t border-purple-500/20 print:border-black flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 print:text-gray-700">
              <div className="font-mono text-center sm:text-left">
                <span className="text-[9px] block text-slate-500 print:text-gray-500">BARCODE CREDENTIAL:</span>
                <span className="font-bold tracking-widest text-slate-200 print:text-black">{cardData.barcode_token}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold print:text-black">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Authorized Institution Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom helper text - Hidden on print */}
        <div className="p-4 bg-[#181926] border-t border-[#25283d] text-center print:hidden">
          <p className="text-[11px] text-slate-400">
            Click <strong className="text-purple-300">Print Card</strong> to generate standard physical windshield permits or security badges.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintableCardModal;
