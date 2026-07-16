// ==================== AUTH CONTROLLER ====================
// Arsip Surat Digital Enterprise

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../../config/app');
const { validationResult } = require('express-validator');

class AuthController {
    constructor() {
        this.userModel = require('../../Models/Pengguna');
        this.roleModel = require('../../Models/Role');
        this.logModel = require('../../Models/LogAktivitas');
    }

    /**
     * Show login form
     */
    async showLoginForm(req, res) {
        // Check if already logged in
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        if (token) {
            try {
                jwt.verify(token, config.auth.jwt.secret);
                return res.redirect('/src/views/dashboard/');
            } catch (err) {
                // Token invalid, continue to login
            }
        }
        
        return res.render('auth/login', {
            title: 'Login - ' + config.app.name,
            layout: 'layouts/auth',
        });
    }

    /**
     * Handle login
     */
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errors.array(),
                });
            }

            const { username, password, instansi } = req.body;

            // Find user
            const user = await this.userModel.findByUsername(username);
            if (!user) {
                // Log failed attempt
                await this.logActivity(null, 'LOGIN_FAILED', 'User not found: ' + username);
                
                return res.status(401).json({
                    success: false,
                    message: 'Username atau password salah',
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Akun Anda tidak aktif. Hubungi administrator.',
                });
            }

            // Check login attempts
            if (user.login_attempts >= config.auth.password.maxAttempts) {
                const lockoutTime = new Date(user.last_login_attempt);
                lockoutTime.setMinutes(lockoutTime.getMinutes() + config.auth.password.lockoutTime);
                
                if (new Date() < lockoutTime) {
                    const remainingMinutes = Math.ceil((lockoutTime - new Date()) / 60000);
                    return res.status(429).json({
                        success: false,
                        message: `Akun terkunci. Coba lagi dalam ${remainingMinutes} menit.`,
                    });
                }
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                // Update login attempts
                await this.userModel.incrementLoginAttempts(user.id);
                
                // Log failed attempt
                await this.logActivity(user.id, 'LOGIN_FAILED', 'Invalid password');
                
                const remainingAttempts = config.auth.password.maxAttempts - (user.login_attempts + 1);
                return res.status(401).json({
                    success: false,
                    message: `Password salah. ${remainingAttempts > 0 ? `Sisa percobaan: ${remainingAttempts}` : 'Akun terkunci.'}`,
                });
            }

            // Reset login attempts
            await this.userModel.resetLoginAttempts(user.id);

            // Generate JWT token
            const token = this.generateToken(user);
            const refreshToken = this.generateRefreshToken(user);

            // Set cookie
            const cookieOptions = {
                httpOnly: true,
                secure: config.app.env === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            };

            res.cookie('token', token, cookieOptions);
            res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

            // Update last login
            await this.userModel.updateLastLogin(user.id);

            // Log successful login
            await this.logActivity(user.id, 'LOGIN_SUCCESS', 'User logged in');

            // Send response
            return res.json({
                success: true,
                message: 'Login berhasil',
                token: token,
                refreshToken: refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                    instansi_id: user.instansi_id,
                },
                redirect: '/src/views/dashboard/',
            });

        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server',
            });
        }
    }

    /**
     * Handle logout
     */
    async logout(req, res) {
        try {
            const userId = req.user?.id;

            // Clear cookies
            res.clearCookie('token');
            res.clearCookie('refreshToken');

            // Log logout
            if (userId) {
                await this.logActivity(userId, 'LOGOUT', 'User logged out');
            }

            return res.json({
                success: true,
                message: 'Logout berhasil',
                redirect: '/login',
            });

        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server',
            });
        }
    }

    /**
     * Handle registration
     */
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: 'Validasi gagal',
                    errors: errors.array(),
                });
            }

            const { username, email, password, fullname, instansi_id } = req.body;

            // Check existing user
            const existingUser = await this.userModel.findByUsername(username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username sudah digunakan',
                });
            }

            const existingEmail = await this.userModel.findByEmail(email);
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email sudah terdaftar',
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const userData = {
                username,
                email,
                password: hashedPassword,
                fullname,
                instansi_id: instansi_id || 1,
                role_id: 3, // Default role: operator
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const userId = await this.userModel.create(userData);

            // Log registration
            await this.logActivity(userId, 'REGISTER', 'New user registered');

            return res.status(201).json({
                success: true,
                message: 'Registrasi berhasil. Silakan login.',
            });

        } catch (error) {
            console.error('Register error:', error);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server',
            });
        }
    }

    /**
     * Handle forgot password
     */
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;

            const user = await this.userModel.findByEmail(email);
            if (!user) {
                // Return success even if email not found (security)
                return res.json({
                    success: true,
                    message: 'Jika email terdaftar, link reset password akan dikirim.',
                });
            }

            // Generate reset token
            const resetToken = jwt.sign(
                { userId: user.id, type: 'password_reset' },
                config.auth.jwt.secret,
                { expiresIn: '1h' }
            );

            // Save reset token
            await this.userModel.saveResetToken(user.id, resetToken);

            // Send reset email
            const resetUrl = `${config.app.url}/auth/reset-password?token=${resetToken}`;
            
            // Log activity
            await this.logActivity(user.id, 'PASSWORD_RESET_REQUEST', 'Password reset requested');

            // TODO: Send email with reset link
            console.log('Password reset URL:', resetUrl);

            return res.json({
                success: true,
                message: 'Link reset password telah dikirim ke email Anda.',
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server',
            });
        }
    }

    /**
     * Handle reset password
     */
    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;

            // Verify token
            let decoded;
            try {
                decoded = jwt.verify(token, config.auth.jwt.secret);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'Token tidak valid atau sudah kadaluarsa',
                });
            }

            if (decoded.type !== 'password_reset') {
                return res.status(400).json({
                    success: false,
                    message: 'Token tidak valid',
                });
            }

            // Find user
            const user = await this.userModel.findById(decoded.userId);
            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'User tidak ditemukan',
                });
            }

            // Verify reset token
            if (user.reset_token !== token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token tidak valid',
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Update password
            await this.userModel.updatePassword(user.id, hashedPassword);

            // Clear reset token
            await this.userModel.clearResetToken(user.id);

            // Log activity
            await this.logActivity(user.id, 'PASSWORD_RESET', 'Password reset successful');

            return res.json({
                success: true,
                message: 'Password berhasil direset. Silakan login dengan password baru.',
            });

        } catch (error) {
            console.error('Reset password error:', error);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server',
            });
        }
    }

    /**
     * Verify token
     */
    async verifyToken(req, res) {
        try {
            const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token tidak ditemukan',
                });
            }

            const decoded = jwt.verify(token, config.auth.jwt.secret);
            
            const user = await this.userModel.findById(decoded.userId);
            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'User tidak valid',
                });
            }

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullname: user.fullname,
                    role: user.role,
                },
            });

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid',
            });
        }
    }

    /**
     * Refresh token
     */
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token tidak ditemukan',
                });
            }

            const decoded = jwt.verify(refreshToken, config.auth.jwt.secret);
            
            const user = await this.userModel.findById(decoded.userId);
            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'User tidak valid',
                });
            }

            // Generate new tokens
            const newToken = this.generateToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            // Set cookies
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: config.app.env === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });

            return res.json({
                success: true,
                token: newToken,
                refreshToken: newRefreshToken,
            });

        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token tidak valid',
            });
        }
    }

    /**
     * Generate JWT token
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            instansiId: user.instansi_id,
            type: 'access',
        };

        return jwt.sign(payload, config.auth.jwt.secret, {
            expiresIn: config.auth.jwt.expiresIn,
            algorithm: config.auth.jwt.algorithm,
            issuer: config.auth.jwt.issuer,
        });
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            type: 'refresh',
        };

        return jwt.sign(payload, config.auth.jwt.secret, {
            expiresIn: config.auth.jwt.refreshExpiresIn,
            algorithm: config.auth.jwt.algorithm,
            issuer: config.auth.jwt.issuer,
        });
    }

    /**
     * Log activity
     */
    async logActivity(userId, action, description) {
        try {
            await this.logModel.create({
                user_id: userId,
                action: action,
                description: description,
                ip_address: req?.ip || 'unknown',
                user_agent: req?.headers?.['user-agent'] || 'unknown',
                created_at: new Date(),
            });
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }
}

module.exports = new AuthController();
