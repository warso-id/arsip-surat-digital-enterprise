const Pengguna = require('../models/Pengguna');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class AuthController {
  // POST /auth/login
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await Pengguna.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Akun dinonaktifkan. Hubungi administrator.'
        });
      }

      // Verify password
      const isValid = await user.verifyPassword(password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Generate tokens
      const accessToken = user.generateAuthToken();
      const refreshToken = user.generateRefreshToken();

      // Update refresh token and last login
      await Pengguna.query()
        .patch({
          refresh_token: refreshToken,
          last_login: new Date().toISOString()
        })
        .where('id', user.id);

      return res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          user: user.toPublicJSON(),
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: '24h'
          }
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan login',
        error: error.message
      });
    }
  }

  // POST /auth/register
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array()
        });
      }

      // Check existing user
      const existingUser = await Pengguna.query()
        .where('email', req.body.email)
        .first();
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar'
        });
      }

      // Create user
      const user = await Pengguna.query().insert({
        nama_lengkap: req.body.nama_lengkap,
        email: req.body.email,
        password: req.body.password,
        role_id: req.body.role_id || 3, // Default staff
        instansi_id: req.body.instansi_id,
        nip: req.body.nip,
        jabatan: req.body.jabatan,
        no_telp: req.body.no_telp
      });

      // Generate token
      const accessToken = user.generateAuthToken();

      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          user: user.toPublicJSON(),
          token: accessToken
        }
      });
    } catch (error) {
      console.error('Error in register:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan registrasi',
        error: error.message
      });
    }
  }

  // POST /auth/refresh-token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token diperlukan'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Find user with valid refresh token
      const user = await Pengguna.query()
        .findById(decoded.id)
        .where('refresh_token', refreshToken)
        .whereNull('deleted_at');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token tidak valid'
        });
      }

      // Generate new tokens
      const newAccessToken = user.generateAuthToken();
      const newRefreshToken = user.generateRefreshToken();

      // Update refresh token
      await Pengguna.query()
        .patch({ refresh_token: newRefreshToken })
        .where('id', user.id);

      return res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      return res.status(401).json({
        success: false,
        message: 'Refresh token tidak valid atau kadaluarsa'
      });
    }
  }

  // POST /auth/logout
  static async logout(req, res) {
    try {
      await Pengguna.query()
        .patch({ refresh_token: null })
        .where('id', req.user.id);

      return res.json({
        success: true,
        message: 'Logout berhasil'
      });
    } catch (error) {
      console.error('Error in logout:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal melakukan logout'
      });
    }
  }

  // POST /auth/forgot-password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await Pengguna.query().where('email', email).first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Email tidak ditemukan'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      await Pengguna.query()
        .patch({
          reset_password_token: resetToken,
          reset_password_expires: resetExpires.toISOString()
        })
        .where('id', user.id);

      // Send reset email
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      
      // Email sending logic here
      // await sendResetEmail(user.email, resetUrl);

      return res.json({
        success: true,
        message: 'Link reset password telah dikirim ke email Anda',
        data: { resetUrl } // Remove in production
      });
    } catch (error) {
      console.error('Error in forgotPassword:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal memproses permintaan reset password'
      });
    }
  }

  // POST /auth/reset-password
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      const user = await Pengguna.query()
        .where('reset_password_token', token)
        .where('reset_password_expires', '>', new Date().toISOString())
        .first();

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token reset password tidak valid atau kadaluarsa'
        });
      }

      // Update password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      await Pengguna.query()
        .patch({
          password: hashedPassword,
          reset_password_token: null,
          reset_password_expires: null
        })
        .where('id', user.id);

      return res.json({
        success: true,
        message: 'Password berhasil direset'
      });
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mereset password'
      });
    }
  }

  // GET /auth/profile
  static async profile(req, res) {
    try {
      const user = await Pengguna.query()
        .findById(req.user.id)
        .withGraphFetched('[role, instansi]');

      return res.json({
        success: true,
        data: user.toPublicJSON()
      });
    } catch (error) {
      console.error('Error in profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil profil'
      });
    }
  }

  // PUT /auth/profile
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          success: false,
          message: 'Validasi gagal',
          errors: errors.array()
        });
      }

      const updateData = {
        nama_lengkap: req.body.nama_lengkap,
        nip: req.body.nip,
        jabatan: req.body.jabatan,
        no_telp: req.body.no_telp
      };

      // Handle photo upload
      if (req.file) {
        updateData.foto = req.file.path;
      }

      const user = await Pengguna.query()
        .patchAndFetchById(req.user.id, updateData)
        .withGraphFetched('[role, instansi]');

      return res.json({
        success: true,
        message: 'Profil berhasil diupdate',
        data: user.toPublicJSON()
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate profil'
      });
    }
  }
}

module.exports = AuthController;
