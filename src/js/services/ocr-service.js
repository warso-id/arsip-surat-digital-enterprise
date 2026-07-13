/**
 * OCR SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Optical Character Recognition for document scanning
 */

class OCRService {
  constructor() {
    this.isSupported = false;
    this.worker = null;
    this.processingQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * Initialize OCR service
   */
  async init() {
    // Check if Tesseract.js or similar OCR library is available
    this.isSupported = typeof Tesseract !== 'undefined' || 'createImageBitmap' in window;
    
    console.log(`✅ OCR Service initialized (Supported: ${this.isSupported})`);
  }
  
  /**
   * Scan image for text
   */
  async scanImage(imageFile, options = {}) {
    const {
      language = 'ind+eng',
      onProgress = null,
      timeout = 60000
    } = options;
    
    if (!this.isSupported) {
      // Fallback to server-side OCR
      return this.serverOCR(imageFile, options);
    }
    
    // Add to queue
    return new Promise((resolve, reject) => {
      const task = {
        id: `ocr-${Date.now()}`,
        imageFile,
        language,
        onProgress,
        timeout,
        resolve,
        reject,
        status: 'queued'
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
    
    this.isProcessing = true;
    const task = this.processingQueue.shift();
    
    try {
      task.status = 'processing';
      
      if (task.onProgress) task.onProgress(10);
      
      // Use Tesseract if available
      if (typeof Tesseract !== 'undefined') {
        const result = await this.tesseractOCR(task);
        task.resolve(result);
      } else {
        // Use browser's built-in Image to Text capability
        const result = await this.browserOCR(task);
        task.resolve(result);
      }
      
      task.status = 'completed';
      
    } catch (error) {
      task.status = 'failed';
      task.reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue(); // Process next
    }
  }
  
  /**
   * Tesseract.js OCR
   */
  async tesseractOCR(task) {
    const { imageFile, language, onProgress } = task;
    
    const worker = await Tesseract.createWorker(language);
    
    if (onProgress) onProgress(30);
    
    const { data } = await worker.recognize(imageFile);
    
    if (onProgress) onProgress(90);
    
    await worker.terminate();
    
    if (onProgress) onProgress(100);
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words?.map(w => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
      })),
      paragraphs: data.paragraphs?.map(p => ({
        text: p.text,
        confidence: p.confidence
      }))
    };
  }
  
  /**
   * Browser-based OCR (simple)
   */
  async browserOCR(task) {
    const { imageFile, onProgress } = task;
    
    // Create image bitmap
    const bitmap = await createImageBitmap(imageFile);
    
    if (onProgress) onProgress(50);
    
    // Create canvas to process
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (onProgress) onProgress(75);
    
    // Simple OCR: try to extract text patterns
    // This is a basic implementation - for production use Tesseract
    const text = await this.extractTextFromImage(imageData);
    
    if (onProgress) onProgress(100);
    
    return {
      text,
      confidence: 0.5,
      method: 'browser-basic'
    };
  }
  
  /**
   * Extract text from image data (basic)
   */
  async extractTextFromImage(imageData) {
    // This is a placeholder for actual OCR implementation
    // In production, use Tesseract.js or send to server
    
    // Return empty for now - actual OCR requires ML models
    return '';
  }
  
  /**
   * Server-side OCR (fallback)
   */
  async serverOCR(imageFile, options) {
    const { onProgress } = options;
    
    if (onProgress) onProgress(10);
    
    // Convert to base64
    const base64 = await this.fileToBase64(imageFile);
    
    if (onProgress) onProgress(30);
    
    // Send to server
    const response = await api.post('ocr.scan', {
      image: base64,
      filename: imageFile.name
    });
    
    if (onProgress) onProgress(80);
    
    if (response.status === 'success') {
      if (onProgress) onProgress(100);
      
      return {
        text: response.data.text || '',
        confidence: response.data.confidence || 0,
        method: 'server'
      };
    }
    
    throw new Error(response.message || 'OCR failed');
  }
  
  /**
   * Extract specific fields from OCR result
   */
  async extractFields(imageFile, fields = []) {
    const result = await this.scanImage(imageFile);
    const text = result.text || '';
    
    const extracted = {};
    
    fields.forEach(field => {
      switch (field) {
        case 'nomorSurat':
          extracted.nomorSurat = this.extractPattern(text, /Nomor\s*:\s*([^\n]+)/i);
          break;
        case 'tanggal':
          extracted.tanggal = this.extractPattern(text, /Tanggal\s*:\s*([^\n]+)/i);
          break;
        case 'perihal':
          extracted.perihal = this.extractPattern(text, /Perihal\s*:\s*([^\n]+)/i);
          break;
        case 'pengirim':
          extracted.pengirim = this.extractPattern(text, /Dari\s*:\s*([^\n]+)/i);
          break;
        case 'tujuan':
          extracted.tujuan = this.extractPattern(text, /Kepada\s*:\s*([^\n]+)/i);
          break;
      }
    });
    
    return extracted;
  }
  
  /**
   * Extract pattern from text
   */
  extractPattern(text, pattern) {
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Preprocess image for better OCR
   */
  async preprocessImage(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        // Draw original
        ctx.drawImage(img, 0, 0);
        
        // Apply image processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Grayscale
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
        
        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        
        for (let i = 0; i < data.length; i += 4) {
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          const processedFile = new File([blob], 'processed_' + imageFile.name, {
            type: 'image/png'
          });
          resolve(processedFile);
        }, 'image/png');
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      supported: this.isSupported
    };
  }
  
  /**
   * Clear queue
   */
  clearQueue() {
    this.processingQueue.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });
    this.processingQueue = [];
  }
}

// Singleton instance
const OCRService = new OCRService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OCRService };
}
