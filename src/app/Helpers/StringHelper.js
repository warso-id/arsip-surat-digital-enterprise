// StringHelper.js - String Manipulation Helpers
class StringHelper {
    constructor() {}

    truncate(str, length = 100, suffix = '...') {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    toCamelCase(str) {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, '');
    }

    toSnakeCase(str) {
        return str
            .replace(/\s+/g, '_')
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '');
    }

    toKebabCase(str) {
        return str
            .replace(/\s+/g, '-')
            .replace(/([A-Z])/g, '-$1')
            .toLowerCase()
            .replace(/^-/, '');
    }

    generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateNumber(length = 6) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    formatNumber(num, decimals = 0) {
        return Number(num).toLocaleString('id-ID', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    formatCurrency(amount, currency = 'IDR') {
        const formatters = {
            'IDR': () => 'Rp ' + this.formatNumber(amount, 0),
            'USD': () => '$ ' + this.formatNumber(amount, 2)
        };
        return (formatters[currency] || formatters['IDR'])();
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    escapeHtml(str) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, (char) => escapeMap[char]);
    }

    highlightText(text, keyword) {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    extractInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    getInitialsColor(name) {
        const colors = [
            '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
            '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
            '#f1c40f', '#e67e22', '#e74c3c', '#ecf0f1', '#95a5a6'
        ];
        
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    countWords(str) {
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    countCharacters(str, includeSpaces = true) {
        return includeSpaces ? str.length : str.replace(/\s/g, '').length;
    }

    toBase64(str) {
        return btoa(encodeURIComponent(str));
    }

    fromBase64(str) {
        return decodeURIComponent(atob(str));
    }

    maskString(str, visibleChars = 4, maskChar = '*') {
        if (str.length <= visibleChars) return str;
        const visible = str.slice(-visibleChars);
        const masked = maskChar.repeat(str.length - visibleChars);
        return masked + visible;
    }

    maskEmail(email) {
        const [name, domain] = email.split('@');
        const maskedName = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
        return `${maskedName}@${domain}`;
    }

    padLeft(str, length, char = '0') {
        return str.toString().padStart(length, char);
    }

    padRight(str, length, char = '0') {
        return str.toString().padEnd(length, char);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StringHelper;
}
