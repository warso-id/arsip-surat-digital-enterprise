# ❓ Frequently Asked Questions (FAQ)

## Umum

### Apa itu Arsip Surat Digital Enterprise?
Arsip Surat Digital Enterprise adalah sistem manajemen arsip surat berbasis web yang dirancang untuk membantu perusahaan dan instansi pemerintah dalam mengelola surat masuk, surat keluar, dan disposisi secara digital.

### Apakah sistem ini gratis?
Ya! Sistem ini sepenuhnya gratis dan open source di bawah MIT License. Anda bebas menggunakan, memodifikasi, dan mendistribusikannya.

### Apa saja fitur utama?
- Manajemen surat masuk & keluar
- Disposisi digital multi-level
- Pencarian full-text
- Laporan & statistik
- Multi-instansi
- PWA (Progressive Web App)
- RESTful API
- QR Code verifikasi
- Audit trail

---

## Instalasi

### Bagaimana cara instalasi?
Lihat [Panduan Instalasi](./INSTALLATION.md) untuk detail lengkap. Secara singkat:
```bash
git clone https://github.com/warso-id/arsip-surat-digital-enterprise.git
cd arsip-surat-digital-enterprise
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
