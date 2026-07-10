/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v30.1.0 (2026)
 * Master Application Core - ABSOLUTE FINAL
 * ============================================
 * Features: AI, Blockchain, Biometric, Voice,
 *           Dark Mode, i18n, PWA, Realtime,
 *           Offline, Security, Export, Backup
 * ============================================
 */

const APP = {
  version: '30.1.0',
  buildDate: '2026-07-10',
  apiUrl: 'https://script.google.com/macros/s/[SCRIPT_ID]/exec',
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  theme: localStorage.getItem('theme') || 'light',
  lang: localStorage.getItem('lang') || 'id',
  online: navigator.onLine,
};

// ========== API CLIENT ==========
APP.api = {
  async request(action, params = {}, method = 'GET') {
    const url = new URL(APP.apiUrl);
    url.searchParams.set('action', action);
    if (APP.token) url.searchParams.set('token', APP.token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    try {
      const res = await fetch(url, { method });
      return await res.json();
    } catch (e) {
      if (!APP.online) return { error: 'Offline', cached: true };
      throw e;
    }
  },
  get(action, params) { return this.request(action, params, 'GET'); },
  post(action, params) { return this.request(action, params, 'POST'); },
};

// ========== AUTH ==========
APP.auth = {
  async login(username, password) {
    const res = await APP.api.post('login', { username, password });
    if (res.status === 'success') {
      APP.token = res.data.token;
      APP.user = res.data.user;
      localStorage.setItem('token', APP.token);
      localStorage.setItem('user', JSON.stringify(APP.user));
      return true;
    }
    return false;
  },
  logout() {
    APP.token = null;
    APP.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  },
  isLoggedIn() { return !!APP.token; },
  hasRole(role) { return APP.user?.role === role; },
};

// ========== AI ENGINE ==========
APP.ai = {
  smartSearch(query, data) {
    if (!query || !data?.length) return data;
    const q = query.toLowerCase();
    return data.filter(item => 
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  },
  autoTag(text) {
    const tags = [];
    const rules = [
      { kw: ['undangan','rapat','meeting'], tag: 'Rapat' },
      { kw: ['laporan','report','kinerja'], tag: 'Laporan' },
      { kw: ['keuangan','anggaran','dana'], tag: 'Keuangan' },
      { kw: ['urgent','segera','penting'], tag: 'Urgent' },
      { kw: ['permohonan','request','pengajuan'], tag: 'Permohonan' },
    ];
    rules.forEach(r => {
      if (r.kw.some(k => text.toLowerCase().includes(k))) tags.push(r.tag);
    });
    return tags;
  },
  detectAnomaly(item) {
    let score = 0;
    if (!item.nomorSurat) score += 20;
    if (item.tanggal && new Date(item.tanggal) > new Date()) score += 30;
    return { score, isAnomaly: score > 30 };
  },
};

// ========== BLOCKCHAIN ==========
APP.blockchain = {
  chain: JSON.parse(localStorage.getItem('bc_chain') || '[{"index":0,"hash":"0","prevHash":"0","data":"Genesis v30.1.0"}]'),
  
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  },
  
  addBlock(data) {
    const prev = this.chain[this.chain.length - 1];
    const block = {
      index: prev.index + 1,
      timestamp: new Date().toISOString(),
      data,
      prevHash: prev.hash,
      hash: this.hash(prev.index + 1 + JSON.stringify(data) + prev.hash),
    };
    this.chain.push(block);
    localStorage.setItem('bc_chain', JSON.stringify(this.chain));
    return block;
  },
  
  verify() {
    for (let i = 1; i < this.chain.length; i++) {
      const curr = this.chain[i];
      const prev = this.chain[i - 1];
      if (curr.prevHash !== prev.hash) return false;
      if (curr.hash !== this.hash(curr.index + JSON.stringify(curr.data) + curr.prevHash)) return false;
    }
    return true;
  },
};

// ========== BIOMETRIC ==========
APP.biometric = {
  async isAvailable() {
    return window.PublicKeyCredential !== undefined;
  },
  async authenticate() {
    if (!await this.isAvailable()) return false;
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: 'required',
          timeout: 30000,
        }
      });
      return !!credential;
    } catch (e) { return false; }
  },
};

// ========== VOICE ==========
APP.voice = {
  recognition: null,
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = APP.lang === 'en' ? 'en-US' : 'id-ID';
    this.recognition.continuous = false;
  },
  start() {
    if (!this.recognition) { alert('Voice not supported'); return; }
    this.recognition.start();
    this.recognition.onresult = (e) => {
      const cmd = e.results[0][0].transcript.toLowerCase();
      this.execute(cmd);
    };
  },
  execute(cmd) {
    if (cmd.includes('dashboard')) location.href = '/';
    else if (cmd.includes('surat masuk')) location.href = '/surat-masuk';
    else if (cmd.includes('surat keluar')) location.href = '/surat-keluar';
    else if (cmd.includes('approval')) location.href = '/approval';
    else if (cmd.includes('dark mode')) APP.theme.toggle();
    else if (cmd.includes('english')) APP.i18n.set('en');
    else if (cmd.includes('indonesia')) APP.i18n.set('id');
    else console.log('Unknown command:', cmd);
  },
};

