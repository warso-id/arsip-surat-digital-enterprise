/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Internationalization (i18n) System
 * ============================================================
 */

const EnterpriseI18n = (() => {
    'use strict';

    // ==================== TRANSLATIONS ====================
    const translations = {
        id: {
            // Common
            app_name: 'Arsip Surat Digital Enterprise',
            welcome: 'Selamat Datang',
            loading: 'Memuat...',
            saving: 'Menyimpan...',
            deleting: 'Menghapus...',
            confirm: 'Konfirmasi',
            cancel: 'Batal',
            save: 'Simpan',
            edit: 'Edit',
            delete: 'Hapus',
            search: 'Cari',
            filter: 'Filter',
            export: 'Export',
            refresh: 'Refresh',
            back: 'Kembali',
            next: 'Selanjutnya',
            previous: 'Sebelumnya',
            submit: 'Kirim',
            reset: 'Reset',
            close: 'Tutup',
            
            // Navigation
            dashboard: 'Dashboard',
            surat_masuk: 'Surat Masuk',
            surat_keluar: 'Surat Keluar',
            disposisi: 'Disposisi',
            laporan: 'Laporan',
            admin_panel: 'Admin Panel',
            profile: 'Profil',
            logout: 'Keluar',
            
            // Dashboard
            total_surat_masuk: 'Total Surat Masuk',
            total_surat_keluar: 'Total Surat Keluar',
            total_disposisi: 'Total Disposisi',
            total_arsip: 'Total Arsip',
            recent_activities: 'Aktivitas Terkini',
            
            // Surat Masuk
            add_surat_masuk: 'Tambah Surat Masuk',
            edit_surat_masuk: 'Edit Surat Masuk',
            no_agenda: 'Nomor Agenda',
            no_surat: 'Nomor Surat',
            tanggal_terima: 'Tanggal Terima',
            tanggal_surat: 'Tanggal Surat',
            pengirim: 'Pengirim',
            perihal: 'Perihal',
            sifat: 'Sifat',
            status: 'Status',
            file: 'File',
            
            // Status
            baru: 'Baru',
            proses: 'Proses',
            selesai: 'Selesai',
            arsip: 'Arsip',
            pending: 'Pending',
            draft: 'Draft',
            terkirim: 'Terkirim',
            
            // Validation
            required_field: 'Field ini harus diisi',
            invalid_email: 'Email tidak valid',
            min_length: 'Minimal {min} karakter',
            max_length: 'Maksimal {max} karakter',
            
            // Messages
            save_success: 'Data berhasil disimpan',
            save_error: 'Gagal menyimpan data',
            delete_success: 'Data berhasil dihapus',
            delete_error: 'Gagal menghapus data',
            delete_confirm: 'Apakah Anda yakin ingin menghapus data ini?',
            login_success: 'Login berhasil',
            login_error: 'Email atau password salah',
            logout_success: 'Anda telah keluar',
            session_expired: 'Sesi telah berakhir, silakan login kembali',
            network_error: 'Gagal terhubung ke server',
            offline: 'Anda sedang offline',
            online: 'Koneksi internet tersedia',
        },
        en: {
            // Common
            app_name: 'Digital Archive Enterprise',
            welcome: 'Welcome',
            loading: 'Loading...',
            saving: 'Saving...',
            deleting: 'Deleting...',
            confirm: 'Confirm',
            cancel: 'Cancel',
            save: 'Save',
            edit: 'Edit',
            delete: 'Delete',
            search: 'Search',
            filter: 'Filter',
            export: 'Export',
            refresh: 'Refresh',
            back: 'Back',
            next: 'Next',
            previous: 'Previous',
            submit: 'Submit',
            reset: 'Reset',
            close: 'Close',
            
            // Navigation
            dashboard: 'Dashboard',
            surat_masuk: 'Incoming Letters',
            surat_keluar: 'Outgoing Letters',
            disposisi: 'Disposition',
            laporan: 'Reports',
            admin_panel: 'Admin Panel',
            profile: 'Profile',
            logout: 'Logout',
            
            // Dashboard
            total_surat_masuk: 'Total Incoming',
            total_surat_keluar: 'Total Outgoing',
            total_disposisi: 'Total Dispositions',
            total_arsip: 'Total Archives',
            recent_activities: 'Recent Activities',
            
            // Surat Masuk
            add_surat_masuk: 'Add Incoming Letter',
            edit_surat_masuk: 'Edit Incoming Letter',
            no_agenda: 'Agenda Number',
            no_surat: 'Letter Number',
            tanggal_terima: 'Received Date',
            tanggal_surat: 'Letter Date',
            pengirim: 'Sender',
            perihal: 'Subject',
            sifat: 'Nature',
            status: 'Status',
            file: 'File',
            
            // Status
            baru: 'New',
            proses: 'In Progress',
            selesai: 'Completed',
            arsip: 'Archived',
            pending: 'Pending',
            draft: 'Draft',
            terkirim: 'Sent',
            
            // Validation
            required_field: 'This field is required',
            invalid_email: 'Invalid email address',
            min_length: 'Minimum {min} characters',
            max_length: 'Maximum {max} characters',
            
            // Messages
            save_success: 'Data saved successfully',
            save_error: 'Failed to save data',
            delete_success: 'Data deleted successfully',
            delete_error: 'Failed to delete data',
            delete_confirm: 'Are you sure you want to delete this data?',
            login_success: 'Login successful',
            login_error: 'Invalid email or password',
            logout_success: 'You have been logged out',
            session_expired: 'Session expired, please login again',
            network_error: 'Failed to connect to server',
            offline: 'You are offline',
            online: 'Internet connection available',
        },
    };

    // ==================== I18N CLASS ====================
    class I18n {
        constructor() {
            this.locale = this.detectLocale();
            this.fallbackLocale = 'id';
        }

        /**
         * Detect user locale
         */
        detectLocale() {
            // Check URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            const langParam = urlParams.get('lang');
            if (langParam && translations[langParam]) {
                return langParam;
            }

            // Check localStorage
            const savedLang = localStorage.getItem('app_language');
            if (savedLang && translations[savedLang]) {
                return savedLang;
            }

            // Check browser language
            const browserLang = navigator.language || navigator.userLanguage;
            const shortLang = browserLang.split('-')[0];
            
            if (translations[shortLang]) {
                return shortLang;
            }

            return this.fallbackLocale;
        }

        /**
         * Set locale
         */
        setLocale(locale) {
            if (translations[locale]) {
                this.locale = locale;
                localStorage.setItem('app_language', locale);
                this.updatePage();
            }
        }

        /**
         * Get translation
         */
        t(key, params = {}) {
            let translation = translations[this.locale]?.[key] 
                || translations[this.fallbackLocale]?.[key] 
                || key;

            // Replace parameters
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                translation = translation.replace(`{${paramKey}}`, paramValue);
            });

            return translation;
        }

        /**
         * Get current locale
         */
        getLocale() {
            return this.locale;
        }

        /**
         * Get available locales
         */
        getAvailableLocales() {
            return Object.keys(translations);
        }

        /**
         * Update page with translations
         */
        updatePage() {
            // Update all elements with data-i18n attribute
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.textContent = this.t(key);
            });

            // Update all elements with data-i18n-placeholder
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                element.placeholder = this.t(key);
            });

            // Update all elements with data-i18n-title
            document.querySelectorAll('[data-i18n-title]').forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                element.title = this.t(key);
            });

            // Update document title
            const titleKey = document.title;
            if (titleKey && translations[this.locale]?.app_name) {
                document.title = translations[this.locale].app_name;
            }

            // Dispatch event
            window.dispatchEvent(new CustomEvent('localeChanged', { 
                detail: { locale: this.locale } 
            }));
        }

        /**
         * Format number
         */
        formatNumber(number, options = {}) {
            return new Intl.NumberFormat(this.locale, options).format(number);
        }

        /**
         * Format date
         */
        formatDate(date, options = {}) {
            const defaultOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };
            return new Intl.DateTimeFormat(this.locale, { ...defaultOptions, ...options }).format(new Date(date));
        }

        /**
         * Format currency
         */
        formatCurrency(amount, currency = 'IDR') {
            return new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency,
            }).format(amount);
        }

        /**
         * Format relative time
         */
        formatRelativeTime(date) {
            const now = new Date();
            const diff = new Date(date) - now;
            const seconds = Math.abs(Math.floor(diff / 1000));
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });

            if (days > 0) return rtf.format(-days, 'day');
            if (hours > 0) return rtf.format(-hours, 'hour');
            if (minutes > 0) return rtf.format(-minutes, 'minute');
            return rtf.format(-seconds, 'second');
        }
    }

    // ==================== INITIALIZE ====================
    const i18n = new I18n();

    // Update page on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => i18n.updatePage());
    } else {
        i18n.updatePage();
    }

    // ==================== PUBLIC API ====================
    return {
        t: (key, params) => i18n.t(key, params),
        setLocale: (locale) => i18n.setLocale(locale),
        getLocale: () => i18n.getLocale(),
        getAvailableLocales: () => i18n.getAvailableLocales(),
        updatePage: () => i18n.updatePage(),
        formatNumber: (num, opts) => i18n.formatNumber(num, opts),
        formatDate: (date, opts) => i18n.formatDate(date, opts),
        formatCurrency: (amount, currency) => i18n.formatCurrency(amount, currency),
        formatRelativeTime: (date) => i18n.formatRelativeTime(date),
    };
})();

window.EnterpriseI18n = EnterpriseI18n;
