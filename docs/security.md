
### **docs/security.md** (Security Documentation)
```markdown
# Security Documentation - Arsip Surat Digital Enterprise v3.2.2

## Security Overview

Sistem menerapkan multiple layers keamanan untuk melindungi data dan akses.

## Authentication

### JWT (JSON Web Token)
- Token di-generate saat login
- Expiry: 1 jam (configurable)
- Refresh otomatis sebelum expired
- Disimpan di localStorage dengan prefix

### Password Policy
- Minimal 8 karakter
- Harus mengandung huruf besar
- Harus mengandung huruf kecil
- Harus mengandung angka
- Di-hash menggunakan SHA-256 dengan salt

### Brute Force Protection
- Maksimal 5 kali percobaan login
- Lockout 15 menit setelah gagal
- Counter di-reset setelah login berhasil

### Session Management
- Timeout sesi: 1 jam
- Auto-logout saat tidak aktif
- Sesi dapat direvoke dari admin panel
- Multi-tab session detection

## Authorization

### Role-Based Access Control (RBAC)
| Role | Deskripsi | Akses |
|------|-----------|-------|
| admin | Administrator | Semua akses |
| kabid | Kepala Bidang | CRUD surat, approval |
| kasubag | Kepala Sub Bagian | CRUD surat, disposisi |
| staff | Staff | Create, read surat |
| sekretaris | Sekretaris | CRUD surat, agenda |

### Permission Matrix
| Module | Admin | Kabid | Kasubag | Staff | Sekretaris |
|--------|-------|-------|---------|-------|------------|
| surat-masuk | CRUD | CRU | CRU | CR | CRU |
| surat-keluar | CRUD | CRUA | CRU | CR | CRUA |
| disposisi | CRUD | CRUD | CRUD | R | CRU |
| users | CRUD | R | - | - | R |
| settings | CRUD | - | - | - | - |

## CSRF Protection
- Token CSRF di-generate setiap sesi
- Diperlukan untuk semua POST/PUT/DELETE requests
- Token sekali pakai (one-time use)
- Expired setelah 1 jam

## Rate Limiting
- 100 requests per menit per user
- Menggunakan Script Cache
- Response 429 jika terlampaui
- Auto-reset setelah 1 menit

## Input Validation & Sanitization
- Semua input di-sanitize di server
- HTML tags di-strip
- SQL injection tidak relevan (Google Sheets)
- XSS protection via CSP headers
- File upload validation (type, size)

## Data Protection

### Encryption
- AES-256-GCM untuk data sensitif
- PBKDF2 key derivation (100,000 iterasi)
- Client-side encryption untuk file
- SHA-256 untuk hashing

### Data at Rest
- Google Sheets built-in encryption
- Google Drive built-in encryption
- Script Properties untuk secrets

### Data in Transit
- HTTPS enforced
- HSTS headers
- TLS 1.2+

## Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://script.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://script.google.com https://script.googleusercontent.com;
  frame-src 'self' https://drive.google.com;