// ========== THEME ==========
APP.theme = {
  init() {
    document.documentElement.setAttribute('data-theme', APP.theme);
  },
  toggle() {
    APP.theme = APP.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', APP.theme);
    localStorage.setItem('theme', APP.theme);
  },
};

// ========== i18n ==========
APP.i18n = {
  data: {
    id: { welcome: 'Selamat Datang', logout: 'Keluar', dashboard: 'Dashboard', surat_masuk: 'Surat Masuk', surat_keluar: 'Surat Keluar', approval: 'Approval', disposisi: 'Disposisi', arsip: 'Arsip', pengaturan: 'Pengaturan', search: 'Cari...', save: 'Simpan', cancel: 'Batal', delete: 'Hapus', edit: 'Edit', loading: 'Memuat...', no_data: 'Tidak ada data', online: 'Online', offline: 'Offline', success: 'Berhasil', error: 'Gagal', confirm: 'Konfirmasi', yes: 'Ya', no: 'Tidak' },
    en: { welcome: 'Welcome', logout: 'Logout', dashboard: 'Dashboard', surat_masuk: 'Incoming Mail', surat_keluar: 'Outgoing Mail', approval: 'Approval', disposisi: 'Disposition', arsip: 'Archive', pengaturan: 'Settings', search: 'Search...', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', loading: 'Loading...', no_data: 'No data', online: 'Online', offline: 'Offline', success: 'Success', error: 'Error', confirm: 'Confirm', yes: 'Yes', no: 'No' },
  },
  t(key) { return this.data[APP.lang]?.[key] || this.data.id[key] || key; },
  set(lang) { APP.lang = lang; localStorage.setItem('lang', lang); location.reload(); },
};

// ========== NOTIFICATION ==========
APP.notif = {
  async request() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },
  send(title, options = {}) {
    if (Notification.permission === 'granted') {
      new Notification(title, { icon: '/icons/icon-192x192.png', ...options });
    }
  },
};

// ========== EXPORT ==========
APP.export = {
  toCSV(data, filename = 'export.csv') {
    if (!data?.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${r[h]||''}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  },
  toJSON(data, filename = 'export.json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  },
  print(data, title = 'Laporan') {
    const w = window.open('', '_blank');
    w.document.write(`<h1>${title}</h1><pre>${JSON.stringify(data, null, 2)}</pre><script>print()</script>`);
    w.document.close();
  },
};

// ========== DB (IndexedDB) ==========
APP.db = {
  db: null,
  async open() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('ArsipSuratDB', 30);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'url' });
        if (!db.objectStoreNames.contains('pending')) db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
      req.onerror = (e) => reject(e.target.error);
    });
  },
  async cache(url, data) {
    await this.open();
    const tx = this.db.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ url, data, ts: Date.now() });
  },
  async getCache(url) {
    await this.open();
    return new Promise((resolve) => {
      const tx = this.db.transaction('cache', 'readonly');
      const req = tx.objectStore('cache').get(url);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  },
};

// ========== UI HELPERS ==========
APP.ui = {
  toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;animation:slideIn .3s;background:${type==='success'?'#4CAF50':type==='error'?'#F44336':type==='warning'?'#FF9800':'#2196F3'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
  },
  confirm(msg) { return confirm(msg); },
  loading(show = true) {
    const el = document.getElementById('loading');
    if (show) { if (!el) { const d = document.createElement('div'); d.id = 'loading'; d.innerHTML = '<div style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;"><div style="background:white;padding:24px;border-radius:12px;text-align:center;"><div class="spinner"></div><p>Loading...</p></div></div>'; document.body.appendChild(d); } }
    else { if (el) el.remove(); }
  },
};

// ========== INITIALIZATION ==========
APP.init = async function() {
  console.log(`🚀 Arsip Surat Digital Enterprise v${APP.version}`);
  console.log('🤖 AI | 🔗 Blockchain | 🔐 Biometric | 🎤 Voice | 🌙 Dark Mode | 🌐 i18n');
  
  // Theme
  APP.theme.init();
  
  // Voice
  APP.voice.init();
  
  // DB
  await APP.db.open();
  
  // Online/Offline
  window.addEventListener('online', () => { APP.online = true; APP.ui.toast(APP.i18n.t('online'), 'success'); });
  window.addEventListener('offline', () => { APP.online = false; APP.ui.toast(APP.i18n.t('offline'), 'warning'); });
  
  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js?v=30.1.0');
  }
  
  // Check auth
  if (APP.auth.isLoggedIn()) {
    console.log('✅ User authenticated:', APP.user?.username);
  }
  
  // Blockchain verify
  const bcValid = APP.blockchain.verify();
  console.log('🔗 Blockchain:', bcValid ? '✅ Valid' : '❌ Invalid');
  
  // Global shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); APP.theme.toggle(); }
    if (e.ctrlKey && e.key === 'l') { e.preventDefault(); APP.i18n.set(APP.lang === 'id' ? 'en' : 'id'); }
  });
  
  console.log('✅ App v30.1.0 initialized successfully');
};

// ========== EXPORT ==========
window.APP = APP;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => APP.init());
} else {
  APP.init();
}

console.log('✅ App.js v30.1.0 ABSOLUTE FINAL loaded');