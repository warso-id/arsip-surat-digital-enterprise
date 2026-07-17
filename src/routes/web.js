// web.js - Web Routes Configuration
const WebRoutes = {
    // Base path
    basePath: '/',
    
    // Route definitions
    routes: {
        // Public routes (no auth required)
        public: {
            '/': { view: 'auth/login', title: 'Login', layout: 'auth' },
            '/login': { view: 'auth/login', title: 'Login', layout: 'auth' },
            '/register': { view: 'auth/register', title: 'Registrasi', layout: 'auth' },
            '/forgot-password': { view: 'auth/forgot-password', title: 'Lupa Password', layout: 'auth' },
            '/reset-password': { view: 'auth/reset-password', title: 'Reset Password', layout: 'auth' },
            '/offline': { view: 'offline', title: 'Offline', layout: null }
        },
        
        // Protected routes (auth required)
        protected: {
            '/dashboard': { view: 'dashboard/index', title: 'Dashboard', layout: 'main' },
            '/dashboard/statistik': { view: 'dashboard/statistik', title: 'Statistik', layout: 'main' },
            
            // Surat Masuk
            '/surat-masuk': { view: 'surat-masuk/index', title: 'Surat Masuk', layout: 'main' },
            '/surat-masuk/create': { view: 'surat-masuk/create', title: 'Tambah Surat Masuk', layout: 'main' },
            '/surat-masuk/:id': { view: 'surat-masuk/show', title: 'Detail Surat Masuk', layout: 'main' },
            '/surat-masuk/:id/edit': { view: 'surat-masuk/edit', title: 'Edit Surat Masuk', layout: 'main' },
            '/surat-masuk/:id/disposisi': { view: 'surat-masuk/disposisi', title: 'Disposisi Surat', layout: 'main' },
            
            // Surat Keluar
            '/surat-keluar': { view: 'surat-keluar/index', title: 'Surat Keluar', layout: 'main' },
            '/surat-keluar/create': { view: 'surat-keluar/create', title: 'Tambah Surat Keluar', layout: 'main' },
            '/surat-keluar/:id': { view: 'surat-keluar/show', title: 'Detail Surat Keluar', layout: 'main' },
            '/surat-keluar/:id/edit': { view: 'surat-keluar/edit', title: 'Edit Surat Keluar', layout: 'main' },
            
            // Disposisi
            '/disposisi': { view: 'disposisi/index', title: 'Disposisi', layout: 'main' },
            '/disposisi/:id/tracking': { view: 'disposisi/tracking', title: 'Tracking Disposisi', layout: 'main' },
            
            // Laporan
            '/laporan': { view: 'laporan/index', title: 'Laporan', layout: 'main' },
            '/laporan/surat-masuk': { view: 'laporan/surat-masuk', title: 'Laporan Surat Masuk', layout: 'main' },
            '/laporan/surat-keluar': { view: 'laporan/surat-keluar', title: 'Laporan Surat Keluar', layout: 'main' },
            '/laporan/disposisi': { view: 'laporan/disposisi', title: 'Laporan Disposisi', layout: 'main' },
            
            // Pengguna
            '/pengguna': { view: 'pengguna/index', title: 'Pengguna', layout: 'main' },
            '/pengguna/create': { view: 'pengguna/create', title: 'Tambah Pengguna', layout: 'main' },
            '/pengguna/:id/edit': { view: 'pengguna/edit', title: 'Edit Pengguna', layout: 'main' },
            '/pengguna/profile': { view: 'pengguna/profile', title: 'Profil', layout: 'main' },
            
            // Instansi
            '/instansi': { view: 'instansi/index', title: 'Instansi', layout: 'main' },
            '/instansi/create': { view: 'instansi/create', title: 'Tambah Instansi', layout: 'main' },
            
            // Pengaturan
            '/pengaturan': { view: 'pengaturan/index', title: 'Pengaturan', layout: 'main' }
        },
        
        // Admin only routes
        admin: {
            '/admin': { view: 'admin/dashboard', title: 'Admin Dashboard', layout: 'main' },
            '/admin/pengguna': { view: 'admin/pengguna', title: 'Manajemen Pengguna', layout: 'main' },
            '/admin/settings': { view: 'admin/settings', title: 'Admin Settings', layout: 'main' }
        }
    },
    
    // Navigation menu items
    navigation: [
        { label: 'Dashboard', icon: '📊', route: '/dashboard', section: 'dashboard' },
        { label: 'Surat Masuk', icon: '📥', route: '/surat-masuk', section: 'surat-masuk' },
        { label: 'Surat Keluar', icon: '📤', route: '/surat-keluar', section: 'surat-keluar' },
        { label: 'Disposisi', icon: '📋', route: '/disposisi', section: 'disposisi' },
        { label: 'Laporan', icon: '📈', route: '/laporan', section: 'laporan' },
        { label: 'Pengguna', icon: '👥', route: '/pengguna', section: 'pengguna' },
        { label: 'Instansi', icon: '🏢', route: '/instansi', section: 'instansi' },
        { label: 'Pengaturan', icon: '⚙️', route: '/pengaturan', section: 'pengaturan' }
    ]
};

