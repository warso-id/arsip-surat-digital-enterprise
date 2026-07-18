const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Pengguna = require('../Models/Pengguna');
const LogAktivitas = require('../Models/LogAktivitas');
const EmailService = require('./EmailService');
const authConfig = require('../../config/auth');

class AuthService {
    /**
     * Login user
     */
    static async login(email, password, ipAddress, userAgent) {
        try {
            // Cari user berdasarkan email
            const user = await Pengguna.findOne({
                where: { email },
                include: ['role']
            });

            if (!user) {
                throw new Error('Email atau password salah');
            }

            // Cek status user
            if (user.status !== 'aktif') {
                throw new Error('Akun tidak aktif. Hubungi administrator');
            }

            // Verifikasi password
            const isValidPassword = await user.verifyPassword(password);
            if (!isValidPassword) {
                // Log failed login attempt
                await LogAktivitas.log({
                    user_id: user.id,
                    aksi: 'login_failed',
                    modul: 'auth',
                    deskripsi: 'Percobaan login gagal - password salah',
                    ip_address: ipAddress,
                    user_agent: userAgent
                });
                throw new Error('Email atau password salah');
            }

            // Update last login
            await user.update({
                last_login: new Date()
            });

            // Generate token
            const token = this.generateToken(user);

            // Log successful login
            await LogAktivitas.log({
                user_id: user.id,
                aksi: 'login',
                modul: 'auth',
                deskripsi: 'Login berhasil',
                ip_address: ipAddress,
                user_agent: userAgent
            });

            return {
                user: user.toJSON(),
                token
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Register user baru
     */
    static async register(userData) {
        try {
            // Cek email sudah digunakan
            const existingUser = await Pengguna.findOne({
                where: { email: userData.email }
            });

            if (existingUser) {
                throw new Error('Email sudah terdaftar');
            }

            // Cek NIP jika ada
            if (userData.nip) {
                const existingNIP = await Pengguna.findOne({
                    where: { nip: userData.nip }
                });

                if (existingNIP) {
                    throw new Error('NIP sudah terdaftar');
                }
            }

            // Buat user baru
            const user = await Pengguna.create(userData);

            // Kirim email welcome
            try {
                await EmailService.sendWelcomeEmail(user);
            } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                // Tidak throw error, karena registrasi tetap berhasil
            }

            return user.toJSON();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate JWT token
     */
    static generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role.nama_role,
            nama: user.nama_lengkap
        };

        return jwt.sign(payload, authConfig.jwt.secret, {
            expiresIn: authConfig.jwt.expiresIn
        });
    }

    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jwt.verify(token, authConfig.jwt.secret);
        } catch (error) {
            throw new Error('Token tidak valid atau sudah kadaluarsa');
        }
    }

    /**
     * Refresh token
     */
    static async refreshToken(token) {
        try {
            const decoded = this.verifyToken(token);
            const user = await Pengguna.findByPk(decoded.id, {
                include: ['role']
            });

            if (!user || user.status !== 'aktif') {
                throw new Error('User tidak valid atau tidak aktif');
            }

            return this.generateToken(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Change password
     */
    static async changePassword(userId, oldPassword, newPassword) {
        try {
            const user = await Pengguna.findByPk(userId);
            
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // Verifikasi password lama
            const isValid = await user.verifyPassword(oldPassword);
            if (!isValid) {
                throw new Error('Password lama salah');
            }

            // Validasi password baru
            this.validatePassword(newPassword);

            // Update password
            await user.update({ password: newPassword });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Forgot password
     */
    static async forgotPassword(email) {
        try {
            const user = await Pengguna.findOne({ where: { email } });
            
            if (!user) {
                throw new Error('Email tidak terdaftar');
            }

            // Generate reset token
            const resetToken = require('crypto').randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 3600000); // 1 jam

            await user.update({
                reset_token: resetToken,
                reset_token_expires: resetTokenExpires
            });

            // Kirim email reset password
            await EmailService.sendPasswordResetEmail(user, resetToken);

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(token, newPassword) {
        try {
            const user = await Pengguna.findOne({
                where: {
                    reset_token: token,
                    reset_token_expires: {
                        [require('sequelize').Op.gt]: new Date()
                    }
                }
            });

            if (!user) {
                throw new Error('Token reset password tidak valid atau sudah kadaluarsa');
            }

            // Validasi password baru
            this.validatePassword(newPassword);

            // Update password
            await user.update({
                password: newPassword,
                reset_token: null,
                reset_token_expires: null
            });

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validasi password
     */
    static validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            throw new Error(`Password minimal ${minLength} karakter`);
        }

        if (!hasUpperCase) {
            throw new Error('Password harus mengandung huruf besar');
        }

        if (!hasLowerCase) {
            throw new Error('Password harus mengandung huruf kecil');
        }

        if (!hasNumbers) {
            throw new Error('Password harus mengandung angka');
        }

        if (!hasSpecialChar) {
            throw new Error('Password harus mengandung karakter spesial');
        }

        return true;
    }

    /**
     * Logout
     */
    static async logout(userId, ipAddress, userAgent) {
        try {
            await LogAktivitas.log({
                user_id: userId,
                aksi: 'logout',
                modul: 'auth',
                deskripsi: 'Logout berhasil',
                ip_address: ipAddress,
                user_agent: userAgent
            });

            return true;
        } catch (error) {
            console.error('Error logging logout:', error);
            return true; // Tetap return true karena logout harus tetap berhasil
        }
    }

    /**
     * Check permissions
     */
    static async checkPermission(userId, permission) {
        try {
            const user = await Pengguna.findByPk(userId, {
                include: ['role']
            });

            if (!user) {
                return false;
            }

            // Superadmin has all permissions
            if (user.role.nama_role === 'superadmin') {
                return true;
            }

            // Check specific permissions based on role
            const rolePermissions = this.getRolePermissions(user.role.nama_role);
            return rolePermissions.includes(permission);
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    /**
     * Get role permissions
     */
    static getRolePermissions(role) {
        const permissions = {
            superadmin: ['*'],
            admin: [
                'view_surat_masuk', 'create_surat_masuk', 'edit_surat_masuk', 'delete_surat_masuk',
                'view_surat_keluar', 'create_surat_keluar', 'edit_surat_keluar', 'delete_surat_keluar',
                'view_disposisi', 'create_disposisi', 'process_disposisi',
                'view_laporan', 'export_laporan',
                'view_pengaturan', 'edit_pengaturan'
            ],
            kepala_bagian: [
                'view_surat_masuk', 'create_surat_masuk',
                'view_surat_keluar',
                'view_disposisi', 'create_disposisi', 'process_disposisi',
                'view_laporan'
            ],
            staff: [
                'view_surat_masuk', 'create_surat_masuk',
                'view_surat_keluar', 'create_surat_keluar',
                'view_disposisi'
            ],
            user: [
                'view_surat_masuk',
                'view_surat_keluar',
                'view_disposisi'
            ]
        };

        return permissions[role] || [];
    }
}

module.exports = AuthService;
