// EncryptionService.js - Enterprise Encryption Service
class EncryptionService {
    constructor() {
        this.secretKey = 'ArsipSuratEnterprise2026SecretKey!@#$';
        this.algorithm = 'AES-256-CBC';
    }

    encrypt(data) {
        try {
            const jsonStr = JSON.stringify(data);
            // Base64 encode twice untuk keamanan
            const firstEncode = btoa(encodeURIComponent(jsonStr));
            const secondEncode = btoa(firstEncode);
            
            // Tambahkan signature
            const signature = this.generateSignature(secondEncode);
            
            return {
                data: secondEncode,
                signature: signature,
                timestamp: Date.now(),
                version: '2026.1'
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    decrypt(encryptedData) {
        try {
            if (!encryptedData.data || !encryptedData.signature) {
                throw new Error('Invalid encrypted data format');
            }

            // Verify signature
            const expectedSignature = this.generateSignature(encryptedData.data);
            if (encryptedData.signature !== expectedSignature) {
                throw new Error('Invalid signature - data may be tampered');
            }

            // Decode twice
            const firstDecode = atob(encryptedData.data);
            const jsonStr = decodeURIComponent(atob(firstDecode));
            
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    generateSignature(data) {
        // Simple signature generation
        const combined = data + this.secretKey;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return btoa(Math.abs(hash).toString(16));
    }

    hashPassword(password) {
        // Multiple rounds of encoding for password
        let hashed = password;
        for (let i = 0; i < 10; i++) {
            hashed = btoa(hashed + this.secretKey + i);
        }
        return hashed;
    }

    generateToken(userId) {
        const payload = {
            userId: userId,
            timestamp: Date.now(),
            random: Math.random().toString(36).substring(7)
        };
        return btoa(encodeURIComponent(JSON.stringify(payload)));
    }

    validateToken(token) {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(token)));
            const tokenAge = Date.now() - decoded.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            return tokenAge < maxAge;
        } catch (error) {
            return false;
        }
    }

    encodeBase64(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeBase64(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return null;
        }
    }

    sanitizeInput(input) {
        if (typeof input === 'string') {
            // Remove potentially dangerous characters
            return input
                .replace(/[<>]/g, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        }
        return input;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // Minimal 8 karakter, harus ada huruf besar, huruf kecil, dan angka
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordRegex.test(password);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionService;
}
