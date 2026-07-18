require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
const appConfig = require('./config/app');

// Import routes
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web');

// Create Express app
const app = express();

// ========== MIDDLEWARE ==========

// Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "*"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors(appConfig.cors));

// Compression
app.use(compression());

// Logging
if (appConfig.app.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Session
app.use(session({
    ...appConfig.session,
    store: new (require('express-session')).MemoryStore()
}));

// View engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// API routes
app.use('/api', apiRoutes);

// Web routes
app.use('/', webRoutes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            status: 'error',
            message: 'API endpoint tidak ditemukan'
        });
    }
    res.status(404).render('errors/404', {
        title: 'Halaman Tidak Ditemukan',
        layout: 'layouts/auth'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Handle multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            status: 'error',
            message: 'Ukuran file terlalu besar'
        });
    }

    // Handle Sequelize errors
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validasi database gagal',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            status: 'error',
            message: 'Data duplikat',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token tidak valid'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token sudah kadaluarsa'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = appConfig.app.env === 'development' 
        ? err.message 
        : 'Terjadi kesalahan internal server';

    if (req.path.startsWith('/api/')) {
        return res.status(statusCode).json({
            status: 'error',
            message: message,
            ...(appConfig.app.env === 'development' && { stack: err.stack })
        });
    }

    res.status(statusCode).render('errors/500', {
        title: 'Server Error',
        message: message,
        layout: 'layouts/auth'
    });
});

// ========== START SERVER ==========

const PORT = appConfig.app.port;

async function startServer() {
    try {
        // Test database connection
        await testConnection();
        
        // Sync database models (in development)
        if (appConfig.app.env === 'development') {
            await sequelize.sync({ alter: true });
            console.log('Database synced successfully');
        }

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${appConfig.app.env}`);
            console.log(`URL: ${appConfig.app.url}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down gracefully...');
    await sequelize.close();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
