/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * AI Local Engine - GRAND MASTER FINAL
 * ============================================
 */

class AILocalEngine {
  constructor() {
    this.initialized = false;
    this.confidenceThreshold = 0.7;
    this.tagRules = [];
    this.modelVersion = '3.1.0';
    this.init();
  }

  async init() {
    this.tagRules = [
      { keywords: ['undangan','rapat','meeting','invitation','koordinasi','pertemuan'], tag: 'Rapat', confidence: 0.95 },
      { keywords: ['laporan','report','kinerja','performance','capaian','evaluasi'], tag: 'Laporan', confidence: 0.92 },
      { keywords: ['permohonan','request','pengajuan','application','permintaan','proposal'], tag: 'Permohonan', confidence: 0.90 },
      { keywords: ['keuangan','finance','anggaran','budget','dana','pembayaran','spj'], tag: 'Keuangan', confidence: 0.93 },
      { keywords: ['urgent','segera','penting','immediate','darurat','mendesak','prioritas'], tag: 'Urgent', confidence: 0.97 },
      { keywords: ['disposisi','tindak lanjut','follow up','instruksi','arahan'], tag: 'Disposisi', confidence: 0.88 },
      { keywords: ['pemberitahuan','notification','pengumuman','announcement','edaran','info'], tag: 'Pemberitahuan', confidence: 0.91 },
      { keywords: ['kerjasama','mou','perjanjian','agreement','kolaborasi','mitra','nota kesepahaman'], tag: 'Kerjasama', confidence: 0.89 },
      { keywords: ['pelatihan','training','workshop','diklat','bimtek','seminar','sosialisasi'], tag: 'Pelatihan', confidence: 0.94 },
      { keywords: ['pengaduan','complaint','keluhan','aduan','masalah','kendala'], tag: 'Pengaduan', confidence: 0.87 },
      { keywords: ['kepegawaian','hr','pegawai','employee','personalia','cuti','kenaikan pangkat'], tag: 'Kepegawaian', confidence: 0.90 },
      { keywords: ['hukum','legal','peraturan','regulasi','undang','kebijakan','perda'], tag: 'Hukum', confidence: 0.88 },
    ];
    this.initialized = true;
    console.log('🤖 AI Local Engine v3.1.0 initialized | Rules: ' + this.tagRules.length);
  }

  autoTag(text) {
    if (!text || !this.initialized) return [];
    const tl = text.toLowerCase();
    const tags = [];
    this.tagRules.forEach(rule => {
      const matches = rule.keywords.filter(kw => tl.includes(kw));
      if (matches.length > 0) {
        const conf = Math.min(rule.confidence + (matches.length-1)*0.02, 0.99);
        if (conf >= this.confidenceThreshold) tags.push({ tag: rule.tag, confidence: Math.round(conf*100)/100, matchedKeywords: matches });
      }
    });
    return tags.sort((a,b) => b.confidence - a.confidence);
  }

  smartSearch(query, data, fields = ['nomorSurat','nomorAgenda','pengirim','perihal','catatan','aiTags']) {
    if (!query || !data?.length) return data;
    const ql = query.toLowerCase();
    const qw = ql.split(/\s+/);
    return data.map(item => {
      let score = 0;
      const matched = [];
      fields.forEach(f => {
        const val = (item[f]||'').toLowerCase();
        qw.forEach(w => { if (val.includes(w)) { score += 10; matched.push(f); } });
        if (val.includes(ql)) score += 50;
      });
      return { ...item, _relevanceScore: Math.min(100, score), _matchedFields: [...new Set(matched)] };
    }).filter(item => item._relevanceScore > 0).sort((a,b) => b._relevanceScore - a._relevanceScore);
  }

  detectAnomalies(data) {
    const anomalies = [];
    data.forEach(item => {
      let score = 0;
      const reasons = [];
      if (item.tanggalSurat && new Date(item.tanggalSurat) > new Date()) { score += 30; reasons.push('Tanggal surat di masa depan'); }
      if (item.tanggalSurat && new Date(item.tanggalSurat) < new Date('2020-01-01')) { score += 20; reasons.push('Tanggal surat terlalu lama'); }
      if (item.pengirim && item.pengirim.length < 3) { score += 20; reasons.push('Nama pengirim terlalu pendek'); }
      if (!item.nomorSurat && !item.nomorAgenda) { score += 15; reasons.push('Tidak ada nomor surat'); }
      if (item.catatan && item.catatan.length > 2000) { score += 10; reasons.push('Catatan terlalu panjang'); }
      if (score > 30) anomalies.push({ ...item, anomalyScore: score, anomalyReasons: reasons });
    });
    return anomalies.sort((a,b) => b.anomalyScore - a.anomalyScore);
  }

