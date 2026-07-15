/**
 * WATCH SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/watch.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk komunikasi dan konfigurasi
 * Development file watcher with live reload & GAS integration
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

// Try to load WebSocket
let WebSocket;
try {
  WebSocket = require('ws');
} catch (e) {
  console.log('⚠️  ws module not found. Installing...');
  console.log('   Run: npm install ws');
  console.log('   Live reload will be disabled.\n');
}

// ============================================
// BASE64 UTILITY (Node.js version)
// ============================================
const Base64NodeUtil = {
  encode(str) {
    return Buffer.from(str, 'utf-8').toString('base64');
  },
  decode(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
  },
  encodeObject(obj) {
    return this.encode(JSON.stringify(obj));
  },
  decodeObject(str) {
    try {
      return JSON.parse(this.decode(str));
    } catch {
      return null;
    }
  },
  encodeFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  }
};

// ============================================
// WATCH CONFIGURATION
// ============================================
const WATCH_CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  
  // Server
  server: {
    port: 8080,
    host: 'localhost',
    https: false,
    httpsKey: null,
    httpsCert: null,
    cors: true,
    cache: false,
    cacheMaxAge: 0 // No cache in development
  },
  
  // Directories
  directories: {
    src: './src',
    build: './build',
    dist: './dist',
    public: './public',
    tests: './tests'
  },
  
  // Watch configuration
  watch: {
    dirs: [
      './src/css',
      './src/js',
      './src/pages',
      './src/components',
      './src/services',
      './src/assets',
      './src/pages/**/*.html'
    ],
    extensions: [
      '.css', '.js', '.html', '.htm',
      '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
      '.json', '.xml', '.txt',
      '.woff', '.woff2', '.ttf', '.eot'
    ],
    exclude: [
      'node_modules/**',
      '.git/**',
      '**/*.min.*',
      '**/*.bundle.*',
      '**/*.test.*',
      '**/build/**',
      '**/dist/**'
    ],
    debounceDelay: 300,
    usePolling: false,
    pollingInterval: 1000
  },
  
  // Live Reload
  livereload: {
    enabled: true,
    port: 35729,
    scriptPath: '/livereload.js',
    injectScript: true,
    fullReload: true,
    cssReload: true,
    jsReload: true
  },
  
  // Google Apps Script integration
  gas: {
    enabled: true,
    watchGasFiles: true,
    gasFiles: ['code.gs', 'appsscript.json', '.clasp.json'],
    autoPush: false, // Auto push to GAS on change
    claspEnabled: false
  },
  
  // Google Sheets integration
  sheets: {
    enabled: true,
    mockApi: true,
    mockDelay: 200, // Simulate network delay
    apiBaseUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
    cacheMockResponses: true
  },
  
  // Auto-build on change
  build: {
    enabled: false,
    autoMinify: false,
    runValidation: false,
    command: null // Custom build command
  },
  
  // Notifications
  notifications: {
    enabled: true,
    console: true,
    sound: false,
    desktop: false
  },
  
  // Proxy (for API mocking)
  proxy: {
    enabled: true,
    target: null, // Proxy API calls to another server
    mockEndpoints: true
  },
  
  // Logging
  logging: {
    verbose: false,
    timestamp: true,
    colors: true,
    showFileSize: true
  }
};

