class StringHelper {
    /**
     * Membuat slug dari string
     */
    static slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    /**
     * Truncate text dengan ellipsis
     */
    static truncate(text, length = 100, suffix = '...') {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    }

    /**
     * Menghasilkan string random
     */
    static random(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Menghasilkan token random
     */
    static generateToken(length = 32) {
        const crypto = require('crypto');
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Capitalize setiap kata
     */
    static titleCase(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Capitalize huruf pertama
     */
    static capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    /**
     * Format nomor telepon Indonesia
     */
    static formatPhone(phone) {
        if (!phone) return '';
        // Remove all non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        
        // Handle Indonesian phone numbers
        if (cleaned.startsWith('0')) {
            cleaned = '+62' + cleaned.substring(1);
        } else if (cleaned.startsWith('62')) {
            cleaned = '+' + cleaned;
        }
        
        return cleaned;
    }

    /**
     * Mask email
     */
    static maskEmail(email) {
        if (!email) return '';
        const [name, domain] = email.split('@');
        const maskedName = name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
        return `${maskedName}@${domain}`;
    }

    /**
     * Mask nomor telepon
     */
    static maskPhone(phone) {
        if (!phone) return '';
        const last4 = phone.slice(-4);
        return '*'.repeat(phone.length - 4) + last4;
    }

    /**
     * Menghapus karakter spesial
     */
    static removeSpecialChars(text) {
        if (!text) return '';
        return text.replace(/[^\w\s]/gi, '');
    }

    /**
     * Strip HTML tags
     */
    static stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * Convert newlines to <br>
     */
    static nl2br(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    }

    /**
     * Convert <br> to newlines
     */
    static br2nl(text) {
        if (!text) return '';
        return text.replace(/<br\s*\/?>/gi, '\n');
    }

    /**
     * Mendapatkan inisial dari nama
     */
    static getInitials(name) {
        if (!name) return '';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Format file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validasi email
     */
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validasi URL
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (err) {
            return false;
        }
    }
}

module.exports = StringHelper;
