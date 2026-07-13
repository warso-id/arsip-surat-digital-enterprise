/**
 * ============================================
 * UTILS.JS - Utility Functions (Lengkap)
 * ARSIP SURAT DIGITAL v3.2.2
 * Full Features: Responsive, Sync Backend,
 * Material Design 3, Auto Layout, Adaptive
 * ============================================
 */

const Utils = {
    // ========== KONFIGURASI GLOBAL ==========
    config: {
        apiBaseUrl: '',
        spreadsheetId: '',
        deploymentId: '',
        defaultTimeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        cachePrefix: 'arsip_surat_',
        cacheExpiry: 5 * 60 * 1000, // 5 menit
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
        itemsPerPage: {
            desktop: 20,
            tablet: 15,
            mobile: 10
        },
        breakpoints: {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            wide: 1440
        }
    },

    // ========== INISIALISASI ==========
    init(config = {}) {
        this.config = { ...this.config, ...config };
        this.setupDeviceDetection();
        this.setupErrorHandling();
        this.setupPerformanceMonitoring();
        console.log('Utils initialized:', {
            device: this.device,
            breakpoint: this.getCurrentBreakpoint(),
            touchSupport: this.isTouchDevice()
        });
    },

    // ========== DEVICE & RESPONSIVE UTILITIES ==========
    device: {
        type: 'desktop',
        os: 'unknown',
        browser: 'unknown',
        touch: false,
        orientation: 'landscape',
        pixelRatio: 1,
        screenWidth: 0,
        screenHeight: 0
    },

    setupDeviceDetection() {
        const ua = navigator.userAgent;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Deteksi tipe perangkat
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            this.device.type = 'tablet';
        } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            this.device.type = 'mobile';
        } else {
            this.device.type = 'desktop';
        }

        // Deteksi OS
        if (/Windows/i.test(ua)) this.device.os = 'windows';
        else if (/Mac/i.test(ua)) this.device.os = 'macos';
        else if (/Linux/i.test(ua)) this.device.os = 'linux';
        else if (/Android/i.test(ua)) this.device.os = 'android';
        else if (/iOS|iPhone|iPad|iPod/i.test(ua)) this.device.os = 'ios';

        // Deteksi browser
        if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) this.device.browser = 'chrome';
        else if (/Firefox/i.test(ua)) this.device.browser = 'firefox';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) this.device.browser = 'safari';
        else if (/Edge/i.test(ua)) this.device.browser = 'edge';
        else if (/Opera|OPR/i.test(ua)) this.device.browser = 'opera';

        // Deteksi touch support
        this.device.touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

        // Informasi layar
        this.device.orientation = width > height ? 'landscape' : 'portrait';
        this.device.pixelRatio = window.devicePixelRatio || 1;
        this.device.screenWidth = width;
        this.device.screenHeight = height;
    },

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        const bp = this.config.breakpoints;
        if (width <= bp.mobile) return 'mobile';
        if (width <= bp.tablet) return 'tablet';
        if (width <= bp.desktop) return 'desktop';
        return 'wide';
    },

    getItemsPerPage() {
        const breakpoint = this.getCurrentBreakpoint();
        return this.config.itemsPerPage[breakpoint] || 20;
    },

    isTouchDevice() {
        return this.device.touch;
    },

    isMobile() {
        return this.device.type === 'mobile';
    },

    isTablet() {
        return this.device.type === 'tablet';
    },

    isDesktop() {
        return this.device.type === 'desktop';
    },

    isIOS() {
        return this.device.os === 'ios';
    },

    isAndroid() {
        return this.device.os === 'android';
    },

    // ========== DATE UTILITIES ==========
    formatDate(date, format = 'full') {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';

        const options = {
            full: { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' },
            short: { day: '2-digit', month: 'short', year: 'numeric' },
            long: { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
            dateOnly: { day: '2-digit', month: '2-digit', year: 'numeric' },
            timeOnly: { hour: '2-digit', minute: '2-digit' },
            iso: null
        };

        if (format === 'iso') {
            return d.toISOString();
        }

        return d.toLocaleDateString('id-ID', options[format] || options.full);
    },

    formatDateShort(date) {
        return this.formatDate(date, 'short');
    },

    formatDateLong(date) {
        return this.formatDate(date, 'long');
    },

    formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    formatDateTimeForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
    },

    timeAgo(date) {
        if (!date) return '-';
        const now = new Date();
        const past = new Date(date);
        const diff = Math.floor((now - past) / 1000);

        if (diff < 0) return 'akan datang';

        const intervals = [
            { label: 'tahun', seconds: 31536000 },
            { label: 'bulan', seconds: 2592000 },
            { label: 'minggu', seconds: 604800 },
            { label: 'hari', seconds: 86400 },
            { label: 'jam', seconds: 3600 },
            { label: 'menit', seconds: 60 },
            { label: 'detik', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(diff / interval.seconds);
            if (count > 0) {
                return `${count} ${interval.label} yang lalu`;
            }
        }
        return 'baru saja';
    },

    getDayName(date) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return days[new Date(date).getDay()];
    },

    getMonthName(month) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[month];
    },

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    isWeekend(date) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    getDaysBetween(start, end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // ========== STRING UTILITIES ==========
    truncate(str, maxLength = 50) {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength) + '...';
    },

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    titleCase(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    },

    slugify(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    },

    generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },

    // ========== NUMBER UTILITIES ==========
    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        return num.toLocaleString('id-ID');
    },

    formatCurrency(num) {
        if (num === undefined || num === null) return 'Rp 0';
        return 'Rp ' + num.toLocaleString('id-ID');
    },

    formatPercentage(num, decimals = 2) {
        if (num === undefined || num === null) return '0%';
        return (num * 100).toFixed(decimals) + '%';
    },

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },

    // ========== FILE UTILITIES ==========
    formatFileSize(bytes) {
        return this.formatBytes(bytes);
    },

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    getFileNameWithoutExt(filename) {
        return filename.substring(0, filename.lastIndexOf('.')) || filename;
    },

    getFileIcon(mimeType) {
        const icons = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'svg': 'fa-file-image',
            'webp': 'fa-file-image',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive',
            'txt': 'fa-file-alt',
            'json': 'fa-file-code',
            'xml': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'js': 'fa-file-code',
            'mp4': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio'
        };
        return icons[mimeType] || 'fa-file';
    },

    getFileIconByExtension(extension) {
        const iconMap = {
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'svg': 'fa-file-image',
            'webp': 'fa-file-image',
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive',
            'txt': 'fa-file-alt',
            'csv': 'fa-file-csv',
            'json': 'fa-file-code',
            'xml': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'js': 'fa-file-code',
            'mp4': 'fa-file-video',
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio'
        };
        return iconMap[extension.toLowerCase()] || 'fa-file';
    },

    validateFile(file) {
        const errors = [];
        
        if (!file) {
            errors.push('File tidak ditemukan');
            return { valid: false, errors };
        }

        const ext = this.getFileExtension(file.name);
        if (!this.config.allowedFileTypes.includes(ext)) {
            errors.push(`Tipe file .${ext} tidak diizinkan`);
        }

        if (file.size > this.config.maxFileSize) {
            errors.push(`Ukuran file maksimal ${this.formatFileSize(this.config.maxFileSize)}`);
        }

        return {
            valid: errors.length === 0,
            errors,
            extension: ext,
            size: file.size
        };
    },

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // ========== STATUS UTILITIES ==========
    statusConfig: {
        'diterima': { label: 'Diterima', color: '#1976D2', icon: 'fa-inbox' },
        'diproses': { label: 'Diproses', color: '#FF9800', icon: 'fa-spinner' },
        'didisposisikan': { label: 'Didisposisikan', color: '#7B1FA2', icon: 'fa-share' },
        'selesai': { label: 'Selesai', color: '#4CAF50', icon: 'fa-check-circle' },
        'ditolak': { label: 'Ditolak', color: '#F44336', icon: 'fa-times-circle' },
        'draft': { label: 'Draft', color: '#9E9E9E', icon: 'fa-pencil-alt' },
        'review': { label: 'Review', color: '#FFC107', icon: 'fa-search' },
        'approved': { label: 'Disetujui', color: '#009688', icon: 'fa-thumbs-up' },
        'ttd': { label: 'TTD', color: '#E91E63', icon: 'fa-signature' },
        'dikirim': { label: 'Dikirim', color: '#00BCD4', icon: 'fa-paper-plane' },
        'arsip': { label: 'Arsip', color: '#795548', icon: 'fa-archive' },
        'pending': { label: 'Pending', color: '#FF5722', icon: 'fa-clock' }
    },

    getStatusBadge(status) {
        const config = this.statusConfig[status] || { label: status, color: '#9E9E9E', icon: 'fa-question-circle' };
        return `<span class="status-badge" style="--status-color: ${config.color}">
            <i class="fas ${config.icon}"></i> ${config.label}
        </span>`;
    },

    getStatusBadgeClass(status) {
        const map = {
            'diterima': 'status-badge diterima',
            'diproses': 'status-badge diproses',
            'didisposisikan': 'status-badge didisposisikan',
            'selesai': 'status-badge selesai',
            'ditolak': 'status-badge ditolak',
            'draft': 'status-badge draft',
            'review': 'status-badge review',
            'approved': 'status-badge approved',
            'ttd': 'status-badge ttd',
            'dikirim': 'status-badge dikirim',
            'arsip': 'status-badge arsip',
            'pending': 'status-badge pending'
        };
        return map[status] || 'status-badge';
    },

    getStatusLabel(status) {
        return this.statusConfig[status]?.label || status;
    },

    getStatusColor(status) {
        return this.statusConfig[status]?.color || '#9E9E9E';
    },

    getStatusIcon(status) {
        return this.statusConfig[status]?.icon || 'fa-question-circle';
    },

    // ========== COLOR UTILITIES ==========
    colors: {
        primary: '#1976D2',
        secondary: '#424242',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        light: '#F5F5F5',
        dark: '#212121'
    },

    getRandomColor() {
        const colors = Object.values(this.colors);
        return colors[Math.floor(Math.random() * colors.length)];
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    lightenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        const lighten = (color) => Math.min(255, Math.floor(color + (255 - color) * (percent / 100)));
        return this.rgbToHex(lighten(rgb.r), lighten(rgb.g), lighten(rgb.b));
    },

    darkenColor(hex, percent) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return hex;
        const darken = (color) => Math.max(0, Math.floor(color * (1 - percent / 100)));
        return this.rgbToHex(darken(rgb.r), darken(rgb.g), darken(rgb.b));
    },

    // ========== FORM UTILITIES ==========
    generateOptions(data, valueKey, labelKey, selected = null, placeholder = '-- Pilih --') {
        let html = placeholder ? `<option value="">${placeholder}</option>` : '';
        html += data.map(item => `
            <option value="${item[valueKey]}" ${item[valueKey] == selected ? 'selected' : ''}>
                ${item[labelKey]}
            </option>
        `).join('');
        return html;
    },

    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        return data;
    },

    populateForm(form, data) {
        for (const [key, value] of Object.entries(data)) {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else if (field.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value || '';
                }
            }
        }
    },

    resetForm(form) {
        form.reset();
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
    },

    // ========== VALIDATION ==========
    validators: {
        required: (value) => value !== undefined && value !== null && value.toString().trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^[0-9+\-\s()]{8,15}$/.test(value),
        nip: (value) => /^[0-9]{18}$/.test(value),
        minLength: (value, min) => value && value.length >= min,
        maxLength: (value, max) => value && value.length <= max,
        numeric: (value) => /^[0-9]+$/.test(value),
        url: (value) => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(value)
    },

    validateEmail(email) {
        return this.validators.email(email);
    },

    validatePhone(phone) {
        return this.validators.phone(phone);
    },

    validateNIP(nip) {
        return this.validators.nip(nip);
    },

    validateField(value, rules) {
        const errors = [];
        for (const [rule, param] of Object.entries(rules)) {
            const validator = this.validators[rule];
            if (validator && !validator(value, param)) {
                errors.push(this.getValidationMessage(rule, param));
            }
        }
        return errors;
    },

    getValidationMessage(rule, param) {
        const messages = {
            required: 'Field ini wajib diisi',
            email: 'Format email tidak valid',
            phone: 'Format nomor telepon tidak valid',
            nip: 'NIP harus 18 digit angka',
            minLength: `Minimal ${param} karakter`,
            maxLength: `Maksimal ${param} karakter`,
            numeric: 'Hanya boleh berisi angka',
            url: 'Format URL tidak valid'
        };
        return messages[rule] || 'Tidak valid';
    },

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.insertBefore(feedback, field.nextElementSibling);
        }
        feedback.textContent = message;
    },

    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.remove();
        }
    },

    // ========== API & BACKEND COMMUNICATION ==========
    apiCallInProgress: false,
    apiQueue: [],

    async callGoogleScript(functionName, params = {}, method = 'POST') {
        if (this.apiCallInProgress) {
            return new Promise((resolve, reject) => {
                this.apiQueue.push({ functionName, params, method, resolve, reject });
            });
        }

        this.apiCallInProgress = true;
        const url = this.config.apiBaseUrl || this.config.deploymentId;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.defaultTimeout);

            let response;
            if (method === 'GET') {
                const queryString = new URLSearchParams({ ...params, action: functionName }).toString();
                response = await fetch(`${url}?${queryString}`, {
                    signal: controller.signal
                });
            } else {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: functionName, ...params }),
                    signal: controller.signal
                });
            }

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Silakan coba lagi.');
            }
            throw error;
        } finally {
            this.apiCallInProgress = false;
            if (this.apiQueue.length > 0) {
                const next = this.apiQueue.shift();
                this.callGoogleScript(next.functionName, next.params, next.method)
                    .then(next.resolve)
                    .catch(next.reject);
            }
        }
    },

    async retryApiCall(functionName, params, method, attempts = null) {
        const maxAttempts = attempts || this.config.retryAttempts;
        let lastError;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                return await this.callGoogleScript(functionName, params, method);
            } catch (error) {
                lastError = error;
                if (i < maxAttempts - 1) {
                    await this.delay(this.config.retryDelay * (i + 1));
                }
            }
        }
        throw lastError;
    },

    async fetchFromSpreadsheet(query = {}) {
        return this.retryApiCall('getData', query);
    },

    async saveToSpreadsheet(data) {
        return this.retryApiCall('saveData', data);
    },

    async updateSpreadsheet(id, data) {
        return this.retryApiCall('updateData', { id, ...data });
    },

    async deleteFromSpreadsheet(id) {
        return this.retryApiCall('deleteData', { id });
    },

    async uploadFile(file, metadata = {}) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        const base64 = await this.fileToBase64(file);
        return this.retryApiCall('uploadFile', {
            fileName: file.name,
            mimeType: file.type,
            data: base64,
            ...metadata
        });
    },

    // ========== CACHE UTILITIES ==========
    setCache(key, data, expiry = null) {
        try {
            const cacheKey = this.config.cachePrefix + key;
            const cacheData = {
                data,
                timestamp: Date.now(),
                expiry: expiry || this.config.cacheExpiry
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Cache set failed:', e);
        }
    },

    getCache(key) {
        try {
            const cacheKey = this.config.cachePrefix + key;
            const cached = localStorage.getItem(cacheKey);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp > cacheData.expiry) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            return cacheData.data;
        } catch (e) {
            return null;
        }
    },

    clearCache(key = null) {
        if (key) {
            localStorage.removeItem(this.config.cachePrefix + key);
        } else {
            Object.keys(localStorage)
                .filter(k => k.startsWith(this.config.cachePrefix))
                .forEach(k => localStorage.removeItem(k));
        }
    },

    // ========== DEBOUNCE & THROTTLE ==========
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

    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ========== DOM UTILITIES ==========
    $(selector, parent = document) {
        return parent.querySelector(selector);
    },

    $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    },

    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.assign(element.dataset, value);
            } else {
                element.setAttribute(key, value);
            }
        }

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });

        return element;
    },

    fadeIn(element, duration = 300) {
        element.style.opacity = 0;
        element.style.display = '';
        element.style.transition = `opacity ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.opacity = 1;
        });
    },

    fadeOut(element, duration = 300) {
        element.style.opacity = 1;
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = 0;
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    },

    slideDown(element, duration = 300) {
        element.style.display = '';
        const height = element.scrollHeight;
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.height = height + 'px';
        });
        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
        }, duration);
    },

    slideUp(element, duration = 300) {
        element.style.height = element.scrollHeight + 'px';
        element.style.overflow = 'hidden';
        element.style.transition = `height ${duration}ms ease`;
        requestAnimationFrame(() => {
            element.style.height = '0';
        });
        setTimeout(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
        }, duration);
    },

    // ========== NOTIFICATION & TOAST ==========
    toastContainer: null,

    initToast() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'toast-container';
            this.toastContainer.setAttribute('aria-live', 'polite');
            this.toastContainer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.toastContainer);
        }
    },

    showToast(type, title, message, duration = 5000) {
        this.initToast();

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.setProperty('--toast-color', colors[type]);
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close" aria-label="Tutup">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
        `;

        this.toastContainer.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.removeToast(toast));

        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    },

    removeToast(toast) {
        toast.classList.add('toast-hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    // ========== MODAL DIALOG ==========
    showModal(content, options = {}) {
        const {
            title = '',
            size = 'medium',
            closeOnBackdrop = true,
            onClose = null
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        if (title) {
            modal.setAttribute('aria-label', title);
        }

        modal.innerHTML = `
            <div class="modal-container modal-${size}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" aria-label="Tutup">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${typeof content === 'string' ? content : ''}
                </div>
            </div>
        `;

        if (typeof content !== 'string' && content instanceof Node) {
            modal.querySelector('.modal-body').appendChild(content);
        }

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.classList.add('modal-closing');
            setTimeout(() => {
                modal.remove();
                document.body.style.overflow = '';
                if (onClose) onClose();
            }, 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);

        if (closeOnBackdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        return { modal, close: closeModal };
    },

    showConfirm(title, message, onConfirm, onCancel) {
        const content = `
            <p>${message}</p>
            <div class="modal-actions">
                <button class="btn btn-secondary cancel-btn">Batal</button>
                <button class="btn btn-primary confirm-btn">Konfirmasi</button>
            </div>
        `;

        const { modal, close } = this.showModal(content, { title, size: 'small' });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });

        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });
    },

    // ========== LOADING INDICATOR ==========
    showLoading(message = 'Memuat...') {
        let loader = document.getElementById('global-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-spinner">
                    <div class="spinner"></div>
                    <p class="loader-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.querySelector('.loader-message').textContent = message;
        loader.classList.add('active');
    },

    hideLoading() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.remove('active');
        }
    },

    // ========== SKELETON LOADER ==========
    generateSkeleton(type = 'card', count = 1) {
        const templates = {
            card: `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-image"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text skeleton-text-short"></div>
                </div>
            `,
            table: `
                <div class="skeleton-table">
                    <div class="skeleton skeleton-row"></div>
                    <div class="skeleton skeleton-row"></div>
                    <div class="skeleton skeleton-row"></div>
                </div>
            `,
            list: `
                <div class="skeleton-list">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            `,
            text: `<div class="skeleton skeleton-text"></div>`
        };

        const template = templates[type] || templates.text;
        return Array(count).fill(template).join('');
    },

    // ========== INFINITE SCROLL ==========
    infiniteScroll: {
        callback: null,
        loading: false,
        threshold: 200,

        init(callback, threshold = 200) {
            this.callback = callback;
            this.threshold = threshold;
            this.loading = false;
            this.bindEvents();
        },

        bindEvents() {
            const throttledScroll = Utils.throttle(() => this.handleScroll(), 200);
            window.addEventListener('scroll', throttledScroll);
        },

        handleScroll() {
            if (this.loading) return;

            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.scrollHeight;

            if (documentHeight - scrollPosition <= this.threshold) {
                this.loadMore();
            }
        },

        async loadMore() {
            if (this.loading) return;
            this.loading = true;
            Utils.showLoading('Memuat data...');

            try {
                if (this.callback) {
                    await this.callback();
                }
            } catch (error) {
                Utils.showToast('error', 'Error', 'Gagal memuat data tambahan');
            } finally {
                this.loading = false;
                Utils.hideLoading();
            }
        },

        reset() {
            this.loading = false;
        }
    },

    // ========== PAGINATION ==========
    generatePagination(currentPage, totalPages, callback, maxVisible = 5) {
        if (totalPages <= 1) return '';

        const container = document.createElement('div');
        container.className = 'pagination';

        // Previous button
        if (currentPage > 1) {
            container.appendChild(this.createPaginationBtn(currentPage - 1, '<i class="fas fa-chevron-left"></i>', callback));
        }

        // Page numbers
        const halfVisible = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - halfVisible);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            container.appendChild(this.createPaginationBtn(1, '1', callback));
            if (start > 2) {
                const dots = document.createElement('span');
                dots.className = 'page-dots';
                dots.textContent = '...';
                container.appendChild(dots);
            }
        }

        for (let i = start; i <= end; i++) {
            const btn = this.createPaginationBtn(i, i.toString(), callback);
            if (i === currentPage) btn.classList.add('active');
            container.appendChild(btn);
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                const dots = document.createElement('span');
                dots.className = 'page-dots';
                dots.textContent = '...';
                container.appendChild(dots);
            }
            container.appendChild(this.createPaginationBtn(totalPages, totalPages.toString(), callback));
        }

        // Next button
        if (currentPage < totalPages) {
            container.appendChild(this.createPaginationBtn(currentPage + 1, '<i class="fas fa-chevron-right"></i>', callback));
        }

        // Page info
        const info = document.createElement('span');
        info.className = 'page-info';
        info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
        container.appendChild(info);

        return container;
    },

    createPaginationBtn(page, label, callback) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.setAttribute('data-page', page);
        btn.setAttribute('aria-label', `Halaman ${page}`);
        btn.innerHTML = label;
        btn.addEventListener('click', () => {
            if (callback) callback(page);
        });
        return btn;
    },

    // ========== SEARCH & FILTER ==========
    searchFilter: {
        debouncedSearch: null,

        init(callback, delay = 300) {
            this.debouncedSearch = Utils.debounce(callback, delay);
        },

        search(query, data, fields) {
            if (!query) return data;
            const lowerQuery = query.toLowerCase();
            return data.filter(item => {
                return fields.some(field => {
                    const value = field.split('.').reduce((obj, key) => obj?.[key], item);
                    return value && value.toString().toLowerCase().includes(lowerQuery);
                });
            });
        },

        filterByStatus(data, status) {
            if (!status || status === 'all') return data;
            return data.filter(item => item.status === status);
        },

        filterByDateRange(data, startDate, endDate, dateField = 'tanggal') {
            if (!startDate && !endDate) return data;
            return data.filter(item => {
                const itemDate = new Date(item[dateField]);
                if (startDate && itemDate < new Date(startDate)) return false;
                if (endDate && itemDate > new Date(endDate)) return false;
                return true;
            });
        },

        sortData(data, field, order = 'asc') {
            return [...data].sort((a, b) => {
                const valueA = field.split('.').reduce((obj, key) => obj?.[key], a);
                const valueB = field.split('.').reduce((obj, key) => obj?.[key], b);

                if (valueA < valueB) return order === 'asc' ? -1 : 1;
                if (valueA > valueB) return order === 'asc' ? 1 : -1;
                return 0;
            });
        }
    },

    // ========== ERROR HANDLING ==========
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError('Global Error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', event.reason);
        });
    },

    handleError(error, fallbackMessage = 'Terjadi kesalahan') {
        console.error('Error:', error);
        const message = error?.message || error || fallbackMessage;
        this.showToast('error', 'Error', message);
        this.logError('Handled Error', error);
        return message;
    },

    logError(context, error) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || String(error),
            stack: error?.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            device: this.device
        };
        console.error('Error Log:', errorLog);

        // Kirim ke backend jika tersedia
        try {
            this.callGoogleScript('logError', errorLog).catch(() => {});
        } catch (e) {
            // Silent fail
        }
    },

    // ========== PERFORMANCE MONITORING ==========
    performanceMetrics: {},

    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor LCP
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.performanceMetrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // Monitor FID
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.performanceMetrics.fid = entry.processingStart - entry.startTime;
                }
            }).observe({ type: 'first-input', buffered: true });

            // Monitor CLS
            let clsValue = 0;
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.performanceMetrics.cls = clsValue;
            }).observe({ type: 'layout-shift', buffered: true });
        }
    },

    getPerformanceMetrics() {
        return this.performanceMetrics;
    },

    // ========== RESPONSIVE HELPERS ==========
    onResize(callback) {
        const debouncedCallback = this.debounce(callback, 250);
        window.addEventListener('resize', () => {
            this.setupDeviceDetection();
            debouncedCallback();
        });
    },

    onOrientationChange(callback) {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.setupDeviceDetection();
                callback();
            }, 300);
        });
    },

    // ========== TOUCH GESTURES ==========
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,

    initSwipe(element, callbacks = {}) {
        const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = callbacks;

        element.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown);
        }, { passive: true });
    },

    handleSwipe(threshold, onLeft, onRight, onUp, onDown) {
        const diffX = this.touchEndX - this.touchStartX;
        const diffY = this.touchEndY - this.touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > threshold) {
                if (diffX > 0 && onRight) onRight();
                else if (diffX < 0 && onLeft) onLeft();
            }
        } else {
            if (Math.abs(diffY) > threshold) {
                if (diffY > 0 && onDown) onDown();
                else if (diffY < 0 && onUp) onUp();
            }
        }
    },

    // ========== CLIPBOARD ==========
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }
            this.showToast('success', 'Berhasil', 'Teks berhasil disalin');
            return true;
        } catch (error) {
            this.showToast('error', 'Gagal', 'Gagal menyalin teks');
            return false;
        }
    },

    // ========== STORAGE ==========
    setLocalStorage(key, value) {
        try {
            localStorage.setItem(this.config.cachePrefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    },

    getLocalStorage(key) {
        try {
            const value = localStorage.getItem(this.config.cachePrefix + key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            return null;
        }
    },

    removeLocalStorage(key) {
        localStorage.removeItem(this.config.cachePrefix + key);
    },

    // ========== URL UTILITIES ==========
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        return result;
    },

    updateUrlParams(params) {
        const url = new URL(window.location);
        for (const [key, value] of Object.entries(params)) {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        }
        window.history.replaceState({}, '', url);
    },

    // ========== EXPORT UTILITIES ==========
    exportToCSV(data, filename = 'export.csv') {
        if (!data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(h => {
                const value = row[h]?.toString() || '';
                return value.includes(',') ? `"${value}"` : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    },

    async exportToPDF(elementId, filename = 'export.pdf') {
        // Placeholder untuk export PDF
        this.showToast('info', 'Info', 'Fitur export PDF akan segera hadir');
    },

    printElement(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print</title>
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>${element.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    },

    // ========== UTILITY HELPERS ==========
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    },

    isOnline() {
        return navigator.onLine;
    },

    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            if (!result[group]) result[group] = [];
            result[group].push(item);
            return result;
        }, {});
    },

    unique(array, key = null) {
        if (key) {
            return array.filter((item, index, self) =>
                index === self.findIndex(t => t[key] === item[key])
            );
        }
        return [...new Set(array)];
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

// ========== EXPOSE TO GLOBAL ==========
window.Utils = Utils;

// ========== AUTO INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    Utils.init();
});

// ========== EXPORT FOR MODULE USE ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
