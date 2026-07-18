// ============================================
// Notification Handler
// ============================================

class NotificationHandler {
    constructor() {
        this.permission = Notification.permission;
        this.init();
    }

    /**
     * Initialize
     */
    init() {
        this.setupClickHandler();
    }

    /**
     * Request permission
     */
    async requestPermission() {
        try {
            if (!('Notification' in window)) {
                console.log('[Notification] Not supported');
                return 'denied';
            }

            const result = await Notification.requestPermission();
            this.permission = result;
            return result;
        } catch (error) {
            console.error('[Notification] Request failed:', error);
            return 'denied';
        }
    }

    /**
     * Show notification
     */
    async show(title, options = {}) {
        try {
            if (this.permission !== 'granted') {
                const permission = await this.requestPermission();
                if (permission !== 'granted') return null;
            }

            const defaultOptions = {
                icon: '/assets/images/icon-192x192.svg',
                badge: '/assets/images/icon-72x72.svg',
                tag: 'arsip-surat',
                requireInteraction: false,
                vibrate: [200, 100, 200]
            };

            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                // Use service worker notification
                return await navigator.serviceWorker.ready.then(registration => {
                    return registration.showNotification(title, {
                        ...defaultOptions,
                        ...options
                    });
                });
            } else {
                // Fallback to regular notification
                const notification = new Notification(title, {
                    ...defaultOptions,
                    ...options
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                    
                    if (options.data?.url) {
                        window.location.href = options.data.url;
                    }
                };

                return notification;
            }
        } catch (error) {
            console.error('[Notification] Show failed:', error);
            return null;
        }
    }

    /**
     * Setup click handler for SW notifications
     */
    setupClickHandler() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICKED') {
                const url = event.data.url;
                if (url) {
                    window.location.href = url;
                }
            }
        });
    }

    /**
     * Show disposisi notification
     */
    async showDisposisiNotification(disposisi) {
        return this.show('Disposisi Baru', {
            body: `Anda menerima disposisi: ${disposisi.instruksi?.substring(0, 100)}...`,
            tag: `disposisi-${disposisi.id}`,
            data: {
                url: `/disposisi/${disposisi.id}`,
                type: 'disposisi',
                id: disposisi.id
            },
            actions: [
                { action: 'open', title: 'Buka' },
                { action: 'close', title: 'Tutup' }
            ]
        });
    }

    /**
     * Show surat notification
     */
    async showSuratNotification(surat, tipe = 'masuk') {
        return this.show(`Surat ${tipe === 'masuk' ? 'Masuk' : 'Keluar'} Baru`, {
            body: `${surat.perihal} dari ${surat.pengirim || surat.tujuan}`,
            tag: `surat-${tipe}-${surat.id}`,
            data: {
                url: `/surat-${tipe}/${surat.id}`,
                type: `surat_${tipe}`,
                id: surat.id
            }
        });
    }

    /**
     * Show reminder notification
     */
    async showReminderNotification(title, body, url) {
        return this.show(title, {
            body: body,
            tag: 'reminder',
            requireInteraction: true,
            data: { url: url },
            actions: [
                { action: 'open', title: 'Buka' },
                { action: 'dismiss', title: 'Nanti' }
            ]
        });
    }

    /**
     * Close all notifications
     */
    async closeAll() {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            const notifications = await registration.getNotifications();
            notifications.forEach(notification => notification.close());
        }
    }
}

// Initialize
const notificationHandler = new NotificationHandler();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationHandler;
}
