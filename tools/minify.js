/**
 * MINIFY SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/minify.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk keamanan dan kompatibilitas
 * Standalone & integrated minification tool
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
    return JSON.parse(this.decode(str));
  },
  encodeFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  },
  decodeToFile(base64Str, outputPath) {
    const buffer = Buffer.from(base64Str, 'base64');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
  }
};

// ============================================
// MINIFY CONFIGURATION
// ============================================
const MINIFY_CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  
  // Directories
  srcDir: './src',
  distDir: './dist',
  buildDir: './build',
  tempDir: './temp',
  
  // File types to process
  processTypes: {
    js: true,
    css: true,
    html: true,
    json: false,
    svg: false
  },
  
  // JavaScript minification options
  jsOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      passes: 2,
      pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
      keep_fargs: false,
      unsafe_math: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true
    },
    mangle: {
      toplevel: true,
      reserved: [
        // Reserved for Google Apps Script compatibility
        'google', 'script', 'run', 'withSuccessHandler', 'withFailureHandler',
        // Reserved for Google Sheets
        'SpreadsheetApp', 'Sheet', 'Range',
        // Reserved for app
        'APP_CONFIG', 'Base64Util', 'store', 'router', 'api'
      ]
    },
    output: {
      comments: false,
      beautify: false,
      indent_level: 0,
      keep_quoted_props: true
    },
    sourceMap: false,
    ecma: 2020,
    module: false,
    toplevel: true,
    ie8: false,
    safari10: false
  },
  
  // CSS minification options
  cssOptions: {
    level: 2,
    sourceMap: false,
    compatibility: '*',
    fetch: undefined,
    inline: ['none'],
    rebase: false,
    format: 'keep-breaks'
  },
  
  // HTML minification options
  htmlOptions: {
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
    collapseBooleanAttributes: true,
    preserveLineBreaks: false
  },
  
  // Google Sheets specific
  sheetsIntegration: {
    preserveEndpoints: true,
    preserveSheetNames: true,
    encodeSheetReferences: true
  },
  
  // Output options
  output: {
    generateReport: true,
    generateIntegrity: true,
    generateGzip: true,
    generateBase64: true,
    keepOriginals: true
  },
  
  // Exclude patterns
  exclude: [
    'node_modules/**',
    '.git/**',
    '**/*.min.*',
    '**/*.bundle.*',
    '**/*.test.*',
    '**/*.spec.*',
    '**/tests/**'
  ],
  
  // Watch mode
  watch: false,
  
  // Batch processing
  batchSize: 10,
  
  // Verbose logging
  verbose: false
};

// ============================================
// MINIFY STATS
// ============================================
const minifyStats = {
  startTime: null,
  endTime: null,
  files: {
    js: { count: 0, originalSize: 0, minifiedSize: 0, gzipSize: 0 },
    css: { count: 0, originalSize: 0, minifiedSize: 0, gzipSize: 0 },
    html: { count: 0, originalSize: 0, minifiedSize: 0, gzipSize: 0 },
    other: { count: 0, originalSize: 0, minifiedSize: 0 }
  },
  errors: [],
  warnings: [],
  sheetsEndpoints: new Set(),
  integrityHashes: {}
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const MinifyUtils = {
  /**
   * Format file size
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  /**
   * Format percentage
   */
  formatPercent(saved, original) {
    if (original === 0) return '0%';
    return Math.round((1 - saved / original) * 100) + '%';
  },

  /**
   * Generate SHA256 hash
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Generate SRI integrity hash
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
   * Get all files matching extension
   */
  getAllFiles(dir, extensions, excludePatterns = []) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const walkDir = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        // Check exclude patterns
        if (excludePatterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
          return regex.test(relativePath);
        })) {
          continue;
        }
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            walkDir(fullPath);
          }
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    walkDir(dir);
    return files;
  },

  /**
   * Create directory if not exists
   */
  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  },

  /**
   * Extract Google Sheets endpoints from code
   */
  extractSheetEndpoints(code) {
    const endpoints = new Set();
    
    // Extract action endpoints
    const actionRegex = /action:\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = actionRegex.exec(code)) !== null) {
      endpoints.add(match[1]);
    }
    
    // Extract sheet names
    const sheetRegex = /SHEETS\s*:\s*\{([^}]+)\}/g;
    const sheetMatch = sheetRegex.exec(code);
    if (sheetMatch) {
      const sheetBlock = sheetMatch[1];
      const nameRegex = /(\w+)\s*:\s*'([^']+)'/g;
      let nameMatch;
      while ((nameMatch = nameRegex.exec(sheetBlock)) !== null) {
        endpoints.add(`sheet:${nameMatch[2]}`);
      }
    }
    
    return Array.from(endpoints);
  },

  /**
   * Check if file is already minified
   */
  isMinified(filePath) {
    const name = path.basename(filePath).toLowerCase();
    return name.includes('.min.') || name.includes('.bundle.');
  }
};

