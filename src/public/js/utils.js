/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Utility Functions
 * ============================================================
 */

const EnterpriseUtils = (() => {
    'use strict';

    // ==================== DATE UTILITIES ====================
    const DateUtils = {
        /**
         * Format date to Indonesian locale
         */
        formatDate(date, format = 'full') {
            if (!date) return '-';
            
            const d = new Date(date);
            if (isNaN(d.getTime())) return 'Invalid Date';
            
            const options = {
                full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
                long: { year: 'numeric', month: 'long', day: 'numeric' },
                medium: { year: 'numeric', month: 'short', day: 'numeric' },
                short: { day: '2-digit', month: '2-digit', year: 'numeric' },
                time: { hour: '2-digit', minute: '2-digit' },
                datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            };
            
            return d.toLocaleDateString('id-ID', options[format] || options.full);
        },

        /**
         * Format date to ISO string (YYYY-MM-DD)
         */
        toISODate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        },

        /**
         * Get relative time (e.g., "5 menit yang lalu")
         */
        timeAgo(date) {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now - past;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            const diffWeek = Math.floor(diffDay / 7);
            const diffMonth = Math.floor(diffDay / 30);
            const diffYear = Math.floor(diffDay / 365);

            if (diffSec < 60) return 'Baru saja';
            if (diffMin < 60) return `${diffMin} menit yang lalu`;
            if (diffHour < 24) return `${diffHour} jam yang lalu`;
            if (diffDay < 7) return `${diffDay} hari yang lalu`;
            if (diffWeek < 4) return `${diffWeek} minggu yang lalu`;
            if (diffMonth < 12) return `${diffMonth} bulan yang lalu`;
            return `${diffYear} tahun yang lalu`;
        },

        /**
         * Add days to date
         */
        addDays(date, days) {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        },

        /**
         * Get date range
         */
        getDateRange(range) {
            const now = new Date();
            const ranges = {
                today: { start: new Date(now.setHours(0,0,0,0)), end: new Date(now.setHours(23,59,59,999)) },
                yesterday: { start: this.addDays(new Date().setHours(0,0,0,0), -1), end: new Date(new Date().setHours(23,59,59,999) -
