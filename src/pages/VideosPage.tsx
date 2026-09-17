import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Play,
  X,
  ExternalLink,
  Share2,
  Sparkles,
  Film,
  Calendar,
  RefreshCw,
  Check,
  Video as VideoIcon,
  Flame,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { VideoItem } from '../types';
import { getYouTubeThumbnail, getYouTubeEmbedUrl } from '../utils/youtubeUtils';

interface VideosPageProps {
  onGoToAdmin?: () => void;
  isAdmin?: boolean;
}

export const VideosPage: React.FC<VideosPageProps> = ({ onGoToAdmin, isAdmin }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load videos
  const loadVideos = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getVideos();
      if (res.success && res.data) {
        setVideos(res.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    });
  }, [videos, searchQuery]);

  const featuredVideo = videos.length > 0 ? videos[0] : null;

  // Handle Share
  const handleShare = async (video: VideoItem) => {
    const url = video.youtube_url;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Tonton kajian "${video.title}" dari Masjid Al Hijrah PTPP`,
          url: url,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore
    }
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <header className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F6B4C] to-[#168a62] text-[#FAF3D1] flex items-center justify-center shadow-xs">
            <VideoIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Video Kajian & Inspirasi
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-emerald-50 text-[#0F6B4C] border border-emerald-200/80">
                {videos.length} Video
              </span>
            </div>
            <h1 className="text-base font-bold text-[#1F2A24] font-heading leading-tight">
              Masjid Al Hijrah PTPP
            </h1>
          </div>
        </div>

        <button
          onClick={() => loadVideos(true)}
          disabled={refreshing}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] hover:border-[#0F6B4C]/30 flex items-center justify-center transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Segarkan data video"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari tema kajian, ustadz, materi..."
          className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm text-[#1F2A24] placeholder-gray-400 focus:outline-none focus:border-[#0F6B4C] focus:ring-2 focus:ring-[#0F6B4C]/15 transition"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Featured Video Card (Show only when no search is active and video exists) */}
      {!searchQuery && featuredVideo && (
        <div className="relative overflow-hidden rounded-3xl bg-[#14261D] text-white shadow-md border border-[#0F6B4C]/30 group">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-[#D4AF37]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* Thumbnail with overlay */}
            <div
              className="relative w-full aspect-video bg-black/60 overflow-hidden cursor-pointer"
              onClick={() => setActiveVideo(featuredVideo)}
            >
              <img
                src={getYouTubeThumbnail(featuredVideo.youtube_id, 'hq')}
                alt={featuredVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14261D] via-[#14261D]/30 to-black/30" />

              {/* Badges on Thumbnail */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#14261D] text-[10px] font-bold flex items-center gap-1 shadow-xs">
                  <Flame className="w-3 h-3 fill-current" />
                  Kajian Pilihan
                </span>
                <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white/90 text-[10px] font-semibold">
                  YouTube
                </span>
              </div>

              {/* Big Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white text-[#0F6B4C] flex items-center justify-center shadow-lg transition duration-300 group-hover:scale-110">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 space-y-2">
              <h2
                onClick={() => setActiveVideo(featuredVideo)}
                className="text-base font-bold text-white font-heading leading-snug line-clamp-2 cursor-pointer hover:text-[#D4AF37] transition"
              >
                {featuredVideo.title}
              </h2>
              {featuredVideo.description && (
                <p className="text-xs text-white/80 line-clamp-2 leading-relaxed font-normal">
                  {featuredVideo.description}
                </p>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-[11px] text-white/60 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(featuredVideo.created_at)}
                </span>
                <button
                  onClick={() => setActiveVideo(featuredVideo)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0F6B4C] hover:bg-[#12805b] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Tonton Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Videos Section Header */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-sm font-bold text-[#1F2A24] font-heading flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#0F6B4C]" />
          <span>Daftar Video Kajian</span>
          <span className="text-xs font-normal text-gray-500">({filteredVideos.length})</span>
        </h3>

        {isAdmin && onGoToAdmin && (
          <button
            onClick={onGoToAdmin}
            className="text-xs font-semibold text-[#0F6B4C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>+ Kelola di Admin</span>
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 animate-pulse space-y-2">
              <div className="w-full aspect-video bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded-md w-3/4" />
              <div className="h-3 bg-gray-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredVideos.length === 0 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#0F6B4C] flex items-center justify-center mx-auto">
            <Film className="w-7 h-7 stroke-[1.8]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#1F2A24] font-heading">
              {searchQuery ? 'Video Tidak Ditemukan' : 'Belum Ada Video Kajian'}
            </h4>
            <p className="text-xs text-[#6B7568] mt-1 max-w-xs mx-auto">
              {searchQuery
                ? `Tidak ditemukan video dengan kata kunci "${searchQuery}". Coba gunakan kata kunci lain.`
                : 'Video kajian yang ditambahkan oleh pengurus/admin akan muncul di sini.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition cursor-pointer"
            >
              Reset Pencarian
            </button>
          ) : (
            isAdmin &&
            onGoToAdmin && (
              <button
                onClick={onGoToAdmin}
                className="px-4 py-2 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold hover:bg-[#0c593f] transition cursor-pointer"
              >
                Tambah Video Sekarang
              </button>
            )
          )}
        </div>
      )}

      {/* Video Cards Grid / List */}
      {!loading && filteredVideos.length > 0 && (
        <div className="space-y-3">
          {filteredVideos.map((video) => {
            const isFeatured = featuredVideo?.video_id === video.video_id && !searchQuery;
            if (isFeatured) return null; // Already rendered in hero

            return (
              <div
                key={video.video_id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-[#0F6B4C]/25 transition duration-200 p-3 shadow-2xs hover:shadow-xs space-y-2.5"
              >
                {/* Thumbnail */}
                <div
                  className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => setActiveVideo(video)}
                >
                  <img
                    src={getYouTubeThumbnail(video.youtube_id, 'hq')}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/90 group-hover:bg-white text-[#0F6B4C] flex items-center justify-center shadow-md transition group-hover:scale-110">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* YouTube Tag */}
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white tracking-wide">
                    YouTube
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4
                    onClick={() => setActiveVideo(video)}
                    className="text-sm font-bold text-[#1F2A24] font-heading leading-snug line-clamp-2 hover:text-[#0F6B4C] transition cursor-pointer"
                  >
                    {video.title}
                  </h4>
                  {video.description && (
                    <p className="text-xs text-[#6B7568] line-clamp-2 mt-1 leading-relaxed">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Bottom Bar */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(video.created_at)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShare(video)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-[#0F6B4C] hover:bg-emerald-50 transition cursor-pointer"
                      title="Bagikan Video"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveVideo(video)}
                      className="px-3 py-1 rounded-xl bg-[#0F6B4C]/10 hover:bg-[#0F6B4C] text-[#0F6B4C] hover:text-white text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tonton</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Theater Mode Video Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-[#14261D] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-3.5 px-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-[#14261D] text-[10px] font-bold">
                  Kajian Video
                </span>
                <span className="text-xs text-white/70">Masjid Al Hijrah</span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                title="Tutup Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Responsive 16:9 YouTube Embed */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={getYouTubeEmbedUrl(activeVideo.youtube_id, true)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Video Details & Actions */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              <div>
                <h3 className="text-base font-bold text-white font-heading leading-snug">
                  {activeVideo.title}
                </h3>
                <p className="text-[11px] text-white/60 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Ditambahkan: {formatDate(activeVideo.created_at)}
                </p>
              </div>

              {activeVideo.description && (
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-white/80 leading-relaxed text-xs">
                  <p className="whitespace-pre-line">{activeVideo.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <a
                  href={activeVideo.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di YouTube</span>
                </a>

                <button
                  onClick={() => handleShare(activeVideo)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Bagikan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
