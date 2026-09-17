import { MasterEvent, ScanLog, User, EventReview, VideoItem } from '../types';

const USERS_KEY = 'alhijrah_users_db';
const EVENTS_KEY = 'alhijrah_events_db';
const LOGS_KEY = 'alhijrah_logs_db';
const REVIEWS_KEY = 'alhijrah_reviews_db';
const VIDEOS_KEY = 'alhijrah_videos_db';
const COMPANIES_KEY = 'alhijrah_companies_db';
const UNITS_KEY = 'alhijrah_units_db';
const GAS_URL_KEY = 'alhijrah_gas_webapp_url';

/**
 * Mengambil URL dari Environment Variable Vercel ("GAS_URL" atau "VITE_GAS_URL")
 */
export function getEnvGasUrl(): string {
  try {
    const url = (import.meta.env.GAS_URL || import.meta.env.VITE_GAS_URL || '') as string;
    return url.trim();
  } catch {
    return '';
  }
}

/**
 * Mengambil URL kustom yang tersimpan dari form input jika diisi
 */
export function getCustomGasUrl(): string {
  try {
    return (localStorage.getItem(GAS_URL_KEY) || '').trim();
  } catch {
    return '';
  }
}

/**
 * Mengambil URL Google Apps Script yang aktif:
 * - Jika input diisi (tersimpan dari form) -> get dari form ini
 * - Jika input dikosongkan -> get dari env Vercel "GAS_URL"
 */
export function getGasUrl(): string {
  try {
    const customUrl = getCustomGasUrl();
    if (customUrl) {
      return customUrl;
    }
    return getEnvGasUrl();
  } catch {
    return '';
  }
}

/**
 * Menyimpan URL dari form.
 * Jika input dikosongkan (empty string), hapus custom URL agar sistem otomatis get dari env Vercel.
 */
export function setGasUrl(url: string): void {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      localStorage.removeItem(GAS_URL_KEY);
    } else {
      localStorage.setItem(GAS_URL_KEY, cleanUrl);
    }
  } catch (e) {
    console.error('Failed to save GAS URL', e);
  }
}

/**
 * Mengosongkan input dan mereset ke env Vercel
 */
export function resetGasUrl(): string {
  try {
    localStorage.removeItem(GAS_URL_KEY);
    return '';
  } catch {
    return '';
  }
}

// Initial Seed Data
const DEFAULT_EVENTS: MasterEvent[] = [
  {
    event_id: 'evt_subuh_01',
    nama_event: 'Kajian Subuh: Tafsir Juz Amma & Dzikir Pagi',
    tanggal: new Date().toISOString().split('T')[0],
    qr_token: 'HIJRAH-SUBUH-TAFSIR',
    poin_value: 50,
    status: 'active',
    event_type: 'append',
    kuota: 50,
    pemateri: 'Ustadz Dr. H. Abdurrahman, M.A.',
    lokasi: 'Ruang Utama Masjid Al Hijrah PTPP',
    waktu: '05:00 - 06:15 WIB',
    deskripsi: 'Kajian rutin ba\'da shalat subuh berjamaah, membahas tafsir ayat pilihan dan pembacaan al-ma\'tsurat.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    event_id: 'evt_dzuhur_02',
    nama_event: 'Kajian Dzuhur: Fiqih Muamalah Karyawan',
    tanggal: new Date().toISOString().split('T')[0],
    qr_token: 'HIJRAH-DZUHUR-MUAMALAH',
    poin_value: 30,
    status: 'active',
    event_type: 'append',
    pemateri: 'Ustadz Salman Farisi, Lc.',
    lokasi: 'Lantai 2 Masjid Al Hijrah PTPP',
    waktu: '12:30 - 13:00 WIB',
    deskripsi: 'Membahas prinsip etika kerja islami, kejujuran amanah proyek, dan fiqih muamalah kontemporer.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    event_id: 'evt_redeem_01',
    nama_event: 'Kupon Sembako / Merchandise Berkah (Redeem)',
    tanggal: new Date().toISOString().split('T')[0],
    qr_token: 'HIJRAH-REDEEM-SEMBAKO',
    poin_value: 50,
    status: 'active',
    event_type: 'redeem',
    pemateri: 'Panitia Ziswaf Masjid Al Hijrah',
    lokasi: 'Posko Penukaran / Sekretariat DKM',
    waktu: '08:00 - 17:00 WIB',
    deskripsi: 'Penukaran 50 poin jamaah untuk kupon sembako berkah atau souvenir masjid.',
    created_at: new Date().toISOString(),
  },
  {
    event_id: 'evt_maghrib_03',
    nama_event: 'Kajian Malam Jumat: Yasinan & Tazkiyatun Nafs',
    tanggal: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    qr_token: 'HIJRAH-MALAM-JUMAT',
    poin_value: 40,
    status: 'active',
    event_type: 'append',
    pemateri: 'K.H. Syamsudin Ahmad',
    lokasi: 'Ruang Utama Masjid Al Hijrah PTPP',
    waktu: '18:30 - 19:30 WIB',
    deskripsi: 'Pembersihan jiwa, pembacaan wirid dan dzikir bersama seluruh jamaah Masjid Al Hijrah.',
    created_at: new Date().toISOString(),
  },
  {
    event_id: 'evt_old_04',
    nama_event: 'Peringatan Isra Mi\'raj 1447 H (Event Selesai)',
    tanggal: '2026-02-15',
    qr_token: 'HIJRAH-ISRA-MIRAJ-EXPIRED',
    poin_value: 100,
    status: 'inactive',
    pemateri: 'Habib Ali Al-Habsyi',
    lokasi: 'Plaza Masjid Al Hijrah PTPP',
    waktu: '19:30 - 22:00 WIB',
    deskripsi: 'Event akbar tabligh isra mi\'raj masjid. Status QR sudah tidak aktif.',
    created_at: '2026-02-10T10:00:00.000Z',
  },
];

