/**
 * BUILD SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Node.js build script untuk production
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');

// Configuration
const CONFIG = {
  srcDir: './src',
  buildDir: './build',
  publicDir: './public',
  
  minify: {
    js: true,
    css: true,
    html: true,
    images: false
  },
  
  bundle: {
    js: true,
    css: true
  },
  
  sourceMaps: false,
  
  filesToCopy: [
    'manifest.json',
    'service-worker.js',
    'offline.html',
    '.htaccess',
    'robots.txt',
    'sitemap.xml'
  ],
  
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
    'pages/**/*.js',
    'app.js'
  ],
  
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
  ]
};

// Create build directory
function createBuildDir() {
  if (!fs.existsSync(CONFIG.buildDir)) {
    fs.mkdirSync(CONFIG.buildDir, { recursive: true });
  }
  
  // Create subdirectories
  const subDirs = ['css', 'js', 'assets/icons', 'assets/images', 'assets/fonts', 'assets/sounds'];
  subDirs.forEach(dir => {
    const fullPath = path.join(CONFIG.buildDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
}

// Get all files matching patterns
function getFiles(patterns, baseDir) {
  const files = [];
  
  patterns.forEach(pattern => {
    if (pattern.includes('*')) {
      // Glob pattern
      const dir = path.dirname(pattern);
      const ext = path.extname(pattern);
      const fullDir = path.join(baseDir, dir);
      
      if (fs.existsSync(fullDir)) {
        const dirFiles = fs.readdirSync(fullDir)
          .filter(f => f.endsWith(ext))
          .map(f => path.join(dir, f));
        files.push(...dirFiles);
      }
    } else {
      files.push(pattern);
    }
  });
  
  return files;
}

// Bundle and minify JavaScript
async function bundleJS() {
  console.log('📦 Bundling JavaScript...');
  
  const allJS = [];
  
  for (const pattern of CONFIG.jsOrder) {
    const files = getFiles([pattern], CONFIG.srcDir);
    
    for (const file of files) {
      const filePath = path.join(CONFIG.srcDir, 'js', file.replace('js/', ''));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        allJS.push(`// ${file}\n${content}`);
      }
    }
  }
  
  let bundled = allJS.join('\n\n');
  
  if (CONFIG.minify.js) {
    console.log('  🔧 Minifying JavaScript...');
    try {
      const result = await minify(bundled, {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2
        },
        mangle: {
          toplevel: true
        },
        output: {
          comments: false
        }
      });
      
      if (result.error) {
        console.error('  ❌ JavaScript minification failed:', result.error);
      } else {
        bundled = result.code;
        console.log(`  ✅ JavaScript minified: ${(bundled.length / 1024).toFixed(1)} KB`);
      }
    } catch (error) {
      console.error('  ❌ JavaScript minification error:', error.message);
    }
  }
  
  fs.writeFileSync(path.join(CONFIG.buildDir, 'js/app.bundle.js'), bundled);
  console.log(`  ✅ JavaScript bundle created: ${(bundled.length / 1024).toFixed(1)} KB`);
}

// Bundle and minify CSS
function bundleCSS() {
  console.log('📦 Bundling CSS...');
  
  const allCSS = [];
  
  for (const pattern of CONFIG.cssOrder) {
    const files = getFiles([pattern], CONFIG.srcDir);
    
    for (const file of files) {
      const filePath = path.join(CONFIG.srcDir, 'css', file.replace('css/', ''));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        allCSS.push(`/* ${file} */\n${content}`);
      }
    }
  }
  
  let bundled = allCSS.join('\n\n');
  
  if (CONFIG.minify.css) {
    console.log('  🔧 Minifying CSS...');
    const cleaner = new CleanCSS({
      level: 2,
      sourceMap: CONFIG.sourceMaps
    });
    
    const result = cleaner.minify(bundled);
    
    if (result.errors.length > 0) {
      console.error('  ❌ CSS minification errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.warn('  ⚠️ CSS warnings:', result.warnings);
    }
    
    bundled = result.styles;
    console.log(`  ✅ CSS minified: ${(bundled.length / 1024).toFixed(1)} KB`);
  }
  
  fs.writeFileSync(path.join(CONFIG.buildDir, 'css/app.bundle.css'), bundled);
  console.log(`  ✅ CSS bundle created: ${(bundled.length / 1024).toFixed(1)} KB`);
}

// Minify HTML
function minifyHTML() {
  console.log('📦 Processing HTML...');
  
  const htmlPath = path.join(CONFIG.srcDir, 'index.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('  ❌ index.html not found');
    return;
  }
  
  let html = fs.readFileSync(htmlPath, 'utf-8');
  
  // Replace individual CSS/JS includes with bundled versions
  html = html.replace(
    /<link rel="stylesheet" href="\/src\/css\/[^"]+">(\s*\n\s*)*/g,
    '<link rel="stylesheet" href="/css/app.bundle.css">\n'
  );
  
  html = html.replace(
    /<script src="\/src\/js\/[^"]+"><\/script>(\s*\n\s*)*/g,
    '<script src="/js/app.bundle.js"></script>\n'
  );
  
  // Update asset paths
  html = html.replace(/\/src\/assets\//g, '/assets/');
  
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
      minifyJS: true
    });
    console.log(`  ✅ HTML minified: ${(html.length / 1024).toFixed(1)} KB`);
  }
  
  fs.writeFileSync(path.join(CONFIG.buildDir, 'index.html'), html);
  console.log('  ✅ HTML processed');
}

