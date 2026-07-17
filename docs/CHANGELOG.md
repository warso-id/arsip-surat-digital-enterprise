# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026.1.0] - 2026-07-17

### Added
- ✨ Full CRUD operations for Surat Masuk, Surat Keluar, and Disposisi
- 📱 Progressive Web App (PWA) support with offline capability
- 🔐 JWT-based authentication with role-based access control
- 📊 Interactive dashboard with real-time statistics
- 🔍 Advanced search engine with filters
- 📧 Email notifications for disposisi and status updates
- 📄 PDF generation for surat and reports
- 💾 Automated backup and restore system
- 🌐 Multi-language support (Bahasa Indonesia & English)
- 🐳 Docker containerization with production configuration
- 🔄 CI/CD pipelines with GitHub Actions
- 🧪 Comprehensive unit testing with Jest
- 📝 Audit logging for all activities
- 🎨 Responsive design with print styles
- 🔒 Security features: rate limiting, CORS, input validation
- 📋 Bulk operations for surat management
- 🏢 Instansi management module
- 👥 User management with role assignment
- ⚙️ System settings configuration
- 📈 Report generation with Excel/PDF export

### Changed
- 🔄 Updated to use Google Apps Script as backend
- 📦 Reorganized project structure for better maintainability
- 🎨 Improved UI/UX with consistent design system

### Fixed
- 🐛 Fixed CORS issues with Google Apps Script
- 🔧 Fixed base64 encoding/decoding for data transmission
- 📱 Fixed PWA manifest and service worker registration

### Security
- 🔒 Implemented full base64 encoding for all API requests
- 🛡️ Added XSS protection and input sanitization
- 🔑 JWT token with 24-hour expiry and refresh mechanism
- 🚫 Rate limiting to prevent abuse

## [2025.0.0] - 2025-01-01

### Added
- Initial release with basic CRUD functionality
- Simple authentication system
- Basic dashboard with statistics
- Surat masuk and surat keluar management
- Disposisi tracking
- Basic reporting

---

## Version History

| Version | Release Date | Status |
|---------|-------------|--------|
| 2026.1.0 | 2026-07-17 | Current |
| 2025.0.0 | 2025-01-01 | Deprecated |
