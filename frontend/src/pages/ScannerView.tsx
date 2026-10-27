import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  Search, 
  CheckCircle2, 
  AlertOctagon, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCw,
  VideoOff,
  Printer
} from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { api } from '../services/api';
import type { ScanValidationResult, ScanEvent } from '../types';

interface ScannerViewProps {
  onOpenRegisterWithPlate?: (plate: string) => void;
  onOpenPrintCard?: (vehicleId: number) => void;
  onOpenIncidentWithVehicle?: (plate: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onOpenRegisterWithPlate,
  onOpenPrintCard,
  onOpenIncidentWithVehicle,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [scanResult, setScanResult] = useState<ScanValidationResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEvent[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch {
        // ignore clear error
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const loadScanHistory = async () => {
    try {
      const data = await api.getScanHistory({ limit: 10 });
      setRecentScans(data.items);
    } catch (err) {
      console.warn("Could not load scan history", err);
    }
  };

  useEffect(() => {
    loadScanHistory();
    return () => {
      stopCameraScanner();
    };
  }, []);

  const handleValidation = async (tokenString: string, type: string = 'manual') => {
    if (!tokenString.trim()) return;
    setValidating(true);
    setActionSuccess(null);

    try {
      const result = await api.validateScan(tokenString.trim(), type);
      setScanResult(result);
      loadScanHistory();
    } catch (err: any) {
      setScanResult({
        valid: false,
        result: 'not_found',
        message: err.response?.data?.error?.message || 'Verification failed. Server unreachable.',
        is_parked: false,
      });
    } finally {
      setValidating(false);
    }
  };

  const startCameraScanner = () => {
    setCameraError(null);
    setIsCameraActive(true);

    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            supportedScanTypes: [
              Html5QrcodeScanType.SCAN_TYPE_CAMERA,
            ],
          },
          false
        );

        scanner.render(
          (decodedText) => {
            handleValidation(decodedText, 'qr');
            scanner.pause(true);
            setTimeout(() => {
              try { 
                scanner.resume(); 
              } catch {
                // ignore resume error
              }
            }, 3000);
          },
          () => {
            // normal scanning frames
          }
        );

        scannerRef.current = scanner;
      } catch {
        setCameraError(
          'Unable to access camera. Please allow camera permissions or use manual license plate search below.'
        );
        setIsCameraActive(false);
      }
    }, 200);
  };

  const handleRecordEntry = async () => {
    if (!scanResult?.vehicle) return;
    setValidating(true);
    setActionSuccess(null);
    try {
      await api.recordEntry({
        vehicle_identifier: scanResult.vehicle.plate_number,
        entry_method: 'qr_scan',
      });
      setActionSuccess(`Vehicle ${scanResult.vehicle.plate_number} entry successfully recorded!`);
      // Re-validate to update state
      handleValidation(scanResult.vehicle.plate_number, 'manual');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record entry.');
    } finally {
      setValidating(false);
    }
  };

  const handleRecordExit = async () => {
    if (!scanResult?.vehicle) return;
    setValidating(true);
    setActionSuccess(null);
    try {
      await api.recordExit({
        vehicle_identifier: scanResult.vehicle.plate_number,
        exit_method: 'qr_scan',
      });
      setActionSuccess(`Vehicle ${scanResult.vehicle.plate_number} exit successfully recorded!`);
      // Re-validate to update state
      handleValidation(scanResult.vehicle.plate_number, 'manual');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to record exit.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-400" />
            QR & Barcode Vehicle Verification
          </h1>
          <p className="text-xs text-slate-400">
            Scan vehicle windshield pass credentials or enter plate numbers for instant gate authorization.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Primary Scanner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Camera Scanner & Manual Lookup */}
        <div className="space-y-5">
          {/* Camera Viewport Box */}
          <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-400" />
                Live Camera QR Reader
              </span>
              {isCameraActive ? (
                <button
                  onClick={stopCameraScanner}
                  className="px-2.5 py-1 rounded-md bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-[11px] font-medium"
                >
                  Turn Off Camera
                </button>
              ) : (
                <button
                  onClick={startCameraScanner}
                  className="px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold shadow-md shadow-purple-950/50"
                >
                  Start Camera
                </button>
              )}
            </div>

            {/* Container for html5-qrcode */}
            {isCameraActive ? (
              <div className="rounded-xl overflow-hidden bg-black border border-[#25283d] min-h-[260px] flex items-center justify-center">
                <div id="qr-reader-container" className="w-full text-white text-xs" />
              </div>
            ) : (
              <div className="rounded-xl p-8 bg-[#0d0e15] border border-dashed border-[#25283d] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center mb-3">
                  <Camera className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xs font-bold text-white">Camera Scanner Idle</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Click 'Start Camera' to scan physical QR windshield tags, or use manual lookup below.
                </p>
                <button
                  onClick={startCameraScanner}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-[#181926] hover:bg-[#25283d] border border-[#25283d] text-slate-200 text-xs font-semibold"
                >
                  Enable Camera Video Feed
                </button>
              </div>
            )}

            {cameraError && (
              <div className="mt-3 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs flex items-center gap-2">
                <VideoOff className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Manual Lookup Card */}
          <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl">
            <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              Manual Plate or Token Lookup
            </h3>
            <p className="text-[11px] text-slate-400 mb-3">
              Type the license plate number, QR token (<code className="text-purple-300">PGQR-XXXX</code>), or barcode number.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleValidation(manualInput, 'manual');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                required
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                placeholder="Enter plate (e.g. ABC-1234) or token..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#0d0e15] border border-[#25283d] text-white text-xs font-mono uppercase focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={validating}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-950/50 transition-colors disabled:opacity-50"
              >
                {validating ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Verification Card & Actions */}
        <div className="space-y-5">
          {scanResult ? (
            <div className={`p-6 rounded-2xl border shadow-2xl transition-all ${
              scanResult.result === 'success'
                ? 'bg-gradient-to-br from-[#12131c] to-[#141829] border-purple-500/50'
                : scanResult.result === 'blocked'
                ? 'bg-gradient-to-br from-[#1a0f14] to-[#12131c] border-red-500/60'
                : 'bg-gradient-to-br from-[#181512] to-[#12131c] border-amber-500/50'
            }`}>
              {/* Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-[#25283d]">
                <div className="flex items-center gap-2.5">
                  {scanResult.result === 'success' ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : scanResult.result === 'blocked' ? (
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                      <AlertOctagon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                      {scanResult.result === 'success' ? 'Authorized Vehicle Verified' : scanResult.result.toUpperCase()}
                    </h3>
                    <p className="text-[11px] text-slate-400">{scanResult.message}</p>
                  </div>
                </div>

                {scanResult.vehicle && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    scanResult.is_parked
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-slate-900 text-slate-300 border border-slate-700'
                  }`}>
                    {scanResult.is_parked ? 'Parked Inside' : 'Not Parked'}
                  </span>
                )}
              </div>

              {/* Vehicle Specification Display */}
              {scanResult.vehicle ? (
                <div className="py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Registration Plate</span>
                      <span className="inline-block mt-0.5 px-3 py-1 rounded bg-black/70 border border-purple-400 font-mono text-xl font-black text-white tracking-wider">
                        {scanResult.vehicle.plate_number}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pass ID</span>
                      <span className="font-mono text-xs font-bold text-slate-300">{scanResult.vehicle.vehicle_id}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#0d0e15] p-3 rounded-xl border border-[#25283d]">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Make & Model</span>
                      <span className="font-bold text-white">{scanResult.vehicle.make} {scanResult.vehicle.model}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Category</span>
                      <span className="font-bold text-purple-300 uppercase">{scanResult.vehicle.vehicle_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Driver Name</span>
                      <span className="font-bold text-white">{scanResult.vehicle.owner_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Contact Phone</span>
                      <span className="font-bold text-slate-300 font-mono">{scanResult.vehicle.owner_phone || 'N/A'}</span>
                    </div>
                    {scanResult.is_parked && scanResult.parked_duration_minutes && (
                      <div className="col-span-2 pt-2 border-t border-[#25283d] flex items-center justify-between text-emerald-400">
                        <span>Current Elapsed Parking Time:</span>
                        <span className="font-bold font-mono">{scanResult.parked_duration_minutes} minutes</span>
                      </div>
                    )}
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {!scanResult.is_parked ? (
                      <button
                        onClick={handleRecordEntry}
                        disabled={validating || scanResult.vehicle.status !== 'active'}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 transition-all disabled:opacity-50"
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        <span>Record Vehicle Entry</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleRecordExit}
                        disabled={validating}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 transition-all disabled:opacity-50"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Record Vehicle Exit</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenPrintCard?.(scanResult.vehicle!.id)}
                      className="px-3 py-2.5 rounded-xl bg-[#181926] hover:bg-[#25283d] text-slate-200 text-xs font-semibold border border-[#25283d] flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-purple-400" />
                      <span>Print Pass</span>
                    </button>

                    <button
                      onClick={() => onOpenIncidentWithVehicle?.(scanResult.vehicle!.plate_number)}
                      className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800/40 flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag Incident</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    The identifier <code className="text-purple-300 bg-purple-950/50 px-1 py-0.5 rounded font-mono">{manualInput}</code> is not in the system registry.
                  </p>
                  <button
                    onClick={() => onOpenRegisterWithPlate?.(manualInput)}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/60"
                  >
                    Register This Vehicle Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-12 h-12 rounded-xl bg-[#181926] border border-[#25283d] flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-xs font-bold text-white">Awaiting Vehicle Credential</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                Scan a barcode or QR code with your camera, or enter the plate number on the left to verify permit clearance.
              </p>
            </div>
          )}

          {/* Quick Scan History */}
          <div className="p-5 rounded-2xl bg-[#12131c] border border-[#25283d] shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white">Recent Security Scans</h3>
              <button onClick={loadScanHistory} className="text-slate-400 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#25283d]/60 max-h-48 overflow-y-auto">
              {recentScans.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-white">{s.plate_number || s.scanned_token}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5 uppercase font-medium">({s.scan_type})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      s.result === 'success' ? 'bg-purple-950 text-purple-300' : 'bg-red-950 text-red-300'
                    }`}>
                      {s.result}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(s.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
