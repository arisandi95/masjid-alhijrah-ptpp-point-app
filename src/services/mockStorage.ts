import { MasterEvent, ScanLog, User, EventReview } from '../types';

const USERS_KEY = 'alhijrah_users_db';
const EVENTS_KEY = 'alhijrah_events_db';
const LOGS_KEY = 'alhijrah_logs_db';
const REVIEWS_KEY = 'alhijrah_reviews_db';
const COMPANIES_KEY = 'alhijrah_companies_db';
const UNITS_KEY = 'alhijrah_units_db';
const GAS_URL_KEY = 'alhijrah_gas_webapp_url';

export function getGasUrl(): string {
  try {
    const envUrl = import.meta.env.VITE_GAS_URL || import.meta.env.GAS_URL;
    if (envUrl) {
      return envUrl;
    }
    return localStorage.getItem(GAS_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  } catch (e) {
    console.error('Failed to save GAS URL', e);
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
  { company_id: 'COMP_1', company_name: 'PT PP (Persero) Tbk' },
  { company_id: 'COMP_2', company_name: 'PT PP Presisi Tbk' },
  { company_id: 'COMP_3', company_name: 'PT PP Properti Tbk' },
];

export const DEFAULT_UNITS = [
  { unit_id: 'UNIT_1', company_id: 'COMP_1', unit_name: 'Divisi Gedung 1' },
  { unit_id: 'UNIT_2', company_id: 'COMP_1', unit_name: 'Divisi Gedung 2' },
  { unit_id: 'UNIT_3', company_id: 'COMP_1', unit_name: 'Divisi Infrastruktur' },
  { unit_id: 'UNIT_4', company_id: 'COMP_2', unit_name: 'Divisi Alat Berat' },
  { unit_id: 'UNIT_5', company_id: 'COMP_3', unit_name: 'Divisi Residensial' },
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
    return JSON.parse(raw);
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
    return JSON.parse(raw);
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

export function resetToDefaultData(): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  localStorage.setItem(EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS));
  localStorage.setItem(LOGS_KEY, JSON.stringify(DEFAULT_LOGS));
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(DEFAULT_REVIEWS));
}