// ============================================
// WATCH STATE
// ============================================
const watchState = {
  startTime: null,
  clients: [],
  livereloadClients: [],
  fileWatchers: [],
  changeHistory: [],
  errorCount: 0,
  mockApiResponses: {},
  gasFilesModified: false
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const WatchUtils = {
  /**
   * Format timestamp
   */
  timestamp() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour12: false });
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
   * Colored console output
   */
  log(color, message) {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
      reset: '\x1b[0m'
    };

    const timestamp = WATCH_CONFIG.logging.timestamp ? 
      `[${WatchUtils.timestamp()}] ` : '';
    
    if (WATCH_CONFIG.logging.colors && colors[color]) {
      console.log(`${timestamp}${colors[color]}${message}${colors.reset}`);
    } else {
      console.log(`${timestamp}${message}`);
    }
  },

  /**
   * Get MIME type for file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.xml': 'application/xml; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.txt': 'text/plain; charset=utf-8',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  },

  /**
   * Check if file should be watched
   */
  shouldWatch(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative('.', filePath);
    
    // Check extension
    if (!WATCH_CONFIG.watch.extensions.includes(ext)) return false;
    
    // Check exclude patterns
    for (const pattern of WATCH_CONFIG.watch.exclude) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*') + '$'
      );
      if (regex.test(relativePath)) return false;
    }
    
    return true;
  },

  /**
   * Inject livereload script into HTML
   */
  injectLiveReloadScript(html) {
    if (!WATCH_CONFIG.livereload.enabled || !WATCH_CONFIG.livereload.injectScript) {
      return html;
    }

    const script = `
<!-- Live Reload - Development Only -->
<script>
(function() {
  var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  var host = window.location.hostname;
  var port = ${WATCH_CONFIG.livereload.port};
  var wsUrl = protocol + '//' + host + ':' + port + '/livereload';
  
  var ws;
  var reconnectTimer;
  var reconnectDelay = 1000;
  
  function connect() {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      console.log('%c🔄 Live Reload Connected%c', 'color: #4CAF50; font-weight: bold;', '');
      clearTimeout(reconnectTimer);
      reconnectDelay = 1000;
    };
    
    ws.onmessage = function(event) {
      var data = JSON.parse(event.data);
      
      if (data.command === 'reload') {
        console.log('%c🔄 Reloading...%c', 'color: #FF9800; font-weight: bold;', '');
        window.location.reload();
      } else if (data.command === 'reloadCSS' && data.file) {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(function(link) {
          var href = link.getAttribute('href');
          if (href && href.indexOf(data.file) !== -1) {
            var newHref = href.replace(/\\?.*$/, '') + '?v=' + Date.now();
            link.setAttribute('href', newHref);
            console.log('%c🎨 CSS Reloaded:%c ' + data.file, 'color: #2196F3;', '');
          }
        });
      }
    };
    
    ws.onclose = function() {
      console.log('%c🔌 Live Reload Disconnected%c', 'color: #F44336;', '');
      reconnectTimer = setTimeout(function() {
        console.log('%c🔄 Reconnecting...%c', 'color: #FF9800;', '');
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connect();
      }, reconnectDelay);
    };
    
    ws.onerror = function() {
      // Silent error - will auto reconnect
    };
  }
  
  connect();
})();
</script>
<!-- /Live Reload -->
`;
    
    // Inject before </body>
    if (html.includes('</body>')) {
      return html.replace('</body>', script + '\n</body>');
    }
    
    // Inject before </html>
    if (html.includes('</html>')) {
      return html.replace('</html>', script + '\n</html>');
    }
    
    // Append to end
    return html + '\n' + script;
  },

  /**
   * Generate mock API response
   */
  generateMockResponse(action, params = {}) {
    const mockResponses = {
      'ping': { status: 'success', message: 'API Mock Running', timestamp: Date.now() },
      'login': {
        status: 'success',
        data: {
          token: Base64NodeUtil.encodeObject({ userId: 'dev-user', sessionId: 'dev-session', expiresAt: Date.now() + 3600000 }),
          csrf: Base64NodeUtil.encode('dev-csrf-token'),
          user: { id: 'dev-1', username: 'developer', role: 'admin', namaLengkap: 'Developer' }
        }
      },
      'dashboard.stats': {
        status: 'success',
        data: {
          suratMasuk: { total: 150, bulanIni: 25, pending: 10 },
          suratKeluar: { total: 120, bulanIni: 20, pending: 8 },
          disposisi: { total: 200, bulanIni: 35, pending: 15 }
        }
      },
      'suratMasuk.list': {
        status: 'success',
        data: {
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `sm-${i + 1}`,
            nomorSurat: `SM-${String(i + 1).padStart(3, '0')}/2024`,
            pengirim: `Dinas ${String.fromCharCode(65 + i)}`,
            perihal: `Surat Undangan ${i + 1}`,
            tanggalSurat: new Date().toISOString().split('T')[0],
            status: ['diterima', 'diproses', 'selesai'][i % 3]
          })),
          pagination: { page: 1, limit: 10, total: 150, totalPages: 15 }
        }
      }
    };

    return mockResponses[action] || { 
      status: 'error', 
      message: `Mock not found for action: ${action}` 
    };
  }
};

