import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Building2,
  Layers,
  IdCard,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { JenisKelamin, Company, Unit, StatusPegawai } from '../types';
import { api } from '../services/api';
import { IslamicMandala } from '../components/IslamicMandala';

interface RegisterPageProps {
  onGoToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onGoToLogin }) => {
  const { register } = useAuth();
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [nrp, setNrp] = useState('');
  const [email, setEmail] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('pria');
  const [statusPegawai, setStatusPegawai] = useState<StatusPegawai>('Organik');
  const [companyId, setCompanyId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loadingMaster, setLoadingMaster] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitText, setCustomUnitText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        const [compRes, unitRes] = await Promise.all([
          api.getCompanies(),
          api.getUnits(),
        ]);
        if (!isMounted) return;

        let compList: Company[] = [];
        if (compRes.success && Array.isArray(compRes.data) && compRes.data.length > 0) {
          compList = compRes.data;
        } else {
          const { DEFAULT_COMPANIES } = await import('../services/mockStorage');
          compList = DEFAULT_COMPANIES;
        }

        let unitList: Unit[] = [];
        if (unitRes.success && Array.isArray(unitRes.data) && unitRes.data.length > 0) {
          unitList = unitRes.data;
        } else {
          const { DEFAULT_UNITS } = await import('../services/mockStorage');
          unitList = DEFAULT_UNITS;
        }

        setCompanies(compList);
        setUnits(unitList);

        if (compList.length > 0) {
          setCompanyId(String(compList[0].company_id).trim());
        }
      } catch (err) {
        console.warn('Error fetching master data:', err);
        const { DEFAULT_COMPANIES, DEFAULT_UNITS } = await import('../services/mockStorage');
        if (isMounted) {
          setCompanies(DEFAULT_COMPANIES);
          setUnits(DEFAULT_UNITS);
          setCompanyId(DEFAULT_COMPANIES[0].company_id);
        }
      } finally {
        if (isMounted) {
          setLoadingMaster(false);
        }
      }
    };
    fetchMasterData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!companyId) {
      setFilteredUnits([]);
      if (!isCustomUnit) setUnitId('');
      return;
    }

    const compIdStr = String(companyId).trim();
    const selectedComp = companies.find(
      (c) => String(c.company_id).trim() === compIdStr || c.company_name.trim().toLowerCase() === compIdStr.toLowerCase()
    );
    const compNameStr = selectedComp ? String(selectedComp.company_name).trim().toLowerCase() : '';

    const matching = units.filter((u) => {
      const uCompId = String(u.company_id || '').trim();
      const uCompName = String(u.company_name || '').trim().toLowerCase();
      return (
        uCompId === compIdStr ||
        (selectedComp && uCompId === String(selectedComp.company_id).trim()) ||
        (compNameStr !== '' && (uCompName === compNameStr || compNameStr.includes(uCompName) || uCompName.includes(compNameStr)))
      );
    });

    setFilteredUnits(matching);

    if (isCustomUnit) {
      setUnitId('LAINNYA');
    } else if (matching.length > 0) {
      const currentExists = matching.some((u) => String(u.unit_id).trim() === String(unitId).trim());
      if (!currentExists) {
        setUnitId(String(matching[0].unit_id).trim());
      }
    } else {
      setIsCustomUnit(true);
      setUnitId('LAINNYA');
    }
  }, [companyId, companies, units, isCustomUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      setErrorMsg('Nama lengkap wajib diisi');
      return;
    }
    if (!nrp.trim()) {
      setErrorMsg('Nomor NRP pegawai wajib diisi');
      return;
    }
    if (nrp.trim().length > 16) {
      setErrorMsg('Nomor NRP maksimal 16 karakter');
      return;
    }
    if (!noHp.trim()) {
      setErrorMsg('Nomor WhatsApp wajib diisi');
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
    if (!companyId) {
      setErrorMsg('Pilih perusahaan tempat Anda bekerja');
      return;
    }
    const selectedComp = companies.find(
      (c) => String(c.company_id).trim() === String(companyId).trim()
    );
    const selectedUnitObj = filteredUnits.find(
      (u) => String(u.unit_id).trim() === String(unitId).trim()
    );

    const chosenUnitName = isCustomUnit
      ? customUnitText.trim()
      : (selectedUnitObj ? selectedUnitObj.unit_name : unitId);

    if (!chosenUnitName) {
      setErrorMsg('Pilih atau tuliskan unit/divisi tempat Anda bekerja');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await register(nama, noHp, pin, 'user', {
        nrp: nrp.trim(),
        email: email.trim() || undefined,
        tanggal_lahir: tanggalLahir || undefined,
        jenis_kelamin: jenisKelamin,
        status_jamaah: 'Pegawai/PTPP',
        status_pegawai: statusPegawai,
        company_id: selectedComp ? selectedComp.company_name : companyId,
        unit_id: chosenUnitName,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Pendaftaran gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#042519] via-[#073C2A] to-[#021810] flex flex-col justify-center items-center py-8 px-4 sm:px-6 relative overflow-x-hidden select-none">
      {/* Background Decorative Islamic Mandalas */}
      <IslamicMandala
        className="fixed -top-16 -right-16 sm:-top-20 sm:-right-20 pointer-events-none"
        size={360}
        opacity={0.22}
        color="#D4AF37"
      />
      <IslamicMandala
        className="fixed -bottom-24 -left-20 sm:-bottom-28 sm:-left-24 pointer-events-none"
        size={400}
        opacity={0.18}
        color="#D4AF37"
      />

      {/* Ambient Warm Golden Glow behind glass card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[480px] h-[480px] bg-gradient-to-b from-amber-400/12 via-yellow-200/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Main Content Container */}
      <div className="w-full max-w-md relative z-10 my-auto py-2">
        {/* Top Header Branding */}
        <div className="text-center mb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-heading tracking-tight drop-shadow-sm">
            Masjid Al Hijrah PTPP
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1 tracking-wide">
            Pendaftaran Akun Jamaah & Absensi Kajian
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="w-full rounded-[28px] border border-white/25 shadow-2xl backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/20 to-[#EAE4D8]/85 p-5 sm:p-7 relative transition-all duration-300">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white font-heading tracking-tight drop-shadow-xs">
              Buat Akun Baru
            </h2>
            <p className="text-xs text-white/85 leading-relaxed mt-1">
              Lengkapi data jamaah untuk mulai mengumpulkan poin kajian dan reimbursement.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-400/35 text-white flex items-start gap-2 text-xs backdrop-blur-md">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white border border-white/80 text-sm text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* NRP (Wajib, Maks 16 Karakter) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#1F2A24]">
                  NRP (Nomor Registrasi Pegawai) <span className="text-red-500">*</span>
                </label>
                <span className={`text-[10px] font-mono ${nrp.length > 16 ? 'text-red-600 font-bold' : 'text-[#4A5568]'}`}>
                  {nrp.length}/16
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                  <IdCard className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  maxLength={16}
                  value={nrp}
                  onChange={(e) => setNrp(e.target.value.replace(/\s+/g, ''))}
                  placeholder="Maks. 16 karakter (Contoh: 1234567890)"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white border border-white/80 text-sm text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition"
                  required
                />
              </div>
              <p className="text-[10px] text-[#EBEDEF] mt-1 font-medium">
                Nomor identitas karyawan untuk pencatatan absensi & klaim reimburse.
              </p>
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
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-white border border-white/80 text-sm text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition"
                  required
                />
              </div>
              <span className="text-[10px] text-[#EBEDEF] mt-1 block font-medium">
                Format otomatis disesuaikan (628...)
              </span>
            </div>

            {/* Email & Tanggal Lahir (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Email <span className="text-[#EBEDEF] font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-white/80 text-xs sm:text-sm text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Tanggal Lahir <span className="text-[#EBEDEF] font-normal">(Opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-white/80 text-xs sm:text-sm text-[#1F2A24] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition"
                  />
                </div>
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
                      ? 'bg-[#0F6B4C] text-white border-[#0F6B4C] shadow-xs'
                      : 'bg-white/80 border-white text-[#1F2A24] hover:bg-white'
                  }`}
                >
                  <span>Pria (Ikhwan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenisKelamin('wanita')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    jenisKelamin === 'wanita'
                      ? 'bg-[#0F6B4C] text-white border-[#0F6B4C] shadow-xs'
                      : 'bg-white/80 border-white text-[#1F2A24] hover:bg-white'
                  }`}
                >
                  <span>Wanita (Akhwat)</span>
                </button>
              </div>
            </div>

            {/* Status Pegawai Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                Status Pegawai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                  <Briefcase className="w-4 h-4" />
                </div>
                <select
                  value={statusPegawai}
                  onChange={(e) => setStatusPegawai(e.target.value as StatusPegawai)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-white/80 text-sm text-[#1F2A24] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] appearance-none cursor-pointer transition"
                  required
                >
                  <option value="Organik">Organik</option>
                  <option value="Non Organik">Non Organik</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#6B7568]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Company & Unit (Master Data) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Perusahaan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-white/80 text-xs sm:text-sm text-[#1F2A24] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] appearance-none cursor-pointer transition"
                    required
                  >
                    <option value="" disabled>
                      {loadingMaster ? 'Memuat perusahaan...' : 'Pilih Perusahaan...'}
                    </option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[#6B7568]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Unit / Divisi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={isCustomUnit ? 'LAINNYA' : unitId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'LAINNYA') {
                        setIsCustomUnit(true);
                        setUnitId('LAINNYA');
                      } else {
                        setIsCustomUnit(false);
                        setUnitId(val);
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-white/80 text-xs sm:text-sm text-[#1F2A24] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] appearance-none cursor-pointer transition"
                    required
                  >
                    <option value="" disabled>
                      {loadingMaster ? 'Memuat unit...' : (!companyId ? 'Pilih Perusahaan dahulu' : 'Pilih Unit / Divisi...')}
                    </option>
                    {filteredUnits.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                    ))}
                    <option value="LAINNYA">+ Unit Lainnya / Ketik Manual...</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[#6B7568]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {isCustomUnit && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={customUnitText}
                      onChange={(e) => setCustomUnitText(e.target.value)}
                      placeholder="Contoh: Proyek Tol, Divisi Legal..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-white/80 text-xs text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] shadow-2xs transition"
                      required
                      autoFocus
                    />
                    <p className="text-[10px] text-[#4A5568] mt-1 font-medium">
                      Ketikkan unit, divisi, proyek, atau penempatan Anda
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* PIN Setup (Grid 2 Kolom) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Buat PIN (4-6 Digit) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-white/80 text-sm tracking-widest text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Ulangi PIN <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-white/80 text-sm tracking-widest text-[#1F2A24] placeholder:text-[#9AA298] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Toggle Show PIN & Info */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-[#0F6B4C] hover:text-[#0c593f] font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}</span>
              </button>
              <span className="text-[10px] text-[#4A5568] font-medium">Gunakan 4-6 digit angka</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0A5338] via-[#07412C] to-[#042E1F] hover:from-[#0D6243] hover:to-[#063B28] text-white font-bold text-sm shadow-lg shadow-[#021810]/40 transition active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Mendaftarkan...</span>
              ) : (
                <>
                  <span>Daftar & Masuk Otomatis</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Login Link */}
        <div className="mt-5 text-center pb-2">
          <p className="text-xs sm:text-sm text-white/80">
            Sudah terdaftar sebelumnya?{' '}
            <button
              onClick={onGoToLogin}
              className="font-bold text-[#D4AF37] hover:text-[#E8C55C] hover:underline transition cursor-pointer"
            >
              Masuk ke Akun
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
