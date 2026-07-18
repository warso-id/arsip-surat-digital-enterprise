const LogAktivitas = require('../../Models/LogAktivitas');

class AuditMiddleware {
    /**
     * Log all API requests
     */
    static logRequest(req, res, next) {
        const startTime = Date.now();

        // Capture response
        const originalJson = res.json;
        res.json = function(body) {
            res.locals.responseBody = body;
            return originalJson.call(this, body);
        };

        // Log after response
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const logData = {
                user_id: req.user ? req.user.id : null,
                aksi: `${req.method} ${req.path}`,
                modul: req.baseUrl.replace('/api/', ''),
                deskripsi: `${req.method} request to ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`,
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
                data_baru: {
                    method: req.method,
                    url: req.originalUrl,
                    status: res.statusCode,
                    duration: duration,
                    query: req.query,
                    params: req.params
                }
            };

            // Log only for non-GET requests or errors
            if (req.method !== 'GET' || res.statusCode >= 400) {
                LogAktivitas.log(logData).catch(err => {
                    console.error('Error logging audit:', err);
                });
            }
        });

        next();
    }

    /**
     * Log specific actions
     */
    static logAction(action, module) {
        return async (req, res, next) => {
            try {
                const logData = {
                    user_id: req.user ? req.user.id : null,
                    aksi: action,
                    modul: module,
                    deskripsi: `${action} on ${module}`,
                    ip_address: req.ip,
                    user_agent: req.get('user-agent')
                };

                await LogAktivitas.log(logData);
                next();
            } catch (error) {
                console.error('Error in audit middleware:', error);
                next();
            }
        };
    }

    /**
     * Log changes (for update/delete operations)
     */
    static logChanges(modelName) {
        return async (req, res, next) => {
            try {
                const originalSend = res.json;
                
                res.json = async function(body) {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const logData = {
                            user_id: req.user ? req.user.id : null,
                            aksi: req.method.toLowerCase(),
                            modul: modelName,
                            deskripsi: `${req.method} ${modelName} with ID: ${req.params.id}`,
                            ip_address: req.ip,
                            user_agent: req.get('user-agent'),
                            data_baru: req.body
                        };

                        if (req.method === 'PUT' || req.method === 'PATCH') {
                            logData.data_lama = req.originalData;
                        }

                        await LogAktivitas.log(logData);
                    }
                    
                    return originalSend.call(this, body);
                };

                next();
            } catch (error) {
                console.error('Error in changes audit middleware:', error);
                next();
            }
        };
    }
}

module.exports = AuditMiddleware;
