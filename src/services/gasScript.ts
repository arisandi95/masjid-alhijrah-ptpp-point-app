/**
 * Google Apps Script (Code.gs) template for Masjid Al Hijrah PTPP
 * This code can be copied into Google Apps Script connected to the Google Spreadsheet.
 */
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * BACKEND GOOGLE APPS SCRIPT - MASJID AL HIJRAH PTPP
 * Absensi & Poin Kajian via QR Code
 * 
 * Petunjuk Deploy:
 * 1. Buka spreadsheet Google Sheets (script otomatis menyiapkan 4 sheet: "users", "master_event", "scan_log", dan "penilaian_acara")
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
  }
  
  // 2. Sheet master_event
  let sheetEvent = ss.getSheetByName("master_event");
  if (!sheetEvent) {
    sheetEvent = ss.insertSheet("master_event");
    sheetEvent.appendRow(["event_id", "nama_event", "tanggal", "qr_token", "poin_value", "status", "pemateri", "waktu", "lokasi", "event_type", "kuota", "created_at"]);
  } else {
    // Auto-migrate master_event headers jika kolom pemateri, waktu, lokasi, event_type, atau kuota belum ada
    const lastCol = sheetEvent.getLastColumn() || 1;
    const headers = sheetEvent.getRange(1, 1, 1, lastCol).getValues()[0];
    const headerLower = headers.map(h => (h || "").toString().toLowerCase().trim());
    
    if (!headerLower.includes("pemateri")) {
      sheetEvent.getRange(1, sheetEvent.getLastColumn() + 1).setValue("pemateri");
    }
    if (!headerLower.includes("waktu")) {
      sheetEvent.getRange(1, sheetEvent.getLastColumn() + 1).setValue("waktu");
    }
    if (!headerLower.includes("lokasi")) {
      sheetEvent.getRange(1, sheetEvent.getLastColumn() + 1).setValue("lokasi");
    }
    if (!headerLower.includes("event_type")) {
      sheetEvent.getRange(1, sheetEvent.getLastColumn() + 1).setValue("event_type");
    }
    if (!headerLower.includes("kuota")) {
      sheetEvent.getRange(1, sheetEvent.getLastColumn() + 1).setValue("kuota");
    }
  }
  
  // 3. Sheet scan_log
  let sheetLog = ss.getSheetByName("scan_log");
  if (!sheetLog) {
    sheetLog = ss.insertSheet("scan_log");
    sheetLog.appendRow(["log_id", "user_id", "event_id", "poin_didapat", "scanned_at"]);
  }

  // 4. Sheet penilaian_acara (Ulasan & Rating Jamaah)
  let sheetReview = ss.getSheetByName("penilaian_acara");
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
  }
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
  
  if (action === "ping") {
    return jsonResponse({ success: true, message: "Apps Script Masjid Al Hijrah Aktif", timestamp: new Date().toISOString() });
  }
  
  // 1. REGISTER
  if (action === "register") {
    const nama = (params.nama || "").toString().trim();
    const rawNoHp = params.no_hp || "";
    const pin = (params.pin || "").toString().trim();
    const email = (params.email || "").toString().trim();
    const tanggal_lahir = (params.tanggal_lahir || "").toString().trim();
    const jenis_kelamin = (params.jenis_kelamin || "pria").toString().toLowerCase().trim();
    const status_jamaah = (params.status_jamaah || "Umum").toString().trim();
    const role = (params.role || "user").toString().toLowerCase() === "admin" ? "admin" : "user";
    
    if (!nama || !rawNoHp || !pin) {
      return jsonResponse({ success: false, error: "Nama, nomor HP, dan PIN wajib diisi" });
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
    
    // Pastikan kolom baru email, tanggal_lahir, jenis_kelamin, status_jamaah, role tersedia di header
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
    if (userHeaderMap["role"] === undefined) {
      const newCol = sheetUsers.getLastColumn() + 1;
      sheetUsers.getRange(1, newCol).setValue("role");
      userHeaderMap["role"] = newCol - 1;
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
    // PIN DISIMPAN PLAIN TEXT (TIDAK DIENKRIPSI) SESUAI INSTRUKSI
    const pinCol = userHeaderMap["pin"] !== undefined ? userHeaderMap["pin"] : 3;
    rowData[pinCol] = pin;
    const poinCol = userHeaderMap["total_poin"] !== undefined ? userHeaderMap["total_poin"] : 4;
    rowData[poinCol] = total_poin;
    const roleCol = userHeaderMap["role"] !== undefined ? userHeaderMap["role"] : 5;
    rowData[roleCol] = role;
    const createdCol = userHeaderMap["created_at"] !== undefined ? userHeaderMap["created_at"] : 6;
    if (createdCol < totalCols) rowData[createdCol] = created_at;
    
    sheetUsers.appendRow(rowData);
    
    return jsonResponse({
      success: true,
      message: "Registrasi berhasil",
      data: {
        user_id: user_id,
        nama: nama,
        no_hp: no_hp,
        email: email,
        tanggal_lahir: tanggal_lahir,
        jenis_kelamin: jenis_kelamin,
        status_jamaah: status_jamaah,
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
              email: emailCol !== undefined ? (data[i][emailCol] || "").toString() : "",
              tanggal_lahir: tglCol !== undefined ? (data[i][tglCol] || "").toString() : "",
              jenis_kelamin: jkCol !== undefined ? (data[i][jkCol] || "pria").toString() : "pria",
              status_jamaah: statusCol !== undefined ? (data[i][statusCol] || "Umum").toString() : "Umum",
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
  
  // 2.5. VALIDATE QR (Pre-check sebelum isi form penilaian)
  if (action === "validateQR") {
    const user_id = params.user_id;
    const qr_token = (params.qr_token || "").trim();
    if (!user_id || !qr_token) {
      return jsonResponse({ success: false, error: "User ID dan Token QR diperlukan" });
    }
    const sheetEvents = ss.getSheetByName("master_event");
    const sheetLogs = ss.getSheetByName("scan_log");
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const eventRows = sheetEvents.getDataRange().getValues();
    const qrCol = eventHeaderMap["qr_token"] !== undefined ? eventHeaderMap["qr_token"] : 3;
    const idCol = eventHeaderMap["event_id"] !== undefined ? eventHeaderMap["event_id"] : 0;
    const namaCol = eventHeaderMap["nama_event"] !== undefined ? eventHeaderMap["nama_event"] : 1;
    const tglCol = eventHeaderMap["tanggal"] !== undefined ? eventHeaderMap["tanggal"] : 2;
    const poinCol = eventHeaderMap["poin_value"] !== undefined ? eventHeaderMap["poin_value"] : 4;
    const statusCol = eventHeaderMap["status"] !== undefined ? eventHeaderMap["status"] : 5;
    const pemateriCol = eventHeaderMap["pemateri"] !== undefined ? eventHeaderMap["pemateri"] : 6;
    const waktuCol = eventHeaderMap["waktu"] !== undefined ? eventHeaderMap["waktu"] : 7;
    const lokasiCol = eventHeaderMap["lokasi"] !== undefined ? eventHeaderMap["lokasi"] : 8;
    const eventTypeCol = eventHeaderMap["event_type"];
    const kuotaCol = eventHeaderMap["kuota"];

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
    
    const sheetEvents = ss.getSheetByName("master_event");
    const sheetLogs = ss.getSheetByName("scan_log");
    const sheetUsers = ss.getSheetByName("users");
    
    // a. Cari event by qr_token
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const eventRows = sheetEvents.getDataRange().getValues();
    let targetEvent = null;
    
    const qrCol = eventHeaderMap["qr_token"] !== undefined ? eventHeaderMap["qr_token"] : 3;
    const idCol = eventHeaderMap["event_id"] !== undefined ? eventHeaderMap["event_id"] : 0;
    const namaCol = eventHeaderMap["nama_event"] !== undefined ? eventHeaderMap["nama_event"] : 1;
    const tglCol = eventHeaderMap["tanggal"] !== undefined ? eventHeaderMap["tanggal"] : 2;
    const poinCol = eventHeaderMap["poin_value"] !== undefined ? eventHeaderMap["poin_value"] : 4;
    const statusCol = eventHeaderMap["status"] !== undefined ? eventHeaderMap["status"] : 5;
    const pemateriCol = eventHeaderMap["pemateri"] !== undefined ? eventHeaderMap["pemateri"] : 6;
    const waktuCol = eventHeaderMap["waktu"] !== undefined ? eventHeaderMap["waktu"] : 7;
    const lokasiCol = eventHeaderMap["lokasi"] !== undefined ? eventHeaderMap["lokasi"] : 8;
    const eventTypeCol = eventHeaderMap["event_type"];
    const kuotaCol = eventHeaderMap["kuota"];

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
    if (!isRedeem && targetEvent.kuota && targetEvent.kuota > 0) {
      let claimedCount = 0;
      for (let i = 1; i < logRows.length; i++) {
        const logEvId = (logRows[i][2] || "").toString();
        const logPoint = Number(logRows[i][3]) || 0;
        if (logEvId === targetEvent.event_id && logPoint > 0) {
          claimedCount++;
        }
      }
      if (claimedCount >= targetEvent.kuota) {
        isQuotaFull = true;
      } else {
        sisaKuota = targetEvent.kuota - (claimedCount + 1);
      }
    }

    const poinDelta = isRedeem ? -targetEvent.poin_value : isQuotaFull ? 0 : targetEvent.poin_value;
    const newTotalPoin = currentPoin + poinDelta;
    
    // d. Catat ke scan_log
    const log_id = generateUUID();
    const scanned_at = new Date().toISOString();
    sheetLogs.appendRow([log_id, user_id, targetEvent.event_id, poinDelta, scanned_at]);
    
    // e. Update total_poin di users secara dinamis jika ada perubahan poin
    if (poinDelta !== 0) {
      sheetUsers.getRange(userRowIdx, poinColUser + 1).setValue(newTotalPoin);
    }

    // f. Simpan Penilaian Acara (Feedback) jika ada
    const sheetReviews = ss.getSheetByName("penilaian_acara");
    if (sheetReviews && (params.skor_materi !== undefined || params.review)) {
      const revObj = params.review || params;
      const skor_materi = Number(revObj.skor_materi) || 5;
      const skor_kenyamanan = Number(revObj.skor_kenyamanan) || 5;
      const skor_sound = Number(revObj.skor_sound) || 5;
      const skor_panitia = Number(revObj.skor_panitia) || 5;
      const kesan_terbaik = (revObj.kesan_terbaik || "").toString().trim();
      const hal_kurang = (revObj.hal_kurang || "").toString().trim();
      const usulan_kegiatan = (revObj.usulan_kegiatan || "").toString().trim();
      const nameColUser = userHeaderMap["nama"] !== undefined ? userHeaderMap["nama"] : 1;
      const userName = (userRows[userRowIdx - 1] && userRows[userRowIdx - 1][nameColUser]) || "Jamaah";
      const review_id = generateUUID();

      sheetReviews.appendRow([
        review_id,
        user_id,
        targetEvent.event_id,
        userName,
        targetEvent.nama_event,
        skor_materi,
        skor_kenyamanan,
        skor_sound,
        skor_panitia,
        kesan_terbaik,
        hal_kurang,
        usulan_kegiatan,
        scanned_at
      ]);
    }
    
    const successMsg = isRedeem
      ? "Penukaran berhasil! " + targetEvent.poin_value + " poin telah dipotong untuk '" + targetEvent.nama_event + "'. Sisa poin Anda: " + newTotalPoin + " poin."
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
            email: emailCol !== undefined ? (data[i][emailCol] || "").toString() : "",
            tanggal_lahir: tglCol !== undefined ? (data[i][tglCol] || "").toString() : "",
            jenis_kelamin: jkCol !== undefined ? (data[i][jkCol] || "pria").toString() : "pria",
            status_jamaah: statusCol !== undefined ? (data[i][statusCol] || "Umum").toString() : "Umum",
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
    
    const sheetLogs = ss.getSheetByName("scan_log");
    const sheetEvents = ss.getSheetByName("master_event");
    
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
  
  // 6. GET EVENTS (Admin & Home preview)
  if (action === "getEvents") {
    const sheetEvents = ss.getSheetByName("master_event");
    const eventHeaderMap = getHeaderMap(sheetEvents);
    const eventRows = sheetEvents.getDataRange().getValues();
    const events = [];

    const idIdx = eventHeaderMap["event_id"] !== undefined ? eventHeaderMap["event_id"] : 0;
    const namaIdx = eventHeaderMap["nama_event"] !== undefined ? eventHeaderMap["nama_event"] : 1;
    const tglIdx = eventHeaderMap["tanggal"] !== undefined ? eventHeaderMap["tanggal"] : 2;
    const qrIdx = eventHeaderMap["qr_token"] !== undefined ? eventHeaderMap["qr_token"] : 3;
    const poinIdx = eventHeaderMap["poin_value"] !== undefined ? eventHeaderMap["poin_value"] : 4;
    const statusIdx = eventHeaderMap["status"] !== undefined ? eventHeaderMap["status"] : 5;
    const pemateriIdx = eventHeaderMap["pemateri"];
    const waktuIdx = eventHeaderMap["waktu"];
    const lokasiIdx = eventHeaderMap["lokasi"];
    const eventTypeIdx = eventHeaderMap["event_type"];
    const kuotaIdx = eventHeaderMap["kuota"];
    const createdIdx = eventHeaderMap["created_at"];
    
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
    const nama_event = params.nama_event || "Kajian Rutin Masjid Al Hijrah";
    const tanggal = params.tanggal || new Date().toISOString().split("T")[0];
    const poin_value = Number(params.poin_value) || 25;
    const status = params.status || "active";
    const event_type = (params.event_type || "append").toString().toLowerCase().trim() === "redeem" ? "redeem" : "append";
    const pemateri = (params.pemateri || "").toString().trim();
    const waktu = (params.waktu || "").toString().trim();
    const lokasi = (params.lokasi || "").toString().trim();
    const kuota = params.kuota !== undefined && params.kuota !== "" ? Number(params.kuota) : "";
    
    // Generate secure random QR token (misal: HIJRAH-xxx-xxx)
    const randomSuffix = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const qr_token = params.qr_token || ("HIJRAH-" + randomSuffix);
    
    const event_id = generateUUID();
    const created_at = new Date().toISOString();
    
    const sheetEvents = ss.getSheetByName("master_event");
    const eventHeaderMap = getHeaderMap(sheetEvents);

    // Pastikan kolom pemateri, waktu, lokasi, event_type, kuota tersedia di header tabel
    if (eventHeaderMap["pemateri"] === undefined) {
      const newCol = sheetEvents.getLastColumn() + 1;
      sheetEvents.getRange(1, newCol).setValue("pemateri");
      eventHeaderMap["pemateri"] = newCol - 1;
    }
    if (eventHeaderMap["waktu"] === undefined) {
      const newCol = sheetEvents.getLastColumn() + 1;
      sheetEvents.getRange(1, newCol).setValue("waktu");
      eventHeaderMap["waktu"] = newCol - 1;
    }
    if (eventHeaderMap["lokasi"] === undefined) {
      const newCol = sheetEvents.getLastColumn() + 1;
      sheetEvents.getRange(1, newCol).setValue("lokasi");
      eventHeaderMap["lokasi"] = newCol - 1;
    }
    if (eventHeaderMap["event_type"] === undefined) {
      const newCol = sheetEvents.getLastColumn() + 1;
      sheetEvents.getRange(1, newCol).setValue("event_type");
      eventHeaderMap["event_type"] = newCol - 1;
    }
    if (eventHeaderMap["kuota"] === undefined) {
      const newCol = sheetEvents.getLastColumn() + 1;
      sheetEvents.getRange(1, newCol).setValue("kuota");
      eventHeaderMap["kuota"] = newCol - 1;
    }

    const totalCols = sheetEvents.getLastColumn();
    const rowData = new Array(totalCols).fill("");

    rowData[eventHeaderMap["event_id"] !== undefined ? eventHeaderMap["event_id"] : 0] = event_id;
    rowData[eventHeaderMap["nama_event"] !== undefined ? eventHeaderMap["nama_event"] : 1] = nama_event;
    rowData[eventHeaderMap["tanggal"] !== undefined ? eventHeaderMap["tanggal"] : 2] = tanggal;
    rowData[eventHeaderMap["qr_token"] !== undefined ? eventHeaderMap["qr_token"] : 3] = qr_token;
    rowData[eventHeaderMap["poin_value"] !== undefined ? eventHeaderMap["poin_value"] : 4] = poin_value;
    rowData[eventHeaderMap["status"] !== undefined ? eventHeaderMap["status"] : 5] = status;
    rowData[eventHeaderMap["pemateri"]] = pemateri;
    rowData[eventHeaderMap["waktu"]] = waktu;
    rowData[eventHeaderMap["lokasi"]] = lokasi;
    rowData[eventHeaderMap["event_type"]] = event_type;
    rowData[eventHeaderMap["kuota"]] = kuota;
    if (eventHeaderMap["created_at"] !== undefined) {
      rowData[eventHeaderMap["created_at"]] = created_at;
    }

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
  
  // 8. GET LEADERBOARD / DAFTAR JAMAAH
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
    const sheetReviews = ss.getSheetByName("penilaian_acara");
    if (!sheetReviews) {
      return jsonResponse({ success: true, data: [] });
    }
    const data = sheetReviews.getDataRange().getValues();
    if (data.length <= 1) {
      return jsonResponse({ success: true, data: [] });
    }
    const reviewHeaderMap = getHeaderMap(sheetReviews);
    const reviewsList = [];
    for (let i = 1; i < data.length; i++) {
      reviewsList.push({
        review_id: (data[i][reviewHeaderMap["review_id"] !== undefined ? reviewHeaderMap["review_id"] : 0] || "").toString(),
        user_id: (data[i][reviewHeaderMap["user_id"] !== undefined ? reviewHeaderMap["user_id"] : 1] || "").toString(),
        event_id: (data[i][reviewHeaderMap["event_id"] !== undefined ? reviewHeaderMap["event_id"] : 2] || "").toString(),
        nama_jamaah: (data[i][reviewHeaderMap["nama_jamaah"] !== undefined ? reviewHeaderMap["nama_jamaah"] : 3] || "").toString(),
        nama_event: (data[i][reviewHeaderMap["nama_event"] !== undefined ? reviewHeaderMap["nama_event"] : 4] || "").toString(),
        skor_materi: Number(data[i][reviewHeaderMap["skor_materi"] !== undefined ? reviewHeaderMap["skor_materi"] : 5]) || 5,
        skor_kenyamanan: Number(data[i][reviewHeaderMap["skor_kenyamanan"] !== undefined ? reviewHeaderMap["skor_kenyamanan"] : 6]) || 5,
        skor_sound: Number(data[i][reviewHeaderMap["skor_sound"] !== undefined ? reviewHeaderMap["skor_sound"] : 7]) || 5,
        skor_panitia: Number(data[i][reviewHeaderMap["skor_panitia"] !== undefined ? reviewHeaderMap["skor_panitia"] : 8]) || 5,
        kesan_terbaik: (data[i][reviewHeaderMap["kesan_terbaik"] !== undefined ? reviewHeaderMap["kesan_terbaik"] : 9] || "").toString(),
        hal_kurang: (data[i][reviewHeaderMap["hal_kurang"] !== undefined ? reviewHeaderMap["hal_kurang"] : 10] || "").toString(),
        usulan_kegiatan: (data[i][reviewHeaderMap["usulan_kegiatan"] !== undefined ? reviewHeaderMap["usulan_kegiatan"] : 11] || "").toString(),
        submitted_at: (data[i][reviewHeaderMap["submitted_at"] !== undefined ? reviewHeaderMap["submitted_at"] : 12] || "").toString()
      });
    }
    // Sort descending by submitted_at
    reviewsList.reverse();
    return jsonResponse({ success: true, data: reviewsList });
  }
  
  return jsonResponse({ success: false, error: "Aksi '" + action + "' tidak dikenali" });
}
`;
