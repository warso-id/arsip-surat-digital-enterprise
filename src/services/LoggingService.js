// ==================== LOGGING SERVICE ====================
// Arsip Surat Digital Enterprise
// Centralized logging service

const fs = require('fs').promises;
const path = require('path');
const winston = require('winston');
const config = require('../config/app');

class LoggingService {
    constructor() {
        this.logDir = path.join(__dirname, '..', '..', 'storage', 'logs');
        this.logger = null;
        this.initialized = false;
    }

    /**
     * Initialize logger
     */
    async initialize() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });

            this.logger = winston.createLogger({
                level: config.logging.channels.daily.level || 'info',
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.errors({ stack: true }),
                    winston.format.json()
                ),
                defaultMeta: { service: config.app.name },
                transports: [
                    new winston.transports.File({
                        filename: path.join(this.logDir, 'error.log'),
                        level: 'error',
                        maxsize: 5242880,
                        maxFiles: 5,
                    }),
                    new winston.transports.File({
                        filename: path.join(this.logDir, 'combined.log'),
                        maxsize: 10485760,
                        maxFiles: 10,
                    }),
                ],
            });

            if (config.app.env !== 'production') {
                this.logger.add(new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }));
            }

            this.initialized = true;
            console.log('Logging service initialized');
        } catch (error) {
            console.error('Logging service initialization failed:', error);
        }
    }

    /**
     * Log info message
     */
    info(message, meta = {}) {
        if (this.initialized) {
            this.logger.info(message, meta);
        } else {
            console.log(`[INFO] ${message}`, meta);
        }
    }

    /**
     * Log error message
     */
    error(message, error = null, meta = {}) {
        if (this.initialized) {
            this.logger.error(message, { ...meta, error: error?.stack || error });
        } else {
            console.error(`[ERROR] ${message}`, error, meta);
        }
    }

    /**
     * Log warning message
     */
    warn(message, meta = {}) {
        if (this.initialized) {
            this.logger.warn(message, meta);
        } else {
            console.warn(`[WARN] ${message}`, meta);
        }
    }

    /**
     * Log debug message
     */
    debug(message, meta = {}) {
        if (this.initialized && config.app.debug) {
            this.logger.debug(message, meta);
        }
    }

    /**
     * Log HTTP request
     */
    logRequest(req, res, duration) {
        this.info('HTTP Request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.id,
        });
    }

    /**
     * Log database query
     */
    logQuery(sql, params, duration) {
        if (config.app.debug) {
            this.debug('Database Query', {
                sql: sql.substring(0, 200),
                params: params,
                duration: `${duration}ms`,
            });
        }
    }

    /**
     * Get recent logs
     */
    async getRecentLogs(level = 'error', limit = 50) {
        try {
            const logFile = path.join(this.logDir, `${level}.log`);
            const content = await fs.readFile(logFile, 'utf-8');
            const lines = content.trim().split('\n');
            const recent = lines.slice(-limit);
            
            return recent.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { message: line };
                }
            });
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear old logs
     */
    async clearOldLogs(days = 30) {
        try {
            const files = await fs.readdir(this.logDir);
            const now = Date.now();
            let cleaned = 0;

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (age > days) {
                    await fs.unlink(filePath);
                    cleaned++;
                }
            }

            this.info(`Cleaned ${cleaned} old log files`);
            return cleaned;
        } catch (error) {
            this.error('Failed to clean old logs', error);
            return 0;
        }
    }

    /**
     * Get log statistics
     */
    async getStats() {
        try {
            const files = await fs.readdir(this.logDir);
            let totalSize = 0;
            let totalLines = 0;

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                totalSize += stats.size;

                const content = await fs.readFile(filePath, 'utf-8');
                totalLines += content.split('\n').filter(l => l.trim()).length;
            }

            return {
                files: files.length,
                totalSize: this.formatSize(totalSize),
                totalLines: totalLines,
                directory: this.logDir,
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = new LoggingService();