// ============================================
// MINIFICATION FUNCTIONS
// ============================================

/**
 * Minify JavaScript file
 */
async function minifyJS(inputPath, outputPath) {
  if (MINIFY_CONFIG.verbose) {
    console.log(`  📦 JS: ${path.relative('.', inputPath)}`);
  }
  
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code);
    
    // Extract endpoints before minification
    if (MINIFY_CONFIG.sheetsIntegration.preserveEndpoints) {
      const endpoints = MinifyUtils.extractSheetEndpoints(code);
      endpoints.forEach(ep => minifyStats.sheetsEndpoints.add(ep));
    }
    
    // Minify
    const result = await minify(code, MINIFY_CONFIG.jsOptions);
    
    if (result.error) {
      minifyStats.errors.push(`JS: ${inputPath} - ${result.error.message}`);
      console.error(`  ❌ Failed: ${result.error.message}`);
      
      // Save original as fallback
      MinifyUtils.ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, code);
      return null;
    }
    
    let minifiedCode = result.code;
    const minifiedSize = Buffer.byteLength(minifiedCode);
    
    // Generate Gzip version
    let gzipSize = 0;
    if (MINIFY_CONFIG.output.generateGzip) {
      const gzipPath = outputPath + '.gz';
      const gzipped = MinifyUtils.gzipContent(minifiedCode);
      fs.writeFileSync(gzipPath, gzipped);
      gzipSize = gzipped.length;
    }
    
    // Generate integrity hash
    if (MINIFY_CONFIG.output.generateIntegrity) {
      const integrity = MinifyUtils.generateIntegrity(minifiedCode);
      const hash = MinifyUtils.generateHash(minifiedCode);
      minifyStats.integrityHashes[path.relative('.', outputPath)] = {
        integrity,
        hash
      };
    }
    
    // Generate Base64 encoded version
    if (MINIFY_CONFIG.output.generateBase64) {
      const base64Path = outputPath.replace(/\.js$/, '.base64.js');
      const base64Content = `// Base64 Encoded - ${MINIFY_CONFIG.APP_NAME} v${MINIFY_CONFIG.APP_VERSION}\nconst ENCODED_MODULE = '${Base64NodeUtil.encode(minifiedCode)}';\n`;
      fs.writeFileSync(base64Path, base64Content);
    }
    
    // Ensure output directory
    MinifyUtils.ensureDir(path.dirname(outputPath));
    
    // Write minified file
    fs.writeFileSync(outputPath, minifiedCode);
    
    // Update stats
    minifyStats.files.js.count++;
    minifyStats.files.js.originalSize += originalSize;
    minifyStats.files.js.minifiedSize += minifiedSize;
    minifyStats.files.js.gzipSize += gzipSize;
    
    const savings = MinifyUtils.formatPercent(minifiedSize, originalSize);
    
    if (!MINIFY_CONFIG.verbose) {
      const relPath = path.relative('.', inputPath);
      console.log(`  ✅ ${relPath}: ${MinifyUtils.formatSize(originalSize)} → ${MinifyUtils.formatSize(minifiedSize)} (${savings} saved)`);
    }
    
    return {
      inputPath,
      outputPath,
      originalSize,
      minifiedSize,
      gzipSize,
      savings
    };
    
  } catch (error) {
    minifyStats.errors.push(`JS: ${inputPath} - ${error.message}`);
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Minify CSS file
 */
function minifyCSS(inputPath, outputPath) {
  if (MINIFY_CONFIG.verbose) {
    console.log(`  🎨 CSS: ${path.relative('.', inputPath)}`);
  }
  
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code);
    
    // Minify
    const cleaner = new CleanCSS(MINIFY_CONFIG.cssOptions);
    const result = cleaner.minify(code);
    
    if (result.errors.length > 0) {
      result.errors.forEach(err => {
        minifyStats.errors.push(`CSS: ${inputPath} - ${err}`);
      });
      console.error(`  ❌ CSS errors: ${result.errors.join(', ')}`);
      
      // Save original
      MinifyUtils.ensureDir(path.dirname(outputPath));
      fs.writeFileSync(outputPath, code);
      return null;
    }
    
    if (result.warnings.length > 0) {
      result.warnings.forEach(warn => {
        minifyStats.warnings.push(`CSS: ${inputPath} - ${warn}`);
      });
    }
    
    let minifiedCode = result.styles;
    const minifiedSize = Buffer.byteLength(minifiedCode);
    
    // Generate Gzip version
    let gzipSize = 0;
    if (MINIFY_CONFIG.output.generateGzip) {
      const gzipPath = outputPath + '.gz';
      const gzipped = MinifyUtils.gzipContent(minifiedCode);
      fs.writeFileSync(gzipPath, gzipped);
      gzipSize = gzipped.length;
    }
    
    // Generate integrity hash
    if (MINIFY_CONFIG.output.generateIntegrity) {
      const integrity = MinifyUtils.generateIntegrity(minifiedCode);
      const hash = MinifyUtils.generateHash(minifiedCode);
      minifyStats.integrityHashes[path.relative('.', outputPath)] = {
        integrity,
        hash
      };
    }
    
    // Generate Base64 encoded version
    if (MINIFY_CONFIG.output.generateBase64) {
      const base64Path = outputPath.replace(/\.css$/, '.base64.css');
      const base64Content = `/* Base64 Encoded - ${MINIFY_CONFIG.APP_NAME} v${MINIFY_CONFIG.APP_VERSION} */\n/* Encoded CSS: ${Base64NodeUtil.encode(minifiedCode)} */\n`;
      fs.writeFileSync(base64Path, base64Content);
    }
    
    // Ensure output directory
    MinifyUtils.ensureDir(path.dirname(outputPath));
    
    // Write minified file
    fs.writeFileSync(outputPath, minifiedCode);
    
    // Update stats
    minifyStats.files.css.count++;
    minifyStats.files.css.originalSize += originalSize;
    minifyStats.files.css.minifiedSize += minifiedSize;
    minifyStats.files.css.gzipSize += gzipSize;
    
    const savings = MinifyUtils.formatPercent(minifiedSize, originalSize);
    
    if (!MINIFY_CONFIG.verbose) {
      const relPath = path.relative('.', inputPath);
      console.log(`  ✅ ${relPath}: ${MinifyUtils.formatSize(originalSize)} → ${MinifyUtils.formatSize(minifiedSize)} (${savings} saved)`);
    }
    
    return {
      inputPath,
      outputPath,
      originalSize,
      minifiedSize,
      gzipSize,
      savings
    };
    
  } catch (error) {
    minifyStats.errors.push(`CSS: ${inputPath} - ${error.message}`);
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Minify HTML file
 */
function minifyHTML(inputPath, outputPath) {
  if (MINIFY_CONFIG.verbose) {
    console.log(`  🌐 HTML: ${path.relative('.', inputPath)}`);
  }
  
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code);
    
    // Minify
    const minifiedCode = htmlMinifier.minify(code, MINIFY_CONFIG.htmlOptions);
    const minifiedSize = Buffer.byteLength(minifiedCode);
    
    // Generate Gzip version
    let gzipSize = 0;
    if (MINIFY_CONFIG.output.generateGzip) {
      const gzipPath = outputPath + '.gz';
      const gzipped = MinifyUtils.gzipContent(minifiedCode);
      fs.writeFileSync(gzipPath, gzipped);
      gzipSize = gzipped.length;
    }
    
    // Generate integrity hash
    if (MINIFY_CONFIG.output.generateIntegrity) {
      const integrity = MinifyUtils.generateIntegrity(minifiedCode);
      const hash = MinifyUtils.generateHash(minifiedCode);
      minifyStats.integrityHashes[path.relative('.', outputPath)] = {
        integrity,
        hash
      };
    }
    
    // Ensure output directory
    MinifyUtils.ensureDir(path.dirname(outputPath));
    
    // Write minified file
    fs.writeFileSync(outputPath, minifiedCode);
    
    // Update stats
    minifyStats.files.html.count++;
    minifyStats.files.html.originalSize += originalSize;
    minifyStats.files.html.minifiedSize += minifiedSize;
    minifyStats.files.html.gzipSize += gzipSize;
    
    const savings = MinifyUtils.formatPercent(minifiedSize, originalSize);
    
    if (!MINIFY_CONFIG.verbose) {
      const relPath = path.relative('.', inputPath);
      console.log(`  ✅ ${relPath}: ${MinifyUtils.formatSize(originalSize)} → ${MinifyUtils.formatSize(minifiedSize)} (${savings} saved)`);
    }
    
    return {
      inputPath,
      outputPath,
      originalSize,
      minifiedSize,
      gzipSize,
      savings
    };
    
  } catch (error) {
    minifyStats.errors.push(`HTML: ${inputPath} - ${error.message}`);
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Minify JSON file (whitespace removal)
 */
function minifyJSON(inputPath, outputPath) {
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code);
    
    const parsed = JSON.parse(code);
    const minifiedCode = JSON.stringify(parsed);
    const minifiedSize = Buffer.byteLength(minifiedCode);
    
    MinifyUtils.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, minifiedCode);
    
    minifyStats.files.other.count++;
    minifyStats.files.other.originalSize += originalSize;
    minifyStats.files.other.minifiedSize += minifiedSize;
    
    return {
      inputPath,
      outputPath,
      originalSize,
      minifiedSize,
      savings: MinifyUtils.formatPercent(minifiedSize, originalSize)
    };
  } catch (error) {
    console.error(`  ❌ JSON error: ${error.message}`);
    return null;
  }
}

