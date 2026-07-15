/**
 * BUILD SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/build.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk keamanan build artifacts
 * Node.js build script untuk production
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');
const zlib = require('zlib');

// ============================================
// BASE64 UTILITY (Node.js version)
// ============================================
const Base64NodeUtil = {
  /**
   * Encode string ke Base64
   */
  encode(str) {
    return Buffer.from(str, 'utf-8').toString('base64');
  },

  /**
   * Decode Base64 ke string
   */
  decode(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  },

  /**
   * Encode object ke Base64
   */
  encodeObject(obj) {
    return this.encode(JSON.stringify(obj));
  },

  /**
   * Decode Base64 ke object
   */
  decodeObject(str) {
    return JSON.parse(this.decode(str));
  },

  /**
   * Encode file ke Base64
   */
  encodeFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  },

  /**
   * Decode Base64 ke file
   */
  decodeToFile(base64Str, outputPath) {
    const buffer = Buffer.from(base64Str, 'base64');
    fs.writeFileSync(outputPath, buffer);
  }
};

// ============================================
// BUILD CONFIGURATION
// ============================================
const CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  APP_BUILD: new Date().toISOString().split('T')[0],
  
  // Directories
  srcDir: './src',
  buildDir: './build',
  publicDir: './public',
  tempDir: './build/.temp',
  
  // Google Sheets Config (encoded)
  SPREADSHEET_ID_ENCODED: 'MUJ6dlh3RmJ0dWg5S2FJOVlkZVRWbGZfTlQ4dDdEY2I0V3pnM0hGWjZfSFE',
  API_BASE_URL: 'https://script.google.com/macros/s/AKfycbwblauw29Cv8rmrjQHhfXgdl0csBHlxO3xvZJimyBsSyA4F5f9qH25Ej5QYIu--OGy6Bw/exec',
  
  // Minification options
  minify: {
    js: true,
    css: true,
    html: true,
    images: false
  },
  
  // Bundle options
  bundle: {
    js: true,
    css: true
  },
  
  // Source maps
  sourceMaps: false,
  
  // Environment
  environment: 'production', // development | staging | production
  
  // Cache busting
  cacheBusting: true,
  
  // Compression
  gzip: true,
  
  // Integrity check
  generateIntegrity: true,
  
  // Files to copy as-is
  filesToCopy: [
    'manifest.json',
    'service-worker.js',
    'offline.html',
    '.htaccess',
    'robots.txt',
    'sitemap.xml',
    'favicon.ico'
  ],
  
  // JavaScript bundle order
  jsOrder: [
    'config.js',
    'constants.js',
    'utils/*.js',
    'state.js',
    'services/*.js',
    'router.js',
    'i18n.js',
    'pwa.js',
    'components/core/*.js',
    'components/ui/*.js',
    'components/data/*.js',
    'components/feedback/*.js',
    'components/charts/*.js',
    'components/specialized/*.js',
    'pages/auth/*.js',
    'pages/dashboard/*.js',
    'pages/surat-masuk/*.js',
    'pages/surat-keluar/*.js',
    'pages/disposisi/*.js',
    'pages/approval/*.js',
    'pages/users/*.js',
    'pages/reports/*.js',
    'pages/search/*.js',
    'pages/files/*.js',
    'pages/settings/*.js',
    'pages/audit-log/*.js',
    'pages/blockchain/*.js',
    'pages/notifications/*.js',
    'pages/ai/*.js',
    'pages/error/*.js',
    'app.js'
  ],
  
  // CSS bundle order
  cssOrder: [
    'tokens.css',
    'reset.css',
    'layout.css',
    'typography.css',
    'components.css',
    'forms.css',
    'tables.css',
    'cards.css',
    'modals.css',
    'notifications.css',
    'sidebar.css',
    'navbar.css',
    'content.css',
    'dashboard.css',
    'auth.css',
    'pages/*.css',
    'responsive.css',
    'themes.css',
    'animations.css',
    'print.css',
    'utilities.css'
  ],

  // Google Apps Script integration
  gasIntegration: {
    enabled: true,
    generateGasConfig: true,
    validateEndpoints: true
  }
};

