/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Master Script Loader - MUST BE INCLUDED FIRST IN EVERY PAGE
 * ============================================================
 * Dynamically loads all required scripts in correct order
 * Ensures all dependencies are met before page initialization
 * ============================================================
 */

(function(global) {
    'use strict';

    // ==================== SCRIPT CONFIGURATION ====================
    const SCRIPT_CONFIG = {
        // Base path for all scripts
        basePath: './src/public/js/',
        
        // Scripts in load order (dependencies first)
        scripts: {
            // Level 0 - No dependencies
            core: [
                'connector.js',        // Universal GAS connector
                'error-boundary.js',   // Error handling
                'logger.js',           // Logging system
                'utils.js',            // Utility functions
            ],
            // Level 1 - Depends on Level 0
            services: [
                'gas-api.js',          // GAS API handler
                'database.js',         // IndexedDB manager
                'auth-manager.js',     // Authentication
                'cache-manager.js',    // Caching system
            ],
            // Level 2 - Depends on Level 1
            features: [
                'router.js',           // SPA Router
                'monitoring.js',       // System monitoring
                'backup.js',           // Backup system
                'websocket.js',        // Real-time notifications
                'offline-sync.js',     // Offline sync
                'i18n.js',             // Internationalization
                'theme-manager.js',    // Theme manager
                'performance.js',      // Performance optimization
            ],
            // Level 3 - Main application
            application: [
                'enterprise-core.js',  // Core enterprise engine
                'app.js',              // Application bootstrap
            ],
        },
        
        // Scripts that are optional
        optional: [
            'websocket.js',     // Only if notifications needed
            'i18n.js',          // Only if multi-language needed
            'backup.js',        // Only if backup feature needed
        ],
        
        // Timeout for script loading
        timeout: 15000,
        
        // Retry failed scripts
        retryFailed: true,
        maxRetries: 2,
    };

    // ==================== SCRIPT LOADER CLASS ====================
    class MasterLoader {
        constructor() {
            this.loadedScripts = new Set();
            this.failedScripts = new Set();
            this.loadingPromises = new Map();
            this.retryCount = new Map();
        }

        /**
         * Initialize and load all required scripts
         */
        async init() {
            console.log('📦 Master Loader: Initializing script loading...');
            
            const startTime = performance.now();
            
            try {
                // Level 0: Core scripts
                await this.loadLevel(SCRIPT_CONFIG.scripts.core, 'core');
                
                // Level 1: Services
                await this.loadLevel(SCRIPT_CONFIG.scripts.services, 'services');
                
                // Level 2: Features
                await this.loadLevel(SCRIPT_CONFIG.scripts.features, 'features');
                
                // Level 3: Application
                await this.loadLevel(SCRIPT_CONFIG.scripts.application, 'application');
                
                const loadTime = (performance.now() - startTime).toFixed(2);
                console.log(`✅ Master Loader: All scripts loaded in ${loadTime}ms`);
                console.log(`   Loaded: ${this.loadedScripts.size} scripts`);
                
                if (this.failedScripts.size > 0) {
                    console.warn(`   Failed: ${this.failedScripts.size} scripts`);
                }
                
                // Dispatch ready event
                global.dispatchEvent(new CustomEvent('scripts:loaded', {
                    detail: {
                        loaded: Array.from(this.loadedScripts),
                        failed: Array.from(this.failedScripts),
                        loadTime: parseFloat(loadTime),
                    }
                }));
                
                return true;
                
            } catch (error) {
                console.error('❌ Master Loader: Script loading failed:', error);
                global.dispatchEvent(new CustomEvent('scripts:error', {
                    detail: { error: error.message }
                }));
                return false;
            }
        }

        /**
         * Load a level of scripts
         */
        async loadLevel(scripts, levelName) {
            console.log(`📦 Loading ${levelName} scripts (${scripts.length} files)...`);
            
            const promises = scripts.map(script => this.loadScript(script));
            const results = await Promise.allSettled(promises);
            
            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            
            console.log(`   ${levelName}: ${succeeded} loaded, ${failed} failed`);
        }

        /**
         * Load a single script
         */
        loadScript(filename) {
            // Check if already loaded
            if (this.loadedScripts.has(filename)) {
                return Promise.resolve();
            }

            // Check if loading is in progress
            if (this.loadingPromises.has(filename)) {
                return this.loadingPromises.get(filename);
            }

            const promise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                const fullPath = SCRIPT_CONFIG.basePath + filename;
                
                script.src = fullPath;
                script.async = true;
                script.setAttribute('data-loaded-by', 'master-loader');
                
                // Set timeout
                const timeout = setTimeout(() => {
                    cleanup();
                    
                    if (SCRIPT_CONFIG.retryFailed && this.canRetry(filename)) {
                        console.warn(`⏱️ Script timeout, retrying: ${filename}`);
                        this.retryCount.set(filename, (this.retryCount.get(filename) || 0) + 1);
                        this.loadingPromises.delete(filename);
                        resolve(this.loadScript(filename));
                    } else {
                        this.failedScripts.add(filename);
                        reject(new Error(`Script load timeout: ${filename}`));
                    }
                }, SCRIPT_CONFIG.timeout);

                // Load success
                script.onload = () => {
                    cleanup();
                    this.loadedScripts.add(filename);
                    this.failedScripts.delete(filename);
                    console.log(`   ✓ Loaded: ${filename}`);
                    resolve();
                };

                // Load error
                script.onerror = () => {
                    cleanup();
                    
                    if (SCRIPT_CONFIG.retryFailed && this.canRetry(filename)) {
                        console.warn(`⚠️ Script error, retrying: ${filename}`);
                        this.retryCount.set(filename, (this.retryCount.get(filename) || 0) + 1);
                        this.loadingPromises.delete(filename);
                        resolve(this.loadScript(filename));
                    } else {
                        this.failedScripts.add(filename);
                        console.error(`   ✗ Failed: ${filename}`);
                        reject(new Error(`Script load error: ${filename}`));
                    }
                };

                function cleanup() {
                    clearTimeout(timeout);
                    script.onload = null;
                    script.onerror = null;
                }

                // Append to document
                document.head.appendChild(script);
            });

            this.loadingPromises.set(filename, promise);
            return promise;
        }

        /**
         * Check if script can be retried
         */
        canRetry(filename) {
            const retries = this.retryCount.get(filename) || 0;
            return retries < SCRIPT_CONFIG.maxRetries;
        }

        /**
         * Load a single optional script
         */
        async loadOptional(filename) {
            if (this.loadedScripts.has(filename)) {
                return true;
            }

            try {
                await this.loadScript(filename);
                return true;
            } catch (error) {
                console.warn(`Optional script not loaded: ${filename}`);
                return false;
            }
        }

        /**
         * Check if a script is loaded
         */
        isLoaded(filename) {
            return this.loadedScripts.has(filename);
        }

        /**
         * Get load status
         */
        getStatus() {
            return {
                loaded: Array.from(this.loadedScripts),
                failed: Array.from(this.failedScripts),
                total: this.loadedScripts.size + this.failedScripts.size,
                pending: Array.from(this.loadingPromises.keys()),
            };
        }

        /**
         * Reload a specific script
         */
        async reloadScript(filename) {
            // Remove from loaded
            this.loadedScripts.delete(filename);
            this.failedScripts.delete(filename);
            this.loadingPromises.delete(filename);
            this.retryCount.delete(filename);

            // Remove existing script tag
            const existingScript = document.querySelector(`script[src$="${filename}"]`);
            if (existingScript) {
                existingScript.remove();
            }

            // Reload
            return this.loadScript(filename);
        }

        /**
         * Reload all failed scripts
         */
        async reloadFailed() {
            const failed = Array.from(this.failedScripts);
            this.failedScripts.clear();
            
            for (const filename of failed) {
                await this.reloadScript(filename);
            }
        }
    }

    // ==================== MINIMAL CONNECTOR (FALLBACK) ====================
    // If MasterLoader fails, provide minimal GAS connection
    const MinimalConnector = {
        baseUrl: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
        
        encode: (data) => {
            try {
                return btoa(unescape(encodeURIComponent(typeof data === 'object' ? JSON.stringify(data) : data)));
            } catch (e) {
                return null;
            }
        },
        
        request: (action, data) => {
            return new Promise((resolve, reject) => {
                const callback = 'minimal_' + Date.now();
                const encoded = MinimalConnector.encode({ ...data, action });
                const url = `${MinimalConnector.baseUrl}?action=${action}&data=${encoded}&callback=${callback}`;
                
                window[callback] = (response) => {
                    delete window[callback];
                    document.head.removeChild(script);
                    resolve(response);
                };
                
                const script = document.createElement('script');
                script.src = url;
                script.onerror = () => {
                    delete window[callback];
                    reject(new Error('Minimal connector failed'));
                };
                document.head.appendChild(script);
            });
        },
    };

    // ==================== INITIALIZE ====================
    const masterLoader = new MasterLoader();

    // Auto-initialize
    masterLoader.init().then(success => {
        if (!success) {
            console.warn('⚠️ Master Loader failed, using minimal connector');
            global.EnterpriseConnector = MinimalConnector;
        }
    });

    // Export globally
    global.MasterLoader = masterLoader;
    global.MinimalConnector = MinimalConnector;

})(window);
