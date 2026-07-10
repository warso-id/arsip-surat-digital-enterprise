/**
 * ============================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.1.0 (2026)
 * Notification Module - GRAND MASTER FINAL
 * ============================================
 */

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.swRegistration = null;
    this.soundEnabled = true;
    this.desktopEnabled = true;
    this.inAppEnabled = true;
    this.mutedUntil = 0;
    this.pollingInterval = null;
    this.init();
  }

  async init() {
    if ('Notification' in window) this.permission = Notification.permission;
    if ('serviceWorker' in navigator) {
      try { this.swRegistration = await navigator.serviceWorker.ready; } catch(e) {}
    }
    this.loadSettings();
    this.startPolling();
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.type === 'PUSH_NOTIFICATION') this.handlePush(e.data.payload); });
    console.log('🔔 Notifications v3.1.0 initialized | Permission: ' + this.permission);
  }

  loadSettings() {
    try {
      this.soundEnabled = JSON.parse(localStorage.getItem('notif_sound') || 'true');
      this.desktopEnabled = JSON.parse(localStorage.getItem('notif_desktop') || 'true');
      this.inAppEnabled = JSON.parse(localStorage.getItem('notif_inApp') || 'true');
      this.mutedUntil = parseInt(localStorage.getItem('notif_mutedUntil') || '0');
    } catch(e) {}
  }

  saveSetting(key, value) { try { localStorage.setItem('notif_' + key, JSON.stringify(value)); } catch(e) {} }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    try { const p = await Notification.requestPermission(); this.permission = p; return p === 'granted'; } catch(e) { return false; }
  }

  isMuted() { return Date.now() < this.mutedUntil; }

  async send(title, options = {}) {
    if (this.isMuted()) return null;
    const defaults = { icon: '/icons/icon-192x192.png', badge: '/icons/icon-96x96.png', vibrate: [200,100,200], tag: 'arsip-v3', requireInteraction: false, silent: !this.soundEnabled, data: { url: '/' }, duration: 5000 };
    const opts = { ...defaults, ...options };

    if (this.desktopEnabled && this.permission === 'granted') {
      try {
        const n = new Notification(title, opts);
        n.onclick = () => { window.focus(); if (opts.data.url) window.location.href = opts.data.url; n.close(); if (opts.id) this.markAsRead(opts.id); };
        return n;
      } catch(e) {}
    }

    if (this.swRegistration) {
      try { await this.swRegistration.showNotification(title, opts); } catch(e) {}
    }

    if (this.inAppEnabled) this.showToast(title, opts);
    return null;
  }

  showToast(title, options) {
    const container = document.getElementById('notification-container') || (() => { const c = document.createElement('div'); c.id = 'notification-container'; c.style.cssText = 'position:fixed;top:80px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:8px;'; document.body.appendChild(c); return c; })();
    const colors = { success: { bg:'#E8F5E9', text:'#2E7D32', border:'#4CAF50', icon:'✅' }, error: { bg:'#FFEBEE', text:'#C62828', border:'#F44336', icon:'❌' }, warning: { bg:'#FFF3E0', text:'#E65100', border:'#FF9800', icon:'⚠️' }, info: { bg:'#E3F2FD', text:'#1565C0', border:'#2196F3', icon:'ℹ️' } };
    const c = colors[options.type] || colors.info;
    const el = document.createElement('div');
    el.style.cssText = `background:${c.bg};color:${c.text};border-left:4px solid ${c.border};padding:14px 18px;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,0.15);display:flex;align-items:flex-start;gap:12px;min-width:320px;max-width:450px;font-size:14px;animation:slideInRight 0.3s;cursor:pointer;`;
    el.innerHTML = `<span style="font-size:20px;">${c.icon}</span><div style="flex:1;"><strong>${title}</strong><br><span style="font-size:12px;opacity:0.8;">${options.body||''}</span></div><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:inherit;font-size:18px;opacity:0.6;padding:0;">×</button>`;
    el.onclick = (e) => { if (e.target.tagName !== 'BUTTON') { if (options.data?.url) window.location.href = options.data.url; el.remove(); } };
    container.appendChild(el);
    if (options.duration > 0) setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(100%)'; setTimeout(()=>el.remove(),300); }, options.duration);
  }

  async subscribeToPush() {
    if (!this.swRegistration) return null;
    try {
      const sub = await this.swRegistration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this.urlB64ToU8('BEl62iXVY6h4q3q8v3qY5q3q8v3qY5q3q8v3qY5q3q8v3qY5q3q8v3qY5q3q8') });
      try { await APP.api.post('notifications.subscribe', { endpoint: sub.endpoint, keys: sub.toJSON().keys }); } catch(e) {}
      return sub;
    } catch(e) { return null; }
  }

  async unsubscribeFromPush() {
    if (!this.swRegistration) return;
    const sub = await this.swRegistration.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
  }

  async isPushSubscribed() {
    if (!this.swRegistration) return false;
    return !!(await this.swRegistration.pushManager.getSubscription());
  }

  handlePush(payload) { if (!this.isMuted()) this.send(payload.title, { body: payload.body, type: payload.type, data: { url: payload.url } }); }

  startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(async () => {
      if (!APP.isAuthenticated || this.isMuted()) return;
      try {
        const r = await APP.api.get('notifikasi.unreadCount');
        this.updateBadge(r.data?.count || 0);
      } catch(e) {}
    }, 30000);
  }

  updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) { badge.textContent = count > 99 ? '99+' : count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    document.title = count > 0 ? `(${count}) ${APP.config?.appName || 'Arsip Surat Digital'}` : (APP.config?.appName || 'Arsip Surat Digital');
  }

  async markAsRead(id) { if (!id) return; try { await APP.api.put('notifikasi.read', {}, { params: { id } }); } catch(e) {} }
  async markAllAsRead() { try { await APP.api.put('notifikasi.readAll'); this.updateBadge(0); } catch(e) {} }

  mute(ms = 3600000) { this.mutedUntil = Date.now() + ms; this.saveSetting('mutedUntil', this.mutedUntil); }
  unmute() { this.mutedUntil = 0; this.saveSetting('mutedUntil', 0); }

  getSettings() { return { permission: this.permission, sound: this.soundEnabled, desktop: this.desktopEnabled, inApp: this.inAppEnabled, muted: this.isMuted(), pushSupported: 'PushManager' in window }; }
  updateSettings(s) { if (s.sound !== undefined) { this.soundEnabled = s.sound; this.saveSetting('sound', s.sound); } if (s.desktop !== undefined) { this.desktopEnabled = s.desktop; this.saveSetting('desktop', s.desktop); } if (s.inApp !== undefined) { this.inAppEnabled = s.inApp; this.saveSetting('inApp', s.inApp); } }

  urlB64ToU8(b) { const p = '='.repeat((4-b.length%4)%4); const base64 = (b+p).replace(/-/g,'+').replace(/_/g,'/'); const raw = window.atob(base64); const arr = new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i); return arr; }
}

const notificationManager = new NotificationManager();
window.notificationManager = notificationManager;
const ns = document.createElement('style'); ns.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}'; document.head.appendChild(ns);
console.log('✅ notifications.js v3.1.0 GRAND MASTER FINAL loaded');