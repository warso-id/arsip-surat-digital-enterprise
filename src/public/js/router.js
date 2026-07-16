/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * SPA Router
 * ============================================================
 * Hash-based Single Page Application Router
 * with guards, lazy loading, and transitions
 * ============================================================
 */

const EnterpriseRouter = (() => {
    'use strict';

    // ==================== ROUTER CONFIGURATION ====================
    const routes = new Map();
    const guards = [];
    let currentRoute = null;
    let previousRoute = null;

    // ==================== ROUTE CLASS ====================
    class Route {
        constructor(path, config) {
            this.path = path;
            this.component = config.component || null;
            this.template = config.template || null;
            this.title = config.title || 'Arsip Surat Digital Enterprise';
            this.meta = config.meta || {};
            this.guards = config.guards || [];
            this.data = config.data || {};
            this.lazyLoad = config.lazyLoad || null;
            this.transition = config.transition || 'fade';
            this.cache = config.cache !== false;
            this.layout = config.layout || 'default';
        }

        matches(path) {
            // Convert route pattern to regex
            const pattern = this.path
                .replace(/\//g, '\\/')
                .replace(/:(\w+)/g, '(?<$1>[^/]+)')
                .replace(/\*/g, '.*');

            const regex = new RegExp(`^${pattern}$`);
            const match = path.match(regex);

            if (match) {
                return {
                    params: match.groups || {},
                    route: this
                };
            }

            return null;
        }
    }

    // ==================== ROUTER CLASS ====================
    class Router {
        constructor() {
            this.routes = new Map();
            this.guards = [];
            this.currentRoute = null;
            this.previousRoute = null;
            this.defaultRoute = '/';
            this.notFoundRoute = null;
            this.transitioning = false;
            this.history = [];
        }

        /**
         * Register a route
         */
        addRoute(path, config) {
            const route = new Route(path, config);
            this.routes.set(path, route);
            return this;
        }

        /**
         * Register multiple routes
         */
        addRoutes(routeConfigs) {
            Object.entries(routeConfigs).forEach(([path, config]) => {
                this.addRoute(path, config);
            });
            return this;
        }

        /**
         * Set default route
         */
        setDefault(path) {
            this.defaultRoute = path;
            return this;
        }

        /**
         * Set 404 route
         */
        setNotFound(config) {
            this.notFoundRoute = new Route('*', config);
            return this;
        }

        /**
         * Add global guard
         */
        addGuard(guardFn) {
            this.guards.push(guardFn);
            return this;
        }

        /**
         * Navigate to path
         */
        async navigate(path, options = {}) {
            if (this.transitioning) return;
            
            const opts = {
                replace: false,
                force: false,
                ...options
            };

            // Normalize path
            const normalizedPath = this.normalizePath(path);

            // Don't navigate to same route
            if (!opts.force && this.currentRoute?.path === normalizedPath) {
                return;
            }

            this.transitioning = true;

            try {
                // Find matching route
                const match = this.findRoute(normalizedPath);

                if (!match) {
                    // Try default route
                    if (this.defaultRoute && normalizedPath !== this.defaultRoute) {
                        return this.navigate(this.defaultRoute);
                    }
                    
                    // Show 404
                    if (this.notFoundRoute) {
                        return this.activateRoute(this.notFoundRoute, {});
                    }
                    return;
                }

                // Run guards
                const canActivate = await this.runGuards(match.route, match.params);
                if (!canActivate) {
                    this.transitioning = false;
                    return;
                }

                // Run route-specific guards
                const canActivateRoute = await this.runRouteGuards(match.route, match.params);
                if (!canActivateRoute) {
                    this.transitioning = false;
                    return;
                }

                // Activate route
                await this.activateRoute(match.route, match.params, opts);

            } catch (error) {
                console.error('Navigation error:', error);
                this.transitioning = false;
            }
        }

        /**
         * Find matching route
         */
        findRoute(path) {
            // Try exact match first
            if (this.routes.has(path)) {
                return {
                    route: this.routes.get(path),
                    params: {}
                };
            }

            // Try pattern matching
            for (const [pattern, route] of this.routes) {
                const match = route.matches(path);
                if (match) {
                    return match;
                }
            }

            return null;
        }

        /**
         * Activate route
         */
        async activateRoute(route, params, opts = {}) {
            // Save previous route
            this.previousRoute = this.currentRoute;

            // Update current route
            this.currentRoute = {
                path: route.path,
                route: route,
                params: params,
                timestamp: Date.now()
            };

            // Add to history
            if (!opts.replace) {
                this.history.push(this.currentRoute);
            }

            // Update browser history
            const url = this.buildUrl(route.path, params);
            if (opts.replace) {
                window.history.replaceState({ route: this.currentRoute }, '', url);
            } else {
                window.history.pushState({ route: this.currentRoute }, '', url);
            }

            // Update document title
            document.title = route.title;

            // Update meta tags
            this.updateMeta(route.meta);

            // Render component
            await this.renderRoute(route, params);

            // Emit event
            if (window.EnterpriseCore?.events) {
                window.EnterpriseCore.events.emit('route:changed', {
                    route: this.currentRoute,
                    previous: this.previousRoute
                });
            }

            this.transitioning = false;
        }

        /**
         * Render route component
         */
        async renderRoute(route, params) {
            const outlet = document.getElementById('app-outlet') || document.getElementById('main-content');
            if (!outlet) {
                console.warn('No router outlet found');
                return;
            }

            // Show loading
            this.showLoading();

            try {
                let content;

                // Lazy load component
                if (route.lazyLoad) {
                    const module = await route.lazyLoad();
                    route.component = module.default || module;
                }

                // Get content from component
                if (typeof route.component === 'function') {
                    content = await route.component(params);
                } else if (route.template) {
                    content = route.template;
                } else {
                    content = '<p>No content available</p>';
                }

                // Apply transition
                await this.applyTransition(outlet, content, route.transition);

            } catch (error) {
                console.error('Route render error:', error);
                outlet.innerHTML = '<p>Error loading page</p>';
            }

            // Hide loading
            this.hideLoading();
        }

        /**
         * Apply transition effect
         */
        async applyTransition(element, content, transition) {
            const transitions = {
                fade: {
                    out: { opacity: '0', transition: 'opacity 0.2s ease' },
                    in: { opacity: '1', transition: 'opacity 0.3s ease' }
                },
                slide: {
                    out: { transform: 'translateX(-20px)', opacity: '0', transition: 'all 0.2s ease' },
                    in: { transform: 'translateX(0)', opacity: '1', transition: 'all 0.3s ease' }
                },
                none: {
                    out: {},
                    in: {}
                }
            };

            const effect = transitions[transition] || transitions.fade;

            // Fade out
            Object.assign(element.style, effect.out);
            await this.delay(200);

            // Update content
            element.innerHTML = content;

            // Fade in
            Object.assign(element.style, effect.in);
            await this.delay(300);

            // Clean up
            element.style.transition = '';
            element.style.transform = '';
            element.style.opacity = '';
        }

        /**
         * Run global guards
         */
        async runGuards(route, params) {
            for (const guard of this.guards) {
                try {
                    const result = await guard(route, params);
                    if (result === false) {
                        console.log(`Navigation blocked by guard`);
                        return false;
                    }
                    if (typeof result === 'string') {
                        this.navigate(result);
                        return false;
                    }
                } catch (error) {
                    console.error('Guard error:', error);
                    return false;
                }
            }
            return true;
        }

        /**
         * Run route-specific guards
         */
        async runRouteGuards(route, params) {
            for (const guard of route.guards) {
                try {
                    const result = await guard(params);
                    if (result === false) return false;
                    if (typeof result === 'string') {
                        this.navigate(result);
                        return false;
                    }
                } catch (error) {
                    console.error('Route guard error:', error);
                    return false;
                }
            }
            return true;
        }

        /**
         * Build URL from route and params
         */
        buildUrl(path, params) {
            let url = path;
            Object.entries(params).forEach(([key, value]) => {
                url = url.replace(`:${key}`, value);
            });
            return url;
        }

        /**
         * Normalize path
         */
        normalizePath(path) {
            // Remove leading hash
            path = path.replace(/^#/, '');
            
            // Ensure leading slash
            if (!path.startsWith('/')) {
                path = '/' + path;
            }
            
            // Remove trailing slash (except root)
            if (path.length > 1 && path.endsWith('/')) {
                path = path.slice(0, -1);
            }
            
            return path;
        }

        /**
         * Update meta tags
         */
        updateMeta(meta) {
            if (meta.description) {
                document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
            }
            if (meta.keywords) {
                document.querySelector('meta[name="keywords"]')?.setAttribute('content', meta.keywords);
            }
        }

        /**
         * Show loading indicator
         */
        showLoading() {
            if (window.EnterpriseCore?.ui) {
                window.EnterpriseCore.ui.showLoading('Memuat halaman...');
            }
        }

        /**
         * Hide loading indicator
         */
        hideLoading() {
            if (window.EnterpriseCore?.ui) {
                window.EnterpriseCore.ui.hideLoading();
            }
        }

        /**
         * Get current route
         */
        getCurrentRoute() {
            return this.currentRoute;
        }

        /**
         * Get previous route
         */
        getPreviousRoute() {
            return this.previousRoute;
        }

        /**
         * Go back
         */
        back() {
            window.history.back();
        }

        /**
         * Go forward
         */
        forward() {
            window.history.forward();
        }

        /**
         * Delay helper
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        /**
         * Start listening to browser events
         */
        start() {
            // Handle popstate (browser back/forward)
            window.addEventListener('popstate', (event) => {
                if (event.state?.route) {
                    const route = event.state.route;
                    this.navigate(route.path, { replace: true, force: true });
                } else {
                    this.navigate(window.location.hash || '/');
                }
            });

            // Handle initial route
            const initialPath = window.location.hash 
                ? this.normalizePath(window.location.hash)
                : window.location.pathname;

            this.navigate(initialPath, { replace: true });
        }
    }

    // ==================== AUTH GUARD ====================
    const authGuard = (route, params) => {
        const isAuthenticated = window.EnterpriseAuth 
            ? window.EnterpriseAuth.isAuthenticated() 
            : !!localStorage.getItem('enterprise_token');

        if (route.meta?.requiresAuth && !isAuthenticated) {
            return '/login.html';
        }

        // Redirect to dashboard if already logged in and trying to access login
        if (route.path === '/login' && isAuthenticated) {
            return '/dashboard';
        }

        return true;
    };

    // ==================== PERMISSION GUARD ====================
    const permissionGuard = (route, params) => {
        if (route.meta?.permission) {
            const hasPermission = window.EnterpriseAuth 
                ? window.EnterpriseAuth.hasPermission(route.meta.permission)
                : true;

            if (!hasPermission) {
                console.warn(`Permission denied: ${route.meta.permission}`);
                return '/dashboard';
            }
        }
        return true;
    };

    // ==================== INITIALIZE ROUTER ====================
    const router = new Router();

    // Add global guards
    router.addGuard(authGuard);
    router.addGuard(permissionGuard);

    // Register routes
    router.addRoutes({
        '/': {
            title: 'Beranda - Arsip Surat Digital Enterprise',
            template: '<h1>Beranda</h1>',
            meta: { description: 'Sistem Manajemen Arsip Surat Digital' }
        },
        '/dashboard': {
            title: 'Dashboard - Arsip Surat Digital Enterprise',
            template: '<h1>Dashboard</h1>',
            meta: { requiresAuth: true }
        },
        '/surat-masuk': {
            title: 'Surat Masuk - Arsip Surat Digital Enterprise',
            template: '<h1>Surat Masuk</h1>',
            meta: { requiresAuth: true, permission: 'surat-masuk:read' }
        },
        '/surat-keluar': {
            title: 'Surat Keluar - Arsip Surat Digital Enterprise',
            template: '<h1>Surat Keluar</h1>',
            meta: { requiresAuth: true, permission: 'surat-keluar:read' }
        },
        '/disposisi': {
            title: 'Disposisi - Arsip Surat Digital Enterprise',
            template: '<h1>Disposisi</h1>',
            meta: { requiresAuth: true, permission: 'disposisi:read' }
        },
        '/laporan': {
            title: 'Laporan - Arsip Surat Digital Enterprise',
            template: '<h1>Laporan</h1>',
            meta: { requiresAuth: true, permission: 'laporan:read' }
        },
        '/admin': {
            title: 'Admin Panel - Arsip Surat Digital Enterprise',
            template: '<h1>Admin Panel</h1>',
            meta: { requiresAuth: true, permission: 'admin:access' }
        },
        '/profile': {
            title: 'Profil - Arsip Surat Digital Enterprise',
            template: '<h1>Profil</h1>',
            meta: { requiresAuth: true }
        },
        '/login': {
            title: 'Login - Arsip Surat Digital Enterprise',
            template: '<h1>Login</h1>',
            meta: { requiresAuth: false }
        }
    });

    // Set 404 route
    router.setNotFound({
        title: '404 - Halaman Tidak Ditemukan',
        template: '<h1>404 - Halaman Tidak Ditemukan</h1>'
    });

    // Set default route
    router.setDefault('/');

    // Start router
    router.start();

    // ==================== PUBLIC API ====================
    return {
        navigate: (path, options) => router.navigate(path, options),
        back: () => router.back(),
        forward: () => router.forward(),
        getCurrentRoute: () => router.getCurrentRoute(),
        getPreviousRoute: () => router.getPreviousRoute(),
        addRoute: (path, config) => router.addRoute(path, config),
        addGuard: (guard) => router.addGuard(guard),
    };
})();

// Export globally
window.EnterpriseRouter = EnterpriseRouter;
