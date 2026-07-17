# ❓ Frequently Asked Questions (FAQ)

## Umum

### Apa itu Arsip Surat Digital Enterprise?
Arsip Surat Digital Enterprise adalah sistem manajemen arsip surat digital yang dirancang untuk mengelola surat masuk, surat keluar, dan disposisi secara elektronik dengan dukungan PWA (Progressive Web App).

### Apa saja fitur utama?
- Manajemen surat masuk dan keluar
- Sistem disposisi multi-level
- Dashboard dengan statistik real-time
- Pencarian advanced
- Laporan dan export data
- Notifikasi real-time
- Offline support (PWA)
- Multi-user dengan role-based access

### Apa persyaratan sistem?
- Browser modern (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Koneksi internet (untuk sinkronisasi data)
- Node.js 18+ (untuk development)
- Google Apps Script account (untuk backend)

## Instalasi

### Bagaimana cara instalasi?
Lihat [Panduan Instalasi](INSTALLATION.md) untuk langkah-langkah detail.

### Apakah perlu server khusus?
Tidak. Sistem ini menggunakan Google Apps Script sebagai backend, sehingga tidak memerlukan server khusus. Frontend dapat dihosting di Netlify, GitHub Pages, atau server static lainnya.

### Bagaimana cara konfigurasi Google Apps Script?
1. Buat Google Apps Script baru
2. Deploy sebagai Web App
3. Copy URL deployment
4. Masukkan URL ke file `.env`

## Penggunaan

### Bagaimana cara login pertama kali?
Gunakan kredensial default:
- Email: `admin@enterprise.com`
- Password: `admin123`
- **Penting:** Segera ganti password setelah login pertama!

### Bagaimana cara menambah surat masuk?
1. Klik menu "Surat Masuk"
2. Klik tombol "+ Tambah Surat Masuk"
3. Isi formulir
4. Upload file lampiran (opsional)
5. Klik "Simpan"

### Bagaimana cara membuat disposisi?
1. Buka detail surat masuk
2. Klik tombol "Disposisi"
3. Pilih penerima disposisi
4. Tulis instruksi
5. Tentukan batas waktu
6. Klik "Simpan"

### Apakah bisa digunakan offline?
Ya! Sistem ini memiliki fitur PWA yang memungkinkan penggunaan offline. Data akan disinkronkan saat koneksi internet tersedia kembali.

## Keamanan

### Apakah data aman?
Ya. Semua data dienkripsi menggunakan Base64 encoding sebelum dikirim. Sistem juga dilengkapi dengan:
- JWT authentication
- Role-based access control
- Rate limiting
- Input validation
- XSS protection

### Bagaimana cara mengganti password?
1. Klik foto profil di header
2. Pilih "Profil"
3. Klik "Ganti Password"
4. Masukkan password lama dan baru
5. Simpan

### Apa yang terjadi jika lupa password?
1. Klik "Lupa Password?" di halaman login
2. Masukkan email terdaftar
3. Cek email untuk link reset password
4. Ikuti instruksi di email

## Troubleshooting

### Aplikasi tidak bisa dibuka
1. Periksa koneksi internet
2. Clear cache browser
3. Coba browser lain
4. Periksa apakah URL sudah benar

### Data tidak muncul
1. Refresh halaman
2. Periksa koneksi internet
3. Cek console browser untuk error
4. Hubungi administrator

### Error "CORS policy"
1. Pastikan Google Apps Script sudah dideploy sebagai Web App
2. Pastikan akses "Anyone" sudah diatur
3. Periksa URL di file `.env`

### Tidak bisa upload file
1. Periksa ukuran file (max 10MB)
2. Periksa tipe file yang diizinkan
3. Pastikan koneksi internet stabil

## Teknis

### Teknologi apa yang digunakan?
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **PWA:** Service Worker, Manifest, IndexedDB
- **Backend:** Google Apps Script
- **Database:** Google Sheets (via Apps Script)
- **Build:** Webpack, Babel
- **Testing:** Jest
- **CI/CD:** GitHub Actions

### Bagaimana cara berkontribusi?
Lihat [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

### Bagaimana melaporkan bug?
Buat issue baru di GitHub dengan template bug report.

### Apakah ada API documentation?
Ya, lihat [API_DOCUMENTATION.md](API_DOCUMENTATION.md) untuk dokumentasi API lengkap.
