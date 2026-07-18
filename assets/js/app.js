// Enterprise App - Fix v2026.7.18
class EnterpriseApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.config = window.ENTERPRISE_CONFIG || {};
    }

    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            console.log('Initializing Enterprise App...');
            
            // Initialize core services
            await this.initCoreServices();
            
            // Load modules
            await this.loadModules();
            
            // Initialize router
            this.initRouter();
            
            this.isInitialized = true;
            console.log('Enterprise App initialized successfully');
            
            // Notify all listeners
            document.dispatchEvent(new CustomEvent('app:ready', { detail: this }));
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showInitError(error);
        }
    }

    async initCoreServices() {
        // Initialize database
        if (window.enterpriseDb) {
            try {
                await window.enterpriseDb.init();
                console.log('Database initialized');
            } catch (error) {
                console.warn('Database initialization failed:', error);
            }
        }

        // Initialize auth
        if (window.enterpriseAuth) {
            try {
                await window.enterpriseAuth.init();
                console.log('Auth initialized');
            } catch (error) {
                console.warn('Auth initialization failed:', error);
            }
        }

        // Process pending sync if available
        if (window.enterpriseDb && typeof window.enterpriseDb.processPendingSync === 'function') {
            try {
                await window.enterpriseDb.processPendingSync();
            } catch (error) {
                console.warn('Pending sync processing failed:', error);
            }
        }
    }

    async loadModules() {
        const moduleNames = ['dashboard', 'surat', 'disposisi', 'laporan'];
        
        for (const name of moduleNames) {
            try {
                const moduleName = `Enterprise${name.charAt(0).toUpperCase() + name.slice(1)}`;
                if (window[moduleName]) {
                    this.modules[name] = new window[moduleName]();
                    if (typeof this.modules[name].init === 'function') {
                        await this.modules[name].init();
                    }
                    console.log(`Module ${name} loaded`);
                }
            } catch (error) {
                console.warn(`Module ${name} loading failed:`, error);
            }
        }
    }

    initRouter() {
        if (!window.enterpriseRouter) {
            if (typeof EnterpriseRouter !== 'undefined') {
                window.enterpriseRouter = new EnterpriseRouter();
                console.log('Router initialized');
            }
        }
    }

    showInitError(error) {
        const container = document.getElementById('app') || document.body;
        if (container) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h2>Gagal memulai aplikasi</h2>
                    <p>${error.message || 'Terjadi kesalahan tak terduga'}</p>
                    <button onclick="window.location.reload()">Muat Ulang</button>
                </div>
            `;
        }
    }

    getModule(name) {
        return this.modules[name] || null;
    }
}

// Create and expose app instance
window.App = EnterpriseApp;

// Initialize app when DOCType is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM loaded, initializing application...');
        const app = new EnterpriseApp();
        window.enterpriseApp = app;
        await app.init();
    } catch (error) {
        console.error('Fatal error during app initialization:', error);
    }
});