// ============================================
// HTTP SERVER
// ============================================
function createServer() {
  const port = WATCH_CONFIG.server.port;
  const host = WATCH_CONFIG.server.host;
  
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });
  
  server.listen(port, host, () => {
    console.log('');
    WatchUtils.log('green', '='.repeat(60));
    WatchUtils.log('green', `🚀 ${WATCH_CONFIG.APP_NAME} v${WATCH_CONFIG.APP_VERSION}`);
    WatchUtils.log('green', '='.repeat(60));
    WatchUtils.log('cyan', `🌐 Development Server:`);
    WatchUtils.log('white', `   Local:   http://${host}:${port}`);
    WatchUtils.log('white', `   Network: http://${getLocalIP()}:${port}`);
    
    if (WATCH_CONFIG.livereload.enabled) {
      WatchUtils.log('cyan', `🔄 Live Reload: ws://${host}:${WATCH_CONFIG.livereload.port}`);
    }
    
    if (WATCH_CONFIG.sheets.mockApi) {
      WatchUtils.log('cyan', `📋 API Mock: Enabled`);
    }
    
    if (WATCH_CONFIG.gas.enabled) {
      WatchUtils.log('cyan', `📝 GAS Watch: ${WATCH_CONFIG.gas.watchGasFiles ? 'Enabled' : 'Disabled'}`);
    }
    
    WatchUtils.log('green', '='.repeat(60));
    WatchUtils.log('gray', `   Press Ctrl+C to stop`);
    console.log('');
  });
  
  // Handle errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      WatchUtils.log('red', `❌ Port ${port} is already in use. Trying port ${port + 1}...`);
      WATCH_CONFIG.server.port = port + 1;
      createServer();
    } else {
      WatchUtils.log('red', `❌ Server error: ${error.message}`);
    }
  });
  
  return server;
}

/**
 * Handle HTTP request
 */
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // CORS headers
  if (WATCH_CONFIG.server.cors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
  }
  
  // Cache control
  if (!WATCH_CONFIG.server.cache) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Handle livereload script
  if (pathname === WATCH_CONFIG.livereload.scriptPath) {
    serveLiveReloadScript(res);
    return;
  }
  
  // Handle API mock
  if (WATCH_CONFIG.sheets.mockApi && pathname.includes('script.google.com')) {
    handleMockAPI(req, res, url);
    return;
  }
  
  // Handle Google Sheets API proxy
  if (WATCH_CONFIG.proxy.enabled && WATCH_CONFIG.proxy.mockEndpoints) {
    const action = url.searchParams.get('action');
    if (action) {
      handleMockAPI(req, res, url);
      return;
    }
  }
  
  // Serve static files
  serveStaticFile(pathname, res);
}

/**
 * Serve static file
 */
