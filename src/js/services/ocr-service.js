/**
 * ============================================
 * OCR SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL OPTICAL CHARACTER RECOGNITION - SIAP PRODUKSI
 * Mendukung: Tesseract.js, Server OCR, Browser,
 * Image Preprocessing, Field Extraction, Queue
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class OCRService {
  constructor() {
    this.isSupported = false;
    this.tesseractAvailable = false;
    this.worker = null;
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxConcurrent = 1;
    this.activeWorkers = 0;
    this.processingHistory = [];
    this.maxHistory = 50;
    this.supportedLanguages = ['ind', 'eng', 'ind+eng'];
    this.defaultLanguage = 'ind+eng';
    this.confidenceThreshold = 60;
  }

  /**
   * Initialize OCR service
   */
  async init() {
    // Check Tesseract.js availability
    this.tesseractAvailable = typeof Tesseract !== 'undefined';
    this.isSupported = this.tesseractAvailable || 'createImageBitmap' in window;

    // Pre-load worker if Tesseract available
    if (this.tesseractAvailable) {
      try {
        this.worker = await Tesseract.createWorker(this.defaultLanguage);
        console.log('✅ Tesseract worker ready');
      } catch (e) {
        console.warn('Tesseract worker init failed, will use server fallback:', e.message);
        this.tesseractAvailable = false;
      }
    }

    console.log(`✅ OCR Service initialized (Tesseract: ${this.tesseractAvailable}, Supported: ${this.isSupported})`);
  }

  /**
   * Scan image for text - main entry point
   */
  async scanImage(imageFile, options = {}) {
    const {
      language = this.defaultLanguage,
      onProgress = null,
      timeout = 120000,
      preprocess = true,
      enhance = false,
      extractFields = null
    } = options;

    // Validate input
    if (!imageFile || !(imageFile instanceof File || imageFile instanceof Blob)) {
      throw new Error('Input harus berupa File atau Blob');
    }

    if (!imageFile.type?.startsWith('image/')) {
      throw new Error('File harus berupa gambar (JPG, PNG, dll)');
    }

    // Preprocess image if requested
    let processedFile = imageFile;
    if (preprocess) {
      if (onProgress) onProgress(5);
      processedFile = await this.preprocessImage(imageFile);
    }

    // Use Tesseract if available
    if (this.tesseractAvailable) {
      return this.queueOCR(processedFile, { ...options, language, onProgress, timeout, enhance, extractFields });
    }

    // Fallback to server OCR
    return this.serverOCR(processedFile, { ...options, onProgress, timeout, extractFields });
  }

  /**
   * Queue OCR task
   */
  queueOCR(imageFile, options) {
    return new Promise((resolve, reject) => {
      const task = {
        id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        imageFile,
        options,
        resolve,
        reject,
        status: 'queued',
        createdAt: Date.now()
      };

      this.processingQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Process OCR queue
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    if (this.activeWorkers >= this.maxConcurrent) return;

    this.isProcessing = true;
    const task = this.processingQueue.shift();

    try {
      task.status = 'processing';
      this.activeWorkers++;

      if (task.options.onProgress) task.options.onProgress(10);

      const result = await this.tesseractOCR(task);

      task.status = 'completed';
      task.completedAt = Date.now();
      task.duration = task.completedAt - task.createdAt;

      // Add to history
      this.addToHistory({ id: task.id, fileName: task.imageFile.name, duration: task.duration, success: true });

      task.resolve(result);

    } catch (error) {
      task.status = 'failed';
      this.addToHistory({ id: task.id, fileName: task.imageFile.name, success: false, error: error.message });

      // Try server fallback
      try {
        if (task.options.onProgress) task.options.onProgress(5);
        const serverResult = await this.serverOCR(task.imageFile, task.options);
        task.resolve(serverResult);
      } catch (serverError) {
        task.reject(new Error(`OCR gagal: ${error.message}. Server fallback: ${serverError.message}`));
      }
    } finally {
      this.activeWorkers--;
      this.isProcessing = false;
      this.processQueue();
    }
  }

  /**
   * Tesseract.js OCR
   */
  async tesseractOCR(task) {
    const { imageFile, options } = task;
    const { language, onProgress, timeout, enhance } = options;

    let worker;
    try {
      // Create worker with language
      if (onProgress) onProgress(15);
      worker = await Tesseract.createWorker(language || this.defaultLanguage);

      if (onProgress) onProgress(25);

      // Set parameters for better accuracy
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM?.AUTO || 3,
        tessedit_ocr_engine_mode: Tesseract.OEM?.LSTM_ONLY || 1,
      });

      if (onProgress) onProgress(30);

      // Recognize
      const { data } = await worker.recognize(imageFile);

      if (onProgress) onProgress(85);

      // Post-process results
      const result = {
        text: this.cleanText(data.text),
        confidence: Math.round(data.confidence),
        words: (data.words || []).filter(w => w.confidence > 30).map(w => ({
          text: w.text,
          confidence: Math.round(w.confidence),
          bbox: w.bbox
        })),
        paragraphs: (data.paragraphs || []).map(p => ({
          text: this.cleanText(p.text),
          confidence: Math.round(p.confidence)
        })),
        lines: (data.lines || []).map(l => ({
          text: this.cleanText(l.text),
          confidence: Math.round(l.confidence),
          bbox: l.bbox
        })),
        method: 'tesseract',
        language: language,
        processingTime: Date.now() - task.createdAt
      };

      if (onProgress) onProgress(95);

      // Extract fields if requested
      if (options.extractFields && Array.isArray(options.extractFields)) {
        result.extractedFields = this.extractFieldsFromText(result.text, options.extractFields);
      }

      if (onProgress) onProgress(100);

      return result;

    } finally {
      if (worker) {
        try { await worker.terminate(); } catch (e) {}
      }
    }
  }

  /**
   * Server-side OCR (fallback via code.gs)
   */
  async serverOCR(imageFile, options = {}) {
    const { onProgress } = options;

    if (onProgress) onProgress(10);

    // Convert to base64
    const base64 = await this.fileToBase64(imageFile);

    if (onProgress) onProgress(30);

    // Send to server
    let response;
    if (typeof api !== 'undefined') {
      response = await api.post('ocr.scan', {
        image: base64,
        filename: imageFile.name
      });
    } else if (typeof API !== 'undefined') {
      response = await API.post('ocr.scan', {
        image: base64,
        filename: imageFile.name
      });
    } else {
      const url = (typeof APP_CONFIG !== 'undefined' ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '') + '?action=ocr.scan';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: imageFile.name })
      });
      response = await res.json();
    }

    if (onProgress) onProgress(80);

    if (response?.status === 'success') {
      if (onProgress) onProgress(100);

      const result = {
        text: this.cleanText(response.data?.text || ''),
        confidence: response.data?.confidence || 0,
        words: response.data?.words || [],
        method: 'server',
        processingTime: Date.now() - (options._startTime || Date.now())
      };

      if (options.extractFields && Array.isArray(options.extractFields)) {
        result.extractedFields = this.extractFieldsFromText(result.text, options.extractFields);
      }

      return result;
    }

    throw new Error(response?.message || 'Server OCR gagal');
  }

  /**
   * Extract specific fields from OCR text
   */
  extractFieldsFromText(text, fields = []) {
    if (!text) return {};

    const extracted = {};
    const patterns = {
      'nomorSurat': [/Nomor\s*:\s*([^\n]+)/i, /No\.?\s*:\s*([^\n]+)/i, /Nomor\s*Surat\s*:\s*([^\n]+)/i],
      'tanggal': [/Tanggal\s*:\s*([^\n]+)/i, /Tgl\.?\s*:\s*([^\n]+)/i, /(\d{1,2}\s+\w+\s+\d{4})/],
      'perihal': [/Perihal\s*:\s*([^\n]+)/i, /Hal\s*:\s*([^\n]+)/i, /Subject\s*:\s*([^\n]+)/i],
      'pengirim': [/Dari\s*:\s*([^\n]+)/i, /Pengirim\s*:\s*([^\n]+)/i, /From\s*:\s*([^\n]+)/i],
      'tujuan': [/Kepada\s*:\s*([^\n]+)/i, /Tujuan\s*:\s*([^\n]+)/i, /Yth\.?\s*([^\n]+)/i, /To\s*:\s*([^\n]+)/i],
      'sifat': [/Sifat\s*:\s*([^\n]+)/i, /Sifat\s*Surat\s*:\s*([^\n]+)/i],
      'lampiran': [/Lampiran\s*:\s*([^\n]+)/i, /Lamp\.?\s*:\s*([^\n]+)/i],
      'nomorAgenda': [/Agenda\s*:\s*([^\n]+)/i, /No\.?\s*Agenda\s*:\s*([^\n]+)/i],
      'email': [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/],
      'telepon': [/(\+?62|0)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}/],
      'nip': [/(\d{18})/]
    };

    fields.forEach(field => {
      const fieldPatterns = patterns[field] || [];
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          extracted[field] = match[1].trim();
          break;
        }
      }
      if (!extracted[field]) extracted[field] = '';
    });

    return extracted;
  }

  /**
   * Extract specific fields from image directly
   */
  async extractFields(imageFile, fields = []) {
    const result = await this.scanImage(imageFile, { extractFields: fields });
    return result.extractedFields || {};
  }

  /**
   * Preprocess image for better OCR
   */
  async preprocessImage(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDimension = 2000;
          let { width, height } = img;

          // Resize if too large
          if (width > maxDimension || height > maxDimension) {
            const ratio = maxDimension / Math.max(width, height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Draw original
          ctx.drawImage(img, 0, 0, width, height);

          // Apply image processing
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Grayscale
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }

          // Increase contrast
          const contrast = 1.4;
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
            data[i + 1] = data[i];
            data[i + 2] = data[i];
          }

          ctx.putImageData(imageData, 0, 0);

          // Apply slight sharpening
          ctx.filter = 'sharpen(0.5)';
          ctx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';

          canvas.toBlob((blob) => {
            if (!blob) {
              resolve(imageFile); // Fallback to original
              return;
            }
            const processedFile = new File([blob], 'ocr_processed_' + imageFile.name, {
              type: 'image/png',
              lastModified: Date.now()
            });
            resolve(processedFile);
          }, 'image/png', 0.9);
        } catch (e) {
          console.warn('Image preprocessing failed, using original:', e);
          resolve(imageFile);
        }
      };
      img.onerror = () => resolve(imageFile);
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Clean OCR text
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? result.split(',')[1] || result : '';
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
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
   * Scan from URL
   */
  async scanFromURL(imageUrl, options = {}) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'ocr_image.' + (blob.type.split('/')[1] || 'png'), { type: blob.type });
      return this.scanImage(file, options);
    } catch (error) {
      throw new Error(`Gagal mengambil gambar dari URL: ${error.message}`);
    }
  }

  /**
   * Scan from canvas
   */
  async scanFromCanvas(canvas, options = {}) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { reject(new Error('Gagal konversi canvas')); return; }
        const file = new File([blob], 'canvas_image.png', { type: 'image/png' });
        try {
          const result = await this.scanImage(file, options);
          resolve(result);
        } catch (e) { reject(e); }
      }, 'image/png');
    });
  }

  /**
   * Scan from base64
   */
  async scanFromBase64(base64, options = {}) {
    const blob = this.base64ToBlob(base64);
    const file = new File([blob], 'ocr_image.png', { type: 'image/png' });
    return this.scanImage(file, options);
  }

  /**
   * Add to processing history
   */
  addToHistory(entry) {
    this.processingHistory.unshift(entry);
    if (this.processingHistory.length > this.maxHistory) {
      this.processingHistory = this.processingHistory.slice(0, this.maxHistory);
    }
  }

  /**
   * Get processing history
   */
  getHistory(limit = 20) {
    return this.processingHistory.slice(0, limit);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      activeWorkers: this.activeWorkers,
      tesseractAvailable: this.tesseractAvailable,
      supported: this.isSupported,
      totalProcessed: this.processingHistory.length,
      successRate: this.processingHistory.length > 0
        ? Math.round((this.processingHistory.filter(h => h.success).length / this.processingHistory.length) * 100)
        : 0
    };
  }

  /**
   * Clear queue
   */
  clearQueue() {
    const count = this.processingQueue.length;
    this.processingQueue.forEach(task => {
      task.status = 'cancelled';
      task.reject(new Error('Queue dibersihkan'));
    });
    this.processingQueue = [];
    return count;
  }

  /**
   * Set language
   */
  async setLanguage(language) {
    if (this.supportedLanguages.includes(language)) {
      this.defaultLanguage = language;
      if (this.worker) {
        try { await this.worker.terminate(); } catch (e) {}
        this.worker = await Tesseract.createWorker(language);
      }
    }
  }

  /**
   * Destroy service
   */
  async destroy() {
    this.clearQueue();
    if (this.worker) {
      try { await this.worker.terminate(); } catch (e) {}
      this.worker = null;
    }
    this.processingHistory = [];
  }
}

// Singleton instance
const OCRService = new OCRService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OCRService };
}
