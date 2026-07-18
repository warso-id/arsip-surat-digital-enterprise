const compression = require('compression');

class CompressMiddleware {
    static handle() {
        return compression({
            // Compress all responses
            filter: (req, res) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                return compression.filter(req, res);
            },
            // Compression level (0-9)
            level: 6,
            // Minimum size to compress (bytes)
            threshold: 1024
        });
    }
}

module.exports = CompressMiddleware;
