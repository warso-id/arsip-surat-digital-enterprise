# FAQ - Arsip Surat Digital Enterprise v3.2.2

## 📋 Daftar Isi
- [Umum](#umum)
- [Instalasi & Setup](#instalasi--setup)
- [Google Sheets](#google-sheets)
- [Google Apps Script](#google-apps-script)
- [Fitur](#fitur)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)

---

## Umum

### Q: Apa itu Arsip Surat Digital Enterprise?
**A:** Aplikasi manajemen surat berbasis web yang menggunakan Google Sheets sebagai database dan Google Apps Script sebagai backend. Dirancang untuk mengelola surat masuk, surat keluar, disposisi, dan approval secara digital.

### Q: Apakah aplikasi ini gratis?
**A:** Ya, aplikasi ini open-source dan gratis digunakan. Anda hanya perlu akun Google untuk Google Sheets dan Google Apps Script (gratis hingga kuota tertentu).

### Q: Apa perbedaan dengan aplikasi sejenis?
**A:** 
- **Tanpa server**: Tidak perlu VPS atau hosting mahal
- **Google Sheets**: Database yang familiar dan mudah dikelola
- **PWA**: Bisa diinstall seperti aplikasi native
- **Offline**: Tetap berfungsi tanpa internet
- **Base64 Encoding**: Keamanan data saat transmisi

### Q: Berapa kapasitas maksimal data?
**A:** Tergantung Google Sheets:
- 10 juta sel per spreadsheet
- Maksimal 200 sheet per spreadsheet
- Sekitar 50.000-100.000 surat (tergantung struktur data)

---

## Instalasi & Setup

### Q: Bagaimana cara install?
**A:**
1. Clone repository: `git clone https://github.com/warso-id/arsip-surat-digital-enterprise.git`
2. Copy `.env.example` ke `.env` dan isi konfigurasi
3. Deploy Google Apps Script (`code.gs`)
4. Setup Google Sheets dengan struktur yang benar
5. Deploy frontend ke GitHub Pages atau hosting lain

### Q: Apakah perlu Node.js?
**A:** Untuk development dan build ya (versi 16+). Untuk production (frontend), tidak perlu karena hasil build adalah file statis.

### Q: Bagaimana cara deploy ke Google Apps Script?
**A:**
1. Buka [script.google.com](https://script.google.com)
2. Buat project baru
3. Copy isi `code.gs` ke editor
4. Deploy sebagai Web App
5. Copy URL Web App ke `.env` (`GAS_API_URL`)

### Q: Bagaimana setup Google Sheets?
**A:**
1. Buat spreadsheet baru
2. Buat sheet dengan nama: SuratMasuk, SuratKeluar, Disposisi, Users, dll
3. Atur header kolom sesuai dokumentasi
4. Copy Spreadsheet ID dari URL ke `.env`

---

## Google Sheets

### Q: Kenapa pakai Google Sheets sebagai database?
**A:**
- **Gratis**: Tidak perlu biaya database
- **Familiar**: Interface spreadsheet yang dikenal
- **Kolaborasi**: Multi-user real-time
- **Backup**: Otomatis oleh Google
- **API**: Integrasi mudah via Google Apps Script

### Q: Apakah Google Sheets cukup cepat?
**A:** Untuk penggunaan normal (ratusan-ribuan data) cukup cepat. Optimasi:
- Gunakan indexing di kolom yang sering dicari
- Batasi data per halaman (pagination)
- Cache data di frontend
- Gunakan filter dan sorting server-side

### Q: Bagaimana jika data sudah sangat besar?
**A:** Beberapa strategi:
1. Arsipkan data lama ke sheet terpisah
2. Gunakan Google BigQuery untuk analitik
3. Migrasi ke database dedicated (PostgreSQL, MySQL)
4. Gunakan Google Cloud SQL

### Q: Apakah data aman di Google Sheets?
**A:** 
- Data dienkripsi oleh Google (at rest & in transit)
- Akses dibatasi oleh Google Apps Script
- Autentikasi menggunakan akun Google
- Audit log untuk semua perubahan

---

## Google Apps Script

### Q: Apa batasan Google Apps Script?
**A:**
- **Quota harian**: 20.000 request/hari (akun gratis)
- **Timeout**: 6 menit per eksekusi
- **Ukuran response**: Maksimal 50MB
- **Simultaneous**: 30 concurrent requests

### Q: Bagaimana jika melebihi quota?
**A:**
1. Upgrade ke Google Workspace (100.000+ request/hari)
2. Optimasi: kurangi request dengan caching
3. Batching: gabung beberapa operasi dalam 1 request
4. Gunakan beberapa script project

### Q: Apakah code.gs bisa dimodifikasi?
**A:** Ya, `code.gs` bisa dimodifikasi sesuai kebutuhan. Tapi file frontend dirancang untuk kompatibel dengan struktur API yang ada. Jika mengubah endpoint, sesuaikan juga `config.js`.

---

## Fitur

### Q: Apakah mendukung tanda tangan digital?
**A:** Ya, mendukung:
- Tanda tangan canvas (draw)
- Upload gambar tanda tangan
- QR Code verification
- Base64 encoded signature

### Q: Apakah ada fitur OCR?
**A:** Ya, menggunakan Tesseract.js untuk:
- Scan dokumen fisik
- Ekstrak teks dari gambar
- Auto-fill form dari hasil scan
- Mendukung bahasa Indonesia

### Q: Apakah ada AI features?
**A:** Ya, beberapa fitur AI:
- Auto-tagging surat
- Klasifikasi otomatis
- Rekomendasi disposisi
- Deteksi duplikat
- Smart search

### Q: Bagaimana cara export data?
**A:**
- **Excel**: Export ke .xlsx via SheetJS
- **PDF**: Generate PDF dari data
- **CSV**: Export format CSV
- **Google Sheets**: Direct access ke spreadsheet

### Q: Apakah mendukung multi-user?
**A:** Ya, dengan role-based access:
- **Admin**: Akses penuh
- **Kabid**: Akses bidang terkait
- **Kasubag**: Akses sub bagian
- **Staff**: Akses terbatas
- **Sekretaris**: Akses surat dan disposisi

---

## Keamanan

### Q: Apakah password disimpan dengan aman?
**A:** 
- Password di-hash di server (GAS)
- Tidak pernah disimpan di frontend/localStorage
- Transmisi via HTTPS + Base64 encoding
- Session timeout otomatis

### Q: Apakah data dienkripsi?
**A:**
- **In transit**: HTTPS + Base64
- **At rest**: Google encryption
- **File**: AES-GCM 256-bit
- **Token**: Base64 encoded

### Q: Bagaimana dengan CSRF/XSS?
**A:**
- **CSRF**: Token CSRF untuk setiap request
- **XSS**: Content Security Policy, validasi input
- **Injection**: Parameterized queries di GAS

### Q: Apakah ada 2FA?
**A:** Ya, mendukung:
- TOTP (Google Authenticator)
- SMS (via gateway)
- Biometric (WebAuthn)

---

## Troubleshooting

### Q: Aplikasi tidak bisa connect ke Google Sheets?
**A:** Cek:
1. URL di `.env` sudah benar
2. Google Apps Script sudah di-deploy sebagai Web App
3. Akses Web App diatur ke "Anyone" atau "Domain"
4. Quota GAS belum terlampaui
5. CORS enabled di GAS

### Q: Data tidak muncul di tabel?
**A:** Cek:
1. Nama sheet sudah sesuai dengan konfigurasi
2. Header kolom sudah benar
3. Data ada di sheet yang benar
4. Format data sesuai yang diharapkan
5. Cek browser console untuk error

### Q: Login gagal terus?
**A:** Cek:
1. Username dan password benar
2. User ada di sheet Users
3. Status user "aktif"
4. Tidak ada session yang bentrok
5. Clear cache browser

### Q: Aplikasi lambat?
**A:** Optimasi:
1. Aktifkan caching di `.env`
2. Kurangi data per halaman (pagination)
3. Gunakan filter untuk membatasi data
4. Minify assets untuk production
5. Gunakan CDN untuk static assets

### Q: Error "Base64 decode failed"?
**A:** 
1. Cek encoding di client dan server konsisten
2. Pastikan data tidak corrupt saat transmisi
3. Cek ukuran payload tidak melebihi batas
4. Validasi Base64 string sebelum decode

### Q: Bagaimana cara backup data?
**A:**
1. **Otomatis**: Google Sheets auto-save
2. **Manual**: Download spreadsheet
3. **Script**: `node tools/backup.js`
4. **Scheduled**: Setup trigger di GAS

### Q: Bagaimana cara update aplikasi?
**A:**
1. Pull latest dari repository
2. Update `.env` jika ada perubahan
3. Deploy ulang GAS jika `code.gs` berubah
4. Build ulang frontend: `npm run build`
5. Deploy frontend ke hosting

---

## Kontak & Bantuan

- **GitHub Issues**: [github.com/warso-id/arsip-surat-digital-enterprise/issues](https://github.com/warso-id/arsip-surat-digital-enterprise/issues)
- **Dokumentasi Lengkap**: [docs/](https://github.com/warso-id/arsip-surat-digital-enterprise/tree/main/docs)
- **Wiki**: [github.com/warso-id/arsip-surat-digital-enterprise/wiki](https://github.com/warso-id/arsip-surat-digital-enterprise/wiki)

---

**Versi**: 3.2.2 | **Terakhir diupdate**: 2026-07-12
