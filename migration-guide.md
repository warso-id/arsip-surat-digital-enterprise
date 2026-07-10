# Panduan Migrasi v3.1.0 (2026)

## 📋 Versi Database

| Versi Aplikasi | Versi Schema | Tanggal Rilis |
|---------------|--------------|---------------|
| **3.1.0** | **3.1.0** | **2026-07-10** |
| 3.0.0 | 3.0.0 | 2026-01-01 |
| 2.5.0 | 2.5.0 | 2025-06-15 |
| 2.0.0 | 2.0.0 | 2025-01-01 |
| 1.1.0 | 1.1.0 | 2024-06-01 |
| 1.0.0 | 1.0.0 | 2024-01-15 |

## 🔄 Migrasi v3.0.0 → v3.1.0

### Tabel Baru
- `AIAnalytics` - Menyimpan hasil AI analytics
- Kolom baru di `Users`: `language`, `theme`, `voiceEnabled`

### Kolom Baru di Tabel Existing
```sql
-- Users
ALTER TABLE Users ADD COLUMN language VARCHAR(2) DEFAULT 'id';
ALTER TABLE Users ADD COLUMN theme VARCHAR(10) DEFAULT 'auto';
ALTER TABLE Users ADD COLUMN voiceEnabled BOOLEAN DEFAULT false;

-- SuratMasuk
ALTER TABLE SuratMasuk ADD COLUMN aiTags VARCHAR(500);
ALTER TABLE SuratMasuk ADD COLUMN aiConfidence FLOAT DEFAULT 0;
ALTER TABLE SuratMasuk ADD COLUMN blockchainHash VARCHAR(64);
ALTER TABLE SuratMasuk ADD COLUMN anomalyScore FLOAT DEFAULT 0;

-- SuratKeluar
ALTER TABLE SuratKeluar ADD COLUMN aiTags VARCHAR(500);
ALTER TABLE SuratKeluar ADD COLUMN aiConfidence FLOAT DEFAULT 0;
ALTER TABLE SuratKeluar ADD COLUMN blockchainHash VARCHAR(64);
ALTER TABLE SuratKeluar ADD COLUMN templateUsed VARCHAR(100);

-- AuditLog
ALTER TABLE AuditLog ADD COLUMN blockchainIndex INTEGER;
ALTER TABLE AuditLog ADD COLUMN verified BOOLEAN DEFAULT false;
ALTER TABLE AuditLog ADD COLUMN aiDetected BOOLEAN DEFAULT false;