// PenggunaRequest.js - Validation Rules for Pengguna Requests
class PenggunaRequest {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
    }

    rules(action) {
        const rulesMap = {
            'pengguna_store': {
                nama: 'required|max:200',
                email: 'required|email|unique:pengguna,email',
                password: 'required|min:8',
                password_confirmation: 'required|match:password',
                role_id: 'required|numeric',
                instansi_id: 'numeric'
            },
            'pengguna_update': {
                nama: 'required|max:200',
                email: 'required|email',
                role_id: 'required|numeric',
                instansi_id: 'numeric'
            },
            'pengguna_change_password': {
                old_password: 'required',
                new_password: 'required|min:8',
                new_password_confirmation: 'required|match:new_password'
            },
            'pengguna_update_profile': {
                nama: 'required|max:200',
                email: 'required|email',
                telepon: 'max:15'
            }
        };

        return rulesMap[action] || {};
    }

    messages(action) {
        return {
            'nama.required': 'Nama lengkap wajib diisi',
            'nama.max': 'Nama maksimal 200 karakter',
            'email.required': 'Email wajib diisi',
            'email.email': 'Format email tidak valid',
            'email.unique': 'Email sudah digunakan',
            'password.required': 'Password wajib diisi',
            'password.min': 'Password minimal 8 karakter',
            'password_confirmation.required': 'Konfirmasi password wajib diisi',
            'password_confirmation.match': 'Konfirmasi password tidak cocok',
            'role_id.required': 'Role wajib dipilih',
            'role_id.numeric': 'Role tidak valid',
            'instansi_id.numeric': 'Instansi tidak valid',
            'old_password.required': 'Password lama wajib diisi',
            'new_password.required': 'Password baru wajib diisi',
            'new_password.min': 'Password baru minimal 8 karakter',
            'new_password_confirmation.required': 'Konfirmasi password baru wajib diisi',
            'new_password_confirmation.match': 'Konfirmasi password baru tidak cocok',
            'telepon.max': 'Nomor telepon maksimal 15 karakter'
        };
    }

    async validate(action, data) {
        const rules = this.rules(action);
        const errors = {};

        for (const [field, ruleString] of Object.entries(rules)) {
            const fieldRules = ruleString.split('|');
            const value = data[field];

            for (const rule of fieldRules) {
                const [ruleName, param] = rule.split(':');
                
                const error = await this.applyRule(ruleName, value, field, param, data, action);
                if (error) {
                    if (!errors[field]) {
                        errors[field] = [];
                    }
                    errors[field].push(error);
                }
            }
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    async applyRule(ruleName, value, field, param, data, action) {
        const messages = this.messages(action);
        
        switch (ruleName) {
            case 'required':
                if (value === undefined || value === null || value === '') {
                    return messages[`${field}.required`] || `${field} wajib diisi`;
                }
                break;

            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return messages[`${field}.email`] || 'Format email tidak valid';
                }
                break;

            case 'max':
                if (value && value.length > parseInt(param)) {
                    return messages[`${field}.max`] || `${field} maksimal ${param} karakter`;
                }
                break;

            case 'min':
                if (value && value.length < parseInt(param)) {
                    return messages[`${field}.min`] || `${field} minimal ${param} karakter`;
                }
                break;

            case 'numeric':
                if (value && isNaN(value)) {
                    return messages[`${field}.numeric`] || `${field} harus berupa angka`;
                }
                break;

            case 'match':
                if (value && value !== data[param]) {
                    return messages[`${field}.match`] || `${field} tidak cocok dengan ${param}`;
                }
                break;

            case 'unique':
                if (value) {
                    const [table, column] = param.split(',');
                    const isUnique = await this.checkUnique(table, column || field, value, data.id);
                    if (!isUnique) {
                        return messages[`${field}.unique`] || `${field} sudah digunakan`;
                    }
                }
                break;
        }

        return null;
    }

    async checkUnique(table, column, value, excludeId = null) {
        try {
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'validation_unique',
                table: table,
                column: column,
                value: value,
                exclude_id: excludeId
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = JSON.parse(decodeURIComponent(atob(result.data)));
            
            return data.unique === true;

        } catch (error) {
            console.error('Unique check error:', error);
            return true;
        }
    }

    sanitize(data) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }

    sanitizeString(str) {
        return str
            .replace(/<[^>]*>/g, '')
            .trim();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PenggunaRequest;
}
