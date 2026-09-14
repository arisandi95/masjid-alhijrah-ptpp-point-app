/**
 * ============================================================================
 * STRUKTUR & SKEMA TABEL LENGKAP - MASJID AL HIJRAH PTPP
 * ============================================================================
 * File ini adalah satu-satunya referensi tunggal (Single Source of Truth) untuk
 * seluruh struktur tabel, field/kolom, tipe data, keterangan, dan contoh data
 * yang digunakan pada aplikasi dan Google Sheets (Google Apps Script Web App).
 * 
 * Terdapat 4 Tabel / Sheet Utama:
 * 1. `users`            : Data Akun & Profil Jamaah
 * 2. `master_event`     : Data Kajian, Agenda & Item Redeem Poin
 * 3. `scan_log`         : Riwayat Transaksi Absensi & Penukaran Poin
 * 4. `penilaian_acara`  : Evaluasi, Feedback & Penilaian Acara oleh Jamaah
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. TIPE ENUM & SUB-TIPE
// ----------------------------------------------------------------------------

export type JenisKelamin = 'pria' | 'wanita';

export type StatusJamaah = 'Pegawai/PTPP' | 'Keluarga Pegawai' | 'Mitra/Vendor' | 'Umum';

export type UserRole = 'user' | 'admin';

export type EventType = 'append' | 'redeem';

export type EventStatus = 'active' | 'inactive';

// ----------------------------------------------------------------------------
// 2. INTERFACE MODEL DATA (TYPESCRIPT)
// ----------------------------------------------------------------------------

/**
 * Tabel: `users`
 * Menyimpan data profil jamaah, kredensial login, dan saldo poin terkini.
 */
export interface User {
  user_id: string;          // Primary Key unik (contoh: 'usr_1712000001')
  nama: string;             // Nama lengkap jamaah
  no_hp: string;            // Nomor WhatsApp aktif (format: 62xxxxxxxxxx)
  email?: string;           // Alamat email aktif (opsional)
  tanggal_lahir?: string;   // Tanggal lahir jamaah (format: YYYY-MM-DD, opsional)
  jenis_kelamin?: JenisKelamin; // 'pria' | 'wanita'
  status_jamaah?: StatusJamaah; // 'Pegawai/PTPP' | 'Keluarga Pegawai' | 'Mitra/Vendor' | 'Umum'
  pin?: string;             // 6 digit PIN untuk keamanan login cepat
  total_poin: number;       // Saldo total poin jamaah saat ini (default: 0)
  role: UserRole;           // 'user' (jamaah biasa) | 'admin' (pengurus DKM)
  created_at: string;       // Timestamp pendaftaran (ISO 8601)
}

/**
 * Tabel: `master_event`
 * Menyimpan master data kajian, tabligh akbar, serta item voucher / sembako (redeem).
 */
export interface MasterEvent {
  event_id: string;         // Primary Key unik (contoh: 'evt_subuh_01')
  nama_event: string;       // Judul kajian atau nama item voucher
  tanggal: string;          // Tanggal pelaksanaan kajian (YYYY-MM-DD)
  qr_token: string;         // Token teks unik yang dikodekan ke dalam QR Code
  poin_value: number;       // Nilai poin (didapat untuk append, dipotong untuk redeem)
  status: EventStatus;      // 'active' | 'inactive'
  pemateri?: string;        // Nama Ustadz / Narasumber pengisi kajian
  lokasi?: string;          // Lokasi kajian (contoh: 'Ruang Utama Masjid Al Hijrah PTPP')
  waktu?: string;           // Jam pelaksanaan (contoh: 'Ba\'da Maghrib (18:30 WIB)')
  event_type?: EventType;   // 'append' (tambah poin) | 'redeem' (tukar kupon/potong poin)
  kuota?: number;           // Batas maksimal kuota jamaah yang berhak mendapat poin (opsional / 0 = tanpa batas)
  deskripsi?: string;       // Keterangan tambahan (opsional)
  created_at: string;       // Timestamp pembuatan event (ISO 8601)
}

