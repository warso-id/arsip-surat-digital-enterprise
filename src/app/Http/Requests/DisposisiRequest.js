// DisposisiRequest.js - Validation Rules for Disposisi Requests
class DisposisiRequest {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
    }

    rules(action) {
        const rulesMap = {
            'disposisi_store': {
                surat_masuk_id: 'required|numeric',
                kepada_user_id: 'required|numeric',
                instruksi: 'required|max:1000',
                sifat: 'required|in:biasa,segera,penting,rahasia',
                batas_waktu: 'date'
            },
            'disposisi_update_status': {
                status: 'required|in:diterima,diproses,selesai,ditolak',
                catatan: 'max:500'
            }
        };

        return rulesMap[action] || {};
    }

    messages(action) {
        return {
            'surat_masuk_id.required': 'Surat masuk wajib dipilih',
            'surat_masuk_id.numeric': 'Surat masuk tidak valid',
            'kepada_user_id.required': 'Tujuan disposisi wajib dipilih',
            'kepada_user_id.numeric': 'Tujuan disposisi tidak valid',
            'instruksi.required': 'Instruksi wajib diisi',
            'instruksi.max': 'Instruksi maksimal 1000 karakter',
            'sifat.required': 'Sifat disposisi wajib dipilih',
            'sifat.in': 'Sifat disposisi tidak valid',
            'batas_waktu.date': 'Format batas waktu tidak valid',
            'status.required': 'Status wajib dipilih',
            'status.in': 'Status tidak valid',
            'catatan.max': 'Catatan maksimal 500 karakter'
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
                
                const error = this.applyRule(ruleName, value, field, param, action);
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

    applyRule(ruleName, value, field, param, action) {
        const messages = this.messages(action);
        
        switch (ruleName) {
            case 'required':
                if (value === undefined || value === null || value === '') {
                    return messages[`${field}.required`] || `${field} wajib diisi`;
                }
                break;

            case 'numeric':
                if (value && isNaN(value)) {
                    return messages[`${field}.numeric`] || `${field} harus berupa angka`;
                }
                break;

            case 'max':
                if (value && value.length > parseInt(param)) {
                    return messages[`${field}.max`] || `${field} maksimal ${param} karakter`;
                }
                break;

            case 'in':
                if (value && !param.split(',').includes(value)) {
                    return messages[`${field}.in`] || `${field} tidak valid`;
                }
                break;

            case 'date':
                if (value && isNaN(Date.parse(value))) {
                    return messages[`${field}.date`] || 'Format tanggal tidak valid';
                }
                break;
        }

        return null;
    }

    sanitize(data) {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                sanitized[key] = value
                    .replace(/<[^>]*>/g, '')
                    .trim();
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisposisiRequest;
}
