/**
 * SIGNATURE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Digital signature (TTD) management
 */

class SignatureService {
  constructor() {
    this.signatures = new Map();
  }
  
  /**
   * Initialize signature service
   */
  init() {
    console.log('✅ Signature Service initialized');
  }
  
  /**
   * Create signature from canvas
   */
  async createSignature(signatureData, metadata = {}) {
    const {
      documentId,
      signerName,
      position,
      reason = 'Menyetujui',
      location = 'Indonesia'
    } = metadata;
    
    try {
      // Convert signature to blob
      const blob = await this.dataURLToBlob(signatureData);
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Upload signature
      const uploadResponse = await api.uploadFile(file);
      
      if (uploadResponse.status !== 'success') {
        throw new Error('Gagal mengupload tanda tangan');
      }
      
      // Register signature
      const signatureId = `sig-${Date.now()}`;
      const signatureInfo = {
        id: signatureId,
        fileId: uploadResponse.data.fileId,
        fileUrl: uploadResponse.data.fileUrl,
        signerName,
        position,
        reason,
        location,
        timestamp: new Date().toISOString(),
        hash: await this.hashSignature(signatureData)
      };
      
      this.signatures.set(signatureId, signatureInfo);
      
      return signatureInfo;
      
    } catch (error) {
      console.error('Failed to create signature:', error);
      throw error;
    }
  }
  
  /**
   * Sign document
   */
  async signDocument(documentId, signatureData, options = {}) {
    const {
      page = 1,
      x = 100,
      y = 100,
      width = 150,
      height = 50,
      reason = 'Menyetujui'
    } = options;
    
    try {
      // Create signature
      const signature = await this.createSignature(signatureData, {
        documentId,
        reason
      });
      
      // Register with server
      const response = await api.post('ttd.sign', {
        documentId,
        signatureId: signature.id,
        signatureUrl: signature.fileUrl,
        position: { page, x, y, width, height },
        reason,
        hash: signature.hash
      });
      
      if (response.status === 'success') {
        NotificationService.success('Dokumen berhasil ditandatangani');
        return response.data;
      }
      
      throw new Error(response.message);
    } catch (error) {
      NotificationService.error('Gagal menandatangani dokumen');
      throw error;
    }
  }
  
  /**
   * Sign with QR code
   */
  async signWithQR(documentId, qrData) {
    try {
      const response = await api.post('ttd.signWithQR', {
        documentId,
        qrData
      });
      
      if (response.status === 'success') {
        return response.data;
      }
      
      throw new Error(response.message);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Bulk sign documents
   */
  async bulkSign(documentIds, signatureData) {
    const results = [];
    
    for (const docId of documentIds) {
      try {
        const result = await this.signDocument(docId, signatureData);
        results.push({ documentId: docId, success: true, data: result });
      } catch (error) {
        results.push({ documentId: docId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Verify signature
   */
  async verifySignature(documentId) {
    try {
      const response = await api.get('ttd.verify', { id: documentId });
      
      if (response.status === 'success') {
        return {
          verified: response.data.verified,
          signature: response.data.signature,
          signedBy: response.data.signedBy,
          signedAt: response.data.signedAt
        };
      }
      
      return { verified: false };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return { verified: false };
    }
  }
  
  /**
   * Get signature certificate
   */
  async getCertificate(documentId) {
    try {
      const response = await api.get('ttd.certificate', { id: documentId });
      
      if (response.status === 'success') {
        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get certificate:', error);
      return null;
    }
  }
  
  /**
   * Hash signature data
   */
  async hashSignature(signatureData) {
    if (typeof signatureData === 'string') {
      return EncryptionService.hash(signatureData);
    }
    
    // If it's a data URL, extract the base64 part
    if (signatureData.includes('base64,')) {
      const base64 = signatureData.split('base64,')[1];
      return EncryptionService.hash(base64);
    }
    
    return EncryptionService.hash(JSON.stringify(signatureData));
  }
  
  /**
   * Convert data URL to blob
   */
  dataURLToBlob(dataURL) {
    return fetch(dataURL).then(res => res.blob());
  }
  
  /**
   * Generate QR signature data
   */
  generateQRSignature(documentId, signerInfo) {
    const data = {
      documentId,
      signer: signerInfo.name || 'Unknown',
      position: signerInfo.position || '',
      timestamp: new Date().toISOString(),
      version: APP_CONFIG.APP_VERSION
    };
    
    return JSON.stringify(data);
  }
  
  /**
   * Get signature position presets
   */
  getPositionPresets() {
    return [
      { name: 'Kanan Bawah', x: 350, y: 200, width: 150, height: 50 },
      { name: 'Kiri Bawah', x: 50, y: 200, width: 150, height: 50 },
      { name: 'Tengah Bawah', x: 200, y: 200, width: 150, height: 50 },
      { name: 'Custom', x: 0, y: 0, width: 150, height: 50 }
    ];
  }
}

// Singleton instance
const SignatureService = new SignatureService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SignatureService };
}