export const DEFAULT_USERS: User[] = [
  {
    user_id: 'usr_demo_1',
    nama: 'Ahmad Fauzi',
    no_hp: '6281234567890',
    email: 'ahmad.fauzi@ptpp.co.id',
    tanggal_lahir: '1992-06-14',
    jenis_kelamin: 'pria',
    status_pegawai: 'Organik',
    company_id: 'COMP_1',
    unit_id: 'UNIT_1',
    pin: '1234',
    total_poin: 50,
    role: 'user',
    created_at: '2026-03-01T08:00:00.000Z',
  },
  {
    user_id: 'usr_admin_1',
    nama: 'Admin Takmir Masjid',
    no_hp: '6289999999999',
    email: 'admin.masjid@ptpp.co.id',
    jenis_kelamin: 'pria',
    status_pegawai: 'Organik',
    company_id: 'COMP_1',
    unit_id: 'UNIT_1',
    pin: '9999',
    total_poin: 120,
    role: 'admin',
    created_at: '2026-01-01T08:00:00.000Z',
  },
];

export const DEFAULT_COMPANIES = [
  { company_id: '1', company_name: 'PP Holding' },
  { company_id: '2', company_name: 'AP' },
  { company_id: '3', company_name: 'SBU' },
  { company_id: '4', company_name: 'AFILISASI' },
];

