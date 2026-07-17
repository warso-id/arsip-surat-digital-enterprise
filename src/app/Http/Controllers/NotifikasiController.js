// NotifikasiController.js - Sistem Notifikasi Controller
class NotifikasiController {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec';
        this.token = localStorage.getItem('auth_token');
        this.pollingInterval = null;
        this.unreadCount = 0;
    }

    async getNotifications(page = 1, limit = 20, filters = {}) {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_index',
                user_id: this.getUserId(),
                page: page,
                limit: limit,
                filters: filters,
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Get notifications error:', error);
            return { success: false, data: [], total: 0 };
        }
    }

    async getUnreadCount() {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_unread_count',
                user_id: this.getUserId(),
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);
            
            if (data.success) {
                this.unreadCount = data.count || 0;
                this.updateBadge();
            }

            return data;

        } catch (error) {
            console.error('Unread count error:', error);
            return { success: false, count: 0 };
        }
    }

    async markAsRead(notificationId) {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_mark_read',
                id: notificationId,
                user_id: this.getUserId(),
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                await this.getUnreadCount();
            }

            return data;

        } catch (error) {
            console.error('Mark as read error:', error);
            return { success: false };
        }
    }

    async markAllAsRead() {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_mark_all_read',
                user_id: this.getUserId(),
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.unreadCount = 0;
                this.updateBadge();
            }

            return data;

        } catch (error) {
            console.error('Mark all read error:', error);
            return { success: false };
        }
    }

    async deleteNotification(id) {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_delete',
                id: id,
                user_id: this.getUserId(),
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            return this.decodeData(result.data);

        } catch (error) {
            console.error('Delete notification error:', error);
            return { success: false };
        }
    }

    async clearAllNotifications() {
        try {
            const payload = this.encodeData({
                action: 'notifikasi_clear_all',
                user_id: this.getUserId(),
                token: this.token
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();
            const data = this.decodeData(result.data);

            if (data.success) {
                this.unreadCount = 0;
                this.updateBadge();
            }

            return data;

        } catch (error) {
            console.error('Clear all error:', error);
            return { success: false };
        }
    }

    startPolling(intervalMs = 30000) {
        this.stopPolling();
        this.pollingInterval = setInterval(async () => {
            await this.getUnreadCount();
        }, intervalMs);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    renderNotification(notification) {
        const icons = {
            'disposisi': '📋',
            'surat_masuk': '📥',
            'surat_keluar': '📤',
            'system': 'ℹ️',
            'warning': '⚠️',
            'success': '✅'
        };

        return `
            <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" 
                 data-id="${notification.id}"
                 onclick="window.notifikasiController.handleNotificationClick(${notification.id}, '${notification.link || ''}')">
                <div class="notification-icon">
                    ${icons[notification.type] || '📌'}
                </div>
                <div class="notification-content">
                    <p class="notification-title">${notification.title}</p>
                    <p class="notification-message">${notification.message}</p>
                    <small class="notification-time">${this.formatTime(notification.created_at)}</small>
                </div>
                ${!notification.is_read ? '<div class="unread-dot"></div>' : ''}
                <button class="notification-delete" onclick="event.stopPropagation(); window.notifikasiController.deleteNotification(${notification.id})">
                    ✕
                </button>
            </div>
        `;
    }

    async handleNotificationClick(id, link) {
        await this.markAsRead(id);
        if (link) {
            window.location.href = link;
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Baru saja';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
        
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    showBrowserNotification(title, body, icon = '/src/public/images/logo.png') {
        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                badge: icon
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    getUserId() {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        return user.id || 0;
    }

    encodeData(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    }

    decodeData(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (error) {
            return {};
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotifikasiController;
}
