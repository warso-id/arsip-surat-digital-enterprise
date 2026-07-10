# Arsip Surat Digital Enterprise v3.1.0
## Deployment & Setup Guide

### 📋 Prasyarat

1. **Google Account** dengan akses Google Drive & Google Apps Script
2. **Node.js** v18+ & npm v9+
3. **Git** terinstall
4. **Browser Modern** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### 🚀 Langkah Deployment

#### Step 1: Setup Google Apps Script Backend

1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Copy-paste kode dari `Code.gs` ke editor
4. Ganti `SPREADSHEET_ID` dengan ID Google Sheet Anda
5. Ganti `MASTER_FOLDER_ID` dengan ID folder Google Drive Anda
6. Deploy sebagai Web App:
   - Klik "Deploy" > "New deployment"
   - Type: Web App
   - Execute as: Me
   - Who has access: Anyone
   - Klik "Deploy"
7. Copy Web App URL yang dihasilkan

#### Step 2: Setup Spreadsheet & Generate Folders

```bash
# Test API endpoint
curl "YOUR_WEB_APP_URL?action=ping"

# Check setup status
curl "YOUR_WEB_APP_URL?action=checkSetup"

# Generate folder structure
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"generateFolders"}'

# Run full setup
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"setup",
    "admin":{
      "username":"admin",
      "password":"Admin123!",
      "email":"admin@instansi.id",
      "namaLengkap":"Administrator"
    },
    "instansi":{
      "nama":"Instansi Anda",
      "alamat":"Alamat Instansi"
    }
  }'
