import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, Briefcase, ChevronDown, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JenisKelamin, StatusJamaah } from '../types';

interface RegisterPageProps {
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin }) => {
  const { register } = useAuth();
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('pria');
  const [statusJamaah, setStatusJamaah] = useState<StatusJamaah>('Pegawai/PTPP');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap jamaah wajib diisi');
      return;
    }
    if (!noHp.trim()) {
      setErrorMsg('Nomor handphone wajib diisi');
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      setErrorMsg('PIN harus terdiri dari 4 sampai 6 digit angka');
      return;
    }
    if (pin !== pinConfirm) {
      setErrorMsg('Konfirmasi PIN tidak cocok');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await register(nama, noHp, pin, 'user', {
        email: email.trim() || undefined,
        tanggal_lahir: tanggalLahir || undefined,
        jenis_kelamin: jenisKelamin,
        status_jamaah: statusJamaah,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Pendaftaran gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col justify-between p-4 sm:p-5 max-w-md mx-auto">
      {/* Header */}
      <div className="pt-4 pb-2 text-center">
        <div className="w-13 h-13 rounded-2xl bg-[#0F6B4C] text-[#FAF3D1] flex items-center justify-center mx-auto shadow-sm mb-2">
          <svg width="26" height="26" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 8 C70 8 88 35 90 62 L90 88 L10 88 L10 62 C12 35 30 8 50 8 Z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-[#1F2A24] font-heading">
          Pendaftaran Jamaah
        </h1>
        <p className="text-xs text-[#6B7568] mt-0.5">
          Masjid Al Hijrah PTPP
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 my-auto space-y-3.5">
        <div>
          <h2 className="text-base font-bold text-[#1F2A24] font-heading mb-1">
            Buat Akun Baru
          </h2>
          <p className="text-xs text-[#6B7568]">
            Lengkapi data jamaah untuk mulai mengumpulkan poin kajian dan absensi.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nama Lengkap */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                required
              />
            </div>
          </div>

          {/* Nomor WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              Nomor Handphone (WhatsApp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                required
              />
            </div>
          </div>

          {/* Email (Opsional) */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              Email <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
              />
            </div>
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              Tanggal Lahir <span className="text-gray-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7] text-[#1F2A24]"
              />
            </div>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1.5">
              Jenis Kelamin <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJenisKelamin('pria')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  jenisKelamin === 'pria'
                    ? 'bg-emerald-50 border-[#0F6B4C] text-[#0F6B4C] ring-1 ring-[#0F6B4C]'
                    : 'bg-[#FAFAF7] border-gray-200 text-[#6B7568] hover:bg-gray-100'
                }`}
              >
                <span>Pria (Ikhwan)</span>
              </button>
              <button
                type="button"
                onClick={() => setJenisKelamin('wanita')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  jenisKelamin === 'wanita'
                    ? 'bg-emerald-50 border-[#0F6B4C] text-[#0F6B4C] ring-1 ring-[#0F6B4C]'
                    : 'bg-[#FAFAF7] border-gray-200 text-[#6B7568] hover:bg-gray-100'
                }`}
              >
                <span>Wanita (Akhwat)</span>
              </button>
            </div>
          </div>

          {/* Status Jamaah Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              Status Jamaah <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Briefcase className="w-4 h-4" />
              </div>
              <select
                value={statusJamaah}
                onChange={(e) => setStatusJamaah(e.target.value as StatusJamaah)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7] appearance-none cursor-pointer text-[#1F2A24]"
                required
              >
                <option value="Pegawai/PTPP">Pegawai/PTPP</option>
                <option value="Keluarga Pegawai">Keluarga Pegawai</option>
                <option value="Mitra/Vendor">Mitra/Vendor</option>
                <option value="Umum">Umum</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* PIN Setup */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                Buat PIN (4-6 Digit) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                Ulangi PIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-[11px] text-[#0F6B4C] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
            </button>
            <span className="text-[10px] text-[#6B7568]">Gunakan angka mudah diingat</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#0F6B4C] text-white font-semibold text-sm shadow-sm hover:bg-[#094A34] transition active:scale-98 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <span>Mendaftarkan...</span>
            ) : (
              <>
                <span>Daftar & Masuk Otomatis</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Login Link */}
      <div className="py-3 text-center">
        <p className="text-xs text-[#6B7568]">
          Sudah terdaftar sebelumnya?{' '}
          <button
            onClick={onGoToLogin}
            className="font-bold text-[#0F6B4C] hover:underline cursor-pointer"
          >
            Masuk ke Akun
          </button>
        </p>
      </div>
    </div>
  );
};
