/**
 * AI SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * AI-powered features for document analysis
 */

class AIService {
  constructor() {
    this.features = {
      autoTag: true,
      classify: true,
      summarize: true,
      anomalyDetection: true,
      trendPrediction: true,
      recommend: true
    };
  }
  
  /**
   * Initialize AI service
   */
  init() {
    console.log('✅ AI Service initialized');
  }
  
  /**
   * Auto-tag document
   */
  async autoTag(text, options = {}) {
    try {
      const response = await api.post('ai.autoTag', {
        text,
        maxTags: options.maxTags || 10,
        language: options.language || 'id'
      });
      
      if (response.status === 'success') {
        return {
          tags: response.data.tags || [],
          confidence: response.data.confidence || 0
        };
      }
      
      return { tags: [], confidence: 0 };
    } catch (error) {
      console.warn('AI auto-tag failed:', error);
      // Fallback to local keyword extraction
      return this.localAutoTag(text);
    }
  }
  
  /**
   * Local auto-tag (fallback)
   */
  localAutoTag(text) {
    if (!text) return { tags: [], confidence: 0 };
    
    const keywords = {
      'undangan': ['undangan', 'mengundang', 'invitation'],
      'pemberitahuan': ['pemberitahuan', 'pemberitahuan', 'notice'],
      'permohonan': ['permohonan', 'memohon', 'request'],
      'laporan': ['laporan', 'melaporkan', 'report'],
      'pengaduan': ['pengaduan', 'aduan', 'complaint'],
      'rekomendasi': ['rekomendasi', 'merekomendasikan', 'recommendation'],
      'perintah': ['perintah', 'memerintahkan', 'order'],
      'edaran': ['edaran', 'surat edaran', 'circular'],
      'penting': ['penting', 'segera', 'urgent'],
      'rahasia': ['rahasia', 'konfidensial', 'confidential']
    };
    
    const lowerText = text.toLowerCase();
    const tags = [];
    
    Object.entries(keywords).forEach(([tag, phrases]) => {
      const found = phrases.some(p => lowerText.includes(p));
      if (found) {
        tags.push(tag);
      }
    });
    
    return {
      tags: tags.slice(0, 5),
      confidence: 0.6
    };
  }
  
  /**
   * Classify document
   */
  async classify(text) {
    try {
      const response = await api.post('ai.classify', { text });
      
      if (response.status === 'success') {
        return {
          classification: response.data.classification,
          confidence: response.data.confidence || 0
        };
      }
      
      return { classification: 'umum', confidence: 0 };
    } catch (error) {
      console.warn('AI classify failed:', error);
      return this.localClassify(text);
    }
  }
  
  /**
   * Local classify (fallback)
   */
  localClassify(text) {
    if (!text) return { classification: 'umum', confidence: 0 };
    
    const categories = {
      'undangan': ['undangan', 'menghadiri', 'acara', 'rapat'],
      'pemberitahuan': ['memberitahukan', 'dengan ini', 'diberitahukan'],
      'permohonan': ['memohon', 'mengajukan', 'permohonan'],
      'laporan': ['laporan', 'melaporkan', 'hasil'],
      'perintah': ['memerintahkan', 'instruksi', 'arahan']
    };
    
    const lowerText = text.toLowerCase();
    let bestCategory = 'umum';
    let bestScore = 0;
    
    Object.entries(categories).forEach(([category, keywords]) => {
      const score = keywords.filter(k => lowerText.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });
    
    return {
      classification: bestCategory,
      confidence: Math.min(bestScore / 3, 1)
    };
  }
  
  /**
   * Summarize document
   */
  async summarize(text, options = {}) {
    const { maxLength = 200, language = 'id' } = options;
    
    try {
      const response = await api.post('ai.summarize', {
        text,
        maxLength,
        language
      });
      
      if (response.status === 'success') {
        return {
          summary: response.data.summary || '',
          keyPoints: response.data.keyPoints || []
        };
      }
      
      return { summary: '', keyPoints: [] };
    } catch (error) {
      console.warn('AI summarize failed:', error);
      return this.localSummarize(text, maxLength);
    }
  }
  
  /**
   * Local summarize (fallback)
   */
  localSummarize(text, maxLength = 200) {
    if (!text) return { summary: '', keyPoints: [] };
    
    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return { summary: text.substring(0, maxLength), keyPoints: [] };
    }
    
    // Score sentences by position and keyword presence
    const keywords = ['penting', 'perlu', 'harus', 'wajib', 'segera', 'diminta', 'ditetapkan'];
    const scored = sentences.map((s, i) => {
      const positionScore = i < 2 ? 2 : i < 4 ? 1 : 0;
      const keywordScore = keywords.filter(k => s.toLowerCase().includes(k)).length;
      return { sentence: s.trim(), score: positionScore + keywordScore };
    });
    
    scored.sort((a, b) => b.score - a.score);
    
    const summary = scored.slice(0, 3).map(s => s.sentence).join('. ') + '.';
    const keyPoints = scored.slice(0, 5).map(s => s.sentence);
    
    return {
      summary: summary.substring(0, maxLength),
      keyPoints
    };
  }
  
