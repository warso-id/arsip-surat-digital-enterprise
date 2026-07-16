// ==================== ENCRYPTION SERVICE ====================
// Arsip Surat Digital Enterprise
// Data encryption & decryption service

const crypto = require('crypto');
const config = require('../config/app');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        this.key = this.deriveKey();
    }

    /**
     * Derive encryption key
     */
    deriveKey() {
        const secret = config.security.encryption.key || config.app.key;
        return crypto.scryptSync(secret, 'arsip-surat-salt', this.keyLength);
    }

    /**
     * Encrypt data
     */
    encrypt(plainText) {
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            let encrypted = cipher.update(plainText, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            // Combine IV + Tag + Encrypted data
            const combined = Buffer.concat([
                iv,
                tag,
                Buffer.from(encrypted, 'hex'),
            ]);

            return combined.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedBase64) {
        try {
            const combined = Buffer.from(encryptedBase64, 'base64');
            
            const iv = combined.subarray(0, this.ivLength);
            const tag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
            const encrypted = combined.subarray(this.ivLength + this.tagLength);
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }

    /**
     * Encrypt object to base64 JSON
     */
    encryptObject(obj) {
        const jsonString = JSON.stringify(obj);
        return this.encrypt(jsonString);
    }

    /**
     * Decrypt base64 to object
     */
    decryptObject(encryptedBase64) {
        const jsonString = this.decrypt(encryptedBase64);
        return JSON.parse(jsonString);
    }

    /**
     * Generate secure token (base64)
     */
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('base64')
            .replace(/[+/=]/g, '')
            .substring(0, length);
    }

    /**
     * Hash data with SHA-256
     */
    sha256(data) {
        return crypto.createHash('sha256')
            .update(data)
            .digest('base64');
    }

    /**
     * Hash data with HMAC
     */
    hmac(data, secret = null) {
        const key = secret || this.key;
        return crypto.createHmac('sha256', key)
            .update(data)
            .digest('base64');
    }

    /**
     * Encode to base64 (safe for URL)
     */
    encodeBase64(data) {
        if (Buffer.isBuffer(data)) {
            return data.toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }
        return Buffer.from(data, 'utf8').toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    /**
     * Decode from base64 (URL safe)
     */
    decodeBase64(encoded) {
        // Restore base64 characters
        let base64 = encoded
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding
        while (base64.length % 4) {
            base64 += '=';
        }
        
        return Buffer.from(base64, 'base64').toString('utf8');
    }

    /**
     * Encrypt file content
     */
    async encryptFile(filePath) {
        const fs = require('fs').promises;
        const fileContent = await fs.readFile(filePath);
        const encrypted = this.encrypt(fileContent.toString('base64'));
        return encrypted;
    }

    /**
     * Decrypt file content
     */
    async decryptFile(encryptedContent, outputPath) {
        const fs = require('fs').promises;
        const decryptedBase64 = this.decrypt(encryptedContent);
        const fileBuffer = Buffer.from(decryptedBase64, 'base64');
        await fs.writeFile(outputPath, fileBuffer);
        return outputPath;
    }

    /**
     * Generate QR code data with encryption
     */
    generateEncryptedQRData(suratData) {
        const payload = {
            id: suratData.id,
            nomor_agenda: suratData.nomor_agenda,
            timestamp: Date.now(),
            hash: this.hmac(suratData.nomor_agenda + suratData.id),
        };
        return this.encodeBase64(JSON.stringify(payload));
    }

    /**
     * Verify QR code data
     */
    verifyQRData(encodedQRData, expectedHash) {
        try {
            const decoded = this.decodeBase64(encodedQRData);
            const payload = JSON.parse(decoded);
            const calculatedHash = this.hmac(payload.nomor_agenda + payload.id);
            return calculatedHash === expectedHash;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new EncryptionService();