// Copy assets
function copyAssets() {
  console.log('📦 Copying assets...');
  
  // Copy icons
  const iconsDir = path.join(CONFIG.srcDir, 'assets/icons');
  if (fs.existsSync(iconsDir)) {
    const icons = fs.readdirSync(iconsDir);
    icons.forEach(icon => {
      fs.copyFileSync(
        path.join(iconsDir, icon),
        path.join(CONFIG.buildDir, 'assets/icons', icon)
      );
    });
    console.log(`  ✅ Copied ${icons.length} icons`);
  }
  
  // Copy images
  const imagesDir = path.join(CONFIG.srcDir, 'assets/images');
  if (fs.existsSync(imagesDir)) {
    const images = fs.readdirSync(imagesDir, { recursive: true });
    images.forEach(image => {
      if (fs.statSync(path.join(imagesDir, image)).isFile()) {
        const destDir = path.join(CONFIG.buildDir, 'assets/images', path.dirname(image));
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(
          path.join(imagesDir, image),
          path.join(CONFIG.buildDir, 'assets/images', image)
        );
      }
    });
    console.log(`  ✅ Copied images`);
  }
  
  // Copy fonts
  const fontsDir = path.join(CONFIG.srcDir, 'assets/fonts');
  if (fs.existsSync(fontsDir)) {
    const fonts = fs.readdirSync(fontsDir);
    fonts.forEach(font => {
      fs.copyFileSync(
        path.join(fontsDir, font),
        path.join(CONFIG.buildDir, 'assets/fonts', font)
      );
    });
    console.log(`  ✅ Copied ${fonts.length} fonts`);
  }
  
  // Copy sounds
  const soundsDir = path.join(CONFIG.srcDir, 'assets/sounds');
  if (fs.existsSync(soundsDir)) {
    const sounds = fs.readdirSync(soundsDir);
    sounds.forEach(sound => {
      fs.copyFileSync(
        path.join(soundsDir, sound),
        path.join(CONFIG.buildDir, 'assets/sounds', sound)
      );
    });
    console.log(`  ✅ Copied ${sounds.length} sounds`);
  }
  
  // Copy other files
  CONFIG.filesToCopy.forEach(file => {
    const srcPath = path.join('./', file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(CONFIG.buildDir, file));
      console.log(`  ✅ Copied ${file}`);
    }
  });
}

