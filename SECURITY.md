# 🔒 Kebijakan Keamanan - Arsip Surat Digital Enterprise

## Versi yang Didukung

| Versi | Didukung          |
|-------|-------------------|
| 2.1.x | ✅ Didukung penuh  |
| 2.0.x | ✅ Perbaikan kritis|
| 1.x.x | ❌ Tidak didukung  |

## 🛡️ Praktik Keamanan

### Untuk Pengguna

1. **JANGAN PERNAH commit file `.env` ke repository**
2. **Gunakan password yang kuat** untuk semua akun
3. **Aktifkan HTTPS** di production
4. **Update secara berkala** ke versi terbaru
5. **Backup database** secara rutin
6. **Batasi akses** ke direktori `storage` dan `src/config`
7. **Gunakan environment variables** untuk semua konfigurasi sensitif

### Konfigurasi Aman

```bash
# Production .env example
NODE_ENV=production
APP_DEBUG=false
JWT_SECRET=gunakan-random-string-minimal-32-karakter
APP_KEY=base64:gunakan-random-string-minimal-64-karakter
ENCRYPTION_KEY=gunakan-random-string-minimal-32-karakter
CORS_ORIGINS=https://domain-anda.com
RATE_LIMIT_MAX=60
