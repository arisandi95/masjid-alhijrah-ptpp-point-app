import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wallet,
  Sparkles,
  ChevronRight,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Building,
  CreditCard,
  Calendar,
  Image as ImageIcon,
  Check,
  IdCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, compressAndEncodeFile } from '../services/api';
import { ReimburstProgram, ReimburstClaim, MasterBank } from '../types';
import { CompleteNrpModal } from '../components/CompleteNrpModal';

interface ReimburstPageProps {
  onBack?: () => void;
}

export const ReimburstPage: React.FC<ReimburstPageProps> = ({ onBack }) => {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'ajukan' | 'riwayat'>('ajukan');
  const [step, setStep] = useState<'jenis' | 'program' | 'form'>('jenis');

  // Master & Programs Data
  const [jenisList, setJenisList] = useState<{ jenis_reimburst: string; program_count: number }[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ReimburstProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ReimburstProgram | null>(null);
  const [banks, setBanks] = useState<MasterBank[]>([]);
  const [myClaims, setMyClaims] = useState<ReimburstClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [besarKlaim, setBesarKlaim] = useState<number | ''>('');
  const [namaBank, setNamaBank] = useState<string>('');
  const [noRekening, setNoRekening] = useState<string>('');
  const [komentar, setKomentar] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<ReimburstClaim | null>(null);

  // NRP Prompt modal for users who haven't set their NRP
  const [showNrpModal, setShowNrpModal] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [jRes, bRes] = await Promise.all([
        api.getReimburstJenisList(),
        api.getBankList(),
      ]);

      if (jRes.success && jRes.data) {
        setJenisList(jRes.data);
      }
      if (bRes.success && bRes.data && bRes.data.length > 0) {
        setBanks(bRes.data);
        setNamaBank(bRes.data[0].nama_bank);
      }

      if (user) {
        const cRes = await api.getMyClaims(user.user_id);
        if (cRes.success && cRes.data) {
          setMyClaims(cRes.data);
        }
      }
    } catch (e) {
      console.warn('Error loading reimburst data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load programs when a jenis is selected
  const handleSelectJenis = async (jenis: string) => {
    if (!user?.nrp) {
      setShowNrpModal(true);
      return;
    }
    setSelectedJenis(jenis);
    setLoading(true);
    try {
      const res = await api.getReimburstPrograms(jenis);
      if (res.success && res.data) {
        setPrograms(res.data);
        setStep('program');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load form when a program is selected
  const handleSelectProgram = (prog: ReimburstProgram) => {
    if (!user?.nrp) {
      setShowNrpModal(true);
      return;
    }
    setSelectedProgram(prog);
    const userPoin = user?.total_poin || 0;
    const hak = Math.floor(userPoin * (prog.maks_persen_reimburst / 100));
    setBesarKlaim(hak > 0 ? hak : '');
    setFormError(null);
    setStep('form');
  };

  // File Picker & Canvas Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 10MB raw file
    if (file.size > 10 * 1024 * 1024) {
      setFormError('Ukuran file terlalu besar (maksimal 10 MB).');
      return;
    }

    setUploadingFile(true);
    setFormError(null);
    try {
      const result = await compressAndEncodeFile(file, 1280, 0.8);
      setFileBase64(result.base64);
      setFileName(result.fileName);
      setCompressedSizeKB(result.sizeKB);
      setFilePreview(`data:image/jpeg;base64,${result.base64}`);
    } catch (err: any) {
      setFormError('Gagal memproses file: ' + (err.message || 'Error'));
    } finally {
      setUploadingFile(false);
    }
  };

  // Submit Claim
  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!user.nrp) {
      setShowNrpModal(true);
      return;
    }
    if (!selectedProgram) {
      setFormError('Program reimburse belum dipilih.');
      return;
    }

    const claimAmount = Number(besarKlaim);
    const userPoin = user.total_poin || 0;
    const jumlahHak = Math.floor(userPoin * (selectedProgram.maks_persen_reimburst / 100));

    if (claimAmount <= 0) {
      setFormError('Nominal klaim harus lebih besar dari Rp 0.');
      return;
    }
    if (claimAmount > jumlahHak) {
      setFormError(`Nominal klaim melebihi batas hak klaim Anda (Rp ${jumlahHak.toLocaleString('id-ID')}).`);
      return;
    }
    if (claimAmount > userPoin) {
      setFormError('Saldo poin Anda tidak mencukupi.');
      return;
    }
    if (!namaBank.trim()) {
      setFormError('Pilih nama bank penerima transfer.');
      return;
    }
    if (!noRekening.trim()) {
      setFormError('Nomor rekening penerima wajib diisi.');
      return;
    }
    if (!fileBase64) {
      setFormError('Lampiran kuitansi/bukti pendukung wajib diunggah.');
      return;
    }

    setSubmittingClaim(true);
    setFormError(null);

    try {
      const res = await api.submitClaim({
        userId: user.user_id,
        programId: selectedProgram.program_id,
        besarKlaim: claimAmount,
        namaBank: namaBank.trim(),
        noRekening: noRekening.trim(),
        komentar: komentar.trim(),
        fileBase64: fileBase64,
        fileName: fileName || `klaim_${Date.now()}.jpg`,
      });

      if (res.success && res.data) {
        setSuccessModal(res.data);
        await refreshProfile();
        // Reset form
        setBesarKlaim('');
        setNoRekening('');
        setKomentar('');
        setFileBase64('');
        setFilePreview(null);
        setCompressedSizeKB(null);
        // Refresh claims
        const cRes = await api.getMyClaims(user.user_id);
        if (cRes.success && cRes.data) {
          setMyClaims(cRes.data);
        }
      } else {
        setFormError(res.error || 'Pengajuan klaim gagal.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Terjadi gangguan jaringan.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const userPoin = user?.total_poin || 0;
  const currentHak = selectedProgram
    ? Math.floor(userPoin * (selectedProgram.maks_persen_reimburst / 100))
    : 0;

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4 select-none">
      {/* Complete NRP Modal if needed */}
      <CompleteNrpModal
        isOpen={showNrpModal}
        onClose={() => setShowNrpModal(false)}
        onSuccess={() => {
          setShowNrpModal(false);
          refreshProfile();
        }}
        title="Lengkapi NRP untuk Reimburse"
        description="Pengajuan klaim reimburse mewajibkan nomor NRP (karyawan/jamaah) untuk pencatatan di Google Sheets dan audit transfer."
      />

      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#1F2A24] flex items-center justify-center hover:bg-gray-50 active:scale-95 transition cursor-pointer"
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
                1 Poin = Rp 1
              </span>
            </div>
            <h1 className="text-base font-bold text-[#1F2A24] font-heading leading-tight">
              Reimburse Poin
            </h1>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </header>

      {/* Saldo Poin & Hak Klaim Card */}
      <div className="bg-gradient-to-br from-[#0F6B4C] via-[#145C42] to-[#1F2A24] rounded-3xl p-4 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/80 font-medium">Saldo Poin Tersedia</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-heading tracking-tight">
                {userPoin.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-[#FAF3D1] font-bold">Poin</span>
            </div>
            <p className="text-[11px] text-[#FAF3D1]/90 mt-0.5 font-semibold">
              ≈ Rp {userPoin.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-white/70 block">NRP Jamaah</span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {user?.nrp ? (
                <span className="text-xs font-mono font-bold bg-white/15 px-2 py-0.5 rounded-lg border border-white/20">
                  {user.nrp}
                </span>
              ) : (
                <button
                  onClick={() => setShowNrpModal(true)}
                  className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-300/40 hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                >
                  <IdCard className="w-3 h-3" />
                  <span>Isi NRP</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative pattern */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <Wallet className="w-32 h-32" />
        </div>
      </div>

      {/* Navigation Tabs (Ajukan vs Riwayat) */}
      <div className="flex rounded-2xl bg-gray-200/70 p-1 border border-gray-200">
        <button
          onClick={() => {
            setActiveTab('ajukan');
            setStep('jenis');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'ajukan'
              ? 'bg-white text-[#0F6B4C] shadow-xs'
              : 'text-[#6B7568] hover:text-[#1F2A24]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ajukan Klaim</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'riwayat'
              ? 'bg-white text-[#0F6B4C] shadow-xs'
              : 'text-[#6B7568] hover:text-[#1F2A24]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Riwayat Klaim</span>
          {myClaims.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0F6B4C] text-white text-[9px] flex items-center justify-center font-bold">
              {myClaims.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: AJUKAN KLAIM */}
      {activeTab === 'ajukan' && (
        <div className="space-y-4">
          {/* STEP 1: PILIH JENIS REIMBURSE */}
          {step === 'jenis' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                    Pilih Kategori / Jenis Reimburse
                  </h2>
                  <p className="text-[11px] text-[#6B7568]">
                    Pilih salah satu jenis program bantuan/reimburse yang tersedia
                  </p>
                </div>
              </div>

              {jenisList.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-dashed border-gray-200">
                  <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-xs font-bold text-[#1F2A24]">Belum Ada Program Aktif</p>
                  <p className="text-[11px] text-[#6B7568] mt-0.5">
                    Admin belum membuka periode program reimburse yang aktif saat ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {jenisList.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectJenis(item.jenis_reimburst)}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs hover:border-[#0F6B4C]/40 hover:shadow-xs transition text-left flex items-center justify-between group cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8F3EE] text-[#0F6B4C] flex items-center justify-center font-bold font-heading shrink-0 group-hover:bg-[#0F6B4C] group-hover:text-white transition">
                          {item.jenis_reimburst.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[#1F2A24] font-heading group-hover:text-[#0F6B4C] transition">
                            {item.jenis_reimburst}
                          </h3>
                          <p className="text-[11px] text-[#6B7568] mt-0.5">
                            {item.program_count} Program Periode Aktif
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6B7568] group-hover:text-[#0F6B4C] group-hover:translate-x-0.5 transition" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PILIH PROGRAM DALAM JENIS TERPILIH */}
          {step === 'program' && (
            <div className="space-y-3">
              <button
                onClick={() => setStep('jenis')}
                className="text-xs text-[#0F6B4C] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Kategori ({selectedJenis})</span>
              </button>

              <div>
                <h2 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
                  Pilih Periode Program
                </h2>
                <p className="text-[11px] text-[#6B7568]">
                  Pilih program spesifik untuk kategori <b>{selectedJenis}</b>
                </p>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center border border-dashed border-gray-200">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#1F2A24]">Tidak Ada Program Aktif</p>
                  <p className="text-[11px] text-[#6B7568] mt-0.5">
                    Tidak ditemukan program aktif untuk kategori ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {programs.map((prog) => {
                    const hak = Math.floor(userPoin * (prog.maks_persen_reimburst / 100));
                    return (
                      <div
                        key={prog.program_id}
                        onClick={() => handleSelectProgram(prog)}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs hover:border-[#0F6B4C]/40 hover:shadow-xs transition cursor-pointer group active:scale-99"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase tracking-wider mb-1">
                              Maks {prog.maks_persen_reimburst}% Saldo
                            </span>
                            <h3 className="text-xs font-bold text-[#1F2A24] font-heading leading-snug group-hover:text-[#0F6B4C] transition">
                              {prog.nama_program}
                            </h3>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#6B7568] shrink-0 mt-1 group-hover:text-[#0F6B4C] group-hover:translate-x-0.5 transition" />
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-[#6B7568] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#0F6B4C]" />
                            s.d {prog.tanggal_selesai}
                          </span>
                          <span className="font-bold text-[#0F6B4C]">
                            Hak: Rp {hak.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: FORMULIR PENGAJUAN KLAIM */}
          {step === 'form' && selectedProgram && (
            <div className="space-y-3.5">
              <button
                onClick={() => setStep('program')}
                className="text-xs text-[#0F6B4C] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pilih Program Lain</span>
              </button>

              {/* Ringkasan Program & Batas Hak */}
              <div className="bg-[#E8F3EE]/80 rounded-3xl p-4 border border-[#0F6B4C]/15">
                <span className="text-[10px] font-bold text-[#0F6B4C] uppercase tracking-wider block">
                  {selectedProgram.jenis_reimburst}
                </span>
                <h3 className="text-xs font-bold text-[#1F2A24] font-heading mt-0.5">
                  {selectedProgram.nama_program}
                </h3>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#0F6B4C]/10">
                  <div>
                    <span className="text-[10px] text-[#6B7568] block">Batas Maks. Program</span>
                    <span className="font-bold text-[#1F2A24]">{selectedProgram.maks_persen_reimburst}% Saldo</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B7568] block">Maksimal Hak Klaim</span>
                    <span className="font-bold text-[#0F6B4C]">Rp {currentHak.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleSubmitClaim} className="space-y-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-2xs">
                {/* Nominal Klaim */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#1F2A24]">
                      Besar Klaim Diajukan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setBesarKlaim(currentHak)}
                      className="text-[10px] text-[#0F6B4C] font-bold hover:underline cursor-pointer"
                    >
                      Klaim Maksimal
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568] font-bold text-xs">
                      Rp
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={currentHak}
                      value={besarKlaim}
                      onChange={(e) => setBesarKlaim(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`Maks. ${currentHak.toLocaleString('id-ID')}`}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-[#6B7568] mt-1">
                    Nominal rupiah yang diklaim akan langsung memotong {besarKlaim ? Number(besarKlaim).toLocaleString('id-ID') : 0} poin Anda.
                  </p>
                </div>

                {/* Pilih Bank */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Nama Bank Tujuan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                      <Building className="w-4 h-4" />
                    </div>
                    <select
                      value={namaBank}
                      onChange={(e) => setNamaBank(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                      required
                    >
                      {banks.map((b) => (
                        <option key={b.bank_id} value={b.nama_bank}>
                          {b.nama_bank}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nomor Rekening */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Nomor Rekening Penerima <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={noRekening}
                      onChange={(e) => setNoRekening(e.target.value.replace(/[^\d-]/g, ''))}
                      placeholder="Contoh: 7123456789"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                      required
                    />
                  </div>
                </div>

                {/* Upload Lampiran (Foto Bukti Kuitansi) */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Lampiran Kuitansi / Bukti Nota <span className="text-red-500">*</span>
                  </label>

                  <div className="mt-1">
                    {filePreview ? (
                      <div className="relative rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center gap-3">
                        <img
                          src={filePreview}
                          alt="Preview Bukti"
                          className="w-14 h-14 object-cover rounded-xl border border-emerald-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1F2A24] truncate">{fileName}</p>
                          <p className="text-[10px] text-[#0F6B4C] font-semibold mt-0.5">
                            Terkonpresi otomatis ({compressedSizeKB} KB) • Siap disimpan ke Drive
                          </p>
                        </div>
                        <label className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-[#1F2A24] hover:bg-gray-50 transition cursor-pointer shrink-0">
                          <span>Ganti</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-300 hover:border-[#0F6B4C] rounded-2xl bg-[#FAFAF7] hover:bg-emerald-50/20 transition cursor-pointer group">
                        <Upload className="w-7 h-7 text-gray-400 group-hover:text-[#0F6B4C] transition mb-1.5 stroke-[1.8]" />
                        <span className="text-xs font-bold text-[#1F2A24] group-hover:text-[#0F6B4C] transition">
                          Pilih Foto Kamera atau File Kuitansi
                        </span>
                        <span className="text-[10px] text-[#6B7568] mt-0.5">
                          JPEG, PNG, atau PDF (Kompresi otomatis ke Google Drive)
                        </span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                  {uploadingFile && (
                    <p className="text-[11px] text-[#0F6B4C] font-medium mt-1 animate-pulse">
                      Mengompresi gambar kuitansi...
                    </p>
                  )}
                </div>

                {/* Komentar / Catatan Tambahan */}
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Catatan Tambahan <span className="text-gray-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={komentar}
                    onChange={(e) => setKomentar(e.target.value)}
                    placeholder="Contoh: Kuitansi pembayaran SPP semester genap anak"
                    className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                  />
                </div>

                {/* Submit CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingClaim || uploadingFile || currentHak <= 0}
                    className="w-full py-3 px-4 rounded-2xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white font-bold text-xs transition shadow-md shadow-[#0F6B4C]/25 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingClaim ? (
                      <span>Mengirim Pengajuan & Upload Drive...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kirim Pengajuan Klaim</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#6B7568] mt-2">
                    Klaim akan diverifikasi oleh Admin pengurus sebelum proses transfer dana.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RIWAYAT KLAIM SAYA */}
      {activeTab === 'riwayat' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#1F2A24] uppercase tracking-wider">
              Daftar Pengajuan Klaim Anda
            </h2>
            <span className="text-[10px] text-[#6B7568]">{myClaims.length} Transaksi</span>
          </div>

          {myClaims.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-gray-200">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-xs font-bold text-[#1F2A24]">Belum Ada Pengajuan Klaim</p>
              <p className="text-[11px] text-[#6B7568] mt-0.5">
                Klaim saldo poin Anda untuk program bantuan pendidikan, kesehatan, atau kebutuhan lainnya.
              </p>
              <button
                onClick={() => {
                  setActiveTab('ajukan');
                  setStep('jenis');
                }}
                className="mt-3 px-3 py-1.5 rounded-xl bg-[#0F6B4C] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Ajukan Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myClaims.map((claim) => {
                let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                let statusLabel = 'Menunggu Verifikasi';
                let StatusIcon = Clock;

                if (claim.status === 'verified') {
                  badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
                  statusLabel = 'Disetujui (Siap Transfer)';
                  StatusIcon = CheckCircle2;
                } else if (claim.status === 'transferred') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  statusLabel = 'Dana Selesai Ditransfer';
                  StatusIcon = Check;
                } else if (claim.status === 'rejected') {
                  badgeClass = 'bg-red-100 text-red-800 border-red-300';
                  statusLabel = 'Pengajuan Ditolak (Poin Kembali)';
                  StatusIcon = XCircle;
                }

                return (
                  <div
                    key={claim.claim_id}
                    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                          {claim.jenis_reimburst || 'Reimburse'}
                        </span>
                        <h3 className="text-xs font-bold text-[#1F2A24] font-heading leading-tight mt-0.5">
                          {claim.nama_program || 'Program Klaim'}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 ${badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusLabel}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#FAFAF7] p-3 rounded-2xl border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Besar Klaim (Poin)</span>
                        <span className="font-bold text-[#0F6B4C] text-sm">
                          Rp {claim.besar_klaim.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Tujuan Transfer</span>
                        <span className="font-semibold text-[#1F2A24] truncate block">
                          {claim.nama_bank} • {claim.no_rekening}
                        </span>
                      </div>
                    </div>

                    {claim.komentar && (
                      <p className="text-[11px] text-[#6B7568] bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="font-semibold text-[#1F2A24]">Keterangan:</span> {claim.komentar}
                      </p>
                    )}

                    {/* Catatan Admin jika ditolak */}
                    {claim.status === 'rejected' && claim.catatan_admin && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] space-y-0.5">
                        <span className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Alasan Penolakan:
                        </span>
                        <p>{claim.catatan_admin}</p>
                      </div>
                    )}

                    {/* Aksi & Link Google Drive */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                      <span className="text-[#6B7568] text-[10px]">
                        Diajukan: {claim.tanggal_klaim}
                      </span>

                      <div className="flex items-center gap-2">
                        {claim.lampiran_url && (
                          <a
                            href={claim.lampiran_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0F6B4C] hover:underline font-semibold flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Kuitansi</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {claim.status === 'transferred' && claim.bukti_transfer_url && (
                          <a
                            href={claim.bukti_transfer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-[#0F6B4C] border border-emerald-200 font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Bukti Transfer</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0F6B4C] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-[#1F2A24] font-heading">
              Pengajuan Klaim Berhasil!
            </h3>
            <p className="text-xs text-[#6B7568] mt-1 leading-relaxed">
              Klaim sebesar <b>Rp {successModal.besar_klaim.toLocaleString('id-ID')}</b> telah diterima dan lampiran kuitansi berhasil tersimpan ke Google Drive.
            </p>

            <div className="my-3 p-3 rounded-2xl bg-[#E8F3EE] text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#6B7568]">Program:</span>
                <span className="font-bold text-[#1F2A24]">{successModal.nama_program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7568]">Bank Tujuan:</span>
                <span className="font-bold text-[#1F2A24]">{successModal.nama_bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7568]">No. Rekening:</span>
                <span className="font-mono font-bold text-[#1F2A24]">{successModal.no_rekening}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessModal(null);
                setActiveTab('riwayat');
              }}
              className="w-full py-2.5 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Lihat Riwayat Klaim
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
