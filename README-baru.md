# Arsip Surat Digital Enterprise

Sistem Manajemen Arsip Surat Digital Enterprise adalah aplikasi berbasis web untuk mengelola arsip surat masuk dan keluar secara digital. Aplikasi ini dilengkapi dengan fitur PWA (Progressive Web App) sehingga dapat diinstal di perangkat mobile maupun desktop.

## Fitur Utama

- 📨 **Manajemen Surat Masuk** - Kelola surat masuk dengan nomor agenda otomatis
- 📤 **Manajemen Surat Keluar** - Kelola surat keluar dengan template
- 🔄 **Disposisi Surat** - Sistem disposisi berjenjang dengan notifikasi
- 📊 **Dashboard & Laporan** - Visualisasi data dan laporan yang dapat diexport
- 🔍 **Pencarian Cepat** - Cari surat berdasarkan berbagai kriteria
- 📱 **PWA Support** - Dapat diinstal sebagai aplikasi native
- 🔐 **Multi Role Access** - Sistem hak akses berbasis role
- 📧 **Notifikasi Email** - Pemberitahuan otomatis via email
- 💾 **Backup Otomatis** - Backup database dan file secara berkala

## Teknologi

- **Backend**: Node.js, Express.js
- **Database**: MySQL dengan Sequelize ORM
- **Frontend**: EJS Templates, Bootstrap 5
- **Charts**: Chart.js
- **PDF**: PDFKit
- **Excel**: ExcelJS
- **Authentication**: JWT
- **Container**: Docker

## Prasyarat

- Node.js 16.x atau lebih tinggi
- MySQL 8.0 atau lebih tinggi
- Docker (opsional)
- npm atau yarn

## Instalasi

### Menggunakan Docker (Direkomendasikan)

```bash
# Clone repository
git clone https://github.com/yourusername/arsip-surat-digital.git
cd arsip-surat-digital

# Copy environment file
cp .env.example .env

# Build dan jalankan container
docker-compose up -d

# Jalankan migrasi dan seeder
docker-compose exec app npm run migrate
docker-compose exec app npm run seed