/**
 * Minify SVG file
 */
function minifySVG(inputPath, outputPath) {
  try {
    let code = fs.readFileSync(inputPath, 'utf-8');
    const originalSize = Buffer.byteLength(code);
    
    // Basic SVG minification
    code = code
      .replace(/<!--[\s\S]*?-->/g, '')           // Remove comments
      .replace(/\s+/g, ' ')                       // Collapse whitespace
      .replace(/>\s+</g, '><')                    // Remove whitespace between tags
      .replace(/\s*=\s*/g, '=')                   // Remove whitespace around =
      .replace(/\s*\/>/g, '/>')                   // Remove whitespace before />
      .replace(/^\s+|\s+$/gm, '')                 // Trim lines
      .trim();
    
    const minifiedSize = Buffer.byteLength(code);
    
    MinifyUtils.ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, code);
    
    minifyStats.files.other.count++;
    minifyStats.files.other.originalSize += originalSize;
    minifyStats.files.other.minifiedSize += minifiedSize;
    
    return {
      inputPath,
      outputPath,
      originalSize,
      minifiedSize,
      savings: MinifyUtils.formatPercent(minifiedSize, originalSize)
    };
  } catch (error) {
    console.error(`  ❌ SVG error: ${error.message}`);
    return null;
  }
}

