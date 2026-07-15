
---

## 📄 **SECURITY.md**

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Active support  |
| 1.0.x   | ⚠️ Security only   |
| < 1.0   | ❌ End of life     |

## Reporting a Vulnerability

Kami sangat menghargai komunitas keamanan yang membantu menjaga keamanan Arsip Surat Digital Enterprise.

### JANGAN membuat issue publik untuk kerentanan keamanan!

### Langkah Pelaporan:

1. **Email ke:** security@arsipsurat.id
2. **Enkripsi:** Gunakan [PGP key](https://arsipsurat.id/security/pgp-key.asc) kami
3. **Sertakan:**
   - Deskripsi kerentanan
   - Langkah reproduksi
   - Potensi dampak
   - Saran perbaikan (jika ada)

### Response Timeline:

- 🕐 **24 jam:** Konfirmasi penerimaan laporan
- 📅 **3 hari:** Evaluasi awal dan prioritas
- 🔧 **7 hari:** Patch untuk kerentanan kritis
- 📅 **30 hari:** Patch untuk kerentanan non-kritis
- 📢 **90 hari:** Pengungkapan publik (jika diperlukan)

### Program Bug Bounty

## Security Best Practices for Users

### 🔐 Authentication
- Gunakan password yang kuat (minimal 12 karakter)
- Aktifkan 2FA jika tersedia
- Jangan bagikan kredensial

### 📁 File Upload
- Batasi ukuran upload sesuai kebijakan
- Scan file untuk malware
- Gunakan tipe file yang diizinkan

### 🔒 Data Protection
- Backup database secara regular
- Enkripsi data sensitif
- Batasi akses berdasarkan role

### 🌐 Network Security
- Gunakan HTTPS di production
- Implementasi rate limiting
- Monitor akses tidak sah

## Keamanan Aplikasi

### Implementasi
- ✅ JWT dengan refresh token rotation
- ✅ Password hashing dengan bcrypt
- ✅ Input validation & sanitization
- ✅ XSS protection
- ✅ CSRF tokens
- ✅ SQL injection prevention (parameterized queries)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ File type validation
- ✅ Audit logging

### Yang Belum Diimplementasi
- ⏳ 2FA/MFA support
- ⏳ Hardware security key support
- ⏳ Advanced session management
- ⏳ IP whitelisting

## Security Updates

Kami merilis security patches secara regular. Pantau:
- GitHub Releases
- Security Advisories
- Mailing list keamanan

## Responsible Disclosure

Kami berkomitmen untuk bekerja sama dengan peneliti keamanan. Kami tidak akan mengambil tindakan hukum terhadap siapa pun yang:
- Melaporkan kerentanan dengan itikad baik
- Mengikuti kebijakan responsible disclosure
- Tidak mengeksploitasi kerentanan di luar pengujian

---

**Kontak Keamanan:**
- Email: security@arsipsurat.id
- PGP: [0x1234567890ABCDEF](https://arsipsurat.id/security/pgp-key.asc)
- Respons Time: < 24 jam
