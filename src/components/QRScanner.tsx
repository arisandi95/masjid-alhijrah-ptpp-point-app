import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Award,
  UploadCloud,
  Sparkles,
  Gift,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ScanResult, MasterEvent, EventReviewInput } from '../types';
import { EventFeedbackModal } from './EventFeedbackModal';

interface QRScannerProps {
  onSuccessScan?: (result: ScanResult) => void;
  onClose?: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onSuccessScan, onClose }) => {
  const { user, updateUserPoints, refreshProfile } = useAuth();
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pendingEvent, setPendingEvent] = useState<MasterEvent | null>(null);
  const [pendingToken, setPendingToken] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'alhijrah-qr-reader';
  const isHandlingScanRef = useRef<boolean>(false);

  // Sound feedback via Web Audio API
  const playBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Audio not supported or blocked
    }
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F6B4C', '#D4AF37', '#10B981', '#F59E0B'],
      });
    } catch (e) {
      console.warn('Confetti error', e);
    }
  };

  // Initialize and start scanner
  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      try {
        setCameraError(null);
        // Ensure DOM element is present
        const element = document.getElementById(readerElementId);
        if (!element) return;

        const html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        const qrConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          qrConfig,
          (decodedText) => {
            if (isMounted) {
              handleDecodedToken(decodedText);
            }
          },
          () => {
            // scan failure callback on every non-qr frame (ignore)
          }
        );

        if (isMounted) {
          setScannerStarted(true);
        }
      } catch (err: any) {
        console.warn('Camera start error:', err);
        if (isMounted) {
          setScannerStarted(false);
          const msg =
            err?.message ||
            'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser.';
          setCameraError(msg);
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch((e) => console.warn('Error stopping scanner:', e));
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  // Process Scanned Token
  const handleDecodedToken = async (rawToken: string) => {
    if (isHandlingScanRef.current || isProcessing) return;
    isHandlingScanRef.current = true;
    setIsProcessing(true);

    // Pause scanner if running
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause();
      }
    } catch (e) {
      // ignore pause error
    }

    try {
      if (!user) {
        setScanResult({
          success: false,
          message: 'Silakan login terlebih dahulu untuk melakukan absensi.',
        });
        playBeep(false);
        return;
      }

      // Step 1: Validasi token QR terlebih dahulu
      const check = await api.validateQR(user.user_id, rawToken);
      if (!check.success || !check.data) {
        setScanResult({
          success: false,
          already_scanned: (check as any).already_scanned || false,
          kuota_penuh: (check as any).kuota_penuh || false,
          message: check.error || 'QR Code tidak valid atau Anda sudah absen.',
          event: check.data,
        });
        playBeep(false);
        return;
      }

      const targetEvent = check.data;

      // Jika jenisnya penukaran kupon (redeem), langsung proses
      if (targetEvent.event_type === 'redeem') {
        const result = await api.scanQR(user.user_id, rawToken);
        setScanResult(result);
        if (result.success) {
          playBeep(true);
          triggerConfetti();
          if (result.total_poin_terbaru !== undefined) {
            updateUserPoints(result.total_poin_terbaru);
          } else {
            refreshProfile();
          }
          if (onSuccessScan) onSuccessScan(result);
        } else {
          playBeep(false);
        }
        return;
      }

      // FLOW PENILAIAN ACARA:
      // Pengguna wajib mengisi formulir penilaian acara terlebih dahulu sebelum poin ditambahkan
      setPendingEvent(targetEvent);
      setPendingToken(rawToken);
    } catch (err: any) {
      playBeep(false);
      setScanResult({
        success: false,
        message: err.message || 'Gagal memproses QR code. Coba beberapa saat lagi.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Submit Penilaian Acara & Klaim Poin
  const handleSubmitReview = async (reviewData: EventReviewInput) => {
    if (!user || !pendingEvent || !pendingToken) return;
    setIsSubmittingReview(true);

    try {
      const result = await api.scanQR(user.user_id, pendingToken, reviewData);
      setPendingEvent(null);
      setPendingToken('');
      setScanResult(result);

      if (result.success) {
        if (result.kuota_penuh || (result.poin_didapat ?? 0) === 0) {
          playBeep(false);
        } else {
          playBeep(true);
          triggerConfetti();
        }
        if (result.total_poin_terbaru !== undefined) {
          updateUserPoints(result.total_poin_terbaru);
        } else {
          refreshProfile();
        }
        if (onSuccessScan) onSuccessScan(result);
      } else {
        playBeep(false);
      }
    } catch (err: any) {
      playBeep(false);
      setPendingEvent(null);
      setPendingToken('');
      setScanResult({
        success: false,
        message: err.message || 'Gagal menyimpan penilaian acara. Coba lagi.',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelReview = () => {
    setPendingEvent(null);
    setPendingToken('');
    handleScanAgain();
  };

  // Reset scanner to scan again
  const handleScanAgain = () => {
    setScanResult(null);
    isHandlingScanRef.current = false;
    try {
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } catch (e) {
      console.warn('Error resuming scanner:', e);
    }
  };

  // Fallback: Scan from image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const html5QrCode = new Html5Qrcode('file-scanner-temp');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleDecodedToken(decodedText);
    } catch (err: any) {
      setIsProcessing(false);
      setScanResult({
        success: false,
        message: 'QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak buram.',
      });
      playBeep(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* Hidden container for file scan */}
      <div id="file-scanner-temp" className="hidden" />

      {/* Camera Viewport Container */}
      <div className="relative bg-black rounded-3xl overflow-hidden shadow-xl border-2 border-[#0F6B4C]/30 aspect-square max-w-sm mx-auto">
        <div id={readerElementId} className="w-full h-full object-cover" />

        {/* Reticle / Target Overlay */}
        {!scanResult && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-60 h-60 border-2 border-dashed border-[#D4AF37] rounded-2xl relative flex items-center justify-center bg-black/10">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#0F6B4C] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#0F6B4C] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#0F6B4C] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#0F6B4C] rounded-br-lg" />

              {/* Scanning Laser Animation */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-pulse" />

              <span className="text-[11px] text-white/80 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
                Arahkan ke QR Kajian
              </span>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
            <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mb-2" />
            <p className="text-xs font-semibold">Memverifikasi Absensi...</p>
          </div>
        )}

        {/* Camera Permission / Error Fallback */}
        {cameraError && !scanResult && (
          <div className="absolute inset-0 bg-[#FAFAF7] p-5 flex flex-col items-center justify-center text-center z-10">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#1F2A24] font-heading">Kamera Belum Aktif</h4>
            <p className="text-xs text-[#6B7568] mt-1 max-w-xs leading-relaxed">
              Izinkan akses kamera di browser Anda atau gunakan upload foto QR di bawah.
            </p>

            <label className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition">
              <UploadCloud className="w-4 h-4" />
              <span>Pilih Foto QR Code</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      {/* Result Dialog Modal */}
      {scanResult && (() => {
        const isRedeem = scanResult.event?.event_type === 'redeem' || (scanResult.poin_didapat !== undefined && scanResult.poin_didapat < 0);
        const isQuotaFull = scanResult.kuota_penuh || (!isRedeem && scanResult.poin_didapat === 0);
        const isInsufficientPoints = (scanResult.message || '').toLowerCase().includes('tidak mencukupi');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 text-center">
              {scanResult.success ? (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs ${
                      isRedeem
                        ? 'bg-rose-50 text-rose-600'
                        : isQuotaFull
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-[#E8F3EE] text-[#0F6B4C]'
                    }`}
                  >
                    {isRedeem ? (
                      <Gift className="w-8 h-8" />
                    ) : isQuotaFull ? (
                      <AlertCircle className="w-8 h-8" />
                    ) : (
                      <CheckCircle className="w-8 h-8" />
                    )}
                  </div>

                  {isRedeem ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs mb-2">
                      <Gift className="w-3.5 h-3.5" />
                      <span>-{Math.abs(scanResult.poin_didapat ?? scanResult.event?.poin_value ?? 0)} Poin Ditukarkan (Redeem)</span>
                    </div>
                  ) : isQuotaFull ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kuota Poin Acara Penuh (0 Poin)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#856404] font-bold text-xs mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#B78A1D]" />
                      <span>+{scanResult.poin_didapat} Poin Didapat!</span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-[#1F2A24] font-heading">
                    {isRedeem
                      ? 'Penukaran Berhasil'
                      : isQuotaFull
                      ? 'Penilaian Berhasil Dikirim'
                      : 'Absensi Berhasil'}
                  </h3>
                  <p className="text-xs text-[#6B7568] mt-1.5 px-2 leading-relaxed">
                    {scanResult.message}
                  </p>

                  {scanResult.total_poin_terbaru !== undefined && (
                    <div className="mt-4 bg-[#FAFAF7] p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-[#6B7568]">Sisa Poin Anda Sekarang:</span>
                      <span className="text-base font-extrabold text-[#0F6B4C] font-heading">
                        {scanResult.total_poin_terbaru} Poin
                      </span>
                    </div>
                  )}

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={() => {
                        if (onClose) onClose();
                        handleScanAgain();
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold shadow-sm hover:bg-[#094A34] transition active:scale-98"
                    >
                      Kembali ke Beranda
                    </button>
                    <button
                      onClick={handleScanAgain}
                      className="w-full py-2 rounded-xl text-xs font-medium text-[#6B7568] hover:bg-gray-50 transition"
                    >
                      Scan QR Lain
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
                      scanResult.already_scanned
                        ? 'bg-amber-100 text-amber-700'
                        : scanResult.kuota_penuh || (scanResult.message || '').toLowerCase().includes('kuota')
                        ? 'bg-rose-100 text-rose-700'
                        : isInsufficientPoints
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-red-100 text-[#C0392B]'
                    }`}
                  >
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-[#1F2A24] font-heading">
                    {scanResult.already_scanned
                      ? 'Sudah Absen / Ditukarkan'
                      : scanResult.kuota_penuh || (scanResult.message || '').toLowerCase().includes('kuota')
                      ? 'Kuota Penukaran Habis'
                      : isInsufficientPoints
                      ? 'Poin Tidak Mencukupi'
                      : 'Scan Tidak Berhasil'}
                  </h3>
                  <p className="text-xs text-[#6B7568] mt-2 px-2 leading-relaxed">
                    {scanResult.message}
                  </p>

                  <div className="mt-5 space-y-2">
                    <button
                      onClick={handleScanAgain}
                      className="w-full py-2.5 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold shadow-sm hover:bg-[#094A34] transition active:scale-98"
                    >
                      Coba Scan Lagi
                    </button>
                    {onClose && (
                      <button
                        onClick={onClose}
                        className="w-full py-2 rounded-xl text-xs font-medium text-[#6B7568] hover:bg-gray-50 transition"
                      >
                        Tutup
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Alternative Controls: File Upload */}
      <div className="mt-4 space-y-2 max-w-sm mx-auto">
        <div className="flex items-center justify-between gap-2">
          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-[#1F2A24] hover:bg-gray-50 cursor-pointer shadow-2xs transition">
            <UploadCloud className="w-4 h-4 text-[#0F6B4C]" />
            <span>Upload Foto QR</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Event Feedback Modal */}
      {pendingEvent && (
        <EventFeedbackModal
          event={pendingEvent}
          isSubmitting={isSubmittingReview}
          onSubmit={handleSubmitReview}
          onCancel={handleCancelReview}
        />
      )}
    </div>
  );
};