// ============================================
// BATCH PROCESSING
// ============================================

/**
 * Process all JavaScript files
 */
async function processAllJS(srcDir, outputDir) {
  console.log('\n📦 Processing JavaScript files...');
  
  const jsFiles = MinifyUtils.getAllFiles(srcDir, ['.js'], MINIFY_CONFIG.exclude)
    .filter(f => !MinifyUtils.isMinified(f));
  
  console.log(`  Found ${jsFiles.length} JavaScript files`);
  
  const results = [];
  
  // Process in batches
  for (let i = 0; i < jsFiles.length; i += MINIFY_CONFIG.batchSize) {
    const batch = jsFiles.slice(i, i + MINIFY_CONFIG.batchSize);
    const batchResults = await Promise.all(
      batch.map(file => {
        const relativePath = path.relative(srcDir, file);
        const outputPath = path.join(outputDir, relativePath);
        return minifyJS(file, outputPath);
      })
    );
    results.push(...batchResults.filter(Boolean));
  }
  
  return results;
}

/**
 * Process all CSS files
 */
function processAllCSS(srcDir, outputDir) {
  console.log('\n🎨 Processing CSS files...');
  
  const cssFiles = MinifyUtils.getAllFiles(srcDir, ['.css'], MINIFY_CONFIG.exclude)
    .filter(f => !MinifyUtils.isMinified(f));
  
  console.log(`  Found ${cssFiles.length} CSS files`);
  
  const results = [];
  
  cssFiles.forEach(file => {
    const relativePath = path.relative(srcDir, file);
    const outputPath = path.join(outputDir, relativePath);
    const result = minifyCSS(file, outputPath);
    if (result) results.push(result);
  });
  
  return results;
}

