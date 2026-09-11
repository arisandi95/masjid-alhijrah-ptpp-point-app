import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <div className="bg-[#E8F3EE] border border-[#0F6B4C]/20 px-3 py-2 rounded-xl mb-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F6B4C] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F6B4C]">Install Aplikasi Al Hijrah</p>
              <p className="text-[11px] text-[#6B7568]">Akses cepat di layar utama HP Anda</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={install}
              className="bg-[#0F6B4C] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs hover:bg-[#094A34] transition active:scale-95"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-[#6B7568] hover:text-[#1F2A24] p-1"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isIOS && !isInstallable && (
        <div className="bg-[#E8F3EE] border border-[#0F6B4C]/20 px-3 py-2 rounded-xl mb-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F6B4C] flex items-center justify-center text-white shrink-0">
              <Share className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0F6B4C]">Pasang di iPhone / iPad</p>
              <p className="text-[11px] text-[#6B7568]">Tambahkan ke Home Screen</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowIOSGuide(true)}
              className="bg-[#0F6B4C] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xs hover:bg-[#094A34] transition active:scale-95"
            >
              Panduan
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-[#6B7568] hover:text-[#1F2A24] p-1"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-[#E8F3EE] text-[#0F6B4C] flex items-center justify-center mx-auto mb-3">
              <PlusSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2A24] text-center font-heading">
              Pasang di Layar Utama iPhone
            </h3>
            <p className="text-xs text-[#6B7568] text-center mt-1">
              Jadikan aplikasi web ini terasa seperti aplikasi mobile asli:
            </p>

            <div className="mt-4 space-y-3 bg-[#FAFAF7] p-3.5 rounded-xl border border-gray-100 text-xs text-[#1F2A24]">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F6B4C] text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                <span>Tekan tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline text-[#0F6B4C]" /> di toolbar Safari bawah.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F6B4C] text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                <span>Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama</strong> (Add to Home Screen).</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0F6B4C] text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                <span>Tekan <strong>Tambah (Add)</strong> di pojok kanan atas.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#0F6B4C] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#094A34] transition active:scale-98"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
