import React, { useEffect, useState } from 'react';
import { History, Calendar, Search, RefreshCw, Award, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ScanLog } from '../types';
import { EventHistoryItem } from '../components/EventHistoryItem';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getHistory(user.user_id);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const filteredLogs = logs.filter((l) =>
    (l.nama_event || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPoints = logs.reduce((sum, item) => sum + (item.poin_didapat || 0), 0);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1F2A24] font-heading">
            Riwayat Absensi Kajian
          </h1>
          <p className="text-xs text-[#6B7568]">
            Catatan kehadiran & perolehan poin Anda
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] flex items-center justify-center transition shadow-2xs active:scale-95"
          title="Segarkan data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </div>

      {/* Summary Stat Card */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 text-[#0F6B4C] mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-[11px] font-semibold text-[#6B7568]">Total Hadir</span>
          </div>
          <p className="text-xl font-extrabold text-[#1F2A24] font-heading">
            {logs.length} <span className="text-xs font-normal text-[#6B7568]">Kajian</span>
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 text-[#D4AF37] mb-1">
            <Award className="w-4 h-4 text-[#B78A1D]" />
            <span className="text-[11px] font-semibold text-[#6B7568]">Total Terkumpul</span>
          </div>
          <p className="text-xl font-extrabold text-[#0F6B4C] font-heading">
            {user?.total_poin ?? totalPoints}{' '}
            <span className="text-xs font-semibold text-[#D4AF37]">Poin</span>
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7568]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama kajian..."
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] focus:border-transparent transition bg-white shadow-2xs"
        />
      </div>

      {/* History List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center text-[#6B7568] text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#0F6B4C] mb-2" />
            <span>Memuat riwayat absensi...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F3EE] text-[#0F6B4C] flex items-center justify-center mx-auto mb-1">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1F2A24] font-heading">
              {searchQuery ? 'Tidak Ditemukan' : 'Belum Ada Kehadiran'}
            </h3>
            <p className="text-xs text-[#6B7568] max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? `Tidak ada kajian dengan kata kunci "${searchQuery}".`
                : 'Catatan absensi kajian Anda akan otomatis muncul di sini setelah Anda melakukan scan QR.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => <EventHistoryItem key={log.log_id} log={log} />)
        )}
      </div>
    </div>
  );
};
