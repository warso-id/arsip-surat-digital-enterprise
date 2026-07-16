// ==================== MONITORING SERVICE ====================
// Arsip Surat Digital Enterprise
// System monitoring and metrics

const os = require('os');
const fs = require('fs').promises;
const path = require('path');

class MonitoringService {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.metricsDir = path.join(__dirname, '..', '..', 'storage', 'metrics');
    }

    /**
     * Initialize monitoring
     */
    async initialize() {
        await fs.mkdir(this.metricsDir, { recursive: true });
        this.startMetricsCollection();
        console.log('Monitoring service initialized');
    }

    /**
     * Start periodic metrics collection
     */
    startMetricsCollection() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000); // Every minute

        setInterval(() => {
            this.saveMetrics();
        }, 300000); // Every 5 minutes
    }

    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            system: {
                uptime: process.uptime(),
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem(),
                    usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1),
                },
                cpu: {
                    loadAvg: os.loadavg(),
                    cpus: os.cpus().length,
                },
                platform: {
                    type: os.type(),
                    release: os.release(),
                    arch: os.arch(),
                    hostname: os.hostname(),
                },
            },
            process: {
                pid: process.pid,
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                version: process.version,
            },
            application: {
                requests: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) : 0,
                uptime: (Date.now() - this.startTime) / 1000,
            },
        };

        const key = new Date().toISOString().replace(/[:.]/g, '-');
        this.metrics.set(key, metrics);
        
        // Keep only last 100 metrics
        if (this.metrics.size > 100) {
            const firstKey = this.metrics.keys().next().value;
            this.metrics.delete(firstKey);
        }
    }

    /**
     * Track request
     */
    trackRequest() {
        this.requestCount++;
    }

    /**
     * Track error
     */
    trackError() {
        this.errorCount++;
    }

    /**
     * Get current metrics
     */
    getCurrentMetrics() {
        const systemMetrics = {
            memory: {
                total: this.formatBytes(os.totalmem()),
                free: this.formatBytes(os.freemem()),
                used: this.formatBytes(os.totalmem() - os.freemem()),
                usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(1) + '%',
            },
            cpu: {
                loadAvg1m: os.loadavg()[0].toFixed(2),
                loadAvg5m: os.loadavg()[1].toFixed(2),
                loadAvg15m: os.loadavg()[2].toFixed(2),
                cores: os.cpus().length,
            },
            uptime: {
                system: this.formatUptime(os.uptime()),
                process: this.formatUptime(process.uptime()),
                application: this.formatUptime((Date.now() - this.startTime) / 1000),
            },
        };

        const appMetrics = {
            requests: {
                total: this.requestCount,
                errors: this.errorCount,
                errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
            },
            process: {
                pid: process.pid,
                heapUsed: this.formatBytes(process.memoryUsage().heapUsed),
                heapTotal: this.formatBytes(process.memoryUsage().heapTotal),
                rss: this.formatBytes(process.memoryUsage().rss),
            },
            version: {
                node: process.version,
                app: require('../../../version.json').version,
            },
        };

        return {
            timestamp: new Date().toISOString(),
            system: systemMetrics,
            application: appMetrics,
        };
    }

    /**
     * Get historical metrics
     */
    getHistoricalMetrics(limit = 20) {
        const entries = Array.from(this.metrics.entries());
        const recent = entries.slice(-limit);
        
        return recent.map(([key, value]) => ({
            timestamp: key,
            ...value,
        }));
    }

    /**
     * Save metrics to disk
     */
    async saveMetrics() {
        try {
            const current = this.getCurrentMetrics();
            const filename = `metrics-${new Date().toISOString().split('T')[0]}.json`;
            const filePath = path.join(this.metricsDir, filename);
            
            let existing = [];
            try {
                const data = await fs.readFile(filePath, 'utf-8');
                existing = JSON.parse(data);
            } catch {
                // File doesn't exist yet
            }
            
            existing.push(current);
            
            // Keep last 1000 entries
            if (existing.length > 1000) {
                existing = existing.slice(-1000);
            }
            
            await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
        } catch (error) {
            console.error('Failed to save metrics:', error);
        }
    }

    /**
     * Get health status
     */
    getHealthStatus() {
        const memUsage = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
        const cpuLoad = os.loadavg()[0];
        
        let status = 'healthy';
        let warnings = [];
        
        if (memUsage > 90) {
            status = 'critical';
            warnings.push('Memory usage above 90%');
        } else if (memUsage > 75) {
            status = 'warning';
            warnings.push('Memory usage above 75%');
        }
        
        if (cpuLoad > os.cpus().length * 0.8) {
            status = 'critical';
            warnings.push('CPU load too high');
        } else if (cpuLoad > os.cpus().length * 0.6) {
            if (status !== 'critical') status = 'warning';
            warnings.push('CPU load elevated');
        }
        
        return {
            status: status,
            warnings: warnings,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Format bytes
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format uptime
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${secs}s`);
        
        return parts.join(' ');
    }

    /**
     * Reset counters
     */
    resetCounters() {
        this.requestCount = 0;
        this.errorCount = 0;
    }
}

module.exports = new MonitoringService();
