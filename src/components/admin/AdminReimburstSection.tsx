import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Upload,
  ExternalLink,
  FileText,
  AlertCircle,
  Calendar,
  Building,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Check,
  Clock,
  IdCard,
  X,
  ChevronDown,
} from 'lucide-react';
import { api, compressAndEncodeFile } from '../../services/api';
import { ReimburstProgram, ReimburstClaim, ReimburstClaimStatus } from '../../types';

interface AdminReimburstSectionProps {
  initialSubTab?: 'programs' | 'claims';
}

export const AdminReimburstSection: React.FC<AdminReimburstSectionProps> = ({
  initialSubTab = 'programs',
}) => {
  const [subTab, setSubTab] = useState<'programs' | 'claims'>(initialSubTab);
  const [loading, setLoading] = useState(true);

  // Programs State
  const [programs, setPrograms] = useState<ReimburstProgram[]>([]);
  const [progFilterJenis, setProgFilterJenis] = useState<string>('all');
  const [togglingProgId, setTogglingProgId] = useState<string | null>(null);

  // Add Program Modal State (with Combobox for Jenis)
  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [jenisInput, setJenisInput] = useState('');
  const [namaProgramInput, setNamaProgramInput] = useState('');
  const [tanggalMulaiInput, setTanggalMulaiInput] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesaiInput, setTanggalSelesaiInput] = useState('2026-12-31');
  const [maksPersenInput, setMaksPersenInput] = useState<number>(50);
  const [submittingProg, setSubmittingProg] = useState(false);
  const [progError, setProgError] = useState<string | null>(null);
  const [showJenisDropdown, setShowJenisDropdown] = useState(false);

  // Claims State
  const [claims, setClaims] = useState<ReimburstClaim[]>([]);
  const [claimFilterStatus, setClaimFilterStatus] = useState<string>('all');
  const [claimFilterJenis, setClaimFilterJenis] = useState<string>('all');
  const [claimSearch, setClaimSearch] = useState<string>('');

  // Reject Modal State
  const [rejectingClaim, setRejectingClaim] = useState<ReimburstClaim | null>(null);
  const [catatanReject, setCatatanReject] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Transfer Proof Modal State
  const [transferringClaim, setTransferringClaim] = useState<ReimburstClaim | null>(null);
  const [proofFileBase64, setProofFileBase64] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofSizeKB, setProofSizeKB] = useState<number | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);

  // Action status loading
  const [actionClaimId, setActionClaimId] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [progRes, claimRes] = await Promise.all([
        api.getAllReimburstPrograms(),
        api.getAllClaims(),
      ]);
      if (progRes.success && progRes.data) {
        setPrograms(progRes.data);
      }
      if (claimRes.success && claimRes.data) {
        setClaims(claimRes.data);
      }
    } catch (e) {
      console.warn('Error loading admin reimburst data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Unique Jenis from programs for combobox & filter
  const existingJenisList: string[] = Array.from(
    new Set(programs.map((p) => p.jenis_reimburst.trim()))
  ).filter((s): s is string => Boolean(s));

  // Toggle Program Active/Inactive
  const handleToggleProgram = async (program: ReimburstProgram) => {
    const newStatus = program.status === 'active' ? 'inactive' : 'active';
    setTogglingProgId(program.program_id);
    try {
      const res = await api.toggleReimburstProgram(program.program_id, newStatus);
      if (res.success) {
        setPrograms((prev) =>
          prev.map((p) => (p.program_id === program.program_id ? { ...p, status: newStatus } : p))
        );
      }
    } finally {
      setTogglingProgId(null);
    }
  };

  // Add Program
  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisInput.trim()) {
      setProgError('Jenis/kategori reimburse wajib diisi.');
      return;
    }
    if (!namaProgramInput.trim()) {
      setProgError('Nama program wajib diisi.');
      return;
    }

    setSubmittingProg(true);
    setProgError(null);
    try {
      const res = await api.addReimburstProgram({
        jenis_reimburst: jenisInput.trim(),
        nama_program: namaProgramInput.trim(),
        tanggal_mulai: tanggalMulaiInput,
        tanggal_selesai: tanggalSelesaiInput,
        maks_persen_reimburst: Number(maksPersenInput) || 50,
      });

      if (res.success && res.data) {
        setPrograms((prev) => [res.data!, ...prev]);
        setShowAddProgModal(false);
        // Reset form
        setJenisInput('');
        setNamaProgramInput('');
        setMaksPersenInput(50);
      } else {
        setProgError(res.error || 'Gagal menambahkan program.');
      }
    } catch (err: any) {
      setProgError(err.message || 'Terjadi gangguan koneksi.');
    } finally {
      setSubmittingProg(false);
    }
  };

  // Verify Claim (Approve)
  const handleVerifyClaim = async (claimId: string) => {
    setActionClaimId(claimId);
    try {
      const res = await api.verifyClaim(claimId);
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) => (c.claim_id === claimId ? { ...c, status: 'verified' } : c))
        );
      } else {
        alert(res.error || 'Gagal menyetujui klaim.');
      }
    } finally {
      setActionClaimId(null);
    }
  };

  // Reject Claim (with reason & refund points)
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingClaim) return;

    setSubmittingReject(true);
    try {
      const res = await api.rejectClaim(
        rejectingClaim.claim_id,
        catatanReject.trim() || 'Dokumen belum memenuhi persyaratan'
      );
      if (res.success) {
        setClaims((prev) =>
          prev.map((c) =>
            c.claim_id === rejectingClaim.claim_id
              ? {
                  ...c,
                  status: 'rejected',
                  catatan_admin: catatanReject.trim() || 'Dokumen belum memenuhi persyaratan',
                }
              : c
          )
        );
        setRejectingClaim(null);
        setCatatanReject('');
      } else {
        alert(res.error || 'Gagal menolak klaim.');
      }
    } finally {
      setSubmittingReject(false);
    }
  };

  // Handle Transfer Proof Upload Change
  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    setProofError(null);
    try {
      const res = await compressAndEncodeFile(file, 1280, 0.85);
      setProofFileBase64(res.base64);
      setProofFileName(res.fileName);
      setProofSizeKB(res.sizeKB);
      setProofPreview(`data:image/jpeg;base64,${res.base64}`);
    } catch (err: any) {
      setProofError('Gagal memproses file bukti transfer: ' + err.message);
    } finally {
      setUploadingProof(false);
    }
  };

  // Submit Transfer Proof
  const handleSubmitTransferProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringClaim) return;
    if (!proofFileBase64) {
      setProofError('Foto/file bukti transfer bank wajib dipilih.');
      return;
    }

    setSubmittingProof(true);
    setProofError(null);
    try {
      const res = await api.uploadTransferProof(
        transferringClaim.claim_id,
        proofFileBase64,
        proofFileName || `transfer_${transferringClaim.claim_id}.jpg`
      );

      if (res.success && res.data) {
        setClaims((prev) =>
          prev.map((c) =>
            c.claim_id === transferringClaim.claim_id
              ? {
                  ...c,
                  status: 'transferred',
                  bukti_transfer_url: res.data!.bukti_transfer_url,
                }
              : c
          )
        );
        setTransferringClaim(null);
        setProofFileBase64('');
        setProofPreview(null);
        setProofSizeKB(null);
      } else {
        setProofError(res.error || 'Gagal mengunggah bukti transfer.');
      }
    } catch (err: any) {
      setProofError(err.message || 'Terjadi gangguan jaringan.');
    } finally {
      setSubmittingProof(false);
    }
  };

  // Filtered Programs
  const filteredPrograms = programs.filter((p) => {
    if (progFilterJenis !== 'all' && p.jenis_reimburst.trim().toLowerCase() !== progFilterJenis.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filtered Claims
  const filteredClaims = claims.filter((c) => {
    if (claimFilterStatus !== 'all' && c.status !== claimFilterStatus) return false;
    if (claimFilterJenis !== 'all' && (c.jenis_reimburst || '').trim().toLowerCase() !== claimFilterJenis.toLowerCase()) return false;
    if (claimSearch.trim()) {
      const q = claimSearch.trim().toLowerCase();
      const matchName = (c.nama_user || '').toLowerCase().includes(q);
      const matchNrp = (c.nrp || '').toLowerCase().includes(q);
      const matchPhone = (c.no_hp || '').toLowerCase().includes(q);
      const matchProg = (c.nama_program || '').toLowerCase().includes(q);
      const matchBank = (c.nama_bank || '').toLowerCase().includes(q);
      if (!matchName && !matchNrp && !matchPhone && !matchProg && !matchBank) return false;
    }
    return true;
  });

  const pendingClaimsCount = claims.filter((c) => c.status === 'submitted').length;
  const verifiedClaimsCount = claims.filter((c) => c.status === 'verified').length;

  return (
    <div className="space-y-4">
      {/* Sub Navigation Bar (Kelola Program vs Verifikasi Klaim) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex rounded-2xl bg-gray-200/70 p-1 border border-gray-200">
          <button
            onClick={() => setSubTab('programs')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'programs'
                ? 'bg-white text-[#0F6B4C] shadow-xs'
                : 'text-[#6B7568] hover:text-[#1F2A24]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Program Reimburse</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#0F6B4C]">
              {programs.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('claims')}
            className={`py-2 px-3.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'claims'
                ? 'bg-white text-[#0F6B4C] shadow-xs'
                : 'text-[#6B7568] hover:text-[#1F2A24]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Verifikasi & Transfer</span>
            {pendingClaimsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                {pendingClaimsCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] transition cursor-pointer"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </div>

      {/* =================================================================== */}
      {/* SUB-TAB 1: KELOLA PROGRAM REIMBURSE */}
      {/* =================================================================== */}
      {subTab === 'programs' && (
        <div className="space-y-4">
          {/* Header & Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1F2A24] font-heading flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#0F6B4C]" />
                Kelola Program Reimburse ({programs.length})
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#6B7568] mt-0.5">
                Admin bebas menambah jenis program baru (Pendidikan, Kesehatan, dll.) tanpa sheet master terpisah.
              </p>
            </div>

            <button
              onClick={() => {
                setProgError(null);
                setShowAddProgModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program Baru</span>
            </button>
          </div>

          {/* Filter by Jenis */}
          {existingJenisList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] text-[#6B7568] font-semibold shrink-0 mr-1">Filter Kategori:</span>
              <button
                onClick={() => setProgFilterJenis('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                  progFilterJenis === 'all'
                    ? 'bg-[#0F6B4C] text-white'
                    : 'bg-white text-[#6B7568] border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Semua ({programs.length})
              </button>
              {existingJenisList.map((j) => {
                const count = programs.filter((p) => p.jenis_reimburst.trim().toLowerCase() === j.toLowerCase()).length;
                return (
                  <button
                    key={j}
                    onClick={() => setProgFilterJenis(j)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-xs shrink-0 cursor-pointer ${
                      progFilterJenis.toLowerCase() === j.toLowerCase()
                        ? 'bg-[#0F6B4C] text-white'
                        : 'bg-white text-[#6B7568] border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {j} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Programs List */}
          {filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1F2A24]">Belum Ada Program Reimburse</p>
              <p className="text-[11px] text-[#6B7568] mt-0.5">
                Klik tombol "Tambah Program Baru" di atas untuk membuat program baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPrograms.map((prog) => {
                const isActive = prog.status === 'active';
                const isToggling = togglingProgId === prog.program_id;

                return (
                  <div
                    key={prog.program_id}
                    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#E8F3EE] text-[#0F6B4C] text-[10px] font-bold uppercase tracking-wider mb-1">
                          {prog.jenis_reimburst}
                        </span>
                        <h4 className="text-xs font-bold text-[#1F2A24] font-heading leading-tight">
                          {prog.nama_program}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleToggleProgram(prog)}
                        disabled={isToggling}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer border ${
                          isActive
                            ? 'bg-emerald-50 text-[#0F6B4C] border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        {isActive ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5 text-[#0F6B4C]" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-[#FAFAF7] p-2.5 rounded-2xl border border-gray-100 text-[11px] grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Batas Maks. Klaim</span>
                        <span className="font-bold text-[#0F6B4C]">{prog.maks_persen_reimburst}% Saldo</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Masa Berlaku</span>
                        <span className="font-medium text-[#1F2A24]">{prog.tanggal_selesai}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: VERIFIKASI KLAIM JAMAAH & BUKTI TRANSFER */}
      {/* =================================================================== */}
      {subTab === 'claims' && (
        <div className="space-y-3.5">
          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs text-center">
              <span className="text-[10px] text-[#6B7568] font-bold uppercase tracking-wider block">Menunggu</span>
              <span className="text-xl font-black font-heading text-amber-600 mt-0.5 block">
                {pendingClaimsCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs text-center">
              <span className="text-[10px] text-[#6B7568] font-bold uppercase tracking-wider block">Siap Transfer</span>
              <span className="text-xl font-black font-heading text-blue-600 mt-0.5 block">
                {verifiedClaimsCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs text-center">
              <span className="text-[10px] text-[#6B7568] font-bold uppercase tracking-wider block">Total Klaim</span>
              <span className="text-xl font-black font-heading text-[#0F6B4C] mt-0.5 block">
                {claims.length}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs space-y-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7568]">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={claimSearch}
                onChange={(e) => setClaimSearch(e.target.value)}
                placeholder="Cari nama jamaah, NRP, bank, atau program..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition bg-[#FAFAF7]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              <span className="text-[#6B7568] font-semibold shrink-0 mr-1">Status:</span>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'submitted', label: 'Menunggu' },
                { id: 'verified', label: 'Disetujui' },
                { id: 'transferred', label: 'Ditransfer' },
                { id: 'rejected', label: 'Ditolak' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setClaimFilterStatus(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                    claimFilterStatus === s.id
                      ? 'bg-[#0F6B4C] text-white'
                      : 'bg-gray-100 text-[#6B7568] hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Claims List */}
          {filteredClaims.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#1F2A24]">Tidak Ada Pengajuan Klaim</p>
              <p className="text-[11px] text-[#6B7568] mt-0.5">
                Tidak ada data klaim yang sesuai dengan filter pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClaims.map((claim) => {
                let badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                let statusLabel = 'Menunggu Verifikasi';
                let StatusIcon = Clock;

                if (claim.status === 'verified') {
                  badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
                  statusLabel = 'Disetujui (Siap Transfer)';
                  StatusIcon = CheckCircle2;
                } else if (claim.status === 'transferred') {
                  badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  statusLabel = 'Selesai Ditransfer';
                  StatusIcon = Check;
                } else if (claim.status === 'rejected') {
                  badgeClass = 'bg-red-100 text-red-800 border-red-300';
                  statusLabel = 'Ditolak';
                  StatusIcon = XCircle;
                }

                const isActionLoading = actionClaimId === claim.claim_id;

                return (
                  <div
                    key={claim.claim_id}
                    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-3"
                  >
                    {/* Header Card: User & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-[#1F2A24] font-heading">
                            {claim.nama_user || 'Jamaah Al Hijrah'}
                          </h4>
                          {claim.nrp && (
                            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-gray-100 text-[#4A5568] border border-gray-200">
                              NRP: {claim.nrp}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6B7568] mt-0.5">
                          {claim.nama_program} • <span className="font-semibold text-[#0F6B4C]">{claim.jenis_reimburst}</span>
                        </p>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 ${badgeClass}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusLabel}</span>
                      </span>
                    </div>

                    {/* Nominal & Rekening Info */}
                    <div className="grid grid-cols-2 gap-2 bg-[#FAFAF7] p-3 rounded-2xl border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Nominal Klaim (Poin)</span>
                        <span className="font-bold text-[#0F6B4C] text-sm">
                          Rp {claim.besar_klaim.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B7568] block">Rekening Transfer</span>
                        <span className="font-bold text-[#1F2A24] block truncate">
                          {claim.nama_bank}
                        </span>
                        <span className="font-mono text-[11px] text-[#4A5568] block select-all">
                          {claim.no_rekening}
                        </span>
                      </div>
                    </div>

                    {/* Komentar & Catatan */}
                    {claim.komentar && (
                      <p className="text-[11px] text-[#6B7568] bg-gray-50 p-2 rounded-xl">
                        <span className="font-semibold text-[#1F2A24]">Keterangan Jamaah:</span> {claim.komentar}
                      </p>
                    )}
                    {claim.status === 'rejected' && claim.catatan_admin && (
                      <div className="p-2 rounded-xl bg-red-50 text-red-800 text-[11px]">
                        <span className="font-bold">Alasan Penolakan:</span> {claim.catatan_admin}
                      </div>
                    )}

                    {/* Lampiran Google Drive */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {claim.lampiran_url ? (
                          <a
                            href={claim.lampiran_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0F6B4C] hover:underline font-bold text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat Kuitansi</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[11px]">Tidak ada lampiran</span>
                        )}

                        {claim.bukti_transfer_url && (
                          <a
                            href={claim.bukti_transfer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:underline font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Bukti Transfer</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      <span className="text-[10px] text-[#6B7568]">
                        Tgl: {claim.tanggal_klaim}
                      </span>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                      {claim.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => {
                              setCatatanReject('');
                              setRejectingClaim(claim);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition cursor-pointer"
                          >
                            Tolak (Refund)
                          </button>
                          <button
                            onClick={() => handleVerifyClaim(claim.claim_id)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui Klaim</span>
                          </button>
                        </>
                      )}

                      {claim.status === 'verified' && (
                        <button
                          onClick={() => {
                            setProofError(null);
                            setProofFileBase64('');
                            setProofPreview(null);
                            setTransferringClaim(claim);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Bukti Transfer</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: TAMBAH PROGRAM REIMBURST BARU (COMBOBOX JENIS) */}
      {/* =================================================================== */}
      {showAddProgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddProgModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0F6B4C]/10 text-[#0F6B4C] flex items-center justify-center mb-3">
              <Wallet className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-[#1F2A24] font-heading">
              Tambah Program Reimburse Baru
            </h3>
            <p className="text-xs text-[#6B7568] mt-0.5 mb-3">
              Admin dapat memilih jenis yang sudah ada atau mengetikkan kategori jenis baru secara bebas.
            </p>

            {progError && (
              <div className="p-3 mb-3 rounded-2xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{progError}</span>
              </div>
            )}

            <form onSubmit={handleAddProgram} className="space-y-3">
              {/* Combobox Jenis Reimburse */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Kategori / Jenis Reimburse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={jenisInput}
                    onChange={(e) => setJenisInput(e.target.value)}
                    onFocus={() => setShowJenisDropdown(true)}
                    placeholder="Pilih atau ketik baru (misal: Pendidikan Anak)"
                    className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition bg-[#FAFAF7]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowJenisDropdown(!showJenisDropdown)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Combobox Dropdown Suggestions */}
                {showJenisDropdown && existingJenisList.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg max-h-40 overflow-y-auto py-1">
                    <p className="px-3 py-1 text-[10px] font-bold text-[#6B7568] uppercase tracking-wider">
                      Pilih dari jenis yang sudah ada:
                    </p>
                    {existingJenisList.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setJenisInput(item);
                          setShowJenisDropdown(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#E8F3EE] hover:text-[#0F6B4C] font-medium transition cursor-pointer flex items-center justify-between"
                      >
                        <span>{item}</span>
                        {jenisInput.toLowerCase() === item.toLowerCase() && (
                          <Check className="w-3.5 h-3.5 text-[#0F6B4C]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nama Program */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Nama Lengkap Program <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={namaProgramInput}
                  onChange={(e) => setNamaProgramInput(e.target.value)}
                  placeholder="Contoh: Reimburse SPP & Buku Sekolah Anak - Periode 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] transition bg-[#FAFAF7]"
                  required
                />
              </div>

              {/* Maksimum Persen Klaim */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#1F2A24]">
                    Maksimum % Saldo Poin <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-[#0F6B4C]">{maksPersenInput}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={maksPersenInput}
                  onChange={(e) => setMaksPersenInput(Number(e.target.value))}
                  className="w-full accent-[#0F6B4C] cursor-pointer"
                />
                <p className="text-[10px] text-[#6B7568] mt-0.5">
                  Jamaah berhak mengklaim maksimal {maksPersenInput}% dari total saldo poin mereka.
                </p>
              </div>

              {/* Periode Tanggal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2A24] mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={tanggalMulaiInput}
                    onChange={(e) => setTanggalMulaiInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAF7]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2A24] mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={tanggalSelesaiInput}
                    onChange={(e) => setTanggalSelesaiInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAF7]"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProgModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#6B7568] hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProg}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingProg ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: TOLAK KLAIM & KEMBALIKAN POIN */}
      {/* =================================================================== */}
      {rejectingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setRejectingClaim(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <XCircle className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-[#1F2A24] font-heading">
              Tolak Pengajuan Klaim?
            </h3>
            <p className="text-xs text-[#6B7568] mt-1 leading-relaxed">
              Saldo sebesar <b>Rp {rejectingClaim.besar_klaim.toLocaleString('id-ID')} ({rejectingClaim.besar_klaim} poin)</b> akan langsung dikembalikan ke akun <b>{rejectingClaim.nama_user}</b>.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={catatanReject}
                  onChange={(e) => setCatatanReject(e.target.value)}
                  placeholder="Contoh: Kuitansi tidak jelas / tidak sesuai dengan peruntukan program"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-[#FAFAF7]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectingClaim(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#6B7568] hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? 'Memproses...' : 'Tolak & Kembalikan Poin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: UPLOAD BUKTI TRANSFER ADMIN (DANA DIKIRIM) */}
      {/* =================================================================== */}
      {transferringClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setTransferringClaim(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0F6B4C] flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-[#1F2A24] font-heading">
              Upload Bukti Transfer Bank
            </h3>
            <p className="text-xs text-[#6B7568] mt-0.5 leading-relaxed">
              Klaim untuk <b>{transferringClaim.nama_user}</b> sebesar <b>Rp {transferringClaim.besar_klaim.toLocaleString('id-ID')}</b> ({transferringClaim.nama_bank} - {transferringClaim.no_rekening}).
            </p>

            {proofError && (
              <div className="p-3 my-2 rounded-2xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{proofError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTransferProof} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  Foto Bukti Struk / Screenshot Transfer <span className="text-red-500">*</span>
                </label>

                {proofPreview ? (
                  <div className="p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-2.5">
                    <img
                      src={proofPreview}
                      alt="Proof"
                      className="w-12 h-12 object-cover rounded-xl border border-emerald-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1F2A24] truncate">{proofFileName}</p>
                      <p className="text-[10px] text-[#0F6B4C]">Terkonpresi ({proofSizeKB} KB)</p>
                    </div>
                    <label className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-bold text-[#1F2A24] cursor-pointer">
                      Ganti
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleProofFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-[#0F6B4C] rounded-2xl bg-[#FAFAF7] transition cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs font-bold text-[#1F2A24]">Pilih Foto Bukti Transfer</span>
                    <span className="text-[10px] text-[#6B7568]">Disimpan otomatis ke Google Drive</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleProofFileChange}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferringClaim(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-[#6B7568] hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProof || uploadingProof || !proofFileBase64}
                  className="flex-1 py-2.5 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingProof ? 'Menyimpan...' : 'Selesaikan Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
