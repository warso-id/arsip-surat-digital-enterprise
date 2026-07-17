// SuratRequest.js - Validation Rules for Surat Requests
class SuratRequest {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
    }

    rules(action) {
        const rulesMap = {
            'surat_masuk_store': {
                no_agenda: 'required|unique:surat_masuk,no_agenda',
                tanggal_terima: 'required|date',
                pengirim: 'required|max:200',
                instansi_id: 'required|numeric',
                perihal: 'required|max:500',
                kategori_id: 'required|numeric',
                sifat: 'required|in:biasa,penting,rahasia,segera'
            },
            'surat_masuk_update': {
                no_agenda: 'required',
                tanggal_terima: 'required|date',
                pengirim: 'required|max:200',
                perihal: 'required|max:500',
                kategori_id: 'required|numeric',
                sifat: 'required|in:biasa,penting,rahasia,segera'
            },
            'surat_keluar_store': {
                no_surat: 'required|unique:surat_keluar,no_surat',
                tanggal_surat: 'required|date',
                tujuan: 'required|max:200',
                instansi_id: 'required|numeric',
                perihal: 'required|max:500',
                kategori_id: 'required|numeric'
            },
            'surat_keluar_update': {
                no_surat: 'required',
                tanggal_surat: 'required|date',
                tujuan: 'required|max:200',
                perihal: 'required|max:500',
                kategori_id: 'required|numeric'
            }
        };

        return rulesMap[action] || {};
    }

    messages(action) {
        return {
            'no_agenda.required': 'Nomor agenda wajib diisi',
            'no_agenda.unique': 'Nomor agenda sudah digunakan',
            'tanggal_terima.required': 'Tanggal terima wajib diisi',
            'tanggal_terima.date': 'Format tanggal tidak valid',
            'pengirim.required': 'Nama pengirim wajib diisi',
            'pengirim.max': 'Nama pengirim maksimal 200 karakter',
            'instansi_id.required': 'Instansi wajib dipilih',
            'instansi_id.numeric': 'Instansi tidak valid',
            'perihal.required': 'Perihal wajib diisi',
            'perihal.max': 'Perihal maksimal 500 karakter',
            'kategori_id.required': 'Kategori wajib dipilih',
            'kategori_id.numeric': 'Kategori tidak valid',
            'sifat.required': 'Sifat surat wajib dipilih',
            'sifat.in': 'Sifat surat tidak valid',
            'no_surat.required': 'Nomor surat wajib diisi',
            'no_surat.unique': 'Nomor surat sudah digunakan',
            'tanggal_surat.required': 'Tanggal surat wajib diisi',
            'tanggal_surat.date': 'Format tanggal tidak valid',
            'tujuan.required': 'Tujuan wajib diisi',
            'tujuan.max': 'Tujuan maksimal 200 karakter'
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

            case 'date':
                if (value && isNaN(Date.parse(value))) {
                    return messages[`${field}.date`] || 'Format tanggal tidak valid';
                }
                break;

            case 'max':
                if (value && value.length > parseInt(param)) {
                    return messages[`${field}.max`] || `${field} maksimal ${param} karakter`;
                }
                break;

            case 'numeric':
                if (value && isNaN(value)) {
                    return messages[`${field}.numeric`] || `${field} harus berupa angka`;
                }
                break;

            case 'in':
                if (value && !param.split(',').includes(value)) {
                    return messages[`${field}.in`] || `${field} tidak valid`;
                }
                break;

            case 'unique':
                if (value) {
                    const isUnique = await this.checkUnique(param, field, value, data.id);
                    if (!isUnique) {
                        return messages[`${field}.unique`] || `${field} sudah digunakan`;
                    }
                }
                break;
        }

        return null;
    }

    async checkUnique(tableColumn, field, value, excludeId = null) {
        try {
            const [table, column] = tableColumn.split(',');
            
            const payload = btoa(encodeURIComponent(JSON.stringify({
                action: 'validation_unique',
                table: table,
                column: column || field,
                value: value,
                exclude_id: excludeId || data?.id || null
            })));

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const responseData = JSON.parse(decodeURIComponent(atob(result.data)));
            
            return responseData.unique === true;

        } catch (error) {
            console.error('Unique check error:', error);
            return true; // Allow on error
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
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/javascript:/gi, '')
            .trim();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SuratRequest;
}
