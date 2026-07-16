/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Real-Time Notification System (WebSocket + Polling)
 * ============================================================
 */

const EnterpriseRealtime = (() => {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        // Polling interval (fallback when WebSocket unavailable)
        pollingInterval: 10000, // 10 seconds
        // WebSocket URL (if available)
        wsUrl: null,
        // Enable auto-reconnect
        autoReconnect: true,
        maxReconnectAttempts: 10,
        reconnectDelay: 3000,
        // Notification types
        types: {
            SURAT_MASUK: 'surat_masuk',
            SURAT_KELUAR: 'surat_keluar',
            DISPOSISI: 'disposisi',
            REMINDER: 'reminder',
            SYSTEM: 'system',
            ERROR: 'error',
        },
    };

    // ==================== NOTIFICATION CLASS ====================
    class Notification {
        constructor(data) {
            this.id = data.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.type = data.type || 'info';
            this.title = data.title || '';
            this.message = data.message || '';
            this.icon = data.icon || this.getDefaultIcon();
            this.timestamp = data.timestamp || new Date().toISOString();
            this.read = data.read || false;
            this.actionUrl = data.actionUrl || null;
            this.actionText = data.actionText || 'Lihat';
            this.priority = data.priority || 'normal'; // low, normal, high, urgent
            this.source = data.source || 'system';
            this.metadata = data.metadata || {};
            this.expiresAt = data.expiresAt || null;
        }

        getDefaultIcon() {
            const icons = {
                surat_masuk: '📥',
                surat_keluar: '📤',
                disposisi: '📋',
                reminder: '⏰',
                system: '⚙️',
                error: '❌',
                success: '✅',
                warning: '⚠️',
                info: 'ℹ️',
            };
            return icons[this.type] || icons.info;
        }

        toJSON() {
            return {
                id: this.id,
                type: this.type,
                title: this.title,
                message: this.message,
                icon: this.icon,
                timestamp: this.timestamp,
                read: this.read,
                actionUrl: this.actionUrl,
                actionText: this.actionText,
                priority: this.priority,
                source: this.source,
                metadata: this.metadata,
                expiresAt: this.expiresAt,
            };
        }
    }

    // ==================== NOTIFICATION STORE ====================
    class NotificationStore {
        constructor() {
            this.notifications = [];
            this.unreadCount = 0;
            this.listeners = [];
            this.maxNotifications = 100;
            this.loadFromStorage();
        }

        loadFromStorage() {
            try {
                const saved = localStorage.getItem('enterprise_notifications');
                if (saved) {
                    const data = JSON.parse(saved);
                    this.notifications = data.notifications || [];
                    this.unreadCount = data.unreadCount || 0;
                }
            } catch (error) {
                console.warn('Failed to load notifications:', error);
            }
        }

        saveToStorage() {
            try {
                localStorage.setItem('enterprise_notifications', JSON.stringify({
                    notifications: this.notifications.slice(0, this.maxNotifications),
                    unreadCount: this.unreadCount,
                }));
            } catch (error) {
                console.warn('Failed to save notifications:', error);
            }
        }

        add(notification) {
            this.notifications.unshift(notification);
            
            if (!notification.read) {
                this.unreadCount++;
            }

            // Trim old notifications
            if (this.notifications.length > this.maxNotifications) {
                const removed = this.notifications.splice(this.maxNotifications);
                const unreadRemoved = removed.filter(n => !n.read).length;
                this.unreadCount -= unreadRemoved;
            }

            this.saveToStorage();
            this.notifyListeners('add', notification);
        }

        markAsRead(notificationId) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification && !notification.read) {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.saveToStorage();
                this.notifyListeners('read', notification);
            }
        }

        markAllAsRead() {
            this.notifications.forEach(n => { n.read = true; });
            this.unreadCount = 0;
            this.saveToStorage();
            this.notifyListeners('readAll');
        }

        remove(notificationId) {
            const index = this.notifications.findIndex(n => n.id === notificationId);
            if (index > -1) {
                const removed = this.notifications.splice(index, 1)[0];
                if (!removed.read) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
                this.saveToStorage();
                this.notifyListeners('remove', removed);
            }
        }

        clearAll() {
            this.notifications = [];
            this.unreadCount = 0;
            this.saveToStorage();
            this.notifyListeners('clear');
        }

        getUnread() {
            return this.notifications.filter(n => !n.read);
        }

        getAll() {
            return this.notifications;
        }

        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        }

        notifyListeners(event, data) {
            this.listeners.forEach(listener => {
                try {
                    listener(event, data);
                } catch (error) {
                    console.error('Notification listener error:', error);
                }
            });
        }
    }

    // ==================== POLLING SERVICE ====================
    class PollingService {
        constructor(store) {
            this.store = store;
            this.intervalId = null;
            this.lastCheck = null;
        }

        start() {
            if (this.intervalId) return;
            
            console.log('🔄 Starting notification polling...');
            
            this.intervalId = setInterval(() => {
                this.checkForUpdates();
            }, CONFIG.pollingInterval);

            // Initial check
            this.checkForUpdates();
        }

        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        }

        async checkForUpdates() {
            try {
                const params = {
                    action: 'notifications/check',
                    lastCheck: this.lastCheck,
                };

                const response = await window.GASAPI?.call('notifications/check', params);

                if (response?.success && response.data?.length > 0) {
                    response.data.forEach(notifData => {
                        const notification = new Notification(notifData);
                        this.store.add(notification);
                        
                        // Show browser notification if permitted
                        this.showBrowserNotification(notification);
                        
                        // Show toast
                        if (window.EnterpriseCore?.notifications) {
                            window.EnterpriseCore.notifications.show(
                                notification.message,
                                notification.type,
                                8000
                            );
                        }
                    });
                }

                this.lastCheck = new Date().toISOString();
            } catch (error) {
                console.warn('Failed to check notifications:', error);
            }
        }

        showBrowserNotification(notification) {
            if (!('Notification' in window)) return;
            if (Notification.permission !== 'granted') return;
            if (document.visibilityState === 'visible') return;

            try {
                const browserNotif = new Notification(notification.title, {
                    body: notification.message,
                    icon: '/src/public/img/icon-192x192.png',
                    badge: '/src/public/img/badge-72x72.png',
                    tag: notification.id,
                    data: { url: notification.actionUrl || '/dashboard.html' },
                });

                browserNotif.onclick = () => {
                    window.focus();
                    if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                    }
                    browserNotif.close();
                };
            } catch (error) {
                console.warn('Failed to show browser notification:', error);
            }
        }
    }

    // ==================== NOTIFICATION UI ====================
    class NotificationUI {
        constructor(store) {
            this.store = store;
            this.container = null;
            this.badge = null;
            this.panel = null;
            this.isOpen = false;
        }

        init() {
            this.createBadge();
            this.createPanel();
            this.store.subscribe(() => this.updateBadge());
        }

        createBadge() {
            // Create notification bell in header
            const header = document.querySelector('.header-right');
            if (!header) return;

            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.style.cssText = 'position: relative; cursor: pointer;';

            this.container.innerHTML = `
                <button class="header-btn notification-bell" onclick="EnterpriseRealtime.ui.toggle()">
                    🔔
                </button>
                <span class="notification-badge" style="
                    display: none;
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #ef4444;
                    color: white;
                    font-size: 10px;
                    font-weight: 700;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">0</span>
            `;

            this.badge = this.container.querySelector('.notification-badge');
            header.prepend(this.container);
            this.updateBadge();
        }

        createPanel() {
            this.panel = document.createElement('div');
            this.panel.className = 'notification-panel';
            this.panel.style.cssText = `
                display: none;
                position: absolute;
                top: 60px;
                right: 20px;
                width: 380px;
                max-height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                z-index: 1000;
                overflow: hidden;
                border: 1px solid #e5e7eb;
            `;

            this.panel.innerHTML = `
                <div style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="font-size: 16px; font-weight: 700;">Notifikasi</h3>
                    <button onclick="EnterpriseRealtime.store.markAllAsRead()" style="font-size: 12px; color: #1a56db; background: none; border: none; cursor: pointer;">
                        Tandai semua dibaca
                    </button>
                </div>
                <div class="notification-list" style="max-height: 400px; overflow-y: auto;">
                    <div style="padding: 40px; text-align: center; color: #9ca3af;">
                        Tidak ada notifikasi
                    </div>
                </div>
            `;

            document.body.appendChild(this.panel);

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.container.contains(e.target) && !this.panel.contains(e.target)) {
                    this.close();
                }
            });
        }

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            this.isOpen = true;
            this.panel.style.display = 'block';
            this.renderNotifications();
        }

        close() {
            this.isOpen = false;
            this.panel.style.display = 'none';
        }

        renderNotifications() {
            const list = this.panel.querySelector('.notification-list');
            const notifications = this.store.getAll();

            if (notifications.length === 0) {
                list.innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #9ca3af;">
                        🎉 Tidak ada notifikasi
                    </div>
                `;
                return;
            }

            list.innerHTML = notifications.slice(0, 20).map(notif => `
                <div class="notification-item ${notif.read ? '' : 'unread'}" 
                     style="padding: 16px 20px; border-bottom: 1px solid #f3f4f6; cursor: pointer; 
                            ${notif.read ? '' : 'background: #eff6ff;'} transition: background 0.2s;"
                     onclick="EnterpriseRealtime.ui.handleClick('${notif.id}', '${notif.actionUrl || ''}')">
                    <div style="display: flex; gap: 12px;">
                        <span style="font-size: 24px;">${notif.icon}</span>
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <strong style="font-size: 13px;">${notif.title}</strong>
                                <span style="font-size: 11px; color: #9ca3af;">${this.formatTime(notif.timestamp)}</span>
                            </div>
                            <p style="font-size: 12px; color: #6b7280; margin: 0;">${notif.message}</p>
                            ${notif.actionUrl ? `
                                <a href="${notif.actionUrl}" style="font-size: 11px; color: #1a56db; margin-top: 4px; display: inline-block;">
                                    ${notif.actionText} →
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        handleClick(notifId, actionUrl) {
            this.store.markAsRead(notifId);
            if (actionUrl) {
                window.location.href = actionUrl;
            }
            this.renderNotifications();
        }

        updateBadge() {
            if (!this.badge) return;
            const count = this.store.unreadCount;
            
            if (count > 0) {
                this.badge.style.display = 'flex';
                this.badge.textContent = count > 99 ? '99+' : count;
            } else {
                this.badge.style.display = 'none';
            }
        }

        formatTime(timestamp) {
            const now = new Date();
            const time = new Date(timestamp);
            const diffMs = now - time;
            const diffMin = Math.floor(diffMs / 60000);
            
            if (diffMin < 1) return 'Baru saja';
            if (diffMin < 60) return `${diffMin} menit`;
            if (diffMin < 1440) return `${Math.floor(diffMin / 60)} jam`;
            if (diffMin < 10080) return `${Math.floor(diffMin / 1440)} hari`;
            return time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }

        destroy() {
            if (this.container) this.container.remove();
            if (this.panel) this.panel.remove();
        }
    }

    // ==================== INITIALIZE ====================
    const store = new NotificationStore();
    const polling = new PollingService(store);
    const ui = new NotificationUI(store);

    // Start services
    polling.start();

    // Initialize UI when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ui.init());
    } else {
        ui.init();
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // ==================== PUBLIC API ====================
    return {
        store,
        polling,
        ui,
        
        // Send notification programmatically
        notify: (type, title, message, options = {}) => {
            const notification = new Notification({
                type,
                title,
                message,
                ...options,
            });
            store.add(notification);
            return notification;
        },

        // Convenience methods
        success: (title, message) => {
            return this.notify('success', title, message);
        },
        error: (title, message) => {
            return this.notify('error', title, message);
        },
        warning: (title, message) => {
            return this.notify('warning', title, message);
        },
        info: (title, message) => {
            return this.notify('info', title, message);
        },

        // Get unread count
        getUnreadCount: () => store.unreadCount,

        // Clear all
        clearAll: () => store.clearAll(),
    };
})();

window.EnterpriseRealtime = EnterpriseRealtime;
