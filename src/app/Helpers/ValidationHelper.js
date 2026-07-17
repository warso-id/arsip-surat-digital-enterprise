// ValidationHelper.js - Validation Helpers
class ValidationHelper {
    constructor() {
        this.patterns = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[+]?[\d\s()-]{7,15}$/,
            url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            username: /^[a-zA-Z0-9_]{3,20}$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
            numeric: /^\d+$/,
            decimal: /^\d+\.?\d*$/,
            alpha: /^[a-zA-Z\s]+$/,
            alphanumeric: /^[a-zA-Z0-9\s]+$/,
            date: /^\d{4}-\d{2}-\d{2}$/,
            time: /^\d{2}:\d{2}(:\d{2})?$/,
            datetime: /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/,
            ip: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
            hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/,
            zipcode: /^\d{5}(-\d{4})?$/
        };
    }

    isValidEmail(email) {
        return this.patterns.email.test(email);
    }

    isValidPhone(phone) {
        return this.patterns.phone.test(phone);
    }

    isValidUrl(url) {
        return this.patterns.url.test(url);
    }

    isStrongPassword(password) {
        return this.patterns.password.test(password);
    }

    isValidDate(dateString) {
        if (!this.patterns.date.test(dateString)) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    isInRange(value, min, max) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    isLengthInRange(str, min, max) {
        const len = str.length;
        return len >= min && len <= max;
    }

    sanitizeString(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    stripTags(str) {
        return str.replace(/<\/?[^>]+(>|$)/g, '');
    }

    truncateString(str, maxLength, suffix = '...') {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    titleCase(str) {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationHelper;
}
