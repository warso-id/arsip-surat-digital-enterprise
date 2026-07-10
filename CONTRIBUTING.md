# Panduan Kontribusi v3.1.0 (2026)

## 🚀 Teknologi v3.1.0

Proyek ini menggunakan:
- **Frontend**: Vanilla JS + Web Components, Material Design 3
- **PWA**: Workbox 7.x, Service Worker v3
- **AI**: Fuse.js 7.x, Custom NLP Engine
- **Blockchain**: SHA-256, Proof of Work
- **Biometric**: WebAuthn/FIDO2
- **Voice**: Web Speech API
- **Backend**: Google Apps Script V8
- **Build**: Vite 5.x, Clasp 2.x

## 🔧 Development Setup v3.1.0

```bash
# Clone
git clone https://github.com/yourusername/arsip-surat-digital-enterprise.git
cd arsip-surat-digital-enterprise

# Install dependencies
npm install

# Setup GAS
npx clasp login
npx clasp create --type sheets --title "Arsip Surat v3.1.0 Dev"

# Development
npm run dev

# Build
npm run build

# Test
npm test

# Lint
npm run lint