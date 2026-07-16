// ==================== REQUEST LOGGER MIDDLEWARE ====================
// Arsip Surat Digital Enterprise

const loggingService = require('../services/LoggingService');
const monitoringService = require('../services/MonitoringService');

class RequestLogger {
    /**
     * Log all incoming requests
     */
    static log() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            // Track request
            monitoringService.trackRequest();
            
            // Log request body (sanitized)
            if (req.body && Object.keys(req.body).length > 0) {
                const sanitizedBody = { ...req.body };
                // Remove sensitive fields
                delete sanitizedBody.password;
                delete sanitizedBody.token;
                delete sanitizedBody.secret;
                
                loggingService.debug('Request Body', {
                    method: req.method,
                    url: req.originalUrl,
                    body: sanitizedBody,
                });
            }
            
            // Capture response
            const originalSend = res.send;
            res.send = function(body) {
                const duration = Date.now() - startTime;
                
                // Log response
                loggingService.logRequest(req, res, duration);
                
                // Track errors
                if (res.statusCode >= 400) {
                    monitoringService.trackError();
                    
                    if (res.statusCode >= 500) {
                        loggingService.error('Server Error Response', null, {
                            method: req.method,
                            url: req.originalUrl,
                            status: res.statusCode,
                            duration: `${duration}ms`,
                        });
                    }
                }
                
                return originalSend.call(this, body);
            };
            
            next();
        };
    }

    /**
     * Log only API requests
     */
    static logApi() {
        return (req, res, next) => {
            if (req.path.startsWith('/api/')) {
                return RequestLogger.log()(req, res, next);
            }
            next();
        };
    }

    /**
     * Log only errors
     */
    static logErrors() {
        return (err, req, res, next) => {
            loggingService.error('Unhandled Error', err, {
                method: req.method,
                url: req.originalUrl,
                body: req.body,
                params: req.params,
                query: req.query,
            });
            
            monitoringService.trackError();
            next(err);
        };
    }

    /**
     * Log slow requests
     */
    static logSlowRequests(thresholdMs = 1000) {
        return (req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                
                if (duration > thresholdMs) {
                    loggingService.warn('Slow Request', {
                        method: req.method,
                        url: req.originalUrl,
                        duration: `${duration}ms`,
                        threshold: `${thresholdMs}ms`,
                    });
                }
            });
            
            next();
        };
    }
}

module.exports = RequestLogger;