// ============================================
// BUILD STATS
// ============================================
const buildStats = {
  startTime: null,
  endTime: null,
  files: {},
  warnings: [],
  errors: [],
  sheetsEndpoints: new Set()
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const BuildUtils = {
  /**
   * Create directory if not exists
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Get all files matching patterns
   */
  getFiles(patterns, baseDir) {
    const files = [];
    
    patterns.forEach(pattern => {
      if (pattern.includes('*')) {
        const dir = path.dirname(pattern);
        const ext = path.extname(pattern);
        const fullDir = path.join(baseDir, dir);
        
        if (fs.existsSync(fullDir)) {
          const walkDir = (currentDir) => {
            const items = fs.readdirSync(currentDir);
            items.forEach(item => {
              const itemPath = path.join(currentDir, item);
              const stat = fs.statSync(itemPath);
              
              if (stat.isDirectory()) {
                walkDir(itemPath);
              } else if (item.endsWith(ext)) {
                files.push(path.relative(baseDir, itemPath));
              }
            });
          };
          walkDir(fullDir);
        }
      } else {
        const filePath = path.join(baseDir, pattern);
        if (fs.existsSync(filePath)) {
          files.push(pattern);
        }
      }
    });
    
    return files;
  },

  /**
   * Format file size
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  /**
   * Generate SHA256 hash
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Generate integrity attribute
   */
  generateIntegrity(content) {
    const hash = crypto.createHash('sha384').update(content).digest('base64');
    return `sha384-${hash}`;
  },

  /**
   * Gzip content
   */
  gzipContent(content) {
    return zlib.gzipSync(content);
  },

  /**
   * Extract endpoints from JavaScript code
   */
  extractEndpoints(code) {
    const endpoints = new Set();
    const regex = /ENDPOINTS\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    const matches = code.matchAll(regex);
    
    for (const match of matches) {
      const endpointBlock = match[1];
      const actionRegex = /(\w+)\s*:\s*'([^']+)'/g;
      const actionMatches = endpointBlock.matchAll(actionRegex);
      
      for (const actionMatch of actionMatches) {
        endpoints.add(actionMatch[2]);
      }
    }
    
    return Array.from(endpoints);
  }
};

// ============================================
// BUILD DIRECTORY SETUP
// ============================================
function setupBuildDirectories() {
  console.log('📁 Setting up build directories...');
  
  // Clean build directory
  if (fs.existsSync(CONFIG.buildDir)) {
    fs.rmSync(CONFIG.buildDir, { recursive: true });
    console.log('  🗑️  Cleaned old build directory');
  }
  
  // Create build directories
  const dirs = [
    CONFIG.buildDir,
    CONFIG.tempDir,
    path.join(CONFIG.buildDir, 'css'),
    path.join(CONFIG.buildDir, 'js'),
    path.join(CONFIG.buildDir, 'assets', 'icons'),
    path.join(CONFIG.buildDir, 'assets', 'images'),
    path.join(CONFIG.buildDir, 'assets', 'fonts'),
    path.join(CONFIG.buildDir, 'assets', 'sounds'),
    path.join(CONFIG.buildDir, 'pages'),
    path.join(CONFIG.buildDir, 'data')
  ];
  
  dirs.forEach(dir => BuildUtils.ensureDir(dir));
  
  console.log('  ✅ Build directories created');
}

