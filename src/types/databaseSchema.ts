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

export type StatusPegawai = 'Organik' | 'Non Organik';

export type UserRole = 'user' | 'admin';

export type EventType = 'append' | 'redeem';

export type EventStatus = 'active' | 'inactive';

// ----------------------------------------------------------------------------
// 2. INTERFACE MODEL DATA (TYPESCRIPT)
// ----------------------------------------------------------------------------

export interface Company {
  company_id: string;
  company_name: string;
}

export interface Unit {
  unit_id: string;
  company_id: string;
  unit_name: string;
}

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
  status_jamaah?: StatusJamaah; // 'Pegawai/PTPP' | 'Keluarga Pegawai' | 'Mitra/Vendor' | 'Umum' (Hidden in UI)
  status_pegawai?: StatusPegawai; // 'Organik' | 'Non Organik'
  company_id?: string;      // Relasi ke tabel Company
  unit_id?: string;         // Relasi ke tabel Unit
  pin?: string;             // 6 digit PIN untuk keamanan login cepat
  total_poin: number;       // Saldo total poin jamaah saat ini (default: 0)
  role: UserRole;           // 'user' (jamaah biasa) | 'admin' (pengurus DKM)
  created_at: string;       // Timestamp pendaftaran (ISO 8601)
  nrp?: string;             // Nomor Registrasi Pokok / Karyawan (maks 16 karakter, unik)
}

/**
 * Tabel: `master_reimburst_program`
 * Menyimpan program reimburst multi-jenis yang dibuat oleh Admin
 */
export interface ReimburstProgram {
  program_id: string;             // Primary Key unik (contoh: 'prog_1712000001')
  jenis_reimburst: string;        // Kategori/jenis reimburst (misal: "Pendidikan Anak", "Kesehatan", "Pernikahan")
  nama_program: string;           // Judul program (misal: "Reimburst SPP & Sekolah - Semester Genap 2026")
  tanggal_mulai: string;          // Awal periode berlaku (YYYY-MM-DD)
  tanggal_selesai: string;        // Akhir periode berlaku (YYYY-MM-DD)
  maks_persen_reimburst: number;  // % maksimal saldo poin yang dapat direimburst (1 - 100)
  status: 'active' | 'inactive';  // Status keaktifan program
  created_at: string;             // Timestamp pembuatan program (ISO 8601)
}

/**
 * Status Alur Pengajuan Klaim Reimburst
 */
export type ReimburstClaimStatus = 'submitted' | 'verified' | 'rejected' | 'transferred';

/**
 * Tabel: `reimburst_claim`
 * Menyimpan transaksi klaim poin jamaah beserta lampiran dan bukti transfer Google Drive
 */
export interface ReimburstClaim {
  claim_id: string;               // Primary Key unik (contoh: 'clm_1712000001')
  user_id: string;                // FK ke users.user_id
  program_id: string;             // FK ke master_reimburst_program.program_id
  tanggal_klaim: string;          // Tanggal diajukan oleh jamaah (YYYY-MM-DD)
  jumlah_hak: number;             // Maksimum nominal hak klaim (Rp) = maks_persen * total_poin * 1
  besar_klaim: number;            // Nominal rupiah yang diklaim jamaah (harus <= jumlah_hak)
  nama_bank: string;              // Nama bank penerima (BSI, Mandiri, BCA, dll)
  no_rekening: string;            // Nomor rekening tujuan transfer
  komentar?: string;              // Keterangan / catatan tambahan dari jamaah
  lampiran_file_id?: string;      // ID file bukti kuitansi di Google Drive
  lampiran_url?: string;          // URL akses file bukti di Google Drive
  bukti_transfer_file_id?: string;// ID file bukti transfer dari admin di Google Drive
  bukti_transfer_url?: string;    // URL akses bukti transfer di Google Drive
  status: ReimburstClaimStatus;   // 'submitted' | 'verified' | 'rejected' | 'transferred'
  catatan_admin?: string;         // Catatan revisi atau alasan penolakan dari admin
  created_at: string;             // Waktu pengajuan klaim (ISO 8601)
  updated_at?: string;            // Waktu pembaruan status terakhir (ISO 8601)

  // Field denormalisasi untuk kemudahan tampilan UI jamaah & admin
  nama_user?: string;
  nrp?: string;
  no_hp?: string;
  nama_program?: string;
  jenis_reimburst?: string;
}

/**
 * Tabel: `master_bank`
 * Menyimpan daftar referensi bank nasional & syariah untuk pencairan transfer klaim
 */
