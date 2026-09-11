import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { QRScanner } from '../components/QRScanner';
import { ScanResult } from '../types';

interface ScanPageProps {
  onBack: () => void;
  onScanCompleted: (result: ScanResult) => void;
}

export const ScanPage: React.FC<ScanPageProps> = ({ onBack, onScanCompleted }) => {
  return (
    <div className="min-h-screen pb-24 pt-3 px-4 max-w-md mx-auto space-y-3">
      {/* Header */}
      <header className="flex items-center justify-between py-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#1F2A24] flex items-center justify-center transition shadow-2xs hover:bg-gray-50"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold text-[#1F2A24] font-heading">
            Pindai QR Code Kajian
          </h1>
          <p className="text-[10px] text-[#6B7568]">
            Masjid Al Hijrah PTPP
          </p>
        </div>

        <div className="w-9 h-9 flex items-center justify-center text-[#0F6B4C]">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </header>

      {/* Instructions Card */}
      <div className="bg-[#E8F3EE] p-3 rounded-2xl border border-[#0F6B4C]/20 text-xs text-[#0F6B4C]">
        <p className="font-semibold leading-tight">
          Cara Absensi:
        </p>
        <p className="text-[11px] text-[#1F2A24] mt-0.5 leading-relaxed">
          Dekatkan kamera ponsel Anda ke QR Code yang terpajang di meja registrasi atau layar proyektor kajian.
        </p>
      </div>

      {/* Interactive Scanner */}
      <QRScanner
        onSuccessScan={(res) => {
          onScanCompleted(res);
        }}
        onClose={onBack}
      />
    </div>
  );
};
