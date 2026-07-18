// Enterprise Router - Fix v2026.7.18
class EnterpriseRouter {
    constructor() {
        this.routes = {
            '/': 'tableau de Bord',
            '/dashboard': 'dashboard',
            '/surat': 'surat',
            '/disposisi': 'disposisi',
            '/laporan': 'laporan',
            '/settings': 'settings'
        };
        this.currentRoute = null;
        this.init();
    }

    init() {
        this.handlePopstate();
        this.handleLinkClicks();
        this.handleInitialRoute();
    }

    handlePopstate() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.route) {
                this.handleRoute(e.state.route);
            }
        });
    }

    handleLinkClicks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
                e.preventDefault();
                const path = link.getAttribute('href');
                this.navigate(path);
            }
        });
    }

    handleInitialRoute() {
        const path = window.location.pathname || '/';
        this.handleRoute(path);
    }

    navigate(path) {
        if (path !== this.currentRoute) {
            window.history.pushState({ route: path }, '', path);
            this.handleRoute(path);
        }
    }

    async handleRoute(path) {
        console.log(`Routing to: ${path}`);
        this.currentRoute = path;

        try {
            switch(path) {
                case '/':
                case '/dashboard':
                    await this.dashboardRoute();
                    break;
                case '/surat':
                    await this.suratRoute();
                    break;
                case '/disposisi':
                    await this.disposisiRoute();
                    break;
                case '/laporan':
                    await this.laporanRoute();
                    break;
                case '/settings':
                    await this.settingsRoute();
                    break;
                default:
                    this.showError('Halaman tidak ditemukan', 404);
            }
        } catch (error) {
            console.error('Route error:', error);
            this.showError('Terjadi kesalahan saat memuat halaman', 500);
        }
    }

    async dashboardRoute() {
        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Container not found');
            return;
        }

        // Activate dashboard module if available
        if (window.enterpriseDashboard) {
            await window.enterpriseDashboard.show();
        } else {
            container.innerHTML = `
                <div class="dashboard-container">
                    <h1>Selamat Datang di Sistem Arsip Surat</h1>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total Surat</h3>
                            <p id="total-surat">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Surat Masuk</h3>
                            <p id="surat-masuk">0</p>
                        </div>
                        <div class="stat-card">
                            <h3>Surat Keluar</h3>
                            <p id="surat-keluar">0</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async suratRoute() {
        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Container not found');
            return;
        }

        if (window.enterpriseSurat) {
            await window.enterpriseSurat.show();
        } else {
            container.innerHTML = `<div><h1>Manajemen Surat</h1></div>`;
        }
    }

    async disposisiRoute() {
        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Container not found');
            return;
        }

        if (window.enterpriseDisposisi) {
            await window.enterpriseDisposisi.show();
        } else {
            container.innerHTML = `<div><h1>Disposisi Surat</h1></div>`;
        }
    }

    async laporanRoute() {
        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Container not found');
            return;
        }

        if (window.enterpriseLaporan) {
            await window.enterpriseLaporan.show();
        } else {
            container.innerHTML = `<div><h1>Laporan</h1></div>`;
        }
    }

    async settingsRoute() {
        const container = document.getElementById('main-content');
        if (!container) {
            console.error('Container not found');
            return;
        }
        container.innerHTML = `<div><h1>Pengaturan</h1></div>`;
    }

    showError(message, code) {
        const container = document.getElementById('main-content');
        if (container) {
            container.innerHTML = `
                <div class="error-page">
                    <h1>Error ${code}</h1>
                    <p>${message}</p>
                    <a href="/" class="btn-back">Kembali ke Beranda</a>
                </div>
            `;
        }
    }
}

// Initialize router when DOM is ready
if (document.readyState === 'loading' || document.readyState === 'interactive') {
    document.addEventListener('DOMContentLoaded', () => {
        window.enterpriseRouter = new EnterpriseRouter();
    });
} else {
    window.enterpriseRouter = new EnterpriseRouter();
}