export const DEFAULT_UNITS = [
  // 1: PP Holding
  { unit_id: '1', company_id: '1', unit_name: 'UKP' },
  { unit_id: '2', company_id: '1', unit_name: 'Infra 1' },
  { unit_id: '3', company_id: '1', unit_name: 'Infra 2' },
  { unit_id: '4', company_id: '1', unit_name: 'Gedung' },
  { unit_id: '5', company_id: '1', unit_name: 'EPC' },
  // 2: AP
  { unit_id: '6', company_id: '2', unit_name: 'PP Properti' },
  { unit_id: '7', company_id: '2', unit_name: 'PP Presisi' },
  { unit_id: '8', company_id: '2', unit_name: 'PP Urban' },
  { unit_id: '9', company_id: '2', unit_name: 'PP Energi' },
  { unit_id: '10', company_id: '2', unit_name: 'PP Colomadu' },
  { unit_id: '11', company_id: '2', unit_name: 'PP Centurion' },
  { unit_id: '12', company_id: '2', unit_name: 'PP Semarang Demak' },
  { unit_id: '13', company_id: '2', unit_name: 'PP Banjaratma' },
  // 3: SBU
  { unit_id: '14', company_id: '3', unit_name: 'Menara Danareksa' },
  // 4: AFILISASI
  { unit_id: '15', company_id: '4', unit_name: 'PT Indonesia Ferry Properti' },
  { unit_id: '16', company_id: '4', unit_name: 'PT Celebes Railway Indonesia' },
  { unit_id: '17', company_id: '4', unit_name: 'PT Solo Citra Metro Plasma Power' },
  { unit_id: '18', company_id: '4', unit_name: 'PT Wika Serang Panimbang' },
  { unit_id: '19', company_id: '4', unit_name: 'PT Jasamarga Manado Bitung' },
  { unit_id: '20', company_id: '4', unit_name: 'PT Karya Logistik Nusantara' },
  { unit_id: '21', company_id: '4', unit_name: 'PT Prima Multi Terminal' },
  { unit_id: '22', company_id: '4', unit_name: 'PT Jasamarga Balikpapan Samarinda' },
  { unit_id: '23', company_id: '4', unit_name: 'PT Citra Wasspphutowa' },
  { unit_id: '24', company_id: '4', unit_name: 'PT Jasamarga Akses Patimban' },
  { unit_id: '25', company_id: '4', unit_name: 'PT Jasamarga Jogja Bawen' },
  { unit_id: '26', company_id: '4', unit_name: 'PT Jasamarga Rest Area Batang' },
  { unit_id: '27', company_id: '4', unit_name: 'PT Kawasan Industri Terpadu Batang' },
  { unit_id: '28', company_id: '4', unit_name: 'PT PP Tirta Riau' },
];

const DEFAULT_LOGS: ScanLog[] = [
  {
    log_id: 'log_seed_1',
    user_id: 'usr_demo_1',
    event_id: 'evt_subuh_01',
    poin_didapat: 50,
    scanned_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    nama_event: 'Kajian Subuh: Tafsir Juz Amma & Dzikir Pagi',
    tanggal: new Date().toISOString().split('T')[0],
  },
];

export function getLocalCompanies(): any[] {
  try {
    const raw = localStorage.getItem(COMPANIES_KEY);
    if (!raw) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
      return [...DEFAULT_COMPANIES];
    }
    const parsed = JSON.parse(raw);
    // Invalidate old dummy cache if exists
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((c: any) => String(c.company_id).startsWith('COMP_'))) {
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(DEFAULT_COMPANIES));
      return [...DEFAULT_COMPANIES];
    }
    return parsed;
  } catch {
    return [...DEFAULT_COMPANIES];
  }
}

export function getLocalUnits(): any[] {
  try {
    const raw = localStorage.getItem(UNITS_KEY);
    if (!raw) {
      localStorage.setItem(UNITS_KEY, JSON.stringify(DEFAULT_UNITS));
      return [...DEFAULT_UNITS];
    }
    const parsed = JSON.parse(raw);
    // Invalidate old dummy cache if exists
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((u: any) => String(u.unit_id).startsWith('UNIT_'))) {
      localStorage.setItem(UNITS_KEY, JSON.stringify(DEFAULT_UNITS));
      return [...DEFAULT_UNITS];
    }
    return parsed;
  } catch {
    return [...DEFAULT_UNITS];
  }
}

export function getLocalUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return [...DEFAULT_USERS];
    }
    const parsed: User[] = JSON.parse(raw);
    let hasChanged = false;

    // Ensure demo accounts always exist with correct PIN and role
    for (const defUser of DEFAULT_USERS) {
      const existingIdx = parsed.findIndex(
        (u) => u.user_id === defUser.user_id || u.no_hp === defUser.no_hp
      );
      if (existingIdx === -1) {
        parsed.push(defUser);
        hasChanged = true;
      } else {
        // Ensure PIN and role are intact on demo accounts
        if (parsed[existingIdx].pin !== defUser.pin || parsed[existingIdx].role !== defUser.role) {
          parsed[existingIdx] = {
            ...parsed[existingIdx],
            pin: defUser.pin,
            role: defUser.role,
          };
          hasChanged = true;
        }
      }
    }

    // Auto-migrate legacy user entries that lack role
    parsed.forEach((u) => {
      if (!u.role) {
        hasChanged = true;
        const isAdmin =
          u.user_id === 'usr_admin_1' ||
          u.no_hp === '6289999999999' ||
          (u.nama && u.nama.toLowerCase().includes('admin'));
        u.role = isAdmin ? ('admin' as const) : ('user' as const);
      }
    });

    if (hasChanged) {
      localStorage.setItem(USERS_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
}

export function saveLocalUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }
}