// Generate version file
function generateVersion() {
  const version = {
    version: '3.2.2',
    build: new Date().toISOString(),
    files: {
      js: 'js/app.bundle.js',
      css: 'css/app.bundle.css',
      html: 'index.html'
    }
  };
  
  fs.writeFileSync(
    path.join(CONFIG.buildDir, 'version.json'),
    JSON.stringify(version, null, 2)
  );
  console.log('📦 Version file generated');
}

// Generate service worker with cache busting
function generateServiceWorker() {
  const swPath = path.join(CONFIG.buildDir, 'service-worker.js');
  
  if (fs.existsSync(swPath)) {
    let sw = fs.readFileSync(swPath, 'utf-8');
    
    // Update cache name with build timestamp
    const buildTimestamp = Date.now();
    sw = sw.replace(
      /const CACHE_NAME = '[^']+'/,
      `const CACHE_NAME = 'asd-v3.2.2-${buildTimestamp}'`
    );
    
    // Update precache URLs for bundled files
    sw = sw.replace(
      /\/src\/css\/[^']+/g,
      '/css/app.bundle.css'
    );
    sw = sw.replace(
      /\/src\/js\/[^']+/g,
      '/js/app.bundle.js'
    );
    
    fs.writeFileSync(swPath, sw);
    console.log('📦 Service worker updated with cache busting');
  }
}

// Generate build report
function generateReport(startTime) {
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  const report = {
    buildTime: new Date().toISOString(),
    duration: `${duration.toFixed(1)} seconds`,
    files: {}
  };
  
  // Calculate file sizes
  const buildDir = CONFIG.buildDir;
  
  function getDirSize(dir) {
    let size = 0;
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir, { recursive: true });
      files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile()) {
          size += fs.statSync(filePath).size;
        }
      });
    }
    return size;
  }
  
  report.totalSize = getDirSize(buildDir);
  report.totalSizeFormatted = formatSize(report.totalSize);
  
  if (fs.existsSync(path.join(buildDir, 'js/app.bundle.js'))) {
    report.files.js = formatSize(fs.statSync(path.join(buildDir, 'js/app.bundle.js')).size);
  }
  
  if (fs.existsSync(path.join(buildDir, 'css/app.bundle.css'))) {
    report.files.css = formatSize(fs.statSync(path.join(buildDir, 'css/app.bundle.css')).size);
  }
  
  if (fs.existsSync(path.join(buildDir, 'index.html'))) {
    report.files.html = formatSize(fs.statSync(path.join(buildDir, 'index.html')).size);
  }
  
  fs.writeFileSync(
    path.join(buildDir, 'build-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📊 Build Report:');
  console.log(`  ⏱️  Duration: ${report.duration}`);
  console.log(`  📦 Total Size: ${report.totalSizeFormatted}`);
  if (report.files.js) console.log(`  📄 JS Bundle: ${report.files.js}`);
  if (report.files.css) console.log(`  🎨 CSS Bundle: ${report.files.css}`);
  if (report.files.html) console.log(`  🌐 HTML: ${report.files.html}`);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// Main build function
async function build() {
  const startTime = Date.now();
  
  console.log('🚀 Starting build for Arsip Surat Digital Enterprise v3.2.2\n');
  
  try {
    // Create build directory
    createBuildDir();
    
    // Bundle and minify
    if (CONFIG.bundle.css) {
      bundleCSS();
    }
    
    if (CONFIG.bundle.js) {
      await bundleJS();
    }
    
    // Process HTML
    minifyHTML();
    
    // Copy assets
    copyAssets();
    
    // Generate files
    generateVersion();
    generateServiceWorker();
    
    // Generate report
    generateReport(startTime);
    
    console.log('\n✅ Build complete!');
    console.log(`📁 Output: ${path.resolve(CONFIG.buildDir)}`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build
build();