function serveStaticFile(pathname, res) {
  // Normalize path
  let filePath = pathname === '/' ? '/index.html' : pathname;
  
  // Remove leading slash
  filePath = filePath.replace(/^\//, '');
  
  // Try multiple directories
  const searchPaths = [
    path.join(WATCH_CONFIG.directories.src, filePath),
    path.join(WATCH_CONFIG.directories.build, filePath),
    path.join(WATCH_CONFIG.directories.dist, filePath),
    path.join(WATCH_CONFIG.directories.public, filePath),
    path.join('.', filePath)
  ];
  
  let served = false;
  
  for (const fullPath of searchPaths) {
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const stats = fs.statSync(fullPath);
      const mimeType = WatchUtils.getMimeType(fullPath);
      
      let content = fs.readFileSync(fullPath);
      
      // Inject livereload for HTML files
      if (mimeType.includes('text/html') && WATCH_CONFIG.livereload.enabled) {
        content = WatchUtils.injectLiveReloadScript(content.toString());
        content = Buffer.from(content);
      }
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': content.length,
        'Last-Modified': stats.mtime.toUTCString()
      });
      
      res.end(content);
      served = true;
      
      if (WATCH_CONFIG.logging.verbose) {
        const size = WATCH_CONFIG.logging.showFileSize ? 
          ` (${WatchUtils.formatSize(content.length)})` : '';
        WatchUtils.log('gray', `  📄 ${pathname} → ${path.relative('.', fullPath)}${size}`);
      }
      
      break;
    }
  }
  
  // Try directory index
  if (!served) {
    for (const dirPath of [
      WATCH_CONFIG.directories.src,
      WATCH_CONFIG.directories.build,
      WATCH_CONFIG.directories.public
    ]) {
      const indexPath = path.join(dirPath, filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf-8');
        
        if (WATCH_CONFIG.livereload.enabled) {
          content = WatchUtils.injectLiveReloadScript(content);
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        served = true;
        break;
      }
    }
  }
  
  // SPA fallback - serve index.html for all non-file routes
  if (!served) {
    const spaPaths = [
      path.join(WATCH_CONFIG.directories.src, 'index.html'),
      path.join(WATCH_CONFIG.directories.build, 'index.html'),
      path.join('.', 'index.html')
    ];
    
    for (const spaPath of spaPaths) {
      if (fs.existsSync(spaPath)) {
        let content = fs.readFileSync(spaPath, 'utf-8');
        
        if (WATCH_CONFIG.livereload.enabled) {
          content = WatchUtils.injectLiveReloadScript(content);
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
        served = true;
        break;
      }
    }
  }
  
  // 404
  if (!served) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 - Not Found</title></head>
      <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
        <h1>404 - File Not Found</h1>
        <p>${pathname}</p>
        <p><a href="/">Go to Home</a></p>
      </body>
      </html>
    `);
  }
}

/**
 * Handle mock API requests
 */
function handleMockAPI(req, res, url) {
  const action = url.searchParams.get('action');
  const dataParam = url.searchParams.get('data');
  
  let params = {};
  if (dataParam) {
    try {
      params = Base64NodeUtil.decodeObject(dataParam) || {};
    } catch (e) {
      // Not base64 encoded
    }
  }
  
  // Simulate network delay
  const delay = WATCH_CONFIG.sheets.mockDelay || 200;
  
  setTimeout(() => {
    const mockResponse = WatchUtils.generateMockResponse(action, params);
    
    const responsePayload = Base64NodeUtil.encodeObject({
      ...mockResponse,
      timestamp: Date.now(),
      mock: true
    });
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    
    res.end(JSON.stringify({
      payload: responsePayload,
      status: mockResponse.status || 'success'
    }));
    
    if (WATCH_CONFIG.logging.verbose) {
      WatchUtils.log('magenta', `  📋 Mock API: ${action}`);
    }
  }, delay);
}

/**
 * Serve livereload script
 */
function serveLiveReloadScript(res) {
  const script = `
// Live Reload Client Script
(function() {
  var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  var wsUrl = protocol + '//' + window.location.hostname + ':${WATCH_CONFIG.livereload.port}/livereload';
  
  var ws;
  var reconnectTimer;
  
  function connect() {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
      console.log('%c🔄 Live Reload Connected%c', 'color: green; font-weight: bold', '');
    };
    
    ws.onmessage = function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.command === 'reload') {
          window.location.reload();
        } else if (data.command === 'reloadCSS') {
          var links = document.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(function(link) {
            var url = new URL(link.href);
            url.searchParams.set('_t', Date.now());
            link.href = url.toString();
          });
        }
      } catch(e) {}
    };
    
    ws.onclose = function() {
      reconnectTimer = setTimeout(connect, 1000);
    };
  }
  
  connect();
})();
`;
  
  res.writeHead(200, { 'Content-Type': 'application/javascript' });
  res.end(script);
}

// ============================================
// LIVE RELOAD WEBSOCKET SERVER
// ============================================
function createLiveReloadServer() {
  if (!WebSocket || !WATCH_CONFIG.livereload.enabled) return null;
  
  const lrPort = WATCH_CONFIG.livereload.port;
  
  const wss = new WebSocket.Server({ port: lrPort });
  
  wss.on('connection', (ws) => {
    watchState.livereloadClients.push(ws);
    WatchUtils.log('green', '🔗 Live Reload client connected');
    
    ws.on('close', () => {
      watchState.livereloadClients = watchState.livereloadClients.filter(c => c !== ws);
      WatchUtils.log('yellow', '🔌 Live Reload client disconnected');
    });
    
    ws.on('error', (error) => {
      WatchUtils.log('red', `Live Reload error: ${error.message}`);
    });
  });
  
  wss.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      WatchUtils.log('yellow', `⚠️  Live Reload port ${lrPort} in use. Trying ${lrPort + 1}...`);
      WATCH_CONFIG.livereload.port = lrPort + 1;
      return createLiveReloadServer();
    }
  });
  
  return wss;
}

/**
 * Notify livereload clients
 */
function notifyLiveReloadClients(command, file = null) {
  const message = JSON.stringify({
    command: command,
    file: file,
    timestamp: Date.now()
  });
  
  watchState.livereloadClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  // Clean up disconnected clients
  watchState.livereloadClients = watchState.livereloadClients.filter(
    client => client.readyState === WebSocket.OPEN
  );
}

// ============================================
// FILE WATCHER
// ============================================
function startFileWatcher() {
  WatchUtils.log('cyan', '👀 Starting file watcher...\n');
  
  // Watch directories
  const watchDirs = WATCH_CONFIG.watch.dirs.map(dir => path.resolve(dir));
  
  // Filter to existing directories
  const existingDirs = watchDirs.filter(dir => {
    if (fs.existsSync(dir)) return true;
    WatchUtils.log('yellow', `⚠️  Directory not found: ${dir}`);
    return false;
  });
  
  if (existingDirs.length === 0) {
    WatchUtils.log('red', '❌ No directories to watch');
    return;
  }
  
  WatchUtils.log('white', `   Watching ${existingDirs.length} directories:`);
  existingDirs.forEach(dir => {
    WatchUtils.log('gray', `   📁 ${path.relative('.', dir)}`);
  });
  console.log('');
  
  // Setup watchers
  existingDirs.forEach(dir => {
    try {
      const watcher = fs.watch(dir, { 
        recursive: true,
        persistent: true
      }, (eventType, filename) => {
        if (!filename) return;
        
        const fullPath = path.join(dir, filename);
        
        // Check if file should be watched
        if (!WatchUtils.shouldWatch(fullPath)) return;
        
        handleFileChange(eventType, fullPath, filename);
      });
      
      watchState.fileWatchers.push(watcher);
      
      watcher.on('error', (error) => {
        WatchUtils.log('red', `Watcher error on ${dir}: ${error.message}`);
      });
      
    } catch (error) {
      WatchUtils.log('red', `Failed to watch ${dir}: ${error.message}`);
    }
  });
  
  // Watch GAS files
  if (WATCH_CONFIG.gas.enabled && WATCH_CONFIG.gas.watchGasFiles) {
    watchGASFiles();
  }
}

/**
 * Handle file change
 */
function handleFileChange(eventType, fullPath, filename) {
  // Debounce
  if (watchState._debounceTimer) {
    clearTimeout(watchState._debounceTimer);
  }
  
  watchState._debounceTimer = setTimeout(() => {
    const ext = path.extname(filename).toLowerCase();
    const relativePath = path.relative('.', fullPath);
    
    // Log change
    const eventIcon = eventType === 'rename' ? '🗑️' : '📝';
    const eventColor = eventType === 'rename' ? 'yellow' : 'white';
    
    WatchUtils.log(eventColor, `${eventIcon} ${eventType}: ${relativePath}`);
    
    // Record change
    watchState.changeHistory.push({
      event: eventType,
      file: relativePath,
      ext: ext,
      timestamp: Date.now()
    });
    
    // Limit history
    if (watchState.changeHistory.length > 100) {
      watchState.changeHistory = watchState.changeHistory.slice(-100);
    }
    
    // Handle CSS changes - inject without full reload
    if (ext === '.css' && WATCH_CONFIG.livereload.cssReload) {
      notifyLiveReloadClients('reloadCSS', filename);
      return;
    }
    
    // Handle JS changes
    if (ext === '.js' && WATCH_CONFIG.livereload.jsReload) {
      // Auto-build if enabled
      if (WATCH_CONFIG.build.enabled && WATCH_CONFIG.build.autoMinify) {
        runAutoBuild(fullPath);
      }
      
      // Run validation if enabled
      if (WATCH_CONFIG.build.runValidation) {
        runQuickValidation(fullPath);
      }
    }
    
    // Handle GAS file changes
    if (WATCH_CONFIG.gas.watchGasFiles && 
        WATCH_CONFIG.gas.gasFiles.includes(path.basename(filename))) {
      watchState.gasFilesModified = true;
      WatchUtils.log('magenta', `📝 GAS file modified: ${filename}`);
      
      if (WATCH_CONFIG.gas.autoPush) {
        autoPushToGAS(filename);
      }
    }
    
    // Full reload for other changes
    if (WATCH_CONFIG.livereload.fullReload) {
      notifyLiveReloadClients('reload');
    }
    
  }, WATCH_CONFIG.watch.debounceDelay);
}

/**
 * Watch Google Apps Script files
 */
function watchGASFiles() {
  WATCH_CONFIG.gas.gasFiles.forEach(file => {
    const filePath = path.resolve(file);
    
    if (fs.existsSync(filePath)) {
      WatchUtils.log('gray', `   📝 Watching GAS: ${file}`);
      
      fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          WatchUtils.log('magenta', `📝 GAS file changed: ${file}`);
          watchState.gasFilesModified = true;
          
          if (WATCH_CONFIG.gas.autoPush) {
            autoPushToGAS(file);
          }
        }
      });
    }
  });
}

/**
 * Auto push to Google Apps Script
 */
function autoPushToGAS(filename) {
  if (!WATCH_CONFIG.gas.claspEnabled) return;
  
  WatchUtils.log('cyan', `📤 Auto-pushing ${filename} to GAS...`);
  
  try {
    execSync('npx clasp push', { 
      stdio: 'pipe',
      timeout: 30000 
    });
    WatchUtils.log('green', `✅ Pushed ${filename} to GAS`);
  } catch (error) {
    WatchUtils.log('red', `❌ GAS push failed: ${error.message}`);
  }
}

/**
 * Run auto build on file change
 */
function runAutoBuild(filePath) {
  if (WATCH_CONFIG.build.command) {
    try {
      execSync(WATCH_CONFIG.build.command, { stdio: 'pipe' });
      WatchUtils.log('green', '✅ Auto-build complete');
    } catch (error) {
      WatchUtils.log('red', `❌ Auto-build failed: ${error.message}`);
    }
  }
}

/**
 * Run quick validation
 */
function runQuickValidation(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Quick syntax check for JS
    if (filePath.endsWith('.js')) {
      try {
        new Function(content);
      } catch (error) {
        WatchUtils.log('red', `❌ Syntax error in ${path.basename(filePath)}: ${error.message}`);
        watchState.errorCount++;
      }
    }
    
    // Quick JSON check
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (error) {
        WatchUtils.log('red', `❌ JSON error in ${path.basename(filePath)}: ${error.message}`);
        watchState.errorCount++;
      }
    }
  } catch (error) {
    // File might have been deleted
  }
}

// ============================================
// NETWORK UTILITIES
// ============================================
function getLocalIP() {
  const interfaces = require('os').networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// ============================================
// SHUTDOWN HANDLER
// ============================================
function handleShutdown(server, lrServer) {
  const shutdown = () => {
    console.log('');
    WatchUtils.log('yellow', '👋 Shutting down...');
    
    // Close file watchers
    watchState.fileWatchers.forEach(watcher => watcher.close());
    
    // Close livereload
    if (lrServer) {
      lrServer.close();
    }
    
    // Close HTTP server
    if (server) {
      server.close();
    }
    
    // Show stats
    const totalChanges = watchState.changeHistory.length;
    WatchUtils.log('white', `📊 Changes detected: ${totalChanges}`);
    WatchUtils.log('white', `❌ Errors: ${watchState.errorCount}`);
    
    WatchUtils.log('green', '✅ Shutdown complete');
    
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('SIGHUP', shutdown);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    WatchUtils.log('red', `❌ Uncaught error: ${error.message}`);
    console.error(error.stack);
    watchState.errorCount++;
  });
}

// ============================================
// MAIN WATCH FUNCTION
// ============================================
function startWatcher() {
  watchState.startTime = Date.now();
  
  WatchUtils.log('cyan', `🔧 ${WATCH_CONFIG.APP_NAME} v${WATCH_CONFIG.APP_VERSION}`);
  WatchUtils.log('cyan', '🚀 Starting development environment...\n');
  
  try {
    // Create HTTP server
    const server = createServer();
    
    // Create livereload server
    const lrServer = createLiveReloadServer();
    
    // Start file watcher
    startFileWatcher();
    
    // Handle shutdown
    handleShutdown(server, lrServer);
    
  } catch (error) {
    WatchUtils.log('red', `❌ Failed to start: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// CLI PARSING
