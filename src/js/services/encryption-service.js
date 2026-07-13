/**
 * ENCRYPTION SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Client-side encryption for sensitive data
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.saltLength = 16;
    this.ivLength = 12;
    this.tagLength = 128;
  }
  
  /**
   * Initialize encryption service
   */
  init() {
    console.log('✅ Encryption Service initialized');
  }
  
  /**
   * Generate encryption key from password
   */
  async generateKey(password, salt = null) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const actualSalt = salt || crypto.getRandomValues(new Uint8Array(this.saltLength));
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: actualSalt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: this.algorithm,
        length: this.keyLength
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    return { key, salt: actualSalt };
  }
  
  /**
   * Encrypt data
   */
  async encrypt(data, password) {
    try {
      const encoder = new TextEncoder();
      const { key, salt } = await this.generateKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
      );
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Gagal mengenkripsi data');
    }
  }
  
  /**
   * Decrypt data
   */
  async decrypt(encryptedData, password) {
    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      
      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const data = combined.slice(this.saltLength + this.ivLength);
      
      const { key } = await this.generateKey(password, new Uint8Array(salt));
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: new Uint8Array(iv),
          tagLength: this.tagLength
        },
        key,
        data
      );
      
      const decoder = new TextDecoder();
      const decoded = decoder.decode(decrypted);
      
      // Try to parse as JSON
      try {
        return JSON.parse(decoded);
      } catch {
        return decoded;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Gagal mendekripsi data. Password mungkin salah.');
    }
  }
  
  /**
   * Hash data (SHA-256)
   */
  async hash(data) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
    );
    
    return this.arrayBufferToHex(hashBuffer);
  }
  
  /**
   * Generate random string
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => chars[byte % chars.length]).join('');
  }
  
  /**
   * Generate random number
   */
  generateRandomNumber(min = 0, max = 999999) {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValid = Math.pow(256, bytesNeeded) - (Math.pow(256, bytesNeeded) % range);
    
    let randomValue;
    do {
      const array = new Uint8Array(bytesNeeded);
      crypto.getRandomValues(array);
      randomValue = array.reduce((acc, byte, i) => acc + byte * Math.pow(256, i), 0);
    } while (randomValue >= maxValid);
    
    return min + (randomValue % range);
  }
  
  /**
   * Generate UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Encrypt file
   */
  async encryptFile(file, password) {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const { key, salt } = await this.generateKey(password);
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        arrayBuffer
      );
      
      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return new Blob([combined], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('Gagal mengenkripsi file');
    }
  }
  
  /**
   * Decrypt file
   */
  async decryptFile(encryptedBlob, password, originalFileName) {
    try {
      const arrayBuffer = await this.readBlobAsArrayBuffer(encryptedBlob);
      const combined = new Uint8Array(arrayBuffer);
      
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const data = combined.slice(this.saltLength + this.ivLength);
      
      const { key } = await this.generateKey(password, salt);
      
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
          tagLength: this.tagLength
        },
        key,
        data
      );
      
      return new Blob([decrypted], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('File decryption failed:', error);
      throw new Error('Gagal mendekripsi file. Password mungkin salah.');
    }
  }
  
  /**
   * Calculate file hash
   */
  async hashFile(file) {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    return this.arrayBufferToHex(hashBuffer);
  }
  
  /**
   * Sign data with HMAC
   */
  async sign(data, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
    );
    
    return this.arrayBufferToBase64(signature);
  }
  
  /**
   * Verify HMAC signature
   */
  async verify(data, signature, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    return crypto.subtle.verify(
      'HMAC',
      key,
      this.base64ToArrayBuffer(signature),
      encoder.encode(typeof data === 'string' ? data : JSON.stringify(data))
    );
  }
  
  /**
   * Read file as ArrayBuffer
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Read blob as ArrayBuffer
   */
  readBlobAsArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }
  
  /**
   * ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  /**
   * ArrayBuffer to Hex
   */
  arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Singleton instance
const EncryptionService = new EncryptionService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EncryptionService };
}
