/**
 * ============================================
 * SIGNATURE SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL DIGITAL SIGNATURE MANAGEMENT - SIAP PRODUKSI
 * Mendukung: Create, Sign, Verify, Certificate,
 * QR Sign, Bulk Sign, Position Presets, History
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class SignatureService {
  constructor() {
    this.signatures = new Map();
    this.signatureHistory = [];
    this.maxHistory = 100;
    this.defaultOptions = {
      reason: 'Menyetujui',
      location: 'Indonesia',
      position: { page: 1, x: 100, y: 100, width: 150, height: 50 }
    };
  }

  /**
   * Initialize signature service
   */
  init() {
    this.loadHistory();
    console.log('✅ Signature Service initialized');
  }

  /**
   * Create signature from canvas/data URL
   */
  async createSignature(signatureData, metadata = {}) {
    const {
      documentId,
      signerName,
      signerNIP,
      signerJabatan,
      position,
      reason = 'Menyetujui',
      location = 'Indonesia',
      signerId
    } = metadata;

    try {
      // Validate signature data
      if (!signatureData) {
        throw new Error('Data tanda tangan tidak boleh kosong');
      }

      // Convert to blob
      let blob;
      if (typeof signatureData === 'string') {
        if (signatureData.startsWith('data:')) {
          blob = await this.dataURLToBlob(signatureData);
        } else if (signatureData.startsWith('http')) {
          const response = await fetch(signatureData);
          blob = await response.blob();
        } else {
          // Assume base64
          blob = this.base64ToBlob(signatureData, 'image/png');
        }
      } else if (signatureData instanceof Blob) {
        blob = signatureData;
      } else {
        throw new Error('Format tanda tangan tidak didukung');
      }

      const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });

      // Upload signature file
      let uploadResult;
      if (typeof api !== 'undefined') {
        uploadResult = await api.uploadFile(file);
      } else if (typeof FileService !== 'undefined') {
        const uploader = new FileService();
        uploadResult = await uploader.upload(file);
      } else {
        // Fallback: convert to base64 and store locally
        const base64 = await this.blobToBase64(blob);
        uploadResult = {
          status: 'success',
          data: { fileId: `local-${Date.now()}`, fileUrl: `data:image/png;base64,${base64}` }
        };
      }

      if (uploadResult?.status !== 'success') {
        throw new Error('Gagal mengupload tanda tangan');
      }

      // Generate signature hash
      const hash = await this.hashSignature(signatureData);

      // Create signature record
      const signatureId = `sig-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const signatureInfo = {
        id: signatureId,
        fileId: uploadResult.data?.fileId || uploadResult.data?.id,
        fileUrl: uploadResult.data?.fileUrl || uploadResult.data?.url,
        signerName: signerName || 'Unknown',
        signerNIP: signerNIP || '',
        signerJabatan: signerJabatan || '',
        signerId: signerId || '',
        documentId: documentId || '',
        position: position || this.defaultOptions.position,
        reason,
        location,
        timestamp: new Date().toISOString(),
        hash,
        verified: false
      };

      // Store in memory
      this.signatures.set(signatureId, signatureInfo);

      // Add to history
      this.addToHistory({
        action: 'create',
        signatureId,
        signerName,
        documentId,
        timestamp: signatureInfo.timestamp
      });

      return signatureInfo;
    } catch (error) {
      console.error('Failed to create signature:', error);
      throw error;
    }
  }

  /**
   * Sign a document with signature
   */
  async signDocument(documentId, signatureData, options = {}) {
    const {
      page = 1,
      x = 100,
      y = 100,
      width = 150,
      height = 50,
      reason = 'Menyetujui',
      location = 'Indonesia',
      signerName,
      signerNIP,
      signerJabatan,
      notifyPemohon = true
    } = options;

    try {
      // Create signature first
      const signature = await this.createSignature(signatureData, {
        documentId,
        signerName,
        signerNIP,
        signerJabatan,
        position: { page, x, y, width, height },
        reason,
        location
      });

      // Register signature with server (via code.gs)
      const signPayload = {
        documentId,
        signatureId: signature.id,
        signatureUrl: signature.fileUrl,
        signatureHash: signature.hash,
        position: { page, x, y, width, height },
        reason,
        location,
        signerName: signerName || signature.signerName,
        signerNIP: signerNIP || '',
        signerJabatan: signerJabatan || '',
        notifyPemohon,
        timestamp: signature.timestamp
      };

      let response;
      if (typeof api !== 'undefined') {
        response = await api.post('ttd.sign', signPayload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('ttd.sign', signPayload);
      } else {
        // Direct fetch fallback
        const url = this.getApiUrl() + '?action=ttd.sign';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signPayload)
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        signature.verified = true;

        // Add to history
        this.addToHistory({
          action: 'sign',
          documentId,
          signatureId: signature.id,
          signerName: signature.signerName,
          timestamp: new Date().toISOString()
        });

        this.showToast('✅ Dokumen berhasil ditandatangani', 'success');
        return { ...signature, serverResponse: response.data };
      }

      throw new Error(response?.message || 'Gagal menandatangani dokumen');
    } catch (error) {
      this.showToast('❌ Gagal menandatangani: ' + error.message, 'error');
      throw error;
    }
  }

  /**
   * Sign document with QR code
   */
  async signWithQR(documentId, qrData) {
    try {
      let response;
      const payload = { documentId, qrData, timestamp: new Date().toISOString() };

      if (typeof api !== 'undefined') {
        response = await api.post('ttd.signWithQR', payload);
      } else if (typeof API !== 'undefined') {
        response = await API.post('ttd.signWithQR', payload);
      } else {
        const url = this.getApiUrl() + '?action=ttd.signWithQR';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        response = await res.json();
      }

      if (response?.status === 'success') {
        this.addToHistory({
          action: 'signWithQR',
          documentId,
          timestamp: new Date().toISOString()
        });
        return response.data;
      }

      throw new Error(response?.message || 'Gagal menandatangani dengan QR');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk sign multiple documents
   */
  async bulkSign(documentIds, signatureData, options = {}) {
    const results = [];
    const total = documentIds.length;
    let completed = 0;

    for (const docId of documentIds) {
      try {
        const result = await this.signDocument(docId, signatureData, options);
        completed++;
        results.push({ documentId: docId, success: true, data: result, progress: Math.round((completed / total) * 100) });
      } catch (error) {
        completed++;
        results.push({ documentId: docId, success: false, error: error.message, progress: Math.round((completed / total) * 100) });
      }
    }

    this.addToHistory({
      action: 'bulkSign',
      count: documentIds.length,
      successCount: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });

    return results;
  }

  /**
   * Verify signature validity
   */
  async verifySignature(documentId) {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('ttd.verify', { id: documentId });
      } else if (typeof API !== 'undefined') {
        response = await API.get('ttd.verify', { id: documentId });
      } else {
        const url = this.getApiUrl() + '?action=ttd.verify&id=' + documentId;
        const res = await fetch(url);
        response = await res.json();
      }

      if (response?.status === 'success') {
        return {
          verified: response.data?.verified || false,
          signature: response.data?.signature || null,
          signedBy: response.data?.signedBy || '',
          signedAt: response.data?.signedAt || '',
          hash: response.data?.hash || '',
          blockIndex: response.data?.blockIndex || null
        };
      }

      return { verified: false, error: response?.message || 'Verifikasi gagal' };
    } catch (error) {
      console.error('Signature verification failed:', error);
      return { verified: false, error: error.message };
    }
  }

  /**
   * Get signature certificate
   */
  async getCertificate(documentId) {
    try {
      let response;
      if (typeof api !== 'undefined') {
        response = await api.get('ttd.certificate', { id: documentId });
      } else if (typeof API !== 'undefined') {
        response = await API.get('ttd.certificate', { id: documentId });
      }

      if (response?.status === 'success') {
        return {
          documentId,
          certificate: response.data,
          generatedAt: new Date().toISOString()
        };
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
    try {
      let dataToHash;

      if (typeof signatureData === 'string') {
        if (signatureData.includes('base64,')) {
          dataToHash = signatureData.split('base64,')[1];
        } else {
          dataToHash = signatureData;
        }
      } else {
        dataToHash = JSON.stringify(signatureData);
      }

      // Use Web Crypto API for SHA-256
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(dataToHash));
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback: simple hash
      return this.simpleHash(String(signatureData));
    }
  }

  /**
   * Simple hash fallback
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Generate QR signature data for verification
   */
  generateQRSignature(documentId, signerInfo = {}) {
    const data = {
      v: '1.0',
      type: 'signature',
      documentId,
      signer: signerInfo.name || signerInfo.signerName || 'Unknown',
      position: signerInfo.position || signerInfo.jabatan || '',
      timestamp: new Date().toISOString(),
      appVersion: typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.APP_VERSION : '3.2.2'
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
      { name: 'Kanan Atas', x: 350, y: 50, width: 150, height: 50 },
      { name: 'Custom', x: 0, y: 0, width: 150, height: 50 }
    ];
  }

  /**
   * Get signature by ID
   */
  getSignature(signatureId) {
    return this.signatures.get(signatureId) || null;
  }

  /**
   * Get all signatures for a document
   */
  getDocumentSignatures(documentId) {
    const sigs = [];
    this.signatures.forEach(sig => {
      if (sig.documentId === documentId) sigs.push(sig);
    });
    return sigs;
  }

  /**
   * Get signature history
   */
  getHistory(limit = 20) {
    return this.signatureHistory.slice(-limit);
  }

  /**
   * Add to history
   */
  addToHistory(entry) {
    this.signatureHistory.push(entry);
    if (this.signatureHistory.length > this.maxHistory) {
      this.signatureHistory = this.signatureHistory.slice(-this.maxHistory);
    }
    this.saveHistory();
  }

  /**
   * Load history from storage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem('asd_signature_history');
      if (stored) this.signatureHistory = JSON.parse(stored);
    } catch {}
  }

  /**
   * Save history to storage
   */
  saveHistory() {
    try {
      localStorage.setItem('asd_signature_history', JSON.stringify(this.signatureHistory.slice(-50)));
    } catch {}
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.signatureHistory = [];
    localStorage.removeItem('asd_signature_history');
  }

  /**
   * Convert data URL to Blob
   */
  async dataURLToBlob(dataURL) {
    const response = await fetch(dataURL);
    return response.blob();
  }

  /**
   * Convert Blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? result.split(',')[1] || result : '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 to Blob
   */
  base64ToBlob(base64, mimeType = 'image/png') {
    const byteChars = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteChars.length; offset += 512) {
      const slice = byteChars.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Get API URL
   */
  getApiUrl() {
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '';
    }
    return '';
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    if (typeof Toast !== 'undefined') Toast.show(message, type);
    else if (typeof NotificationService !== 'undefined') NotificationService.show(message, type);
  }

  /**
   * Destroy service
   */
  destroy() {
    this.signatures.clear();
    this.signatureHistory = [];
  }
}

// Singleton instance
const SignatureService = new SignatureService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SignatureService };
}
