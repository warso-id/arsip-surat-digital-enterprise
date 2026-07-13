/**
 * BIOMETRIC SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * WebAuthn biometric authentication
 */

class BiometricService {
  constructor() {
    this.isSupported = false;
    this.isEnabled = false;
    this.credentialId = null;
  }
  
  /**
   * Initialize biometric service
   */
  async init() {
    // Check if WebAuthn is supported
    this.isSupported = await this.checkSupport();
    
    if (this.isSupported) {
      // Check if user has registered biometric
      this.isEnabled = await this.checkStatus();
    }
    
    console.log(`✅ Biometric Service initialized (Supported: ${this.isSupported}, Enabled: ${this.isEnabled})`);
  }
  
  /**
   * Check WebAuthn support
   */
  async checkSupport() {
    if (!window.PublicKeyCredential) {
      console.warn('WebAuthn not supported');
      return false;
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.warn('Biometric check failed:', error);
      return false;
    }
  }
  
  /**
   * Check if biometric is enabled for current user
   */
  async checkStatus() {
    try {
      const response = await api.get('biometric.status');
      if (response.status === 'success') {
        this.isEnabled = response.data.enabled || false;
        this.credentialId = response.data.credentialId || null;
        return this.isEnabled;
      }
    } catch {}
    return false;
  }
  
  /**
   * Register biometric
   */
  async register() {
    if (!this.isSupported) {
      throw new Error('Biometric tidak didukung di perangkat ini');
    }
    
    try {
      NotificationService.show('Mendaftarkan biometric...', 'info');
      
      // Get challenge from server
      const response = await api.get('biometric.register');
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Gagal mendapatkan challenge');
      }
      
      const { challenge, user } = response.data;
      
      // Create credentials
      const publicKeyCredentialCreationOptions = {
        challenge: this.base64ToBuffer(challenge),
        rp: {
          name: APP_CONFIG.APP_NAME,
          id: window.location.hostname
        },
        user: {
          id: this.base64ToBuffer(user.id),
          name: user.email || user.username,
          displayName: user.namaLengkap || user.username
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }  // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        attestation: 'none'
      };
      
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      
      // Send to server
      const verifyResponse = await api.post('biometric.verify', {
        credentialId: credential.id,
        publicKey: this.bufferToBase64(credential.response.getPublicKey()),
        attestation: this.bufferToBase64(credential.response.attestationObject),
        clientDataJSON: this.bufferToBase64(credential.response.clientDataJSON)
      });
      
      if (verifyResponse.status === 'success') {
        this.isEnabled = true;
        this.credentialId = credential.id;
        NotificationService.success('Biometric berhasil didaftarkan');
        return true;
      }
      
      throw new Error(verifyResponse.message);
      
    } catch (error) {
      NotificationService.error('Pendaftaran biometric gagal: ' + error.message);
      throw error;
    }
  }
  
  /**
   * Authenticate with biometric
   */
  async authenticate() {
    if (!this.isSupported || !this.isEnabled) {
      throw new Error('Biometric tidak tersedia');
    }
    
    try {
      // Get challenge from server
      const response = await api.get('biometric.status');
      
      if (response.status !== 'success') {
        throw new Error('Gagal mendapatkan challenge');
      }
      
      const { challenge, credentialIds } = response.data;
      
      const publicKeyCredentialRequestOptions = {
        challenge: this.base64ToBuffer(challenge),
        allowCredentials: credentialIds.map(id => ({
          id: this.base64ToBuffer(id),
          type: 'public-key'
        })),
        timeout: 60000,
        userVerification: 'required'
      };
      
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });
      
      // Send to server
      const verifyResponse = await api.post('biometric.multiFactor', {
        credentialId: assertion.id,
        authenticatorData: this.bufferToBase64(assertion.response.authenticatorData),
        clientDataJSON: this.bufferToBase64(assertion.response.clientDataJSON),
        signature: this.bufferToBase64(assertion.response.signature),
        userHandle: assertion.response.userHandle 
          ? this.bufferToBase64(assertion.response.userHandle) 
          : null
      });
      
      if (verifyResponse.status === 'success') {
        return verifyResponse.data;
      }
      
      throw new Error(verifyResponse.message || 'Verifikasi gagal');
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Biometric dibatalkan atau timeout');
      }
      throw error;
    }
  }
  
  /**
   * Remove biometric registration
   */
  async remove() {
    try {
      const response = await api.post('biometric.remove');
      
      if (response.status === 'success') {
        this.isEnabled = false;
        this.credentialId = null;
        NotificationService.success('Biometric berhasil dihapus');
        return true;
      }
      
      throw new Error(response.message);
    } catch (error) {
      NotificationService.error('Gagal menghapus biometric: ' + error.message);
      throw error;
    }
  }
  
  /**
   * Check if platform has biometric hardware
   */
  async hasHardware() {
    if (!window.PublicKeyCredential) return false;
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  }
  
  /**
   * Get biometric type
   */
  async getBiometricType() {
    // Try to detect biometric type (limited browser support)
    if (window.PublicKeyCredential) {
      try {
        // This is a heuristic - most platforms with biometric have fingerprint or face
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) return 'fingerprint';
        if (ua.includes('iphone') || ua.includes('ipad')) return 'faceid';
        if (ua.includes('mac')) return 'touchid';
        if (ua.includes('windows')) return 'windows-hello';
      } catch {}
    }
    return 'biometric';
  }
  
  /**
   * Get biometric icon
   */
  getIcon() {
    const type = this.getBiometricType();
    const icons = {
      'fingerprint': 'fingerprint',
      'faceid': 'face',
      'touchid': 'fingerprint',
      'windows-hello': 'face',
      'biometric': 'fingerprint'
    };
    return icons[type] || 'fingerprint';
  }
  
  /**
   * Get biometric label
   */
  getLabel() {
    const type = this.getBiometricType();
    const labels = {
      'fingerprint': 'Fingerprint',
      'faceid': 'Face ID',
      'touchid': 'Touch ID',
      'windows-hello': 'Windows Hello',
      'biometric': 'Biometric'
    };
    return labels[type] || 'Biometric';
  }
  
  /**
   * Buffer to Base64
   */
  bufferToBase64(buffer) {
    if (!buffer) return null;
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  /**
   * Base64 to Buffer
   */
  base64ToBuffer(base64) {
    if (!base64) return new ArrayBuffer(0);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Singleton instance
const BiometricService = new BiometricService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BiometricService };
}