/**
 * Tabel: `scan_log`
 * Mencatat setiap transaksi scan QR (absensi kehadiran kajian atau penukaran voucher).
 * Digunakan juga untuk validasi anti-duplikasi scan per jamaah per event.
 */
export interface ScanLog {
  log_id: string;           // Primary Key unik log (contoh: 'log_1712000001')
  user_id: string;          // Foreign Key merujuk ke `users.user_id`
  event_id: string;         // Foreign Key merujuk ke `master_event.event_id`
  poin_didapat: number;     // Delta poin (+25 untuk absensi, -50 untuk redeem)
  scanned_at: string;       // Timestamp waktu scan berhasil (ISO 8601)
  event_type?: EventType;   // 'append' | 'redeem'
  // Field join untuk tampilan riwayat
  nama_event?: string;      // Denormalisasi nama event
  tanggal?: string;         // Tanggal event
  nama_user?: string;       // Nama jamaah yang melakukan scan
  no_hp?: string;           // Nomor HP jamaah
}

/**
 * Tabel: `penilaian_acara`
 * Menyimpan formulir evaluasi & feedback jamaah setelah scan QR kajian sebelum poin dicairkan.
 */
export interface EventReview {
  review_id: string;        // Primary Key unik review (contoh: 'rev_1712000001')
  user_id: string;          // Foreign Key merujuk ke `users.user_id`
  event_id: string;         // Foreign Key merujuk ke `master_event.event_id`
  nama_jamaah?: string;     // Nama jamaah yang memberikan ulasan
  nama_event?: string;      // Judul kajian yang dinilai
  skor_materi: number;      // Nilai 1-5: Kualitas Materi dan Penyampaian Narasumber
  skor_kenyamanan: number;  // Nilai 1-5: Kenyamanan lokasi acara (suhu & karpet/shaf)
  skor_sound: number;       // Nilai 1-5: Kejelasan Suara (Sound System)
  skor_panitia: number;     // Nilai 1-5: Kesigapan dan Pelayanan Panitia
  kesan_terbaik?: string;   // Teks paragraf: Hal paling disukai dari acara
  hal_kurang?: string;      // Teks paragraf: Hal yang dirasa kurang & perlu diperbaiki
  usulan_kegiatan?: string; // Teks paragraf: Usulan tema/narasumber/kegiatan mendatang
  submitted_at: string;     // Timestamp submit review (ISO 8601)
}

/**
 * DTO Input Pengisian Form Penilaian Acara
 */
export interface EventReviewInput {
  skor_materi: number;
  skor_kenyamanan: number;
  skor_sound: number;
  skor_panitia: number;
  kesan_terbaik?: string;
  hal_kurang?: string;
  usulan_kegiatan?: string;
}

/**
 * Response Hasil Scan QR
 */
export interface ScanResult {
  success: boolean;
  message: string;
  poin_didapat?: number;
  total_poin_terbaru?: number;
  event?: MasterEvent;
  event_type?: EventType;
  already_scanned?: boolean;
  kuota_penuh?: boolean;
  kuota_sisa?: number;
}

