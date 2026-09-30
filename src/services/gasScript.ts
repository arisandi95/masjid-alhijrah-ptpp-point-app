/**
 * Google Apps Script (Code.gs) template for Masjid Al Hijrah PTPP
 * This code can be copied into Google Apps Script connected to the Google Spreadsheet.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * BACKEND GOOGLE APPS SCRIPT - MASJID AL HIJRAH PTPP
 * Absensi & Poin Kajian via QR Code
 * 
 * Petunjuk Deploy:
 * 1. Buka spreadsheet Google Sheets (script otomatis menyiapkan 6 sheet: "users", "master_event", "scan_log", "penilaian_acara", "company", dan "unit")
 * 2. Menu Extensions -> Apps Script
 * 3. Hapus kode bawaan, paste seluruh kode ini
 * 4. Klik "Deploy" -> "New deployment"
 * 5. Pilih jenis "Web app"
 * 6. Execute as: "Me" (email Anda)
 * 7. Who has access: "Anyone" (Siapa saja)
 * 8. Klik "Deploy", izinkan akses permissions
 * 9. Salin URL Web App (akhiran /exec) dan masukkan ke menu Admin di aplikasi ini
 */

// Ganti dengan Spreadsheet ID Anda (atau biarkan kosong jika script terikat langsung pada spreadsheet / Container-bound)
const SPREADSHEET_ID = ""; // Kosongkan jika script dibuat dari Extensions > Apps Script pada Sheet terkait

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Inisialisasi Sheet otomatis jika belum ada kolom header
function setupSheets() {
  const ss = getSpreadsheet();
  
  // 1. Sheet users
  let sheetUsers = ss.getSheetByName("users");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("users");
    sheetUsers.appendRow(["user_id", "nama", "no_hp", "email", "tanggal_lahir", "jenis_kelamin", "status_jamaah", "pin", "total_poin", "role", "created_at"]);
  } else {
    // Auto-migrate users headers jika kolom email, tanggal_lahir, jenis_kelamin, status_jamaah, role belum ada
    const lastCol = sheetUsers.getLastColumn() || 1;
    const headers = sheetUsers.getRange(1, 1, 1, lastCol).getValues()[0];
    const headerLower = headers.map(h => (h || "").toString().toLowerCase().trim());
    
    if (!headerLower.includes("email")) {
      sheetUsers.getRange(1, sheetUsers.getLastColumn() + 1).setValue("email");
    }
    if (!headerLower.includes("tanggal_lahir")) {
      sheetUsers.getRange(1, sheetUsers.getLastColumn() + 1).setValue("tanggal_lahir");
    }
    if (!headerLower.includes("jenis_kelamin")) {
      sheetUsers.getRange(1, sheetUsers.getLastColumn() + 1).setValue("jenis_kelamin");
    }
    if (!headerLower.includes("status_jamaah")) {
      sheetUsers.getRange(1, sheetUsers.getLastColumn() + 1).setValue("status_jamaah");
    }
    if (!headerLower.includes("role")) {
      const colIndex = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, colIndex).setValue("role");
      const lastRow = sheetUsers.getLastRow();
      if (lastRow > 1) {
        for (let r = 2; r <= lastRow; r++) {
          sheetUsers.getRange(r, colIndex).setValue("user");
        }
      }
    }
    if (!headerLower.includes("nrp")) {
      sheetUsers.getRange(1, sheetUsers.getLastColumn() + 1).setValue("nrp");
    }
  }
  
  // 2. Sheet master_event
  let sheetEvent = getSheetCaseInsensitive(ss, "master_event");
  if (!sheetEvent) {
    sheetEvent = ss.insertSheet("master_event");
    sheetEvent.appendRow(["event_id", "nama_event", "tanggal", "qr_token", "poin_value", "status", "pemateri", "waktu", "lokasi", "event_type", "kuota", "created_at"]);
  } else {
    // Auto-migrate master_event headers jika kolom pemateri, waktu, lokasi, event_type, atau kuota belum ada
    let currentLastCol = sheetEvent.getLastColumn() || 1;
    const headers = sheetEvent.getRange(1, 1, 1, currentLastCol).getValues()[0];
    const headerLower = headers.map(h => (h || "").toString().toLowerCase().trim());
    
    if (!headerLower.some(h => ["pemateri", "narasumber", "ustadz"].includes(h))) {
      currentLastCol++;
      sheetEvent.getRange(1, currentLastCol).setValue("pemateri");
    }
    if (!headerLower.some(h => ["waktu", "jam"].includes(h))) {
      currentLastCol++;
      sheetEvent.getRange(1, currentLastCol).setValue("waktu");
    }
    if (!headerLower.some(h => ["lokasi", "tempat", "ruangan", "lokasi_acara", "lokasi acara", "venue"].includes(h))) {
      currentLastCol++;
      sheetEvent.getRange(1, currentLastCol).setValue("lokasi");
    }
    if (!headerLower.some(h => ["event_type", "event type", "tipe", "mode"].includes(h))) {
      currentLastCol++;
      sheetEvent.getRange(1, currentLastCol).setValue("event_type");
    }
    if (!headerLower.some(h => ["kuota", "quota", "limit"].includes(h))) {
      currentLastCol++;
      sheetEvent.getRange(1, currentLastCol).setValue("kuota");
    }
    SpreadsheetApp.flush();
  }
  
  // 3. Sheet scan_log
  let sheetLog = getSheetCaseInsensitive(ss, "scan_log");
  if (!sheetLog) {
    sheetLog = ss.insertSheet("scan_log");
    sheetLog.appendRow(["log_id", "user_id", "event_id", "poin_didapat", "scanned_at"]);
  }

  // 4. Sheet penilaian_acara (Ulasan & Rating Jamaah)
  let sheetReview = getSheetCaseInsensitive(ss, "penilaian_acara");
  if (!sheetReview) {
    sheetReview = ss.insertSheet("penilaian_acara");
    sheetReview.appendRow([
      "review_id",
      "user_id",
      "event_id",
      "nama_jamaah",
      "nama_event",
      "skor_materi",
      "skor_kenyamanan",
      "skor_sound",
      "skor_panitia",
      "kesan_terbaik",
      "hal_kurang",
      "usulan_kegiatan",
      "submitted_at"
    ]);
  } else {
    // Auto-migrate: pastikan kolom baru evaluasi kualitatif tersedia di header
    const lastCol = sheetReview.getLastColumn() || 1;
    const headers = sheetReview.getRange(1, 1, 1, lastCol).getValues()[0];
    const headerLower = headers.map(h => (h || "").toString().toLowerCase().trim());
    
    if (!headerLower.includes("kesan_terbaik") && !headerLower.includes("kesan terbaik") && !headerLower.includes("kesanterbaik")) {
      sheetReview.getRange(1, sheetReview.getLastColumn() + 1).setValue("kesan_terbaik");
    }
    if (!headerLower.includes("hal_kurang") && !headerLower.includes("hal kurang") && !headerLower.includes("halkurang") && !headerLower.includes("hal_perlu_diperbaiki") && !headerLower.includes("hal perlu diperbaiki")) {
      sheetReview.getRange(1, sheetReview.getLastColumn() + 1).setValue("hal_kurang");
    }
    if (!headerLower.includes("usulan_kegiatan") && !headerLower.includes("usulan kegiatan") && !headerLower.includes("usulankegiatan") && !headerLower.includes("usulan_tema") && !headerLower.includes("usulan tema")) {
      sheetReview.getRange(1, sheetReview.getLastColumn() + 1).setValue("usulan_kegiatan");
    }
    if (!headerLower.includes("submitted_at") && !headerLower.includes("submitted at") && !headerLower.includes("timestamp")) {
      sheetReview.getRange(1, sheetReview.getLastColumn() + 1).setValue("submitted_at");
    }
  }

  // 5. Sheet company
  let sheetCompany = getSheetCaseInsensitive(ss, "company");
  if (!sheetCompany) {
    sheetCompany = ss.insertSheet("company");
    sheetCompany.appendRow(["company_id", "company_name"]);
    sheetCompany.appendRow(["COMP_1", "PT PP (Persero) Tbk"]);
    sheetCompany.appendRow(["COMP_2", "PT PP Presisi Tbk"]);
    sheetCompany.appendRow(["COMP_3", "PT PP Properti Tbk"]);
  }

  // 6. Sheet unit
  let sheetUnit = getSheetCaseInsensitive(ss, "unit");
  if (!sheetUnit) {
    sheetUnit = ss.insertSheet("unit");
    sheetUnit.appendRow(["unit_id", "company_id", "unit_name"]);
    sheetUnit.appendRow(["UNIT_1", "COMP_1", "Divisi Gedung 1"]);
    sheetUnit.appendRow(["UNIT_2", "COMP_1", "Divisi Gedung 2"]);
    sheetUnit.appendRow(["UNIT_3", "COMP_1", "Divisi Infrastruktur"]);
    sheetUnit.appendRow(["UNIT_4", "COMP_2", "Divisi Alat Berat"]);
    sheetUnit.appendRow(["UNIT_5", "COMP_3", "Divisi Residensial"]);
  }

  // 7. Sheet videos (Kajian Video YouTube)
  let sheetVideos = getSheetCaseInsensitive(ss, "videos");
  if (!sheetVideos) {
    sheetVideos = ss.insertSheet("videos");
    sheetVideos.appendRow(["video_id", "title", "description", "youtube_url", "created_at", "status"]);
  }

  // 8. Sheet master_reimburst_program (Program Reimburst Multi-Jenis)
  let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
  if (!sheetPrograms) {
    sheetPrograms = ss.insertSheet("master_reimburst_program");
    sheetPrograms.appendRow(["program_id", "jenis_reimburst", "nama_program", "tanggal_mulai", "tanggal_selesai", "maks_persen_reimburst", "status", "created_at"]);
    // Seed default sample program
    sheetPrograms.appendRow([
      "prog_pendidikan_01",
      "Pendidikan Anak",
      "Reimburst SPP & Perlengkapan Sekolah Anak - Periode 2026",
      "2026-01-01",
      "2026-12-31",
      50,
      "active",
      new Date().toISOString()
    ]);
  }

  // 9. Sheet reimburst_claim (Pengajuan Klaim Jamaah)
  let sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
  if (!sheetClaims) {
    sheetClaims = ss.insertSheet("reimburst_claim");
    sheetClaims.appendRow([
      "claim_id",
      "user_id",
      "program_id",
      "tanggal_klaim",
      "jumlah_hak",
      "besar_klaim",
      "nama_bank",
      "no_rekening",
      "komentar",
      "lampiran_file_id",
      "lampiran_url",
      "bukti_transfer_file_id",
      "bukti_transfer_url",
      "status",
      "catatan_admin",
      "created_at",
      "updated_at"
    ]);
  }

  // 10. Sheet master_bank (Daftar Bank Transfer)
  let sheetBank = getSheetCaseInsensitive(ss, "master_bank");
  if (!sheetBank) {
    sheetBank = ss.insertSheet("master_bank");
    sheetBank.appendRow(["bank_id", "nama_bank", "status"]);
    sheetBank.appendRow(["bsi", "BSI (Bank Syariah Indonesia)", "active"]);
    sheetBank.appendRow(["mandiri", "Bank Mandiri", "active"]);
    sheetBank.appendRow(["bca", "Bank BCA", "active"]);
    sheetBank.appendRow(["bri", "Bank BRI", "active"]);
    sheetBank.appendRow(["bni", "Bank BNI", "active"]);
    sheetBank.appendRow(["cimb", "Bank CIMB Niaga", "active"]);
    sheetBank.appendRow(["permata", "Bank Permata", "active"]);
    sheetBank.appendRow(["btn", "Bank BTN", "active"]);
  }
}

// Helper mencari Sheet tanpa case sensitive & toleran spasi
function getSheetCaseInsensitive(ss, name) {
  if (!ss) return null;
  let s = ss.getSheetByName(name);
  if (s) return s;
  const sheets = ss.getSheets();
  const target = name.toLowerCase().trim();
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().toLowerCase().trim();
    if (sName === target || sName === target + "s" || target === sName + "s") {
      return sheets[i];
    }
  }
  return null;
}

// Helper membaca map nama kolom ke indeks (0-based)
function getHeaderMap(sheet) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol || lastCol < 1) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const key = (headers[i] || "").toString().toLowerCase().trim();
    if (key) map[key] = i;
  }
  return map;
}

// Helper respond JSON with CORS support
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Helper Generate UUID
function generateUUID() {
  return Utilities.getUuid();
}

