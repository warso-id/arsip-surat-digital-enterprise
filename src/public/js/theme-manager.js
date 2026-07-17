/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Theme Manager (Light/Dark/Custom)
 * ============================================================
 */

const EnterpriseTheme = (() => {
    'use strict';

    // ==================== THEME DEFINITIONS ====================
    const themes = {
        light: {
            name: 'Terang',
            icon: '☀️',
            colors: {
                '--primary': '#1a56db',
                '--primary-dark': '#1e40af',
                '--primary-light': '#3b82f6',
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f9fafb',
                '--bg-tertiary': '#f3f4f6',
                '--text-primary': '#1f2937',
                '--text-secondary': '#6b7280',
                '--text-tertiary': '#9ca3af',
                '--border-primary': '#e5e7eb',
                '--border-secondary': '#f3f4f6',
                '--shadow-color': 'rgba(0, 0, 0, 0.1)',
                '--card-bg': '#ffffff',
                '--sidebar-bg': 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                '--sidebar-text': '#ffffff',
                '--header-bg': '#ffffff',
                '--input-bg': '#ffffff',
                '--input-border': '#e5e7eb',
                '--table-header-bg': '#f8fafc',
                '--table-hover-bg': '#f9fafb',
            },
        },
        dark: {
            name: 'Gelap',
            icon: '🌙',
            colors: {
                '--primary': '#3b82f6',
                '--primary-dark': '#2563eb',
                '--primary-light': '#60a5fa',
                '--bg-primary': '#0f172a',
                '--bg-secondary': '#1e293b',
                '--bg-tertiary': '#334155',
                '--text-primary': '#f1f5f9',
                '--text-secondary': '#94a3b8',
                '--text-tertiary': '#64748b',
                '--border-primary': '#334155',
                '--border-secondary': '#1e293b',
                '--shadow-color': 'rgba(0, 0, 0, 0.5)',
                '--card-bg': '#1e293b',
                '--sidebar-bg': 'linear-gradient(180deg, #020617 0%, #0f172a 100%)',
                '--sidebar-text': '#e2e8f0',
                '--header-bg': '#1e293b',
                '--input-bg': '#334155',
                '--input-border': '#475569',
                '--table-header-bg': '#1e293b',
                '--table-hover-bg': '#334155',
            },
        },
        blue: {
            name: 'Biru Profesional',
            icon: '💙',
            colors: {
                '--primary': '#1e40af',
                '--primary-dark': '#1e3a8a',
                '--primary-light': '#3b82f6',
                '--bg-primary': '#eff6ff',
                '--bg-secondary': '#dbeafe',
                '--bg-tertiary': '#bfdbfe',
                '--text-primary': '#1e3a8a',
                '--text-secondary': '#1e40af',
                '--text-tertiary': '#3b82f6',
                '--border-primary': '#93c5fd',
                '--border-secondary': '#bfdbfe',
                '--shadow-color': 'rgba(30, 64, 175, 0.2)',
                '--card-bg': '#ffffff',
                '--sidebar-bg': 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
                '--sidebar-text': '#ffffff',
                '--header-bg': '#ffffff',
                '--input-bg': '#ffffff',
                '--input-border': '#93c5fd',
                '--table-header-bg': '#eff6ff',
                '--table-hover-bg': '#dbeafe',
            },
        },
        green: {
            name: 'Hijau Natural',
            icon: '💚',
            colors: {
                '--primary': '#059669',
                '--primary-dark': '#047857',
                '--primary-light': '#10b981',
                '--bg-primary': '#ecfdf5',
                '--bg-secondary': '#d1fae5',
                '--bg-tertiary': '#a7f3d0',
                '--text-primary': '#064e3b',
                '--text-secondary': '#065f46',
                '--text-tertiary': '#047857',
                '--border-primary': '#6ee7b7',
                '--border-secondary': '#a7f3d0',
                '--shadow-color': 'rgba(5, 150, 105, 0.2)',
                '--card-bg': '#ffffff',
                '--sidebar-bg': 'linear-gradient(180deg, #064e3b 0%, #047857 100%)',
                '--sidebar-text': '#ffffff',
                '--header-bg': '#ffffff',
                '--input-bg': '#ffffff',
                '--input-border': '#6ee7b7',
                '--table-header-bg': '#ecfdf5',
                '--table-hover-bg': '#d1fae5',
            },
        },
    };

    // ==================== THEME MANAGER CLASS ====================
    class ThemeManager {
        constructor() {
            this.currentTheme = this.loadTheme();
            this.customThemes = this.loadCustomThemes();
        }

        /**
         * Load saved theme
         */
        loadTheme() {
            const saved = localStorage.getItem('enterprise_theme');
            if (saved && themes[saved]) {
                return saved;
            }

            // Check system preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }

            return 'light';
        }

        /**
         * Load custom themes
         */
        loadCustomThemes() {
            try {
                const saved = localStorage.getItem('enterprise_custom_themes');
                return saved ? JSON.parse(saved) : {};
            } catch {
                return {};
            }
        }

        /**
         * Apply theme
         */
        applyTheme(themeName) {
            const theme = themes[themeName] || this.customThemes[themeName];
            if (!theme) return false;

            // Apply CSS variables
            const root = document.documentElement;
            Object.entries(theme.colors).forEach(([property, value]) => {
                root.style.setProperty(property, value);
            });

            // Add theme class to body
            document.body.className = document.body.className
                .replace(/theme-\w+/g, '')
                .trim();
            document.body.classList.add(`theme-${themeName}`);

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', theme.colors['--primary'] || '#1a56db');
            }

            // Save preference
            this.currentTheme = themeName;
            localStorage.setItem('enterprise_theme', themeName);

            // Dispatch event
            window.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: themeName, colors: theme.colors }
            }));

            return true;
        }

        /**
         * Toggle between light and dark
         */
        toggle() {
            const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(nextTheme);
            return nextTheme;
        }

        /**
         * Get current theme
         */
        getCurrentTheme() {
            return {
                name: this.currentTheme,
                ...themes[this.currentTheme] || this.customThemes[this.currentTheme],
            };
        }

        /**
         * Get all available themes
         */
        getThemes() {
            return { ...themes, ...this.customThemes };
        }

        /**
         * Create custom theme
         */
        createCustomTheme(name, colors) {
            this.customThemes[name] = {
                name,
                icon: '🎨',
                colors,
                custom: true,
            };
            this.saveCustomThemes();
        }

        /**
         * Delete custom theme
         */
        deleteCustomTheme(name) {
            if (this.customThemes[name]) {
                delete this.customThemes[name];
                this.saveCustomThemes();

                // Switch to default if current theme was deleted
                if (this.currentTheme === name) {
                    this.applyTheme('light');
                }
            }
        }

        /**
         * Save custom themes
         */
        saveCustomThemes() {
            localStorage.setItem('enterprise_custom_themes', JSON.stringify(this.customThemes));
        }

        /**
         * Listen for system theme changes
         */
        listenSystemTheme() {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handler = (e) => {
                if (!localStorage.getItem('enterprise_theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            };

            mediaQuery.addEventListener('change', handler);
        }
    }

    // ==================== INITIALIZE ====================
    const themeManager = new ThemeManager();
    
    // Apply saved theme
    themeManager.applyTheme(themeManager.currentTheme);
    
    // Listen for system changes
    themeManager.listenSystemTheme();

    // ==================== PUBLIC API ====================
    return {
        apply: (theme) => themeManager.applyTheme(theme),
        toggle: () => themeManager.toggle(),
        getCurrent: () => themeManager.getCurrentTheme(),
        getThemes: () => themeManager.getThemes(),
        create: (name, colors) => themeManager.createCustomTheme(name, colors),
        delete: (name) => themeManager.deleteCustomTheme(name),
        isDark: () => themeManager.currentTheme === 'dark',
    };
})();

window.EnterpriseTheme = EnterpriseTheme;
