module.exports = {
    up: async (sequelize) => {
        await sequelize.query(`
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
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    },
    down: async (sequelize) => {
        await sequelize.query('DROP TABLE IF EXISTS pengguna');
    }
};