// ============================================
// JAVASCRIPT BUNDLING
// ============================================
async function bundleJavaScript() {
  console.log('\n📦 Bundling JavaScript...');
  
  const allJS = [];
  const fileList = [];
  
  for (const pattern of CONFIG.jsOrder) {
    const files = BuildUtils.getFiles([pattern], path.join(CONFIG.srcDir, 'js'));
    
    for (const file of files) {
      const filePath = path.join(CONFIG.srcDir, 'js', file);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        fileList.push(file);
        
        // Inject build info
        content = content.replace(
          /APP_BUILD:\s*'[^']*'/,
          `APP_BUILD: '${CONFIG.APP_BUILD}'`
        );
        
        // Set environment
        content = content.replace(
          /APP_ENV:\s*'[^']*'/,
          `APP_ENV: '${CONFIG.environment}'`
        );
        
        // Extract endpoints for Google Sheets validation
        if (CONFIG.gasIntegration.validateEndpoints) {
          const endpoints = BuildUtils.extractEndpoints(content);
          endpoints.forEach(ep => buildStats.sheetsEndpoints.add(ep));
        }
        
        allJS.push(`\n// ===== ${file} =====\n${content}`);
      }
    }
  }
  
  let bundled = allJS.join('\n');
  
  // Add build metadata
  const buildMeta = `
/**
 * Build: ${CONFIG.APP_BUILD}
 * Environment: ${CONFIG.environment}
 * Files bundled: ${fileList.length}
 * Generated: ${new Date().toISOString()}
 */
`;
  bundled = buildMeta + bundled;
  
  buildStats.files.js = {
    originalSize: bundled.length,
    fileCount: fileList.length,
    files: fileList
  };
  
  console.log(`  📄 ${fileList.length} files bundled`);
  console.log(`  📏 Original size: ${BuildUtils.formatSize(bundled.length)}`);
  
  // Minify
  if (CONFIG.minify.js) {
    console.log('  🔧 Minifying JavaScript...');
    
    try {
      const result = await minify(bundled, {
        compress: {
          drop_console: CONFIG.environment === 'production',
          drop_debugger: CONFIG.environment === 'production',
          passes: 2,
          pure_funcs: CONFIG.environment === 'production' ? ['console.log', 'console.debug', 'console.info'] : []
        },
        mangle: {
          toplevel: CONFIG.environment === 'production'
        },
        output: {
          comments: false,
          beautify: CONFIG.environment === 'development'
        },
        sourceMap: CONFIG.sourceMaps ? {
          filename: 'app.bundle.js.map',
          url: 'app.bundle.js.map'
        } : false
      });
      
      if (result.error) {
        buildStats.errors.push(`JavaScript minification: ${result.error}`);
        console.error('  ❌ Minification failed:', result.error);
      } else {
        bundled = result.code;
        
        // Generate integrity hash
        if (CONFIG.generateIntegrity) {
          buildStats.files.js.integrity = BuildUtils.generateIntegrity(bundled);
          buildStats.files.js.hash = BuildUtils.generateHash(bundled);
        }
        
        const minifiedSize = bundled.length;
        const reduction = ((1 - minifiedSize / buildStats.files.js.originalSize) * 100).toFixed(1);
        
        console.log(`  ✅ Minified: ${BuildUtils.formatSize(minifiedSize)} (${reduction}% reduction)`);
        
        buildStats.files.js.minifiedSize = minifiedSize;
      }
    } catch (error) {
      buildStats.errors.push(`JavaScript minification error: ${error.message}`);
      console.error('  ❌ Minification error:', error.message);
    }
  }
  
  // Write bundle
  const outputPath = path.join(CONFIG.buildDir, 'js', 'app.bundle.js');
  fs.writeFileSync(outputPath, bundled);
  
  // Generate Gzip version
  if (CONFIG.gzip) {
    const gzipped = BuildUtils.gzipContent(bundled);
    fs.writeFileSync(outputPath + '.gz', gzipped);
    buildStats.files.js.gzipSize = gzipped.length;
    console.log(`  📦 Gzipped: ${BuildUtils.formatSize(gzipped.length)}`);
  }
  
  console.log(`  ✅ JavaScript bundle created`);
}

