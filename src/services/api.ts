import { ApiResponse, EventReview, EventReviewInput, JenisKelamin, MasterEvent, ScanLog, ScanResult, StatusJamaah, User } from '../types';
import {
  DEFAULT_USERS,
  getGasUrl,
  getLocalEvents,
  getLocalLogs,
  getLocalReviews,
  getLocalUsers,
  saveLocalEvents,
  saveLocalLogs,
  saveLocalReviews,
  saveLocalUsers,
} from './mockStorage';

// Format Phone Helper: Ensure 62xxxxxxxxxx
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Generate simple client UUID
function generateUUID(): string {
  return 'id_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
}

/**
 * Fetch helper for Google Apps Script Web App.
 * Apps Script redirects on POST/GET and requires text/plain body to avoid CORS preflight issues.
 */
async function callGasApi<T>(action: string, payload: Record<string, any> = {}): Promise<ApiResponse<T>> {
  const gasUrl = getGasUrl();
  if (!gasUrl) {
    throw new Error('NO_GAS_URL');
  }

  try {
    const url = new URL(gasUrl);
    url.searchParams.set('action', action);

    const bodyData = { action, ...payload };

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      throw new Error(`Koneksi server gagal (Status: ${res.status})`);
    }

    const json = await res.json();
    if (json.success === false) {
      return {
        success: false,
        error: json.error || json.message || 'Terjadi kesalahan pada sistem backend Google Sheets.',
        data: json.data,
      };
    }

    return {
      success: true,
      data: (json.data !== undefined ? json.data : json) as T,
      message: json.message,
    };
  } catch (err: any) {
    console.warn('GAS API call error:', err);
    throw err;
  }
}

