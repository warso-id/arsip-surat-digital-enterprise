// ValidationMiddleware.js - Input Validation Middleware
class ValidationMiddleware {
    constructor() {
        this.rules = {
            required: this.validateRequired,
            email: this.validateEmail,
            min: this.validateMin,
            max: this.validateMax,
            numeric: this.validateNumeric,
            alpha: this.validateAlpha,
            alphanumeric: this.validateAlphanumeric,
            date: this.validateDate,
            url: this.validateUrl,
            phone: this.validatePhone,
            match: this.validateMatch,
            unique: this.validateUnique
        };

        this.customMessages = {
            'required': 'Field :field wajib diisi',
            'email': 'Format email tidak valid untuk :field',
            'min': ':field minimal :param karakter',
            'max': ':field maksimal :param karakter',
            'numeric': ':field harus berupa angka',
            'alpha': ':field hanya boleh berisi huruf',
            'alphanumeric': ':field hanya boleh berisi huruf dan angka',
            'date': 'Format tanggal tidak valid untuk :field',
            'url': 'Format URL tidak valid untuk :field',
            'phone': 'Format nomor telepon tidak valid untuk :field',
            'match': ':field tidak cocok dengan :param',
            'unique': ':field sudah digunakan'
        };
    }

    async validate(data, rules) {
        const errors = {};

        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = data[field];
            const ruleList = fieldRules.split('|');

            for (const rule of ruleList) {
                const [ruleName, param] = rule.split(':');
                
                if (this.rules[ruleName]) {
                    const result = await this.rules[ruleName].call(this, value, field, param, data);
                    if (result !== true) {
                        if (!errors[field]) {
                            errors[field] = [];
                        }
                        errors[field].push(result);
                    }
                }
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    validateRequired(value, field) {
        if (value === undefined || value === null || value === '') {
            return this.getMessage('required', field);
        }
        return true;
    }

    validateEmail(value, field) {
        if (!value) return true; // Skip if empty (use required separately)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return this.getMessage('email', field);
        }
        return true;
    }

    validateMin(value, field, param) {
        if (!value) return true;
        if (value.length < parseInt(param)) {
            return this.getMessage('min', field, param);
        }
        return true;
    }

    validateMax(value, field, param) {
        if (!value) return true;
        if (value.length > parseInt(param)) {
            return this.getMessage('max', field, param);
        }
        return true;
    }

    validateNumeric(value, field) {
        if (!value) return true;
        if (isNaN(value)) {
            return this.getMessage('numeric', field);
        }
        return true;
    }

    validateAlpha(value, field) {
        if (!value) return true;
        const alphaRegex = /^[a-zA-Z\s]+$/;
        if (!alphaRegex.test(value)) {
            return this.getMessage('alpha', field);
        }
        return true;
    }

    validateAlphanumeric(value, field) {
        if (!value) return true;
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (!alphanumericRegex.test(value)) {
            return this.getMessage('alphanumeric', field);
        }
        return true;
    }

    validateDate(value, field) {
        if (!value) return true;
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return this.getMessage('date', field);
        }
        return true;
    }

    validateUrl(value, field) {
        if (!value) return true;
        try {
            new URL(value);
            return true;
        } catch {
            return this.getMessage('url', field);
        }
    }

    validatePhone(value, field) {
        if (!value) return true;
        const phoneRegex = /^[+]?[\d\s()-]{7,15}$/;
        if (!phoneRegex.test(value)) {
            return this.getMessage('phone', field);
        }
        return true;
    }

    validateMatch(value, field, param, data) {
        if (!value) return true;
        const matchValue = data[param];
        if (value !== matchValue) {
            return this.getMessage('match', field, param);
        }
        return true;
    }

    async validateUnique(value, field, param) {
        if (!value) return true;
        
        try {
            const [table, column, excludeId] = param.split(',');
            const apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'validation_unique',
                table: table,
                column: column || field,
                value: value,
                exclude_id: excludeId || null
            })));

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));

            if (!data.unique) {
                return this.getMessage('unique', field);
            }

            return true;
        } catch (error) {
            console.error('Unique validation error:', error);
            return true; // Skip validation on error
        }
    }

    getMessage(rule, field, param = '') {
        let message = this.customMessages[rule] || `Validasi gagal untuk ${field}`;
        message = message.replace(':field', field).replace(':param', param);
        return message;
    }

    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .replace(/on\w+='[^']*'/gi, '')
                .replace(/javascript:/gi, '')
                .trim();
        }
        return input;
    }

    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = this.sanitizeInput(value);
        }
        return sanitized;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationMiddleware;
}
