import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  ChevronRight,
  LogOut,
  BellRing,
  ShieldCheck,
  Gift,
  Video as VideoIcon,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PointBadge } from '../components/PointBadge';
import { EventHistoryItem } from '../components/EventHistoryItem';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { api } from '../services/api';
import { MasterEvent, ScanLog } from '../types';
import { getCompanyDisplayName, getUnitDisplayName } from '../utils/companyUtils';

interface HomePageProps {
  onGoToScan: () => void;
  onGoToHistory: () => void;
  onGoToVideos?: () => void;
  onGoToAdmin?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGoToScan,
  onGoToHistory,
  onGoToVideos,
  onGoToAdmin,
}) => {
  const { user, logout } = useAuth();
  const [activeEvents, setActiveEvents] = useState<MasterEvent[]>([]);
  const [recentLogs, setRecentLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      if (!user) return;
      try {
        const [eventsRes, historyRes] = await Promise.all([
          api.getEvents(),
          api.getHistory(user.user_id),
        ]);

        if (isMounted) {
          if (eventsRes.success && eventsRes.data) {
            setActiveEvents(eventsRes.data.filter((e) => e.status === 'active'));
          }
          if (historyRes.success && historyRes.data) {
            setRecentLogs(historyRes.data.slice(0, 3));
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const featuredEvent = activeEvents[0];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Top Bar Header */}
      <header className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0F6B4C] text-[#FAF3D1] flex items-center justify-center shadow-xs">
            <svg width="22" height="22" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 8 C70 8 88 35 90 62 L90 88 L10 88 L10 62 C12 35 30 8 50 8 Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Masjid Al Hijrah PTPP
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                  user?.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                    : 'bg-emerald-50 text-[#0F6B4C] border border-emerald-200/80'
                }`}
              >
                {user?.role === 'admin' ? 'Admin' : 'Jamaah'}
              </span>
            </div>
            <h1 className="text-base font-bold text-[#1F2A24] font-heading leading-tight truncate max-w-[200px]">
              {user?.nama || 'Jamaah Al Hijrah'}
            </h1>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {user?.status_pegawai && (
                <span className="text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                  {user.status_pegawai}
                </span>
              )}
              {user?.status_jamaah && !user?.status_pegawai && (
                <span className="text-[10px] font-medium text-[#0F6B4C] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                  {user.status_jamaah}
                </span>
              )}
              {user?.company_id && (
                <span className="text-[10px] text-[#6B7568] truncate max-w-[120px]" title={getCompanyDisplayName(user.company_id)}>
                  • {getCompanyDisplayName(user.company_id)}
                </span>
              )}
              {user?.unit_id && (
                <span className="text-[10px] text-[#6B7568] truncate max-w-[120px]" title={getUnitDisplayName(user.unit_id)}>
                  • {getUnitDisplayName(user.unit_id)}
                </span>
              )}
              {user?.jenis_kelamin && (
                <span className="text-[10px] text-[#6B7568]">
                  • {user.jenis_kelamin === 'wanita' ? 'Wanita' : 'Pria'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-[#6B7568] hover:text-[#C0392B] flex items-center justify-center transition shadow-2xs"
            title="Keluar Akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Admin Quick Action Banner (Khusus Role: Admin) */}
      {user?.role === 'admin' && onGoToAdmin && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50 p-3.5 rounded-2xl border border-amber-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1F2A24] leading-tight">Panel Pengurus / Admin</p>
              <p className="text-[11px] text-[#6B7568]">Kelola kajian, buat QR, & pantau jamaah</p>
            </div>
          </div>
          <button
            onClick={onGoToAdmin}
            className="px-2.5 py-1.5 rounded-xl bg-[#0F6B4C] hover:bg-[#094A34] text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Buka</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Point Card */}
      <PointBadge points={user?.total_poin || 0} size="lg" />

      {/* Big Main CTA: Scan QR Button */}
      <div className="bg-gradient-to-r from-[#E8F3EE] to-[#FAF3D1]/50 p-4 rounded-3xl border border-[#0F6B4C]/15 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0F6B4C] font-heading flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              Absensi Kehadiran Kajian
            </h2>
            <p className="text-[11px] text-[#6B7568] mt-0.5">
              Arahkan kamera ke QR Code di masjid untuk mencatat poin
            </p>
          </div>
        </div>

        <button
          onClick={onGoToScan}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#0F6B4C] hover:bg-[#0c593f] text-white font-bold text-sm shadow-md shadow-[#0F6B4C]/25 flex items-center justify-center gap-2.5 transition active:scale-98 cursor-pointer"
        >
          <QrCode className="w-5 h-5 stroke-[2.5]" />
          <span>Buka Scanner QR Kajian</span>
        </button>
      </div>

      {/* Active Kajian Card */}
      {featuredEvent && (() => {
        const isRedeem = featuredEvent.event_type === 'redeem';
        return (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              {isRedeem ? (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-200">
                  <Gift className="w-3 h-3 text-rose-600" />
                  Kupon Penukaran Poin
                </span>
              ) : (
                <span className="text-[11px] font-bold text-[#0F6B4C] bg-[#E8F3EE] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BellRing className="w-3 h-3 text-[#0F6B4C]" />
                  Kajian Terjadwal
                </span>
              )}

              {isRedeem ? (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  -{featuredEvent.poin_value} Poin
                </span>
              ) : (
                <span className="text-xs font-bold text-[#D4AF37] bg-amber-50 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                  +{featuredEvent.poin_value} Poin
                </span>
              )}
            </div>

            <h3 className="text-sm font-bold text-[#1F2A24] font-heading leading-snug">
              {featuredEvent.nama_event}
            </h3>

            <div className="mt-2.5 space-y-1 text-xs text-[#6B7568]">
              {featuredEvent.pemateri && (
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#0F6B4C]" />
                  <span className="truncate">
                    {isRedeem ? 'PJ / Posko: ' : ''}
                    {featuredEvent.pemateri}
                  </span>
                </div>
              )}
              {featuredEvent.waktu && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0F6B4C]" />
                  <span>{featuredEvent.waktu}</span>
                </div>
              )}
              {featuredEvent.lokasi && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F6B4C]" />
                  <span className="truncate">{featuredEvent.lokasi}</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Fitur Baru: Banner Video Kajian */}
      {onGoToVideos && (
        <div
          onClick={onGoToVideos}
          className="bg-gradient-to-r from-[#14261D] to-[#1E3A2D] rounded-3xl p-3.5 px-4 text-white shadow-xs border border-[#0F6B4C]/30 flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/50 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 group-hover:bg-[#0F6B4C] text-[#D4AF37] group-hover:text-white flex items-center justify-center shrink-0 transition">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                  Fitur Baru
                </span>
                <span className="px-1.5 py-0.2 bg-red-600/90 text-[9px] font-bold rounded text-white">
                  YouTube
                </span>
              </div>
              <p className="text-xs font-bold text-white font-heading leading-tight">
                Video Kajian & Tausiyah
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">
                Tonton rekaman kajian & ilmu bermanfaat
              </p>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center shrink-0 text-white transition">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Recent History Section */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#6B7568] uppercase tracking-wider">
            Riwayat Absensi Terakhir
          </h2>
          {recentLogs.length > 0 && (
            <button
              onClick={onGoToHistory}
              className="text-xs font-semibold text-[#0F6B4C] flex items-center gap-0.5 hover:underline"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-dashed border-gray-200 text-center">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1F2A24]">Belum Ada Riwayat Absensi</p>
            <p className="text-[11px] text-[#6B7568] mt-0.5">
              Hadir dan scan QR kajian pertama Anda untuk mengumpulkan poin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <EventHistoryItem key={log.log_id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* Mosque Info Note */}
      <div className="p-3 bg-[#E8F3EE]/60 rounded-2xl border border-[#0F6B4C]/10 text-center">
        <p className="text-[11px] text-[#0F6B4C] font-medium leading-relaxed">
          "Barang siapa menempuh jalan mencari ilmu agama, Allah mudahkan baginya jalan menuju surga."
          <span className="block text-[10px] text-[#6B7568] mt-0.5 font-semibold">
            (HR. Muslim)
          </span>
        </p>
      </div>
    </div>
  );
};
