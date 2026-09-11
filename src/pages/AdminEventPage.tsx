import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Plus,
  QrCode,
  Printer,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  Database,
  Calendar,
  Award,
  Users,
  ExternalLink,
  Code,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Table as TableIcon,
  LayoutGrid,
  User as UserIcon,
  Gift,
  PlusCircle,
  MinusCircle,
  Star,
  MessageSquareHeart,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MasterEvent, ScanLog, User, EventReview, ALL_DATABASE_SCHEMAS } from '../types';
import { getGasUrl, setGasUrl } from '../services/mockStorage';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/gasScript';

export const AdminEventPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'penilaian' | 'rekap' | 'sheets'>('events');
  const [eventViewMode, setEventViewMode] = useState<'table' | 'cards'>('table');
  const [events, setEvents] = useState<MasterEvent[]>([]);
  const [allLogs, setAllLogs] = useState<ScanLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [reviewFilterEvent, setReviewFilterEvent] = useState<string>('all');
  const [selectedSchemaTable, setSelectedSchemaTable] = useState<string>('users');
  const [copiedSchemaHeaders, setCopiedSchemaHeaders] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal QR & New Event
  const [selectedQR, setSelectedQR] = useState<MasterEvent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // New Event Form State
  const [newNama, setNewNama] = useState('');
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [newPoin, setNewPoin] = useState(25);
  const [newEventType, setNewEventType] = useState<'append' | 'redeem'>('append');
  const [newPemateri, setNewPemateri] = useState('');
  const [newLokasi, setNewLokasi] = useState('Ruang Utama Masjid Al Hijrah PTPP');
  const [newWaktu, setNewWaktu] = useState('Ba\'da Maghrib (18:30 WIB)');
  const [submitting, setSubmitting] = useState(false);

  // Google Sheets Config State
  const [gasUrlInput, setGasUrlInput] = useState(getGasUrl());
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, logsRes, leaderRes, reviewsRes] = await Promise.all([
        api.getEvents(),
        api.getAllLogs(),
        api.getLeaderboard(),
        api.getAllReviews(),
      ]);

      if (eventsRes.success && eventsRes.data) setEvents(eventsRes.data);
      if (logsRes.success && logsRes.data) setAllLogs(logsRes.data);
      if (leaderRes.success && leaderRes.data) setLeaderboard(leaderRes.data);
      if (reviewsRes.success && reviewsRes.data) setReviews(reviewsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.addEvent({
        nama_event: newNama.trim(),
        tanggal: newTanggal,
        poin_value: Number(newPoin) || 25,
        event_type: newEventType,
        pemateri: newPemateri.trim(),
        lokasi: newLokasi.trim(),
        waktu: newWaktu.trim(),
      });

      if (res.success && res.data) {
        setEvents((prev) => [res.data!, ...prev]);
        setShowAddModal(false);
        // Automatically show QR for the new event
        setSelectedQR(res.data);
        // Reset form
        setNewNama('');
        setNewPemateri('');
        setNewEventType('append');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleStatus = async (eventId: string) => {
    const res = await api.toggleEventStatus(eventId);
    if (res.success && res.data) {
      setEvents((prev) => prev.map((e) => (e.event_id === eventId ? res.data! : e)));
    }
  };

  // Copy QR Token
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Copy Code.gs
  const copyCodeGs = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Test GAS Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(gasUrlInput.trim());
      setTestResult(res);
      if (res.success) {
        setGasUrl(gasUrlInput.trim());
        fetchData();
      }
    } finally {
      setTestingConnection(false);
    }
  };

  // Save GAS URL
  const handleSaveGasUrl = () => {
    setGasUrl(gasUrlInput.trim());
    setTestResult({
      success: true,
      message: 'Pengaturan URL tersimpan. Sistem akan otomatis memprioritaskan Google Sheets!',
    });
    fetchData();
  };

  // Toggle user role between 'user' and 'admin'
  const handleToggleRole = async (targetUser: User) => {
    const newRole: 'user' | 'admin' = targetUser.role === 'admin' ? 'user' : 'admin';
    const res = await api.updateUserRole(targetUser.user_id, newRole);
    if (res.success) {
      setLeaderboard((prev) =>
        prev.map((u) => (u.user_id === targetUser.user_id ? { ...u, role: newRole } : u))
      );
    }
  };

  // Guard: Hanya role Admin yang dapat mengakses halaman ini
  if (!isAdmin) {
    return (
      <div className="pt-20 pb-28 px-4 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-[#1F2A24] font-heading">
            Akses Khusus Admin
          </h2>
          <p className="text-xs text-[#6B7568] max-w-xs mx-auto leading-relaxed">
            Menu ini hanya dapat diakses oleh akun pengurus takmir dengan role <strong>Admin</strong>. Akun Anda saat ini memiliki role <strong>{user?.role === 'user' ? 'User (Jamaah)' : 'Tamu'}</strong>.
          </p>
        </div>
        <div className="p-3.5 bg-white rounded-2xl border border-gray-100 text-left text-xs space-y-1.5 shadow-2xs max-w-xs mx-auto">
          <p className="font-semibold text-[#1F2A24] text-[11px] uppercase tracking-wider">Identitas Akun:</p>
          <p className="text-[#6B7568] text-[11px]">Nama: <strong className="text-[#1F2A24]">{user?.nama}</strong></p>
          <p className="text-[#6B7568] text-[11px]">No HP: <strong className="text-[#1F2A24]">{user?.no_hp}</strong></p>
          <p className="text-[#6B7568] text-[11px] flex items-center gap-1.5">
            Role: 
            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F6B4C] border border-emerald-200 font-bold uppercase text-[10px]">
              {user?.role || 'user'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
            Panel Takmir & Admin
          </span>
          <h1 className="text-lg font-bold text-[#1F2A24] font-heading">
            Masjid Al Hijrah PTPP
          </h1>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#6B7568] hover:text-[#0F6B4C] flex items-center justify-center transition shadow-2xs cursor-pointer"
          title="Segarkan data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F6B4C]' : ''}`} />
        </button>
      </div>

      {/* Tabs Navigation (Responsive 2x2 on Mobile, 4 Cols on Desktop - Spaced & Clean) */}
      <div className="bg-white rounded-2xl p-2 border border-gray-200/80 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Tab 1: Kajian & QR */}
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer ${
              activeTab === 'events'
                ? 'bg-[#0F6B4C] text-white shadow-xs font-semibold'
                : 'bg-[#FAFAF7] text-[#4A554A] hover:bg-[#E8F3EE] hover:text-[#0F6B4C] border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'events' ? 'text-[#FAF3D1]' : 'text-[#0F6B4C]'}`} />
              <span className="font-medium truncate">Kajian & QR</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'events'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200/80 text-gray-700'
              }`}
            >
              {events.length}
            </span>
          </button>

          {/* Tab 2: Penilaian Acara */}
          <button
            type="button"
            onClick={() => setActiveTab('penilaian')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer ${
              activeTab === 'penilaian'
                ? 'bg-[#0F6B4C] text-white shadow-xs font-semibold'
                : 'bg-[#FAFAF7] text-[#4A554A] hover:bg-[#E8F3EE] hover:text-[#0F6B4C] border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquareHeart className={`w-4 h-4 shrink-0 ${activeTab === 'penilaian' ? 'text-[#FAF3D1]' : 'text-[#0F6B4C]'}`} />
              <span className="font-medium truncate">Penilaian</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'penilaian'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200/80 text-gray-700'
              }`}
            >
              {reviews.length}
            </span>
          </button>

          {/* Tab 3: Rekap Jamaah */}
          <button
            type="button"
            onClick={() => setActiveTab('rekap')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer ${
              activeTab === 'rekap'
                ? 'bg-[#0F6B4C] text-white shadow-xs font-semibold'
                : 'bg-[#FAFAF7] text-[#4A554A] hover:bg-[#E8F3EE] hover:text-[#0F6B4C] border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Users className={`w-4 h-4 shrink-0 ${activeTab === 'rekap' ? 'text-[#FAF3D1]' : 'text-[#0F6B4C]'}`} />
              <span className="font-medium truncate">Rekap Jamaah</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'rekap'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200/80 text-gray-700'
              }`}
            >
              {leaderboard.length}
            </span>
          </button>

          {/* Tab 4: Google Sheets */}
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-[#0F6B4C] text-white shadow-xs font-semibold'
                : 'bg-[#FAFAF7] text-[#4A554A] hover:bg-[#E8F3EE] hover:text-[#0F6B4C] border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Database className={`w-4 h-4 shrink-0 ${activeTab === 'sheets' ? 'text-[#FAF3D1]' : 'text-[#0F6B4C]'}`} />
              <span className="font-medium truncate">Google Sheets</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'sheets'
                  ? 'bg-white/20 text-white'
                  : gasUrlInput
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-200/80 text-gray-600'
              }`}
            >
              {gasUrlInput ? 'Online' : 'Local'}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: EVENTS & QR GENERATION */}
      {activeTab === 'events' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B7568] uppercase tracking-wider">
                Daftar Kajian ({events.length})
              </span>
              {/* View Mode Toggle: Table vs Cards */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                <button
                  type="button"
                  onClick={() => setEventViewMode('table')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition text-[11px] font-semibold ${
                    eventViewMode === 'table'
                      ? 'bg-white text-[#0F6B4C] shadow-2xs'
                      : 'text-[#6B7568] hover:text-[#1F2A24]'
                  }`}
                  title="Tampilan Tabel"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEventViewMode('cards')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md transition text-[11px] font-semibold ${
                    eventViewMode === 'cards'
                      ? 'bg-white text-[#0F6B4C] shadow-2xs'
                      : 'text-[#6B7568] hover:text-[#1F2A24]'
                  }`}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-[#0F6B4C] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs hover:bg-[#094A34] transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kajian</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center text-[#6B7568]">
              <p className="text-xs">Belum ada kajian yang terdaftar.</p>
            </div>
          ) : eventViewMode === 'table' ? (
            /* TABEL VIEW */
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF7] text-[#6B7568] uppercase text-[10px] font-bold border-b border-gray-200/80">
                    <tr>
                      <th className="px-3 py-2.5 whitespace-nowrap">Nama Kajian / Item</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Mode</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Pemateri / PJ</th>
                      <th className="px-3 py-2.5 whitespace-nowrap">Tanggal & Waktu</th>
                      <th className="px-3 py-2.5 text-center whitespace-nowrap">Poin</th>
                      <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                      <th className="px-3 py-2.5 text-right whitespace-nowrap">QR Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((ev) => {
                      const isRedeem = ev.event_type === 'redeem';
                      return (
                        <tr key={ev.event_id} className="hover:bg-emerald-50/20 transition">
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-[#1F2A24] block leading-tight">
                              {ev.nama_event}
                            </span>
                            {ev.lokasi && (
                              <span className="text-[10px] text-[#6B7568] block mt-0.5 truncate max-w-[160px]">
                                {ev.lokasi}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isRedeem ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Gift className="w-2.5 h-2.5" />
                                <span>Redeem</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0F6B4C] border border-emerald-200">
                                <PlusCircle className="w-2.5 h-2.5" />
                                <span>Append</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {ev.pemateri ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0F6B4C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 text-[11px]">
                                <UserIcon className="w-3 h-3 text-[#0F6B4C] shrink-0" />
                                <span>{ev.pemateri}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[11px] text-[#6B7568]">
                            <span className="font-semibold text-[#1F2A24] block">{ev.tanggal}</span>
                            <span className="text-[10px]">{ev.waktu || 'Ba\'da Maghrib'}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {isRedeem ? (
                              <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                                -{ev.poin_value}
                              </span>
                            ) : (
                              <span className="font-bold text-[#D4AF37] bg-amber-50 px-2 py-0.5 rounded-md border border-[#D4AF37]/30 text-[11px]">
                                +{ev.poin_value}
                              </span>
                            )}
                          </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(ev.event_id)}
                            className="inline-flex items-center cursor-pointer"
                            title={ev.status === 'active' ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                          >
                            {ev.status === 'active' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                Non-aktif
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedQR(ev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E8F3EE] text-[#0F6B4C] font-semibold text-[11px] hover:bg-[#0F6B4C] hover:text-white transition shadow-2xs cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Lihat QR</span>
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* KARTU VIEW */
            <div className="space-y-2.5">
              {events.map((ev) => {
                const isRedeem = ev.event_type === 'redeem';
                return (
                  <div
                    key={ev.event_id}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              ev.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {ev.status === 'active' ? 'Aktif' : 'Non-aktif'}
                          </span>
                          {isRedeem ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <Gift className="w-2.5 h-2.5" />
                              <span>Redeem</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0F6B4C] border border-emerald-200">
                              <PlusCircle className="w-2.5 h-2.5" />
                              <span>Append</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-[#1F2A24] font-heading leading-tight">
                          {ev.nama_event}
                        </h3>
                      </div>
                      {isRedeem ? (
                        <span className="shrink-0 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          -{ev.poin_value} Poin
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-[#D4AF37] bg-amber-50 px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                          +{ev.poin_value} Poin
                        </span>
                      )}
                    </div>

                  {/* Pemateri Highlight */}
                  {ev.pemateri && (
                    <div className="flex items-center gap-1.5 text-xs text-[#0F6B4C] bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 font-medium">
                      <UserIcon className="w-3.5 h-3.5 shrink-0 text-[#0F6B4C]" />
                      <span>Pemateri: <strong className="text-[#094A34]">{ev.pemateri}</strong></span>
                    </div>
                  )}

                  <div className="text-[11px] text-[#6B7568] space-y-0.5">
                    <p>Tanggal: <strong>{ev.tanggal}</strong> {ev.waktu ? `• ${ev.waktu}` : ''}</p>
                    {ev.lokasi && <p>Lokasi: {ev.lokasi}</p>}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleStatus(ev.event_id)}
                      className="flex items-center gap-1 text-xs text-[#6B7568] hover:text-[#1F2A24] transition cursor-pointer"
                    >
                      {ev.status === 'active' ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-[#0F6B4C]" />
                          <span className="text-[11px]">Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="text-[11px]">Aktifkan</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedQR(ev)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E8F3EE] text-[#0F6B4C] text-xs font-semibold hover:bg-[#0F6B4C] hover:text-white transition active:scale-95 shadow-2xs cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Lihat / Cetak QR</span>
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENILAIAN ACARA (FEEDBACK & EVALUASI JAMAAH) */}
      {activeTab === 'penilaian' && (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          {(() => {
            const totalRev = reviews.length;
            const avgMateri = totalRev > 0 ? (reviews.reduce((acc, r) => acc + (r.skor_materi || 0), 0) / totalRev).toFixed(1) : '-';
            const avgLokasi = totalRev > 0 ? (reviews.reduce((acc, r) => acc + (r.skor_kenyamanan || 0), 0) / totalRev).toFixed(1) : '-';
            const avgSound = totalRev > 0 ? (reviews.reduce((acc, r) => acc + (r.skor_sound || 0), 0) / totalRev).toFixed(1) : '-';
            const avgPanitia = totalRev > 0 ? (reviews.reduce((acc, r) => acc + (r.skor_panitia || 0), 0) / totalRev).toFixed(1) : '-';

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#0F6B4C] mb-1">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    <span className="text-[11px] font-semibold text-[#6B7568]">Materi & Ustadz</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1F2A24] font-heading">{avgMateri} <span className="text-xs font-normal text-[#6B7568]">/ 5.0</span></div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#0F6B4C] mb-1">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    <span className="text-[11px] font-semibold text-[#6B7568]">Kenyamanan Lokasi</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1F2A24] font-heading">{avgLokasi} <span className="text-xs font-normal text-[#6B7568]">/ 5.0</span></div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#0F6B4C] mb-1">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    <span className="text-[11px] font-semibold text-[#6B7568]">Kejelasan Sound</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1F2A24] font-heading">{avgSound} <span className="text-xs font-normal text-[#6B7568]">/ 5.0</span></div>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-[#0F6B4C] mb-1">
                    <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                    <span className="text-[11px] font-semibold text-[#6B7568]">Pelayanan Panitia</span>
                  </div>
                  <div className="text-xl font-extrabold text-[#1F2A24] font-heading">{avgPanitia} <span className="text-xs font-normal text-[#6B7568]">/ 5.0</span></div>
                </div>
              </div>
            );
          })()}

          {/* Filter and Title */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-[#1F2A24] font-heading flex items-center gap-1.5">
                <MessageSquareHeart className="w-4 h-4 text-[#0F6B4C]" />
                Evaluasi & Penilaian Jamaah ({reviews.length})
              </h3>
              <p className="text-[10px] text-[#6B7568] mt-0.5">
                Data feedback jujur dari jamaah setelah scan QR kajian
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="filter-event-select" className="text-[11px] font-medium text-[#6B7568]">
                Filter Kajian:
              </label>
              <select
                id="filter-event-select"
                value={reviewFilterEvent}
                onChange={(e) => setReviewFilterEvent(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 bg-[#FAFAF7] text-[#1F2A24] focus:outline-none focus:ring-2 focus:ring-[#0F6B4C]"
              >
                <option value="all">Semua Kajian ({reviews.length})</option>
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.nama_event}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {(() => {
            const filtered = reviewFilterEvent === 'all'
              ? reviews
              : reviews.filter((r) => r.event_id === reviewFilterEvent);

            if (filtered.length === 0) {
              return (
                <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F3EE] text-[#0F6B4C] flex items-center justify-center mx-auto">
                    <MessageSquareHeart className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-[#1F2A24] font-heading">
                    Belum Ada Penilaian Acara
                  </h4>
                  <p className="text-[11px] text-[#6B7568] max-w-xs mx-auto">
                    Penilaian akan otomatis muncul di sini setiap kali jamaah melakukan scan QR dan mengirimkan formulir evaluasi kajian.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filtered.map((rev) => (
                  <div
                    key={rev.review_id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-3"
                  >
                    {/* Review Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1F2A24]">
                            {rev.nama_jamaah || 'Jamaah'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F3EE] text-[#0F6B4C] font-semibold">
                            {rev.nama_event}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#6B7568] mt-0.5 block">
                          {rev.submitted_at ? new Date(rev.submitted_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja'}
                        </span>
                      </div>

                      {/* 4 Score Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          Materi: {rev.skor_materi}/5
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                          Lokasi: {rev.skor_kenyamanan}/5
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                          Sound: {rev.skor_sound}/5
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-900 font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-purple-500 text-purple-500" />
                          Panitia: {rev.skor_panitia}/5
                        </span>
                      </div>
                    </div>

                    {/* Qualitative Feedback */}
                    <div className="space-y-2 text-xs">
                      {rev.kesan_terbaik && (
                        <div className="p-2.5 rounded-xl bg-[#FAFAF7] border border-gray-100">
                          <span className="font-bold text-[11px] text-[#0F6B4C] block mb-0.5">
                            Kesan Terbaik:
                          </span>
                          <p className="text-[#1F2A24] text-[11px] leading-relaxed italic">
                            "{rev.kesan_terbaik}"
                          </p>
                        </div>
                      )}

                      {rev.hal_kurang && (
                        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
                          <span className="font-bold text-[11px] text-amber-800 block mb-0.5">
                            Hal yang Perlu Diperbaiki:
                          </span>
                          <p className="text-[#1F2A24] text-[11px] leading-relaxed">
                            {rev.hal_kurang}
                          </p>
                        </div>
                      )}

                      {rev.usulan_kegiatan && (
                        <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-start gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[11px] text-sky-900 block mb-0.5">
                              Usulan Tema / Narasumber / Kegiatan:
                            </span>
                            <p className="text-[#1F2A24] text-[11px] leading-relaxed">
                              {rev.usulan_kegiatan}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: GOOGLE SHEETS & APPS SCRIPT SETUP */}
      {activeTab === 'sheets' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#0F6B4C]">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="text-sm font-bold text-[#1F2A24] font-heading">
                Integrasi Google Apps Script
              </h3>
            </div>
            <p className="text-xs text-[#6B7568] leading-relaxed">
              Database tersinkronisasi otomatis dengan 4 sheet di Google Sheets (<code>users</code>, <code>master_event</code>, <code>scan_log</code>, dan <code>penilaian_acara</code>) yang dihubungkan melalui Web App Google Apps Script.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                URL Google Apps Script Web App (akhiran /exec)
              </label>
              <input
                type="url"
                value={gasUrlInput}
                onChange={(e) => setGasUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0F6B4C] bg-[#FAFAF7]"
              />
              <span className="text-[10px] text-[#6B7568] mt-1 block">
                {gasUrlInput
                  ? 'Mode Terhubung: Permintaan API akan diarahkan ke Google Sheets Anda.'
                  : 'Mode Standby / Offline: Saat ini data disimpan di penyimpanan lokal browser.'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !gasUrlInput}
                className="flex-1 py-2 px-3 rounded-xl border border-[#0F6B4C] text-[#0F6B4C] text-xs font-semibold hover:bg-[#E8F3EE] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {testingConnection ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                <span>Tes Koneksi</span>
              </button>

              <button
                type="button"
                onClick={handleSaveGasUrl}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold hover:bg-[#094A34] transition"
              >
                Simpan URL
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#0F6B4C]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Quick Script Copy Box */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#0F6B4C]" />
                <h4 className="text-xs font-bold text-[#1F2A24] font-heading">
                  Source Code Code.gs (Siap Pakai)
                </h4>
              </div>
              <button
                onClick={copyCodeGs}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#0F6B4C] bg-[#E8F3EE] px-2.5 py-1 rounded-lg hover:bg-[#0F6B4C] hover:text-white transition"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Tersalin!' : 'Salin Code.gs'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#6B7568] leading-relaxed">
              Salin kode ini ke editor Apps Script Google Spreadsheet Anda, lalu deploy sebagai Web App dengan opsi:
            </p>

            <div className="bg-[#FAFAF7] p-3 rounded-xl border border-gray-100 text-[11px] text-[#1F2A24] space-y-1">
              <p>• <strong>Execute as:</strong> "Me" (email Anda)</p>
              <p>• <strong>Who has access:</strong> "Anyone" (Siapa saja)</p>
              <p>• Script otomatis membuat / mengelola 4 sheet:
                <br />&nbsp;&nbsp;1. <code>users</code>: [user_id, nama, no_hp, <strong>email</strong>, <strong>tanggal_lahir</strong>, <strong>jenis_kelamin</strong>, <strong>status_jamaah</strong>, <strong>pin</strong>, total_poin, <strong>role</strong>, created_at]
                <br />&nbsp;&nbsp;2. <code>master_event</code>: [event_id, nama_event, tanggal, qr_token, poin_value, status, <strong>pemateri</strong>, <strong>waktu</strong>, <strong>lokasi</strong>, <strong>event_type</strong>, created_at]
                <br />&nbsp;&nbsp;3. <code>scan_log</code>: [log_id, user_id, event_id, poin_didapat, scanned_at]
                <br />&nbsp;&nbsp;4. <code>penilaian_acara</code>: [review_id, user_id, event_id, nama_jamaah, nama_event, skor_materi, skor_kenyamanan, skor_sound, skor_panitia, kesan_terbaik, hal_kurang, usulan_kegiatan, submitted_at]
              </p>
              <p className="text-[10px] text-emerald-700 font-medium pt-1">
                ✓ Seluruh field terdefinisi dan tersentralisasi dalam file tunggal: <code>src/types/databaseSchema.ts</code>.
              </p>
            </div>
          </div>

          {/* Interactive Table Schema Reference */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#0F6B4C]">
                <TableIcon className="w-5 h-5" />
                <div>
                  <h4 className="text-xs font-bold text-[#1F2A24] font-heading">
                    Katalog Struktur & Field Tabel
                  </h4>
                  <p className="text-[10px] text-[#6B7568]">
                    Definisi lengkap seluruh sheet dan kolom database (Tersimpan di <code>src/types/databaseSchema.ts</code>)
                  </p>
                </div>
              </div>

              {/* Copy Headers Button */}
              {(() => {
                const currentSchema = ALL_DATABASE_SCHEMAS.find(s => s.tableName === selectedSchemaTable) || ALL_DATABASE_SCHEMAS[0];
                const handleCopyHeaders = () => {
                  const headerText = currentSchema.headers.join('\t'); // tab separated for direct excel/sheets paste
                  navigator.clipboard.writeText(headerText);
                  setCopiedSchemaHeaders(currentSchema.tableName);
                  setTimeout(() => setCopiedSchemaHeaders(null), 2500);
                };

                return (
                  <button
                    type="button"
                    onClick={handleCopyHeaders}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F6B4C] bg-[#E8F3EE] px-3 py-1.5 rounded-xl hover:bg-[#0F6B4C] hover:text-white transition shadow-2xs"
                    title="Salin baris header untuk ditempel langsung di Google Sheets"
                  >
                    {copiedSchemaHeaders === currentSchema.tableName ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Header Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Header Kolom</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>

            {/* Table Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {ALL_DATABASE_SCHEMAS.map((schema) => (
                <button
                  key={schema.tableName}
                  type="button"
                  onClick={() => setSelectedSchemaTable(schema.tableName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedSchemaTable === schema.tableName
                      ? 'bg-[#0F6B4C] text-white shadow-2xs'
                      : 'bg-gray-100 text-[#6B7568] hover:text-[#1F2A24]'
                  }`}
                >
                  <span>{schema.sheetName}</span>
                  <span className="ml-1.5 text-[10px] opacity-75">({schema.columns.length} field)</span>
                </button>
              ))}
            </div>

            {/* Selected Table Details */}
            {(() => {
              const currentSchema = ALL_DATABASE_SCHEMAS.find(s => s.tableName === selectedSchemaTable) || ALL_DATABASE_SCHEMAS[0];
              return (
                <div className="space-y-3">
                  <div className="bg-[#FAFAF7] p-3 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-[#1F2A24]">{currentSchema.displayName}</p>
                      <p className="text-[11px] text-[#6B7568] mt-0.5">{currentSchema.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                        Primary Key: <code>{currentSchema.primaryKey}</code>
                      </span>
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                        {currentSchema.columns.length} Kolom
                      </span>
                    </div>
                  </div>

                  {/* Columns Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[#6B7568] font-semibold text-[11px]">
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Kolom / Header</th>
                          <th className="py-2.5 px-3">Tipe Data</th>
                          <th className="py-2.5 px-3">Wajib</th>
                          <th className="py-2.5 px-3">Keterangan</th>
                          <th className="py-2.5 px-3">Contoh Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white text-[#1F2A24]">
                        {currentSchema.columns.map((col, cIdx) => (
                          <tr key={col.field} className="hover:bg-[#FAFAF7] transition">
                            <td className="py-2 px-3 text-[11px] text-[#6B7568]">{cIdx + 1}</td>
                            <td className="py-2 px-3 font-mono text-[11px] font-bold text-[#0F6B4C]">
                              {col.header}
                              {col.field === currentSchema.primaryKey && (
                                <span className="ml-1.5 text-[9px] font-sans font-extrabold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">
                                  PK
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono font-medium uppercase">
                                {col.type}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {col.required ? (
                                <span className="text-rose-600 font-bold text-[10px]">Ya</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Opsional</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-[11px] text-[#6B7568] max-w-xs">
                              {col.description}
                              {col.options && (
                                <div className="mt-0.5 text-[10px] text-gray-500 font-mono">
                                  Opsi: [{col.options.join(', ')}]
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 font-mono text-[10px] text-gray-600 max-w-[180px] truncate" title={String(col.example)}>
                              {String(col.example)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: REKAP JAMAAH & LOG ABSENSI */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          {/* Leaderboard Top Poin */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-[#1F2A24] font-heading flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              Peringkat & Daftar Jamaah ({leaderboard.length})
            </h3>

            <div className="space-y-1.5">
              {leaderboard.map((itemUser, idx) => (
                <div
                  key={itemUser.user_id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAFAF7] border border-gray-100 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        idx === 0
                          ? 'bg-[#D4AF37] text-white'
                          : idx === 1
                          ? 'bg-gray-300 text-gray-800'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-[#1F2A24] truncate">{itemUser.nama}</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 ${
                            itemUser.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                              : 'bg-emerald-50 text-[#0F6B4C] border border-emerald-200/70'
                          }`}
                        >
                          {itemUser.role || 'user'}
                        </span>
                        {itemUser.status_jamaah && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                            {itemUser.status_jamaah}
                          </span>
                        )}
                        {itemUser.jenis_kelamin && (
                          <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md shrink-0 ${
                            itemUser.jenis_kelamin === 'wanita' 
                              ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {itemUser.jenis_kelamin === 'wanita' ? 'Wanita' : 'Pria'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#6B7568] flex-wrap mt-0.5">
                        <span>{itemUser.no_hp}</span>
                        {itemUser.email && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{itemUser.email}</span>
                          </>
                        )}
                        {itemUser.tanggal_lahir && (
                          <>
                            <span>•</span>
                            <span title="Tanggal Lahir">Lahir: {itemUser.tanggal_lahir}</span>
                          </>
                        )}
                        {itemUser.pin && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[9px] bg-gray-100 px-1 py-0.2 rounded text-gray-600" title="PIN Plain Text">
                              PIN: {itemUser.pin}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <button
                          onClick={() => handleToggleRole(itemUser)}
                          className="text-[#0F6B4C] hover:underline font-medium"
                          title="Ubah role pengguna ini"
                        >
                          {itemUser.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-[#0F6B4C] text-xs shrink-0 pl-2">
                    {itemUser.total_poin} Poin
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* All Scan Logs */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-bold text-[#1F2A24] font-heading">
              Log Seluruh Absensi ({allLogs.length})
            </h3>

            {allLogs.length === 0 ? (
              <p className="text-xs text-[#6B7568] text-center py-4">Belum ada data scan log</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {allLogs.map((log) => {
                  const isRedeem = (log.poin_didapat && log.poin_didapat < 0) || log.event_type === 'redeem';
                  return (
                    <div
                      key={log.log_id}
                      className="p-2.5 rounded-xl bg-[#FAFAF7] border border-gray-100 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1F2A24]">{log.nama_user || 'Jamaah'}</span>
                        {isRedeem ? (
                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            -{Math.abs(log.poin_didapat)} Poin (Redeem)
                          </span>
                        ) : (
                          <span className="font-bold text-[#0F6B4C]">+{log.poin_didapat} Poin</span>
                        )}
                      </div>
                      <p className="text-[#6B7568] truncate">{log.nama_event}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(log.scanned_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CETAK / LIHAT QR CODE */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 text-center relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Frame Area */}
            <div id="printable-qr-card" className="bg-[#FAFAF7] p-4 rounded-2xl border border-gray-200 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#0F6B4C] text-[#FAF3D1] flex items-center justify-center mx-auto mb-1">
                <svg width="18" height="18" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 8 C70 8 88 35 90 62 L90 88 L10 88 L10 62 C12 35 30 8 50 8 Z" />
                </svg>
              </div>
              <h2 className="text-xs font-bold text-[#0F6B4C] uppercase tracking-wider font-heading">
                Masjid Al Hijrah PTPP
              </h2>
              <p className="text-sm font-extrabold text-[#1F2A24] mt-0.5 leading-snug font-heading">
                {selectedQR.nama_event}
              </p>
              <p className="text-[11px] text-[#6B7568] mt-0.5">
                {selectedQR.tanggal} {selectedQR.waktu ? `• ${selectedQR.waktu}` : ''}
              </p>

              {selectedQR.pemateri && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6B4C] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Pemateri: {selectedQR.pemateri}</span>
                </div>
              )}

              {/* QR Render */}
              <div className="my-4 p-3 bg-white rounded-xl shadow-xs inline-block border border-gray-200">
                <QRCodeSVG
                  value={selectedQR.qr_token}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {selectedQR.event_type === 'redeem' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                  <Gift className="w-3 h-3 text-rose-600" />
                  <span>Kupon Redeem: Potong {selectedQR.poin_value} Poin Jamaah</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#856404] font-bold text-xs">
                  <Sparkles className="w-3 h-3 text-[#B78A1D]" />
                  <span>Dapatkan {selectedQR.poin_value} Poin Kajian (Append)</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(selectedQR.qr_token)}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-[#1F2A24] hover:bg-gray-50 flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Token QR Tersalin!' : `Salin Token: ${selectedQR.qr_token}`}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F6B4C] text-white text-xs font-semibold hover:bg-[#094A34] flex items-center justify-center gap-1.5 transition active:scale-98 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar QR Code</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KAJIAN BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-[#1F2A24] font-heading mb-1">
              Buat Kajian Baru
            </h2>
            <p className="text-xs text-[#6B7568] mb-4">
              Sistem akan otomatis menghasilkan token QR unik & acak.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              {/* Pilihan Mode: Append vs Redeem */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1.5">
                  Tipe / Mode QR Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEventType('append')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      newEventType === 'append'
                        ? 'border-[#0F6B4C] bg-emerald-50/70 text-[#0F6B4C] ring-1 ring-[#0F6B4C]'
                        : 'border-gray-200 bg-white text-[#6B7568] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <PlusCircle className="w-3.5 h-3.5 text-[#0F6B4C]" />
                        Append
                      </span>
                      {newEventType === 'append' && <Check className="w-3.5 h-3.5 text-[#0F6B4C]" />}
                    </div>
                    <span className="text-[10px] text-[#6B7568] leading-tight">
                      Tambah poin jamaah (Absensi kajian rutin)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEventType('redeem')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      newEventType === 'redeem'
                        ? 'border-rose-600 bg-rose-50/70 text-rose-700 ring-1 ring-rose-600'
                        : 'border-gray-200 bg-white text-[#6B7568] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-rose-600" />
                        Redeem
                      </span>
                      {newEventType === 'redeem' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                    </div>
                    <span className="text-[10px] text-[#6B7568] leading-tight">
                      Potong poin jamaah (Penukaran voucher / sembako)
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  {newEventType === 'redeem' ? 'Nama Item / Voucher Redeem' : 'Nama Kajian / Event'}
                </label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder={
                    newEventType === 'redeem'
                      ? "Contoh: Kupon Paket Sembako Beras 5kg"
                      : "Contoh: Kajian Hadits Arba'in"
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0F6B4C] focus:outline-none bg-[#FAFAF7]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={newTanggal}
                    onChange={(e) => setNewTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0F6B4C] focus:outline-none bg-[#FAFAF7]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                    {newEventType === 'redeem' ? 'Poin Dipotong' : 'Nilai Poin (+)'}
                  </label>
                  <input
                    type="number"
                    value={newPoin}
                    onChange={(e) => setNewPoin(Number(e.target.value))}
                    min={5}
                    max={1000}
                    step={5}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0F6B4C] focus:outline-none bg-[#FAFAF7]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  {newEventType === 'redeem' ? 'Penanggung Jawab / Posko' : 'Pemateri / Ustadz'}
                </label>
                <input
                  type="text"
                  value={newPemateri}
                  onChange={(e) => setNewPemateri(e.target.value)}
                  placeholder={
                    newEventType === 'redeem'
                      ? 'Contoh: Panitia Ziswaf / Posko DKM'
                      : 'Contoh: Ustadz Ahmad, Lc.'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0F6B4C] focus:outline-none bg-[#FAFAF7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2A24] mb-1">
                  {newEventType === 'redeem' ? 'Waktu Pengambilan / Validitas' : 'Waktu Pelaksanaan'}
                </label>
                <input
                  type="text"
                  value={newWaktu}
                  onChange={(e) => setNewWaktu(e.target.value)}
                  placeholder={
                    newEventType === 'redeem'
                      ? 'Contoh: 08:00 - 16:30 WIB'
                      : "Contoh: Ba'da Isya (19:30 - 21:00 WIB)"
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#0F6B4C] focus:outline-none bg-[#FAFAF7]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl text-white text-xs font-semibold transition active:scale-98 mt-2 cursor-pointer ${
                  newEventType === 'redeem'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0F6B4C] hover:bg-[#094A34]'
                }`}
              >
                {submitting
                  ? 'Menyimpan...'
                  : newEventType === 'redeem'
                  ? 'Simpan Item & Tampilkan QR Redeem'
                  : 'Simpan & Tampilkan QR Code'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