/**
 * Standar Wrapper Response API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ----------------------------------------------------------------------------
// 3. DEFINISI HEADER KOLOM GOOGLE SHEETS / EXCEL (URUTAN RESMI)
// ----------------------------------------------------------------------------

export const USERS_TABLE_HEADERS = [
  'user_id',
  'nama',
  'no_hp',
  'email',
  'tanggal_lahir',
  'jenis_kelamin',
  'status_jamaah',
  'pin',
  'total_poin',
  'role',
  'created_at',
] as const;

export const MASTER_EVENT_TABLE_HEADERS = [
  'event_id',
  'nama_event',
  'tanggal',
  'qr_token',
  'poin_value',
  'status',
  'pemateri',
  'waktu',
  'lokasi',
  'event_type',
  'kuota',
  'created_at',
] as const;

export const SCAN_LOG_TABLE_HEADERS = [
  'log_id',
  'user_id',
  'event_id',
  'poin_didapat',
  'scanned_at',
] as const;

export const PENILAIAN_ACARA_TABLE_HEADERS = [
  'review_id',
  'user_id',
  'event_id',
  'nama_jamaah',
  'nama_event',
  'skor_materi',
  'skor_kenyamanan',
  'skor_sound',
  'skor_panitia',
  'kesan_terbaik',
  'hal_kurang',
  'usulan_kegiatan',
  'submitted_at',
] as const;

// ----------------------------------------------------------------------------
// 4. METADATA DETAIL SETIAP KOLOM & STRUKTUR TABEL
// ----------------------------------------------------------------------------

export interface TableColumnMeta {
  field: string;
  header: string;
  type: 'string' | 'number' | 'date' | 'datetime' | 'enum' | 'text';
  required: boolean;
  description: string;
  example: string | number;
  options?: string[];
}

export interface TableStructureMeta {
  tableName: string;
  sheetName: string;
  displayName: string;
  description: string;
  primaryKey: string;
  headers: readonly string[];
  columns: TableColumnMeta[];
}

/**
 * Metadata Lengkap Tabel 1: `users`
 */
export const USERS_SCHEMA: TableStructureMeta = {
  tableName: 'users',
  sheetName: 'users',
  displayName: 'Tabel Users (Data Jamaah)',
  description: 'Menyimpan data identitas profil jamaah, autentikasi PIN, saldo total poin, dan hak akses admin/user.',
  primaryKey: 'user_id',
  headers: USERS_TABLE_HEADERS,
  columns: [
    { field: 'user_id', header: 'user_id', type: 'string', required: true, description: 'ID unik pengguna (Primary Key)', example: 'usr_ptpp_001' },
    { field: 'nama', header: 'nama', type: 'string', required: true, description: 'Nama lengkap jamaah', example: 'Ahmad Fauzi' },
    { field: 'no_hp', header: 'no_hp', type: 'string', required: true, description: 'Nomor WhatsApp jamaah (format: 62xxxxxxxxxx)', example: '6281234567890' },
    { field: 'email', header: 'email', type: 'string', required: false, description: 'Email jamaah / akun perusahaan', example: 'ahmad.fauzi@ptpp.co.id' },
    { field: 'tanggal_lahir', header: 'tanggal_lahir', type: 'date', required: false, description: 'Tanggal lahir jamaah (YYYY-MM-DD)', example: '1992-08-17' },
    { field: 'jenis_kelamin', header: 'jenis_kelamin', type: 'enum', required: false, description: 'Jenis kelamin jamaah', example: 'pria', options: ['pria', 'wanita'] },
    { field: 'status_jamaah', header: 'status_jamaah', type: 'enum', required: false, description: 'Klasifikasi jamaah di lingkungan PT PP', example: 'Pegawai/PTPP', options: ['Pegawai/PTPP', 'Keluarga Pegawai', 'Mitra/Vendor', 'Umum'] },
    { field: 'pin', header: 'pin', type: 'string', required: false, description: '6 Digit PIN keamanan untuk login', example: '123456' },
    { field: 'total_poin', header: 'total_poin', type: 'number', required: true, description: 'Total akumulasi saldo poin jamaah saat ini', example: 75 },
    { field: 'role', header: 'role', type: 'enum', required: true, description: 'Peran pengguna (user biasa atau admin pengurus DKM)', example: 'user', options: ['user', 'admin'] },
    { field: 'created_at', header: 'created_at', type: 'datetime', required: true, description: 'Waktu pendaftaran akun (ISO 8601)', example: '2026-09-01T08:00:00.000Z' },
  ],
};

/**
 * Metadata Lengkap Tabel 2: `master_event`
 */
