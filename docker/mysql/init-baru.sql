-- Create database if not exists
CREATE DATABASE IF NOT EXISTS arsip_surat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE arsip_surat;

-- Set timezone
SET time_zone = '+07:00';

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_role VARCHAR(50) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert default roles
INSERT INTO roles (nama_role, deskripsi) VALUES 
('superadmin', 'Super Administrator dengan akses penuh'),
('admin', 'Administrator'),
('kepala_bagian', 'Kepala Bagian'),
('staff', 'Staff'),
('user', 'Pengguna Biasa')
ON DUPLICATE KEY UPDATE nama_role=nama_role;

-- Create pengguna table
CREATE TABLE IF NOT EXISTS pengguna (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE,
    jabatan VARCHAR(100),
    no_telp VARCHAR(20),
    foto VARCHAR(255),
    status ENUM('aktif', 'nonaktif') DEFAULT 'aktif',
    last_login TIMESTAMP NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role_id)
) ENGINE=InnoDB;

-- Create instansi table
CREATE TABLE IF NOT EXISTS instansi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_instansi VARCHAR(200) NOT NULL,
    alamat TEXT,
    kode_pos VARCHAR(10),
    telepon VARCHAR(50),
    email VARCHAR(100),
    website VARCHAR(100),
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create kategori table
CREATE TABLE IF NOT EXISTS kategori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(100) NOT NULL,
    kode VARCHAR(20) UNIQUE,
    deskripsi TEXT,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES kategori(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_kode (kode),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- Create surat_masuk table
CREATE TABLE IF NOT EXISTS surat_masuk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    pengirim VARCHAR(200) NOT NULL,
    instansi_id INT,
    tanggal_surat DATE NOT NULL,
    tanggal_terima DATE NOT NULL,
    perihal VARCHAR(500) NOT NULL,
    isi_ringkas TEXT,
    kategori_id INT,
    sifat ENUM('biasa', 'segera', 'penting', 'rahasia') DEFAULT 'biasa',
    status ENUM('draft', 'diterima', 'didisposisikan', 'selesai', 'arsip') DEFAULT 'diterima',
    nomor_agenda VARCHAR(50),
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    file_size INT,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (instansi_id) REFERENCES instansi(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_nomor_surat (nomor_surat),
    INDEX idx_tanggal (tanggal_surat, tanggal_terima),
    INDEX idx_status (status),
    INDEX idx_pengirim (pengirim)
) ENGINE=InnoDB;

-- Create surat_keluar table
CREATE TABLE IF NOT EXISTS surat_keluar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomor_surat VARCHAR(100) NOT NULL,
    tujuan VARCHAR(200) NOT NULL,
    instansi_id INT,
    tanggal_surat DATE NOT NULL,
    perihal VARCHAR(500) NOT NULL,
    isi_ringkas TEXT,
    kategori_id INT,
    sifat ENUM('biasa', 'segera', 'penting', 'rahasia') DEFAULT 'biasa',
    status ENUM('draft', 'dikirim', 'selesai', 'arsip') DEFAULT 'draft',
    file_path VARCHAR(255),
    file_name VARCHAR(255),
    file_size INT,
    penandatangan VARCHAR(100),
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (instansi_id) REFERENCES instansi(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (kategori_id) REFERENCES kategori(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_nomor_surat (nomor_surat),
    INDEX idx_tanggal (tanggal_surat),
    INDEX idx_status (status),
    INDEX idx_tujuan (tujuan)
) ENGINE=InnoDB;

-- Create disposisi table
CREATE TABLE IF NOT EXISTS disposisi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    surat_masuk_id INT NOT NULL,
    dari_user_id INT NOT NULL,
    kepada_user_id INT NOT NULL,
    instruksi TEXT NOT NULL,
    batas_waktu DATE,
    sifat ENUM('biasa', 'segera', 'penting', 'rahasia') DEFAULT 'biasa',
    status ENUM('draft', 'dikirim', 'dibaca', 'diproses', 'selesai') DEFAULT 'draft',
    catatan TEXT,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (dari_user_id) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (kepada_user_id) REFERENCES pengguna(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES disposisi(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_surat (surat_masuk_id),
    INDEX idx_dari (dari_user_id),
    INDEX idx_kepada (kepada_user_id),
    INDEX idx_status (status),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- Create lampiran table
CREATE TABLE IF NOT EXISTS lampiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    surat_masuk_id INT,
    surat_keluar_id INT,
    nama_file VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INT,
    file_type VARCHAR(50),
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (surat_masuk_id) REFERENCES surat_masuk(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (surat_keluar_id) REFERENCES surat_keluar(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    CHECK (surat_masuk_id IS NOT NULL OR surat_keluar_id IS NOT NULL)
) ENGINE=InnoDB;

-- Create notifikasi table
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    judul VARCHAR(200) NOT NULL,
    pesan TEXT NOT NULL,
    tipe ENUM('disposisi', 'surat_masuk', 'surat_keluar', 'sistem') DEFAULT 'sistem',
    referensi_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES pengguna(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_tipe (tipe),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Create log_aktivitas table
CREATE TABLE IF NOT EXISTS log_aktivitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    aksi VARCHAR(50) NOT NULL,
    modul VARCHAR(50),
    deskripsi TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    data_lama JSON,
    data_baru JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES pengguna(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_aksi (aksi),
    INDEX idx_modul (modul),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- Create pengaturan table
CREATE TABLE IF NOT EXISTS pengaturan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) NOT NULL UNIQUE,
    value TEXT,
    deskripsi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (`key`)
) ENGINE=InnoDB;

-- Insert default settings
INSERT INTO pengaturan (`key`, value, deskripsi) VALUES
('app_name', 'Arsip Surat Digital', 'Nama Aplikasi'),
('app_description', 'Sistem Manajemen Arsip Surat Digital', 'Deskripsi Aplikasi'),
('items_per_page', '20', 'Jumlah item per halaman'),
('session_timeout', '30', 'Timeout session dalam menit'),
('backup_enabled', 'true', 'Aktifkan backup otomatis'),
('notifikasi_email', 'true', 'Aktifkan notifikasi email'),
('max_file_size', '10485760', 'Maksimum ukuran file (bytes)')
ON DUPLICATE KEY UPDATE value=VALUES(value);

-- Create indexes for performance
CREATE INDEX idx_surat_masuk_deleted ON surat_masuk(deleted_at);
CREATE INDEX idx_surat_keluar_deleted ON surat_keluar(deleted_at);
CREATE FULLTEXT INDEX idx_perihal_fulltext ON surat_masuk(perihal, isi_ringkas);
CREATE FULLTEXT INDEX idx_perihal_keluar_fulltext ON surat_keluar(perihal, isi_ringkas);
