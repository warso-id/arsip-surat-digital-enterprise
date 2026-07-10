# Database Schema v3.1.0 (2026) - FINAL

## 📋 Overview

Database menggunakan **Google Sheets** dengan 14 tabel yang dioptimalkan untuk fitur v3.1.0.

## 🗄️ All Tables

### 1. Users
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| username | String(50) | Unique |
| email | String(100) | Unique |
| passwordHash | String(256) | SHA-256 + salt |
| namaLengkap | String(100) | Required |
| nip | String(20) | Optional |
| jabatan | String(100) | Optional |
| unitKerja | String(100) | Required |
| role | Enum | admin/kepala/sekretaris/staff |
| isActive | Boolean | Default: true |
| lastLogin | DateTime | Auto-updated |
| createdAt | DateTime | Auto-generated |
| updatedAt | DateTime | Auto-generated |
| **biometricEnabled** | Boolean | **v3.1.0** |
| **language** | String(2) | **v3.1.0: id/en** |
| **theme** | String(10) | **v3.1.0: light/dark/auto** |
| **voiceEnabled** | Boolean | **v3.1.0** |

### 2. SuratMasuk
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| nomorSurat | String(50) | Nomor surat asli |
| nomorAgenda | String(50) | Auto-generated |
| tanggalSurat | Date | Tanggal surat |
| tanggalTerima | Date | Tanggal diterima |
| pengirim | String(200) | Nama pengirim |
| perihal | String(500) | Perihal surat |
| sifat | Enum | biasa/penting/rahasia/segera |
| klasifikasi | String(100) | Klasifikasi |
| fileUrl | String(500) | URL file di Drive |
| fileName | String(255) | Nama file |
| fileSize | Integer | Ukuran file (bytes) |
| status | Enum | draft/diterima/disposisi/selesai |
| catatan | Text | Catatan |
| qrCode | String(500) | QR Code URL |
| createdBy | UUID | FK Users.id |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |
| **aiTags** | String(500) | **v3.1.0: AI generated tags** |
| **aiConfidence** | Float | **v3.1.0: AI confidence score** |
| **blockchainHash** | String(64) | **v3.1.0: Blockchain hash** |
| **anomalyScore** | Float | **v3.1.0: Anomaly score 0-100** |

### 3. SuratKeluar
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | Primary Key |
| nomorSurat | String(50) | Auto/manual |
| tanggalSurat | Date | Tanggal surat |
| tujuan | String(200) | Tujuan surat |
| perihal | String(500) | Perihal |
| sifat | Enum | biasa/penting/rahasia/segera |
| jenisSurat | String(100) | Jenis surat |
| fileUrl | String(500) | URL file |
| fileName | String(255) | Nama file |
| fileSize | Integer | Ukuran file |
| status | Enum | draft/review/approved/dikirim |
| catatan | Text | Catatan |
| approvalStatus | Enum | pending/approved/rejected |
| approvedBy | UUID | FK Users.id |
| approvedAt | DateTime | Waktu approval |
| createdBy | UUID | FK Users.id |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |
| **aiTags** | String(500) | **v3.1.0** |
| **aiConfidence** | Float | **v3.1.0** |
| **blockchainHash** | String(64) | **v3.1.0** |
| **templateUsed** | String(100) | **v3.1.0: AI template** |

### 4. Disposisi
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| suratMasukId | UUID | FK SuratMasuk |
| dariUserId | UUID | FK Users (pemberi) |
| kepadaUserId | UUID | FK Users (penerima) |
| instruksi | Text | Instruksi |
| sifat | Enum | biasa/penting/segera |
| batasWaktu | Date | Deadline |
| status | Enum | pending/proses/selesai |
| tindakLanjut | Text | Hasil |
| fileHasilUrl | String(500) | URL file hasil |
| completedAt | DateTime | Waktu selesai |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### 5. Approval
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| suratKeluarId | UUID | FK SuratKeluar |
| level | Integer | Level approval |
| approverId | UUID | FK Users |
| status | Enum | pending/approved/rejected |
| komentar | Text | Komentar |
| approvedAt | DateTime | Waktu |
| createdAt | DateTime | Auto |

### 6. Notifikasi
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| userId | UUID | FK Users |
| judul | String(200) | Judul |
| pesan | Text | Isi |
| tipe | Enum | info/warning/success/error |
| isRead | Boolean | Default: false |
| linkUrl | String(500) | URL action |
| createdAt | DateTime | Auto |

### 7. AuditLog
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| userId | UUID | FK Users |
| aksi | String(50) | Jenis aksi |
| modul | String(50) | Modul |
| deskripsi | Text | Detail |
| createdAt | DateTime | Auto |
| **blockchainIndex** | Integer | **v3.1.0** |
| **verified** | Boolean | **v3.1.0** |
| **aiDetected** | Boolean | **v3.1.0** |

### 8. MasterData
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| kategori | String(50) | Kategori |
| kode | String(50) | Kode unik |
| nama | String(200) | Nama |
| nilai | Text | Nilai |
| isActive | Boolean | Default: true |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### 9. Config
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| key | String(100) | Config key |
| value | Text | Config value |

### 10. BackupLog
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| fileName | String(255) | Nama file |
| fileUrl | String(500) | URL |
| fileSize | Integer | Ukuran |
| createdBy | UUID | FK Users |
| createdAt | DateTime | Auto |

### 🆕 11. Blockchain (v3.1.0)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| index | Integer | Block index |
| timestamp | DateTime | Waktu |
| data | Text | Data JSON |
| previousHash | String(64) | Hash sebelumnya |
| hash | String(64) | Hash block |
| nonce | Integer | PoW nonce |

### 🆕 12. BiometricCredentials (v3.1.0)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| userId | UUID | FK Users |
| credentialId | String(255) | WebAuthn ID |
| publicKey | Text | Public key |
| deviceName | String(100) | Nama device |
| lastUsed | DateTime | Terakhir |
| createdAt | DateTime | Auto |

### 🆕 13. AITags (v3.1.0)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| suratId | UUID | FK Surat |
| suratType | String(20) | surat_masuk/keluar |
| tag | String(50) | Tag |
| confidence | Float | Score 0-1 |
| modelVersion | String(10) | Versi AI |
| createdAt | DateTime | Auto |

### 🆕 14. AIAnalytics (v3.1.0)
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | UUID | PK |
| type | String(20) | prediction/anomaly/trend |
| data | Text | Hasil JSON |
| accuracy | Float | Akurasi |
| modelVersion | String(10) | Versi |
| createdAt | DateTime | Auto |

## 📊 ER Diagram (Text)
