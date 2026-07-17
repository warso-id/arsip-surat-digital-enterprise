// router.js - Secure Router System for Clean URLs
class Router {
    constructor() {
        this.routes = {
            '/': 'dashboard',
            '/dashboard': 'dashboard',
            '/surat-masuk': 'surat-masuk',
            '/surat-keluar': 'surat-keluar',
            '/disposisi': 'disposisi',
            '/laporan': 'laporan',
            '/pengguna': 'pengguna',
            '/instansi': 'instansi',
            '/kategori': 'kategori',
            '/pengaturan': 'pengaturan',
            '/profile': 'profile',
            '/login': 'login',
            '/register': 'register',
            '/logout': 'logout',
            '/notifikasi': 'notifikasi',
            '/404': '404'
        };
        
        this.currentRoute = null;
        this.previousRoute = null;
        this.guards = [];
        this.init();
    }

    init() {
        // Handle initial load
        this.handleRoute();
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            this.handleRoute();
        });
        
        // Handle clicks on internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-route]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute('data-route');
                this.navigate(route);
            }
        });
    }

    async handleRoute() {
        const path = window.location.pathname;
        const basePath = '/arsip-surat-digital-enterprise';
        
        // Remove base path
        let route = path.replace(basePath, '') || '/';
        
        // Clean route
        route = route.replace(/\/+$/, '') || '/';
        
        // Find matching route
        const mappedRoute = this.routes[route] || '404';
        
        console.log(`Router: ${path} -> ${mappedRoute}`);
        
        // Check guards
        const canActivate = await this.checkGuards(mappedRoute);
        
        if (!canActivate) {
            return;
        }
        
        // Update current route
        this.previousRoute = this.currentRoute;
        this.currentRoute = mappedRoute;
        
        // Update active menu
        this.updateActiveMenu(mappedRoute);
        
        // Load page content
        this.loadPage(mappedRoute);
        
        // Update page title
        this.updateTitle(mappedRoute);
    }

    navigate(route, params = {}) {
        const basePath = '/arsip-surat-digital-enterprise';
        
        // Build URL
        let url = basePath;
        if (route && route !== '/') {
            url += '/' + route.replace(/^\//, '');
        }
        
        // Add query params if any
        if (Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(params).toString();
            url += '?' + queryString;
        }
        
        // Push to history
        window.history.pushState({ route, params }, '', url);
        
        // Handle route
        this.handleRoute();
    }

    redirect(route) {
        const basePath = '/arsip-surat-digital-enterprise';
        let url = basePath;
        if (route && route !== '/') {
            url += '/' + route.replace(/^\//, '');
        }
        window.history.replaceState({ route }, '', url);
        this.handleRoute();
    }

    getCurrentRoute() {
        return this.currentRoute;
    }

    getParams() {
        const searchParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    }

    addGuard(guardFunction) {
        this.guards.push(guardFunction);
    }

    async checkGuards(route) {
        for (const guard of this.guards) {
            const result = await guard(route);
            if (result === false) {
                return false;
            }
        }
        return true;
    }

    updateActiveMenu(route) {
        // Remove all active states
        document.querySelectorAll('.nav-link, [data-route]').forEach(el => {
            el.classList.remove('active');
        });
        
        // Find and activate matching menu item
        const activeLink = document.querySelector(`[data-route="${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    updateTitle(route) {
        const titles = {
            'dashboard': 'Dashboard - Arsip Surat Digital',
            'surat-masuk': 'Surat Masuk - Arsip Surat Digital',
            'surat-keluar': 'Surat Keluar - Arsip Surat Digital',
            'disposisi': 'Disposisi - Arsip Surat Digital',
            'laporan': 'Laporan - Arsip Surat Digital',
            'pengguna': 'Pengguna - Arsip Surat Digital',
            'instansi': 'Instansi - Arsip Surat Digital',
            'kategori': 'Kategori - Arsip Surat Digital',
            'pengaturan': 'Pengaturan - Arsip Surat Digital',
            'profile': 'Profil - Arsip Surat Digital',
            'login': 'Login - Arsip Surat Digital',
            'register': 'Registrasi - Arsip Surat Digital'
        };
        
        document.title = titles[route] || 'Arsip Surat Digital Enterprise';
    }

    loadPage(route) {
        // Emit event for page change
        const event = new CustomEvent('route-change', {
            detail: { route: route, params: this.getParams() }
        });
        window.dispatchEvent(event);
        
        // If app instance exists, use its navigation
        if (window.app && typeof window.app.navigateTo === 'function') {
            window.app.navigateTo(route);
        }
    }

    // Security: Sanitize route
    static sanitizeRoute(route) {
        // Remove any characters that aren't letters, numbers, hyphens, or slashes
        return route.replace(/[^a-zA-Z0-9\-\/]/g, '');
    }

    // Security: Validate route
    static isValidRoute(route) {
        const validRoutes = [
            '/', '/dashboard', '/surat-masuk', '/surat-keluar',
            '/disposisi', '/laporan', '/pengguna', '/instansi',
            '/kategori', '/pengaturan', '/profile'
        ];
        return validRoutes.includes(route);
    }
}

// Create global router instance
const router = new Router();

// Add auth guard
router.addGuard(async (route) => {
    const publicRoutes = ['login', 'register', '404'];
    
    if (publicRoutes.includes(route)) {
        return true;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    
    if (!token) {
        router.redirect('login');
        return false;
    }
    
    // Verify token is not expired
    if (auth && !auth.isAuthenticated) {
        router.redirect('login');
        return false;
    }
    
    return true;
});

console.log('Router initialized');