  analyzeSentiment(text) {
    const pos = ['baik','bagus','setuju','terima','sukses','berhasil','good','great','approved','disetujui'];
    const neg = ['tolak','buruk','gagal','batal','reject','bad','failed','masalah','ditolak'];
    const tl = text.toLowerCase();
    let score = 0;
    pos.forEach(w => { if (tl.includes(w)) score += 10; });
    neg.forEach(w => { if (tl.includes(w)) score -= 10; });
    return { sentiment: score > 5 ? 'positive' : score < -5 ? 'negative' : 'neutral', score };
  }

  extractInfo(text) {
    const info = { emails: [], phones: [], dates: [], names: [] };
    const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g);
    if (emails) info.emails = emails;
    const phones = text.match(/(\+62|62|0)[\s-]?[0-9]{2,3}[\s-]?[0-9]{3,4}[\s-]?[0-9]{3,4}/g);
    if (phones) info.phones = phones;
    const dates = text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g);
    if (dates) info.dates = dates;
    return info;
  }

  generateSummary(text, maxLength = 200) {
    if (!text || text.length <= maxLength) return text;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length <= 3) return text.substring(0, maxLength) + '...';
    const summary = sentences[0].trim() + '. ' + sentences[sentences.length-1].trim() + '.';
    return summary.length <= maxLength ? summary : summary.substring(0, maxLength) + '...';
  }

  async predictTrend(historicalData, months = 3) {
    const data = historicalData || [];
    const last = data.slice(-3);
    const avg = last.length ? last.reduce((a,b)=>a+b,0)/last.length : 10;
    const trend = last.length >= 2 ? (last[last.length-1]-last[0])/last.length : 0;
    const preds = [];
    for (let i=0; i<months; i++) {
      const p = Math.max(0, Math.round(avg + trend*(i+1) + (Math.random()*4-2)));
      preds.push({ month: new Date(2026, new Date().getMonth()+i+1).toLocaleString('id',{month:'long',year:'numeric'}), predicted: p, confidence: Math.round(Math.max(60, 85-i*5)), lowerBound: Math.max(0, Math.round(p*0.8)), upperBound: Math.round(p*1.2) });
    }
    return { historical: data, predictions: preds, modelVersion: this.modelVersion };
  }

  async analyzeDocument(text) {
    if (!text) return null;
    return {
      wordCount: text.split(/\s+/).length,
      charCount: text.length,
      sentiment: this.analyzeSentiment(text),
      entities: this.extractInfo(text),
      tags: this.autoTag(text),
      summary: this.generateSummary(text),
      language: this.detectLanguage(text),
      modelVersion: this.modelVersion,
    };
  }

  detectLanguage(text) {
    const idw = ['yang','dan','di','dengan','untuk','pada','adalah','ini','itu','surat','dari','kepada','perihal'];
    const enw = ['the','and','for','with','this','that','letter','from','to','subject','dear','sincerely'];
    const tl = text.toLowerCase();
    let ids = 0, ens = 0;
    idw.forEach(w => { if (tl.includes(w)) ids++; });
    enw.forEach(w => { if (tl.includes(w)) ens++; });
    return ids > ens ? 'id' : ens > ids ? 'en' : 'unknown';
  }

  getStats() {
    return {
      initialized: this.initialized,
      modelVersion: this.modelVersion,
      totalRules: this.tagRules.length,
      confidenceThreshold: this.confidenceThreshold,
      supportedFeatures: ['autoTag','smartSearch','anomalyDetection','sentimentAnalysis','entityExtraction','summarization','prediction','documentAnalysis','languageDetection'],
    };
  }
}

const aiLocalEngine = new AILocalEngine();
window.aiLocalEngine = aiLocalEngine;
window.AILocalEngine = AILocalEngine;
console.log('✅ ai-local.js v3.1.0 GRAND MASTER FINAL loaded');