export function getLocalEvents(): MasterEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (!raw) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_EVENTS;
  }
}

export function saveLocalEvents(events: MasterEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (e) {
    console.error(e);
  }
}

export function getLocalLogs(): ScanLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    if (!raw) {
      localStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_LOGS;
  }
}

export function saveLocalLogs(logs: ScanLog[]): void {
  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error(e);
  }
}

const DEFAULT_REVIEWS: EventReview[] = [
  {
    review_id: 'rev_sample_01',
    user_id: 'usr_demo_1',
    event_id: 'evt_subuh_01',
    nama_jamaah: 'Ahmad Fauzi',
    nama_event: 'Kajian Subuh: Tafsir Juz Amma & Dzikir Pagi',
    skor_materi: 5,
    skor_kenyamanan: 5,
    skor_sound: 4,
    skor_panitia: 5,
    kesan_terbaik: 'Penyampaian Ustadz sangat sejuk dan dalil-dalilnya mudah dipahami.',
    hal_kurang: 'Pengaturan parkir motor subuh agak padat saat jamaah keluar bersamaan.',
    usulan_kegiatan: 'Kajian fiqih thaharah dan bedah buku Sirah Nabawiyah di akhir pekan.',
    submitted_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

export function getLocalReviews(): EventReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) {
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
      return DEFAULT_REVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_REVIEWS;
  }
}

export function saveLocalReviews(reviews: EventReview[]): void {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error(e);
  }
}

// Initial Seed Videos
const DEFAULT_VIDEOS: VideoItem[] = [
  {
    video_id: 'vid_01_rezeki',
    title: 'Kajian Tematik: Meraih Keberkahan Rezeki dalam Bekerja & Berkarir',
    description: 'Pembahasan mendalam mengenai niat ikhlas mencari nafkah, menjauhi syubhat dan riba, serta tips menjaga etika profesional, kejujuran, dan amanah di tempat kerja.',
    youtube_url: 'https://www.youtube.com/watch?v=k1lF5W3j92c',
    youtube_id: 'k1lF5W3j92c',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'active',
  },
  {
    video_id: 'vid_02_tafsir',
    title: 'Tafsir Surah Al-Fatihah: Induk Al-Qur\'an & Sumber Ketenangan Batin',
    description: 'Menyelami keindahan dan rahasia setiap ayat dalam Surah Al-Fatihah agar shalat kita bukan sekadar rutinitas, melainkan dialog khusyuk dengan Allah Subhanahu Wa Ta\'ala.',
    youtube_url: 'https://www.youtube.com/watch?v=V1bFr2SWP1I',
    youtube_id: 'V1bFr2SWP1I',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
  },
  {
    video_id: 'vid_03_adab',
    title: 'Adab Berjamaah & Memakmurkan Masjid di Lingkungan BUMN',
    description: 'Panduan tata krama shaf shalat berjamaah, adab iktikaf di sela jam istirahat kantor, serta urgensi menjaga kebersihan rumah Allah bersama keluarga besar Masjid Al Hijrah.',
    youtube_url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
    youtube_id: 'LXb3EKWsInQ',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'active',
  },
];

export function getLocalVideos(): VideoItem[] {
  try {
    const raw = localStorage.getItem(VIDEOS_KEY);
    if (!raw) {
      localStorage.setItem(VIDEOS_KEY, JSON.stringify(DEFAULT_VIDEOS));
      return DEFAULT_VIDEOS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_VIDEOS;
  }
}

export function saveLocalVideos(videos: VideoItem[]): void {
  try {
    localStorage.setItem(VIDEOS_KEY, JSON.stringify(videos));
  } catch (e) {
    console.error(e);
  }
}

export function resetToDefaultData(): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
  localStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
  localStorage.setItem(VIDEOS_KEY, JSON.stringify(DEFAULT_VIDEOS));
}
