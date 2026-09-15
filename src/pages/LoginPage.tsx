import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onGoToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onGoToRegister }) => {
  const { login } = useAuth();
  const [noHp, setNoHp] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noHp.trim()) {
      setErrorMsg('Nomor HP wajib diisi');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMsg('PIN minimal 4 digit angka');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await login(noHp, pin);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal login. Periksa nomor HP dan PIN Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-center py-8 px-5 max-w-md mx-auto">
      {/* Header Branding */}
      <div className="pb-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F6B4C] to-[#094A34] text-[#FAF3D1] flex items-center justify-center mx-auto shadow-md mb-3 border border-[#D4AF37]/30">
          <svg width="34" height="34" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 8 C70 8 88 35 90 62 L90 88 L10 88 L10 62 C12 35 30 8 50 8 Z" />
            <path d="M50 40 C60 40 70 52 70 88 L30 88 C30 52 40 40 50 40 Z" fill="#094A34" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-[#1F2A24] font-heading tracking-tight">
          Masjid Al Hijrah PTPP
        </h1>
        <p className="text-xs text-[#6B7568] mt-1">
          Absensi Jamaah & Poin Kajian via QR Code
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-[#1F2A24] font-heading mb-1">
          Masuk Akun Jamaah
        </h2>
        <p className="text-xs text-[#6B7568] mb-5">
          Gunakan nomor HP yang sudah terdaftar untuk mencatat kehadiran.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1.5">
              Nomor Handphone (WhatsApp)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                required
              />
            </div>
            <span className="text-[10px] text-[#6B7568] mt-1 block">
              Format otomatis disesuaikan (628...)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1.5">
              PIN Keamanan (4-6 Digit)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7568] hover:text-[#1F2A24]"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0F6B4C] text-white font-semibold text-sm shadow-sm hover:bg-[#094A34] transition active:scale-98 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Register Link directly under login card */}
      <div className="mt-4 text-center">
        <p className="text-xs text-[#6B7568]">
          Belum punya akun jamaah?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-[#0F6B4C] hover:underline cursor-pointer"
          >
            Daftar Baru di Sini
          </button>
        </p>
      </div>
    </div>
  );
};
