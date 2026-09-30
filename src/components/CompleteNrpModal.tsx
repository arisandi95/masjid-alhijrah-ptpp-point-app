import React, { useState } from 'react';
import { IdCard, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CompleteNrpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const CompleteNrpModal: React.FC<CompleteNrpModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Lengkapi Nomor NRP Anda',
  description = 'Nomor Registrasi Pegawai (NRP) wajib diisi untuk verifikasi identitas jamaah dan pengajuan reimburse.',
}) => {
  const { user, updateUserNrp } = useAuth();
  const [nrp, setNrp] = useState(user?.nrp || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNrp = nrp.trim().replace(/\s+/g, '');
    if (!cleanNrp) {
      setErrorMsg('NRP wajib diisi');
      return;
    }
    if (cleanNrp.length > 16) {
      setErrorMsg('NRP maksimal 16 karakter');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await updateUserNrp(cleanNrp);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal menyimpan NRP');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#0F6B4C]/10 text-[#0F6B4C] flex items-center justify-center mb-3">
          <IdCard className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h3 className="text-base font-bold text-[#1F2A24] font-heading">{title}</h3>
        <p className="text-xs text-[#6B7568] mt-1 mb-4 leading-relaxed">{description}</p>

        {errorMsg && (
          <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-100 text-[#C0392B] flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#1F2A24]">
                Nomor NRP <span className="text-red-500">*</span>
              </label>
              <span className={`text-[10px] ${nrp.length > 16 ? 'text-red-500 font-bold' : 'text-[#6B7568]'}`}>
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
                placeholder="Contoh: 1234567890"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-[#FAFAF7]"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#6B7568] hover:bg-gray-50 transition cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              type="submit"
              disabled={loading || !nrp.trim() || nrp.trim().length > 16}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan NRP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
