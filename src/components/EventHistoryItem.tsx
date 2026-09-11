import React from 'react';
import { Calendar, Clock, CheckCircle2, Gift } from 'lucide-react';
import { ScanLog } from '../types';

interface EventHistoryItemProps {
  log: ScanLog;
}

export const EventHistoryItem: React.FC<EventHistoryItemProps> = ({ log }) => {
  const isRedeem = (log.poin_didapat && log.poin_didapat < 0) || log.event_type === 'redeem';

  // Format date and time
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return '';
    }
  };

  const formatDate = (isoOrDateStr?: string) => {
    if (!isoOrDateStr) return '';
    try {
      const d = new Date(isoOrDateStr);
      if (isNaN(d.getTime())) return isoOrDateStr;
      return d.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoOrDateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs hover:border-[#0F6B4C]/20 transition flex items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isRedeem ? 'bg-rose-50 text-rose-600' : 'bg-[#E8F3EE] text-[#0F6B4C]'
          }`}
        >
          {isRedeem ? <Gift className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="text-sm font-semibold text-[#1F2A24] truncate leading-tight font-heading">
              {log.nama_event || 'Kajian Masjid Al Hijrah'}
            </h4>
            {isRedeem && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                Redeem
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6B7568]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(log.tanggal || log.scanned_at)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(log.scanned_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {isRedeem ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
            -{Math.abs(log.poin_didapat)} Poin
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#E8F3EE] border border-[#0F6B4C]/20 text-[#0F6B4C] font-bold text-xs">
            +{log.poin_didapat} Poin
          </span>
        )}
      </div>
    </div>
  );
};