// Helper Hash PIN (SHA-256)
function hashPin(pin) {
  if (!pin) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin.toString(), Utilities.Charset.UTF_8);
  let txtHash = "";
  for (let j = 0; j < rawHash.length; j++) {
    let hashVal = rawHash[j];
    if (hashVal < 0) hashVal += 256;
    let byteString = hashVal.toString(16);
    if (byteString.length === 1) byteString = "0" + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

// FORMAT NO HP (harus 62xxxxxxxxxx)
function sanitizePhone(phone) {
  if (!phone) return "";
  let clean = phone.toString().replace(/\\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return clean;
}

// EKSTRAK YOUTUBE ID (Aman tanpa regex escape issue di Apps Script)
function extractYouTubeIdGAS(url) {
  if (!url) return "";
  var str = url.toString().trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;

  // youtu.be/ID
  var idx = str.indexOf("youtu.be/");
  if (idx !== -1) {
    var sub = str.substring(idx + 9).split(/[?#&]/)[0];
    if (sub && sub.length >= 11) return sub.substring(0, 11);
  }

  // watch?v=ID or &v=ID
  var vIdx = str.indexOf("v=");
  if (vIdx !== -1) {
    var vSub = str.substring(vIdx + 2).split(/[#&]/)[0];
    if (vSub && vSub.length >= 11) return vSub.substring(0, 11);
  }

  // embed/ID or shorts/ID or live/ID or /v/ID
  var patterns = ["embed/", "shorts/", "live/", "/v/"];
  for (var p = 0; p < patterns.length; p++) {
    var pIdx = str.indexOf(patterns[p]);
    if (pIdx !== -1) {
      var pSub = str.substring(pIdx + patterns[p].length).split(/[?#&]/)[0];
      if (pSub && pSub.length >= 11) return pSub.substring(0, 11);
    }
  }

  return "";
}

// SIMPAN FILE BASE64 KE GOOGLE DRIVE
function saveBase64ToDrive(base64Data, fileName, folderName) {
  try {
    if (!base64Data) return { fileId: "", fileUrl: "", error: "File base64 kosong" };
    var cleanBase64 = base64Data.toString().trim();
    var contentType = "image/jpeg";
    if (cleanBase64.indexOf(";base64,") !== -1) {
      var parts = cleanBase64.split(";base64,");
      contentType = parts[0].replace("data:", "").trim();
      cleanBase64 = parts[1];
    }
    // Hapus whitespace atau newline yang mungkin menyusup
    cleanBase64 = cleanBase64.replace(/\s+/g, "");

    var decoded = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decoded, contentType, fileName || ("reimburst_" + Date.now() + ".jpg"));

    // Cari atau buat folder penyimpanan di Google Drive (hindari karakter slash /)
    var targetFolderName = (folderName || "Reimburse Al Hijrah").replace(/[\/\\]/g, " - ");
    var folders = DriveApp.getFoldersByName(targetFolderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(targetFolderName);

    var file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log("Sharing permission warning: " + e.toString());
    }

    var fileId = file.getId();
    var fileUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=sharing";
    return { fileId: fileId, fileUrl: fileUrl, error: null };
  } catch (err) {
    Logger.log("Error saveBase64ToDrive: " + err.toString());
    return { fileId: "", fileUrl: "", error: err.toString() };
  }
}

// FUNGSI UNTUK OTORISASI / TES IZIN GOOGLE DRIVE
// Jalankan fungsi ini 1x di editor Google Apps Script dengan tombol 'Run' (Jalankan)
// untuk menyetujui popup "Authorization Required" (Otorisasi Diperlukan).
function testDriveAuth() {
  try {
    var folderName = "Reimburse Al Hijrah";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    Logger.log("DriveApp BERHASIL diotorisasi! Folder ID: " + folder.getId() + " - URL: " + folder.getUrl());
    return "DriveApp BERHASIL diotorisasi! Folder ID: " + folder.getId() + " | Folder URL: " + folder.getUrl();
  } catch (err) {
    Logger.log("Otorisasi DriveApp Diperlukan / Error: " + err.toString());
    throw err;
  }
}

// Handle GET requests
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
    return handleRouting(action, e ? e.parameter : {});
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// Handle POST requests (workaround CORS: content-type text/plain)
function doPost(e) {
  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (ex) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }
    
    const action = params.action || (e && e.parameter && e.parameter.action) || "ping";
    return handleRouting(action, params);
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function handleRouting(action, params) {
  const ss = getSpreadsheet();
  
  if (action === "ping" || action === "initDatabase") {
    try {
      setupSheets();
    } catch (e) {}
    return jsonResponse({ success: true, message: "Apps Script Masjid Al Hijrah Aktif & Terverifikasi", timestamp: new Date().toISOString() });
  }
  
  // 1. REGISTER
  if (action === "register") {
    const nama = (params.nama || "").toString().trim();
    const rawNoHp = params.no_hp || "";
    const pin = (params.pin || "").toString().trim();
    const nrp = (params.nrp || "").toString().trim();
    const email = (params.email || "").toString().trim();
    const tanggal_lahir = (params.tanggal_lahir || "").toString().trim();
    const jenis_kelamin = (params.jenis_kelamin || "pria").toString().toLowerCase().trim();
    const status_jamaah = (params.status_jamaah || "Umum").toString().trim();
    const role = (params.role || "user").toString().toLowerCase() === "admin" ? "admin" : "user";
    
    if (!nama || !rawNoHp || !pin) {
      return jsonResponse({ success: false, error: "Nama, nomor HP, dan PIN wajib diisi" });
    }
    if (!nrp) {
      return jsonResponse({ success: false, error: "NRP wajib diisi" });
    }
    if (nrp.length > 16) {
      return jsonResponse({ success: false, error: "NRP maksimal 16 karakter" });
    }
    
    const no_hp = sanitizePhone(rawNoHp);
    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    const data = sheetUsers.getDataRange().getValues();
    
    // Cek duplikat no_hp
    const phoneCol = userHeaderMap["no_hp"] !== undefined ? userHeaderMap["no_hp"] : 2;
    for (let i = 1; i < data.length; i++) {
      if (data[i][phoneCol] && sanitizePhone(data[i][phoneCol].toString()) === no_hp) {
        return jsonResponse({ success: false, error: "Nomor HP sudah terdaftar. Silakan login." });
      }
    }

    // Cek duplikat nrp
    const nrpCheckCol = userHeaderMap["nrp"];
    if (nrpCheckCol !== undefined) {
      for (let i = 1; i < data.length; i++) {
        if (data[i][nrpCheckCol] && data[i][nrpCheckCol].toString().trim().toLowerCase() === nrp.toLowerCase()) {
          return jsonResponse({ success: false, error: "NRP " + nrp + " sudah terdaftar. Gunakan NRP Anda sendiri." });
        }
      }
    }
    
    // Pastikan kolom baru email, tanggal_lahir, jenis_kelamin, status_jamaah, role, nrp tersedia di header
    if (userHeaderMap["email"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("email");
      userHeaderMap["email"] = newCol - 1;
    }
    if (userHeaderMap["tanggal_lahir"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("tanggal_lahir");
      userHeaderMap["tanggal_lahir"] = newCol - 1;
    }
    if (userHeaderMap["jenis_kelamin"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("jenis_kelamin");
      userHeaderMap["jenis_kelamin"] = newCol - 1;
    }
    if (userHeaderMap["status_jamaah"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("status_jamaah");
      userHeaderMap["status_jamaah"] = newCol - 1;
    }
    if (userHeaderMap["status_pegawai"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("status_pegawai");
      userHeaderMap["status_pegawai"] = newCol - 1;
    }
    if (userHeaderMap["company_id"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("company_id");
      userHeaderMap["company_id"] = newCol - 1;
    }
    if (userHeaderMap["unit_id"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("unit_id");
      userHeaderMap["unit_id"] = newCol - 1;
    }
    if (userHeaderMap["role"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("role");
      userHeaderMap["role"] = newCol - 1;
    }
    if (userHeaderMap["nrp"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("nrp");
      userHeaderMap["nrp"] = newCol - 1;
    }
    
    const user_id = generateUUID();
    const total_poin = 0;
    const created_at = new Date().toISOString();
    
    const totalCols = sheetUsers.getLastColumn();
    const rowData = new Array(totalCols).fill("");
    
    rowData[userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0] = user_id;
    rowData[userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1] = nama;
    rowData[userHeaderMap["no_hp"] !== undefined ? userHeaderMap["no_hp"] : 2] = no_hp;
    if (userHeaderMap["email"] !== undefined) rowData[userHeaderMap["email"]] = email;
    if (userHeaderMap["tanggal_lahir"] !== undefined) rowData[userHeaderMap["tanggal_lahir"]] = tanggal_lahir;
    if (userHeaderMap["jenis_kelamin"] !== undefined) rowData[userHeaderMap["jenis_kelamin"]] = jenis_kelamin;
    if (userHeaderMap["status_jamaah"] !== undefined) rowData[userHeaderMap["status_jamaah"]] = status_jamaah;
    if (userHeaderMap["status_pegawai"] !== undefined) rowData[userHeaderMap["status_pegawai"]] = params.status_pegawai || "";
    if (userHeaderMap["company_id"] !== undefined) rowData[userHeaderMap["company_id"]] = params.company_id || "";
    if (userHeaderMap["unit_id"] !== undefined) rowData[userHeaderMap["unit_id"]] = params.unit_id || "";
    // PIN DISIMPAN PLAIN TEXT (TIDAK DIENKRIPSI) SESUAI INSTRUKSI
    const pinCol = userHeaderMap["pin"] !== undefined ? userHeaderMap["pin"] : 3;
    rowData[pinCol] = pin;
    const poinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    rowData[poinCol] = total_poin;
    const roleCol = userHeaderMap["role"] !== undefined ? userHeaderMap["role"] : 5;
    rowData[roleCol] = role;
    const createdCol = userHeaderMap["created_at"] !== undefined ? userHeaderMap["created_at"] : 6;
    if (createdCol < totalCols) rowData[createdCol] = created_at;
    if (userHeaderMap["nrp"] !== undefined) rowData[userHeaderMap["nrp"]] = nrp;
    
    sheetUsers.appendRow(rowData);
    
    return jsonResponse({
      success: true,
      message: "Registrasi berhasil",
      data: {
        user_id: user_id,
        nama: nama,
        no_hp: no_hp,
        nrp: nrp,
        email: email,
        tanggal_lahir: tanggal_lahir,
        jenis_kelamin: jenis_kelamin,
        status_jamaah: status_jamaah,
        status_pegawai: params.status_pegawai || "",
        company_id: params.company_id || "",
        unit_id: params.unit_id || "",
        total_poin: total_poin,
        role: role,
        created_at: created_at
      }
    });
  }
  
  // 2. LOGIN
  if (action === "login") {
    const rawNoHp = params.no_hp || "";
    const pin = (params.pin || "").toString().trim();
    
    if (!rawNoHp || !pin) {
      return jsonResponse({ success: false, error: "Nomor HP dan PIN wajib diisi" });
    }
    
    const no_hp = sanitizePhone(rawNoHp);
    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    const data = sheetUsers.getDataRange().getValues();
    
    const phoneCol = userHeaderMap["no_hp"] !== undefined ? userHeaderMap["no_hp"] : 2;
    const pinCol = userHeaderMap["pin"] !== undefined ? userHeaderMap["pin"] : 3;
    const idCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    const nameCol = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
    const poinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    const roleCol = userHeaderMap["role"];
    const createdCol = userHeaderMap["created_at"];
    const emailCol = userHeaderMap["email"];
    const tglCol = userHeaderMap["tanggal_lahir"];
    const jkCol = userHeaderMap["jenis_kelamin"];
    const statusCol = userHeaderMap["status_jamaah"];
    const spCol = userHeaderMap["status_pegawai"];
    const compCol = userHeaderMap["company_id"];
    const unitCol = userHeaderMap["unit_id"];
    const nrpCol = userHeaderMap["nrp"];
    
    for (let i = 1; i < data.length; i++) {
      const rowPhone = sanitizePhone(data[i][phoneCol] ? data[i][phoneCol].toString() : "");
      const rowPin = data[i][pinCol] ? data[i][pinCol].toString().trim() : "";
      
      // Match phone & plain PIN (fallback hashPin untuk baris legacy yang terlanjur dienkripsi)
      if (rowPhone === no_hp) {
        if (rowPin === pin || rowPin === hashPin(pin)) {
          let userRole = "user";
          if (roleCol !== undefined && data[i][roleCol]) {
            userRole = data[i][roleCol].toString().toLowerCase();
          } else if (data[i][5] === "user" || data[i][5] === "admin") {
            userRole = data[i][5];
          }
          
          let createdAt = "";
          if (createdCol !== undefined && data[i][createdCol]) {
            createdAt = data[i][createdCol].toString();
          }

          return jsonResponse({
            success: true,
            message: "Login berhasil",
            data: {
              user_id: data[i][idCol],
              nama: data[i][nameCol],
              no_hp: rowPhone,
              nrp: nrpCol !== undefined ? (data[i][nrpCol] || "").toString() : "",
              email: emailCol !== undefined ? (data[i][emailCol] || "").toString() : "",
              tanggal_lahir: tglCol !== undefined ? (data[i][tglCol] || "").toString() : "",
              jenis_kelamin: jkCol !== undefined ? (data[i][jkCol] || "pria").toString() : "pria",
              status_jamaah: statusCol !== undefined ? (data[i][statusCol] || "Umum").toString() : "Umum",
              status_pegawai: spCol !== undefined ? (data[i][spCol] || "").toString() : "",
              company_id: compCol !== undefined ? (data[i][compCol] || "").toString() : "",
              unit_id: unitCol !== undefined ? (data[i][unitCol] || "").toString() : "",
              total_poin: Number(data[i][poinCol]) || 0,
              role: userRole,
              created_at: createdAt
            }
          });
        } else {
          return jsonResponse({ success: false, error: "PIN yang Anda masukkan salah" });
        }
      }
    }
    
    return jsonResponse({ success: false, error: "Nomor HP belum terdaftar. Silakan daftar akun baru." });
  }

  // 2.1 UPDATE NRP (Untuk melengkapi data user lama)
  if (action === "updateNrp") {
    const user_id = params.user_id;
    const nrp = (params.nrp || "").toString().trim();
    if (!user_id || !nrp) {
      return jsonResponse({ success: false, error: "User ID dan NRP wajib diisi" });
    }
    if (nrp.length > 16) {
      return jsonResponse({ success: false, error: "NRP maksimal 16 karakter" });
    }
    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    if (userHeaderMap["nrp"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("nrp");
      userHeaderMap["nrp"] = newCol - 1;
    }
    const nrpCol = userHeaderMap["nrp"];
    const idCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    const data = sheetUsers.getDataRange().getValues();
    
    // Cek duplikat NRP pada user lain
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] !== user_id && data[i][nrpCol] && data[i][nrpCol].toString().trim().toLowerCase() === nrp.toLowerCase()) {
        return jsonResponse({ success: false, error: "NRP " + nrp + " sudah digunakan oleh jamaah lain" });
      }
    }
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === user_id) {
        sheetUsers.getRange(i + 1, nrpCol + 1).setValue(nrp);
        SpreadsheetApp.flush();
        return jsonResponse({ success: true, message: "NRP berhasil diperbarui", nrp: nrp });
      }
    }
    return jsonResponse({ success: false, error: "User tidak ditemukan" });
  }
  
  // 2.5. VALIDATE QR (Pre-check sebelum isi form penilaian)
  if (action === "validateQR") {
    const user_id = params.user_id;
    const qr_token = (params.qr_token || "").trim();
    if (!user_id || !qr_token) {
      return jsonResponse({ success: false, error: "User ID dan Token QR diperlukan" });
    }
    const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    const sheetLogs = getSheetCaseInsensitive(ss, "scan_log");
    if (!sheetEvents) {
      return jsonResponse({ success: false, error: "Tabel master_event tidak ditemukan" });
    }
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const eventRows = sheetEvents.getDataRange().getValues();

    const getCol = (aliases, fallbackIdx) => {
      for (let a = 0; a < aliases.length; a++) {
        if (eventHeaderMap[aliases[a]] !== undefined) {
          return eventHeaderMap[aliases[a]];
        }
      }
      return fallbackIdx;
    };

    const qrCol = getCol(["qr_token", "qr token", "token"], 3);
    const idCol = getCol(["event_id", "event id", "id"], 0);
    const namaCol = getCol(["nama_event", "nama event", "event", "nama"], 1);
    const tglCol = getCol(["tanggal", "tgl", "date"], 2);
    const poinCol = getCol(["poin_value", "poin value", "poin", "points"], 4);
    const statusCol = getCol(["status", "active"], 5);
    const pemateriCol = getCol(["pemateri", "narasumber", "ustadz"], 6);
    const waktuCol = getCol(["waktu", "jam"], 7);
    const lokasiCol = getCol(["lokasi", "tempat", "ruangan", "lokasi_acara", "lokasi acara", "venue"], 8);
    const eventTypeCol = eventHeaderMap["event_type"] !== undefined ? eventHeaderMap["event_type"] : eventHeaderMap["tipe"];
    const kuotaCol = eventHeaderMap["kuota"] !== undefined ? eventHeaderMap["kuota"] : eventHeaderMap["quota"];

    let targetEvent = null;
    for (let i = 1; i < eventRows.length; i++) {
      const rowToken = (eventRows[i][qrCol] || "").toString().trim();
      if (rowToken.toUpperCase() === qr_token.toUpperCase()) {
        const rawType = eventTypeCol !== undefined ? (eventRows[i][eventTypeCol] || "").toString().toLowerCase().trim() : "append";
        targetEvent = {
          event_id: eventRows[i][idCol],
          nama_event: eventRows[i][namaCol],
          tanggal: eventRows[i][tglCol],
          qr_token: rowToken,
          poin_value: Number(eventRows[i][poinCol]) || 10,
          status: (eventRows[i][statusCol] || "").toString().toLowerCase(),
          event_type: rawType === "redeem" ? "redeem" : "append",
          kuota: kuotaCol !== undefined && eventRows[i][kuotaCol] !== "" ? Number(eventRows[i][kuotaCol]) : undefined,
          pemateri: (eventRows[i][pemateriCol] || "").toString(),
          waktu: (eventRows[i][waktuCol] || "").toString(),
          lokasi: (eventRows[i][lokasiCol] || "").toString()
        };
        break;
      }
    }

    if (!targetEvent) {
      return jsonResponse({ success: false, error: "QR Code tidak valid atau tidak dikenali." });
    }

    if (targetEvent.status !== "active") {
      return jsonResponse({ success: false, error: "Kajian/item ini sudah tidak aktif atau masa berlakunya telah berakhir.", event: targetEvent });
    }

    // Cek anti-duplicate scan di scan_log
    const logRows = sheetLogs.getDataRange().getValues();
    for (let i = 1; i < logRows.length; i++) {
      const logUserId = (logRows[i][1] || "").toString();
      const logEventId = (logRows[i][2] || "").toString();
      if (logUserId === user_id && logEventId === targetEvent.event_id) {
        return jsonResponse({
          success: false,
          already_scanned: true,
          error: targetEvent.event_type === "redeem"
            ? "Kamu sudah menukarkan kupon/item ini sebelumnya."
            : "Kamu sudah absen di event ini. Poin tidak dapat diakumulasi ganda.",
          event: targetEvent
        });
      }
    }

    // Cek saldo jika redeem
    if (targetEvent.event_type === "redeem") {
      const sheetUsers = ss.getSheetByName("users");
      const userHeaderMap = getHeaderMap(sheetUsers);
      const userRows = sheetUsers.getDataRange().getValues();
      const idColUser = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
      const poinColUser = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
      let currentPoin = 0;
      for (let i = 1; i < userRows.length; i++) {
        if (userRows[i][idColUser] === user_id) {
          currentPoin = Number(userRows[i][poinColUser]) || 0;
          break;
        }
      }
      if (currentPoin < targetEvent.poin_value) {
        return jsonResponse({
          success: false,
          error: "Poin Anda tidak mencukupi untuk penukaran. Poin Anda: " + currentPoin + ", dibutuhkan: " + targetEvent.poin_value + " poin.",
          event: targetEvent
        });
      }

      // Cek kuota jika ada batas kuota untuk item redeem
      if (targetEvent.kuota && targetEvent.kuota > 0) {
        const logHeaderMapVal = getHeaderMap(sheetLogs);
        const logEvIdColVal = logHeaderMapVal["event_id"] !== undefined ? logHeaderMapVal["event_id"] : 2;
        let claimedCount = 0;
        for (let i = 1; i < logRows.length; i++) {
          const logEvId = (logRows[i][logEvIdColVal] || "").toString().trim();
          if (logEvId === targetEvent.event_id.toString().trim()) {
            claimedCount++;
          }
        }
        if (claimedCount >= targetEvent.kuota) {
          return jsonResponse({
            success: false,
            kuota_penuh: true,
            error: "Mohon maaf, kuota penukaran untuk item '" + targetEvent.nama_event + "' telah habis (Kuota: " + targetEvent.kuota + " telah terpenuhi).",
            event: targetEvent
          });
        }
      }
    }

    return jsonResponse({
      success: true,
      event: targetEvent,
      already_scanned: false,
      requires_review: targetEvent.event_type !== "redeem"
    });
  }

  // 3. SCAN QR & SUBMIT PENILAIAN
  if (action === "scanQR") {
    const user_id = params.user_id;
    const qr_token = (params.qr_token || "").trim();
    
    if (!user_id || !qr_token) {
      return jsonResponse({ success: false, error: "User ID dan Token QR wajib disertakan" });
    }
    
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
    } catch (e) {
      return jsonResponse({ success: false, error: "Sistem sedang sibuk. Silakan coba lagi." });
    }
    
    try {
      const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
      const sheetLogs = getSheetCaseInsensitive(ss, "scan_log");
      const sheetUsers = getSheetCaseInsensitive(ss, "users");
      if (!sheetEvents) {
        return jsonResponse({ success: false, error: "Tabel master_event tidak ditemukan" });
      }
    
      // a. Cari event by qr_token
      const eventHeaderMap = getHeaderMap(sheetEvents);
      const eventRows = sheetEvents.getDataRange().getValues();
      let targetEvent = null;

      const getCol = (aliases, fallbackIdx) => {
        for (let a = 0; a < aliases.length; a++) {
          if (eventHeaderMap[aliases[a]] !== undefined) {
            return eventHeaderMap[aliases[a]];
          }
        }
        return fallbackIdx;
      };
      
      const qrCol = getCol(["qr_token", "qr token", "token"], 3);
      const idCol = getCol(["event_id", "event id", "id"], 0);
      const namaCol = getCol(["nama_event", "nama event", "event", "nama"], 1);
      const tglCol = getCol(["tanggal", "tgl", "date"], 2);
      const poinCol = getCol(["poin_value", "poin value", "poin", "points"], 4);
      const statusCol = getCol(["status", "active"], 5);
      const pemateriCol = getCol(["pemateri", "narasumber", "ustadz"], 6);
      const waktuCol = getCol(["waktu", "jam"], 7);
      const lokasiCol = getCol(["lokasi", "tempat", "ruangan", "lokasi_acara", "lokasi acara", "venue"], 8);
      const eventTypeCol = eventHeaderMap["event_type"] !== undefined ? eventHeaderMap["event_type"] : eventHeaderMap["tipe"];
      const kuotaCol = eventHeaderMap["kuota"] !== undefined ? eventHeaderMap["kuota"] : eventHeaderMap["quota"];

    for (let i = 1; i < eventRows.length; i++) {
      const rowToken = (eventRows[i][qrCol] || "").toString().trim();
      if (rowToken === qr_token) {
        const rawType = eventTypeCol !== undefined ? (eventRows[i][eventTypeCol] || "").toString().toLowerCase().trim() : "append";
        targetEvent = {
          rowIndex: i + 1,
          event_id: eventRows[i][idCol],
          nama_event: eventRows[i][namaCol],
          tanggal: eventRows[i][tglCol],
          qr_token: rowToken,
          poin_value: Number(eventRows[i][poinCol]) || 10,
          status: (eventRows[i][statusCol] || "").toString().toLowerCase(),
          event_type: rawType === "redeem" ? "redeem" : "append",
          kuota: kuotaCol !== undefined && eventRows[i][kuotaCol] !== "" ? Number(eventRows[i][kuotaCol]) : undefined,
          pemateri: (eventRows[i][pemateriCol] || "").toString(),
          waktu: (eventRows[i][waktuCol] || "").toString(),
          lokasi: (eventRows[i][lokasiCol] || "").toString()
        };
        break;
      }
    }
    
    if (!targetEvent) {
      return jsonResponse({ success: false, error: "QR Code tidak valid atau tidak dikenali." });
    }
    
    if (targetEvent.status !== "active") {
      return jsonResponse({ success: false, error: "Kajian/item ini sudah tidak aktif atau masa berlakunya telah berakhir." });
    }
    
    // b. Cek anti-duplicate scan di scan_log (user_id + event_id)
    const logRows = sheetLogs.getDataRange().getValues();
    const logHeaderMapDuplicate = getHeaderMap(sheetLogs);
    const logUserIdCol = logHeaderMapDuplicate["user_id"] !== undefined ? logHeaderMapDuplicate["user_id"] : 1;
    const logEventIdCol = logHeaderMapDuplicate["event_id"] !== undefined ? logHeaderMapDuplicate["event_id"] : 2;

    for (let i = 1; i < logRows.length; i++) {
      const logUserId = (logRows[i][logUserIdCol] || "").toString().trim();
      const logEventId = (logRows[i][logEventIdCol] || "").toString().trim();
      if (logUserId === user_id.toString().trim() && logEventId === targetEvent.event_id.toString().trim()) {
        return jsonResponse({
          success: false,
          already_scanned: true,
          error: targetEvent.event_type === "redeem" 
            ? "Kamu sudah menukarkan kupon/item ini sebelumnya." 
            : "Kamu sudah absen di event ini. Poin tidak dapat diakumulasi ganda.",
          event: targetEvent
        });
      }
    }
    
    // c. Cari user & validasi saldo jika mode Redeem
    const userHeaderMap = getHeaderMap(sheetUsers);
    const userRows = sheetUsers.getDataRange().getValues();
    const idColUser = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    const poinColUser = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    let userRowIdx = -1;
    let currentPoin = 0;
    
    for (let i = 1; i < userRows.length; i++) {
      if (userRows[i][idColUser] === user_id) {
        userRowIdx = i + 1;
        currentPoin = Number(userRows[i][poinColUser]) || 0;
        break;
      }
    }
    
    if (userRowIdx === -1) {
      return jsonResponse({ success: false, error: "Data user tidak ditemukan di sistem." });
    }
    
    const isRedeem = targetEvent.event_type === "redeem";
    
    if (isRedeem && currentPoin < targetEvent.poin_value) {
      return jsonResponse({
        success: false,
        error: "Poin Anda tidak mencukupi untuk penukaran. Poin Anda: " + currentPoin + ", dibutuhkan: " + targetEvent.poin_value + " poin.",
        event: targetEvent
      });
    }
    
    let isQuotaFull = false;
    let sisaKuota = undefined;
    let claimedCount = 0;
    
    // Gunakan header map untuk scan_log agar aman jika ada perubahan kolom
    const logHeaderMap = getHeaderMap(sheetLogs);
    const logEvIdCol = logHeaderMap["event_id"] !== undefined ? logHeaderMap["event_id"] : 2;
    const logPointCol = logHeaderMap["poin_didapat"] !== undefined ? logHeaderMap["poin_didapat"] : 3;

    if (targetEvent.kuota && targetEvent.kuota > 0) {
      for (let i = 1; i < logRows.length; i++) {
        const logEvId = (logRows[i][logEvIdCol] || "").toString().trim();
        const logPoint = Number(logRows[i][logPointCol]) || 0;
        if (logEvId === targetEvent.event_id.toString().trim()) {
          if (isRedeem) {
            // Untuk redeem, semua transaksi penukaran dihitung
            claimedCount++;
          } else if (logPoint > 0) {
            // Untuk kajian/append, hanya yang mendapat poin yang dihitung
            claimedCount++;
          }
        }
      }

      // JIKA REDEEM & KUOTA HABIS: TOLAK TRANSAKSI (POIN TIDAK DIPOTONG)
      if (isRedeem && claimedCount >= targetEvent.kuota) {
        return jsonResponse({
          success: false,
          kuota_penuh: true,
          error: "Mohon maaf, kuota penukaran untuk item '" + targetEvent.nama_event + "' telah habis (" + targetEvent.kuota + " kuota terpenuhi). Poin Anda tidak dipotong.",
          event: targetEvent
        });
      }

      if (!isRedeem) {
        if (claimedCount >= targetEvent.kuota) {
          isQuotaFull = true;
        } else {
          sisaKuota = targetEvent.kuota - (claimedCount + 1);
        }
      } else {
        sisaKuota = targetEvent.kuota - (claimedCount + 1);
      }
    }

    const poinDelta = isRedeem ? -targetEvent.poin_value : isQuotaFull ? 0 : targetEvent.poin_value;
    const newTotalPoin = currentPoin + poinDelta;
    
    // d. Catat ke scan_log secara dinamis
    const log_id = generateUUID();
    const scanned_at = new Date().toISOString();
    
    const totalLogCols = sheetLogs.getLastColumn() || 5;
    const newLogData = new Array(totalLogCols).fill("");
    if (logHeaderMap["log_id"] !== undefined) newLogData[logHeaderMap["log_id"]] = log_id;
    else newLogData[0] = log_id;
    
    if (logHeaderMap["user_id"] !== undefined) newLogData[logHeaderMap["user_id"]] = user_id;
    else newLogData[1] = user_id;
    
    if (logHeaderMap["event_id"] !== undefined) newLogData[logHeaderMap["event_id"]] = targetEvent.event_id;
    else newLogData[2] = targetEvent.event_id;
    
    if (logHeaderMap["poin_didapat"] !== undefined) newLogData[logHeaderMap["poin_didapat"]] = poinDelta;
    else newLogData[3] = poinDelta;
    
    if (logHeaderMap["scanned_at"] !== undefined) newLogData[logHeaderMap["scanned_at"]] = scanned_at;
    else newLogData[4] = scanned_at;
    
    sheetLogs.appendRow(newLogData);
    
    // e. Update total_poin di users secara dinamis jika ada perubahan poin
    if (poinDelta !== 0) {
      sheetUsers.getRange(userRowIdx, poinColUser + 1).setValue(newTotalPoin);
    }

    // f. Simpan Penilaian Acara (Feedback) jika ada
    let sheetReviews = getSheetCaseInsensitive(ss, "penilaian_acara");
    if (!sheetReviews) {
      sheetReviews = ss.insertSheet("penilaian_acara");
      sheetReviews.appendRow([
        "review_id",
        "user_id",
        "event_id",
        "nama_jamaah",
        "nama_event",
        "skor_materi",
        "skor_kenyamanan",
        "skor_sound",
        "skor_panitia",
        "kesan_terbaik",
        "hal_kurang",
        "usulan_kegiatan",
        "submitted_at"
      ]);
    }

    const hasReviewData = params.review !== undefined || 
      params.skor_materi !== undefined || 
      params.kesan_terbaik !== undefined || 
      params.hal_kurang !== undefined || 
      params.usulan_kegiatan !== undefined ||
      params.hal_perlu_diperbaiki !== undefined ||
      params.usulan_tema !== undefined;

    if (sheetReviews && hasReviewData) {
      // 1. Parsing object review jika berupa string JSON (misal dari GET parameter / URL search params)
      let revObj = {};
      if (params.review) {
        if (typeof params.review === "string") {
          try {
            revObj = JSON.parse(params.review);
          } catch (ex) {
            revObj = {};
          }
        } else if (typeof params.review === "object" && params.review !== null) {
          revObj = params.review;
        }
      }

      // 2. Ekstrak skor penilaian
      const getNum = (key, fallback) => {
        if (revObj && revObj[key] !== undefined && revObj[key] !== null && revObj[key] !== "") {
          const n = Number(revObj[key]);
          if (!isNaN(n)) return n;
        }
        if (params && params[key] !== undefined && params[key] !== null && params[key] !== "") {
          const n = Number(params[key]);
          if (!isNaN(n)) return n;
        }
        return fallback;
      };

      const skor_materi = getNum("skor_materi", 5);
      const skor_kenyamanan = getNum("skor_kenyamanan", 5);
      const skor_sound = getNum("skor_sound", 5);
      const skor_panitia = getNum("skor_panitia", 5);

      // 3. Ekstrak nilai teks evaluasi (kesan_terbaik, hal_kurang, usulan_kegiatan) beserta semua aliasnya
      const getText = (aliases) => {
        for (let a = 0; a < aliases.length; a++) {
          const k = aliases[a];
          if (revObj && revObj[k] !== undefined && revObj[k] !== null && revObj[k] !== "") {
            return revObj[k].toString().trim();
          }
          if (params && params[k] !== undefined && params[k] !== null && params[k] !== "") {
            return params[k].toString().trim();
          }
        }
        return "";
      };

      const kesan_terbaik = getText(["kesan_terbaik", "kesanTerbaik", "kesan", "kesan_terbaik_acara"]);
      const hal_kurang = getText(["hal_kurang", "halKurang", "hal_perlu_diperbaiki", "halPerluDiperbaiki", "perlu_diperbaiki", "perluDiperbaiki", "kekurangan"]);
      const usulan_kegiatan = getText(["usulan_kegiatan", "usulanKegiatan", "usulan_tema", "usulanTema", "usulan", "usulan_tema_kajian"]);

      // 4. Pastikan kolom header tersedia di sheet penilaian_acara secara otomatis
      let revHeaderMap = getHeaderMap(sheetReviews);
      const ensureCol = (canonicalName, aliases) => {
        for (let a = 0; a < aliases.length; a++) {
          if (revHeaderMap[aliases[a]] !== undefined) return revHeaderMap[aliases[a]];
        }
        const newCol = sheetReviews.getLastColumn() + 1;
        sheetReviews.getRange(1, newCol).setValue(canonicalName);
        revHeaderMap[canonicalName] = newCol - 1;
        return newCol - 1;
      };

      ensureCol("kesan_terbaik", ["kesan_terbaik", "kesan terbaik", "kesanterbaik", "kesan"]);
      ensureCol("hal_kurang", ["hal_kurang", "hal kurang", "halkurang", "hal_perlu_diperbaiki", "hal perlu diperbaiki", "perlu_diperbaiki", "perlu diperbaiki"]);
      ensureCol("usulan_kegiatan", ["usulan_kegiatan", "usulan kegiatan", "usulankegiatan", "usulan_tema", "usulan tema", "usulantema", "usulan"]);
      ensureCol("submitted_at", ["submitted_at", "submitted at", "timestamp", "waktu", "tanggal"]);

      const nameColUser = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
      const userName = (userRows[userRowIdx - 1] && userRows[userRowIdx - 1][nameColUser]) || "Jamaah";
      const review_id = generateUUID();

      // 5. Susun baris penilaian secara dinamis berdasarkan reviewHeaderMap
      const totalReviewCols = Math.max(sheetReviews.getLastColumn(), 13);
      const newReviewRow = new Array(totalReviewCols).fill("");

      const fillCol = (val, preferredAliases, fallbackIdx) => {
        let placed = false;
        for (let a = 0; a < preferredAliases.length; a++) {
          const colIdx = revHeaderMap[preferredAliases[a]];
          if (colIdx !== undefined && colIdx < totalReviewCols) {
            newReviewRow[colIdx] = val;
            placed = true;
            break;
          }
        }
        if (!placed && fallbackIdx < totalReviewCols && newReviewRow[fallbackIdx] === "") {
          newReviewRow[fallbackIdx] = val;
        }
      };

      fillCol(review_id, ["review_id", "review id", "id"], 0);
      fillCol(user_id, ["user_id", "user id"], 1);
      fillCol(targetEvent.event_id, ["event_id", "event id"], 2);
      fillCol(userName, ["nama_jamaah", "nama jamaah", "nama", "jamaah"], 3);
      fillCol(targetEvent.nama_event, ["nama_event", "nama event", "event"], 4);
      fillCol(skor_materi, ["skor_materi", "skor materi", "materi"], 5);
      fillCol(skor_kenyamanan, ["skor_kenyamanan", "skor kenyamanan", "kenyamanan", "lokasi"], 6);
      fillCol(skor_sound, ["skor_sound", "skor sound", "sound", "suara"], 7);
      fillCol(skor_panitia, ["skor_panitia", "skor panitia", "panitia"], 8);
      fillCol(kesan_terbaik, ["kesan_terbaik", "kesan terbaik", "kesanterbaik", "kesan"], 9);
      fillCol(hal_kurang, ["hal_kurang", "hal kurang", "halkurang", "hal_perlu_diperbaiki", "hal perlu diperbaiki", "perlu_diperbaiki", "perlu diperbaiki"], 10);
      fillCol(usulan_kegiatan, ["usulan_kegiatan", "usulan kegiatan", "usulankegiatan", "usulan_tema", "usulan tema", "usulantema", "usulan"], 11);
      fillCol(scanned_at, ["submitted_at", "submitted at", "timestamp", "waktu", "tanggal"], 12);

      sheetReviews.appendRow(newReviewRow);
    }
    
    const successMsg = isRedeem
      ? "Penukaran berhasil! " + targetEvent.poin_value + " poin telah dipotong untuk '" + targetEvent.nama_event + "'. Sisa poin Anda: " + newTotalPoin + " poin." + (sisaKuota !== undefined ? " (Sisa kuota: " + sisaKuota + " voucher/item)" : "")
      : isQuotaFull
      ? "Evaluasi acara berhasil tersimpan! Namun, mohon maaf kuota perolehan poin untuk kajian '" + targetEvent.nama_event + "' telah penuh (" + targetEvent.kuota + " jamaah), sehingga Anda tidak memperoleh tambahan poin."
      : "Alhamdulillah! Penilaian acara tersimpan dan Anda mendapatkan +" + targetEvent.poin_value + " poin!" + (sisaKuota !== undefined ? " (Sisa kuota: " + sisaKuota + " jamaah)" : "");
    
    return jsonResponse({
      success: true,
      message: successMsg,
      poin_didapat: poinDelta,
      total_poin_terbaru: newTotalPoin,
      event: targetEvent,
      kuota_penuh: isQuotaFull
    });
    } finally {
      lock.releaseLock();
    }
  }

  // 4. GET PROFILE
  if (action === "getProfile") {
    const user_id = params.user_id;
    if (!user_id) return jsonResponse({ success: false, error: "User ID diperlukan" });
    
    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    const data = sheetUsers.getDataRange().getValues();
    
    const idCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    const nameCol = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
    const phoneCol = userHeaderMap["no_hp"] !== undefined ? userHeaderMap["no_hp"] : 2;
    const poinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    const roleCol = userHeaderMap["role"];
    const createdCol = userHeaderMap["created_at"];
    const emailCol = userHeaderMap["email"];
    const tglCol = userHeaderMap["tanggal_lahir"];
    const jkCol = userHeaderMap["jenis_kelamin"];
    const statusCol = userHeaderMap["status_jamaah"];
    const spCol = userHeaderMap["status_pegawai"];
    const compCol = userHeaderMap["company_id"];
    const unitCol = userHeaderMap["unit_id"];
    const nrpCol = userHeaderMap["nrp"];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === user_id) {
        let userRole = "user";
        if (roleCol !== undefined && data[i][roleCol]) {
          userRole = data[i][roleCol].toString().toLowerCase();
        } else if (data[i][5] === "user" || data[i][5] === "admin") {
          userRole = data[i][5];
        }

        return jsonResponse({
          success: true,
          data: {
            user_id: data[i][idCol],
            nama: data[i][nameCol],
            no_hp: data[i][phoneCol],
            nrp: nrpCol !== undefined ? (data[i][nrpCol] || "").toString() : "",
            email: emailCol !== undefined ? (data[i][emailCol] || "").toString() : "",
            tanggal_lahir: tglCol !== undefined ? (data[i][tglCol] || "").toString() : "",
            jenis_kelamin: jkCol !== undefined ? (data[i][jkCol] || "pria").toString() : "pria",
            status_jamaah: statusCol !== undefined ? (data[i][statusCol] || "Umum").toString() : "Umum",
            status_pegawai: spCol !== undefined ? (data[i][spCol] || "").toString() : "",
            company_id: compCol !== undefined ? (data[i][compCol] || "").toString() : "",
            unit_id: unitCol !== undefined ? (data[i][unitCol] || "").toString() : "",
            total_poin: Number(data[i][poinCol]) || 0,
            role: userRole,
            created_at: createdCol !== undefined ? (data[i][createdCol] || "").toString() : ""
          }
        });
      }
    }
    return jsonResponse({ success: false, error: "User tidak ditemukan" });
  }
  
  // 5. GET HISTORY (Join scan_log + master_event)
  if (action === "getHistory") {
    const user_id = params.user_id;
    if (!user_id) return jsonResponse({ success: false, error: "User ID diperlukan" });
    
    const sheetLogs = getSheetCaseInsensitive(ss, "scan_log");
    const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    if (!sheetLogs || !sheetEvents) {
      return jsonResponse({ success: true, data: [] });
    }
    
    const logRows = sheetLogs.getDataRange().getValues();
    const eventRows = sheetEvents.getDataRange().getValues();
    
    // Map event_id -> event details
    const eventMap = {};
    for (let i = 1; i < eventRows.length; i++) {
      eventMap[eventRows[i][0]] = {
        nama_event: eventRows[i][1],
        tanggal: eventRows[i][2]
      };
    }
    
    const history = [];
    for (let i = 1; i < logRows.length; i++) {
      if (logRows[i][1] === user_id) {
        const eventId = logRows[i][2];
        const eventInfo = eventMap[eventId] || { nama_event: "Kajian Masjid", tanggal: "" };
        history.push({
          log_id: logRows[i][0],
          user_id: logRows[i][1],
          event_id: eventId,
          poin_didapat: Number(logRows[i][3]) || 0,
          scanned_at: logRows[i][4],
          nama_event: eventInfo.nama_event,
          tanggal: eventInfo.tanggal
        });
      }
    }
    
    // Urutkan dari yang terbaru
    history.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
    
    return jsonResponse({ success: true, data: history });
  }
  
  // 5.5 GET COMPANIES
  if (action === "getCompanies") {
    const sheet = getSheetCaseInsensitive(ss, "company");
    if (!sheet) {
      return jsonResponse({ success: true, data: [] });
    }
    const headerMap = getHeaderMap(sheet);
    const rows = sheet.getDataRange().getValues();
    const companies = [];
    
    let idIdx = headerMap["company_id"];
    if (idIdx === undefined) idIdx = headerMap["id_company"];
    if (idIdx === undefined) idIdx = headerMap["id"];
    if (idIdx === undefined) idIdx = 0;

    let nameIdx = headerMap["company_name"];
    if (nameIdx === undefined) nameIdx = headerMap["nama_perusahaan"];
    if (nameIdx === undefined) nameIdx = headerMap["nama_company"];
    if (nameIdx === undefined) nameIdx = headerMap["nama"];
    if (nameIdx === undefined) nameIdx = 1;
    
    for (let i = 1; i < rows.length; i++) {
      const cId = (rows[i][idIdx] !== undefined ? rows[i][idIdx] : "").toString().trim();
      const cName = (rows[i][nameIdx] !== undefined ? rows[i][nameIdx] : cId).toString().trim();
      if (cId) {
        companies.push({
          company_id: cId,
          company_name: cName || cId,
        });
      }
    }
    return jsonResponse({ success: true, data: companies });
  }

  // 5.6 GET UNITS
  if (action === "getUnits") {
    const sheet = getSheetCaseInsensitive(ss, "unit");
    if (!sheet) {
      return jsonResponse({ success: true, data: [] });
    }
    const headerMap = getHeaderMap(sheet);
    const rows = sheet.getDataRange().getValues();
    const units = [];
    
    let idIdx = headerMap["unit_id"];
    if (idIdx === undefined) idIdx = headerMap["id_unit"];
    if (idIdx === undefined) idIdx = headerMap["id"];
    if (idIdx === undefined) idIdx = 0;

    let compIdx = headerMap["company_id"];
    if (compIdx === undefined) compIdx = headerMap["id_company"];
    if (compIdx === undefined) compIdx = headerMap["company"];
    if (compIdx === undefined) compIdx = headerMap["perusahaan"];
    if (compIdx === undefined) compIdx = 1;

    let nameIdx = headerMap["unit_name"];
    if (nameIdx === undefined) nameIdx = headerMap["nama_unit"];
    if (nameIdx === undefined) nameIdx = headerMap["nama_divisi"];
    if (nameIdx === undefined) nameIdx = headerMap["divisi"];
    if (nameIdx === undefined) nameIdx = headerMap["nama"];
    if (nameIdx === undefined) nameIdx = 2;
    
    for (let i = 1; i < rows.length; i++) {
      const uId = (rows[i][idIdx] !== undefined ? rows[i][idIdx] : "").toString().trim();
      const cId = (compIdx !== undefined && rows[i][compIdx] !== undefined ? rows[i][compIdx] : "").toString().trim();
      const uName = (nameIdx !== undefined && rows[i][nameIdx] !== undefined ? rows[i][nameIdx] : uId).toString().trim();
      if (uId) {
        units.push({
          unit_id: uId,
          company_id: cId,
          unit_name: uName || uId,
        });
      }
    }
    return jsonResponse({ success: true, data: units });
  }

  // 6. GET EVENTS (Admin & Home preview)
  if (action === "getEvents") {
    const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    if (!sheetEvents) {
      return jsonResponse({ success: true, data: [] });
    }
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const eventRows = sheetEvents.getDataRange().getValues();
    const events = [];

    const getCol = (aliases, fallbackIdx) => {
      for (let a = 0; a < aliases.length; a++) {
        if (eventHeaderMap[aliases[a]] !== undefined) {
          return eventHeaderMap[aliases[a]];
        }
      }
      return fallbackIdx;
    };

    const idIdx = getCol(["event_id", "event id", "id"], 0);
    const namaIdx = getCol(["nama_event", "nama event", "event", "nama"], 1);
    const tglIdx = getCol(["tanggal", "tgl", "date"], 2);
    const qrIdx = getCol(["qr_token", "qr token", "token"], 3);
    const poinIdx = getCol(["poin_value", "poin value", "poin", "points"], 4);
    const statusIdx = getCol(["status", "active"], 5);
    const pemateriIdx = getCol(["pemateri", "narasumber", "ustadz"], 6);
    const waktuIdx = getCol(["waktu", "jam"], 7);
    const lokasiIdx = getCol(["lokasi", "tempat", "ruangan", "lokasi_acara", "lokasi acara", "venue"], 8);
    const eventTypeIdx = getCol(["event_type", "event type", "tipe", "mode"], 9);
    const kuotaIdx = getCol(["kuota", "quota", "limit"], 10);
    const createdIdx = getCol(["created_at", "created at", "timestamp"], 11);
    
    for (let i = 1; i < eventRows.length; i++) {
      if (eventRows[i][idIdx]) {
        const rawMode = eventTypeIdx !== undefined ? (eventRows[i][eventTypeIdx] || "").toString().toLowerCase().trim() : "append";
        events.push({
          event_id: eventRows[i][idIdx],
          nama_event: eventRows[i][namaIdx],
          tanggal: eventRows[i][tglIdx],
          qr_token: eventRows[i][qrIdx],
          poin_value: Number(eventRows[i][poinIdx]) || 0,
          status: eventRows[i][statusIdx] || "active",
          event_type: rawMode === "redeem" ? "redeem" : "append",
          kuota: kuotaIdx !== undefined && eventRows[i][kuotaIdx] !== "" ? Number(eventRows[i][kuotaIdx]) : undefined,
          pemateri: pemateriIdx !== undefined ? (eventRows[i][pemateriIdx] || "").toString() : "",
          waktu: waktuIdx !== undefined ? (eventRows[i][waktuIdx] || "").toString() : "",
          lokasi: lokasiIdx !== undefined ? (eventRows[i][lokasiIdx] || "").toString() : "",
          created_at: createdIdx !== undefined ? (eventRows[i][createdIdx] || "").toString() : ""
        });
      }
    }
    
    return jsonResponse({ success: true, data: events });
  }
  
  // 7. ADD EVENT (Admin)
  if (action === "addEvent") {
    let sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    if (!sheetEvents) {
      sheetEvents = ss.insertSheet("master_event");
      sheetEvents.appendRow(["event_id", "nama_event", "tanggal", "qr_token", "poin_value", "status", "pemateri", "waktu", "lokasi", "event_type", "kuota", "created_at"]);
      SpreadsheetApp.flush();
    }

    const nama_event = params.nama_event || "Kajian Rutin Masjid Al Hijrah";
    const tanggal = params.tanggal || new Date().toISOString().split("T")[0];
    const poin_value = Number(params.poin_value) || 25;
    const status = params.status || "active";
    const event_type = (params.event_type || "append").toString().toLowerCase().trim() === "redeem" ? "redeem" : "append";
    const pemateri = (params.pemateri || params.narasumber || params.ustadz || "").toString().trim();
    const waktu = (params.waktu || params.jam || "").toString().trim();
    const lokasi = (params.lokasi || params.tempat || params.ruangan || params.lokasi_acara || (event_type === "redeem" ? "Posko Penukaran / Sekretariat DKM" : "Ruang Utama Masjid Al Hijrah PTPP")).toString().trim();
    const kuota = params.kuota !== undefined && params.kuota !== "" ? Number(params.kuota) : "";
    
    // Generate secure random QR token (misal: HIJRAH-xxx-xxx)
    const randomSuffix = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const qr_token = params.qr_token || ("HIJRAH-" + randomSuffix);
    
    const event_id = generateUUID();
    const created_at = new Date().toISOString();
    
    const eventHeaderMap = getHeaderMap(sheetEvents);
    let currentLastCol = sheetEvents.getLastColumn() || 1;

    // Pastikan kolom pemateri, waktu, lokasi, event_type, kuota tersedia di header tabel
    const getColOrAdd = (canonicalName, aliases) => {
      for (let a = 0; a < aliases.length; a++) {
        if (eventHeaderMap[aliases[a]] !== undefined) {
          return eventHeaderMap[aliases[a]];
        }
      }
      currentLastCol++;
      sheetEvents.getRange(1, currentLastCol).setValue(canonicalName);
      eventHeaderMap[canonicalName] = currentLastCol - 1;
      return currentLastCol - 1;
    };

    const colEventId = getColOrAdd("event_id", ["event_id", "event id", "id"]);
    const colNamaEvent = getColOrAdd("nama_event", ["nama_event", "nama event", "event", "nama"]);
    const colTanggal = getColOrAdd("tanggal", ["tanggal", "tgl", "date"]);
    const colQrToken = getColOrAdd("qr_token", ["qr_token", "qr token", "token"]);
    const colPoinValue = getColOrAdd("poin_value", ["poin_value", "poin value", "poin", "points"]);
    const colStatus = getColOrAdd("status", ["status", "active"]);
    const colPemateri = getColOrAdd("pemateri", ["pemateri", "narasumber", "ustadz"]);
    const colWaktu = getColOrAdd("waktu", ["waktu", "jam"]);
    const colLokasi = getColOrAdd("lokasi", ["lokasi", "tempat", "ruangan", "lokasi_acara", "lokasi acara", "venue"]);
    const colEventType = getColOrAdd("event_type", ["event_type", "event type", "tipe", "mode"]);
    const colKuota = getColOrAdd("kuota", ["kuota", "quota", "limit"]);
    const colCreatedAt = getColOrAdd("created_at", ["created_at", "created at", "timestamp"]);

    SpreadsheetApp.flush();

    const totalCols = Math.max(currentLastCol, 12);
    const rowData = new Array(totalCols).fill("");

    rowData[colEventId] = event_id;
    rowData[colNamaEvent] = nama_event;
    rowData[colTanggal] = tanggal;
    rowData[colQrToken] = qr_token;
    rowData[colPoinValue] = poin_value;
    rowData[colStatus] = status;
    rowData[colPemateri] = pemateri;
    rowData[colWaktu] = waktu;
    rowData[colLokasi] = lokasi;
    rowData[colEventType] = event_type;
    rowData[colKuota] = kuota;
    rowData[colCreatedAt] = created_at;

    sheetEvents.appendRow(rowData);
    
    return jsonResponse({
      success: true,
      message: "Event berhasil ditambahkan ke tabel master_event",
      data: {
        event_id: event_id,
        nama_event: nama_event,
        tanggal: tanggal,
        qr_token: qr_token,
        poin_value: poin_value,
        status: status,
        event_type: event_type,
        kuota: kuota ? Number(kuota) : undefined,
        pemateri: pemateri,
        waktu: waktu,
        lokasi: lokasi,
        created_at: created_at
      }
    });
  }

  // 7.5 TOGGLE EVENT STATUS (Admin)
  if (action === "toggleEventStatus") {
    const event_id = params.event_id;
    if (!event_id) return jsonResponse({ success: false, error: "Event ID diperlukan" });
    const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    if (!sheetEvents) return jsonResponse({ success: false, error: "Tabel master_event tidak ditemukan" });
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const data = sheetEvents.getDataRange().getValues();
    const idCol = eventHeaderMap["event_id"] !== undefined ? eventHeaderMap["event_id"] : 0;
    const statusCol = eventHeaderMap["status"] !== undefined ? eventHeaderMap["status"] : 5;

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === event_id) {
        const current = (data[i][statusCol] || "active").toString().toLowerCase().trim();
        const nextStatus = current === "active" ? "inactive" : "active";
        sheetEvents.getRange(i + 1, statusCol + 1).setValue(nextStatus);
        return jsonResponse({
          success: true,
          message: "Status event berhasil diubah",
          data: { event_id: event_id, status: nextStatus }
        });
      }
    }
    return jsonResponse({ success: false, error: "Event tidak ditemukan" });
  }
  
  // 8. GET ALL LOGS (Admin rekap)
  if (action === "getAllLogs") {
    const sheetLogs = getSheetCaseInsensitive(ss, "scan_log");
    const sheetEvents = getSheetCaseInsensitive(ss, "master_event");
    const sheetUsers = getSheetCaseInsensitive(ss, "users");

    if (!sheetLogs || !sheetEvents || !sheetUsers) {
      return jsonResponse({ success: true, data: [] });
    }

    const logsData = sheetLogs.getDataRange().getValues();
    const eventsData = sheetEvents.getDataRange().getValues();
    const usersData = sheetUsers.getDataRange().getValues();

    if (logsData.length <= 1) return jsonResponse({ success: true, data: [] });

    const logHeader = getHeaderMap(sheetLogs);
    const eventHeader = getHeaderMap(sheetEvents);
    const userHeader = getHeaderMap(sheetUsers);

    const eventMap = {};
    for (let i = 1; i < eventsData.length; i++) {
      const eid = eventsData[i][eventHeader["event_id"] !== undefined ? eventHeader["event_id"] : 0];
      const ename = eventsData[i][eventHeader["nama_event"] !== undefined ? eventHeader["nama_event"] : 1];
      const etgl = eventsData[i][eventHeader["tanggal"] !== undefined ? eventHeader["tanggal"] : 2];
      if (eid) eventMap[eid.toString()] = { nama: ename, tanggal: etgl };
    }

    const userMap = {};
    for (let i = 1; i < usersData.length; i++) {
      const uid = usersData[i][userHeader["user_id"] !== undefined ? userHeader["user_id"] : 0];
      const uname = usersData[i][userHeader["nama"] !== undefined ? userHeader["nama"] : 1];
      const uhp = usersData[i][userHeader["no_hp"] !== undefined ? userHeader["no_hp"] : 2];
      if (uid) userMap[uid.toString()] = { nama: uname, no_hp: uhp };
    }

    const logsList = [];
    for (let i = logsData.length - 1; i >= 1; i--) {
      const log_id = logsData[i][logHeader["log_id"] !== undefined ? logHeader["log_id"] : 0];
      const user_id = logsData[i][logHeader["user_id"] !== undefined ? logHeader["user_id"] : 1];
      const event_id = logsData[i][logHeader["event_id"] !== undefined ? logHeader["event_id"] : 2];
      const poin = Number(logsData[i][logHeader["poin_didapat"] !== undefined ? logHeader["poin_didapat"] : 3]) || 0;
      const scanned_at = logsData[i][logHeader["scanned_at"] !== undefined ? logHeader["scanned_at"] : 4];
      const evType = logsData[i][logHeader["event_type"]] || "append";

      if (log_id) {
        const str_uid = user_id.toString();
        const str_eid = event_id.toString();
        logsList.push({
          log_id: log_id.toString(),
          user_id: str_uid,
          event_id: str_eid,
          poin_didapat: poin,
          scanned_at: scanned_at.toString(),
          event_type: evType.toString(),
          nama_event: eventMap[str_eid] ? eventMap[str_eid].nama : "Kajian",
          tanggal: eventMap[str_eid] ? eventMap[str_eid].tanggal : "",
          nama_user: userMap[str_uid] ? userMap[str_uid].nama : "Jamaah",
          no_hp: userMap[str_uid] ? userMap[str_uid].no_hp : ""
        });
      }
    }
    
    return jsonResponse({ success: true, data: logsList });
  }

  // 8.5 GET LEADERBOARD / DAFTAR JAMAAH
  if (action === "getLeaderboard") {
    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    const data = sheetUsers.getDataRange().getValues();
    
    const idCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    const nameCol = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
    const phoneCol = userHeaderMap["no_hp"] !== undefined ? userHeaderMap["no_hp"] : 2;
    const pinCol = userHeaderMap["pin"] !== undefined ? userHeaderMap["pin"] : 3;
    const poinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    const roleCol = userHeaderMap["role"];
    const createdCol = userHeaderMap["created_at"];
    const emailCol = userHeaderMap["email"];
    const tglCol = userHeaderMap["tanggal_lahir"];
    const jkCol = userHeaderMap["jenis_kelamin"];
    const statusCol = userHeaderMap["status_jamaah"];
    
    const usersList = [];
    for (let i = 1; i < data.length; i++) {
      let userRole = "user";
      if (roleCol !== undefined && data[i][roleCol]) {
        userRole = data[i][roleCol].toString().toLowerCase();
      } else if (data[i][5] === "user" || data[i][5] === "admin") {
        userRole = data[i][5];
      }
      
      usersList.push({
        user_id: data[i][idCol],
        nama: data[i][nameCol],
        no_hp: data[i][phoneCol],
        email: emailCol !== undefined ? (data[i][emailCol] || "").toString() : "",
        tanggal_lahir: tglCol !== undefined ? (data[i][tglCol] || "").toString() : "",
        jenis_kelamin: jkCol !== undefined ? (data[i][jkCol] || "pria").toString() : "pria",
        status_jamaah: statusCol !== undefined ? (data[i][statusCol] || "Umum").toString() : "Umum",
        pin: pinCol !== undefined ? (data[i][pinCol] || "").toString() : "",
        total_poin: Number(data[i][poinCol]) || 0,
        role: userRole,
        created_at: createdCol !== undefined ? (data[i][createdCol] || "").toString() : ""
      });
    }
    
    // Sort descending berdasarkan total_poin
    usersList.sort(function(a, b) { return b.total_poin - a.total_poin; });
    
    return jsonResponse({ success: true, data: usersList });
  }

  // 9. UPDATE USER ROLE (Admin)
  if (action === "updateUserRole") {
    const targetUserId = params.user_id;
    const newRole = (params.role || "user").toString().toLowerCase() === "admin" ? "admin" : "user";
    if (!targetUserId) return jsonResponse({ success: false, error: "User ID diperlukan" });

    const sheetUsers = ss.getSheetByName("users");
    const userHeaderMap = getHeaderMap(sheetUsers);
    const data = sheetUsers.getDataRange().getValues();
    const idCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
    let roleCol = userHeaderMap["role"];

    if (roleCol === undefined) {
      const colIndex = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, colIndex).setValue("role");
      roleCol = colIndex - 1;
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === targetUserId) {
        sheetUsers.getRange(i + 1, roleCol + 1).setValue(newRole);
        return jsonResponse({ success: true, message: "Peran pengguna berhasil diperbarui ke " + newRole });
      }
    }
    return jsonResponse({ success: false, error: "User tidak ditemukan" });
  }

  // 10. GET REVIEWS / PENILAIAN ACARA (Admin)
  if (action === "getReviews") {
    const sheetReviews = getSheetCaseInsensitive(ss, "penilaian_acara");
    if (!sheetReviews) {
      return jsonResponse({ success: true, data: [] });
    }
    const data = sheetReviews.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, data: [] });
    }
    const reviewHeaderMap = getHeaderMap(sheetReviews);

    const getCol = (aliases, fallbackIdx) => {
      for (let a = 0; a < aliases.length; a++) {
        if (reviewHeaderMap[aliases[a]] !== undefined) {
          return reviewHeaderMap[aliases[a]];
        }
      }
      return fallbackIdx;
    };

    const colRevId = getCol(["review_id", "review id", "id"], 0);
    const colUserId = getCol(["user_id", "user id"], 1);
    const colEvtId = getCol(["event_id", "event id"], 2);
    const colNama = getCol(["nama_jamaah", "nama jamaah", "nama", "jamaah"], 3);
    const colEvtNama = getCol(["nama_event", "nama event", "event"], 4);
    const colMateri = getCol(["skor_materi", "skor materi", "materi"], 5);
    const colLokasi = getCol(["skor_kenyamanan", "skor kenyamanan", "kenyamanan", "lokasi"], 6);
    const colSound = getCol(["skor_sound", "skor sound", "sound", "suara"], 7);
    const colPanitia = getCol(["skor_panitia", "skor panitia", "panitia"], 8);
    const colKesan = getCol(["kesan_terbaik", "kesan terbaik", "kesanterbaik", "kesan"], 9);
    const colKurang = getCol(["hal_kurang", "hal kurang", "halkurang", "hal_perlu_diperbaiki", "hal perlu diperbaiki", "perlu_diperbaiki", "perlu diperbaiki"], 10);
    const colUsulan = getCol(["usulan_kegiatan", "usulan kegiatan", "usulankegiatan", "usulan_tema", "usulan tema", "usulantema", "usulan"], 11);
    const colSubmitted = getCol(["submitted_at", "submitted at", "timestamp", "waktu", "tanggal"], 12);

    const reviewsList = [];
    for (let i = 1; i < data.length; i++) {
      reviewsList.push({
        review_id: (data[i][colRevId] || "").toString(),
        user_id: (data[i][colUserId] || "").toString(),
        event_id: (data[i][colEvtId] || "").toString(),
        nama_jamaah: (data[i][colNama] || "").toString(),
        nama_event: (data[i][colEvtNama] || "").toString(),
        skor_materi: Number(data[i][colMateri]) || 5,
        skor_kenyamanan: Number(data[i][colLokasi]) || 5,
        skor_sound: Number(data[i][colSound]) || 5,
        skor_panitia: Number(data[i][colPanitia]) || 5,
        kesan_terbaik: (data[i][colKesan] || "").toString(),
        hal_kurang: (data[i][colKurang] || "").toString(),
        usulan_kegiatan: (data[i][colUsulan] || "").toString(),
        submitted_at: (data[i][colSubmitted] || "").toString()
      });
    }
    // Sort descending by submitted_at
    reviewsList.reverse();
    return jsonResponse({ success: true, data: reviewsList });
  }

  // 11. GET VIDEOS (User & Admin)
  if (action === "getVideos") {
    let sheetVideos = getSheetCaseInsensitive(ss, "videos");
    if (!sheetVideos) {
      return jsonResponse({ success: true, data: [] });
    }
    const data = sheetVideos.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, data: [] });
    }
    const videoHeaderMap = getHeaderMap(sheetVideos);

    const getCol = (aliases, fallbackIdx) => {
      for (let a = 0; a < aliases.length; a++) {
        if (videoHeaderMap[aliases[a]] !== undefined) {
          return videoHeaderMap[aliases[a]];
        }
      }
      return fallbackIdx;
    };

    const colId = getCol(["video_id", "video id", "id"], 0);
    const colTitle = getCol(["title", "judul", "nama_video", "nama video"], 1);
    const colDesc = getCol(["description", "deskripsi", "desc", "keterangan"], 2);
    const colUrl = getCol(["youtube_url", "youtube url", "link", "url"], 3);
    const colCreated = getCol(["created_at", "created at", "timestamp", "tanggal"], 4);
    const colStatus = getCol(["status", "aktif"], 5);

    const videosList = [];
    for (let i = 1; i < data.length; i++) {
      const vidId = (data[i][colId] || "").toString().trim();
      const status = (data[i][colStatus] || "active").toString().toLowerCase().trim();
      if (vidId && status !== "inactive") {
        const rawUrl = (data[i][colUrl] || "").toString().trim();
        const ytId = extractYouTubeIdGAS(rawUrl);

        videosList.push({
          video_id: vidId,
          title: (data[i][colTitle] || "").toString(),
          description: (data[i][colDesc] || "").toString(),
          youtube_url: rawUrl,
          youtube_id: ytId,
          created_at: (data[i][colCreated] || "").toString(),
          status: status
        });
      }
    }
    // Sort descending by created_at
    videosList.reverse();
    return jsonResponse({ success: true, data: videosList });
  }

  // 12. ADD VIDEO (Admin)
  if (action === "addVideo") {
    let sheetVideos = getSheetCaseInsensitive(ss, "videos");
    if (!sheetVideos) {
      sheetVideos = ss.insertSheet("videos");
      sheetVideos.appendRow(["video_id", "title", "description", "youtube_url", "created_at", "status"]);
      SpreadsheetApp.flush();
    }

    const title = (params.title || params.judul || "").toString().trim();
    const description = (params.description || params.deskripsi || params.desc || "").toString().trim();
    const youtube_url = (params.youtube_url || params.link || "").toString().trim();
    let youtube_id = (params.youtube_id || "").toString().trim();

    if (!title) return jsonResponse({ success: false, error: "Judul video wajib diisi" });
    if (!youtube_url) return jsonResponse({ success: false, error: "Link YouTube wajib diisi" });

    if (!youtube_id) {
      youtube_id = extractYouTubeIdGAS(youtube_url);
    }

    const video_id = generateUUID();
    const created_at = new Date().toISOString();
    const status = "active";

    sheetVideos.appendRow([video_id, title, description, youtube_url, created_at, status]);
    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      message: "Video kajian berhasil ditambahkan",
      data: {
        video_id: video_id,
        title: title,
        description: description,
        youtube_url: youtube_url,
        youtube_id: youtube_id,
        created_at: created_at,
        status: status
      }
    });
  }

  // 13. DELETE VIDEO (Admin)
  if (action === "deleteVideo") {
    const video_id = params.video_id;
    if (!video_id) return jsonResponse({ success: false, error: "Video ID diperlukan" });
    const sheetVideos = getSheetCaseInsensitive(ss, "videos");
    if (!sheetVideos) return jsonResponse({ success: false, error: "Tabel videos tidak ditemukan" });
    const data = sheetVideos.getDataRange().getValues();
    const videoHeaderMap = getHeaderMap(sheetVideos);
    const idCol = videoHeaderMap["video_id"] !== undefined ? videoHeaderMap["video_id"] : 0;
    const statusCol = videoHeaderMap["status"] !== undefined ? videoHeaderMap["status"] : 5;

    for (let i = 1; i < data.length; i++) {
      if ((data[i][idCol] || "").toString().trim() === video_id.trim()) {
        sheetVideos.getRange(i + 1, statusCol + 1).setValue("inactive");
        SpreadsheetApp.flush();
        return jsonResponse({ success: true, message: "Video berhasil dihapus" });
      }
    }
    return jsonResponse({ success: false, error: "Video tidak ditemukan" });
  }

  // =========================================================================
  // 14. FITUR REIMBURST MULTI-JENIS (JAMAAH & ADMIN)
  // =========================================================================

  // 14.1 GET REIMBURST JENIS LIST (Daftar Kategori Unik dari Program Aktif)
  if (action === "getReimburstJenisList") {
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    if (!sheetPrograms) return jsonResponse({ success: true, data: [] });
    const data = sheetPrograms.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ success: true, data: [] });
    const headerMap = getHeaderMap(sheetPrograms);
    const colJenis = headerMap["jenis_reimburst"] !== undefined ? headerMap["jenis_reimburst"] : 1;
    const colStatus = headerMap["status"] !== undefined ? headerMap["status"] : 6;

    const jenisMap = {};
    for (let i = 1; i < data.length; i++) {
      const status = (data[i][colStatus] || "active").toString().toLowerCase().trim();
      const jenis = (data[i][colJenis] || "").toString().trim();
      if (jenis && status === "active") {
        if (!jenisMap[jenis.toLowerCase()]) {
          jenisMap[jenis.toLowerCase()] = {
            jenis_reimburst: jenis,
            program_count: 1
          };
        } else {
          jenisMap[jenis.toLowerCase()].program_count++;
        }
      }
    }
    const list = Object.keys(jenisMap).map(k => jenisMap[k]);
    return jsonResponse({ success: true, data: list });
  }

  // 14.2 GET REIMBURST PROGRAMS (Program Aktif, Opsional filter per jenis)
  if (action === "getReimburstPrograms") {
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    if (!sheetPrograms) return jsonResponse({ success: true, data: [] });
    const data = sheetPrograms.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ success: true, data: [] });
    const headerMap = getHeaderMap(sheetPrograms);

    const colId = headerMap["program_id"] !== undefined ? headerMap["program_id"] : 0;
    const colJenis = headerMap["jenis_reimburst"] !== undefined ? headerMap["jenis_reimburst"] : 1;
    const colNama = headerMap["nama_program"] !== undefined ? headerMap["nama_program"] : 2;
    const colMulai = headerMap["tanggal_mulai"] !== undefined ? headerMap["tanggal_mulai"] : 3;
    const colSelesai = headerMap["tanggal_selesai"] !== undefined ? headerMap["tanggal_selesai"] : 4;
    const colPersen = headerMap["maks_persen_reimburst"] !== undefined ? headerMap["maks_persen_reimburst"] : 5;
    const colStatus = headerMap["status"] !== undefined ? headerMap["status"] : 6;
    const colCreated = headerMap["created_at"] !== undefined ? headerMap["created_at"] : 7;

    const targetJenis = (params.jenis_reimburst || "").toString().trim().toLowerCase();
    const programs = [];
    for (let i = 1; i < data.length; i++) {
      const status = (data[i][colStatus] || "active").toString().toLowerCase().trim();
      const jenis = (data[i][colJenis] || "").toString().trim();
      if (status === "active") {
        if (!targetJenis || jenis.toLowerCase() === targetJenis) {
          programs.push({
            program_id: (data[i][colId] || "").toString(),
            jenis_reimburst: jenis,
            nama_program: (data[i][colNama] || "").toString(),
            tanggal_mulai: (data[i][colMulai] || "").toString(),
            tanggal_selesai: (data[i][colSelesai] || "").toString(),
            maks_persen_reimburst: Number(data[i][colPersen]) || 50,
            status: status,
            created_at: (data[i][colCreated] || "").toString()
          });
        }
      }
    }
    return jsonResponse({ success: true, data: programs });
  }

  // 14.3 GET ALL REIMBURST PROGRAMS (Admin View - Semua status)
  if (action === "getAllReimburstPrograms") {
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    if (!sheetPrograms) return jsonResponse({ success: true, data: [] });
    const data = sheetPrograms.getDataRange().getValues();
    if (data.length <= 1) return jsonResponse({ success: true, data: [] });
    const headerMap = getHeaderMap(sheetPrograms);

    const colId = headerMap["program_id"] !== undefined ? headerMap["program_id"] : 0;
    const colJenis = headerMap["jenis_reimburst"] !== undefined ? headerMap["jenis_reimburst"] : 1;
    const colNama = headerMap["nama_program"] !== undefined ? headerMap["nama_program"] : 2;
    const colMulai = headerMap["tanggal_mulai"] !== undefined ? headerMap["tanggal_mulai"] : 3;
    const colSelesai = headerMap["tanggal_selesai"] !== undefined ? headerMap["tanggal_selesai"] : 4;
    const colPersen = headerMap["maks_persen_reimburst"] !== undefined ? headerMap["maks_persen_reimburst"] : 5;
    const colStatus = headerMap["status"] !== undefined ? headerMap["status"] : 6;
    const colCreated = headerMap["created_at"] !== undefined ? headerMap["created_at"] : 7;

    const programs = [];
    for (let i = 1; i < data.length; i++) {
      programs.push({
        program_id: (data[i][colId] || "").toString(),
        jenis_reimburst: (data[i][colJenis] || "").toString().trim(),
        nama_program: (data[i][colNama] || "").toString(),
        tanggal_mulai: (data[i][colMulai] || "").toString(),
        tanggal_selesai: (data[i][colSelesai] || "").toString(),
        maks_persen_reimburst: Number(data[i][colPersen]) || 50,
        status: (data[i][colStatus] || "active").toString().toLowerCase().trim(),
        created_at: (data[i][colCreated] || "").toString()
      });
    }
    programs.reverse();
    return jsonResponse({ success: true, data: programs });
  }

  // 14.4 ADD REIMBURST PROGRAM (Admin Only)
  if (action === "addReimburstProgram") {
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    if (!sheetPrograms) {
      sheetPrograms = ss.insertSheet("master_reimburst_program");
      sheetPrograms.appendRow(["program_id", "jenis_reimburst", "nama_program", "tanggal_mulai", "tanggal_selesai", "maks_persen_reimburst", "status", "created_at"]);
    }
    const rawJenis = (params.jenis_reimburst || "").toString().trim();
    const nama_program = (params.nama_program || "").toString().trim();
    const tanggal_mulai = (params.tanggal_mulai || "").toString().trim() || new Date().toISOString().split("T")[0];
    const tanggal_selesai = (params.tanggal_selesai || "").toString().trim() || "2026-12-31";
    const maks_persen = Math.min(100, Math.max(1, Number(params.maks_persen_reimburst) || 50));

    if (!rawJenis) return jsonResponse({ success: false, error: "Jenis/Kategori reimburst wajib diisi" });
    if (!nama_program) return jsonResponse({ success: false, error: "Nama program reimburst wajib diisi" });

    // Normalisasi jenis reimburst ke Title Case
    const jenis_reimburst = rawJenis.replace(/\\w\\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });

    const program_id = "prog_" + Date.now();
    const created_at = new Date().toISOString();
    const status = "active";

    sheetPrograms.appendRow([program_id, jenis_reimburst, nama_program, tanggal_mulai, tanggal_selesai, maks_persen, status, created_at]);
    SpreadsheetApp.flush();

    return jsonResponse({
      success: true,
      message: "Program reimburst berhasil dibuat",
      data: {
        program_id: program_id,
        jenis_reimburst: jenis_reimburst,
        nama_program: nama_program,
        tanggal_mulai: tanggal_mulai,
        tanggal_selesai: tanggal_selesai,
        maks_persen_reimburst: maks_persen,
        status: status,
        created_at: created_at
      }
    });
  }

  // 14.5 TOGGLE REIMBURST PROGRAM STATUS (Admin Only)
  if (action === "toggleReimburstProgram") {
    const program_id = (params.program_id || "").toString().trim();
    const newStatus = (params.status || "active").toString().toLowerCase().trim();
    if (!program_id) return jsonResponse({ success: false, error: "Program ID diperlukan" });
    const sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    if (!sheetPrograms) return jsonResponse({ success: false, error: "Tabel program reimburst tidak ditemukan" });
    const data = sheetPrograms.getDataRange().getValues();
    const headerMap = getHeaderMap(sheetPrograms);
    const idCol = headerMap["program_id"] !== undefined ? headerMap["program_id"] : 0;
    const statusCol = headerMap["status"] !== undefined ? headerMap["status"] : 6;

    for (let i = 1; i < data.length; i++) {
      if ((data[i][idCol] || "").toString().trim() === program_id) {
        sheetPrograms.getRange(i + 1, statusCol + 1).setValue(newStatus);
        SpreadsheetApp.flush();
        return jsonResponse({ success: true, message: "Status program berhasil diubah menjadi " + newStatus });
      }
    }
    return jsonResponse({ success: false, error: "Program tidak ditemukan" });
  }

  // 14.6 GET BANK LIST (Master Bank Aktif)
  if (action === "getBankList") {
    let sheetBank = getSheetCaseInsensitive(ss, "master_bank");
    if (!sheetBank) {
      setupSheets();
      sheetBank = getSheetCaseInsensitive(ss, "master_bank");
    }
    if (!sheetBank) return jsonResponse({ success: true, data: [] });
    const data = sheetBank.getDataRange().getValues();
    const headerMap = getHeaderMap(sheetBank);
    const idCol = headerMap["bank_id"] !== undefined ? headerMap["bank_id"] : 0;
    const nameCol = headerMap["nama_bank"] !== undefined ? headerMap["nama_bank"] : 1;
    const statusCol = headerMap["status"] !== undefined ? headerMap["status"] : 2;

    const banks = [];
    for (let i = 1; i < data.length; i++) {
      const status = (data[i][statusCol] || "active").toString().toLowerCase().trim();
      if (status === "active") {
        banks.push({
          bank_id: (data[i][idCol] || "").toString(),
          nama_bank: (data[i][nameCol] || "").toString(),
          status: status
        });
      }
    }
    return jsonResponse({ success: true, data: banks });
  }

  // 14.7 SUBMIT CLAIM (Jamaah - Menggunakan LockService)
  if (action === "submitClaim") {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return jsonResponse({ success: false, error: "Server sedang sibuk memproses transaksi lain, silakan ulangi beberapa saat lagi." });
    }

    try {
      const user_id = (params.user_id || "").toString().trim();
      const program_id = (params.program_id || "").toString().trim();
      const besar_klaim = Number(params.besar_klaim) || 0;
      const nama_bank = (params.nama_bank || "").toString().trim();
      const no_rekening = (params.no_rekening || "").toString().trim();
      const komentar = (params.komentar || "").toString().trim();
      const file_base64 = params.file_base64 || "";
      const file_name = params.file_name || ("kuitansi_" + Date.now() + ".jpg");

      if (!user_id) return jsonResponse({ success: false, error: "User ID diperlukan" });
      if (!program_id) return jsonResponse({ success: false, error: "Pilih program reimburst yang akan diajukan" });
      if (besar_klaim <= 0) return jsonResponse({ success: false, error: "Besar klaim harus lebih dari Rp 0" });
      if (!nama_bank || !no_rekening) return jsonResponse({ success: false, error: "Nama bank dan nomor rekening wajib diisi" });

      const sheetUsers = ss.getSheetByName("users");
      const sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
      let sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
      if (!sheetClaims) {
        setupSheets();
        sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
      }

      // Validasi User & Ambil Poin Terkini
      const userHeaderMap = getHeaderMap(sheetUsers);
      const userData = sheetUsers.getDataRange().getValues();
      const userIdCol = userHeaderMap["user_id"] !== undefined ? userHeaderMap["user_id"] : 0;
      const userPoinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
      const userNamaCol = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
      const userNrpCol = userHeaderMap["nrp"];

      let userRowIdx = -1;
      let userTotalPoin = 0;
      let userName = "";
      let userNrp = "";

      for (let i = 1; i < userData.length; i++) {
        if ((userData[i][userIdCol] || "").toString().trim() === user_id) {
          userRowIdx = i + 1;
          userTotalPoin = Number(userData[i][userPoinCol]) || 0;
          userName = (userData[i][userNamaCol] || "").toString();
          userNrp = userNrpCol !== undefined ? (userData[i][userNrpCol] || "").toString() : "";
          break;
        }
      }

      if (userRowIdx === -1) {
        return jsonResponse({ success: false, error: "Data jamaah tidak ditemukan" });
      }

      // Validasi Program
      const progHeaderMap = getHeaderMap(sheetPrograms);
      const progData = sheetPrograms.getDataRange().getValues();
      const progIdCol = progHeaderMap["program_id"] !== undefined ? progHeaderMap["program_id"] : 0;
      const progJenisCol = progHeaderMap["jenis_reimburst"] !== undefined ? progHeaderMap["jenis_reimburst"] : 1;
      const progNamaCol = progHeaderMap["nama_program"] !== undefined ? progHeaderMap["nama_program"] : 2;
      const progPersenCol = progHeaderMap["maks_persen_reimburst"] !== undefined ? progHeaderMap["maks_persen_reimburst"] : 5;
      const progStatusCol = progHeaderMap["status"] !== undefined ? progHeaderMap["status"] : 6;

      let targetProg = null;
      for (let i = 1; i < progData.length; i++) {
        if ((progData[i][progIdCol] || "").toString().trim() === program_id) {
          targetProg = {
            program_id: program_id,
            jenis_reimburst: (progData[i][progJenisCol] || "").toString(),
            nama_program: (progData[i][progNamaCol] || "").toString(),
            maks_persen: Number(progData[i][progPersenCol]) || 50,
            status: (progData[i][progStatusCol] || "active").toString().toLowerCase().trim()
          };
          break;
        }
      }

      if (!targetProg) {
        return jsonResponse({ success: false, error: "Program reimburst tidak ditemukan" });
      }
      if (targetProg.status !== "active") {
        return jsonResponse({ success: false, error: "Program reimburst ini sudah tidak aktif" });
      }

      // Hitung hak klaim (1 poin = Rp 1)
      const jumlah_hak = Math.floor(userTotalPoin * (targetProg.maks_persen / 100));

      if (besar_klaim > jumlah_hak) {
        return jsonResponse({
          success: false,
          error: "Besar klaim (Rp " + besar_klaim.toLocaleString("id-ID") + ") melebihi batas hak klaim Anda (Rp " + jumlah_hak.toLocaleString("id-ID") + ")."
        });
      }

      if (besar_klaim > userTotalPoin) {
        return jsonResponse({
          success: false,
          error: "Saldo poin Anda tidak mencukupi untuk melakukan klaim sebesar Rp " + besar_klaim.toLocaleString("id-ID")
        });
      }

      // Upload file lampiran ke Google Drive
      let lampiran_file_id = "";
      let lampiran_url = "";
      if (file_base64) {
        const uploadResult = saveBase64ToDrive(file_base64, file_name, "Reimburse Al Hijrah");
        lampiran_file_id = uploadResult.fileId || "";
        lampiran_url = uploadResult.fileUrl || "";
        if (!lampiran_url && uploadResult.error) {
          return jsonResponse({
            success: false,
            error: "Gagal menyimpan lampiran ke Google Drive: " + uploadResult.error + ". Buka editor Google Apps Script, pilih fungsi 'testDriveAuth', lalu klik 'Run' (Jalankan) untuk menyetujui izin Google Drive, kemudian deploy 'Versi Baru'."
          });
        }
      }

      // Potong saldo poin user langsung
      const newTotalPoin = userTotalPoin - besar_klaim;
      sheetUsers.getRange(userRowIdx, userPoinCol + 1).setValue(newTotalPoin);

      // Simpan row klaim baru
      const claim_id = "clm_" + Date.now();
      const tanggal_klaim = new Date().toISOString().split("T")[0];
      const created_at = new Date().toISOString();
      const status = "submitted";

      sheetClaims.appendRow([
        claim_id,
        user_id,
        program_id,
        tanggal_klaim,
        jumlah_hak,
        besar_klaim,
        nama_bank,
        no_rekening,
        komentar,
        lampiran_file_id,
        lampiran_url,
        "", // bukti_transfer_file_id
        "", // bukti_transfer_url
        status,
        "", // catatan_admin
        created_at,
        created_at
      ]);
      SpreadsheetApp.flush();

      return jsonResponse({
        success: true,
        message: "Pengajuan klaim berhasil dikirim. Menunggu verifikasi admin.",
        data: {
          claim_id: claim_id,
          user_id: user_id,
          program_id: program_id,
          nama_program: targetProg.nama_program,
          jenis_reimburst: targetProg.jenis_reimburst,
          tanggal_klaim: tanggal_klaim,
          jumlah_hak: jumlah_hak,
          besar_klaim: besar_klaim,
          nama_bank: nama_bank,
          no_rekening: no_rekening,
          status: status,
          lampiran_url: lampiran_url,
          total_poin_terbaru: newTotalPoin,
          created_at: created_at
        }
      });
    } catch (err) {
      return jsonResponse({ success: false, error: "Gagal submit klaim: " + err.toString() });
    } finally {
      lock.releaseLock();
    }
  }

  // 14.8 GET MY CLAIMS (Riwayat Klaim Jamaah Terkait)
  if (action === "getMyClaims") {
    const user_id = (params.user_id || "").toString().trim();
    if (!user_id) return jsonResponse({ success: false, error: "User ID diperlukan" });
    let sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
    if (!sheetClaims) return jsonResponse({ success: true, data: [] });
    const claimData = sheetClaims.getDataRange().getValues();
    if (claimData.length <= 1) return jsonResponse({ success: true, data: [] });
    const claimHeaderMap = getHeaderMap(sheetClaims);

    // Map program info
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    const progMap = {};
    if (sheetPrograms) {
      const progData = sheetPrograms.getDataRange().getValues();
      const progHeaderMap = getHeaderMap(sheetPrograms);
      const pIdCol = progHeaderMap["program_id"] !== undefined ? progHeaderMap["program_id"] : 0;
      const pJenisCol = progHeaderMap["jenis_reimburst"] !== undefined ? progHeaderMap["jenis_reimburst"] : 1;
      const pNamaCol = progHeaderMap["nama_program"] !== undefined ? progHeaderMap["nama_program"] : 2;
      for (let i = 1; i < progData.length; i++) {
        progMap[(progData[i][pIdCol] || "").toString().trim()] = {
          jenis_reimburst: (progData[i][pJenisCol] || "").toString(),
          nama_program: (progData[i][pNamaCol] || "").toString()
        };
      }
    }

    const cIdCol = claimHeaderMap["claim_id"] !== undefined ? claimHeaderMap["claim_id"] : 0;
    const cUserIdCol = claimHeaderMap["user_id"] !== undefined ? claimHeaderMap["user_id"] : 1;
    const cProgIdCol = claimHeaderMap["program_id"] !== undefined ? claimHeaderMap["program_id"] : 2;
    const cTglCol = claimHeaderMap["tanggal_klaim"] !== undefined ? claimHeaderMap["tanggal_klaim"] : 3;
    const cHakCol = claimHeaderMap["jumlah_hak"] !== undefined ? claimHeaderMap["jumlah_hak"] : 4;
    const cBesarCol = claimHeaderMap["besar_klaim"] !== undefined ? claimHeaderMap["besar_klaim"] : 5;
    const cBankCol = claimHeaderMap["nama_bank"] !== undefined ? claimHeaderMap["nama_bank"] : 6;
    const cRekCol = claimHeaderMap["no_rekening"] !== undefined ? claimHeaderMap["no_rekening"] : 7;
    const cKomenCol = claimHeaderMap["komentar"] !== undefined ? claimHeaderMap["komentar"] : 8;
    const cLampIdCol = claimHeaderMap["lampiran_file_id"] !== undefined ? claimHeaderMap["lampiran_file_id"] : 9;
    const cLampUrlCol = claimHeaderMap["lampiran_url"] !== undefined ? claimHeaderMap["lampiran_url"] : 10;
    const cBuktiIdCol = claimHeaderMap["bukti_transfer_file_id"] !== undefined ? claimHeaderMap["bukti_transfer_file_id"] : 11;
    const cBuktiUrlCol = claimHeaderMap["bukti_transfer_url"] !== undefined ? claimHeaderMap["bukti_transfer_url"] : 12;
    const cStatusCol = claimHeaderMap["status"] !== undefined ? claimHeaderMap["status"] : 13;
    const cCatatanCol = claimHeaderMap["catatan_admin"] !== undefined ? claimHeaderMap["catatan_admin"] : 14;
    const cCreatedCol = claimHeaderMap["created_at"] !== undefined ? claimHeaderMap["created_at"] : 15;
    const cUpdatedCol = claimHeaderMap["updated_at"] !== undefined ? claimHeaderMap["updated_at"] : 16;

    const myClaims = [];
    for (let i = 1; i < claimData.length; i++) {
      if ((claimData[i][cUserIdCol] || "").toString().trim() === user_id) {
        const progId = (claimData[i][cProgIdCol] || "").toString().trim();
        const progInfo = progMap[progId] || { nama_program: "Program Reimburst", jenis_reimburst: "Umum" };
        myClaims.push({
          claim_id: (claimData[i][cIdCol] || "").toString(),
          user_id: user_id,
          program_id: progId,
          nama_program: progInfo.nama_program,
          jenis_reimburst: progInfo.jenis_reimburst,
          tanggal_klaim: (claimData[i][cTglCol] || "").toString(),
          jumlah_hak: Number(claimData[i][cHakCol]) || 0,
          besar_klaim: Number(claimData[i][cBesarCol]) || 0,
          nama_bank: (claimData[i][cBankCol] || "").toString(),
          no_rekening: (claimData[i][cRekCol] || "").toString(),
          komentar: (claimData[i][cKomenCol] || "").toString(),
          lampiran_file_id: (claimData[i][cLampIdCol] || "").toString(),
          lampiran_url: (claimData[i][cLampUrlCol] || "").toString(),
          bukti_transfer_file_id: (claimData[i][cBuktiIdCol] || "").toString(),
          bukti_transfer_url: (claimData[i][cBuktiUrlCol] || "").toString(),
          status: (claimData[i][cStatusCol] || "submitted").toString().toLowerCase().trim(),
          catatan_admin: (claimData[i][cCatatanCol] || "").toString(),
          created_at: (claimData[i][cCreatedCol] || "").toString(),
          updated_at: (claimData[i][cUpdatedCol] || "").toString()
        });
      }
    }
    myClaims.reverse();
    return jsonResponse({ success: true, data: myClaims });
  }

  // 14.9 GET ALL CLAIMS (Admin View)
  if (action === "getAllClaims") {
    let sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
    if (!sheetClaims) return jsonResponse({ success: true, data: [] });
    const claimData = sheetClaims.getDataRange().getValues();
    if (claimData.length <= 1) return jsonResponse({ success: true, data: [] });
    const claimHeaderMap = getHeaderMap(sheetClaims);

    // Map user info (nama, nrp, no_hp)
    const sheetUsers = ss.getSheetByName("users");
    const userMap = {};
    if (sheetUsers) {
      const uData = sheetUsers.getDataRange().getValues();
      const uMap = getHeaderMap(sheetUsers);
      const uIdCol = uMap["user_id"] !== undefined ? uMap["user_id"] : 0;
      const uNameCol = uMap["nama"] !== undefined ? uMap["nama"] : 1;
      const uPhoneCol = uMap["no_hp"] !== undefined ? uMap["no_hp"] : 2;
      const uNrpCol = uMap["nrp"];
      for (let i = 1; i < uData.length; i++) {
        userMap[(uData[i][uIdCol] || "").toString().trim()] = {
          nama: (uData[i][uNameCol] || "").toString(),
          no_hp: (uData[i][uPhoneCol] || "").toString(),
          nrp: uNrpCol !== undefined ? (uData[i][uNrpCol] || "").toString() : ""
        };
      }
    }

    // Map program info
    let sheetPrograms = getSheetCaseInsensitive(ss, "master_reimburst_program");
    const progMap = {};
    if (sheetPrograms) {
      const progData = sheetPrograms.getDataRange().getValues();
      const progHeaderMap = getHeaderMap(sheetPrograms);
      const pIdCol = progHeaderMap["program_id"] !== undefined ? progHeaderMap["program_id"] : 0;
      const pJenisCol = progHeaderMap["jenis_reimburst"] !== undefined ? progHeaderMap["jenis_reimburst"] : 1;
      const pNamaCol = progHeaderMap["nama_program"] !== undefined ? progHeaderMap["nama_program"] : 2;
      for (let i = 1; i < progData.length; i++) {
        progMap[(progData[i][pIdCol] || "").toString().trim()] = {
          jenis_reimburst: (progData[i][pJenisCol] || "").toString(),
          nama_program: (progData[i][pNamaCol] || "").toString()
        };
      }
    }

    const cIdCol = claimHeaderMap["claim_id"] !== undefined ? claimHeaderMap["claim_id"] : 0;
    const cUserIdCol = claimHeaderMap["user_id"] !== undefined ? claimHeaderMap["user_id"] : 1;
    const cProgIdCol = claimHeaderMap["program_id"] !== undefined ? claimHeaderMap["program_id"] : 2;
    const cTglCol = claimHeaderMap["tanggal_klaim"] !== undefined ? claimHeaderMap["tanggal_klaim"] : 3;
    const cHakCol = claimHeaderMap["jumlah_hak"] !== undefined ? claimHeaderMap["jumlah_hak"] : 4;
    const cBesarCol = claimHeaderMap["besar_klaim"] !== undefined ? claimHeaderMap["besar_klaim"] : 5;
    const cBankCol = claimHeaderMap["nama_bank"] !== undefined ? claimHeaderMap["nama_bank"] : 6;
    const cRekCol = claimHeaderMap["no_rekening"] !== undefined ? claimHeaderMap["no_rekening"] : 7;
    const cKomenCol = claimHeaderMap["komentar"] !== undefined ? claimHeaderMap["komentar"] : 8;
    const cLampIdCol = claimHeaderMap["lampiran_file_id"] !== undefined ? claimHeaderMap["lampiran_file_id"] : 9;
    const cLampUrlCol = claimHeaderMap["lampiran_url"] !== undefined ? claimHeaderMap["lampiran_url"] : 10;
    const cBuktiIdCol = claimHeaderMap["bukti_transfer_file_id"] !== undefined ? claimHeaderMap["bukti_transfer_file_id"] : 11;
    const cBuktiUrlCol = claimHeaderMap["bukti_transfer_url"] !== undefined ? claimHeaderMap["bukti_transfer_url"] : 12;
    const cStatusCol = claimHeaderMap["status"] !== undefined ? claimHeaderMap["status"] : 13;
    const cCatatanCol = claimHeaderMap["catatan_admin"] !== undefined ? claimHeaderMap["catatan_admin"] : 14;
    const cCreatedCol = claimHeaderMap["created_at"] !== undefined ? claimHeaderMap["created_at"] : 15;
    const cUpdatedCol = claimHeaderMap["updated_at"] !== undefined ? claimHeaderMap["updated_at"] : 16;

    const targetJenis = (params.jenis_reimburst || "").toString().trim().toLowerCase();
    const allClaims = [];

    for (let i = 1; i < claimData.length; i++) {
      const uId = (claimData[i][cUserIdCol] || "").toString().trim();
      const pId = (claimData[i][cProgIdCol] || "").toString().trim();
      const uInfo = userMap[uId] || { nama: "Jamaah", no_hp: "", nrp: "" };
      const pInfo = progMap[pId] || { nama_program: "Program Reimburst", jenis_reimburst: "Umum" };

      if (!targetJenis || pInfo.jenis_reimburst.toLowerCase() === targetJenis) {
        allClaims.push({
          claim_id: (claimData[i][cIdCol] || "").toString(),
          user_id: uId,
          nama_user: uInfo.nama,
          no_hp: uInfo.no_hp,
          nrp: uInfo.nrp,
          program_id: pId,
          nama_program: pInfo.nama_program,
          jenis_reimburst: pInfo.jenis_reimburst,
          tanggal_klaim: (claimData[i][cTglCol] || "").toString(),
          jumlah_hak: Number(claimData[i][cHakCol]) || 0,
          besar_klaim: Number(claimData[i][cBesarCol]) || 0,
          nama_bank: (claimData[i][cBankCol] || "").toString(),
          no_rekening: (claimData[i][cRekCol] || "").toString(),
          komentar: (claimData[i][cKomenCol] || "").toString(),
          lampiran_file_id: (claimData[i][cLampIdCol] || "").toString(),
          lampiran_url: (claimData[i][cLampUrlCol] || "").toString(),
          bukti_transfer_file_id: (claimData[i][cBuktiIdCol] || "").toString(),
          bukti_transfer_url: (claimData[i][cBuktiUrlCol] || "").toString(),
          status: (claimData[i][cStatusCol] || "submitted").toString().toLowerCase().trim(),
          catatan_admin: (claimData[i][cCatatanCol] || "").toString(),
          created_at: (claimData[i][cCreatedCol] || "").toString(),
          updated_at: (claimData[i][cUpdatedCol] || "").toString()
        });
      }
    }
    allClaims.reverse();
    return jsonResponse({ success: true, data: allClaims });
  }

  // 14.10 VERIFY CLAIM (Admin Only -> Status 'verified')
  if (action === "verifyClaim") {
    const claim_id = (params.claim_id || "").toString().trim();
    if (!claim_id) return jsonResponse({ success: false, error: "Claim ID diperlukan" });
    const sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
    if (!sheetClaims) return jsonResponse({ success: false, error: "Tabel klaim tidak ditemukan" });
    const data = sheetClaims.getDataRange().getValues();
    const headerMap = getHeaderMap(sheetClaims);
    const idCol = headerMap["claim_id"] !== undefined ? headerMap["claim_id"] : 0;
    const statusCol = headerMap["status"] !== undefined ? headerMap["status"] : 13;
    const updatedCol = headerMap["updated_at"] !== undefined ? headerMap["updated_at"] : 16;

    for (let i = 1; i < data.length; i++) {
      if ((data[i][idCol] || "").toString().trim() === claim_id) {
        sheetClaims.getRange(i + 1, statusCol + 1).setValue("verified");
        if (updatedCol < sheetClaims.getLastColumn()) {
          sheetClaims.getRange(i + 1, updatedCol + 1).setValue(new Date().toISOString());
        }
        SpreadsheetApp.flush();
        return jsonResponse({ success: true, message: "Klaim berhasil diverifikasi dan disetujui untuk transfer" });
      }
    }
    return jsonResponse({ success: false, error: "Klaim tidak ditemukan" });
  }

  // 14.11 REJECT CLAIM (Admin Only -> Status 'rejected' + Refund Poin)
  if (action === "rejectClaim") {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(15000);
    } catch (e) {
      return jsonResponse({ success: false, error: "Server sedang sibuk, silakan ulangi beberapa saat lagi." });
    }

    try {
      const claim_id = (params.claim_id || "").toString().trim();
      const catatan_admin = (params.catatan_admin || "Pengajuan klaim ditolak").toString().trim();
      if (!claim_id) return jsonResponse({ success: false, error: "Claim ID diperlukan" });

      const sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
      const sheetUsers = ss.getSheetByName("users");
      if (!sheetClaims) return jsonResponse({ success: false, error: "Tabel klaim tidak ditemukan" });

      const claimData = sheetClaims.getDataRange().getValues();
      const claimHeaderMap = getHeaderMap(sheetClaims);
      const cIdCol = claimHeaderMap["claim_id"] !== undefined ? claimHeaderMap["claim_id"] : 0;
      const cUserIdCol = claimHeaderMap["user_id"] !== undefined ? claimHeaderMap["user_id"] : 1;
      const cBesarCol = claimHeaderMap["besar_klaim"] !== undefined ? claimHeaderMap["besar_klaim"] : 5;
      const cStatusCol = claimHeaderMap["status"] !== undefined ? claimHeaderMap["status"] : 13;
      const cCatatanCol = claimHeaderMap["catatan_admin"] !== undefined ? claimHeaderMap["catatan_admin"] : 14;
      const cUpdatedCol = claimHeaderMap["updated_at"] !== undefined ? claimHeaderMap["updated_at"] : 16;

      let targetUser = "";
      let refundPoin = 0;
      let claimRowIdx = -1;

      for (let i = 1; i < claimData.length; i++) {
        if ((claimData[i][cIdCol] || "").toString().trim() === claim_id) {
          claimRowIdx = i + 1;
          targetUser = (claimData[i][cUserIdCol] || "").toString().trim();
          refundPoin = Number(claimData[i][cBesarCol]) || 0;
          break;
        }
      }

      if (claimRowIdx === -1) {
        return jsonResponse({ success: false, error: "Data klaim tidak ditemukan" });
      }

      // Update status klaim & catatan penolakan
      sheetClaims.getRange(claimRowIdx, cStatusCol + 1).setValue("rejected");
      sheetClaims.getRange(claimRowIdx, cCatatanCol + 1).setValue(catatan_admin);
      if (cUpdatedCol < sheetClaims.getLastColumn()) {
        sheetClaims.getRange(claimRowIdx, cUpdatedCol + 1).setValue(new Date().toISOString());
      }

      // Kembalikan poin ke saldo jamaah
      if (refundPoin > 0 && targetUser && sheetUsers) {
        const uData = sheetUsers.getDataRange().getValues();
        const uMap = getHeaderMap(sheetUsers);
        const uIdCol = uMap["user_id"] !== undefined ? uMap["user_id"] : 0;
        const uPoinCol = uMap["total_poin"] !== undefined ? uMap["total_poin"] : 4;

        for (let j = 1; j < uData.length; j++) {
          if ((uData[j][uIdCol] || "").toString().trim() === targetUser) {
            const currentPoin = Number(uData[j][uPoinCol]) || 0;
            sheetUsers.getRange(j + 1, uPoinCol + 1).setValue(currentPoin + refundPoin);
            break;
          }
        }
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        success: true,
        message: "Klaim berhasil ditolak dan saldo poin telah dikembalikan ke jamaah.",
        refunded_poin: refundPoin
      });
    } catch (err) {
      return jsonResponse({ success: false, error: "Gagal menolak klaim: " + err.toString() });
    } finally {
      lock.releaseLock();
    }
  }

  // 14.12 UPLOAD TRANSFER PROOF (Admin Only -> Status 'transferred')
  if (action === "uploadTransferProof") {
    const claim_id = (params.claim_id || "").toString().trim();
    const file_base64 = params.file_base64 || "";
    const file_name = params.file_name || ("bukti_tf_" + claim_id + ".jpg");

    if (!claim_id) return jsonResponse({ success: false, error: "Claim ID diperlukan" });
    if (!file_base64) return jsonResponse({ success: false, error: "File bukti transfer wajib diunggah" });

    const sheetClaims = getSheetCaseInsensitive(ss, "reimburst_claim");
    if (!sheetClaims) return jsonResponse({ success: false, error: "Tabel klaim tidak ditemukan" });
    const claimData = sheetClaims.getDataRange().getValues();
    const claimHeaderMap = getHeaderMap(sheetClaims);

    const cIdCol = claimHeaderMap["claim_id"] !== undefined ? claimHeaderMap["claim_id"] : 0;
    const cBuktiIdCol = claimHeaderMap["bukti_transfer_file_id"] !== undefined ? claimHeaderMap["bukti_transfer_file_id"] : 11;
    const cBuktiUrlCol = claimHeaderMap["bukti_transfer_url"] !== undefined ? claimHeaderMap["bukti_transfer_url"] : 12;
    const cStatusCol = claimHeaderMap["status"] !== undefined ? claimHeaderMap["status"] : 13;
    const cUpdatedCol = claimHeaderMap["updated_at"] !== undefined ? claimHeaderMap["updated_at"] : 16;

    let claimRowIdx = -1;
    for (let i = 1; i < claimData.length; i++) {
      if ((claimData[i][cIdCol] || "").toString().trim() === claim_id) {
        claimRowIdx = i + 1;
        break;
      }
    }

    if (claimRowIdx === -1) {
      return jsonResponse({ success: false, error: "Data klaim tidak ditemukan" });
    }

    // Upload bukti transfer ke Google Drive
    const uploadRes = saveBase64ToDrive(file_base64, file_name, "Reimburse Al Hijrah");
    if (!uploadRes.fileUrl) {
      return jsonResponse({ success: false, error: "Gagal menyimpan file ke Google Drive: " + (uploadRes.error || "Unknown error") });
    }

    // Update row klaim
    sheetClaims.getRange(claimRowIdx, cBuktiIdCol + 1).setValue(uploadRes.fileId);
    sheetClaims.getRange(claimRowIdx, cBuktiUrlCol + 1).setValue(uploadRes.fileUrl);
    sheetClaims.getRange(claimRowIdx, cStatusCol + 1).setValue("transferred");
    if (cUpdatedCol < sheetClaims.getLastColumn()) {
      sheetClaims.getRange(claimRowIdx, cUpdatedCol + 1).setValue(new Date().toISOString());
    }

    SpreadsheetApp.flush();
    return jsonResponse({
      success: true,
      message: "Bukti transfer berhasil disimpan. Status klaim kini Ditransfer.",
      data: {
        claim_id: claim_id,
        status: "transferred",
        bukti_transfer_url: uploadRes.fileUrl
      }
    });
  }
  
  return jsonResponse({ success: false, error: "Aksi '" + action + "' tidak dikenali" });
}
`;