// ============================================
function parseArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        WATCH_CONFIG.server.port = parseInt(args[++i]);
        break;
      case '--host':
        WATCH_CONFIG.server.host = args[++i];
        break;
      case '--no-livereload':
        WATCH_CONFIG.livereload.enabled = false;
        break;
      case '--no-mock':
        WATCH_CONFIG.sheets.mockApi = false;
        break;
      case '--no-gas':
        WATCH_CONFIG.gas.enabled = false;
        break;
      case '--auto-build':
        WATCH_CONFIG.build.enabled = true;
        WATCH_CONFIG.build.autoMinify = true;
        break;
      case '--auto-push':
        WATCH_CONFIG.gas.autoPush = true;
        WATCH_CONFIG.gas.claspEnabled = true;
        break;
      case '--verbose':
      case '-v':
        WATCH_CONFIG.logging.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
}

function printHelp() {
  console.log(`
🔧 Arsip Surat Digital Enterprise - Watch Script v${WATCH_CONFIG.APP_VERSION}

Usage: node tools/watch.js [options]

Options:
  -p, --port <port>     Server port (default: 8080)
  --host <host>         Server host (default: localhost)
  --no-livereload       Disable live reload
  --no-mock             Disable API mocking
  --no-gas              Disable GAS file watching
  --auto-build          Enable auto-build on file change
  --auto-push           Auto-push GAS files on change
  -v, --verbose         Verbose logging
  -h, --help            Show this help

Examples:
  node tools/watch.js                     # Start dev server with defaults
  node tools/watch.js -p 3000             # Custom port
  node tools/watch.js --no-mock           # Disable API mocking
  node tools/watch.js --auto-build -v     # Auto-build with verbose logging
`);
}

// ============================================
// RUN WATCHER
// ============================================
if (require.main === module) {
  parseArgs();
  startWatcher();
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  startWatcher,
  createServer,
  createLiveReloadServer,
  startFileWatcher,
  WatchUtils,
  WATCH_CONFIG,
  Base64NodeUtil
};
