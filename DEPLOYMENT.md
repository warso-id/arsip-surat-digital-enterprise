
---

### FILE 2: **DEPLOYMENT.md** (UPGRADE v3.1.0)

```markdown
# Deployment Guide v3.1.0 (2026)

## 📋 Daftar Isi
1. [Prasyarat v3.1.0](#prasyarat)
2. [Deployment ke Google Apps Script](#deployment-gas)
3. [Build PWA v3.1.0](#build-pwa)
4. [Deploy Frontend](#deploy-frontend)
5. [Konfigurasi AI Engine](#konfigurasi-ai)
6. [Setup Blockchain](#setup-blockchain)
7. [Biometric Setup](#biometric-setup)
8. [SSL/TLS untuk PWA](#ssl-tls)
9. [CI/CD Pipeline](#ci-cd)
10. [Monitoring v3.1.0](#monitoring)

## Prasyarat

### Software Wajib
```bash
# Node.js 18+
node -v  # Harus >= 18.0.0

# npm 9+
npm -v

# Google clasp
npm install -g @google/clasp@latest

# Git
git --version