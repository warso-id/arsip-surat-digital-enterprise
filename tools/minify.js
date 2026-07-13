
## FILE TOOLS TAMBAHAN

### **tools/minify.js** (Minification Script)
```javascript
/**
 * MINIFY SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Standalone minification tool
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

const CONFIG = {
  srcDir: './src',
  distDir: './dist',
  minify: {
    js: true,
    css: true
  },
  sourceMaps: false
};

async function minifyJS(inputPath, outputPath) {
  console.log(`📦 Minifying JS: ${inputPath}`);
  
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    
    const result = await minify(code, {
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
      },
      sourceMap: CONFIG.sourceMaps
    });
    
    if (result.error) {
      console.error(`❌ Failed to minify ${inputPath}:`, result.error);
      return;
    }
    
    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, result.code);
    
    const originalSize = fs.statSync(inputPath).size;
    const minifiedSize = Buffer.byteLength(result.code);
    const savings = Math.round((1 - minifiedSize / originalSize) * 100);
    
    console.log(`  ✅ Minified: ${formatSize(originalSize)} → ${formatSize(minifiedSize)} (${savings}% saved)`);
    
  } catch (error) {
    console.error(`❌ Error minifying ${inputPath}:`, error.message);
  }
}

function minifyCSS(inputPath, outputPath) {
  console.log(`📦 Minifying CSS: ${inputPath}`);
  
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    
    const cleaner = new CleanCSS({
      level: 2,
      sourceMap: CONFIG.sourceMaps
    });
    
    const result = cleaner.minify(code);
    
    if (result.errors.length > 0) {
      console.error('CSS Errors:', result.errors);
      return;
    }
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, result.styles);
    
    const originalSize = fs.statSync(inputPath).size;
    const minifiedSize = Buffer.byteLength(result.styles);
    const savings = Math.round((1 - minifiedSize / originalSize) * 100);
    
    console.log(`  ✅ Minified: ${formatSize(originalSize)} → ${formatSize(minifiedSize)} (${savings}% saved)`);
    
  } catch (error) {
    console.error(`❌ Error minifying ${inputPath}:`, error.message);
  }
}

function minifyAll(directory, ext, processor) {
  const files = getAllFiles(directory, ext);
  
  files.forEach(file => {
    const relativePath = path.relative(CONFIG.srcDir, file);
    const outputPath = path.join(CONFIG.distDir, relativePath);
    processor(file, outputPath);
  });
}

function getAllFiles(dir, ext, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      getAllFiles(fullPath, ext, files);
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// Run
console.log('🔧 Starting minification...\n');

if (CONFIG.minify.js) {
  minifyAll('./src/js', '.js', minifyJS);
}

if (CONFIG.minify.css) {
  minifyAll('./src/css', '.css', minifyCSS);
}

console.log('\n✅ Minification complete');
