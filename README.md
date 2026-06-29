# 📄 Submit Jurnal - Form Upload Bukti & LoA

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-production-success)

Form akademik modern untuk mengunggah **Bukti Submit Jurnal** dan **Letter of Acceptance (LoA)**. Dilengkapi validasi NIM, preview dokumen, pemfolderan otomatis per semester, dan pencatatan ke Google Spreadsheet.

---

## 🌐 Demo & Akses

| Environment | URL |
|-------------|-----|
| **Production** | [https://username.github.io/submit-jurnal](https://username.github.io/submit-jurnal) |
| **Google Apps Script** | `https://script.google.com/macros/s/.../exec` |

---

## ✨ Fitur Utama

### 📋 **Form Input**
- ✅ **Nama Lengkap** (Opsional)
- ✅ **NIM** - Validasi wajib (9 digit + mengandung "03")
- ✅ **Judul Tesis** (Opsional)
- ✅ **Judul Artikel** (Opsional)
- ✅ **Upload Bukti Submit Jurnal** (PDF/JPG/PNG, maks 10MB)
- ✅ **Link Sinta / Akreditasi Jurnal** (Opsional)
- ✅ **Upload Dokumen LoA** (PDF/JPG/PNG, maks 10MB)
- ✅ **Nama Jurnal** (Opsional)
- ✅ **Link Jurnal LoA** (Opsional)

### 🎨 **User Interface**
- ✅ **Responsive Design** - Desktop, Tablet, Mobile
- ✅ **Dark Mode** - Otomatis mengikuti preferensi sistem
- ✅ **Glassmorphism** - Efek kaca modern
- ✅ **Animasi Dinamis** - Floating orbs, sparkle particles
- ✅ **Preview Dokumen** - Gambar & PDF langsung terlihat
- ✅ **Drag & Drop** - Upload file dengan drag
- ✅ **Toast Notification** - Notifikasi sukses/error
- ✅ **Loading Spinner** - Indikator proses upload
- ✅ **Ripple Effect** - Efek klik pada tombol
- ✅ **Modal Sukses** - Konfirmasi upload berhasil

### 🔒 **Keamanan**
- ✅ **Validasi Client-side** - NIM & file format
- ✅ **Validasi Server-side** - Google Apps Script
- ✅ **Sanitasi Input** - Mencegah XSS
- ✅ **ID Tersembunyi** - Folder & Spreadsheet ID di backend
- ✅ **Rate Limiting** - Google Apps Script quota
- ✅ **File Type Check** - Hanya PDF, JPG, PNG
- ✅ **File Size Limit** - Maks 10MB per file

### ☁️ **Backend (Google Apps Script)**
- ✅ **Pemfolderan Otomatis** - Per semester (Ganjil/Genap)
- ✅ **Penamaan File** - Format: `NamaLengkap-NIM-NamaFile.ext`
- ✅ **Spreadsheet Logging** - 16 kolom data tercatat
- ✅ **Auto Header** - Styling ungu profesional
- ✅ **File Sharing** - Anyone with link can view
- ✅ **Offline Fallback** - Simpan ke localStorage jika offline

---

## 📸 Screenshot

### Desktop View
