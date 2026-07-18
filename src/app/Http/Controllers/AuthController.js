const AuthService = require('../../Services/AuthService');
const ResponseHelper = require('../../Helpers/ResponseHelper');

class AuthController {
    /**
     * Login
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');

            const result = await AuthService.login(email, password, ipAddress, userAgent);

            return ResponseHelper.success(res, 'Login berhasil', result);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 401);
        }
    }

    /**
     * Register
     */
    static async register(req, res) {
        try {
            const user = await AuthService.register(req.body);

            return ResponseHelper.success(res, 'Registrasi berhasil', user, 201);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Get current user
     */
    static async me(req, res) {
        try {
            const user = req.user;
            return ResponseHelper.success(res, 'Data user berhasil diambil', user);
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Refresh token
     */
    static async refreshToken(req, res) {
        try {
            const { token } = req.body;
            const newToken = await AuthService.refreshToken(token);

            return ResponseHelper.success(res, 'Token berhasil diperbarui', { token: newToken });
        } catch (error) {
            return ResponseHelper.error(res, error.message, 401);
        }
    }

    /**
     * Change password
     */
    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            await AuthService.changePassword(req.user.id, oldPassword, newPassword);

            return ResponseHelper.success(res, 'Password berhasil diubah');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Forgot password
     */
    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            await AuthService.forgotPassword(email);

            return ResponseHelper.success(res, 'Link reset password telah dikirim ke email Anda');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Reset password
     */
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            await AuthService.resetPassword(token, password);

            return ResponseHelper.success(res, 'Password berhasil direset');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }

    /**
     * Logout
     */
    static async logout(req, res) {
        try {
            const ipAddress = req.ip;
            const userAgent = req.get('user-agent');
            await AuthService.logout(req.user.id, ipAddress, userAgent);

            return ResponseHelper.success(res, 'Logout berhasil');
        } catch (error) {
            return ResponseHelper.error(res, error.message, 400);
        }
    }
}

module.exports = AuthController;
