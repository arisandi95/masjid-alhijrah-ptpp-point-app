import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  MessageSquareHeart,
  ChevronRight,
  Send,
  X,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  Users,
} from 'lucide-react';
import { MasterEvent, EventReviewInput } from '../types';

interface EventFeedbackModalProps {
  event: MasterEvent;
  isSubmitting: boolean;
  onSubmit: (reviewData: EventReviewInput) => void;
  onCancel: () => void;
}

export const EventFeedbackModal: React.FC<EventFeedbackModalProps> = ({
  event,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const [skorMateri, setSkorMateri] = useState<number>(5);
  const [skorKenyamanan, setSkorKenyamanan] = useState<number>(5);
  const [skorSound, setSkorSound] = useState<number>(5);
  const [skorPanitia, setSkorPanitia] = useState<number>(5);

  const [kesanTerbaik, setKesanTerbaik] = useState<string>('');
  const [halKurang, setHalKurang] = useState<string>('');
  const [usulanKegiatan, setUsulanKegiatan] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      skor_materi: skorMateri,
      skor_kenyamanan: skorKenyamanan,
      skor_sound: skorSound,
      skor_panitia: skorPanitia,
      kesan_terbaik: kesanTerbaik.trim(),
      hal_kurang: halKurang.trim(),
      usulan_kegiatan: usulanKegiatan.trim(),
    });
  };

  const renderLinearScale = (
    value: number,
    onChange: (val: number) => void,
    idPrefix: string
  ) => {
    return (
      <div className="mt-2.5">
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((num) => {
            const isSelected = value === num;
            return (
              <button
                key={num}
                type="button"
                id={`${idPrefix}-scale-${num}`}
                onClick={() => onChange(num)}
                className={`py-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 border ${
                  isSelected
                    ? 'bg-[#0F6B4C] text-white border-[#0F6B4C] shadow-sm scale-102'
                    : 'bg-white text-[#1F2A24] border-gray-200 hover:border-[#0F6B4C]/40 hover:bg-[#E8F3EE]/30'
                }`}
              >
                <div className="flex items-center gap-0.5">
                  <Star
                    className={`w-3 h-3 ${
                      isSelected ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300'
                    }`}
                  />
                  <span>{num}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[#6B7568] px-1 mt-1 font-medium">
          <span>1 = Sangat Kurang</span>
          <span>5 = Sangat Baik</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#0F6B4C] to-[#0b533a] p-4 text-white relative shrink-0">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#f7e7b4] text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>+{event.poin_value} Poin Jamaah</span>
            </div>
            {event.kuota ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-medium">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Kuota: {event.kuota} Jamaah</span>
              </div>
            ) : null}
          </div>

          <h2 className="text-base font-bold font-heading leading-snug pr-8 text-white">
            {event.nama_event}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-white/80">
            {event.pemateri && (
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                {event.pemateri}
              </span>
            )}
            {event.waktu && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D4AF37]" />
                {event.waktu}
              </span>
            )}
            {event.lokasi && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#D4AF37]" />
                {event.lokasi}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-5 text-left flex-1">
          {/* Form Description Banner */}
          <div className="bg-[#E8F3EE] p-3 rounded-2xl border border-[#0F6B4C]/20 text-[#0F6B4C]">
            <h3 className="text-xs font-bold font-heading flex items-center gap-1.5 text-[#0F6B4C]">
              <MessageSquareHeart className="w-4 h-4 text-[#D4AF37]" />
              Penilaian Acara
            </h3>
            <p className="text-[11px] text-[#1F2A24] mt-0.5 leading-relaxed">
              Silakan beri penilaian Anda dengan skala 1 sampai 5. Keterangan: <strong>1 = Sangat Kurang</strong>, <strong>5 = Sangat Baik</strong>.
              Setelah formulir dikirim, sistem akan memverifikasi ketersediaan kuota poin acara ini.
            </p>
          </div>

          {/* Question 1 */}
          <div className="bg-[#FAFAF7] p-3.5 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-[#1F2A24] leading-snug">
              1. Kualitas Materi dan Penyampaian Narasumber
            </label>
            <p className="text-[11px] text-[#6B7568] mt-0.5 leading-relaxed">
              (Apakah materi mudah dipahami, relevan, dan disampaikan dengan baik?)
            </p>
            {renderLinearScale(skorMateri, setSkorMateri, 'materi')}
          </div>

          {/* Question 2 */}
          <div className="bg-[#FAFAF7] p-3.5 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-[#1F2A24] leading-snug">
              2. Kenyamanan lokasi acara
            </label>
            <p className="text-[11px] text-[#6B7568] mt-0.5 leading-relaxed">
              (Apakah suhu ruangan nyaman dan area shaf/karpet tertata bersih?)
            </p>
            {renderLinearScale(skorKenyamanan, setSkorKenyamanan, 'lokasi')}
          </div>

          {/* Question 3 */}
          <div className="bg-[#FAFAF7] p-3.5 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-[#1F2A24] leading-snug">
              3. Kejelasan Suara (Sound System)
            </label>
            <p className="text-[11px] text-[#6B7568] mt-0.5 leading-relaxed">
              (Apakah suara narasumber dan MC terdengar jelas hingga ke area belakang/luar?)
            </p>
            {renderLinearScale(skorSound, setSkorSound, 'sound')}
          </div>

          {/* Question 4 */}
          <div className="bg-[#FAFAF7] p-3.5 rounded-2xl border border-gray-100">
            <label className="block text-xs font-bold text-[#1F2A24] leading-snug">
              4. Kesigapan dan Pelayanan Panitia
            </label>
            <p className="text-[11px] text-[#6B7568] mt-0.5 leading-relaxed">
              (Meliputi keramahan penyambutan, pengaturan parkir, dan bantuan arahan shaf)
            </p>
            {renderLinearScale(skorPanitia, setSkorPanitia, 'panitia')}
          </div>

          {/* Section Divider: Kesan, Kritik, dan Saran */}
          <div className="pt-2 border-t border-gray-200">
            <div className="mb-3">
              <h4 className="text-xs font-bold text-[#1F2A24] font-heading">
                Kesan, Kritik, dan Saran
              </h4>
              <p className="text-[11px] text-[#6B7568]">
                (Kami sangat menantikan masukan jujur dari Anda untuk perbaikan bersama)
              </p>
            </div>

            {/* Question 5 */}
            <div className="space-y-1.5 mb-3.5">
              <label
                htmlFor="input-kesan-terbaik"
                className="block text-xs font-semibold text-[#1F2A24] leading-snug"
              >
                5. Apa kesan terbaik atau hal yang paling Anda sukai dari acara ini?
              </label>
              <p className="text-[10px] text-[#6B7568]">
                (Misal: Tema yang sangat pas dengan kondisi saat ini, panitia yang ramah, dsb.)
              </p>
              <textarea
                id="input-kesan-terbaik"
                rows={2}
                value={kesanTerbaik}
                onChange={(e) => setKesanTerbaik(e.target.value)}
                placeholder="Tuliskan kesan terbaik Anda di sini..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/20 focus:border-[#0F6B4C] bg-white transition resize-none"
              />
            </div>

            {/* Question 6 */}
            <div className="space-y-1.5 mb-3.5">
              <label
                htmlFor="input-hal-kurang"
                className="block text-xs font-semibold text-[#1F2A24] leading-snug"
              >
                6. Menurut Anda, apa hal yang masih dirasa kurang maksimal dan perlu diperbaiki dari acara ini?
              </label>
              <p className="text-[10px] text-[#6B7568]">
                (Misal: Waktu yang molor, parkir yang sempit, suara kurang jelas, dsb.)
              </p>
              <textarea
                id="input-hal-kurang"
                rows={2}
                value={halKurang}
                onChange={(e) => setHalKurang(e.target.value)}
                placeholder="Tuliskan masukan atau kekurangan yang dirasakan..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/20 focus:border-[#0F6B4C] bg-white transition resize-none"
              />
            </div>

            {/* Question 7 */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-usulan-kegiatan"
                className="block text-xs font-semibold text-[#1F2A24] leading-snug"
              >
                7. Apakah ada usulan tema kajian, nama narasumber, atau bentuk kegiatan lain yang Anda harapkan diadakan oleh Masjid Alhijrah di masa mendatang?
              </label>
              <textarea
                id="input-usulan-kegiatan"
                rows={2}
                value={usulanKegiatan}
                onChange={(e) => setUsulanKegiatan(e.target.value)}
                placeholder="Tuliskan usulan tema atau narasumber yang diharapkan..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]/20 focus:border-[#0F6B4C] bg-white transition resize-none"
              />
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-[#0F6B4C] hover:bg-[#094A34] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Menyimpan Penilaian...'
                  : `Submit Poin (+${event.poin_value} Poin)`}
              </span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-[#6B7568] hover:bg-gray-50 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
