/**
 * ============================================================
 * ARSIP SURAT DIGITAL ENTERPRISE v3.0.0
 * Developer Tools - Debugging & Testing Utilities
 * ============================================================
 * Press Ctrl+Shift+D to toggle Developer Panel
 * ============================================================
 */

const EnterpriseDevTools = (() => {
    'use strict';

    // ==================== DEV PANEL ====================
    class DevPanel {
        constructor() {
            this.panel = null;
            this.isOpen = false;
            this.tabs = ['console', 'network', 'storage', 'performance', 'info'];
            this.activeTab = 'console';
            this.logs = [];
            this.networkLogs = [];
            this.maxLogs = 500;
        }

        /**
         * Initialize developer panel
         */
        init() {
            this.createPanel();
            this.setupKeyboardShortcuts();
            this.interceptConsole();
            this.interceptNetwork();
            console.log('🛠️ Developer Tools ready - Press Ctrl+Shift+D to open');
        }

        /**
         * Create developer panel
         */
        createPanel() {
            this.panel = document.createElement('div');
            this.panel.id = 'dev-panel';
            this.panel.style.cssText = `
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 400px;
                background: #1e293b;
                color: #e2e8f0;
                z-index: 99999;
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-size: 12px;
                border-top: 3px solid #3b82f6;
                transition: transform 0.3s ease;
                transform: translateY(100%);
            `;

            this.panel.innerHTML = `
                <div style="display:flex; background:#0f172a; padding:0 12px; align-items:center;">
                    <div style="display:flex; gap:4px; flex:1;">
                        ${this.tabs.map(tab => `
                            <button class="dev-tab" data-tab="${tab}" 
                                style="padding:8px 16px; background:none; border:none; color:#94a3b8; cursor:pointer; 
                                       font-family:inherit; font-size:12px; border-bottom:2px solid transparent;
                                       ${tab === this.activeTab ? 'color:#3b82f6;border-bottom-color:#3b82f6;' : ''}">
                                ${tab.toUpperCase()}
                            </button>
                        `).join('')}
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button onclick="EnterpriseDevTools.clearAll()" style="background:#ef4444;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Clear</button>
                        <button onclick="EnterpriseDevTools.exportLogs()" style="background:#10b981;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Export</button>
                        <button onclick="EnterpriseDevTools.toggle()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;">✕</button>
                    </div>
                </div>
                <div id="dev-content" style="height:calc(100% - 41px); overflow-y:auto; padding:12px;">
                    ${this.renderConsole()}
                </div>
            `;

            document.body.appendChild(this.panel);

            // Tab click handlers
            this.panel.querySelectorAll('.dev-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    this.activeTab = tab.dataset.tab;
                    this.updatePanel();
                });
            });
        }

        /**
         * Render console tab
         */
        renderConsole() {
            return `
                <div style="margin-bottom:8px; color:#64748b;">
                    Console Logs (${this.logs.length})
                    <input type="text" placeholder="Filter logs..." onkeyup="EnterpriseDevTools.filterLogs(this.value)" 
                           style="margin-left:8px;padding:4px 8px;background:#334155;border:1px solid #475569;border-radius:4px;color:#e2e8f0;font-size:11px;">
                </div>
                <div id="dev-logs">
                    ${this.logs.slice(-100).reverse().map(log => this.formatLog(log)).join('')}
                </div>
            `;
        }

        /**
         * Render network tab
         */
        renderNetwork() {
            return `
                <div style="margin-bottom:8px; color:#64748b;">Network Requests (${this.networkLogs.length})</div>
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="color:#64748b; text-align:left;">
                            <th style="padding:4px;">Method</th>
                            <th style="padding:4px;">URL</th>
                            <th style="padding:4px;">Status</th>
                            <th style="padding:4px;">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.networkLogs.slice(-50).reverse().map(req => `
                            <tr style="border-bottom:1px solid #334155;">
                                <td style="padding:4px; color:#3b82f6;">${req.method}</td>
                                <td style="padding:4px; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${req.url}</td>
                                <td style="padding:4px; color:${req.status < 400 ? '#10b981' : '#ef4444'};">${req.status}</td>
                                <td style="padding:4px;">${req.duration}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        /**
         * Render storage tab
         */
        renderStorage() {
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                localStorageData[key] = localStorage.getItem(key);
            }

            const sessionStorageData = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                sessionStorageData[key] = sessionStorage.getItem(key);
            }

            return `
                <h3 style="color:#3b82f6; margin-bottom:8px;">LocalStorage</h3>
                <pre style="background:#0f172a; padding:12px; border-radius:8px; overflow-x:auto; max-height:200px;">${JSON.stringify(localStorageData, null, 2)}</pre>
                <h3 style="color:#3b82f6; margin:12px 0 8px;">SessionStorage</h3>
                <pre style="background:#0f172a; padding:12px; border-radius:8px; overflow-x:auto; max-height:200px;">${JSON.stringify(sessionStorageData, null, 2)}</pre>
                <button onclick="localStorage.clear();sessionStorage.clear();EnterpriseDevTools.updatePanel();" 
                        style="margin-top:8px; background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                    Clear All Storage
                </button>
            `;
        }

        /**
         * Render performance tab
         */
        renderPerformance() {
            const memory = performance.memory || {};
            const timing = performance.timing || {};
            const navigation = performance.navigation || {};

            return `
                <h3 style="color:#3b82f6; margin-bottom:8px;">Performance Metrics</h3>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td style="padding:4px; color:#64748b;">Page Load Time</td><td style="padding:4px;">${((timing.loadEventEnd - timing.navigationStart) / 1000).toFixed(2)}s</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">DOM Ready</td><td style="padding:4px;">${((timing.domContentLoadedEventEnd - timing.navigationStart) / 1000).toFixed(2)}s</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">JS Heap Used</td><td style="padding:4px;">${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">JS Heap Total</td><td style="padding:4px;">${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Redirect Count</td><td style="padding:4px;">${navigation.redirectCount || 0}</td></tr>
                </table>
                <button onclick="EnterpriseDevTools.runPerformanceTest()" 
                        style="margin-top:8px; background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                    Run Performance Test
                </button>
            `;
        }

        /**
         * Render info tab
         */
        renderInfo() {
            return `
                <h3 style="color:#3b82f6; margin-bottom:8px;">System Information</h3>
                <table style="width:100%; border-collapse:collapse;">
                    <tr><td style="padding:4px; color:#64748b;">App Version</td><td style="padding:4px;">3.0.0</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">User Agent</td><td style="padding:4px; font-size:10px;">${navigator.userAgent}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Platform</td><td style="padding:4px;">${navigator.platform}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Language</td><td style="padding:4px;">${navigator.language}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Online</td><td style="padding:4px; color:${navigator.onLine ? '#10b981' : '#ef4444'};">${navigator.onLine ? 'Yes' : 'No'}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Cookies Enabled</td><td style="padding:4px;">${navigator.cookieEnabled ? 'Yes' : 'No'}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Screen</td><td style="padding:4px;">${screen.width}x${screen.height}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">Viewport</td><td style="padding:4px;">${window.innerWidth}x${window.innerHeight}</td></tr>
                    <tr><td style="padding:4px; color:#64748b;">GAS URL</td><td style="padding:4px; font-size:10px;">${window.ENTERPRISE_CONFIG?.gas?.url || 'Not set'}</td></tr>
                </table>
            `;
        }

        /**
         * Format log entry
         */
        formatLog(log) {
            const colors = {
                log: '#e2e8f0',
                info: '#3b82f6',
                warn: '#f59e0b',
                error: '#ef4444',
                debug: '#8b5cf6',
            };
            const color = colors[log.type] || '#e2e8f0';
            
            return `
                <div style="padding:2px 0; border-bottom:1px solid #1e293b; color:${color};">
                    <span style="color:#64748b;">${log.time}</span>
                    [${log.type.toUpperCase()}]
                    ${log.message}
                </div>
            `;
        }

        /**
         * Update panel content
         */
        updatePanel() {
            const content = document.getElementById('dev-content');
            if (!content) return;

            // Update tab styles
            this.panel.querySelectorAll('.dev-tab').forEach(tab => {
                const isActive = tab.dataset.tab === this.activeTab;
                tab.style.color = isActive ? '#3b82f6' : '#94a3b8';
                tab.style.borderBottomColor = isActive ? '#3b82f6' : 'transparent';
            });

            // Render active tab
            switch (this.activeTab) {
                case 'console': content.innerHTML = this.renderConsole(); break;
                case 'network': content.innerHTML = this.renderNetwork(); break;
                case 'storage': content.innerHTML = this.renderStorage(); break;
                case 'performance': content.innerHTML = this.renderPerformance(); break;
                case 'info': content.innerHTML = this.renderInfo(); break;
            }
        }

        /**
         * Setup keyboard shortcuts
         */
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        }

        /**
         * Intercept console methods
         */
        interceptConsole() {
            const methods = ['log', 'info', 'warn', 'error', 'debug'];
            
            methods.forEach(method => {
                const original = console[method];
                console[method] = (...args) => {
                    // Call original
                    original.apply(console, args);
                    
                    // Add to dev logs
                    this.logs.push({
                        type: method,
                        message: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '),
                        time: new Date().toLocaleTimeString(),
                        timestamp: Date.now(),
                    });

                    if (this.logs.length > this.maxLogs) {
                        this.logs = this.logs.slice(-this.maxLogs);
                    }

                    // Update panel if open
                    if (this.isOpen && this.activeTab === 'console') {
                        this.updatePanel();
                    }
                };
            });
        }

        /**
         * Intercept network requests
         */
        interceptNetwork() {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                const method = args[1]?.method || 'GET';
                
                try {
                    const response = await originalFetch(...args);
                    const duration = (performance.now() - startTime).toFixed(2);
                    
                    this.networkLogs.push({
                        url,
                        method,
                        status: response.status,
                        duration: parseFloat(duration),
                        timestamp: Date.now(),
                    });

                    return response;
                } catch (error) {
                    this.networkLogs.push({
                        url,
                        method,
                        status: 0,
                        duration: (performance.now() - startTime).toFixed(2),
                        error: error.message,
                        timestamp: Date.now(),
                    });
                    throw error;
                }
            };
        }

        /**
         * Toggle panel visibility
         */
        toggle() {
            this.isOpen = !this.isOpen;
            
            if (this.isOpen) {
                this.panel.style.display = 'block';
                requestAnimationFrame(() => {
                    this.panel.style.transform = 'translateY(0)';
                });
                this.updatePanel();
            } else {
                this.panel.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    this.panel.style.display = 'none';
                }, 300);
            }
        }

        /**
         * Filter logs
         */
        filterLogs(query) {
            const filtered = query 
                ? this.logs.filter(l => l.message.toLowerCase().includes(query.toLowerCase()))
                : this.logs;
            
            const logsContainer = document.getElementById('dev-logs');
            if (logsContainer) {
                logsContainer.innerHTML = filtered.slice(-100).reverse()
                    .map(log => this.formatLog(log)).join('');
            }
        }

        /**
         * Clear all logs
         */
        clearAll() {
            this.logs = [];
            this.networkLogs = [];
            this.updatePanel();
        }

        /**
         * Export logs
         */
        exportLogs() {
            const data = {
                logs: this.logs,
                network: this.networkLogs,
                exportedAt: new Date().toISOString(),
                version: '3.0.0',
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dev-logs-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        /**
         * Run performance test
         */
        runPerformanceTest() {
            const results = {};
            const tests = [
                { name: 'Base64 Encode', fn: () => window.__BASE64?.encodeObject({ test: 'hello world', number: 12345 }) },
                { name: 'Base64 Decode', fn: () => window.__BASE64?.decodeObject('eyJ0ZXN0IjoiaGVsbG8gd29ybGQiLCJudW1iZXIiOjEyMzQ1fQ==') },
                { name: 'LocalStorage Write', fn: () => localStorage.setItem('__perf_test__', 'test') },
                { name: 'LocalStorage Read', fn: () => localStorage.getItem('__perf_test__') },
                { name: 'JSON Parse', fn: () => JSON.parse('{"test":"hello"}') },
                { name: 'JSON Stringify', fn: () => JSON.stringify({ test: 'hello' }) },
            ];

            tests.forEach(test => {
                const start = performance.now();
                for (let i = 0; i < 1000; i++) test.fn();
                results[test.name] = ((performance.now() - start) / 1000).toFixed(3) + 'ms';
            });

            console.log('Performance Test Results:', results);
            this.activeTab = 'performance';
            this.updatePanel();
        }
    }

    // ==================== INITIALIZE ====================
    const devPanel = new DevPanel();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => devPanel.init());
    } else {
        devPanel.init();
    }

    // ==================== PUBLIC API ====================
    return {
        toggle: () => devPanel.toggle(),
        updatePanel: () => devPanel.updatePanel(),
        clearAll: () => devPanel.clearAll(),
        exportLogs: () => devPanel.exportLogs(),
        filterLogs: (query) => devPanel.filterLogs(query),
        runPerformanceTest: () => devPanel.runPerformanceTest(),
        getLogs: () => devPanel.logs,
        getNetworkLogs: () => devPanel.networkLogs,
    };
})();

window.EnterpriseDevTools = EnterpriseDevTools;
