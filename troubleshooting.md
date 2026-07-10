# Troubleshooting v3.1.0 (2026)

## 🤖 AI Issues

### AI Search Tidak Akurat
1. Pastikan kata kunci > 2 karakter
2. Coba gunakan bahasa alami
3. AI membutuhkan data minimal 10 surat
4. Update model: `npm run ai:update`

### AI Tags Tidak Muncul
1. Cek confidence threshold (default: 0.7)
2. Pastikan perihal/catatan cukup panjang
3. AI memerlukan minimal 20 karakter
4. Restart AI Engine: `aiEngine.init()`

## 🔗 Blockchain Issues

### Chain Verification Failed
1. Jangan edit data langsung di Google Sheets
2. Gunakan API untuk semua operasi
3. Reset chain: `blockchainAudit.reset()`
4. Backup data sebelum reset

### Mining Too Slow
1. Difficulty default: 3 (bisa diturunkan)
2. Set `CONFIG_V3.BLOCKCHAIN.DIFFICULTY = 2`
3. Mining time: ~100-500ms per block

## 🔐 Biometric Issues

### Biometric Not Available
1. Cek browser support: Chrome 120+, Edge 120+, Safari 17+
2. Pastikan HTTPS (wajib untuk WebAuthn)
3. Cek device biometric enabled
4. Fallback ke password login

### Face ID Tidak Terdeteksi
1. Pastikan kamera berfungsi
2. Cek pencahayaan cukup
3. Posisikan wajah di frame
4. Coba daftarkan ulang

## 🎤 Voice Issues

### Voice Command Not Working
1. Cek permission mikrofon
2. Browser: Chrome/Edge (best support)
3. Koneksi internet (untuk speech recognition)
4. Coba "Ctrl+Shift+V" untuk restart

### Wrong Command Detection
1. Bicara jelas dan tidak terlalu cepat
2. Kurangi background noise
3. Gunakan kata kunci yang terdaftar
4. Lihat daftar perintah di user guide

## 🌙 Dark Mode Issues

### Dark Mode Not Applying
1. Cek tema sistem
2. Manual toggle: Ctrl+D
3. Clear cache browser
4. Reset: localStorage.removeItem('app_theme')

## 🌐 Language Issues

### Translation Not Working
1. Default: Bahasa Indonesia
2. Switch: Ctrl+L
3. Cek localStorage 'app_locale'
4. Reload halaman setelah switch

---

**Version**: 3.1.0 (2026)