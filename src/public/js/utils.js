/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Utility Functions
 * ============================================================
 */

const EnterpriseUtils = (() => {
    'use strict';

    // ==================== DATE UTILITIES ====================
    const DateUtils = {
        /**
         * Format date to Indonesian locale
         */
        formatDate(date, format = 'full') {
            if (!date) return '-';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'Invalid Date';
            
            const options = {
                full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
                long: { year: 'numeric', month: 'long', day: 'numeric' },
                medium: { year: 'numeric', month: 'short', day: 'numeric' },
                short: { day: '2-digit', month: '2-digit', year: 'numeric' },
                time: { hour: '2-digit', minute: '2-digit' },
                datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            };
            
            return d.toLocaleDateString('id-ID', options[format] || options.full);
        },

        /**
         * Format date to ISO string (YYYY-MM-DD)
         */
        toISODate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        },

        /**
         * Get relative time (e.g., "5 menit yang lalu")
         */
        timeAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            const diffWeek = Math.floor(diffDay / 7);
            const diffMonth = Math.floor(diffDay / 30);
            const diffYear = Math.floor(diffDay / 365);

            if (diffSec < 60) return 'Baru saja';
            if (diffMin < 60) return `${diffMin} menit yang lalu`;
            if (diffHour < 24) return `${diffHour} jam yang lalu`;
            if (diffDay < 7) return `${diffDay} hari yang lalu`;
            if (diffWeek < 4) return `${diffWeek} minggu yang lalu`;
            if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;
            return `${diffYear} tahun yang lalu`;
        },

        /**
         * Add days to date
         */
        addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },

        /**
         * Get date range
         */
        getDateRange(range) {
            const now = new Date();
            const ranges = {
                today: { start: new Date(now.setHours(0,0,0,0)), end: new Date(now.setHours(23,59,59,999)) },
                yesterday: { start: this.addDays(new Date().setHours(0,0,0,0), -1), end: new Date(new Date().setHours(23,59,59,999) - 86400000) },
                thisWeek: { start: new Date(now.setDate(now.getDate() - now.getDay())), end: new Date() },
                thisMonth: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date() },
                thisYear: { start: new Date(now.getFullYear(), 0, 1), end: new Date() },
            };
            return ranges[range] || ranges.today;
        },

        /**
         * Check if date is today
         */
        isToday(date) {
            const d = new Date(date);
            const today = new Date();
            return d.getDate() === today.getDate() &&
                   d.getMonth() === today.getMonth() &&
                   d.getFullYear() === today.getFullYear();
        },

        /**
         * Check if date is overdue
         */
        isOverdue(date) {
            return new Date(date) < new Date();
        },
    };

    // ==================== NUMBER UTILITIES ====================
    const NumberUtils = {
        /**
         * Format number to Indonesian currency
         */
        formatCurrency(amount, currency = 'IDR') {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        },

        /**
         * Format number with thousands separator
         */
        formatNumber(number) {
            return new Intl.NumberFormat('id-ID').format(number);
        },

        /**
         * Format percentage
         */
        formatPercent(number, decimals = 1) {
            return `${number.toFixed(decimals)}%`;
        },

        /**
         * Generate random number between min and max
         */
        random(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Clamp number between min and max
         */
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * Round to decimal places
         */
        round(value, decimals = 0) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        },
    };

    // ==================== STRING UTILITIES ====================
    const StringUtils = {
        /**
         * Truncate string with ellipsis
         */
        truncate(str, maxLength = 50, suffix = '...') {
            if (!str) return '';
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - suffix.length) + suffix;
        },

        /**
         * Capitalize first letter
         */
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        /**
         * Convert string to title case
         */
        titleCase(str) {
            if (!str) return '';
            return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        },

        /**
         * Convert string to slug
         */
        slugify(str) {
            return str
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        /**
         * Generate unique ID
         */
        generateId(prefix = '') {
            return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
        },

        /**
         * Generate random string
         */
        randomString(length = 8) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },

        /**
         * Mask string (for sensitive data)
         */
        mask(str, visibleChars = 4, maskChar = '*') {
            if (!str) return '';
            const visible = str.slice(-visibleChars);
            const masked = maskChar.repeat(Math.max(0, str.length - visibleChars));
            return masked + visible;
        },

        /**
         * Strip HTML tags
         */
        stripHtml(html) {
            const tmp = document.createElement('div');
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        },

        /**
         * Escape HTML entities
         */
        escapeHtml(str) {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        },
    };

    // ==================== VALIDATION UTILITIES ====================
    const ValidationUtils = {
        /**
         * Validate email
         */
        isValidEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        /**
         * Validate phone number (Indonesian)
         */
        isValidPhone(phone) {
            const re = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
            return re.test(phone.replace(/[\s-]/g, ''));
        },

        /**
         * Validate NIP (Indonesian civil servant number)
         */
        isValidNIP(nip) {
            const re = /^\d{18}$/;
            return re.test(nip);
        },

        /**
         * Validate required field
         */
        isRequired(value) {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined;
        },

        /**
         * Validate minimum length
         */
        minLength(value, min) {
            return typeof value === 'string' && value.length >= min;
        },

        /**
         * Validate maximum length
         */
        maxLength(value, max) {
            return typeof value === 'string' && value.length <= max;
        },

        /**
         * Validate file size (in MB)
         */
        isValidFileSize(file, maxSizeMB = 5) {
            return file.size <= maxSizeMB * 1024 * 1024;
        },

        /**
         * Validate file type
         */
        isValidFileType(file, allowedTypes = []) {
            if (allowedTypes.length === 0) return true;
            return allowedTypes.includes(file.type);
        },
    };

    // ==================== DOM UTILITIES ====================
    const DOMUtils = {
        /**
         * Get element by selector
         */
        $(selector, parent = document) {
            return parent.querySelector(selector);
        },

        /**
         * Get all elements by selector
         */
        $$(selector, parent = document) {
            return Array.from(parent.querySelectorAll(selector));
        },

        /**
         * Create element with attributes and children
         */
        createElement(tag, attrs = {}, ...children) {
            const element = document.createElement(tag);
            
            Object.entries(attrs).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('on')) {
                    element.addEventListener(key.slice(2).toLowerCase(), value);
                } else if (key === 'dataset') {
                    Object.entries(value).forEach(([k, v]) => {
                        element.dataset[k] = v;
                    });
                } else {
                    element.setAttribute(key, value);
                }
            });

            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });

            return element;
        },

        /**
         * Add event listener with delegation
         */
        delegate(parent, eventType, selector, handler) {
            parent.addEventListener(eventType, (e) => {
                const target = e.target.closest(selector);
                if (target) {
                    handler.call(target, e);
                }
            });
        },

        /**
         * Fade in element
         */
        fadeIn(element, duration = 300) {
            element.style.opacity = 0;
            element.style.display = '';
            element.style.transition = `opacity ${duration}ms ease`;
            
            requestAnimationFrame(() => {
                element.style.opacity = 1;
            });
        },

        /**
         * Fade out element
         */
        fadeOut(element, duration = 300) {
            element.style.opacity = 1;
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = 0;
            
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        },

        /**
         * Copy to clipboard
         */
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (error) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = 0;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            }
        },

        /**
         * Download file from URL
         */
        downloadFile(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        /**
         * Scroll to element
         */
        scrollTo(element, offset = 0) {
            const target = typeof element === 'string' ? document.querySelector(element) : element;
            if (target) {
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        },
    };

    // ==================== STORAGE UTILITIES ====================
    const StorageUtils = {
        /**
         * Set item with expiry
         */
        setWithExpiry(key, value, ttlSeconds) {
            const item = {
                value: value,
                expiry: Date.now() + (ttlSeconds * 1000),
            };
            localStorage.setItem(key, JSON.stringify(item));
        },

        /**
         * Get item with expiry check
         */
        getWithExpiry(key) {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        },

        /**
         * Get storage size
         */
        getStorageSize() {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                total += (key.length + value.length) * 2; // UTF-16
            }
            return total;
        },

        /**
         * Check if storage is available
         */
        isAvailable() {
            try {
                const test = '__storage_test__';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
    };

    // ==================== NETWORK UTILITIES ====================
    const NetworkUtils = {
        /**
         * Check if online
         */
        isOnline() {
            return navigator.onLine;
        },

        /**
         * Get connection info
         */
        getConnectionInfo() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!connection) return null;
            
            return {
                type: connection.type,
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
            };
        },

        /**
         * Fetch with timeout
         */
        async fetchWithTimeout(url, options = {}, timeout = 30000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        },

        /**
         * Retry fetch
         */
        async fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
            for (let i = 0; i < retries; i++) {
                try {
                    return await fetch(url, options);
                } catch (error) {
                    if (i === retries - 1) throw error;
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        },
    };

    // ==================== DEBOUNCE & THROTTLE ====================
    const PerformanceUtils = {
        /**
         * Debounce function
         */
        debounce(func, wait = 300) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Throttle function
         */
        throttle(func, limit = 300) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => {
                        inThrottle = false;
                    }, limit);
                }
            };
        },

        /**
         * Memoize function
         */
        memoize(func) {
            const cache = new Map();
            return function executedFunction(...args) {
                const key = JSON.stringify(args);
                if (cache.has(key)) return cache.get(key);
                const result = func(...args);
                cache.set(key, result);
                return result;
            };
        },

        /**
         * Once function (execute only once)
         */
        once(func) {
            let executed = false;
            let result;
            return function executedFunction(...args) {
                if (!executed) {
                    executed = true;
                    result = func(...args);
                }
                return result;
            };
        },
    };

    // ==================== EXPORT ====================
    return {
        date: DateUtils,
        number: NumberUtils,
        string: StringUtils,
        validation: ValidationUtils,
        dom: DOMUtils,
        storage: StorageUtils,
        network: NetworkUtils,
        performance: PerformanceUtils,
    };
})();

// Export globally
window.EnterpriseUtils = EnterpriseUtils;
