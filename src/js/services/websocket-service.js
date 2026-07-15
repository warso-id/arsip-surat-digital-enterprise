/**
 * ============================================
 * WEBSOCKET SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * FULL REAL-TIME CONNECTION - SIAP PRODUKSI
 * Mendukung: WebSocket, Polling Fallback, SSE,
 * Auto-Reconnect, Authentication, Heartbeat
 * Terintegrasi dengan Spreadsheet & code.gs
 * ============================================
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 15;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.listeners = {};
    this.pollingInterval = null;
    this.pollingActive = false;
    this.pollingDelay = 15000;
    this.lastPollTimestamp = null;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = 30000;
    this.lastHeartbeat = null;
    this.messageQueue = [];
    this.maxQueueSize = 100;
    this.useSSE = false;
    this.eventSource = null;
    this.connectionType = 'none'; // websocket | sse | polling | none
  }

  /**
   * Initialize WebSocket service
   */
  init() {
    // Build URL
    this.url = this.buildWebSocketUrl();

    // Try WebSocket first
    if ('WebSocket' in window) {
      this.connect();
    }
    // Try Server-Sent Events
    else if (typeof EventSource !== 'undefined' && this.isSSEAvailable()) {
      this.connectSSE();
    }
    // Fallback to polling
    else {
      console.warn('WebSocket & SSE not supported, using polling');
      this.startPolling();
    }

    // Setup page visibility handling
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.onPageVisible();
      } else {
        this.onPageHidden();
      }
    });

    // Online/Offline handling
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    console.log('✅ WebSocket Service initialized');
  }

  /**
   * Build WebSocket URL
   */
  buildWebSocketUrl() {
    // Google Apps Script doesn't support WebSocket natively
    // Use relay server URL from config or construct from host
    if (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.WS_URL) {
      return APP_CONFIG.WS_URL;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.WS_HOST) || window.location.host;
    const path = '/ws';

    return `${protocol}//${host}${path}`;
  }

  /**
   * Check if SSE is available (Google Apps Script doesn't support it directly)
   */
  isSSEAvailable() {
    // Apps Script deployment URL pattern
    const apiUrl = (typeof APP_CONFIG !== 'undefined') ? (APP_CONFIG.API_URL || APP_CONFIG.API_BASE_URL || '') : '';
    return apiUrl.includes('script.google.com') === false; // SSE not supported on Apps Script
  }

  /**
   * Connect via WebSocket
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.cleanupWebSocket();

    try {
      this.ws = new WebSocket(this.url);
      this.connectionType = 'websocket';

      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected', type: 'websocket' });

        // Authenticate
        this.authenticate();

        // Start heartbeat
        this.startHeartbeat();

        // Flush message queue
        this.flushQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.lastHeartbeat = Date.now();
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.isAuthenticated = false;
        this.stopHeartbeat();
        this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });

        // Reconnect unless intentional close
        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error');
        this.isConnected = false;

        // Fallback to polling
        if (!this.pollingActive) {
          console.log('Falling back to polling');
          this.startPolling();
        }
      };

    } catch (error) {
      console.error('WebSocket creation failed:', error);
      if (!this.pollingActive) this.startPolling();
    }
  }

  /**
   * Connect via Server-Sent Events
   */
  connectSSE() {
    this.cleanupSSE();

    try {
      const sseUrl = this.url.replace(/^ws/, 'http') + '/events';
      this.eventSource = new EventSource(sseUrl);
      this.connectionType = 'sse';

      this.eventSource.onopen = () => {
        console.log('📡 SSE connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected', type: 'sse' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('SSE message parse error:', error);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.emit('connection', { status: 'disconnected', type: 'sse' });

        if (!this.pollingActive) {
          this.startPolling();
        }
      };

    } catch (error) {
      console.error('SSE connection failed:', error);
      if (!this.pollingActive) this.startPolling();
    }
  }

  /**
   * Authenticate connection
   */
  authenticate() {
    const token = this.getAuthToken();
    if (token) {
      this.send({ type: 'auth', token });
    }
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    try {
      if (typeof AuthService !== 'undefined' && AuthService.getToken) {
        return AuthService.getToken();
      }
      return localStorage.getItem('asd_token') || localStorage.getItem('asd_auth_token');
    } catch {
      return null;
    }
  }

  /**
   * Send message through WebSocket
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Queue message for later
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push({ data, timestamp: Date.now() });
      }
    }
  }

  /**
   * Flush queued messages
   */
  flushQueue() {
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      this.send(msg.data);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(data) {
    const { type, payload } = data;

    // Handle heartbeat response
    if (type === 'pong' || type === 'heartbeat') {
      this.lastHeartbeat = Date.now();
      return;
    }

    // Authentication response
    if (type === 'auth:success') {
      this.isAuthenticated = true;
      console.log('✅ WebSocket authenticated');
      return;
    }

    // Route messages
    switch (type) {
      case 'notification':
        this.handleNotification(payload);
        break;
      case 'surat:create':
      case 'surat:update':
      case 'surat:delete':
        this.handleSuratUpdate(type, payload);
        break;
      case 'disposisi:create':
      case 'disposisi:update':
      case 'disposisi:status':
        this.handleDisposisiUpdate(type, payload);
        break;
      case 'approval:create':
      case 'approval:update':
      case 'approval:decision':
        this.handleApprovalUpdate(type, payload);
        break;
      case 'user:update':
        this.handleUserUpdate(payload);
        break;
      case 'system:alert':
      case 'system:maintenance':
      case 'system:update':
        this.handleSystemAlert(type, payload);
        break;
      case 'data:refresh':
        this.handleDataRefresh(payload);
        break;
      default:
        this.emit(type, payload);
        this.emit('message', data);
    }
  }

  /**
   * Handle notification
   */
  handleNotification(payload) {
    // Update unread count in store
    if (typeof store !== 'undefined') {
      const current = store.getState('data.notifications.unreadCount') || 0;
      store.dispatch('data.notifications.unreadCount', current + 1);
    }

    // Show browser notification
    if (typeof NotificationService !== 'undefined' && NotificationService.browserNotify) {
      NotificationService.browserNotify(payload.title || 'Notifikasi', payload.message || '');
    }

    // Show in-app toast
    if (typeof NotificationService !== 'undefined') {
      NotificationService.show(
        payload.title || 'Notifikasi Baru',
        payload.level || 'info',
        { duration: 5000 }
      );
    }

    this.emit('notification', payload);
  }

  /**
   * Handle surat update
   */
  handleSuratUpdate(type, payload) {
    // Refresh current page if on surat pages
    if (typeof router !== 'undefined') {
      const currentRoute = typeof store !== 'undefined' ? store.getState('ui.currentRoute') : null;
      if (currentRoute?.path?.includes('surat-masuk') || currentRoute?.path?.includes('surat-keluar')) {
        router.reload();
      }
    }

    if (typeof Toast !== 'undefined') {
      const labels = {
        'surat:create': '📥 Surat baru dibuat',
        'surat:update': '📝 Surat diperbarui',
        'surat:delete': '🗑️ Surat dihapus'
      };
      Toast.show(labels[type] || 'Update surat', 'info', 3000);
    }

    this.emit(type, payload);
    this.emit('surat:update', { type, ...payload });
  }

  /**
   * Handle disposisi update
   */
  handleDisposisiUpdate(type, payload) {
    if (typeof Toast !== 'undefined') {
      const status = payload.status || '';
      Toast.show(`➡️ Disposisi ${status}: ${(payload.instruksi || '').substring(0, 40)}...`, 'info', 4000);
    }

    this.emit(type, payload);
    this.emit('disposisi:update', { type, ...payload });
  }

  /**
   * Handle approval update
   */
  handleApprovalUpdate(type, payload) {
    const status = payload.status || payload.decision || '';
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';

    if (typeof Toast !== 'undefined') {
      Toast.show(
        `✅ Approval: ${status} - ${(payload.komentar || '').substring(0, 40)}`,
        isApproved ? 'success' : isRejected ? 'error' : 'info',
        4000
      );
    }

    // Refresh approval page
    if (typeof router !== 'undefined') {
      const currentRoute = typeof store !== 'undefined' ? store.getState('ui.currentRoute') : null;
      if (currentRoute?.path?.includes('approval')) {
        router.reload();
      }
    }

    this.emit(type, payload);
    this.emit('approval:update', { type, ...payload });
  }

  /**
   * Handle user update
   */
  handleUserUpdate(payload) {
    // If current user was updated, refresh their data
    if (typeof AuthService !== 'undefined' && AuthService.getUser) {
      const currentUser = AuthService.getUser();
      if (currentUser?.id === payload.userId) {
        // Refresh user data
        if (typeof api !== 'undefined') {
          api.get('me').then(response => {
            if (response?.status === 'success' && response.data?.user) {
              AuthService.setUser(response.data.user);
            }
          }).catch(() => {});
        }
      }
    }
    this.emit('user:update', payload);
  }

  /**
   * Handle system alert
   */
  handleSystemAlert(type, payload) {
    const level = payload.level || 'warning';

    if (typeof NotificationService !== 'undefined') {
      NotificationService.show(
        payload.message || 'Notifikasi Sistem',
        level,
        { duration: payload.duration || 10000 }
      );
    }

    // Handle maintenance mode
    if (type === 'system:maintenance') {
      if (typeof store !== 'undefined') {
        store.dispatch('app.maintenance', payload.active !== false);
      }
      if (payload.active && typeof router !== 'undefined') {
        router.navigate('/maintenance');
      }
    }

    // Handle update notification
    if (type === 'system:update') {
      this.emit('update:available', payload);
    }

    this.emit(type, payload);
    this.emit('system:alert', { type, ...payload });
  }

  /**
   * Handle data refresh request
   */
  handleDataRefresh(payload) {
    const { target } = payload || {};
    if (target === 'all' || target === 'dashboard') {
      if (typeof api !== 'undefined') {
        api.get('dashboard.stats').then(stats => {
          if (stats?.status === 'success' && typeof store !== 'undefined') {
            store.dispatch('data.dashboard.stats', stats.data);
          }
        }).catch(() => {});
      }
    }
    if (target === 'all' && typeof router !== 'undefined') {
      router.reload();
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      if (!this.pollingActive) this.startPolling();
      return;
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.connectionType === 'sse') this.connectSSE();
      else this.connect();
    }, delay);
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }

      // Check if heartbeat missed
      if (this.lastHeartbeat && Date.now() - this.lastHeartbeat > this.heartbeatTimeout * 2) {
        console.warn('Heartbeat timeout, reconnecting...');
        this.ws?.close();
        this.connect();
      }
    }, this.heartbeatTimeout);
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start polling fallback
   */
  startPolling() {
    if (this.pollingActive) return;
    this.pollingActive = true;
    this.connectionType = 'polling';

    console.log(`📡 Starting polling (every ${this.pollingDelay / 1000}s)`);

    this.poll(); // Initial poll
    this.pollingInterval = setInterval(() => this.poll(), this.pollingDelay);
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.pollingActive = false;
  }

  /**
   * Poll for updates
   */
  async poll() {
    if (!navigator.onLine) return;

    try {
      // Check notifications
      if (typeof api !== 'undefined') {
        const unread = await api.get('notifikasi.unreadCount');
        if (unread?.status === 'success' && typeof store !== 'undefined') {
          const current = store.getState('data.notifications.unreadCount') || 0;
          if (unread.data?.count > current) {
            store.dispatch('data.notifications.unreadCount', unread.data.count);
          }
        }

        // Check system health
        const health = await api.get('system.health');
        if (health?.status === 'success' && !health.data?.healthy) {
          this.emit('system:alert', { level: 'warning', message: 'Sistem mengalami gangguan' });
        }
      }

      this.lastPollTimestamp = Date.now();
      this.emit('poll:success', { timestamp: this.lastPollTimestamp });

    } catch (error) {
      this.emit('poll:error', { error: error.message });
    }
  }

  /**
   * Page visibility handlers
   */
  onPageVisible() {
    if (!this.isConnected && navigator.onLine) {
      if (this.connectionType === 'sse') this.connectSSE();
      else this.connect();
    }
    if (!this.pollingActive && !this.isConnected) {
      this.startPolling();
    }
  }

  onPageHidden() {
    // Reduce polling frequency when hidden
    if (this.pollingActive) {
      this.stopPolling();
      this.pollingDelay = 60000; // 1 minute when hidden
      this.startPolling();
    }
  }

  /**
   * Online/Offline handlers
   */
  onOnline() {
    console.log('🌐 Online - Reconnecting...');
    this.reconnectAttempts = 0;
    if (this.connectionType === 'sse') this.connectSSE();
    else this.connect();
    this.stopPolling();
  }

  onOffline() {
    console.log('📡 Offline');
    this.isConnected = false;
    this.emit('connection', { status: 'offline' });
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    (this.listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (error) {
        console.error(`Listener error (${event}):`, error);
      }
    });
  }

  /**
   * Cleanup WebSocket
   */
  cleanupWebSocket() {
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }

  /**
   * Cleanup SSE
   */
  cleanupSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.cleanupWebSocket();
    this.cleanupSSE();
    this.stopPolling();
    this.stopHeartbeat();
    this.isConnected = false;
    this.isAuthenticated = false;
    this.connectionType = 'none';
    this.messageQueue = [];
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.isAuthenticated,
      type: this.connectionType,
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      lastPollTimestamp: this.lastPollTimestamp,
      queueSize: this.messageQueue.length
    };
  }

  /**
   * Destroy service
   */
  destroy() {
    this.disconnect();
    this.listeners = {};
  }
}

// Singleton instance
const WebSocketService = new WebSocketService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebSocketService };
}
