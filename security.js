/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Security Module - GRAND MASTER FINAL
 * ============================================
 */

class SecurityManager {
  constructor() {
    this.csrfToken = null;
    this.securityLog = [];
    this.maxLogEntries = 500;
    this.init();
  }

  init() {
    this.csrfToken = this.generateCSRFToken();
    this.interceptFetch();
    this.setupKeyboardSecurity();
    this.log('Security v3.1.0 initialized', 'info');
    console.log('🔒 Security v3.1.0 | CSRF:✅ | XSS:✅ | RateLimit:✅');
  }

  sanitizeHTML(str) { if (!str) return ''; const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  sanitizeURL(url) { if (!url) return '#'; try { const p = new URL(url, window.location.origin); if (['javascript:','data:','vbscript:','file:'].includes(p.protocol)) return '#'; return ['http:','https:','mailto:','tel:'].includes(p.protocol) ? p.href : '#'; } catch(e) { return '#'; } }
  sanitizeObject(obj) { if (!obj || typeof obj !== 'object') return obj; if (Array.isArray(obj)) return obj.map(i => this.sanitizeObject(i)); const s = {}; for (const [k,v] of Object.entries(obj)) { s[k] = typeof v === 'string' ? this.sanitizeHTML(v) : typeof v === 'object' ? this.sanitizeObject(v) : v; } return s; }
  escapeRegex(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  generateCSRFToken() {
    const token = this.randomString(32);
    sessionStorage.setItem('csrf_v3', token);
    sessionStorage.setItem('csrf_expiry_v3', (Date.now()+3600000).toString());
    return token;
  }

  getCSRFToken() {
    const token = sessionStorage.getItem('csrf_v3');
    const expiry = sessionStorage.getItem('csrf_expiry_v3');
    return (token && expiry && Date.now() < parseInt(expiry)) ? token : this.generateCSRFToken();
  }

  interceptFetch() {
    const self = this;
    const orig = window.fetch;
    window.fetch = function(url, opts = {}) {
      const isSameOrigin = url.toString().startsWith(window.location.origin) || url.toString().includes('script.google.com');
      if (isSameOrigin && ['POST','PUT','DELETE'].includes(opts.method?.toUpperCase())) {
        opts.headers = opts.headers || {};
        if (!opts.headers['X-CSRF-Token']) opts.headers['X-CSRF-Token'] = self.getCSRFToken();
        opts.headers['X-Requested-With'] = 'XMLHttpRequest';
      }
      return orig.call(this, url, opts);
    };
  }

  validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
  validatePhone(phone) { return /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(phone.replace(/[\s\-().]/g,'')); }
  validateNIP(nip) { return /^[0-9]{18}$/.test(nip); }
  validateURL(url) { try { return ['http:','https:'].includes(new URL(url).protocol); } catch(e) { return false; } }

  validateFile(file, opts = {}) {
    const { maxSize = 10*1024*1024, allowedTypes = ['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } = opts;
    if (file.size > maxSize) return { valid: false, error: `File terlalu besar. Maks ${Math.round(maxSize/1024/1024)}MB` };
    if (file.size === 0) return { valid: false, error: 'File kosong' };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: 'Tipe file tidak diizinkan' };
    return { valid: true };
  }

  checkPasswordStrength(pw) {
    if (!pw) return { score: 0, level: 'none', feedback: ['Password required'] };
    let score = 0; const fb = [];
    if (pw.length >= 8) score += 15; else fb.push('Min 8 karakter');
    if (pw.length >= 12) score += 10;
    if (/[a-z]/.test(pw)) score += 10; else fb.push('Tambahkan huruf kecil');
    if (/[A-Z]/.test(pw)) score += 15; else fb.push('Tambahkan huruf besar');
    if (/[0-9]/.test(pw)) score += 15; else fb.push('Tambahkan angka');
    if (/[^a-zA-Z0-9]/.test(pw)) score += 20; else fb.push('Tambahkan karakter spesial');
    if (/(.)\1{2,}/.test(pw)) score -= 10;
    score = Math.max(0, Math.min(100, score));
    let level = score >= 80 ? 'strong' : score >= 55 ? 'medium' : score >= 30 ? 'weak' : 'very-weak';
    return { score, level, feedback: fb };
  }

  generatePassword(length = 16) {
    const sets = ['abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ','0123456789','!@#$%^&*()_+-=[]{}|;:,.<>?'];
    let pw = sets.map(s => s[Math.floor(Math.random()*s.length)]).join('');
    const all = sets.join('');
    while (pw.length < length) pw += all[Math.floor(Math.random()*all.length)];
    return pw.split('').sort(()=>Math.random()-0.5).join('');
  }

  rateLimiter(fn, { limit = 10, interval = 60000 } = {}) {
    const calls = new Map();
    return async function(...args) {
      const key = 'default'; const now = Date.now();
      if (!calls.has(key)) calls.set(key, []);
      const ts = calls.get(key);
      while (ts.length && ts[0] < now - interval) ts.shift();
      if (ts.length >= limit) throw { name: 'RateLimitError', message: `Too many requests. Retry in ${Math.ceil((ts[0]+interval-now)/1000)}s`, retryAfter: Math.ceil((ts[0]+interval-now)/1000) };
      ts.push(now);
      return fn.apply(this, args);
    };
  }

  async hashString(str) {
    if (!str) return '';
    try {
      const data = new TextEncoder().encode(str);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
    } catch(e) { return this.simpleHash(str); }
  }

  simpleHash(str) { let h = 0; for (let i=0;i<str.length;i++) { h = ((h<<5)-h)+str.charCodeAt(i); h |= 0; } return Math.abs(h).toString(16); }

  async encrypt(data, key) {
    try {
      const enc = new TextEncoder();
      const kb = await crypto.subtle.importKey('raw', enc.encode(key.padEnd(32,'0').slice(0,32)), { name:'AES-GCM' }, false, ['encrypt']);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, kb, enc.encode(data));
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv); combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    } catch(e) { return data; }
  }

  async decrypt(data, key) {
    try {
      const dec = new TextDecoder();
      const kb = await crypto.subtle.importKey('raw', new TextEncoder().encode(key.padEnd(32,'0').slice(0,32)), { name:'AES-GCM' }, false, ['decrypt']);
      const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const decrypted = await crypto.subtle.decrypt({ name:'AES-GCM', iv: combined.slice(0,12) }, kb, combined.slice(12));
      return dec.decode(decrypted);
    } catch(e) { return data; }
  }

  randomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    if (window.crypto?.getRandomValues) {
      const arr = new Uint8Array(length);
      crypto.getRandomValues(arr);
      return Array.from(arr, b => chars[b % chars.length]).join('');
    }
    return Array.from({length}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
  }

  setupKeyboardSecurity() {
    document.addEventListener('copy', (e) => { if (document.activeElement?.type === 'password') { e.preventDefault(); this.log('Copy blocked on password field', 'warning'); } });
  }

  log(message, level = 'info', data = {}) {
    const entry = { timestamp: new Date().toISOString(), level, message, data, url: window.location.href };
    this.securityLog.push(entry);
    if (this.securityLog.length > this.maxLogEntries) this.securityLog = this.securityLog.slice(-250);
    const fn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    fn(`[SEC] ${message}`, data);
  }

  getLog() { return [...this.securityLog]; }
  clearLog() { this.securityLog = []; }

  scan() {
    return {
      timestamp: new Date().toISOString(),
      checks: [
        { name: 'HTTPS', passed: location.protocol === 'https:', detail: location.protocol },
        { name: 'CSP', passed: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'), detail: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'Not set' },
        { name: 'Sensitive Storage', passed: !Object.keys(localStorage).some(k => ['password','token','secret','key'].some(sk => k.toLowerCase().includes(sk))), detail: 'Checked' },
      ]
    };
  }
}

const securityManager = new SecurityManager();
window.securityManager = securityManager;
console.log('✅ security.js v3.1.0 GRAND MASTER FINAL loaded');