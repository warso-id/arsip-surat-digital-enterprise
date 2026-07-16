-- ==================== MYSQL INIT SCRIPT ====================
-- Arsip Surat Digital Enterprise
-- Database initialization for MySQL

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS arsip_surat
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE arsip_surat;

-- ==================== ROLES TABLE ====================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL UNIQUE,
    kode VARCHAR(20) NOT NULL UNIQUE,
    deskripsi TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==================== INSTANSI TABLE ====================
CREATE TABLE IF NOT EXISTS instansi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode VARCHAR(20) NOT NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    alamat TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(100),
    logo VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==================== PENGGUNA TABLE ====================
CREATE TABLE IF NOT EXISTS pengguna (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    jabatan VARCHAR(100),
    nip VARCHAR(30),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role_id INT NOT NULL,
    instansi_id INT,
    is_active TINYINT(1) DEFAULT 1,
    login_attempts INT DEFAULT 0,
    last_login_attempt TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    remember_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    INDEX idx_pengguna_role (role_id),
    INDEX idx_pengguna_instansi (instansi_id),
    INDEX idx_pengguna_email (email),
    INDEX idx_pengguna_username (username)
) ENGINE=InnoDB;

-- ==================== KATEGORI TABLE ====================
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    kode VARCHAR(20) NOT NULL UNIQUE,
    deskripsi TEXT,
    warna VARCHAR(7) DEFAULT '#3b82f6',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ==================== SURAT MASUK TABLE ====================
CREATE TABLE IF NOT EXISTS surat_masuk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_agenda VARCHAR(30) NOT NULL UNIQUE,
    nomor_surat VARCHAR(100) NOT NULL,
    tanggal_surat DATE NOT NULL,
    tanggal_terima DATE NOT NULL,
    pengirim VARCHAR(200) NOT NULL,
    perihal VARCHAR(500) NOT NULL,
    ringkasan TEXT,
    kategori VARCHAR(30) DEFAULT 'biasa',
    sifat_surat VARCHAR(30) DEFAULT 'biasa',
    prioritas VARCHAR(30) DEFAULT 'sedang',
    status VARCHAR(20) DEFAULT 'baru',
    catatan TEXT,
    qr_code VARCHAR(255),
    instansi_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    FOREIGN KEY (created_by) REFERENCES pengguna(id),
    INDEX idx_sm_status (status),
    INDEX idx_sm_tanggal (tanggal_terima),
    INDEX idx_sm_instansi (instansi_id),
    INDEX idx_sm_nomor_agenda (nomor_agenda)
) ENGINE=InnoDB;

-- ==================== SURAT KELUAR TABLE ====================
CREATE TABLE IF NOT EXISTS surat_keluar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL UNIQUE,
    tanggal_surat DATE NOT NULL,
    tujuan VARCHAR(200) NOT NULL,
    perihal VARCHAR(500) NOT NULL,
    isi_surat TEXT,
    kategori VARCHAR(30) DEFAULT 'biasa',
    sifat_surat VARCHAR(30) DEFAULT 'biasa',
    status VARCHAR(20) DEFAULT 'konsep',
    catatan TEXT,
    instansi_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    FOREIGN KEY (created_by) REFERENCES pengguna(id),
    INDEX idx_sk_status (status),
    INDEX idx_sk_tanggal (tanggal_surat)
) ENGINE=InnoDB;

-- ==================== DISPOSISI TABLE ====================
CREATE TABLE IF NOT EXISTS disposisi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    surat_masuk_id INT NOT NULL,
    dari_user_id INT NOT NULL,
    kepada_user_id INT,
    kepada_role_id INT,
    isi_disposisi TEXT NOT NULL,
    sifat_disposisi VARCHAR(30) DEFAULT 'biasa',
    batas_waktu DATE,
    status VARCHAR(20) DEFAULT 'pending',
    catatan_tindak_lanjut TEXT,
    tanggal_selesai TIMESTAMP NULL,
    instansi_id INT NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE,
    FOREIGN KEY (dari_user_id) REFERENCES pengguna(id),
    FOREIGN KEY (kepada_user_id) REFERENCES pengguna(id),
    FOREIGN KEY (kepada_role_id) REFERENCES roles(id),
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    INDEX idx_disp_status (status),
    INDEX idx_disp_surat (surat_masuk_id),
    INDEX idx_disp_kepada (kepada_user_id)
) ENGINE=InnoDB;

-- ==================== LAMPIRAN TABLE ====================
CREATE TABLE IF NOT EXISTS lampiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    surat_masuk_id INT,
    surat_keluar_id INT,
    nama_file VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    ukuran INT,
    tipe VARCHAR(50),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE,
    FOREIGN KEY (surat_keluar_id) REFERENCES surat_keluar(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==================== NOTIFIKASI TABLE ====================
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSON,
    is_read TINYINT(1) DEFAULT 0,
    read_at TIMESTAMP NULL,
    instansi_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES pengguna(id),
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    INDEX idx_notif_user (user_id, is_read),
    INDEX idx_notif_type (type)
) ENGINE=InnoDB;

-- ==================== LOG AKTIVITAS TABLE ====================
CREATE TABLE IF NOT EXISTS log_aktivitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES pengguna(id),
    INDEX idx_log_user (user_id),
    INDEX idx_log_action (action),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB;

-- ==================== PENGATURAN TABLE ====================
CREATE TABLE IF NOT EXISTS pengaturan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kunci VARCHAR(100) NOT NULL UNIQUE,
    nilai TEXT,
    tipe VARCHAR(20) DEFAULT 'string',
    deskripsi TEXT,
    instansi_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instansi_id) REFERENCES instansi(id),
    INDEX idx_pengaturan_kunci (kunci)
) ENGINE=InnoDB;