export const MASTER_EVENT_SCHEMA: TableStructureMeta = {
  tableName: 'master_event',
  sheetName: 'master_event',
  displayName: 'Tabel Master Event (Kajian & Redeem)',
  description: 'Menyimpan daftar seluruh kajian rutin, tabligh akbar, serta item kupon/sembako yang dapat ditukarkan jamaah.',
  primaryKey: 'event_id',
  headers: MASTER_EVENT_TABLE_HEADERS,
  columns: [
    { field: 'event_id', header: 'event_id', type: 'string', required: true, description: 'ID unik event/kajian (Primary Key)', example: 'evt_subuh_01' },
    { field: 'nama_event', header: 'nama_event', type: 'string', required: true, description: 'Judul kajian atau nama item voucher', example: 'Kajian Subuh: Tafsir Juz Amma' },
    { field: 'tanggal', header: 'tanggal', type: 'date', required: true, description: 'Tanggal kegiatan dilaksanakan (YYYY-MM-DD)', example: '2026-09-15' },
    { field: 'qr_token', header: 'qr_token', type: 'string', required: true, description: 'Kode token unik yang di-generate ke QR Code', example: 'ALHIJRAH-SUBUH-2026' },
    { field: 'poin_value', header: 'poin_value', type: 'number', required: true, description: 'Jumlah poin perolehan (+) atau pemotongan (-)', example: 25 },
    { field: 'status', header: 'status', type: 'enum', required: true, description: 'Status keaktifan QR (hanya aktif yang bisa discan)', example: 'active', options: ['active', 'inactive'] },
    { field: 'pemateri', header: 'pemateri', type: 'string', required: false, description: 'Nama Ustadz / Penceramah', example: 'Ustadz Dr. H. Khalid' },
    { field: 'waktu', header: 'waktu', type: 'string', required: false, description: 'Waktu pelaksanaan acara', example: "Ba'da Subuh (05:00 WIB)" },
    { field: 'lokasi', header: 'lokasi', type: 'string', required: false, description: 'Tempat penyelenggaraan', example: 'Ruang Utama Masjid Al Hijrah PTPP' },
    { field: 'event_type', header: 'event_type', type: 'enum', required: true, description: 'Mode: append (tambah poin kajian) atau redeem (tukar kupon)', example: 'append', options: ['append', 'redeem'] },
    { field: 'kuota', header: 'kuota', type: 'number', required: false, description: 'Batas maksimal kuota jamaah yang berhak mendapat poin (kosong/0 = tanpa batas)', example: 50 },
    { field: 'created_at', header: 'created_at', type: 'datetime', required: true, description: 'Waktu pembuatan event (ISO 8601)', example: '2026-09-15T04:00:00.000Z' },
  ],
};

/**
 * Metadata Lengkap Tabel 3: `scan_log`
 */
export const SCAN_LOG_SCHEMA: TableStructureMeta = {
  tableName: 'scan_log',
  sheetName: 'scan_log',
  displayName: 'Tabel Scan Log (Riwayat Absensi & Transaksi)',
  description: 'Mencatat riwayat log absensi jamaah saat scan QR, nominal poin yang didapat/ditukar, dan mencegah absensi ganda.',
  primaryKey: 'log_id',
  headers: SCAN_LOG_TABLE_HEADERS,
  columns: [
    { field: 'log_id', header: 'log_id', type: 'string', required: true, description: 'ID unik transaksi log (Primary Key)', example: 'log_1712000001' },
    { field: 'user_id', header: 'user_id', type: 'string', required: true, description: 'ID Jamaah yang melakukan scan (FK ke users)', example: 'usr_ptpp_001' },
    { field: 'event_id', header: 'event_id', type: 'string', required: true, description: 'ID Kajian / Item yang discan (FK ke master_event)', example: 'evt_subuh_01' },
    { field: 'poin_didapat', header: 'poin_didapat', type: 'number', required: true, description: 'Nilai poin mutasi (+25 untuk absensi, -50 untuk redeem)', example: 25 },
    { field: 'scanned_at', header: 'scanned_at', type: 'datetime', required: true, description: 'Waktu tepat saat scan QR diproses (ISO 8601)', example: '2026-09-15T05:30:00.000Z' },
  ],
};

