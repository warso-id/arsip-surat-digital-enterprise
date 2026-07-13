/**
 * WATCH SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Development file watcher with live reload
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const CONFIG = {
  port: 8080,
  srcDir: './src',
  buildDir: './build',
  watchDirs: ['./src/css', './src/js', './src/assets'],
  watchExtensions: ['.css', '.js', '.html', '.svg', '.png', '.jpg', '.json'],
  debounceDelay: 300
};

let clients = [];
let debounceTimer = null;

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(CONFIG.srcDir, url);
  
  // Try src first, then build
  const paths = [
    path.join(CONFIG.srcDir, url),
    path.join(CONFIG.buildDir, url)
  ];
  
  let served = false;
  
  for (const p of paths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const ext = path.extname(p);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2'
      };
      
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      fs.createReadStream(p).pipe(res);
      served = true;
      break;
    }
  }
  
  if (!served) {
    // Inject livereload script into HTML
    if (url.endsWith('.html') || url === '/') {
      const htmlPath = path.join(CONFIG.srcDir, 'index.html');
      if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf-8');
        html += `
          <script>
            (function() {
              var ws = new WebSocket('ws://localhost:${CONFIG.port}/ws');
              ws.onmessage = function(msg) {
                if (msg.data === 'reload') {
                  window.location.reload();
                }
              };
            })();
          </script>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        served = true;
      }
    }
  }
  
  if (!served) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Create WebSocket server for live reload
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('🔗 Client connected');
  
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
    console.log('🔌 Client disconnected');
  });
});

function notifyClients() {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
}

// Watch files for changes
function watchFiles() {
  console.log('👀 Watching for changes...\n');
  
  CONFIG.watchDirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    
    if (!fs.existsSync(fullPath)) return;
    
    fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      
      const ext = path.extname(filename);
      if (!CONFIG.watchExtensions.includes(ext)) return;
      
      // Debounce
      if (debounceTimer) clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(() => {
        console.log(`📝 File changed: ${filename}`);
        notifyClients();
      }, CONFIG.debounceDelay);
    });
  });
}

// Start server
server.listen(CONFIG.port, () => {
  console.log('🔧 Development Server');
  console.log(`   Local: http://localhost:${CONFIG.port}`);
  console.log(`   Press Ctrl+C to stop\n`);
  
  watchFiles();
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  wss.close();
  server.close();
  process.exit(0);
});
