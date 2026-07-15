require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { Model } = require('objection');
const Knex = require('knex');

// Import configurations
const appConfig = require('./config/app');
const knexConfig = require('./config/database');

// Initialize database
const environment = process.env.NODE_ENV || 'development';
const knex = Knex(knexConfig[environment]);
Model.knex(knex);

// Import routes
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web');

// Initialize Express app
const app = express();

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: appConfig.cors.origin,
  methods: appConfig.cors.methods,
  allowedHeaders: appConfig.cors.allowedHeaders,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
  }
});
app.use('/api/', limiter);

// ==================== GENERAL MIDDLEWARE ====================
// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(path.join(__dirname, '../storage/app')));

// Logging
if (appConfig.env !== 'test') {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '../storage/logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Access log stream
  const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
  );
  
  app.use(morgan('combined', { stream: accessLogStream }));
  app.use(morgan('dev'));
}

// ==================== DATABASE CONNECTION CHECK ====================
app.use(async (req, res, next) => {
  try {
    await knex.raw('SELECT 1');
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database connection error',
      error: appConfig.debug ? error.message : 'Internal Server Error'
    });
  }
});

// ==================== ROUTES ====================
// API Routes
app.use('/api', apiRoutes);

// Web Routes
app.use('/', webRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await knex.raw('SELECT 1');
    res.json({
      success: true,
      message: 'Arsip Surat Digital Enterprise is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: appConfig.env,
      version: require('../package.json').version,
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Service Unavailable',
      database: 'disconnected'
    });
  }
});

// ==================== ERROR HANDLING ====================
// 404 handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Route ${req.method} ${req.path} tidak ditemukan`
    });
  }
  
  res.status(404).sendFile(path.join(__dirname, 'views/errors/404.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: err.details || err.message
    });
  }

  // Database error
  if (err.name === 'DatabaseError') {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      error: appConfig.debug ? err.message : 'Internal Server Error'
    });
  }

  // File upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Ukuran file terlalu besar'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: appConfig.debug ? err.stack : undefined
  });
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  await knex.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing HTTP server...');
  await knex.destroy();
  process.exit(0);
});

// ==================== START SERVER ====================
const PORT = appConfig.port;

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`🚀 ${appConfig.name}`);
  console.log(`📡 Environment: ${appConfig.env}`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
});

module.exports = app;
