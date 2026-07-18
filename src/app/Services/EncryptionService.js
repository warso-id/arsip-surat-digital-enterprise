const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.key = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
        this.ivLength = 16;
        this.tagLength = 16;
    }

    /**
     * Encrypt data
     */
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const tag = cipher.getAuthTag();
            
            // Combine IV, encrypted data, and auth tag
            return Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
        } catch (error) {
            console.error('Encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData) {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');
            
            const iv = buffer.subarray(0, this.ivLength);
            const tag = buffer.subarray(this.ivLength, this.ivLength + this.tagLength);
            const encrypted = buffer.subarray(this.ivLength + this.tagLength).toString('hex');
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            throw error;
        }
    }

    /**
     * Encrypt file
     */
    async encryptFile(inputPath, outputPath) {
        try {
            const fs = require('fs');
            const input = fs.createReadStream(inputPath);
            const output = fs.createWriteStream(outputPath);
            
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
            
            output.write(iv);
            
            input.pipe(cipher).pipe(output);
            
            return new Promise((resolve, reject) => {
                output.on('finish', () => {
                    const tag = cipher.getAuthTag();
                    fs.appendFileSync(outputPath, tag);
                    resolve(outputPath);
                });
                output.on('error', reject);
            });
        } catch (error) {
            console.error('File encryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt file
     */
    async decryptFile(inputPath, outputPath) {
        try {
            const fs = require('fs');
            const fileBuffer = fs.readFileSync(inputPath);
            
            const iv = fileBuffer.subarray(0, this.ivLength);
            const tag = fileBuffer.subarray(fileBuffer.length - this.tagLength);
            const encrypted = fileBuffer.subarray(this.ivLength, fileBuffer.length - this.tagLength);
            
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            decipher.setAuthTag(tag);
            
            const input = require('stream').Readable.from(encrypted);
            const output = fs.createWriteStream(outputPath);
            
            input.pipe(decipher).pipe(output);
            
            return new Promise((resolve, reject) => {
                output.on('finish', () => resolve(outputPath));
                output.on('error', reject);
            });
        } catch (error) {
            console.error('File decryption failed:', error);
            throw error;
        }
    }

    /**
     * Hash data (one-way)
     */
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate random token
     */
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generate random password
     */
    generatePassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let password = '';
        
        // Ensure at least one of each required character type
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[crypto.randomInt(26)];
        password += 'abcdefghijklmnopqrstuvwxyz'[crypto.randomInt(26)];
        password += '0123456789'[crypto.randomInt(10)];
        password += '!@#$%^&*()'[crypto.randomInt(10)];
        
        // Fill remaining length
        for (let i = 4; i < length; i++) {
            password += chars[crypto.randomInt(chars.length)];
        }
        
        // Shuffle
        return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
    }

    /**
     * Sign data
     */
    sign(data, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        return sign.sign(privateKey, 'base64');
    }

    /**
     * Verify signature
     */
    verify(data, signature, publicKey) {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature, 'base64');
    }
}

module.exports = new EncryptionService();
