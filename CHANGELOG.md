# 📝 Changelog

Semua perubahan penting pada proyek ini akan dicatat di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/).

## [2.1.0] - 2024-01-15

### ✨ Ditambahkan
- Fitur QR Code untuk verifikasi surat
- Real-time notification system
- Advanced search dengan multiple filters
- Backup otomatis database
- Tracking disposisi dengan timeline visual
- Bulk update status surat
- Export data ke CSV/Excel
- Preview file sebelum download
- Dark mode support
- Keyboard shortcuts

### 🔧 Diperbaiki
- Bug pada pagination surat masuk
- Memory leak pada file upload
- Performance improvement untuk large datasets
- Fix XSS vulnerability pada input form
- Perbaikan validasi tanggal surat

### 🔄 Diubah
- UI/UX improvement pada dashboard
- Optimasi query database
- Update dependencies ke versi terbaru
- Restruktur folder views

## [2.0.0] - 2024-01-01

### ✨ Ditambahkan
- **BREAKING**: Multi-instansi support
- Role-Based Access Control (RBAC)
- Progressive Web App (PWA) support
- RESTful API lengkap
- Dashboard dengan statistik real-time
- Export laporan ke PDF & Excel
- Sistem notifikasi (email & in-app)
- File upload dengan drag & drop
- Audit trail (activity logging)
- Docker support
- CI/CD pipeline dengan GitHub Actions

### 🔧 Diperbaiki
- Security improvements (Helmet, Rate Limiting)
- Input validation yang lebih ketat
- Error handling yang lebih baik

### 🗑️ Dihapus
- Legacy authentication method
- Deprecated API endpoints (v0)

## [1.0.0] - 2023-06-01

### ✨ Ditambahkan
- Initial release
- Basic CRUD surat masuk & keluar
- Simple disposisi system
- User authentication
- Basic dashboard
- SQLite database support

---