/**
 * Metadata Lengkap Tabel 4: `penilaian_acara`
 */
export const PENILAIAN_ACARA_SCHEMA: TableStructureMeta = {
  tableName: 'penilaian_acara',
  sheetName: 'penilaian_acara',
  displayName: 'Tabel Penilaian Acara (Evaluasi & Feedback Jamaah)',
  description: 'Menyimpan penilaian skala linier 1-5 dan saran kritik jujur dari jamaah sebelum poin kajian diberikan.',
  primaryKey: 'review_id',
  headers: PENILAIAN_ACARA_TABLE_HEADERS,
  columns: [
    { field: 'review_id', header: 'review_id', type: 'string', required: true, description: 'ID unik penilaian (Primary Key)', example: 'rev_1712000001' },
    { field: 'user_id', header: 'user_id', type: 'string', required: true, description: 'ID Jamaah yang mengisi penilaian (FK ke users)', example: 'usr_ptpp_001' },
    { field: 'event_id', header: 'event_id', type: 'string', required: true, description: 'ID Kajian yang dinilai (FK ke master_event)', example: 'evt_subuh_01' },
    { field: 'nama_jamaah', header: 'nama_jamaah', type: 'string', required: false, description: 'Nama jamaah pemberi feedback', example: 'Ahmad Fauzi' },
    { field: 'nama_event', header: 'nama_event', type: 'string', required: false, description: 'Nama kajian yang dievaluasi', example: 'Kajian Subuh: Tafsir Juz Amma' },
    { field: 'skor_materi', header: 'skor_materi', type: 'number', required: true, description: 'Skala 1-5: Kualitas Materi dan Penyampaian Narasumber', example: 5 },
    { field: 'skor_kenyamanan', header: 'skor_kenyamanan', type: 'number', required: true, description: 'Skala 1-5: Kenyamanan lokasi acara (suhu & karpet/shaf)', example: 5 },
    { field: 'skor_sound', header: 'skor_sound', type: 'number', required: true, description: 'Skala 1-5: Kejelasan Suara (Sound System) hingga belakang', example: 5 },
    { field: 'skor_panitia', header: 'skor_panitia', type: 'number', required: true, description: 'Skala 1-5: Kesigapan dan Pelayanan Panitia', example: 5 },
    { field: 'kesan_terbaik', header: 'kesan_terbaik', type: 'text', required: false, description: 'Teks paragraf: Kesan terbaik atau hal yang paling disukai dari acara', example: 'Penyampaian Ustadz sangat aplikatif untuk kehidupan sehari-hari.' },
    { field: 'hal_kurang', header: 'hal_kurang', type: 'text', required: false, description: 'Teks paragraf: Hal yang dirasa kurang maksimal & perlu diperbaiki', example: 'Pendingin ruangan (AC) di sayap kanan agak kurang dingin.' },
    { field: 'usulan_kegiatan', header: 'usulan_kegiatan', type: 'text', required: false, description: 'Teks paragraf: Usulan tema/narasumber/kegiatan mendatang', example: 'Kajian Fiqih Muamalah Kontemporer seputar investasi syariah.' },
    { field: 'submitted_at', header: 'submitted_at', type: 'datetime', required: true, description: 'Waktu penilaian disubmit oleh jamaah (ISO 8601)', example: '2026-09-15T05:35:00.000Z' },
  ],
};

/**
 * Daftar Seluruh Skema Tabel (Dictionary & Array)
 */
export const ALL_DATABASE_SCHEMAS: TableStructureMeta[] = [
  USERS_SCHEMA,
  MASTER_EVENT_SCHEMA,
  SCAN_LOG_SCHEMA,
  PENILAIAN_ACARA_SCHEMA,
];

export const DATABASE_SCHEMA_DICTIONARY: Record<string, TableStructureMeta> = {
  users: USERS_SCHEMA,
  master_event: MASTER_EVENT_SCHEMA,
  scan_log: SCAN_LOG_SCHEMA,
  penilaian_acara: PENILAIAN_ACARA_SCHEMA,
};
