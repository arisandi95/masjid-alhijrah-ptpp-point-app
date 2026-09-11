import React from 'react';
import { Award, Sparkles } from 'lucide-react';

interface PointBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
}

export const PointBadge: React.FC<PointBadgeProps> = ({ points, size = 'md', showRank = true }) => {
  // Rank based on points
  let rank = 'Jamaah Pemula';
  let rankColor = 'text-[#0F6B4C] bg-[#E8F3EE]';
  if (points >= 300) {
    rank = 'Jamaah Istiqomah Teladan';
    rankColor = 'text-amber-800 bg-amber-100';
  } else if (points >= 150) {
    rank = 'Pejuang Subuh Masjid';
    rankColor = 'text-emerald-800 bg-emerald-100';
  } else if (points >= 50) {
    rank = 'Jamaah Aktif';
    rankColor = 'text-emerald-700 bg-emerald-50';
  }

  if (size === 'sm') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-amber-100 border border-[#D4AF37]/40 text-[#856404] font-semibold text-xs shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-[#B78A1D]" />
        <span>{points.toLocaleString('id-ID')} Poin</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F6B4C] to-[#08422F] p-5 text-white shadow-md border border-[#D4AF37]/30">
        {/* Subtle decorative Islamic arch watermark */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
          <svg width="140" height="140" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C75 0 95 30 100 60 L100 100 L0 100 L0 60 C5 30 25 0 50 0 Z" />
          </svg>
        </div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#E8F3EE]/80 font-medium">
              Total Akumulasi Poin
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-extrabold tracking-tight text-[#FAF3D1] font-heading">
                {points.toLocaleString('id-ID')}
              </span>
              <span className="text-sm font-semibold text-[#D4AF37]">POIN</span>
            </div>
          </div>

          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F5E6AB] to-[#D4AF37] text-[#5C4509] flex items-center justify-center shadow-sm">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {showRank && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
            <div className="flex items-center gap-1.5 text-[#E8F3EE]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Gelar Jamaah:</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] shadow-2xs ${rankColor}`}>
              {rank}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default 'md'
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-[#D4AF37]/35 text-[#856404] shadow-2xs">
      <Award className="w-4 h-4 text-[#D4AF37]" />
      <span className="font-bold text-sm text-[#1F2A24]">{points.toLocaleString('id-ID')}</span>
      <span className="text-xs font-semibold text-[#856404]">Poin</span>
    </div>
  );
};