// ============================================
// CSS BUNDLING
// ============================================
function bundleCSS() {
  console.log('\n📦 Bundling CSS...');
  
  const allCSS = [];
  const fileList = [];
  
  for (const pattern of CONFIG.cssOrder) {
    const files = BuildUtils.getFiles([pattern], path.join(CONFIG.srcDir, 'css'));
    
    for (const file of files) {
      const filePath = path.join(CONFIG.srcDir, 'css', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        fileList.push(file);
        allCSS.push(`\n/* ===== ${file} ===== */\n${content}`);
      }
    }
  }
  
  let bundled = allCSS.join('\n');
  
  buildStats.files.css = {
    originalSize: bundled.length,
    fileCount: fileList.length,
    files: fileList
  };
  
  console.log(`  📄 ${fileList.length} files bundled`);
  console.log(`  📏 Original size: ${BuildUtils.formatSize(bundled.length)}`);
  
  // Minify
  if (CONFIG.minify.css) {
    console.log('  🔧 Minifying CSS...');
    
    const cleaner = new CleanCSS({
      level: 2,
      sourceMap: CONFIG.sourceMaps
    });
    
    const result = cleaner.minify(bundled);
    
    if (result.errors.length > 0) {
      buildStats.errors.push(`CSS minification: ${result.errors.join(', ')}`);
      console.error('  ❌ Minification errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => buildStats.warnings.push(`CSS: ${w}`));
      console.warn('  ⚠️  Warnings:', result.warnings.length);
    }
    
    bundled = result.styles;
    
    // Generate integrity hash
    if (CONFIG.generateIntegrity) {
      buildStats.files.css.integrity = BuildUtils.generateIntegrity(bundled);
      buildStats.files.css.hash = BuildUtils.generateHash(bundled);
    }
    
    const minifiedSize = bundled.length;
    const reduction = ((1 - minifiedSize / buildStats.files.css.originalSize) * 100).toFixed(1);
    
    console.log(`  ✅ Minified: ${BuildUtils.formatSize(minifiedSize)} (${reduction}% reduction)`);
    
    buildStats.files.css.minifiedSize = minifiedSize;
  }
  
  // Write bundle
  const outputPath = path.join(CONFIG.buildDir, 'css', 'app.bundle.css');
  fs.writeFileSync(outputPath, bundled);
  
  // Generate Gzip version
  if (CONFIG.gzip) {
    const gzipped = BuildUtils.gzipContent(bundled);
    fs.writeFileSync(outputPath + '.gz', gzipped);
    buildStats.files.css.gzipSize = gzipped.length;
    console.log(`  📦 Gzipped: ${BuildUtils.formatSize(gzipped.length)}`);
  }
  
  console.log(`  ✅ CSS bundle created`);
}

// ============================================
// HTML PROCESSING
// ============================================
function processHTML() {
  console.log('\n📦 Processing HTML...');
  
  const htmlPath = path.join(CONFIG.srcDir, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    buildStats.errors.push('index.html not found');
    console.error('  ❌ index.html not found');
    return;
  }
  
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const originalSize = html.length;
  
  // Generate cache busting string
  const cacheBuster = CONFIG.cacheBusting ? `?v=${Date.now()}` : '';
  
  // Replace individual CSS/JS includes with bundled versions
  html = html.replace(
    /<link[^>]*rel="stylesheet"[^>]*href="\/src\/css\/[^"]*"[^>]*>/g,
    ''
  );
  
  html = html.replace(
    /<script[^>]*src="\/src\/js\/[^"]*"[^>]*><\/script>/g,
    ''
  );
  
  // Add integrity attributes if available
  const cssIntegrity = buildStats.files.css?.integrity || '';
  const jsIntegrity = buildStats.files.js?.integrity || '';
  
  const cssTag = `<link rel="stylesheet" href="/css/app.bundle.css${cacheBuster}"${cssIntegrity ? ` integrity="${cssIntegrity}" crossorigin="anonymous"` : ''}>`;
  const jsTag = `<script src="/js/app.bundle.js${cacheBuster}"${jsIntegrity ? ` integrity="${jsIntegrity}" crossorigin="anonymous"` : ''} defer></script>`;
  
  // Insert bundled files
  html = html.replace('</head>', `  ${cssTag}\n</head>`);
  html = html.replace('</body>', `  ${jsTag}\n</body>`);
  
  // Update asset paths
  html = html.replace(/\/src\/assets\//g, '/assets/');
  
  // Update page paths for SPA
  html = html.replace(/\/src\/pages\//g, '/pages/');
  
  // Add preload hints
  const preloads = `
  <link rel="preload" href="/css/app.bundle.css${cacheBuster}" as="style">
  <link rel="preload" href="/js/app.bundle.js${cacheBuster}" as="script">
  <link rel="preconnect" href="https://script.google.com">
  <link rel="dns-prefetch" href="https://script.google.com">
  `;
  
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n  ${preloads}`);
  
  // Add Google Sheets API preconnect
  html = html.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n  <link rel="preconnect" href="https://script.google.com">\n  <link rel="dns-prefetch" href="https://sheets.googleapis.com">');
  
  // Minify
  if (CONFIG.minify.html) {
    console.log('  🔧 Minifying HTML...');
    html = htmlMinifier.minify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
      processConditionalComments: true,
      removeAttributeQuotes: false,
      removeEmptyAttributes: true,
      collapseBooleanAttributes: true
    });
    
    const reduction = ((1 - html.length / originalSize) * 100).toFixed(1);
    console.log(`  ✅ Minified: ${BuildUtils.formatSize(html.length)} (${reduction}% reduction)`);
  }
  
  buildStats.files.html = {
    originalSize,
    minifiedSize: html.length
  };
  
  // Generate integrity
  if (CONFIG.generateIntegrity) {
    buildStats.files.html.hash = BuildUtils.generateHash(html);
  }
  
  // Write HTML
  fs.writeFileSync(path.join(CONFIG.buildDir, 'index.html'), html);
  
  // Generate Gzip version
  if (CONFIG.gzip) {
    const gzipped = BuildUtils.gzipContent(html);
    fs.writeFileSync(path.join(CONFIG.buildDir, 'index.html.gz'), gzipped);
    buildStats.files.html.gzipSize = gzipped.length;
    console.log(`  📦 Gzipped: ${BuildUtils.formatSize(gzipped.length)}`);
  }
  
  console.log(`  ✅ HTML processed`);
}

// ============================================
// ASSETS COPYING
// ============================================
function copyAssets() {
  console.log('\n📦 Copying assets...');
  
  let totalCopied = 0;
  
  // Copy icons
  const iconsDir = path.join(CONFIG.srcDir, 'assets', 'icons');
  if (fs.existsSync(iconsDir)) {
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
      const srcPath = path.join(iconsDir, icon);
      const destPath = path.join(CONFIG.buildDir, 'assets', 'icons', icon);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        totalCopied++;
      }
    });
    console.log(`  🎨 ${icons.length} icons copied`);
  }
  
  // Copy images
  const imagesDir = path.join(CONFIG.srcDir, 'assets', 'images');
  if (fs.existsSync(imagesDir)) {
    let imageCount = 0;
    const walkCopy = (dir, destBase) => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const destPath = path.join(destBase, item);
        
        if (fs.statSync(itemPath).isDirectory()) {
          BuildUtils.ensureDir(destPath);
          walkCopy(itemPath, destPath);
        } else {
          fs.copyFileSync(itemPath, destPath);
          imageCount++;
          totalCopied++;
        }
      });
    };
    walkCopy(imagesDir, path.join(CONFIG.buildDir, 'assets', 'images'));
    console.log(`  🖼️  ${imageCount} images copied`);
  }
  
  // Copy fonts
  const fontsDir = path.join(CONFIG.srcDir, 'assets', 'fonts');
  if (fs.existsSync(fontsDir)) {
    const fonts = fs.readdirSync(fontsDir);
    fonts.forEach(font => {
      const srcPath = path.join(fontsDir, font);
      const destPath = path.join(CONFIG.buildDir, 'assets', 'fonts', font);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        totalCopied++;
      }
    });
    console.log(`  🔤 ${fonts.length} fonts copied`);
  }
  
  // Copy sounds
  const soundsDir = path.join(CONFIG.srcDir, 'assets', 'sounds');
  if (fs.existsSync(soundsDir)) {
    const sounds = fs.readdirSync(soundsDir);
    sounds.forEach(sound => {
      const srcPath = path.join(soundsDir, sound);
      const destPath = path.join(CONFIG.buildDir, 'assets', 'sounds', sound);
      if (fs.statSync(srcPath).isFile()) {
        fs.copyFileSync(srcPath, destPath);
        totalCopied++;
      }
    });
    console.log(`  🔊 ${sounds.length} sounds copied`);
  }
  
  // Copy root files
  CONFIG.filesToCopy.forEach(file => {
    const srcPath = path.join('./', file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(CONFIG.buildDir, file));
      totalCopied++;
      console.log(`  📄 ${file} copied`);
    }
  });
  
  console.log(`  ✅ ${totalCopied} total assets copied`);
}

// ============================================
// GOOGLE APPS SCRIPT CONFIG GENERATION
// ============================================
function generateGasConfig() {
  if (!CONFIG.gasIntegration.generateGasConfig) return;
  
  console.log('\n📦 Generating Google Apps Script config...');
  
  const endpointsList = Array.from(buildStats.sheetsEndpoints).sort();
  
  const gasConfig = {
    version: CONFIG.APP_VERSION,
    build: CONFIG.APP_BUILD,
    environment: CONFIG.environment,
    sheets: {
      spreadsheetId: CONFIG.SPREADSHEET_ID_ENCODED,
      sheets: [
        'SuratMasuk',
        'SuratKeluar',
        'Disposisi',
        'Users',
        'MasterData',
        'Konfigurasi',
        'AuditLog',
        'Notifikasi',
        'Template',
        'Approval',
        'TTD',
        'Klasifikasi',
        'Arsip',
        'Retensi',
        'Reminder',
        'BackupLog',
        'ApiKeys',
        'Sessions',
        'Webhooks'
      ]
    },
    api: {
      baseUrl: CONFIG.API_BASE_URL,
      endpoints: endpointsList,
      totalEndpoints: endpointsList.length
    },
    buildInfo: {
      generatedAt: new Date().toISOString(),
      checksum: buildStats.files.js?.hash || '',
      integrity: {
        js: buildStats.files.js?.integrity || '',
        css: buildStats.files.css?.integrity || ''
      }
    }
  };
  
  // Write as JSON
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'data', 'gas-config.json'),
    JSON.stringify(gasConfig, null, 2)
  );
  
  // Write as Base64 encoded
  const encodedConfig = Base64NodeUtil.encodeObject(gasConfig);
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'data', 'gas-config.base64'),
    encodedConfig
  );
  
  console.log(`  ✅ GAS config generated (${endpointsList.length} endpoints mapped)`);
}

// ============================================
// SERVICE WORKER GENERATION
// ============================================
function generateServiceWorker() {
  console.log('\n📦 Generating Service Worker...');
  
  const swPath = path.join(CONFIG.buildDir, 'service-worker.js');
  
  // Create service worker if not exists
  if (!fs.existsSync(swPath)) {
    const cacheBuster = Date.now();
    const swContent = `
const CACHE_NAME = 'asd-v${CONFIG.APP_VERSION}-${cacheBuster}';
const RUNTIME_CACHE = 'asd-runtime-${cacheBuster}';

// Precached assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/app.bundle.css',
  '/js/app.bundle.js',
  '/assets/icons/logo.svg',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip Google Apps Script API calls
  if (event.request.url.includes('script.google.com')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache API responses
            if (!event.request.url.includes('/api/')) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});
`;
    
    fs.writeFileSync(swPath, swContent.trim());
    console.log('  ✅ Service worker created');
  } else {
    // Update existing service worker with cache busting
    let sw = fs.readFileSync(swPath, 'utf-8');
    
    const buildTimestamp = Date.now();
    sw = sw.replace(
      /const CACHE_NAME = '[^']*'/,
      `const CACHE_NAME = 'asd-v${CONFIG.APP_VERSION}-${buildTimestamp}'`
    );
    
    // Update precache URLs for bundled files
    sw = sw.replace(/\/src\/css\/[^'\"]+/g, '/css/app.bundle.css');
    sw = sw.replace(/\/src\/js\/[^'\"]+/g, '/js/app.bundle.js');
    
    fs.writeFileSync(swPath, sw);
    console.log('  ✅ Service worker updated with cache busting');
  }
}

// ============================================
// VERSION FILE GENERATION
// ============================================
function generateVersionFile() {
  console.log('\n📦 Generating version file...');
  
  const version = {
    app: CONFIG.APP_NAME,
    version: CONFIG.APP_VERSION,
    build: CONFIG.APP_BUILD,
    environment: CONFIG.environment,
    timestamp: new Date().toISOString(),
    files: {
      js: {
        path: 'js/app.bundle.js',
        size: buildStats.files.js?.minifiedSize || 0,
        integrity: buildStats.files.js?.integrity || '',
        hash: buildStats.files.js?.hash || ''
      },
      css: {
        path: 'css/app.bundle.css',
        size: buildStats.files.css?.minifiedSize || 0,
        integrity: buildStats.files.css?.integrity || '',
        hash: buildStats.files.css?.hash || ''
      },
      html: {
        path: 'index.html',
        size: buildStats.files.html?.minifiedSize || 0,
        hash: buildStats.files.html?.hash || ''
      }
    },
    gasIntegration: {
      endpoints: Array.from(buildStats.sheetsEndpoints).sort(),
      endpointCount: buildStats.sheetsEndpoints.size
    }
  };
  
  // Write JSON version
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'version.json'),
    JSON.stringify(version, null, 2)
  );
  
  // Write Base64 encoded version
  const encodedVersion = Base64NodeUtil.encodeObject(version);
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'data', 'version.base64'),
    encodedVersion
  );
  
  console.log('  ✅ Version file generated');
}

// ============================================
// BUILD REPORT GENERATION
// ============================================
function generateBuildReport() {
  console.log('\n📊 Generating build report...');
  
  const totalSize = (buildStats.files.js?.minifiedSize || 0) + 
                    (buildStats.files.css?.minifiedSize || 0) + 
                    (buildStats.files.html?.minifiedSize || 0);
  
  const totalGzipSize = (buildStats.files.js?.gzipSize || 0) + 
                        (buildStats.files.css?.gzipSize || 0) + 
                        (buildStats.files.html?.gzipSize || 0);
  
  const report = {
    app: CONFIG.APP_NAME,
    version: CONFIG.APP_VERSION,
    environment: CONFIG.environment,
    buildTime: buildStats.endTime.toISOString(),
    duration: `${((buildStats.endTime - buildStats.startTime) / 1000).toFixed(1)} seconds`,
    files: {
      js: {
        path: 'js/app.bundle.js',
        sourceFiles: buildStats.files.js?.fileCount || 0,
        originalSize: buildStats.files.js?.originalSize || 0,
        minifiedSize: buildStats.files.js?.minifiedSize || 0,
        gzipSize: buildStats.files.js?.gzipSize || 0,
        reduction: buildStats.files.js?.originalSize ? 
          `${((1 - (buildStats.files.js.minifiedSize / buildStats.files.js.originalSize)) * 100).toFixed(1)}%` : 'N/A',
        integrity: buildStats.files.js?.integrity || 'N/A'
      },
      css: {
        path: 'css/app.bundle.css',
        sourceFiles: buildStats.files.css?.fileCount || 0,
        originalSize: buildStats.files.css?.originalSize || 0,
        minifiedSize: buildStats.files.css?.minifiedSize || 0,
        gzipSize: buildStats.files.css?.gzipSize || 0,
        reduction: buildStats.files.css?.originalSize ?
          `${((1 - (buildStats.files.css.minifiedSize / buildStats.files.css.originalSize)) * 100).toFixed(1)}%` : 'N/A',
        integrity: buildStats.files.css?.integrity || 'N/A'
      },
      html: {
        path: 'index.html',
        originalSize: buildStats.files.html?.originalSize || 0,
        minifiedSize: buildStats.files.html?.minifiedSize || 0,
        gzipSize: buildStats.files.html?.gzipSize || 0
      }
    },
    totals: {
      size: BuildUtils.formatSize(totalSize),
      gzipSize: BuildUtils.formatSize(totalGzipSize),
      endpoints: buildStats.sheetsEndpoints.size
    },
    warnings: buildStats.warnings,
    errors: buildStats.errors
  };
  
  // Write JSON report
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Write Base64 encoded report
  const encodedReport = Base64NodeUtil.encodeObject(report);
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'data', 'build-report.base64'),
    encodedReport
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 BUILD REPORT');
  console.log('='.repeat(60));
  console.log(`⏱️  Duration: ${report.duration}`);
  console.log(`📦 Total Size: ${report.totals.size} (Gzip: ${report.totals.gzipSize})`);
  console.log(`🔗 GAS Endpoints: ${report.totals.endpoints}`);
  console.log('');
  console.log('📄 JavaScript:');
  console.log(`   Files: ${report.files.js.sourceFiles}`);
  console.log(`   Size: ${BuildUtils.formatSize(report.files.js.minifiedSize)} (Gzip: ${BuildUtils.formatSize(report.files.js.gzipSize)})`);
  console.log(`   Reduction: ${report.files.js.reduction}`);
  console.log('');
  console.log('🎨 CSS:');
  console.log(`   Files: ${report.files.css.sourceFiles}`);
  console.log(`   Size: ${BuildUtils.formatSize(report.files.css.minifiedSize)} (Gzip: ${BuildUtils.formatSize(report.files.css.gzipSize)})`);
  console.log(`   Reduction: ${report.files.css.reduction}`);
  
  if (buildStats.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${buildStats.warnings.length}`);
  }
  
  if (buildStats.errors.length > 0) {
    console.log(`\n❌ Errors: ${buildStats.errors.length}`);
  }
  
  console.log('='.repeat(60));
}

