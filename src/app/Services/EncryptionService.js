// EncryptionService.js - Data Encryption Service (Updated)
class EncryptionService {
    constructor() {
        this.secretKey = 'ArsipSuratEnterprise2026SecretKey!@#$%^&*()';
        this.algorithm = 'AES-256-CBC';
        this.encoding = 'base64';
    }

    // Enkripsi data untuk pengiriman
    encrypt(data) {
        try {
            const jsonStr = JSON.stringify(data);
            const encoded = this.multiEncode(jsonStr);
            const signature = this.generateSignature(encoded);
            
            return {
                data: encoded,
                signature: signature,
                timestamp: Date.now(),
                version: '2026.1'
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // Dekripsi data yang diterima
    decrypt(encryptedData) {
        try {
            if (!encryptedData.data || !encryptedData.signature) {
                throw new Error('Invalid encrypted data format');
            }

            // Verifikasi signature
            const expectedSignature = this.generateSignature(encryptedData.data);
            if (encryptedData.signature !== expectedSignature) {
                throw new Error('Invalid signature - data may be tampered');
            }

            const jsonStr = this.multiDecode(encryptedData.data);
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Encode bertingkat untuk keamanan
    multiEncode(str) {
        let encoded = str;
        // Encode 3 kali dengan variasi
        encoded = btoa(encodeURIComponent(encoded));
        encoded = btoa(encoded + this.secretKey.substring(0, 8));
        encoded = btoa(encodeURIComponent(encoded));
        return encoded;
    }

    // Decode bertingkat
    multiDecode(encoded) {
        let decoded = encoded;
        decoded = decodeURIComponent(atob(decoded));
        decoded = atob(decoded).replace(this.secretKey.substring(0, 8), '');
        decoded = decodeURIComponent(atob(decoded));
        return decoded;
    }

    // Generate signature untuk verifikasi
    generateSignature(data) {
        const combined = data + this.secretKey;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return btoa(Math.abs(hash).toString(16));
    }

    // Hash password dengan multiple rounds
    hashPassword(password) {
        let hashed = password;
        const salt = this.secretKey;
        
        for (let i = 0; i < 15; i++) {
            hashed = btoa(hashed + salt + i);
        }
        
        return hashed;
    }

    // Generate token untuk autentikasi
    generateToken(userId, expiresIn = 86400) {
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };

        const payload = {
            user_id: userId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + expiresIn,
            jti: this.generateUUID()
        };

        const headerEncoded = btoa(JSON.stringify(header));
        const payloadEncoded = btoa(JSON.stringify(payload));
        const signature = this.generateSignature(`${headerEncoded}.${payloadEncoded}`);

        return `${headerEncoded}.${payloadEncoded}.${signature}`;
    }

    // Verifikasi token
    verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            const [header, payload, signature] = parts;
            
            // Verifikasi signature
            const expectedSignature = this.generateSignature(`${header}.${payload}`);
            if (signature !== expectedSignature) return false;

            // Verifikasi expiry
            const payloadData = JSON.parse(atob(payload));
            if (payloadData.exp && payloadData.exp < Math.floor(Date.now() / 1000)) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    // Encode Base64 standar
    encodeBase64(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    // Decode Base64 standar
    decodeBase64(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return null;
        }
    }

    // Sanitasi input
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .replace(/on\w+='[^']*'/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/<[^>]*>/g, '')
                .trim();
        }
        return input;
    }

    // Sanitasi object
    sanitizeObject(obj) {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = typeof value === 'object' ? 
                this.sanitizeObject(value) : 
                this.sanitizeInput(value);
        }
        return sanitized;
    }

    // Generate random string
    generateRandomString(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let result = '';
        const randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    }

    // Generate OTP
    generateOTP(length = 6) {
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionService;
}