export interface MasterBank {
  bank_id: string;                // Kode atau ID bank (contoh: 'bsi', 'mandiri', 'bca')
  nama_bank: string;              // Nama resmi bank (contoh: 'BSI (Bank Syariah Indonesia)')
  status: 'active' | 'inactive';  // Status keaktifan opsi
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
  hal_perlu_diperbaiki?: string; // Alias untuk hal_kurang
  usulan_tema?: string;          // Alias untuk usulan_kegiatan
  submitted_at: string;     // Timestamp submit review (ISO 8601)
}

/**
 * Tabel: `videos`
 * Menyimpan data video embed YouTube kajian Masjid Al Hijrah
 */
export interface VideoItem {
  video_id: string;        // Primary Key unik video (contoh: 'vid_1712000001')
  title: string;           // Judul kajian video
  description: string;     // Deskripsi / ringkasan materi video
  youtube_url: string;     // Link URL asli YouTube
  youtube_id: string;      // ID video 11 karakter YouTube
  created_at: string;      // Timestamp penambahan (ISO 8601)
  status?: 'active' | 'inactive'; // Status tayang video
}

export interface VideoInput {
  title: string;
  description: string;
  youtube_url: string;
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
  hal_perlu_diperbaiki?: string;
  usulan_tema?: string;
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
  already_scanned?: boolean;
  kuota_penuh?: boolean;
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
  'status_pegawai',
  'company_id',
  'unit_id',
  'pin',
  'total_poin',
  'role',
  'created_at',
  'nrp',
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

export const VIDEOS_TABLE_HEADERS = [
  'video_id',
  'title',
  'description',
  'youtube_url',
  'created_at',
  'status',
] as const;

export const MASTER_REIMBURST_PROGRAM_TABLE_HEADERS = [
  'program_id',
  'jenis_reimburst',
  'nama_program',
  'tanggal_mulai',
  'tanggal_selesai',
  'maks_persen_reimburst',
  'status',
  'created_at',
] as const;

export const REIMBURST_CLAIM_TABLE_HEADERS = [
  'claim_id',
  'user_id',
  'program_id',
  'tanggal_klaim',
  'jumlah_hak',
  'besar_klaim',
  'nama_bank',
  'no_rekening',
  'komentar',
  'lampiran_file_id',
  'lampiran_url',
  'bukti_transfer_file_id',
  'bukti_transfer_url',
  'status',
  'catatan_admin',
  'created_at',
  'updated_at',
] as const;

export const MASTER_BANK_TABLE_HEADERS = [
  'bank_id',
  'nama_bank',
  'status',
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
    { field: 'status_pegawai', header: 'status_pegawai', type: 'enum', required: false, description: 'Status kepegawaian (Organik/Non Organik)', example: 'Organik', options: ['Organik', 'Non Organik'] },
    { field: 'company_id', header: 'company_id', type: 'string', required: false, description: 'ID Perusahaan', example: 'COMP_01' },
    { field: 'unit_id', header: 'unit_id', type: 'string', required: false, description: 'ID Unit', example: 'UNIT_01' },
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
 * Metadata Lengkap Tabel 5: `company`
 */
export const COMPANY_SCHEMA: TableStructureMeta = {
  tableName: 'company',
  sheetName: 'company',
  displayName: 'Tabel Master Perusahaan (company)',
  description: 'Menyimpan daftar perusahaan holding, anak perusahaan (AP), SBU, dan afiliasi.',
  primaryKey: 'company_id',
  headers: ['company_id', 'company_name'] as any,
  columns: [
    { field: 'company_id', header: 'company_id', type: 'string', required: true, description: 'ID unik perusahaan (Primary Key)', example: '1' },
    { field: 'company_name', header: 'company_name', type: 'string', required: true, description: 'Nama Perusahaan', example: 'PP Holding' },
  ],
};

/**
 * Metadata Lengkap Tabel 6: `unit`
 */
export const UNIT_SCHEMA: TableStructureMeta = {
  tableName: 'unit',
  sheetName: 'unit',
  displayName: 'Tabel Master Unit/Divisi (unit)',
  description: 'Menyimpan daftar unit kerja / divisi yang berelasi dengan tabel company via company_id.',
  primaryKey: 'unit_id',
  headers: ['unit_id', 'company_id', 'unit_name'] as any,
  columns: [
    { field: 'unit_id', header: 'unit_id', type: 'string', required: true, description: 'ID unik unit/divisi (Primary Key)', example: '1' },
    { field: 'company_id', header: 'company_id', type: 'string', required: true, description: 'Relasi ke company (Foreign Key merujuk ke company.company_id)', example: '1' },
    { field: 'unit_name', header: 'unit_name', type: 'string', required: true, description: 'Nama Unit / Divisi', example: 'UKP' },
  ],
};

/**
 * Metadata Lengkap Tabel 7: `videos`
 */
export const VIDEOS_SCHEMA: TableStructureMeta = {
  tableName: 'videos',
  sheetName: 'videos',
  displayName: 'Tabel Video Kajian (videos)',
  description: 'Menyimpan daftar video embed YouTube kajian Masjid Al Hijrah yang ditambahkan dari panel admin.',
  primaryKey: 'video_id',
  headers: VIDEOS_TABLE_HEADERS as any,
  columns: [
    { field: 'video_id', header: 'video_id', type: 'string', required: true, description: 'ID unik video (Primary Key)', example: 'vid_1712000001' },
    { field: 'title', header: 'title', type: 'string', required: true, description: 'Judul video / kajian', example: 'Kajian Fiqih Muamalah: Berkah Rezeki' },
    { field: 'description', header: 'description', type: 'text', required: false, description: 'Deskripsi / ringkasan video', example: 'Penjelasan fiqih praktis dalam berbisnis dan bekerja.' },
    { field: 'youtube_url', header: 'youtube_url', type: 'string', required: true, description: 'Link video YouTube asli', example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { field: 'created_at', header: 'created_at', type: 'datetime', required: true, description: 'Waktu penambahan video (ISO 8601)', example: '2026-09-16T10:00:00.000Z' },
    { field: 'status', header: 'status', type: 'enum', required: false, description: 'Status tayang video (active / inactive)', example: 'active', options: ['active', 'inactive'] },
  ],
};

/**
 * Metadata Lengkap Tabel 8: `master_reimburst_program`
 */
export const MASTER_REIMBURST_PROGRAM_SCHEMA: TableStructureMeta = {
  tableName: 'master_reimburst_program',
  sheetName: 'master_reimburst_program',
  displayName: 'Tabel Master Program Reimburse (master_reimburst_program)',
  description: 'Menyimpan program klaim reimburse poin multi-jenis (Pendidikan Anak, Kesehatan, Pernikahan, dll).',
  primaryKey: 'program_id',
  headers: MASTER_REIMBURST_PROGRAM_TABLE_HEADERS as any,
  columns: [
    { field: 'program_id', header: 'program_id', type: 'string', required: true, description: 'ID unik program reimburse (Primary Key)', example: 'prog_1712000001' },
    { field: 'jenis_reimburst', header: 'jenis_reimburst', type: 'string', required: true, description: 'Kategori jenis reimburse (bebas diinput admin)', example: 'Pendidikan Anak' },
    { field: 'nama_program', header: 'nama_program', type: 'string', required: true, description: 'Nama lengkap program reimburse', example: 'Reimburse SPP & Buku Sekolah Anak Periode 2026' },
    { field: 'tanggal_mulai', header: 'tanggal_mulai', type: 'date', required: true, description: 'Tanggal mulai berlaku (YYYY-MM-DD)', example: '2026-01-01' },
    { field: 'tanggal_selesai', header: 'tanggal_selesai', type: 'date', required: true, description: 'Tanggal berakhir berlaku (YYYY-MM-DD)', example: '2026-12-31' },
    { field: 'maks_persen_reimburst', header: 'maks_persen_reimburst', type: 'number', required: true, description: 'Maksimum % dari total saldo poin jamaah yang bisa dicairkan', example: '50' },
    { field: 'status', header: 'status', type: 'enum', required: true, description: 'Status program (active / inactive)', example: 'active', options: ['active', 'inactive'] },
    { field: 'created_at', header: 'created_at', type: 'datetime', required: true, description: 'Waktu pembuatan program (ISO 8601)', example: '2026-01-01T08:00:00.000Z' },
  ],
};

/**
 * Metadata Lengkap Tabel 9: `reimburst_claim`
 */
export const REIMBURST_CLAIM_SCHEMA: TableStructureMeta = {
  tableName: 'reimburst_claim',
  sheetName: 'reimburst_claim',
  displayName: 'Tabel Transaksi Klaim Reimburse (reimburst_claim)',
  description: 'Menyimpan seluruh pengajuan klaim poin jamaah, kuitansi Drive, verifikasi, dan bukti transfer.',
  primaryKey: 'claim_id',
  headers: REIMBURST_CLAIM_TABLE_HEADERS as any,
  columns: [
    { field: 'claim_id', header: 'claim_id', type: 'string', required: true, description: 'ID unik transaksi klaim (Primary Key)', example: 'clm_1712000001' },
    { field: 'user_id', header: 'user_id', type: 'string', required: true, description: 'Relasi ke users (Foreign Key)', example: 'usr_demo_1' },
    { field: 'program_id', header: 'program_id', type: 'string', required: true, description: 'Relasi ke master_reimburst_program (Foreign Key)', example: 'prog_1712000001' },
    { field: 'tanggal_klaim', header: 'tanggal_klaim', type: 'date', required: true, description: 'Tanggal submit klaim oleh jamaah (YYYY-MM-DD)', example: '2026-09-28' },
    { field: 'jumlah_hak', header: 'jumlah_hak', type: 'number', required: true, description: 'Kapasitas hak klaim (Rp) = maks_persen * total_poin', example: '50000' },
    { field: 'besar_klaim', header: 'besar_klaim', type: 'number', required: true, description: 'Nominal rupiah yang diklaim (harus <= jumlah_hak)', example: '50000' },
    { field: 'nama_bank', header: 'nama_bank', type: 'string', required: true, description: 'Nama bank tujuan transfer', example: 'BSI (Bank Syariah Indonesia)' },
    { field: 'no_rekening', header: 'no_rekening', type: 'string', required: true, description: 'Nomor rekening jamaah', example: '7123456789' },
    { field: 'komentar', header: 'komentar', type: 'text', required: false, description: 'Catatan tambahan jamaah', example: 'Kuitansi pembelian buku semester genap' },
    { field: 'lampiran_file_id', header: 'lampiran_file_id', type: 'string', required: false, description: 'ID file kuitansi Google Drive', example: '1A2b3C4d5E...' },
    { field: 'lampiran_url', header: 'lampiran_url', type: 'string', required: false, description: 'Link view file kuitansi Google Drive', example: 'https://drive.google.com/uc?id=...' },
    { field: 'bukti_transfer_file_id', header: 'bukti_transfer_file_id', type: 'string', required: false, description: 'ID file bukti transfer admin di Google Drive', example: '1X2y3Z...' },
    { field: 'bukti_transfer_url', header: 'bukti_transfer_url', type: 'string', required: false, description: 'Link view bukti transfer admin di Google Drive', example: 'https://drive.google.com/uc?id=...' },
    { field: 'status', header: 'status', type: 'enum', required: true, description: 'Status alur klaim', example: 'submitted', options: ['submitted', 'verified', 'rejected', 'transferred'] },
    { field: 'catatan_admin', header: 'catatan_admin', type: 'text', required: false, description: 'Catatan admin jika ditolak/dikoreksi', example: 'Dokumen kuitansi terpotong, silakan upload ulang.' },
    { field: 'created_at', header: 'created_at', type: 'datetime', required: true, description: 'Waktu transaksi klaim dibuat (ISO 8601)', example: '2026-09-28T10:00:00.000Z' },
    { field: 'updated_at', header: 'updated_at', type: 'datetime', required: false, description: 'Waktu perubahan status terakhir', example: '2026-09-28T11:00:00.000Z' },
  ],
};

/**
 * Metadata Lengkap Tabel 10: `master_bank`
 */
export const MASTER_BANK_SCHEMA: TableStructureMeta = {
  tableName: 'master_bank',
  sheetName: 'master_bank',
  displayName: 'Tabel Master Bank (master_bank)',
  description: 'Menyimpan daftar pilihan bank tujuan transfer klaim reimburse.',
  primaryKey: 'bank_id',
  headers: MASTER_BANK_TABLE_HEADERS as any,
  columns: [
    { field: 'bank_id', header: 'bank_id', type: 'string', required: true, description: 'Kode/ID unik bank', example: 'bsi' },
    { field: 'nama_bank', header: 'nama_bank', type: 'string', required: true, description: 'Nama Bank Resmi', example: 'BSI (Bank Syariah Indonesia)' },
    { field: 'status', header: 'status', type: 'enum', required: true, description: 'Status aktif (active / inactive)', example: 'active', options: ['active', 'inactive'] },
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
  COMPANY_SCHEMA,
  UNIT_SCHEMA,
  VIDEOS_SCHEMA,
  MASTER_REIMBURST_PROGRAM_SCHEMA,
  REIMBURST_CLAIM_SCHEMA,
  MASTER_BANK_SCHEMA,
];

export const DATABASE_SCHEMA_DICTIONARY: Record<string, TableStructureMeta> = {
  users: USERS_SCHEMA,
  master_event: MASTER_EVENT_SCHEMA,
  scan_log: SCAN_LOG_SCHEMA,
  penilaian_acara: PENILAIAN_ACARA_SCHEMA,
  company: COMPANY_SCHEMA,
  unit: UNIT_SCHEMA,
  videos: VIDEOS_SCHEMA,
  master_reimburst_program: MASTER_REIMBURST_PROGRAM_SCHEMA,
  reimburst_claim: REIMBURST_CLAIM_SCHEMA,
  master_bank: MASTER_BANK_SCHEMA,
};