// API INTERFACE IMPLEMENTATION
export const api = {
  // Test connection to Google Apps Script Web App
  async testConnection(urlToTest?: string): Promise<{ success: boolean; message: string }> {
    const targetUrl = urlToTest || getGasUrl();
    if (!targetUrl) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }
    try {
      const u = new URL(targetUrl);
      u.searchParams.set('action', 'ping');
      const res = await fetch(u.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'ping' }),
      });
      const data = await res.json();
      if (data && data.success) {
        return { success: true, message: data.message || 'Koneksi ke Google Apps Script berhasil!' };
      }
      return { success: false, message: data.error || 'Server merespon dengan status error.' };
    } catch (err: any) {
      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan akses "Anyone" (Siapa saja).',
      };
    }
  },

  // 1. REGISTER
  async register(
    nama: string,
    no_hp: string,
    pin: string,
    role: 'user' | 'admin' = 'user',
    details?: {
      email?: string;
      tanggal_lahir?: string;
      jenis_kelamin?: JenisKelamin;
      status_jamaah?: StatusJamaah;
    }
  ): Promise<ApiResponse<User>> {
    const formattedPhone = formatPhoneNumber(no_hp);
    const cleanPin = pin.trim();
    const email = details?.email?.trim() || '';
    const tanggal_lahir = details?.tanggal_lahir?.trim() || '';
    const jenis_kelamin = details?.jenis_kelamin || 'pria';
    const status_jamaah = details?.status_jamaah || 'Umum';

    // Try Google Apps Script if URL is configured
    if (getGasUrl()) {
      try {
        const gasResult = await callGasApi<User>('register', {
          nama: nama.trim(),
          no_hp: formattedPhone,
          pin: cleanPin, // PIN plain text tanpa enkripsi sesuai instruksi
          email,
          tanggal_lahir,
          jenis_kelamin,
          status_jamaah,
          role,
        });
        return gasResult;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          return { success: false, error: e.message || 'Gagal menghubungi server Google Sheets.' };
        }
      }
    }

    // Local / Offline Fallback implementation
    await new Promise((r) => setTimeout(r, 450)); // simulate smooth network
    const users = getLocalUsers();

    const existing = users.find((u) => u.no_hp === formattedPhone);
    if (existing) {
      return {
        success: false,
        error: 'Nomor HP sudah terdaftar. Silakan login menggunakan nomor ini.',
      };
    }

    const newUser: User = {
      user_id: 'usr_' + Date.now(),
      nama: nama.trim(),
      no_hp: formattedPhone,
      email,
      tanggal_lahir,
      jenis_kelamin,
      status_jamaah,
      pin: cleanPin, // PIN disimpan tanpa enkripsi
      total_poin: 0,
      role: role,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    saveLocalUsers(users);

    return {
      success: true,
      data: newUser,
      message: 'Registrasi berhasil! Selamat datang di Masjid Al Hijrah PTPP.',
    };
  },

  // 2. LOGIN
  async login(no_hp: string, pin: string): Promise<ApiResponse<User>> {
    const formattedPhone = formatPhoneNumber(no_hp);
    const pinClean = pin.trim();

    // Check if credentials match built-in demo accounts directly
    const demoUser = DEFAULT_USERS.find(
      (d) => d.no_hp === formattedPhone && d.pin === pinClean
    );

    // Guaranteed access for demo accounts
    if (demoUser) {
      // Try Google Apps Script if URL is configured, but never block demo access on failure
      if (getGasUrl()) {
        try {
          const gasResult = await callGasApi<User>('login', {
            no_hp: formattedPhone,
            pin: pinClean,
          });
          if (gasResult.success && gasResult.data) {
            return gasResult;
          }
        } catch {
          // Seamlessly fallback to local demo user
        }
      }

      // Fetch from local users (which includes updated points or logs)
      const users = getLocalUsers();
      const existingUser = users.find((u) => u.no_hp === formattedPhone);
      return {
        success: true,
        data: existingUser || demoUser,
        message: 'Login demo berhasil.',
      };
    }

    // Regular users: Try Google Apps Script if URL is configured
    if (getGasUrl()) {
      try {
        const gasResult = await callGasApi<User>('login', {
          no_hp: formattedPhone,
          pin: pinClean,
        });
        if (gasResult.success) {
          return gasResult;
        }
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          console.warn('Google Sheets login issue, trying local database:', e);
        }
      }
    }

    // Local / Offline Fallback implementation
    await new Promise((r) => setTimeout(r, 300));
    const users = getLocalUsers();

    const user = users.find((u) => u.no_hp === formattedPhone);
    if (!user) {
      return {
        success: false,
        error: 'Nomor HP belum terdaftar. Silakan daftar akun jamaah baru terlebih dahulu.',
      };
    }

    if (user.pin !== pinClean) {
      return {
        success: false,
        error: 'PIN yang Anda masukkan salah. Silakan coba kembali.',
      };
    }

    return {
      success: true,
      data: user,
      message: 'Login berhasil.',
    };
  },

  // 2.5. VALIDATE QR TOKEN (Pre-check sebelum isi form penilaian)
  async validateQR(userId: string, qrToken: string): Promise<ApiResponse<MasterEvent>> {
    const tokenClean = qrToken.trim();

    if (getGasUrl()) {
      try {
        const gasResult = await callGasApi<MasterEvent>('validateQR', {
          user_id: userId,
          qr_token: tokenClean,
        });
        return gasResult;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          return {
            success: false,
            error: e.message || 'Gagal memeriksa QR Code.',
          };
        }
      }
    }

    // Local / Offline fallback
    const events = getLocalEvents();
    const logs = getLocalLogs();
    const users = getLocalUsers();

    const event = events.find((e) => e.qr_token.toUpperCase() === tokenClean.toUpperCase());
    if (!event) {
      return {
        success: false,
        error: 'QR Code tidak valid atau tidak terdaftar di Masjid Al Hijrah PTPP.',
      };
    }

    if (event.status !== 'active') {
      return {
        success: false,
        error: 'Kajian/item ini sudah tidak aktif atau masa berlakunya telah berakhir.',
        data: event,
      };
    }

    const isRedeem = event.event_type === 'redeem';
    const alreadyScanned = logs.some((l) => l.user_id === userId && l.event_id === event.event_id);
    if (alreadyScanned) {
      return {
        success: false,
        error: isRedeem
          ? `Kamu sudah menukarkan kupon/item "${event.nama_event}" sebelumnya.`
          : `Kamu sudah absen di event "${event.nama_event}". Poin tidak dapat diakumulasi ganda.`,
        data: event,
      };
    }

    const targetUser = users.find((u) => u.user_id === userId);
    const currentPoin = targetUser?.total_poin || 0;
    if (isRedeem && currentPoin < event.poin_value) {
      return {
        success: false,
        error: `Poin Anda tidak mencukupi untuk penukaran ini. Poin Anda: ${currentPoin}, dibutuhkan: ${event.poin_value} poin.`,
        data: event,
      };
    }

    return {
      success: true,
      data: event,
    };
  },

  // 3. SCAN QR & SUBMIT PENILAIAN
  async scanQR(userId: string, qrToken: string, review?: EventReviewInput): Promise<ScanResult> {
    const tokenClean = qrToken.trim();

    // Try Google Apps Script if URL is configured
    if (getGasUrl()) {
      try {
        const gasResult = await callGasApi<any>('scanQR', {
          user_id: userId,
          qr_token: tokenClean,
          review,
        });

        if (!gasResult.success) {
          return {
            success: false,
            message: gasResult.error || 'Gagal memproses absensi.',
            already_scanned: (gasResult as any).already_scanned || false,
          };
        }

        const resAny = gasResult as any;
        const poinDidapat = gasResult.data?.poin_didapat ?? resAny.poin_didapat ?? 0;
        const isRedeem = gasResult.data?.event?.event_type === 'redeem' || resAny.event?.event_type === 'redeem';
        const isQuotaFull = !isRedeem && (resAny.kuota_penuh === true || (poinDidapat === 0 && gasResult.success));

        return {
          success: true,
          message: gasResult.message || (isQuotaFull
            ? 'Evaluasi tersimpan, namun kuota perolehan poin acara ini sudah penuh.'
            : 'Absensi/penukaran berhasil diproses!'),
          poin_didapat: poinDidapat,
          total_poin_terbaru: gasResult.data?.total_poin_terbaru ?? resAny.total_poin_terbaru,
          event: gasResult.data?.event ?? resAny.event,
          event_type: gasResult.data?.event?.event_type ?? resAny.event?.event_type,
          kuota_penuh: isQuotaFull,
        };
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          return {
            success: false,
            message: e.message || 'Gagal menghubungi server Google Sheets.',
          };
        }
      }
    }

    // Local / Offline Fallback implementation
    await new Promise((r) => setTimeout(r, 500));
    const events = getLocalEvents();
    const logs = getLocalLogs();
    const users = getLocalUsers();
    const reviews = getLocalReviews();

    // Find event by token
    const event = events.find((e) => e.qr_token.toUpperCase() === tokenClean.toUpperCase());
    if (!event) {
      return {
        success: false,
        message: 'QR Code tidak valid atau tidak terdaftar di Masjid Al Hijrah PTPP.',
      };
    }

    if (event.status !== 'active') {
      return {
        success: false,
        message: 'Kajian/item ini sudah tidak aktif atau masa berlakunya telah berakhir.',
        event,
      };
    }

    const isRedeem = event.event_type === 'redeem';

    // Check duplicate scan (user_id + event_id) in scan_log
    const alreadyScanned = logs.some((l) => l.user_id === userId && l.event_id === event.event_id);
    if (alreadyScanned) {
      return {
        success: false,
        already_scanned: true,
        message: isRedeem
          ? `Kamu sudah menukarkan kupon/item "${event.nama_event}" sebelumnya.`
          : `Kamu sudah absen di event "${event.nama_event}". Poin tidak dapat diakumulasi ganda.`,
        event,
      };
    }

    // Find user to check points
    const targetUser = users.find((u) => u.user_id === userId);
    const currentPoin = targetUser?.total_poin || 0;

    if (isRedeem && currentPoin < event.poin_value) {
      return {
        success: false,
        message: `Poin Anda tidak mencukupi untuk penukaran ini. Poin Anda: ${currentPoin}, dibutuhkan: ${event.poin_value} poin.`,
        event,
      };
    }

    // Save review first (formulir evaluasi acara selalu dicatat)
    if (review) {
      const newReview: EventReview = {
        review_id: 'rev_' + Date.now(),
        user_id: userId,
        event_id: event.event_id,
        nama_jamaah: targetUser?.nama || 'Jamaah',
        nama_event: event.nama_event,
        skor_materi: review.skor_materi,
        skor_kenyamanan: review.skor_kenyamanan,
        skor_sound: review.skor_sound,
        skor_panitia: review.skor_panitia,
        kesan_terbaik: review.kesan_terbaik || '',
        hal_kurang: review.hal_kurang || '',
        usulan_kegiatan: review.usulan_kegiatan || '',
        submitted_at: new Date().toISOString(),
      };
      reviews.unshift(newReview);
      saveLocalReviews(reviews);
    }

    // CEK KUOTA KAJIAN:
    // Dilakukan setelah pengisian form evaluasi acara
    let isQuotaFull = false;
    let sisaKuota: number | undefined = undefined;

    if (!isRedeem && event.kuota && event.kuota > 0) {
      // Hitung berapa jamaah yang sudah mendapatkan poin pada kajian ini
      const claimedCount = logs.filter(
        (l) => l.event_id === event.event_id && (l.poin_didapat || 0) > 0
      ).length;

      if (claimedCount >= event.kuota) {
        isQuotaFull = true;
      } else {
        sisaKuota = event.kuota - (claimedCount + 1);
      }
    }

    // Jika kuota sudah penuh, user tidak dapat poin (deltaPoin = 0)
    const deltaPoin = isRedeem ? -event.poin_value : isQuotaFull ? 0 : event.poin_value;
    const updatedTotal = Math.max(0, currentPoin + deltaPoin);

    // Record scan log
    const newLog: ScanLog = {
      log_id: 'log_' + Date.now(),
      user_id: userId,
      event_id: event.event_id,
      poin_didapat: deltaPoin,
      event_type: isRedeem ? 'redeem' : 'append',
      scanned_at: new Date().toISOString(),
      nama_event: event.nama_event,
      tanggal: event.tanggal,
    };
    logs.unshift(newLog);
    saveLocalLogs(logs);

    // Update user total_poin jika ada perubahan poin
    if (deltaPoin !== 0) {
      const updatedUsers = users.map((u) => {
        if (u.user_id === userId) {
          return { ...u, total_poin: updatedTotal };
        }
        return u;
      });
      saveLocalUsers(updatedUsers);
    }

    const message = isRedeem
      ? `Penukaran berhasil! ${event.poin_value} poin telah ditukarkan untuk "${event.nama_event}". Sisa poin Anda: ${updatedTotal} poin.`
      : isQuotaFull
      ? `Evaluasi acara berhasil tersimpan! Namun, mohon maaf kuota perolehan poin untuk kajian "${event.nama_event}" telah penuh (${event.kuota} jamaah), sehingga Anda tidak memperoleh tambahan poin. Jazakallahu khairan atas partisipasi & ulasan Anda.`
      : `Alhamdulillah! Penilaian acara tersimpan dan Anda mendapatkan +${event.poin_value} poin!${sisaKuota !== undefined ? ` (Sisa kuota: ${sisaKuota} jamaah)` : ''}`;

    return {
      success: true,
      message,
      poin_didapat: deltaPoin,
      total_poin_terbaru: updatedTotal,
      event,
      event_type: isRedeem ? 'redeem' : 'append',
      kuota_penuh: isQuotaFull,
      kuota_sisa: sisaKuota,
    };
  },

  // 4. GET PROFILE
  async getProfile(userId: string): Promise<ApiResponse<User>> {
    if (getGasUrl()) {
      try {
        const res = await callGasApi<User>('getProfile', { user_id: userId });
        return res;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          console.warn('GAS profile error:', e);
        }
      }
    }

    const users = getLocalUsers();
    const user = users.find((u) => u.user_id === userId);
    if (!user) {
      return { success: false, error: 'User tidak ditemukan' };
    }
    return { success: true, data: user };
  },

  // 5. GET HISTORY
  async getHistory(userId: string): Promise<ApiResponse<ScanLog[]>> {
    if (getGasUrl()) {
      try {
        const res = await callGasApi<ScanLog[]>('getHistory', { user_id: userId });
        return res;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          console.warn('GAS history error:', e);
        }
      }
    }

    const logs = getLocalLogs().filter((l) => l.user_id === userId);
    const events = getLocalEvents();
    const eventMap = new Map<string, MasterEvent>();
    events.forEach((ev) => eventMap.set(ev.event_id, ev));

    const enrichedLogs = logs.map((l) => {
      const ev = eventMap.get(l.event_id);
      return {
        ...l,
        nama_event: ev?.nama_event || l.nama_event || 'Kajian Masjid Al Hijrah',
        tanggal: ev?.tanggal || l.tanggal || '',
      };
    });

    enrichedLogs.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());

    return { success: true, data: enrichedLogs };
  },

  // 6. GET EVENTS
  async getEvents(): Promise<ApiResponse<MasterEvent[]>> {
    if (getGasUrl()) {
      try {
        const res = await callGasApi<MasterEvent[]>('getEvents');
        return res;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          console.warn('GAS events error:', e);
        }
      }
    }

    const events = getLocalEvents();
    return { success: true, data: events };
  },

  // 7. ADD EVENT (Admin)
  async addEvent(eventData: {
    nama_event: string;
    tanggal: string;
    poin_value: number;
    event_type?: 'append' | 'redeem';
    pemateri?: string;
    lokasi?: string;
    waktu?: string;
    deskripsi?: string;
    kuota?: number;
  }): Promise<ApiResponse<MasterEvent>> {
    const randomSuffix =
      new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 7).toUpperCase();
    const qr_token = 'HIJRAH-' + randomSuffix;
    const event_type = eventData.event_type || 'append';
    const kuota = eventData.kuota && Number(eventData.kuota) > 0 ? Number(eventData.kuota) : undefined;

    if (getGasUrl()) {
      try {
        const res = await callGasApi<MasterEvent>('addEvent', {
          ...eventData,
          event_type,
          kuota: kuota || 0,
          pemateri: eventData.pemateri || '',
          waktu: eventData.waktu || '',
          lokasi: eventData.lokasi || 'Masjid Al Hijrah PTPP',
          qr_token,
          status: 'active',
        });
        if (res.success && res.data) {
          // Ensure fields are populated in response
          const savedEvent: MasterEvent = {
            ...res.data,
            event_type: res.data.event_type || event_type,
            kuota: res.data.kuota || kuota,
            pemateri: res.data.pemateri || eventData.pemateri || '',
            waktu: res.data.waktu || eventData.waktu || '',
            lokasi: res.data.lokasi || eventData.lokasi || '',
          };
          const localEvents = getLocalEvents();
          const existingIdx = localEvents.findIndex((e) => e.event_id === savedEvent.event_id);
          if (existingIdx >= 0) {
            localEvents[existingIdx] = savedEvent;
          } else {
            localEvents.unshift(savedEvent);
          }
          saveLocalEvents(localEvents);
          return { ...res, data: savedEvent };
        }
        return res;
      } catch (e: any) {
        if (e.message !== 'NO_GAS_URL') {
          return { success: false, error: e.message || 'Gagal menambah event di Google Sheets' };
        }
      }
    }

    const events = getLocalEvents();
    const newEvent: MasterEvent = {
      event_id: 'evt_' + Date.now(),
      nama_event: eventData.nama_event,
      tanggal: eventData.tanggal,
      qr_token,
      poin_value: Number(eventData.poin_value) || 25,
      status: 'active',
      event_type,
      kuota,
      pemateri: eventData.pemateri || '',
      lokasi: eventData.lokasi || 'Masjid Al Hijrah PTPP',
      waktu: eventData.waktu || 'Ba\'da Maghrib',
      deskripsi: eventData.deskripsi || '',
      created_at: new Date().toISOString(),
    };

    events.unshift(newEvent);
    saveLocalEvents(events);

    return {
      success: true,
      data: newEvent,
      message: 'Event kajian baru berhasil ditambahkan dan QR code siap dicetak!',
    };
  },

  // 8. TOGGLE EVENT STATUS (Admin)
  async toggleEventStatus(eventId: string): Promise<ApiResponse<MasterEvent>> {
    const events = getLocalEvents();
    const target = events.find((e) => e.event_id === eventId);
    if (!target) {
      return { success: false, error: 'Event tidak ditemukan' };
    }

    target.status = target.status === 'active' ? 'inactive' : 'active';
    saveLocalEvents(events);

    return { success: true, data: target, message: `Status event diubah menjadi ${target.status}` };
  },

  // 9. GET ALL LOGS (Admin rekap)
  async getAllLogs(): Promise<ApiResponse<ScanLog[]>> {
    const logs = getLocalLogs();
    const events = getLocalEvents();
    const users = getLocalUsers();

    const eventMap = new Map(events.map((e) => [e.event_id, e]));
    const userMap = new Map(users.map((u) => [u.user_id, u]));

    const enriched = logs.map((l) => ({
      ...l,
      nama_event: eventMap.get(l.event_id)?.nama_event || l.nama_event || 'Kajian',
      nama_user: userMap.get(l.user_id)?.nama || 'Jamaah',
      no_hp: userMap.get(l.user_id)?.no_hp || '',
    }));

    return { success: true, data: enriched };
  },

  // 10. GET LEADERBOARD (Admin / Komunitas)
  async getLeaderboard(): Promise<ApiResponse<User[]>> {
    const users = getLocalUsers();
    const sorted = [...users].sort((a, b) => (b.total_poin || 0) - (a.total_poin || 0));
    return { success: true, data: sorted };
  },

  // 11. UPDATE USER ROLE (Admin can toggle user <-> admin)
  async updateUserRole(userId: string, newRole: 'user' | 'admin'): Promise<ApiResponse<User>> {
    const users = getLocalUsers();
    const targetIndex = users.findIndex((u) => u.user_id === userId);
    if (targetIndex === -1) {
      return { success: false, error: 'User tidak ditemukan.' };
    }

    users[targetIndex].role = newRole;
    saveLocalUsers(users);

    return {
      success: true,
      data: users[targetIndex],
      message: `Role berhasil diperbarui menjadi "${newRole}".`,
    };
  },

  // 12. GET ALL REVIEWS (Admin - Penilaian Acara)
  async getAllReviews(): Promise<ApiResponse<EventReview[]>> {
    if (getGasUrl()) {
      try {
        const res = await callGasApi<EventReview[]>('getReviews');
        if (res.success && res.data) {
          return res;
        }
      } catch (e) {
        // Fallback to local
      }
    }
    const reviews = getLocalReviews();
    return { success: true, data: reviews };
  },
};
