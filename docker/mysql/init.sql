-- init.sql - MySQL Database Initialization (Optional)
CREATE DATABASE IF NOT EXISTS arsip_surat_enterprise;
USE arsip_surat_enterprise;

-- Users table for local development
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'operator', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@enterprise.com', '$2a$10$YourHashedPasswordHere', 'superadmin')
ON DUPLICATE KEY UPDATE username=username;

-- Create indexes
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_role ON users(role);