/**
 * Process all HTML files
 */
function processAllHTML(srcDir, outputDir) {
  console.log('\n🌐 Processing HTML files...');
  
  const htmlFiles = MinifyUtils.getAllFiles(srcDir, ['.html', '.htm'], MINIFY_CONFIG.exclude)
    .filter(f => !MinifyUtils.isMinified(f));
  
  console.log(`  Found ${htmlFiles.length} HTML files`);
  
  const results = [];
  
  htmlFiles.forEach(file => {
    const relativePath = path.relative(srcDir, file);
    const outputPath = path.join(outputDir, relativePath);
    const result = minifyHTML(file, outputPath);
    if (result) results.push(result);
  });
  
  return results;
}

/**
 * Process JSON files
 */
function processAllJSON(srcDir, outputDir) {
  console.log('\n📋 Processing JSON files...');
  
  const jsonFiles = MinifyUtils.getAllFiles(srcDir, ['.json'], MINIFY_CONFIG.exclude)
    .filter(f => !MinifyUtils.isMinified(f));
  
  console.log(`  Found ${jsonFiles.length} JSON files`);
  
  const results = [];
  
  jsonFiles.forEach(file => {
    const relativePath = path.relative(srcDir, file);
    const outputPath = path.join(outputDir, relativePath);
    const result = minifyJSON(file, outputPath);
    if (result) results.push(result);
  });
  
  return results;
}

/**
 * Process SVG files
 */
function processAllSVG(srcDir, outputDir) {
  console.log('\n🖼️  Processing SVG files...');
  
  const svgFiles = MinifyUtils.getAllFiles(srcDir, ['.svg'], MINIFY_CONFIG.exclude);
  
  console.log(`  Found ${svgFiles.length} SVG files`);
  
  const results = [];
  
  svgFiles.forEach(file => {
    const relativePath = path.relative(srcDir, file);
    const outputPath = path.join(outputDir, relativePath);
    const result = minifySVG(file, outputPath);
    if (result) results.push(result);
  });
  
  return results;
}