// ============================================
// CLEANUP
// ============================================
function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  // Remove temp directory
  if (fs.existsSync(CONFIG.tempDir)) {
    fs.rmSync(CONFIG.tempDir, { recursive: true });
    console.log('  🗑️  Temp directory removed');
  }
  
  // Remove empty directories
  const removeEmptyDirs = (dir) => {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        removeEmptyDirs(itemPath);
      }
    });
    
    const remaining = fs.readdirSync(dir);
    if (remaining.length === 0 && dir !== CONFIG.buildDir) {
      fs.rmdirSync(dir);
    }
  };
  
  removeEmptyDirs(CONFIG.buildDir);
  
  console.log('  ✅ Cleanup complete');
}

// ============================================
// MAIN BUILD FUNCTION
// ============================================
async function build() {
  buildStats.startTime = new Date();
  
  console.log('🚀 Starting build for ' + CONFIG.APP_NAME + ' v' + CONFIG.APP_VERSION);
  console.log('📅 Build Date: ' + CONFIG.APP_BUILD);
  console.log('🔧 Environment: ' + CONFIG.environment);
  
  try {
    // Setup directories
    setupBuildDirectories();
    
    // Bundle CSS first (faster)
    bundleCSS();
    
    // Bundle JavaScript (async for terser)
    await bundleJavaScript();
    
    // Process HTML
    processHTML();
    
    // Copy assets
    copyAssets();
    
    // Generate GAS config
    generateGasConfig();
    
    // Generate service worker
    generateServiceWorker();
    
    // Generate version file
    generateVersionFile();
    
    // Cleanup
    cleanup();
    
    // Set end time
    buildStats.endTime = new Date();
    
    // Generate report
    generateBuildReport();
    
    console.log('\n✅ Build complete!');
    console.log(`📁 Output: ${path.resolve(CONFIG.buildDir)}\n`);
    
  } catch (error) {
    buildStats.errors.push(`Build failed: ${error.message}`);
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// ============================================
// RUN BUILD
// ============================================
// Check if running directly
if (require.main === module) {
  build().catch(console.error);
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  build,
  CONFIG,
  BuildUtils,
  Base64NodeUtil,
  bundleJavaScript,
  bundleCSS,
  processHTML,
  copyAssets,
  generateGasConfig,
  generateServiceWorker,
  generateVersionFile,
  generateBuildReport
};