// Router class for handling navigation
class Router {
    constructor() {
        this.routes = WebRoutes;
        this.currentRoute = null;
        this.params = {};
    }

    // Navigate to a route
    navigate(path) {
        // Update browser history
        window.history.pushState({}, '', path);
        
        // Handle route
        this.handleRoute(path);
    }

    // Handle current route
    handleRoute(path) {
        // Check if route exists
        const route = this.findRoute(path);
        
        if (route) {
            this.currentRoute = route;
            this.loadView(route);
        } else {
            this.loadErrorPage(404);
        }
    }

    // Find matching route
    findRoute(path) {
        // Check public routes
        for (const [pattern, config] of Object.entries(this.routes.routes.public)) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                return { ...config, params: match.params, isPublic: true };
            }
        }
        
        // Check protected routes
        for (const [pattern, config] of Object.entries(this.routes.routes.protected)) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                return { ...config, params: match.params, isPublic: false };
            }
        }
        
        return null;
    }

    // Match route pattern with path
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].substring(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        
        return { params };
    }

    // Load view for route
    async loadView(route) {
        // Check authentication for protected routes
        if (!route.isPublic) {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                this.navigate('/login');
                return;
            }
        }

        // Update active navigation
        this.updateActiveNav(route);

        // Load view content
        try {
            const viewPath = route.view;
            const response = await fetch(`/src/views/${viewPath}.ejs`);
            
            if (response.ok) {
                const html = await response.text();
                document.getElementById('main-content').innerHTML = html;
                document.title = `${route.title} - Arsip Surat Digital Enterprise`;
            } else {
                this.loadErrorPage(404);
            }
        } catch (error) {
            console.error('Failed to load view:', error);
            this.loadErrorPage(500);
        }
    }

    // Update active navigation item
    updateActiveNav(route) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.startsWith(href)) {
                link.classList.add('active');
            }
        });
    }

    // Load error page
    loadErrorPage(code) {
        const errorView = code === 404 ? 'errors/404' : 'errors/500';
        document.getElementById('main-content').innerHTML = `
            <div class="error-page">
                <div class="error-container">
                    <div class="error-code">${code}</div>
                    <h1>${code === 404 ? 'Halaman Tidak Ditemukan' : 'Internal Server Error'}</h1>
                    <p>${code === 404 ? 'Maaf, halaman yang Anda cari tidak ditemukan.' : 'Terjadi kesalahan pada server.'}</p>
                    <a href="/dashboard" class="btn btn-primary">Kembali ke Dashboard</a>
                </div>
            </div>
        `;
    }
}

// Initialize router
const router = new Router();

// Handle browser back/forward
window.addEventListener('popstate', () => {
    router.handleRoute(window.location.pathname);
});

// Handle initial load
document.addEventListener('DOMContentLoaded', () => {
    router.handleRoute(window.location.pathname);
});

// Export for use in other modules
window.router = router;
window.WebRoutes = WebRoutes;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebRoutes, Router };
}
