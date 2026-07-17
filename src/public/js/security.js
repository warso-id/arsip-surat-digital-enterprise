/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Enterprise Security Module
 * ============================================================
 * CSRF Protection, XSS Prevention, Input Sanitization
 * ============================================================
 */

const EnterpriseSecurity = (() => {
    'use strict';

    // ==================== CSRF PROTECTION ====================
    class CSRFProtection {
        constructor() {
            this.tokenKey = 'csrf_token';
            this.headerName = 'X-CSRF-Token';
            this.token = null;
        }

        /**
         * Generate CSRF token
         */
        generateToken() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
            
            this.token = token;
            sessionStorage.setItem(this.tokenKey, token);
            
            return token;
        }

        /**
         * Get current CSRF token
         */
        getToken() {
            if (!this.token) {
                this.token = sessionStorage.getItem(this.tokenKey) || this.generateToken();
            }
            return this.token;
        }

        /**
         * Validate CSRF token
         */
        validate(token) {
            const stored = sessionStorage.getItem(this.tokenKey);
            return token && stored && token === stored;
        }

        /**
         * Add CSRF token to forms
         */
        protectForms() {
            document.querySelectorAll('form[method="POST"]').forEach(form => {
                // Check if already has CSRF input
                if (form.querySelector('input[name="_csrf"]')) return;

                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = '_csrf';
                input.value = this.getToken();
                form.appendChild(input);
            });
        }

        /**
         * Add CSRF token to AJAX requests
         */
        getHeaders() {
            return {
                [this.headerName]: this.getToken(),
            };
        }
    }

    // ==================== XSS PREVENTION ====================
    class XSSPrevention {
        /**
         * Sanitize HTML string
         */
        sanitizeHTML(str) {
            if (!str) return '';
            
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                '/': '&#x2F;',
                '`': '&#x60;',
                '=': '&#x3D;',
            };

            return String(str).replace(/[&<>"'`=\/]/g, char => map[char]);
        }

        /**
         * Sanitize URL
         */
        sanitizeURL(url) {
            if (!url) return '';
            
            // Only allow http, https, and relative URLs
            const sanitized = url.trim().toLowerCase();
            
            if (sanitized.startsWith('javascript:')) return '';
            if (sanitized.startsWith('data:')) return '';
            if (sanitized.startsWith('vbscript:')) return '';
            
            return this.sanitizeHTML(url);
        }

        /**
         * Sanitize object recursively
         */
        sanitizeObject(obj) {
            if (!obj || typeof obj !== 'object') {
                return typeof obj === 'string' ? this.sanitizeHTML(obj) : obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(item => this.sanitizeObject(item));
            }

            const sanitized = {};
            Object.entries(obj).forEach(([key, value]) => {
                sanitized[this.sanitizeHTML(key)] = this.sanitizeObject(value);
            });

            return sanitized;
        }

        /**
         * Strip dangerous HTML tags
         */
        stripDangerousTags(html) {
            if (!html) return '';
            
            // Remove script, iframe, object, embed tags
            return html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
                .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
                .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
                .replace(/on\w+\s*=\s*'[^']*'/gi, '');
        }

        /**
         * Validate and sanitize input
         */
        sanitizeInput(value, type = 'text') {
            if (value === null || value === undefined) return '';

            switch (type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return emailRegex.test(value) ? value.toLowerCase().trim() : '';
                    
                case 'number':
                    const num = Number(value);
                    return isNaN(num) ? 0 : num;
                    
                case 'alphanumeric':
                    return value.replace(/[^a-zA-Z0-9]/g, '');
                    
                case 'text':
                default:
                    return this.sanitizeHTML(String(value).trim());
            }
        }
    }

    // ==================== INPUT VALIDATOR ====================
    class InputValidator {
        /**
         * Validate required field
         */
        required(value, fieldName = 'Field') {
            if (!value || (typeof value === 'string' && !value.trim())) {
                return `${fieldName} harus diisi`;
            }
            return null;
        }

        /**
         * Validate email
         */
        email(value, fieldName = 'Email') {
            if (!value) return null;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(value) ? null : `${fieldName} tidak valid`;
        }

        /**
         * Validate phone number (Indonesian)
         */
        phone(value, fieldName = 'Nomor Telepon') {
            if (!value) return null;
            const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
            return regex.test(value.replace(/[\s-]/g, '')) ? null : `${fieldName} tidak valid`;
        }

        /**
         * Validate NIP
         */
        nip(value, fieldName = 'NIP') {
            if (!value) return null;
            const regex = /^\d{18}$/;
            return regex.test(value) ? null : `${fieldName} harus 18 digit`;
        }

        /**
         * Validate min length
         */
        minLength(value, min, fieldName = 'Field') {
            if (!value) return null;
            return value.length >= min ? null : `${fieldName} minimal ${min} karakter`;
        }

        /**
         * Validate max length
         */
        maxLength(value, max, fieldName = 'Field') {
            if (!value) return null;
            return value.length <= max ? null : `${fieldName} maksimal ${max} karakter`;
        }

        /**
         * Validate file size
         */
        fileSize(file, maxMB = 5, fieldName = 'File') {
            if (!file) return null;
            const maxBytes = maxMB * 1024 * 1024;
            return file.size <= maxBytes ? null : `${fieldName} maksimal ${maxMB}MB`;
        }

        /**
         * Validate file type
         */
        fileType(file, allowedTypes = [], fieldName = 'File') {
            if (!file || allowedTypes.length === 0) return null;
            return allowedTypes.includes(file.type) ? null : `${fieldName} harus bertipe ${allowedTypes.join(', ')}`;
        }

        /**
         * Validate form
         */
        validateForm(formData, rules) {
            const errors = {};

            Object.entries(rules).forEach(([field, fieldRules]) => {
                const value = formData[field];
                
                if (Array.isArray(fieldRules)) {
                    for (const rule of fieldRules) {
                        const error = rule(value);
                        if (error) {
                            errors[field] = error;
                            break;
                        }
                    }
                } else if (typeof fieldRules === 'function') {
                    const error = fieldRules(value);
                    if (error) {
                        errors[field] = error;
                    }
                }
            });

            return {
                valid: Object.keys(errors).length === 0,
                errors,
            };
        }
    }

    // ==================== ENCRYPTION UTILITIES ====================
    class EncryptionUtils {
        /**
         * Simple encrypt (for local storage)
         */
        encrypt(data, key = 'EnterpriseDefaultKey') {
            try {
                const json = JSON.stringify(data);
                let result = '';
                for (let i = 0; i < json.length; i++) {
                    result += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                }
                return btoa(result);
            } catch (e) {
                return null;
            }
        }

        /**
         * Simple decrypt (for local storage)
         */
        decrypt(encoded, key = 'EnterpriseDefaultKey') {
            try {
                const decoded = atob(encoded);
                let result = '';
                for (let i = 0; i < decoded.length; i++) {
                    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                }
                return JSON.parse(result);
            } catch (e) {
                return null;
            }
        }

        /**
         * Hash string (SHA-256 if available)
         */
        async hash(str) {
            if (crypto.subtle) {
                const encoder = new TextEncoder();
                const data = encoder.encode(str);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
            // Fallback simple hash
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash).toString(16);
        }

        /**
         * Generate random string
         */
        generateRandom(length = 32) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            return Array.from(array, byte => chars[byte % chars.length]).join('');
        }
    }

    // ==================== SESSION PROTECTION ====================
    class SessionProtection {
        /**
         * Check session integrity
         */
        checkIntegrity() {
            const token = localStorage.getItem('enterprise_token');
            const user = localStorage.getItem('enterprise_user');
            const sessionStart = sessionStorage.getItem('session_start');

            if (token && user && sessionStart) {
                const elapsed = Date.now() - parseInt(sessionStart);
                const maxSession = 3600000; // 1 hour

                if (elapsed > maxSession) {
                    this.terminateSession('Session expired');
                    return false;
                }
                return true;
            }

            if (token && !sessionStart) {
                this.terminateSession('Invalid session');
                return false;
            }

            return false;
        }

        /**
         * Terminate session
         */
        terminateSession(reason = 'Manual logout') {
            console.log('🔒 Terminating session:', reason);
            
            localStorage.removeItem('enterprise_token');
            localStorage.removeItem('enterprise_refresh');
            localStorage.removeItem('enterprise_user');
            sessionStorage.clear();

            // Log security event
            if (window.EnterpriseLogger) {
                window.EnterpriseLogger.warn('Session terminated: ' + reason);
            }

            // Redirect to login
            if (!window.location.href.includes('login.html')) {
                window.location.href = '/login.html';
            }
        }

        /**
         * Extend session
         */
        extendSession() {
            sessionStorage.setItem('session_start', Date.now().toString());
            sessionStorage.setItem('last_activity', Date.now().toString());
        }

        /**
         * Setup activity tracking
         */
        trackActivity() {
            const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
            
            const handler = () => {
                sessionStorage.setItem('last_activity', Date.now().toString());
            };

            events.forEach(event => {
                document.addEventListener(event, handler, { passive: true, once: false });
            });

            // Periodic check
            setInterval(() => {
                const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');
                const elapsed = Date.now() - lastActivity;
                
                if (elapsed > 1800000 && localStorage.getItem('enterprise_token')) { // 30 minutes
                    this.terminateSession('Inactivity timeout');
                }
            }, 60000);
        }
    }

    // ==================== INITIALIZE ====================
    const csrf = new CSRFProtection();
    const xss = new XSSPrevention();
    const validator = new InputValidator();
    const encryption = new EncryptionUtils();
    const session = new SessionProtection();

    // Generate CSRF token
    csrf.generateToken();

    // Protect forms
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            csrf.protectForms();
            session.trackActivity();
        });
    } else {
        csrf.protectForms();
        session.trackActivity();
    }

    // Check session
    if (localStorage.getItem('enterprise_token')) {
        session.checkIntegrity();
    }

    // ==================== PUBLIC API ====================
    return {
        csrf,
        xss,
        validator,
        encryption,
        session,

        // Quick methods
        sanitize: (str) => xss.sanitizeHTML(str),
        sanitizeURL: (url) => xss.sanitizeURL(url),
        sanitizeInput: (value, type) => xss.sanitizeInput(value, type),
        sanitizeObject: (obj) => xss.sanitizeObject(obj),

        validate: (formData, rules) => validator.validateForm(formData, rules),
        encrypt: (data, key) => encryption.encrypt(data, key),
        decrypt: (data, key) => encryption.decrypt(data, key),
        hash: (str) => encryption.hash(str),
        generateRandom: (length) => encryption.generateRandom(length),

        getCSRFToken: () => csrf.getToken(),
        getCSRFHeaders: () => csrf.getHeaders(),

        checkSession: () => session.checkIntegrity(),
        logout: (reason) => session.terminateSession(reason),
    };
})();

window.EnterpriseSecurity = EnterpriseSecurity;