// ============================================
// REPORT GENERATION
// ============================================
function generateMinifyReport() {
  if (!MINIFY_CONFIG.output.generateReport) return;
  
  console.log('\n📊 Generating minification report...');
  
  const totalOriginal = minifyStats.files.js.originalSize + 
                        minifyStats.files.css.originalSize + 
                        minifyStats.files.html.originalSize +
                        minifyStats.files.other.originalSize;
  
  const totalMinified = minifyStats.files.js.minifiedSize + 
                        minifyStats.files.css.minifiedSize + 
                        minifyStats.files.html.minifiedSize +
                        minifyStats.files.other.minifiedSize;
  
  const totalGzip = minifyStats.files.js.gzipSize + 
                    minifyStats.files.css.gzipSize + 
                    minifyStats.files.html.gzipSize;
  
  const report = {
    generatedAt: new Date().toISOString(),
    app: MINIFY_CONFIG.APP_NAME,
    version: MINIFY_CONFIG.APP_VERSION,
    duration: `${((minifyStats.endTime - minifyStats.startTime) / 1000).toFixed(1)} seconds`,
    summary: {
      totalFiles: minifyStats.files.js.count + 
                  minifyStats.files.css.count + 
                  minifyStats.files.html.count +
                  minifyStats.files.other.count,
      totalOriginalSize: MinifyUtils.formatSize(totalOriginal),
      totalMinifiedSize: MinifyUtils.formatSize(totalMinified),
      totalGzipSize: MinifyUtils.formatSize(totalGzip),
      totalSavings: MinifyUtils.formatPercent(totalMinified, totalOriginal)
    },
    breakdown: {
      javascript: {
        files: minifyStats.files.js.count,
        originalSize: MinifyUtils.formatSize(minifyStats.files.js.originalSize),
        minifiedSize: MinifyUtils.formatSize(minifyStats.files.js.minifiedSize),
        gzipSize: MinifyUtils.formatSize(minifyStats.files.js.gzipSize),
        savings: MinifyUtils.formatPercent(
          minifyStats.files.js.minifiedSize, 
          minifyStats.files.js.originalSize
        )
      },
      css: {
        files: minifyStats.files.css.count,
        originalSize: MinifyUtils.formatSize(minifyStats.files.css.originalSize),
        minifiedSize: MinifyUtils.formatSize(minifyStats.files.css.minifiedSize),
        gzipSize: MinifyUtils.formatSize(minifyStats.files.css.gzipSize),
        savings: MinifyUtils.formatPercent(
          minifyStats.files.css.minifiedSize, 
          minifyStats.files.css.originalSize
        )
      },
      html: {
        files: minifyStats.files.html.count,
        originalSize: MinifyUtils.formatSize(minifyStats.files.html.originalSize),
        minifiedSize: MinifyUtils.formatSize(minifyStats.files.html.minifiedSize),
        gzipSize: MinifyUtils.formatSize(minifyStats.files.html.gzipSize),
        savings: MinifyUtils.formatPercent(
          minifyStats.files.html.minifiedSize, 
          minifyStats.files.html.originalSize
        )
      },
      other: {
        files: minifyStats.files.other.count,
        originalSize: MinifyUtils.formatSize(minifyStats.files.other.originalSize),
        minifiedSize: MinifyUtils.formatSize(minifyStats.files.other.minifiedSize),
        savings: MinifyUtils.formatPercent(
          minifyStats.files.other.minifiedSize, 
          minifyStats.files.other.originalSize
        )
      }
    },
    googleSheets: {
      endpointsFound: minifyStats.sheetsEndpoints.size,
      endpoints: Array.from(minifyStats.sheetsEndpoints).sort()
    },
    integrityHashes: minifyStats.integrityHashes,
    errors: minifyStats.errors,
    warnings: minifyStats.warnings
  };
  
  // Write JSON report
  const reportPath = path.join(MINIFY_CONFIG.distDir, 'minify-report.json');
  MinifyUtils.ensureDir(MINIFY_CONFIG.distDir);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  ✅ minify-report.json`);
  
  // Write Base64 encoded report
  const encodedReport = Base64NodeUtil.encodeObject(report);
  const encodedPath = path.join(MINIFY_CONFIG.distDir, 'minify-report.base64');
  fs.writeFileSync(encodedPath, encodedReport);
  console.log(`  ✅ minify-report.base64`);
  
  return report;
}

// ============================================
// PRINT SUMMARY
// ============================================
function printSummary() {
  const totalOriginal = minifyStats.files.js.originalSize + 
                        minifyStats.files.css.originalSize + 
                        minifyStats.files.html.originalSize;
  
  const totalMinified = minifyStats.files.js.minifiedSize + 
                        minifyStats.files.css.minifiedSize + 
                        minifyStats.files.html.minifiedSize;
  
  const totalGzip = minifyStats.files.js.gzipSize + 
                    minifyStats.files.css.gzipSize + 
                    minifyStats.files.html.gzipSize;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MINIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📱 App: ${MINIFY_CONFIG.APP_NAME} v${MINIFY_CONFIG.APP_VERSION}`);
  console.log(`⏱️  Duration: ${((minifyStats.endTime - minifyStats.startTime) / 1000).toFixed(1)} seconds`);
  console.log('');
  console.log('📄 JavaScript:');
  console.log(`   Files: ${minifyStats.files.js.count}`);
  console.log(`   Original: ${MinifyUtils.formatSize(minifyStats.files.js.originalSize)}`);
  console.log(`   Minified: ${MinifyUtils.formatSize(minifyStats.files.js.minifiedSize)}`);
  console.log(`   Gzip: ${MinifyUtils.formatSize(minifyStats.files.js.gzipSize)}`);
  console.log(`   Savings: ${MinifyUtils.formatPercent(minifyStats.files.js.minifiedSize, minifyStats.files.js.originalSize)}`);
  console.log('');
  console.log('🎨 CSS:');
  console.log(`   Files: ${minifyStats.files.css.count}`);
  console.log(`   Original: ${MinifyUtils.formatSize(minifyStats.files.css.originalSize)}`);
  console.log(`   Minified: ${MinifyUtils.formatSize(minifyStats.files.css.minifiedSize)}`);
  console.log(`   Savings: ${MinifyUtils.formatPercent(minifyStats.files.css.minifiedSize, minifyStats.files.css.originalSize)}`);
  console.log('');
  console.log('🌐 HTML:');
  console.log(`   Files: ${minifyStats.files.html.count}`);
  console.log(`   Original: ${MinifyUtils.formatSize(minifyStats.files.html.originalSize)}`);
  console.log(`   Minified: ${MinifyUtils.formatSize(minifyStats.files.html.minifiedSize)}`);
  console.log(`   Savings: ${MinifyUtils.formatPercent(minifyStats.files.html.minifiedSize, minifyStats.files.html.originalSize)}`);
  console.log('');
  console.log('📦 TOTAL:');
  console.log(`   Original: ${MinifyUtils.formatSize(totalOriginal)}`);
  console.log(`   Minified: ${MinifyUtils.formatSize(totalMinified)}`);
  console.log(`   Gzip: ${MinifyUtils.formatSize(totalGzip)}`);
  console.log(`   Savings: ${MinifyUtils.formatPercent(totalMinified, totalOriginal)}`);
  
  if (minifyStats.sheetsEndpoints.size > 0) {
    console.log('');
    console.log(`🔗 Google Sheets Endpoints: ${minifyStats.sheetsEndpoints.size}`);
  }
  
  if (minifyStats.errors.length > 0) {
    console.log(`\n❌ Errors: ${minifyStats.errors.length}`);
  }
  
  if (minifyStats.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${minifyStats.warnings.length}`);
  }
  
  console.log('='.repeat(60));
}

// ============================================
// MAIN MINIFY FUNCTION
// ============================================
async function runMinify() {
  minifyStats.startTime = Date.now();
  
  console.log('🔧 Starting minification for ' + MINIFY_CONFIG.APP_NAME + ' v' + MINIFY_CONFIG.APP_VERSION);
  console.log('='.repeat(60));
  
  try {
    // JavaScript
    if (MINIFY_CONFIG.processTypes.js) {
      await processAllJS(MINIFY_CONFIG.srcDir + '/js', MINIFY_CONFIG.distDir + '/js');
    }
    
    // CSS
    if (MINIFY_CONFIG.processTypes.css) {
      processAllCSS(MINIFY_CONFIG.srcDir + '/css', MINIFY_CONFIG.distDir + '/css');
    }
    
    // HTML
    if (MINIFY_CONFIG.processTypes.html) {
      processAllHTML(MINIFY_CONFIG.srcDir, MINIFY_CONFIG.distDir);
    }
    
    // JSON
    if (MINIFY_CONFIG.processTypes.json) {
      processAllJSON(MINIFY_CONFIG.srcDir, MINIFY_CONFIG.distDir);
    }
    
    // SVG
    if (MINIFY_CONFIG.processTypes.svg) {
      processAllSVG(MINIFY_CONFIG.srcDir + '/assets', MINIFY_CONFIG.distDir + '/assets');
    }
    
    // Set end time
    minifyStats.endTime = Date.now();
    
    // Generate report
    generateMinifyReport();
    
    // Print summary
    printSummary();
    
    console.log('\n✅ Minification complete!');
    console.log(`📁 Output: ${path.resolve(MINIFY_CONFIG.distDir)}\n`);
    
  } catch (error) {
    console.error('\n❌ Minification failed:', error.message);
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
      case '--src':
        MINIFY_CONFIG.srcDir = args[++i];
        break;
      case '--dist':
        MINIFY_CONFIG.distDir = args[++i];
        break;
      case '--js-only':
        MINIFY_CONFIG.processTypes = { js: true, css: false, html: false, json: false, svg: false };
        break;
      case '--css-only':
        MINIFY_CONFIG.processTypes = { js: false, css: true, html: false, json: false, svg: false };
        break;
      case '--html-only':
        MINIFY_CONFIG.processTypes = { js: false, css: false, html: true, json: false, svg: false };
        break;
      case '--no-gzip':
        MINIFY_CONFIG.output.generateGzip = false;
        break;
      case '--no-base64':
        MINIFY_CONFIG.output.generateBase64 = false;
        break;
      case '--verbose':
      case '-v':
        MINIFY_CONFIG.verbose = true;
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
🔧 Arsip Surat Digital Enterprise - Minify Script v${MINIFY_CONFIG.APP_VERSION}

Usage: node tools/minify.js [options]

Options:
  --src <dir>        Source directory (default: ./src)
  --dist <dir>       Output directory (default: ./dist)
  --js-only          Minify JavaScript files only
  --css-only         Minify CSS files only
  --html-only        Minify HTML files only
  --no-gzip          Skip Gzip compression
  --no-base64        Skip Base64 encoding
  -v, --verbose      Verbose output
  -h, --help         Show this help

Examples:
  node tools/minify.js                    # Minify all files
  node tools/minify.js --js-only          # JavaScript only
  node tools/minify.js --dist ./build     # Output to build directory
  node tools/minify.js -v                 # Verbose mode
`);
}

// ============================================
// RUN MINIFY
// ============================================
if (require.main === module) {
  parseArgs();
  runMinify().catch(console.error);
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  runMinify,
  minifyJS,
  minifyCSS,
  minifyHTML,
  minifyJSON,
  minifySVG,
  processAllJS,
  processAllCSS,
  processAllHTML,
  MinifyUtils,
  MINIFY_CONFIG,
  Base64NodeUtil
};
