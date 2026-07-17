/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Analytics Tracking Module
 * ============================================================
 */

const EnterpriseAnalytics = (() => {
    'use strict';

    // ==================== ANALYTICS CONFIGURATION ====================
    const CONFIG = {
        enabled: true,
        trackingId: null, // Google Analytics ID (optional)
        batchSize: 10,
        flushInterval: 30000,
        anonymizeIP: true,
    };

    // ==================== EVENT TRACKER ====================
    class EventTracker {
        constructor() {
            this.events = [];
            this.sessionId = this.generateSessionId();
            this.pageLoadTime = Date.now();
        }

        /**
         * Generate session ID
         */
        generateSessionId() {
            return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        /**
         * Track page view
         */
        trackPageView(page, title) {
            this.track('page_view', {
                page: page || window.location.pathname,
                title: title || document.title,
                referrer: document.referrer,
            });
        }

        /**
         * Track event
         */
        trackEvent(category, action, label, value) {
            this.track('event', {
                category,
                action,
                label,
                value,
            });
        }

        /**
         * Track error
         */
        trackError(error, fatal = false) {
            this.track('error', {
                message: error.message,
                stack: error.stack,
                fatal,
            });
        }

        /**
         * Track timing
         */
        trackTiming(category, variable, value) {
            this.track('timing', {
                category,
                variable,
                value,
            });
        }

        /**
         * Track user engagement
         */
        trackEngagement(type, data = {}) {
            this.track('engagement', {
                type,
                ...data,
            });
        }

        /**
         * Track API call
         */
        trackAPICall(endpoint, duration, status) {
            this.track('api_call', {
                endpoint,
                duration,
                status,
            });
        }

        /**
         * Generic track method
         */
        track(type, data = {}) {
            if (!CONFIG.enabled) return;

            const event = {
                type,
                data,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId,
                page: window.location.pathname,
                url: window.location.href,
            };

            this.events.push(event);

            // Keep only recent events
            if (this.events.length > 1000) {
                this.events = this.events.slice(-500);
            }

            // Send to Google Analytics if configured
            if (CONFIG.trackingId && typeof gtag !== 'undefined') {
                this.sendToGA(event);
            }

            // Send to GAS periodically
            this.scheduleFlush();
        }

        /**
         * Send to Google Analytics
         */
        sendToGA(event) {
            if (typeof gtag === 'undefined') return;

            switch (event.type) {
                case 'page_view':
                    gtag('event', 'page_view', {
                        page_path: event.data.page,
                        page_title: event.data.title,
                    });
                    break;
                case 'event':
                    gtag('event', event.data.action, {
                        event_category: event.data.category,
                        event_label: event.data.label,
                        value: event.data.value,
                    });
                    break;
            }
        }

        /**
         * Schedule flush to GAS
         */
        scheduleFlush() {
            if (this.flushTimeout) return;

            this.flushTimeout = setTimeout(() => {
                this.flush();
            }, CONFIG.flushInterval);
        }

        /**
         * Flush events to GAS
         */
        async flush() {
            if (this.events.length === 0) return;

            const batch = this.events.splice(0, CONFIG.batchSize);
            
            try {
                if (window.EnterpriseConnector) {
                    const encoded = window.EnterpriseConnector.encode(batch);
                    await window.EnterpriseConnector.request('analytics/track', {
                        action: 'analytics/track',
                        events: encoded,
                    });
                }
            } catch (error) {
                // Re-add events
                this.events = [...batch, ...this.events];
            }

            this.flushTimeout = null;

            // Continue if more events
            if (this.events.length > 0) {
                this.scheduleFlush();
            }
        }

        /**
         * Get analytics summary
         */
        getSummary() {
            const pageViews = this.events.filter(e => e.type === 'page_view').length;
            const errors = this.events.filter(e => e.type === 'error').length;
            const apiCalls = this.events.filter(e => e.type === 'api_call').length;
            const sessionDuration = (Date.now() - this.pageLoadTime) / 1000;

            return {
                pageViews,
                errors,
                apiCalls,
                sessionDuration,
                totalEvents: this.events.length,
            };
        }
    }

    // ==================== USER BEHAVIOR TRACKER ====================
    class BehaviorTracker {
        constructor(tracker) {
            this.tracker = tracker;
            this.clicks = 0;
            this.scrolls = 0;
            this.timeOnPage = 0;
            this.startTime = Date.now();
        }

        /**
         * Start tracking behavior
         */
        start() {
            // Track clicks
            document.addEventListener('click', (e) => {
                this.clicks++;
                const target = e.target.closest('a, button, [data-track]');
                if (target) {
                    this.tracker.trackEngagement('click', {
                        element: target.tagName,
                        text: target.textContent?.trim().substring(0, 50),
                        href: target.href || null,
                        track: target.dataset.track || null,
                    });
                }
            }, true);

            // Track scroll depth
            let maxScroll = 0;
            window.addEventListener('scroll', () => {
                this.scrolls++;
                const scrollPercent = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );
                if (scrollPercent > maxScroll) {
                    maxScroll = scrollPercent;
                    if (maxScroll % 25 === 0) { // Track every 25%
                        this.tracker.trackEngagement('scroll', { depth: maxScroll });
                    }
                }
            }, { passive: true });

            // Track time on page
            setInterval(() => {
                this.timeOnPage = Math.round((Date.now() - this.startTime) / 1000);
            }, 10000);

            // Track page leave
            window.addEventListener('beforeunload', () => {
                this.tracker.trackEngagement('page_leave', {
                    timeOnPage: this.timeOnPage,
                    clicks: this.clicks,
                });
            });
        }

        /**
         * Get behavior stats
         */
        getStats() {
            return {
                clicks: this.clicks,
                scrolls: this.scrolls,
                timeOnPage: Math.round((Date.now() - this.startTime) / 1000),
            };
        }
    }

    // ==================== INITIALIZE ====================
    const tracker = new EventTracker();
    const behavior = new BehaviorTracker(tracker);

    // Track initial page view
    tracker.trackPageView();

    // Start behavior tracking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => behavior.start());
    } else {
        behavior.start();
    }

    // ==================== PUBLIC API ====================
    return {
        trackPageView: (page, title) => tracker.trackPageView(page, title),
        trackEvent: (category, action, label, value) => tracker.trackEvent(category, action, label, value),
        trackError: (error, fatal) => tracker.trackError(error, fatal),
        trackTiming: (category, variable, value) => tracker.trackTiming(category, variable, value),
        trackAPICall: (endpoint, duration, status) => tracker.trackAPICall(endpoint, duration, status),
        getSummary: () => tracker.getSummary(),
        getBehaviorStats: () => behavior.getStats(),
        flush: () => tracker.flush(),
    };
})();

window.EnterpriseAnalytics = EnterpriseAnalytics;
