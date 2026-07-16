// ==================== APPLICATION ENTRY POINT ====================
// Arsip Surat Digital Enterprise v2.1.0

require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config/app');

// ==================== INITIALIZE APP ====================
const app = express();

// ==================== BASIC MIDDLEWARE ====================
// Security headers
app.use(helmet({
    contentSecurityPolicy: config.security.helmet.contentSecurityPolicy,
}));

// CORS
app.use(cors({
    origin: config.security.cors.origins,
    methods: config.security.cors.methods,
    allowedHeaders: config.security.cors.allowedHeaders,
    credentials: config.security.cors.credentials,
}));

// Rate limiting
if (config.security.rateLimit.enabled) {
    const limiter = rateLimit({
        windowMs: config.security.rateLimit.windowMs,
        max: config.security.rateLimit.max,
        message: {
            success: false,
            message: config.security.rateLimit.message,
        },
    });
    app.use('/api', limiter);
}

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(path.join(__dirname, 'storage', 'app')));

// Logging
if (config.app.env !== 'test') {
    app.use(morgan('combined', {
        stream: fs.createWriteStream(
            path.join(__dirname, 'storage', 'logs', 'access.log'),
            { flags: 'a' }
        ),
    }));
    if (config.app.debug) {
        app.use(morgan('dev'));
    }
}

// ==================== VIEW ENGINE ====================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// View helpers
app.locals = {
    appName: config.app.name,
    appVersion: config.app.version,
    currentYear: new Date().getFullYear(),
    formatDate: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    },
};

// ==================== DATABASE SETUP ====================
let db;
try {
    const Database = require('better-sqlite3');
    const dbPath = config.database.sqlite.path;
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Make db accessible globally
    global.db = db;
    
    console.log('Database connected:', dbPath);
} catch (error) {
    console.error('Database connection failed:', error.message);
    // Continue without database for static pages
}

// ==================== ROUTES ====================
// Web routes
const webRoutes = require('./routes/web');
app.use('/', webRoutes);

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// ==================== HEALTH CHECK ====================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
    });
});

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint tidak ditemukan',
        });
    }
    res.status(404).render('errors/404', {
        title: '404 - Halaman Tidak Ditemukan',
        layout: 'layouts/error',
    });
});

// 500 handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    // Log error
    const logPath = path.join(__dirname, 'storage', 'logs', 'error.log');
    const logMessage = `[${new Date().toISOString()}] ${err.stack}\n`;
    fs.appendFileSync(logPath, logMessage);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
            success: false,
            message: config.app.debug ? err.message : 'Terjadi kesalahan server',
        });
    }
    
    res.status(500).render('errors/500', {
        title: '500 - Kesalahan Server',
        layout: 'layouts/error',
        error: config.app.debug ? err : null,
    });
});

// ==================== START SERVER ====================
const PORT = config.app.port;
const HOST = config.app.host;

if (require.main === module) {
    app.listen(PORT, HOST, () => {
        console.log('========================================');
        console.log(`  ${config.app.name}`);
        console.log(`  Version: ${config.app.version}`);
        console.log(`  Environment: ${config.app.env}`);
        console.log(`  Server: http://${HOST}:${PORT}`);
        console.log('========================================');
    });
}

module.exports = app;