  /**
   * Detect anomalies
   */
  async detectAnomalies(params = {}) {
    try {
      const response = await api.get('ai.detectAnomaly', params);
      
      if (response.status === 'success') {
        return {
          anomalies: response.data.anomalies || [],
          totalAnalyzed: response.data.totalAnalyzed || 0
        };
      }
      
      return { anomalies: [], totalAnalyzed: 0 };
    } catch (error) {
      console.warn('AI anomaly detection failed:', error);
      return { anomalies: [], totalAnalyzed: 0 };
    }
  }
  
  /**
   * Predict trends
   */
  async predictTrends(params = {}) {
    try {
      const response = await api.get('ai.predictTrend', params);
      
      if (response.status === 'success') {
        return {
          predictions: response.data.predictions || [],
          confidence: response.data.confidence || 0
        };
      }
      
      return { predictions: [], confidence: 0 };
    } catch (error) {
      console.warn('AI trend prediction failed:', error);
      return { predictions: [], confidence: 0 };
    }
  }
  
  /**
   * Get recommendations
   */
  async getRecommendations(params = {}) {
    try {
      const response = await api.get('ai.recommend', params);
      
      if (response.status === 'success') {
        return {
          recommendations: response.data.recommendations || []
        };
      }
      
      return { recommendations: [] };
    } catch (error) {
      console.warn('AI recommendations failed:', error);
      return { recommendations: [] };
    }
  }
  
  /**
   * Analyze document sentiment
   */
  analyzeSentiment(text) {
    if (!text) return { sentiment: 'neutral', score: 0 };
    
    const positiveWords = ['setuju', 'baik', 'bagus', 'terima', 'setujui', 'lanjutkan', 'disetujui', 'berhasil'];
    const negativeWords = ['tolak', 'buruk', 'gagal', 'batal', 'tunda', 'hentikan', 'ditolak', 'masalah'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(w => { if (lowerText.includes(w)) score++; });
    negativeWords.forEach(w => { if (lowerText.includes(w)) score--; });
    
    if (score > 0) return { sentiment: 'positive', score };
    if (score < 0) return { sentiment: 'negative', score: Math.abs(score) };
    return { sentiment: 'neutral', score: 0 };
  }
  
  /**
   * Extract entities from text
   */
  extractEntities(text) {
    if (!text) return [];
    
    const entities = [];
    
    // Date patterns
    const datePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g;
    const dateMatches = text.match(datePattern);
    if (dateMatches) {
      dateMatches.forEach(m => entities.push({ type: 'date', value: m }));
    }
    
    // Number patterns (NIP, phone, etc.)
    const nipPattern = /\b(\d{18})\b/g;
    const nipMatches = text.match(nipPattern);
    if (nipMatches) {
      nipMatches.forEach(m => entities.push({ type: 'nip', value: m }));
    }
    
    // Email patterns
    const emailPattern = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
    const emailMatches = text.match(emailPattern);
    if (emailMatches) {
      emailMatches.forEach(m => entities.push({ type: 'email', value: m }));
    }
    
    // URL patterns
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urlMatches = text.match(urlPattern);
    if (urlMatches) {
      urlMatches.forEach(m => entities.push({ type: 'url', value: m }));
    }
    
    return entities;
  }
  
  /**
   * Check if AI features are enabled
   */
  isFeatureEnabled(feature) {
    return this.features[feature] || false;
  }
  
  /**
   * Enable/disable AI feature
   */
  setFeature(feature, enabled) {
    if (this.features.hasOwnProperty(feature)) {
      this.features[feature] = enabled;
    }
  }
}

// Singleton instance
const AIService = new AIService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIService };
}
