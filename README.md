# 📄 Arsip Surat Digital Enterprise

![Version](https://img.shields.io/badge/version-2026.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-ready-purple)

**Sistem Manajemen Arsip Surat Digital Enterprise** dengan dukungan **Google Spreadsheet** dan **Base64 Encoding** untuk keamanan data.

---

## ✨ Fitur Utama

### 🔐 Keamanan Enterprise
- **Base64 Encoding** untuk data sensitif
- Enkripsi data sebelum penyimpanan
- Session management dengan timeout
- Rate limiting untuk login attempts
- Role-based access control

### 📱 Progressive Web App (PWA)
- **Offline-first** architecture
- Installable di desktop & mobile
- Background sync saat online
- Push notifications
- Cache management otomatis

### 📊 Integrasi Google Spreadsheet
- CRUD operations via Google Apps Script
- Real-time sync dengan spreadsheet
- Batch processing untuk bulk operations
- Auto-retry untuk failed requests

### 💾 Local Database
- **IndexedDB** untuk penyimpanan lokal
- Sync queue untuk offline operations
- Data export/import (backup & restore)
- Automatic conflict resolution

### 🎨 User Interface
- Material Design 3
- Responsive (mobile, tablet, desktop)
- Dark mode support
- Print-friendly layouts
- Keyboard shortcuts

---

## 🚀 Quick Start

### Prerequisites
- Web server (Apache/Nginx)
- HTTPS (required for PWA)
- Google Account (untuk Google Sheets)
- Browser modern (Chrome 90+, Firefox 90+, Safari 14+)

### Instalasi

1. **Clone repository:**
```bash
git clone https://github.com/warso-id/arsip-surat-digital-enterprise.git
cd arsip-surat-digital-enterprise
