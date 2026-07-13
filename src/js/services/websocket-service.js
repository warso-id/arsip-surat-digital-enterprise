/**
 * WEBSOCKET SERVICE - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Real-time updates using WebSocket (with polling fallback)
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.isConnected = false;
    this.listeners = {};
    this.pollingInterval = null;
    this.pollingFallback = true;
    this.pollingDelay = 15000; // 15 seconds
    this.lastPollTimestamp = null;
  }
  
  /**
   * Initialize WebSocket service
   */
  init() {
    // Build WebSocket URL
    this.url = this.buildWebSocketUrl();
    
    // Try WebSocket connection
    if ('WebSocket' in window) {
      this.connect();
    } else {
      console.warn('WebSocket not supported, using polling fallback');
      this.startPolling();
    }
    
    console.log('✅ WebSocket Service initialized');
  }
  
  /**
   * Build WebSocket URL
   */
  buildWebSocketUrl() {
    // Google Apps Script doesn't support WebSocket natively
    // Use a relay server or fallback to polling
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = APP_CONFIG.WS_HOST || window.location.host;
    return `${protocol}//${host}/ws`;
  }
  
  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
        
        // Authenticate
        this.authenticate();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.emit('connection', { status: 'disconnected' });
        
        // Reconnect
        this.scheduleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        
        // Fallback to polling
        if (this.pollingFallback && !this.pollingInterval) {
          console.log('Falling back to polling');
          this.startPolling();
        }
      };
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      
      // Fallback to polling
      if (this.pollingFallback && !this.pollingInterval) {
        this.startPolling();
      }
    }
  }
  
  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      this.startPolling();
      return;
    }
    
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    this.reconnectAttempts++;
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * Authenticate WebSocket connection
   */
  authenticate() {
    const token = AuthService.getToken();
    if (token) {
      this.send({ type: 'auth', token });
    }
  }
  
  /**
   * Send message
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  /**
   * Handle incoming message
   */
  handleMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'auth:success':
        console.log('WebSocket authenticated');
        break;
        
      case 'notification':
        this.handleNotification(payload);
        break;
        
      case 'surat:update':
        this.handleSuratUpdate(payload);
        break;
        
      case 'disposisi:update':
        this.handleDisposisiUpdate(payload);
        break;
        
      case 'approval:update':
        this.handleApprovalUpdate(payload);
        break;
        
      case 'system:alert':
        this.handleSystemAlert(payload);
        break;
        
      default:
        this.emit(type, payload);
    }
  }
  
  /**
   * Handle notification
   */
  handleNotification(payload) {
    store.dispatch('data.notifications.unreadCount', 
      (store.getState('data.notifications.unreadCount') || 0) + 1
    );
    
    // Show browser notification if permitted
    NotificationService.browserNotify(payload.title, payload.message);
    
    this.emit('notification', payload);
  }
  
  /**
   * Handle surat update
   */
  handleSuratUpdate(payload) {
    const currentRoute = store.getState('ui.currentRoute');
    
    // Refresh list if on relevant page
    if (currentRoute?.path?.includes('surat-masuk') || currentRoute?.path?.includes('surat-keluar')) {
      router.reload();
    }
    
    this.emit('surat:update', payload);
  }
  
  /**
   * Handle disposisi update
   */
  handleDisposisiUpdate(payload) {
    NotificationService.show(
      `Disposisi ${payload.status}: ${payload.instruksi?.substring(0, 50)}...`,
      'info'
    );
    
    this.emit('disposisi:update', payload);
  }
  
  /**
   * Handle approval update
   */
  handleApprovalUpdate(payload) {
    NotificationService.show(
      `Approval ${payload.status}: ${payload.komentar || ''}`,
      payload.status === 'approved' ? 'success' : 'warning'
    );
    
    this.emit('approval:update', payload);
  }
  
  /**
   * Handle system alert
   */
  handleSystemAlert(payload) {
    NotificationService.show(payload.message, payload.level || 'warning', {
      duration: payload.duration || 10000
    });
    
    if (payload.action === 'maintenance') {
      store.dispatch('app.maintenance', true);
    }
    
    this.emit('system:alert', payload);
  }
  
  /**
   * Subscribe to event
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
  
  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket listener error (${event}):`, error);
        }
      });
    }
  }
  
  /**
   * Start polling (fallback)
   */
  startPolling() {
    if (this.pollingInterval) return;
    
    console.log('Starting polling...');
    
    this.pollingInterval = setInterval(async () => {
      try {
        await this.poll();
      } catch (error) {
        console.warn('Polling failed:', error);
      }
    }, this.pollingDelay);
  }
  
  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  
  /**
   * Poll for updates
   */
  async poll() {
    if (!navigator.onLine) return;
    if (!AuthService.isAuthenticated()) return;
    
    try {
      // Check notifications
      const unread = await api.getUnreadCount();
      if (unread.status === 'success') {
        const currentCount = store.getState('data.notifications.unreadCount') || 0;
        if (unread.data.count > currentCount) {
          store.dispatch('data.notifications.unreadCount', unread.data.count);
        }
      }
      
      // Check system status
      const status = await api.getSystemHealth();
      if (status.status === 'success' && !status.data.healthy) {
        this.emit('system:alert', {
          level: 'warning',
          message: 'Sistem mengalami gangguan'
        });
      }
      
      this.lastPollTimestamp = Date.now();
      this.emit('poll:success');
      
    } catch (error) {
      this.emit('poll:error', error);
    }
  }
  
  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.stopPolling();
    this.isConnected = false;
  }
  
  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      type: this.ws ? 'websocket' : 'polling',
      reconnectAttempts: this.reconnectAttempts,
      lastPollTimestamp: this.lastPollTimestamp
    };
  }
}

// Singleton instance
const WebSocketService = new WebSocketService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WebSocketService };
}
