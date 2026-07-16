// ==================== APP.JS ====================
// Arsip Surat Digital Enterprise - Main Application Script
// Version: 2.1.0

(function() {
    'use strict';

    // ==================== GLOBAL CONFIGURATION ====================
    const CONFIG = {
        APP_NAME: 'Arsip Surat Digital Enterprise',
        APP_VERSION: '2.1.0',
        API_BASE_URL: '/api',
        TOKEN_KEY: 'auth_token',
        USER_KEY: 'user_data',
        THEME_KEY: 'app_theme',
        SESSION_TIMEOUT: 3600000, // 1 hour
        AUTO_LOGOUT_WARNING: 300000, // 5 minutes before timeout
    };

    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * Format date to Indonesian locale
     */
    function formatDate(date, format = 'full') {
        if (!date) return '-';
        
        const d = new Date(date);
        const options = {
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
        };
        
        return d.toLocaleDateString('id-ID', options[format] || options.full);
    }

    /**
     * Format file size
     */
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate random ID
     */
    function generateId(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Escape HTML
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ==================== STORAGE HELPERS ====================
    
    const Storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage set error:', e);
            }
        },
        
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage get error:', e);
                return null;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error('Storage remove error:', e);
            }
        },
        
        clear() {
            try {
                localStorage.clear();
            } catch (e) {
                console.error('Storage clear error:', e);
            }
        }
    };

    // ==================== AUTHENTICATION ====================
    
    const Auth = {
        isAuthenticated() {
            const token = Storage.get(CONFIG.TOKEN_KEY);
            if (!token) return false;
            
            // Check token expiration
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000;
                return Date.now() < exp;
            } catch (e) {
                return false;
            }
        },
        
        getToken() {
            return Storage.get(CONFIG.TOKEN_KEY);
        },
        
        setToken(token) {
            Storage.set(CONFIG.TOKEN_KEY, token);
        },
        
        removeToken() {
            Storage.remove(CONFIG.TOKEN_KEY);
        },
        
        getUser() {
            return Storage.get(CONFIG.USER_KEY);
        },
        
        setUser(user) {
            Storage.set(CONFIG.USER_KEY, user);
        },
        
        removeUser() {
            Storage.remove(CONFIG.USER_KEY);
        },
        
        logout() {
            this.removeToken();
            this.removeUser();
            window.location.href = '/login';
        },
        
        checkAuth() {
            if (!this.isAuthenticated()) {
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/login') && 
                    !currentPath.includes('/auth/')) {
                    this.logout();
                }
            }
        }
    };

    // ==================== API HELPER ====================
    
    const API = {
        async request(url, options = {}) {
            const token = Auth.getToken();
            
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                ...options
            };
            
            try {
                const response = await fetch(CONFIG.API_BASE_URL + url, defaultOptions);
                
                // Handle 401 Unauthorized
                if (response.status === 401) {
                    Auth.logout();
                    throw new Error('Session expired');
                }
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }
                
                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        },
        
        get(url, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return this.request(fullUrl, { method: 'GET' });
        },
        
        post(url, data = {}) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        put(url, data = {}) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },
        
        delete(url) {
            return this.request(url, { method: 'DELETE' });
        },
        
        upload(url, formData, onProgress) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && onProgress) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error('Upload failed'));
                    }
                });
                
                xhr.addEventListener('error', () => reject(new Error('Upload failed')));
                
                xhr.open('POST', CONFIG.API_BASE_URL + url);
                xhr.setRequestHeader('Authorization', `Bearer ${Auth.getToken()}`);
                xhr.send(formData);
            });
        }
    };

    // ==================== NOTIFICATION SYSTEM ====================
    
    const NotificationSystem = {
        show(message, type = 'info', duration = 5000) {
            const container = this.getContainer();
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            notification.innerHTML = `
                <span class="notification-icon">${icons[type]}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
                <div class="notification-progress"></div>
            `;
            
            container.appendChild(notification);
            
            // Animate progress bar
            const progressBar = notification.querySelector('.notification-progress');
            progressBar.style.animation = `shrink ${duration}ms linear forwards`;
            
            // Auto remove
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease forwards';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        },
        
        getContainer() {
            let container = document.getElementById('notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
                
                // Add styles
                const style = document.createElement('style');
                style.textContent = `
                    .notification {
                        background: white;
                        border-radius: 8px;
                        padding: 16px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        position: relative;
                        overflow: hidden;
                        animation: slideIn 0.3s ease;
                        border-left: 4px solid #3b82f6;
                    }
                    .notification-success { border-left-color: #10b981; }
                    .notification-error { border-left-color: #ef4444; }
                    .notification-warning { border-left-color: #f59e0b; }
                    .notification-info { border-left-color: #3b82f6; }
                    .notification-icon { font-size: 20px; }
                    .notification-message { flex: 1; font-size: 14px; color: #1f2937; }
                    .notification-close {
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: #9ca3af;
                        font-size: 16px;
                        padding: 4px;
                    }
                    .notification-progress {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        height: 3px;
                        background: currentColor;
                        opacity: 0.3;
                    }
                    @keyframes slideIn {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes slideOut {
                        from { transform: translateX(0); opacity: 1; }
                        to { transform: translateX(100%); opacity: 0; }
                    }
                    @keyframes shrink {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `;
                document.head.appendChild(style);
            }
            return container;
        }
    };

    // ==================== SESSION MANAGEMENT ====================
    
    const SessionManager = {
        lastActivity: Date.now(),
        warningShown: false,
        
        init() {
            this.trackActivity();
            this.checkSession();
        },
        
        trackActivity() {
            const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
            events.forEach(event => {
                document.addEventListener(event, () => {
                    this.lastActivity = Date.now();
                    this.warningShown = false;
                });
            });
        },
        
        checkSession() {
            setInterval(() => {
                const inactiveTime = Date.now() - this.lastActivity;
                
                if (inactiveTime >= CONFIG.SESSION_TIMEOUT - CONFIG.AUTO_LOGOUT_WARNING && 
                    !this.warningShown) {
                    this.showWarning();
                    this.warningShown = true;
                }
                
                if (inactiveTime >= CONFIG.SESSION_TIMEOUT) {
                    Auth.logout();
                }
            }, 10000); // Check every 10 seconds
        },
        
        showWarning() {
            NotificationSystem.show(
                'Sesi Anda akan berakhir dalam 5 menit karena tidak ada aktivitas.', 
                'warning', 
                10000
            );
        }
    };

    // ==================== THEME MANAGER ====================
    
    const ThemeManager = {
        init() {
            const savedTheme = Storage.get(CONFIG.THEME_KEY) || 'light';
            this.applyTheme(savedTheme);
        },
        
        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            Storage.set(CONFIG.THEME_KEY, theme);
        },
        
        toggleTheme() {
            const current = Storage.get(CONFIG.THEME_KEY) || 'light';
            const newTheme = current === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
        }
    };

    // ==================== PWA INSTALL PROMPT ====================
    
    const PWAInstaller = {
        deferredPrompt: null,
        
        init() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallButton();
            });
            
            window.addEventListener('appinstalled', () => {
                console.log('PWA installed successfully');
                this.deferredPrompt = null;
            });
        },
        
        showInstallButton() {
            const btn = document.createElement('button');
            btn.textContent = '📱 Install Aplikasi';
            btn.className = 'pwa-install-btn';
            btn.onclick = () => this.install();
            document.body.appendChild(btn);
        },
        
        async install() {
            if (!this.deferredPrompt) return;
            
            this.deferredPrompt.prompt();
            const result = await this.deferredPrompt.userChoice;
            
            console.log('User choice:', result.outcome);
            this.deferredPrompt = null;
            
            // Remove install button
            const btn = document.querySelector('.pwa-install-btn');
            if (btn) btn.remove();
        }
    };

    // ==================== OFFLINE HANDLER ====================
    
    const OfflineHandler = {
        isOnline: navigator.onLine,
        
        init() {
            window.addEventListener('online', () => {
                this.isOnline = true;
                NotificationSystem.show('Koneksi internet kembali tersedia', 'success');
                this.syncPendingData();
            });
            
            window.addEventListener('offline', () => {
                this.isOnline = false;
                NotificationSystem.show('Anda sedang offline. Data akan disimpan lokal.', 'warning');
            });
        },
        
        async syncPendingData() {
            const pending = Storage.get('pending_sync') || [];
            if (pending.length === 0) return;
            
            NotificationSystem.show('Menyinkronkan data offline...', 'info');
            
            for (const item of pending) {
                try {
                    await API.post(item.url, item.data);
                } catch (error) {
                    console.error('Sync failed:', error);
                }
            }
            
            Storage.remove('pending_sync');
            NotificationSystem.show('Sinkronisasi selesai', 'success');
        },
        
        saveForSync(url, data) {
            const pending = Storage.get('pending_sync') || [];
            pending.push({ url, data, timestamp: Date.now() });
            Storage.set('pending_sync', pending);
        }
    };

    // ==================== EXPORT MODULES ====================
    
    window.App = {
        CONFIG,
        formatDate,
        formatFileSize,
        generateId,
        debounce,
        escapeHtml,
        Storage,
        Auth,
        API,
        NotificationSystem,
        SessionManager,
        ThemeManager,
        PWAInstaller,
        OfflineHandler
    };

    // ==================== INITIALIZATION ====================
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log(`${CONFIG.APP_NAME} v${CONFIG.APP_VERSION} initialized`);
        
        // Initialize modules
        ThemeManager.init();
        SessionManager.init();
        PWAInstaller.init();
        OfflineHandler.init();
        
        // Check authentication
        Auth.checkAuth();
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('SW registered'))
                .catch(err => console.error('SW registration failed:', err));
        }
    });

})();
