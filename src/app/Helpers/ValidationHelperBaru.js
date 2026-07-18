class ValidationHelper {
    /**
     * Validate required fields
     */
    static required(data, fields) {
        const errors = [];
        
        for (const field of fields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push({
                    field: field,
                    message: `${field} harus diisi`
                });
            }
        }
        
        return errors;
    }

    /**
     * Validate email
     */
    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    /**
     * Validate password strength
     */
    static passwordStrength(password) {
        const errors = [];
        
        if (password.length < 8) {
            errors.push('Password minimal 8 karakter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password harus mengandung huruf besar');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password harus mengandung huruf kecil');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password harus mengandung angka');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password harus mengandung karakter spesial');
        }
        
        return errors;
    }

    /**
     * Validate phone number
     */
    static phone(phone) {
        const phoneRegex = /^[0-9+\-\s()]{8,15}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Validate date format
     */
    static date(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    /**
     * Validate NIP
     */
    static nip(nip) {
        if (!nip) return true; // Optional
        const nipRegex = /^[0-9]{18}$/;
        return nipRegex.test(nip);
    }

    /**
     * Validate URL
     */
    static url(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate number range
     */
    static numberRange(value, min, max) {
        const num = parseInt(value);
        return !isNaN(num) && num >= min && num <= max;
    }

    /**
     * Validate string length
     */
    static stringLength(value, min, max) {
        if (!value) return false;
        const len = value.trim().length;
        return len >= min && len <= max;
    }

    /**
     * Validate file size
     */
    static fileSize(size, maxSize) {
        return size <= maxSize;
    }

    /**
     * Validate file extension
     */
    static fileExtension(filename, allowedExtensions) {
        const ext = filename.split('.').pop().toLowerCase();
        return allowedExtensions.includes(ext);
    }

    /**
     * Validate MIME type
     */
    static mimeType(mimetype, allowedMimes) {
        return allowedMimes.includes(mimetype);
    }

    /**
     * Sanitize string
     */
    static sanitizeString(str) {
        if (!str) return '';
        return str
            .trim()
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>]/g, ''); // Remove angle brackets
    }

    /**
     * Validate surat data
     */
    static validateSurat(data, type = 'masuk') {
        const errors = [];

        // Required fields
        const requiredFields = ['nomor_surat', 'perihal', 'tanggal_surat', 'sifat'];
        if (type === 'masuk') {
            requiredFields.push('pengirim', 'tanggal_terima');
        } else {
            requiredFields.push('tujuan');
        }

        for (const field of requiredFields) {
            if (!data[field]) {
                errors.push({
                    field,
                    message: `${field.replace(/_/g, ' ')} harus diisi`
                });
            }
        }

        // Validate date
        if (data.tanggal_surat && !this.date(data.tanggal_surat)) {
            errors.push({
                field: 'tanggal_surat',
                message: 'Format tanggal tidak valid'
            });
        }

        if (type === 'masuk' && data.tanggal_terima && !this.date(data.tanggal_terima)) {
            errors.push({
                field: 'tanggal_terima',
                message: 'Format tanggal terima tidak valid'
            });
        }

        // Validate sifat
        const validSifat = ['biasa', 'segera', 'penting', 'rahasia'];
        if (data.sifat && !validSifat.includes(data.sifat)) {
            errors.push({
                field: 'sifat',
                message: 'Sifat surat tidak valid'
            });
        }

        // Validate string lengths
        if (data.nomor_surat && !this.stringLength(data.nomor_surat, 1, 100)) {
            errors.push({
                field: 'nomor_surat',
                message: 'Nomor surat maksimal 100 karakter'
            });
        }

        if (data.perihal && !this.stringLength(data.perihal, 1, 500)) {
            errors.push({
                field: 'perihal',
                message: 'Perihal maksimal 500 karakter'
            });
        }

        return errors;
    }

    /**
     * Validate disposisi data
     */
    static validateDisposisi(data) {
        const errors = [];

        // Required fields
        const requiredFields = ['surat_masuk_id', 'kepada_user_id', 'instruksi'];
        
        for (const field of requiredFields) {
            if (!data[field]) {
                errors.push({
                    field,
                    message: `${field.replace(/_/g, ' ')} harus diisi`
                });
            }
        }

        // Validate instruksi length
        if (data.instruksi && !this.stringLength(data.instruksi, 1, 1000)) {
            errors.push({
                field: 'instruksi',
                message: 'Instruksi maksimal 1000 karakter'
            });
        }

        // Validate batas_waktu
        if (data.batas_waktu && !this.date(data.batas_waktu)) {
            errors.push({
                field: 'batas_waktu',
                message: 'Format batas waktu tidak valid'
            });
        }

        return errors;
    }

    /**
     * Validate user data
     */
    static validateUser(data, isUpdate = false) {
        const errors = [];

        if (!isUpdate) {
            // Required for new user
            const requiredFields = ['nama_lengkap', 'email', 'password', 'role_id'];
            for (const field of requiredFields) {
                if (!data[field]) {
                    errors.push({
                        field,
                        message: `${field.replace(/_/g, ' ')} harus diisi`
                    });
                }
            }

            // Validate password
            if (data.password) {
                const passwordErrors = this.passwordStrength(data.password);
                passwordErrors.forEach(msg => {
                    errors.push({
                        field: 'password',
                        message: msg
                    });
                });
            }
        }

        // Validate email
        if (data.email && !this.email(data.email)) {
            errors.push({
                field: 'email',
                message: 'Format email tidak valid'
            });
        }

        // Validate NIP
        if (data.nip && !this.nip(data.nip)) {
            errors.push({
                field: 'nip',
                message: 'Format NIP tidak valid (18 digit)'
            });
        }

        // Validate phone
        if (data.no_telp && !this.phone(data.no_telp)) {
            errors.push({
                field: 'no_telp',
                message: 'Format nomor telepon tidak valid'
            });
        }

        return errors;
    }
}

module.exports = ValidationHelper;
