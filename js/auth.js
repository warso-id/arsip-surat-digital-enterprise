/**
 * ============================================
 * AUTH.JS - Authentication Functions
 * ARSIP SURAT DIGITAL v3.2.2
 * ============================================
 */

const Auth = {
    // ========== LOGIN ==========
    async login(username, password) {
        try {
            const response = await API.post('login', { username, password });
            return response;
        } catch (error) {
            throw new Error('Login gagal: ' + error.message);
        }
    },
    
    // ========== REGISTER ==========
    async register(data) {
        try {
            const response = await API.post('users.create', data);
            return response;
        } catch (error) {
            throw new Error('Registrasi gagal: ' + error.message);
        }
    },
    
    // ========== LOGOUT ==========
    async logout() {
        try {
            if (App.token) {
                await API.get('logout', { token: App.token });
            }
        } catch (error) {
            // Ignore
        }
        App.clearSession();
        App.showAuth();
    },
    
    // ========== CHANGE PASSWORD ==========
    async changePassword(oldPassword, newPassword) {
        try {
            const response = await API.post('changePassword', {
                oldPassword,
                newPassword
            }, App.token);
            return response;
        } catch (error) {
            throw new Error('Ganti password gagal: ' + error.message);
        }
    },
    
    // ========== UPDATE PROFILE ==========
    async updateProfile(data) {
        try {
            const response = await API.post('users.updateProfile', data, App.token);
            return response;
        } catch (error) {
            throw new Error('Update profil gagal: ' + error.message);
        }
    },
    
    // ========== GET PROFILE ==========
    async getProfile() {
        try {
            const response = await API.get('me', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Get profil gagal: ' + error.message);
        }
    },
    
    // ========== SETUP 2FA ==========
    async setup2FA(method = 'authenticator') {
        try {
            const response = await API.post('2fa.setup', { method }, App.token);
            return response;
        } catch (error) {
            throw new Error('Setup 2FA gagal: ' + error.message);
        }
    },
    
    // ========== VERIFY 2FA ==========
    async verify2FA(code) {
        try {
            const response = await API.post('2fa.verify', { code }, App.token);
            return response;
        } catch (error) {
            throw new Error('Verifikasi 2FA gagal: ' + error.message);
        }
    },
    
    // ========== GET 2FA STATUS ==========
    async get2FAStatus() {
        try {
            const response = await API.get('2fa.status', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Get 2FA status gagal: ' + error.message);
        }
    },
    
    // ========== DISABLE 2FA ==========
    async disable2FA() {
        try {
            const response = await API.get('2fa.disable', { token: App.token });
            return response;
        } catch (error) {
            throw new Error('Disable 2FA gagal: ' + error.message);
        }
    }
};
