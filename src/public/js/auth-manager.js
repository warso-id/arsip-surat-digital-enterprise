/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Authentication Manager
 * ============================================================
 * Handles user authentication, authorization, and session management
 * ============================================================
 */

const EnterpriseAuth = (() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const AUTH_CONFIG = {
        tokenKey: 'enterprise_token',
        refreshTokenKey: 'enterprise_refresh_token',
        userKey: 'enterprise_user',
        permissionsKey: 'enterprise_permissions',
        sessionTimeout: 3600, // 1 hour in seconds
        refreshThreshold: 300, // Refresh token 5 minutes before expiry
        maxLoginAttempts: 5,
        lockoutDuration: 900, // 15 minutes in seconds
        rememberMeDuration: 2592000, // 30 days in seconds
    };

    // ==================== TOKEN MANAGER ====================
    class TokenManager {
        /**
         * Save access token
         */
        static saveToken(token) {
            if (token) {
                localStorage.setItem(AUTH_CONFIG.tokenKey, token);
            }
        }

        /**
         * Get access token
         */
        static getToken() {
            return localStorage.getItem(AUTH_CONFIG.tokenKey);
        }

        /**
         * Save refresh token
         */
        static saveRefreshToken(token) {
            if (token) {
                localStorage.setItem(AUTH_CONFIG.refreshTokenKey, token);
            }
        }

        /**
         * Get refresh token
         */
        static getRefreshToken() {
            return localStorage.getItem(AUTH_CONFIG.refreshTokenKey);
        }

        /**
         * Clear all tokens
         */
        static clearTokens() {
            localStorage.removeItem(AUTH_CONFIG.tokenKey);
            localStorage.removeItem(AUTH_CONFIG.refreshTokenKey);
        }

        /**
         * Decode JWT token
         */
        static decodeToken(token) {
            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWT token format');
                }
                
                const payload = parts[1];
                // Use Base64 decode
                const decoded = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.decode(payload)
                    : decodeURIComponent(escape(atob(payload)));
                
                return JSON.parse(decoded);
            } catch (error) {
                console.error('Token decode error:', error);
                return null;
            }
        }

        /**
         * Check if token is expired
         */
        static isTokenExpired(token) {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) return true;
            
            return decoded.exp * 1000 < Date.now();
        }

        /**
         * Check if token needs refresh
         */
        static needsRefresh(token) {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp) return true;
            
            const expiryTime = decoded.exp * 1000;
            const threshold = AUTH_CONFIG.refreshThreshold * 1000;
            
            return (expiryTime - Date.now()) < threshold;
        }

        /**
         * Get token expiry time
         */
        static getTokenExpiry(token) {
            const decoded = this.decodeToken(token);
            return decoded?.exp ? new Date(decoded.exp * 1000) : null;
        }
    }

    // ==================== USER MANAGER ====================
    class UserManager {
        /**
         * Save user data
         */
        static saveUser(user) {
            if (user) {
                const encoded = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.encodeObject(user)
                    : btoa(JSON.stringify(user));
                localStorage.setItem(AUTH_CONFIG.userKey, encoded);
            }
        }

        /**
         * Get user data
         */
        static getUser() {
            try {
                const encoded = localStorage.getItem(AUTH_CONFIG.userKey);
                if (!encoded) return null;
                
                const decoded = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.decodeObject(encoded)
                    : JSON.parse(atob(encoded));
                
                return decoded;
            } catch (error) {
                console.error('User data decode error:', error);
                return null;
            }
        }

        /**
         * Save permissions
         */
        static savePermissions(permissions) {
            if (permissions) {
                localStorage.setItem(AUTH_CONFIG.permissionsKey, JSON.stringify(permissions));
            }
        }

        /**
         * Get permissions
         */
        static getPermissions() {
            try {
                const saved = localStorage.getItem(AUTH_CONFIG.permissionsKey);
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                return [];
            }
        }

        /**
         * Clear user data
         */
        static clearUser() {
            localStorage.removeItem(AUTH_CONFIG.userKey);
            localStorage.removeItem(AUTH_CONFIG.permissionsKey);
        }

        /**
         * Check if user has permission
         */
        static hasPermission(permission) {
            const permissions = this.getPermissions();
            return permissions.includes(permission) || permissions.includes('*');
        }

        /**
         * Check if user has role
         */
        static hasRole(role) {
            const user = this.getUser();
            return user?.role?.slug === role;
        }

        /**
         * Get user full name
         */
        static getFullName() {
            const user = this.getUser();
            return user?.nama_lengkap || user?.nama || 'User';
        }

        /**
         * Get user initials
         */
        static getInitials() {
            const name = this.getFullName();
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
    }

    // ==================== SESSION MANAGER ====================
    class SessionManager {
        /**
         * Start session
         */
        static startSession(user, token, refreshToken, remember = false) {
            TokenManager.saveToken(token);
            TokenManager.saveRefreshToken(refreshToken);
            UserManager.saveUser(user);
            
            if (user.permissions) {
                UserManager.savePermissions(user.permissions);
            }
            
            // Set session start time
            sessionStorage.setItem('session_start', Date.now().toString());
            
            // Set last activity
            this.updateActivity();
            
            // Start session monitor
            this.startMonitor();
        }

        /**
         * End session
         */
        static endSession() {
            TokenManager.clearTokens();
            UserManager.clearUser();
            
            sessionStorage.removeItem('session_start');
            sessionStorage.removeItem('last_activity');
        }

        /**
         * Update last activity
         */
        static updateActivity() {
            sessionStorage.setItem('last_activity', Date.now().toString());
        }

        /**
         * Check if session is active
         */
        static isSessionActive() {
            const token = TokenManager.getToken();
            if (!token) return false;
            
            if (TokenManager.isTokenExpired(token)) {
                return false;
            }
            
            const lastActivity = sessionStorage.getItem('last_activity');
            if (lastActivity) {
                const inactiveTime = (Date.now() - parseInt(lastActivity)) / 1000;
                if (inactiveTime > AUTH_CONFIG.sessionTimeout) {
                    return false;
                }
            }
            
            return true;
        }

        /**
         * Start session monitor
         */
        static startMonitor() {
            // Update activity on user interaction
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    this.updateActivity();
                }, { passive: true });
            });
            
            // Check session periodically
            setInterval(() => {
                if (!this.isSessionActive()) {
                    this.handleSessionExpired();
                }
            }, 60000); // Check every minute
        }

        /**
         * Handle expired session
         */
        static async handleSessionExpired() {
            // Try to refresh token
            const refreshToken = TokenManager.getRefreshToken();
            if (refreshToken) {
                try {
                    const response = await window.GASAPI.auth.refresh();
                    if (response?.success) {
                        TokenManager.saveToken(response.data.token);
                        this.updateActivity();
                        return;
                    }
                } catch (error) {
                    console.error('Token refresh failed:', error);
                }
            }
            
            // If refresh fails, logout
            this.endSession();
            
            // Notify user
            if (window.EnterpriseCore?.notifications) {
                window.EnterpriseCore.notifications.warning('Sesi Anda telah berakhir. Silakan login kembali.');
            }
            
            // Redirect to login after delay
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }

        /**
         * Get session duration
         */
        static getSessionDuration() {
            const start = sessionStorage.getItem('session_start');
            if (!start) return 0;
            return Math.floor((Date.now() - parseInt(start)) / 1000);
        }
    }

    // ==================== LOGIN ATTEMPT MANAGER ====================
    class LoginAttemptManager {
        /**
         * Record login attempt
         */
        static recordAttempt(email) {
            const key = `login_attempts_${email}`;
            let attempts = this.getAttempts(email);
            
            attempts.push({
                timestamp: Date.now(),
                success: false
            });
            
            // Keep only recent attempts
            const cutoff = Date.now() - (AUTH_CONFIG.lockoutDuration * 1000);
            attempts = attempts.filter(a => a.timestamp > cutoff);
            
            sessionStorage.setItem(key, JSON.stringify(attempts));
            
            return attempts;
        }

        /**
         * Get login attempts
         */
        static getAttempts(email) {
            const key = `login_attempts_${email}`;
            try {
                const saved = sessionStorage.getItem(key);
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                return [];
            }
        }

        /**
         * Check if account is locked
         */
        static isLocked(email) {
            const attempts = this.getAttempts(email);
            return attempts.length >= AUTH_CONFIG.maxLoginAttempts;
        }

        /**
         * Get remaining attempts
         */
        static getRemainingAttempts(email) {
            const attempts = this.getAttempts(email);
            return Math.max(0, AUTH_CONFIG.maxLoginAttempts - attempts.length);
        }

        /**
         * Get lockout remaining time
         */
        static getLockoutRemaining(email) {
            const attempts = this.getAttempts(email);
            if (attempts.length === 0) return 0;
            
            const oldestAttempt = attempts[0].timestamp;
            const lockoutEnd = oldestAttempt + (AUTH_CONFIG.lockoutDuration * 1000);
            const remaining = Math.max(0, lockoutEnd - Date.now());
            
            return Math.ceil(remaining / 1000);
        }

        /**
         * Clear attempts
         */
        static clearAttempts(email) {
            sessionStorage.removeItem(`login_attempts_${email}`);
        }
    }

    // ==================== AUTH API ====================
    const AuthAPI = {
        /**
         * Login
         */
        async login(email, password, remember = false) {
            // Check if account is locked
            if (LoginAttemptManager.isLocked(email)) {
                const remaining = LoginAttemptManager.getLockoutRemaining(email);
                throw new Error(`Akun terkunci. Silakan coba lagi dalam ${Math.ceil(remaining / 60)} menit.`);
            }

            try {
                // Encode credentials with Base64
                const credentials = window.EnterpriseBase64 
                    ? window.EnterpriseBase64.encodeObject({ email, password })
                    : btoa(JSON.stringify({ email, password }));

                // Call API
                const response = await window.GASAPI.auth.login(email, password, remember);

                if (response && response.success) {
                    // Clear login attempts
                    LoginAttemptManager.clearAttempts(email);
                    
                    // Start session
                    SessionManager.startSession(
                        response.data.user,
                        response.data.token,
                        response.data.refreshToken,
                        remember
                    );
                    
                    return response.data;
                } else {
                    // Record failed attempt
                    LoginAttemptManager.recordAttempt(email);
                    throw new Error(response?.message || 'Login gagal');
                }
            } catch (error) {
                LoginAttemptManager.recordAttempt(email);
                throw error;
            }
        },

        /**
         * Logout
         */
        async logout() {
            try {
                await window.GASAPI.auth.logout();
            } catch (error) {
                console.warn('Logout API call failed:', error);
            }
            
            SessionManager.endSession();
            window.location.href = '/login.html';
        },

        /**
         * Check authentication
         */
        isAuthenticated() {
            return SessionManager.isSessionActive();
        },

        /**
         * Get current user
         */
        getCurrentUser() {
            return UserManager.getUser();
        },

        /**
         * Check permission
         */
        hasPermission(permission) {
            return UserManager.hasPermission(permission);
        },

        /**
         * Check role
         */
        hasRole(role) {
            return UserManager.hasRole(role);
        },

        /**
         * Refresh token
         */
        async refreshToken() {
            try {
                const response = await window.GASAPI.auth.refresh();
                if (response?.success) {
                    TokenManager.saveToken(response.data.token);
                    return response.data.token;
                }
                throw new Error('Token refresh failed');
            } catch (error) {
                SessionManager.endSession();
                throw error;
            }
        },

        /**
         * Change password
         */
        async changePassword(oldPassword, newPassword) {
            const response = await window.GASAPI.auth.changePassword(oldPassword, newPassword);
            return response;
        },
    };

    // ==================== INITIALIZE ====================
    function init() {
        // Update activity on page load
        SessionManager.updateActivity();
        
        // Check token and refresh if needed
        const token = TokenManager.getToken();
        if (token && TokenManager.needsRefresh(token)) {
            AuthAPI.refreshToken().catch(() => {
                console.warn('Token refresh failed on init');
            });
        }
        
        console.log('🔐 Authentication Manager initialized');
    }

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== PUBLIC API ====================
    return {
        login: AuthAPI.login,
        logout: AuthAPI.logout,
        isAuthenticated: AuthAPI.isAuthenticated,
        getCurrentUser: AuthAPI.getCurrentUser,
        hasPermission: AuthAPI.hasPermission,
        hasRole: AuthAPI.hasRole,
        refreshToken: AuthAPI.refreshToken,
        changePassword: AuthAPI.changePassword,
        
        // User utilities
        getUserFullName: UserManager.getFullName,
        getUserInitials: UserManager.getInitials,
        
        // Session info
        getSessionDuration: SessionManager.getSessionDuration,
        
        // Login attempts
        getRemainingAttempts: LoginAttemptManager.getRemainingAttempts,
        isAccountLocked: LoginAttemptManager.isLocked,
        getLockoutRemaining: LoginAttemptManager.getLockoutRemaining,
    };
})();

// Export globally
window.EnterpriseAuth = EnterpriseAuth;
