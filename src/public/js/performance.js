/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Performance Optimization Module
 * ============================================================
 */

const EnterprisePerformance = (() => {
    'use strict';

    // ==================== LAZY LOADER ====================
    class LazyLoader {
        constructor() {
            this.observer = null;
            this.loaded = new Set();
        }

        /**
         * Initialize lazy loading for images
         */
        initImages() {
            if (!('IntersectionObserver' in window)) {
                this.loadAllImages();
                return;
            }

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1,
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });
        }

        /**
         * Load single image
         */
        loadImage(img) {
            const src = img.getAttribute('data-src');
            if (!src || this.loaded.has(src)) return;

            const tempImage = new Image();
            tempImage.onload = () => {
                img.src = src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                this.loaded.add(src);
            };
            tempImage.onerror = () => {
                img.classList.add('error');
            };
            tempImage.src = src;
        }

        /**
         * Load all images immediately
         */
        loadAllImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }

        /**
         * Lazy load component/script
         */
        async loadComponent(path) {
            if (this.loaded.has(path)) return;
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = path;
                script.async = true;
                script.onload = () => {
                    this.loaded.add(path);
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    // ==================== DEBOUNCE & THROTTLE ====================
    class RateLimiter {
        /**
         * Debounce - execute after delay
         */
        static debounce(func, delay = 300) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        }

        /**
         * Throttle - execute at most once per delay
         */
        static throttle(func, delay = 300) {
            let lastCall = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastCall >= delay) {
                    lastCall = now;
                    func.apply(this, args);
                }
            };
        }

        /**
         * RAF throttle - using requestAnimationFrame
         */
        static rafThrottle(func) {
            let rafId = null;
            return function(...args) {
                if (rafId) return;
                rafId = requestAnimationFrame(() => {
                    func.apply(this, args);
                    rafId = null;
                });
            };
        }
    }

    // ==================== MEMOIZATION ====================
    class Memoizer {
        constructor() {
            this.cache = new Map();
            this.maxSize = 100;
        }

        /**
         * Memoize function results
         */
        memoize(func, keyGenerator = null) {
            const cache = this.cache;
            
            return function(...args) {
                const key = keyGenerator 
                    ? keyGenerator(...args) 
                    : JSON.stringify(args);
                
                if (cache.has(key)) {
                    return cache.get(key);
                }
                
                const result = func.apply(this, args);
                
                // Cache result
                if (cache.size >= this.maxSize) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(key, result);
                
                return result;
            };
        }

        /**
         * Clear memoization cache
         */
        clear() {
            this.cache.clear();
        }

        /**
         * Get cache stats
         */
        getStats() {
            return {
                size: this.cache.size,
                maxSize: this.maxSize,
            };
        }
    }

    // ==================== BATCH PROCESSOR ====================
    class BatchProcessor {
        constructor() {
            this.queue = [];
            this.processing = false;
            this.batchSize = 10;
            this.batchDelay = 100;
        }

        /**
         * Add item to batch queue
         */
        add(item) {
            this.queue.push(item);
            this.scheduleProcess();
        }

        /**
         * Schedule batch processing
         */
        scheduleProcess() {
            if (this.processing) return;
            
            this.processing = true;
            
            setTimeout(() => {
                this.process();
            }, this.batchDelay);
        }

        /**
         * Process batch
         */
        async process() {
            const batch = this.queue.splice(0, this.batchSize);
            
            if (batch.length === 0) {
                this.processing = false;
                return;
            }

            try {
                // Process batch items
                const results = await Promise.allSettled(
                    batch.map(item => this.processItem(item))
                );
                
                // Handle results
                results.forEach((result, index) => {
                    if (result.status === 'rejected') {
                        console.error(`Batch item ${index} failed:`, result.reason);
                    }
                });
            } catch (error) {
                console.error('Batch processing error:', error);
            }

            // Continue processing if more items
            if (this.queue.length > 0) {
                this.scheduleProcess();
            } else {
                this.processing = false;
            }
        }

        /**
         * Process single item
         */
        async processItem(item) {
            if (typeof item === 'function') {
                return item();
            }
            return item;
        }

        /**
         * Get queue stats
         */
        getStats() {
            return {
                queueSize: this.queue.length,
                processing: this.processing,
                batchSize: this.batchSize,
            };
        }
    }

    // ==================== RESOURCE HINTS ====================
    class ResourceHints {
        /**
         * Preload critical resources
         */
        static preload(url, type) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = type;
            if (type === 'font') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        }

        /**
         * Prefetch non-critical resources
         */
        static prefetch(url) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        }

        /**
         * Preconnect to origins
         */
        static preconnect(url) {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            document.head.appendChild(link);
        }

        /**
         * DNS prefetch
         */
        static dnsPrefetch(url) {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = url;
            document.head.appendChild(link);
        }
    }

    // ==================== INITIALIZE ====================
    const lazyLoader = new LazyLoader();
    const memoizer = new Memoizer();
    const batchProcessor = new BatchProcessor();

    // Initialize lazy loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            lazyLoader.initImages();
        });
    } else {
        lazyLoader.initImages();
    }

    // Preconnect to Google Apps Script
    ResourceHints.preconnect('https://script.google.com');
    ResourceHints.dnsPrefetch('https://script.google.com');

    // ==================== PUBLIC API ====================
    return {
        lazy: lazyLoader,
        rateLimit: RateLimiter,
        memoize: memoizer,
        batch: batchProcessor,
        resources: ResourceHints,
        
        // Utility functions
        debounce: (fn, delay) => RateLimiter.debounce(fn, delay),
        throttle: (fn, delay) => RateLimiter.throttle(fn, delay),
        
        // Preload common resources
        preloadCommon: () => {
            ResourceHints.preload('/src/public/css/enterprise.css', 'style');
            ResourceHints.preload('/src/public/js/enterprise-core.js', 'script');
        },
    };
})();

window.EnterprisePerformance = EnterprisePerformance;
