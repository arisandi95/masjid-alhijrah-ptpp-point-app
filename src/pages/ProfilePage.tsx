import React, { useState } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  IdCard,
  Mail,
  Calendar,
  Building,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  Wallet,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CompleteNrpModal } from '../components/CompleteNrpModal';
import { getCompanyDisplayName, getUnitDisplayName } from '../utils/companyUtils';

interface ProfilePageProps {
  onBack?: () => void;
  onGoToReimburse?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, onGoToReimburse }) => {
  const { user, updateUserPin, logout, refreshProfile } = useAuth();

  // State PIN Form
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Status State
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // NRP Modal State
  const [showNrpModal, setShowNrpModal] = useState(false);

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle Submit PIN
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const cleanOld = oldPin.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanOld) {
      setPinError('PIN saat ini wajib diisi');
      return;
    }
    if (!cleanNew) {
      setPinError('PIN baru wajib diisi');
      return;
    }
    if (cleanNew.length < 4 || cleanNew.length > 6) {
      setPinError('PIN baru harus terdiri dari 4 sampai 6 digit angka');
      return;
    }
    if (!/^\d+$/.test(cleanNew)) {
      setPinError('PIN baru harus berupa angka saja (0-9)');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPinError('Konfirmasi PIN baru tidak sesuai');
      return;
    }
    if (cleanOld === cleanNew) {
      setPinError('PIN baru tidak boleh sama dengan PIN lama');
      return;
    }

    setPinLoading(true);
    try {
      const res = await updateUserPin(cleanOld, cleanNew);
      if (res.success) {
        setPinSuccess('Alhamdulillah! PIN keamanan Anda berhasil diperbarui.');
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => setPinSuccess(null), 5000);
      } else {
        setPinError(res.error || 'Gagal mengubah PIN. Pastikan PIN lama Anda benar.');
      }
    } catch (err: any) {
      setPinError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setPinLoading(false);
    }
  };

  const isMatching = confirmPin.length > 0 && newPin === confirmPin;
  const isNotMatching = confirmPin.length > 0 && newPin !== confirmPin;

  return (
    <div className="space-y-4 pt-1 pb-24 px-4 max-w-md mx-auto">
      {/* Complete / Edit NRP Modal */}
      <CompleteNrpModal
        isOpen={showNrpModal}
        onClose={() => setShowNrpModal(false)}
        onSuccess={() => {
          setShowNrpModal(false);
          refreshProfile();
        }}
        title="Ubah Nomor NRP Pegawai"
        description="Nomor Registrasi Pegawai (NRP) digunakan untuk validasi identitas jamaah dan audit klaim reimburse."
      />

      {/* Header Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#1F2A24] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition cursor-pointer shadow-2xs"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Masjid Al Hijrah PTPP
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-[#0F6B4C] text-[9px] font-bold rounded">
                Akun Jamaah
              </span>
            </div>
            <h1 className="text-base font-bold text-[#1F2A24] font-heading leading-tight">
              Profil Saya
            </h1>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
          title="Segarkan Profil"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </header>

      {/* Profile Card Hero */}
      <div className="bg-gradient-to-br from-[#0F6B4C] via-[#0D5C3E] to-[#083E2A] text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        {/* Subtle decorative Islamic arch */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <svg width="140" height="140" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C75 0 95 30 100 60 L100 100 L0 100 L0 60 C5 30 25 0 50 0 Z" />
          </svg>
        </div>

        <div className="flex items-center gap-3.5 relative z-10 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 ring-2 ring-[#D4AF37]/60 flex items-center justify-center text-white font-bold text-xl font-heading shadow-inner shrink-0">
            {user?.nama ? user.nama.substring(0, 2).toUpperCase() : <UserIcon className="w-7 h-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-[#FAF3D1]">
                {user?.role === 'admin' ? 'Pengurus / Takmir' : 'Jamaah'}
              </span>
              {user?.status_jamaah && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-800/60 text-emerald-100 border border-emerald-400/30">
                  {user.status_jamaah}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-white truncate mt-1">
              {user?.nama || 'Jamaah Al Hijrah'}
            </h2>
            <p className="text-xs text-emerald-100/80 font-mono">
              {user?.no_hp || '-'}
            </p>
          </div>
        </div>

        {/* Poin & Reimburse Shortcut */}
        <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs relative z-10">
          <div>
            <span className="text-[11px] text-emerald-100/80 block">Saldo Poin Kehadiran</span>
            <span className="text-base font-extrabold text-[#FAF3D1] font-heading">
              {(user?.total_poin || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-emerald-200">Poin (Rp {(user?.total_poin || 0).toLocaleString('id-ID')})</span>
            </span>
          </div>

          {onGoToReimburse && (
            <button
              onClick={onGoToReimburse}
              className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs border border-white/20 shadow-2xs"
            >
              <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Reimburse</span>
            </button>
          )}
        </div>
      </div>

      {/* Detail Informasi Jamaah */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <IdCard className="w-4 h-4 text-[#0F6B4C]" />
          <span>Informasi Akun Jamaah</span>
        </h3>

        <div className="grid grid-cols-1 gap-2.5 text-xs">
          {/* NRP */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
            <div className="flex items-center gap-2 text-[#6B7568]">
              <IdCard className="w-4 h-4 text-[#0F6B4C]" />
              <span>NRP Pegawai</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#1F2A24]">
                {user?.nrp || <span className="text-amber-700 italic font-normal">Belum diisi</span>}
              </span>
              <button
                onClick={() => setShowNrpModal(true)}
                className="text-[10px] text-[#0F6B4C] hover:underline font-semibold cursor-pointer"
              >
                {user?.nrp ? 'Ubah' : '+ Isi'}
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
            <div className="flex items-center gap-2 text-[#6B7568]">
              <Phone className="w-4 h-4 text-[#0F6B4C]" />
              <span>Nomor WhatsApp</span>
            </div>
            <span className="font-mono font-bold text-[#1F2A24]">
              {user?.no_hp || '-'}
            </span>
          </div>

          {/* Email */}
          {user?.email && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
              <div className="flex items-center gap-2 text-[#6B7568]">
                <Mail className="w-4 h-4 text-[#0F6B4C]" />
                <span>Email</span>
              </div>
              <span className="font-medium text-[#1F2A24] truncate max-w-[180px]">
                {user.email}
              </span>
            </div>
          )}

          {/* Perusahaan / PT */}
          {user?.company_id && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
              <div className="flex items-center gap-2 text-[#6B7568]">
                <Building className="w-4 h-4 text-[#0F6B4C]" />
                <span>Entitas / PT</span>
              </div>
              <span className="font-semibold text-[#1F2A24]">
                {getCompanyDisplayName(user.company_id)}
              </span>
            </div>
          )}

          {/* Unit Kerja */}
          {user?.unit_id && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
              <div className="flex items-center gap-2 text-[#6B7568]">
                <Briefcase className="w-4 h-4 text-[#0F6B4C]" />
                <span>Unit Kerja / Divisi</span>
              </div>
              <span className="font-semibold text-[#1F2A24]">
                {getUnitDisplayName(user.unit_id)}
              </span>
            </div>
          )}

          {/* Jenis Kelamin & Tanggal Lahir */}
          {(user?.jenis_kelamin || user?.tanggal_lahir) && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAFAF7] border border-gray-100">
              <div className="flex items-center gap-2 text-[#6B7568]">
                <Calendar className="w-4 h-4 text-[#0F6B4C]" />
                <span>Profil Personal</span>
              </div>
              <span className="font-medium text-[#1F2A24]">
                {user?.jenis_kelamin === 'wanita' ? 'Wanita' : 'Pria'}
                {user?.tanggal_lahir ? ` • ${user.tanggal_lahir}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card: Ubah PIN Keamanan */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Lock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2A24] font-heading">
                Ubah PIN Keamanan
              </h3>
              <p className="text-[11px] text-[#6B7568]">
                Gunakan PIN 4-6 digit angka untuk masuk akun & verifikasi klaim
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {pinSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs shadow-2xs">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#0F6B4C]" />
            <span>{pinSuccess}</span>
          </div>
        )}

        {pinError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-[#C0392B] flex items-start gap-2.5 text-xs shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{pinError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="space-y-3.5">
          {/* Field 1: PIN Lama */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              PIN Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showOldPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan PIN saat ini"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs text-[#1F2A24] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] bg-[#FAFAF7] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPin(!showOldPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7568] hover:text-[#1F2A24] cursor-pointer"
                title={showOldPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: PIN Baru */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
              PIN Baru (4-6 Digit Angka) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNewPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Buat 4-6 digit angka baru"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs text-[#1F2A24] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] bg-[#FAFAF7] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7568] hover:text-[#1F2A24] cursor-pointer"
                title={showNewPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {newPin.length > 0 && newPin.length < 4 && (
              <span className="text-[10px] text-amber-600 mt-1 block">
                Minimal 4 digit angka
              </span>
            )}
          </div>

          {/* Field 3: Konfirmasi PIN Baru */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#1F2A24]">
                Ulangi PIN Baru <span className="text-red-500">*</span>
              </label>
              {isMatching && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Cocok
                </span>
              )}
              {isNotMatching && (
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">
                  <X className="w-3 h-3" /> Tidak cocok
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Ketik ulang PIN baru"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs text-[#1F2A24] tracking-widest focus:outline-none bg-[#FAFAF7] transition ${
                  isNotMatching
                    ? 'border-red-300 focus:ring-2 focus:ring-red-400'
                    : isMatching
                    ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-500'
                    : 'border-gray-200 focus:ring-2 focus:ring-[#0F6B4C]'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7568] hover:text-[#1F2A24] cursor-pointer"
                title={showConfirmPin ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pinLoading || newPin.length < 4 || newPin !== confirmPin}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0F6B4C] to-[#0A4D36] hover:from-[#0c593f] hover:to-[#083e2b] text-white font-bold text-xs shadow-xs transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {pinLoading ? (
              <span>Menyimpan PIN...</span>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Simpan PIN Baru</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Logout Card */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#1F2A24]">Keluar dari Aplikasi</p>
          <p className="text-[11px] text-[#6B7568]">Akhiri sesi jamaah di perangkat ini</p>
        </div>
        <button
          onClick={logout}
          className="py-2 px-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-[#C0392B] border border-red-200 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-2 text-[10px] text-[#6B7568] space-y-1">
        <p className="font-semibold text-[#1F2A24]">Masjid Al Hijrah PTPP</p>
        <p>Sistem Absensi & Poin Kajian via QR Code • Versi 2.4.0 (PWA)</p>
      </div>
    </div>
  );
};
