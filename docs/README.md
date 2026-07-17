# 📁 Arsip Surat Digital Enterprise 2026

![Version](https://img.shields.io/badge/version-2026.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0-brightgreen.svg)
![PWA](https://img.shields.io/badge/PWA-ready-purple.svg)

Sistem Manajemen Arsip Surat Digital Enterprise - Solusi lengkap untuk pengelolaan surat masuk, surat keluar, dan disposisi dengan dukungan PWA dan integrasi Google Apps Script.

## ✨ Fitur Utama

### 📥 Manajemen Surat Masuk
- CRUD lengkap surat masuk
- Upload dan download lampiran
- Kategorisasi surat
- Tracking status surat
- Pencarian dan filter advanced

### 📤 Manajemen Surat Keluar
- Pembuatan surat keluar
- Template surat dinamis
- Export ke PDF/DOC
- Tracking pengiriman

### 📋 Manajemen Disposisi
- Pembuatan disposisi
- Multi-level disposisi
- Tracking status disposisi
- Notifikasi real-time
- Batas waktu dan reminder

### 📊 Dashboard & Laporan
- Dashboard interaktif
- Grafik dan chart
- Laporan periode
- Export Excel/PDF
- Statistik real-time

### 👥 Manajemen Pengguna
- Role-based access control
- Manajemen profil
- Audit log
- Activity tracking

### 🔒 Keamanan
- Autentikasi JWT
- Enkripsi Base64
- Rate limiting
- CORS protection
- Input validation
- XSS prevention

### 📱 PWA Support
- Offline capability
- Push notifications
- Background sync
- Installable app
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0
- NPM >= 9.0
- Google Apps Script account

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/arsip-surat-digital-enterprise.git
cd arsip-surat-digital-enterprise

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run setup script
bash tools/setup.sh

# Start development server
npm run dev
