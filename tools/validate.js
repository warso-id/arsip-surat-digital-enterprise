/**
 * VALIDATE SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/validate.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk validasi integritas
 * Comprehensive code quality & structure validation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  validateBase64(str) {
    try {
      const decoded = this.decode(str);
      return decoded !== null && decoded !== undefined;
    } catch {
      return false;
    }
  }
};

// ============================================
// VALIDATION CONFIGURATION
// ============================================
const VALIDATE_CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  
  // Directories
  srcDir: './src',
  buildDir: './build',
  testsDir: './tests',
  toolsDir: './tools',
  
  // Google Sheets / GAS specific
  gas: {
    scriptIdPattern: /AKfycb[a-zA-Z0-9_-]+/,
    requiredFunctions: [
      'doGet',
      'doPost',
      'processRequest',
      'handleAction',
      'authenticate',
      'authorize'
    ],
    requiredSheets: [
      'SuratMasuk',
      'SuratKeluar',
      'Disposisi',
      'Users',
      'MasterData',
      'Konfigurasi',
      'AuditLog',
      'Notifikasi'
    ],
    endpointPattern: /'(login|logout|register|[\w.]+)'/g
  },
  
  // Validation checks
  checks: {
    syntax: true,
    imports: true,
    naming: true,
    structure: true,
    i18n: true,
    accessibility: false,
    security: true,
    performance: false,
    gasCompatibility: true,
    sheetsIntegration: true,
    base64Integrity: true,
    documentation: false
  },
  
  // File patterns
  patterns: {
    js: /\.js$/,
    css: /\.css$/,
    html: /\.html$/,
    json: /\.json$/,
    gs: /\.gs$/,
    svg: /\.svg$/
  },
  
  // Naming conventions
  naming: {
    js: /^[a-z][a-z0-9.-]*\.js$/,
    css: /^[a-z][a-z0-9-]*\.css$/,
    html: /^[a-z][a-z0-9-]*\.html$/,
    component: /^[a-z][a-z0-9-]+\.js$/,
    page: /^[a-z][a-z0-9-]+\.js$/,
    service: /^[a-z][a-z0-9-]+-service\.js$/,
    test: /^[a-z][a-z0-9-]+\.test\.js$/
  },
  
  // Required methods per file type
  requiredMethods: {
    page: ['render', 'getTemplate'],
    component: ['init', 'destroy'],
    service: ['init'],
    modal: ['show', 'hide', 'render']
  },
  
  // Max file sizes
  maxFileSizes: {
    js: 500 * 1024,    // 500 KB
    css: 200 * 1024,   // 200 KB
    html: 100 * 1024,  // 100 KB
    json: 50 * 1024,   // 50 KB
    svg: 100 * 1024    // 100 KB
  },
  
  // Security checks
  security: {
    checkHardcodedCredentials: true,
    checkEval: true,
    checkInnerHTML: true,
    checkConsoleLog: false,
    checkSensitiveData: true,
    sensitivePatterns: [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i
    ]
  },
  
  // Output options
  output: {
    generateReport: true,
    reportFormat: 'json',  // json | html | markdown
    generateBase64: true,
    failOnError: true,
    failOnWarning: false,
    verbose: false
  },
  
  // Exclude patterns
  exclude: [
    'node_modules/**',
    '.git/**',
    '**/*.min.*',
    '**/*.bundle.*',
    '**/build/**',
    '**/dist/**',
    '**/.deploy/**'
  ]
};

// ============================================
// VALIDATION STATE
// ============================================
const validationState = {
  startTime: null,
  endTime: null,
  filesScanned: 0,
  errors: [],
  warnings: [],
  info: [],
  suggestions: [],
  sheetsEndpoints: new Set(),
  sheetsReferences: new Set(),
  base64Issues: [],
  gasCompatibilityIssues: [],
  fileStructure: {}
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const ValidateUtils = {
  /**
   * Get all files recursively
   */
  getAllFiles(dir, extensions = [], excludePatterns = []) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const walkDir = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        // Check exclude patterns
        if (excludePatterns.some(pattern => {
          const regex = new RegExp(
            '^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '.') + '$'
          );
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
          if (extensions.length === 0 || extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    walkDir(dir);
    return files;
  },

  /**
   * Format size
   */
  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  },

  /**
   * Check if string contains Base64
   */
  containsBase64(str) {
    const base64Pattern = /[A-Za-z0-9+/]{40,}={0,2}/g;
    const matches = str.match(base64Pattern);
    if (matches) {
      return matches.filter(m => {
        try {
          return Base64NodeUtil.validateBase64(m);
        } catch {
          return false;
        }
      });
    }
    return [];
  },

  /**
   * Extract function names from code
   */
  extractFunctions(code) {
    const functions = [];
    const patterns = [
      /function\s+(\w+)\s*\(/g,
      /(\w+)\s*=\s*function\s*\(/g,
      /(\w+)\s*:\s*function\s*\(/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /(\w+)\s*\([^)]*\)\s*{/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[1] && !['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
          functions.push(match[1]);
        }
      }
    });
    
    return [...new Set(functions)];
  }
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate JavaScript/GS syntax
 */
function validateSyntax(filePath, content) {
  const ext = path.extname(filePath);
  
  if (ext === '.js' || ext === '.gs') {
    try {
      // Wrap in function to avoid global scope issues
      new Function(`"use strict";\n${content}`);
    } catch (error) {
      addError(filePath, 'Syntax', `Syntax error: ${error.message}`);
    }
  }
  
  if (ext === '.json') {
    try {
      JSON.parse(content);
    } catch (error) {
      addError(filePath, 'Syntax', `Invalid JSON: ${error.message}`);
    }
  }
  
  if (ext === '.html') {
    // Basic HTML validation
    const openTags = content.match(/<\w+/g) || [];
    const closeTags = content.match(/<\/\w+>/g) || [];
    
    if (openTags.length > closeTags.length) {
      addWarning(filePath, 'HTML', `Possible unclosed HTML tags (${openTags.length} open vs ${closeTags.length} close)`);
    }
  }
}

/**
 * Validate imports and references
 */
function validateImports(filePath, content) {
  if (!filePath.endsWith('.html')) return;
  
  const baseDir = path.dirname(filePath);
  
  // Check script imports
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>/g;
  let match;
  let checkedCount = 0;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip external URLs
    if (importPath.startsWith('http')) continue;
    
    const fullPath = path.resolve(baseDir, importPath);
    if (!fs.existsSync(fullPath)) {
      addError(filePath, 'Imports', `Missing script: ${importPath}`);
    }
    checkedCount++;
  }
  
  // Check CSS imports
  const cssRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
  
  while ((match = cssRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (importPath.startsWith('http')) continue;
    
    const fullPath = path.resolve(baseDir, importPath);
    if (!fs.existsSync(fullPath)) {
      addError(filePath, 'Imports', `Missing stylesheet: ${importPath}`);
    }
    checkedCount++;
  }
  
  // Check image references
  const imgRegex = /<img[^>]*src="([^"]+)"[^>]*>/g;
  
  while ((match = imgRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (importPath.startsWith('http') || importPath.startsWith('data:')) continue;
    
    const fullPath = path.resolve(baseDir, importPath);
    if (!fs.existsSync(fullPath)) {
      addWarning(filePath, 'Imports', `Missing image: ${importPath}`);
    }
  }
}

/**
 * Validate naming conventions
 */
function validateNaming(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  // Check JS naming
  if (ext === '.js') {
    if (filePath.includes('/pages/') && !VALIDATE_CONFIG.naming.page.test(fileName)) {
      addWarning(filePath, 'Naming', `Page file should be lowercase with hyphens: ${fileName}`);
    }
    if (filePath.includes('/components/') && !VALIDATE_CONFIG.naming.component.test(fileName)) {
      addWarning(filePath, 'Naming', `Component file should follow naming convention: ${fileName}`);
    }
    if (filePath.includes('/services/') && !VALIDATE_CONFIG.naming.service.test(fileName)) {
      addWarning(filePath, 'Naming', `Service file should end with -service.js: ${fileName}`);
    }
    if (!VALIDATE_CONFIG.naming.js.test(fileName)) {
      addWarning(filePath, 'Naming', `JS filename should be lowercase: ${fileName}`);
    }
  }
  
  // Check CSS naming
  if (ext === '.css') {
    if (!VALIDATE_CONFIG.naming.css.test(fileName)) {
      addWarning(filePath, 'Naming', `CSS filename should be kebab-case: ${fileName}`);
    }
  }
  
  // Check HTML naming
  if (ext === '.html') {
    if (!VALIDATE_CONFIG.naming.html.test(fileName)) {
      addWarning(filePath, 'Naming', `HTML filename should be lowercase: ${fileName}`);
    }
  }
  
  // Check test naming
  if (filePath.includes('/tests/') && ext === '.js') {
    if (!VALIDATE_CONFIG.naming.test.test(fileName)) {
      addWarning(filePath, 'Naming', `Test file should end with .test.js: ${fileName}`);
    }
  }
}

/**
 * Validate file structure and required methods
 */
function validateStructure(filePath, content) {
  const functions = ValidateUtils.extractFunctions(content);
  
  // Check page components
  if (filePath.includes('/pages/') && filePath.endsWith('.js')) {
    for (const method of VALIDATE_CONFIG.requiredMethods.page) {
      if (!functions.includes(method)) {
        addWarning(filePath, 'Structure', `Page component should have ${method}() method`);
      }
    }
  }
  
  // Check UI components
  if (filePath.includes('/components/') && filePath.endsWith('.js')) {
    for (const method of VALIDATE_CONFIG.requiredMethods.component) {
      if (!functions.includes(method) && !content.includes(`${method}(`)) {
        addWarning(filePath, 'Structure', `Component should have ${method}() method`);
      }
    }
  }
  
  // Check services
  if (filePath.includes('/services/') && filePath.endsWith('.js')) {
    if (!functions.includes('init') && !content.includes('init(')) {
      addWarning(filePath, 'Structure', `Service should have init() method`);
    }
  }
  
  // Check for export statements in modules
  if (filePath.endsWith('.js') && !filePath.includes('/pages/')) {
    const hasExport = content.includes('module.exports') || 
                      content.includes('export default') || 
                      content.includes('export {') ||
                      content.includes('export const') ||
                      content.includes('export class') ||
                      content.includes('export function');
    
    const hasGlobalExposure = content.includes('window.') || content.includes('if (typeof window');
    
    if (!hasExport && !hasGlobalExposure && functions.length > 2) {
      addInfo(filePath, 'Structure', 'Module may need export or global exposure');
    }
  }
}

/**
 * Validate i18n and hardcoded text
 */
function validateI18n(filePath, content) {
  if (!filePath.endsWith('.js')) return;
  
  // Check for hardcoded Indonesian text
  const hardcodedPatterns = [
    /['"](Masuk|Keluar|Simpan|Batal|Hapus|Edit|Tambah|Cari)['"]/g,
    /['"](Surat\s+Masuk|Surat\s+Keluar|Dashboard|Pengaturan|Laporan)['"]/g,
    /['"](Berhasil|Gagal|Error|Peringatan|Sukses)['"]/g,
    /['"](Data\s+berhasil|Data\s+gagal|Silahkan|Terima\s+kasih)['"]/g
  ];
  
  let hardcodedCount = 0;
  
  hardcodedPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      hardcodedCount += matches.length;
    }
  });
  
  if (hardcodedCount > 5) {
    addWarning(filePath, 'i18n', `${hardcodedCount} hardcoded Indonesian strings found. Consider using i18n keys.`);
  } else if (hardcodedCount > 0) {
    addInfo(filePath, 'i18n', `${hardcodedCount} hardcoded strings found`);
  }
}

/**
 * Validate security issues
 */
function validateSecurity(filePath, content) {
  if (!VALIDATE_CONFIG.checks.security) return;
  
  const securityConfig = VALIDATE_CONFIG.security;
  
  // Check for hardcoded credentials
  if (securityConfig.checkHardcodedCredentials) {
    for (const pattern of securityConfig.sensitivePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (!match.includes('YOUR_') && !match.includes('mock') && !match.includes('test') && !match.includes('example')) {
            addError(filePath, 'Security', `Possible hardcoded credential: ${match.substring(0, 50)}...`);
          }
        }
      }
    }
  }
  
  // Check for eval usage
  if (securityConfig.checkEval) {
    const evalPattern = /\beval\s*\(/g;
    if (evalPattern.test(content)) {
      addWarning(filePath, 'Security', 'Usage of eval() detected');
    }
  }
  
  // Check for innerHTML usage
  if (securityConfig.checkInnerHTML) {
    const innerHTMLPattern = /\.innerHTML\s*=/g;
    const matches = content.match(innerHTMLPattern);
    if (matches && matches.length > 3) {
      addWarning(filePath, 'Security', `${matches.length} innerHTML assignments. Consider using textContent or safe DOM methods.`);
    }
  }
  
  // Check for console.log in production code
  if (securityConfig.checkConsoleLog) {
    const consolePattern = /console\.(log|debug|info)\s*\(/g;
    const matches = content.match(consolePattern);
    if (matches && matches.length > 10) {
      addInfo(filePath, 'Security', `${matches.length} console statements found. Remove before production.`);
    }
  }
  
  // Check for XSS vulnerabilities
  const xssPatterns = [
    /document\.write\s*\(/g,
    /\.outerHTML\s*=/g,
    /setTimeout\s*\(\s*['"]/g,
    /setInterval\s*\(\s*['"]/g
  ];
  
  xssPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      addWarning(filePath, 'Security', `Potential XSS vector: ${pattern.source}`);
    }
  });
}

/**
 * Validate Google Apps Script compatibility
 */
function validateGASCompatibility(filePath, content) {
  if (!VALIDATE_CONFIG.checks.gasCompatibility) return;
  
  const ext = path.extname(filePath);
  
  // Check .gs files
  if (ext === '.gs') {
    // Check required GAS functions
    const functions = ValidateUtils.extractFunctions(content);
    
    for (const required of VALIDATE_CONFIG.gas.requiredFunctions) {
      if (!functions.includes(required)) {
        addWarning(filePath, 'GAS', `Missing required GAS function: ${required}()`);
      }
    }
    
    // Check for script ID pattern
    const scriptIdMatch = content.match(VALIDATE_CONFIG.gas.scriptIdPattern);
    if (!scriptIdMatch) {
      addInfo(filePath, 'GAS', 'No Google Apps Script ID found in file');
    }
    
    // Check for doGet/doPost
    if (!content.includes('function doGet') && !content.includes('function doPost')) {
      addError(filePath, 'GAS', 'Missing doGet() or doPost() web app entry point');
    }
  }
  
  // Check JS files for GAS compatibility
  if (ext === '.js') {
    // Check for browser-specific APIs that won't work in GAS
    const browserAPIs = [
      { pattern: /\bdocument\./g, warning: 'DOM API usage - not available in GAS' },
      { pattern: /\bwindow\./g, warning: 'Window API usage - not available in GAS' },
      { pattern: /\blocalStorage\b/g, warning: 'localStorage - not available in GAS' },
      { pattern: /\bsessionStorage\b/g, warning: 'sessionStorage - not available in GAS' }
    ];
    
    // These are OK in frontend files
    if (!filePath.includes('/pages/') && !filePath.includes('/components/')) {
      browserAPIs.forEach(({ pattern, warning }) => {
        if (pattern.test(content)) {
          addInfo(filePath, 'GAS', warning);
        }
      });
    }
    
    // Check for google.script.run usage
    if (content.includes('google.script.run')) {
      validationState.gasCompatibilityIssues.push(filePath);
      addInfo(filePath, 'GAS', 'Uses google.script.run - ensure GAS compatibility');
    }
  }
}

/**
 * Validate Google Sheets integration
 */
function validateSheetsIntegration(filePath, content) {
  if (!VALIDATE_CONFIG.checks.sheetsIntegration) return;
  
  // Extract sheet references
  const sheetPatterns = [
    /SHEETS\s*:\s*\{([^}]+)\}/g,
    /'([A-Z][a-zA-Z]+)'/g,
    /"([A-Z][a-zA-Z]+)"/g
  ];
  
  sheetPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const value = match[1];
      if (VALIDATE_CONFIG.gas.requiredSheets.includes(value)) {
        validationState.sheetsReferences.add(value);
      }
    }
  });
  
  // Extract endpoints
  const endpointPattern = /['"]([\w.]+\.\w+)['"]/g;
  let endpointMatch;
  while ((endpointMatch = endpointPattern.exec(content)) !== null) {
    validationState.sheetsEndpoints.add(endpointMatch[1]);
  }
  
  // Check for SpreadsheetApp usage
  if (content.includes('SpreadsheetApp')) {
    addInfo(filePath, 'Sheets', 'Uses SpreadsheetApp API');
  }
  
  // Check for sheet name references
  if (content.includes('getSheetByName')) {
    addInfo(filePath, 'Sheets', 'References Google Sheets directly');
  }
}

/**
 * Validate Base64 encoding integrity
 */
function validateBase64Integrity(filePath, content) {
  if (!VALIDATE_CONFIG.checks.base64Integrity) return;
  
  // Find Base64 encoded strings
  const base64Strings = ValidateUtils.containsBase64(content);
  
  if (base64Strings.length > 0) {
    base64Strings.forEach(b64 => {
      try {
        const decoded = Base64NodeUtil.decode(b64);
        // Check if decoded content is valid
        if (decoded && decoded.length > 0) {
          // Check if it's JSON
          try {
            JSON.parse(decoded);
            addInfo(filePath, 'Base64', `Valid Base64 JSON payload found (${b64.length} chars)`);
          } catch {
            addInfo(filePath, 'Base64', `Valid Base64 string found (${b64.length} chars)`);
          }
        } else {
          validationState.base64Issues.push({ file: filePath, value: b64.substring(0, 30) });
          addWarning(filePath, 'Base64', `Possibly invalid Base64 encoding`);
        }
      } catch (e) {
        validationState.base64Issues.push({ file: filePath, value: b64.substring(0, 30), error: e.message });
        addWarning(filePath, 'Base64', `Base64 decode failed: ${e.message}`);
      }
    });
  }
}

/**
 * Validate file size
 */
function validateFileSize(filePath) {
  const ext = path.extname(filePath);
  const stats = fs.statSync(filePath);
  
  let maxSize;
  switch (ext) {
    case '.js': maxSize = VALIDATE_CONFIG.maxFileSizes.js; break;
    case '.css': maxSize = VALIDATE_CONFIG.maxFileSizes.css; break;
    case '.html': maxSize = VALIDATE_CONFIG.maxFileSizes.html; break;
    case '.json': maxSize = VALIDATE_CONFIG.maxFileSizes.json; break;
    case '.svg': maxSize = VALIDATE_CONFIG.maxFileSizes.svg; break;
    default: return;
  }
  
  if (stats.size > maxSize) {
    addWarning(filePath, 'Size', `File size (${ValidateUtils.formatSize(stats.size)}) exceeds recommended maximum (${ValidateUtils.formatSize(maxSize)})`);
  }
}

// ============================================
// REPORTING FUNCTIONS
// ============================================
function addError(file, category, message) {
  validationState.errors.push({
    file: path.relative('.', file),
    category,
    message,
    severity: 'error'
  });
}

function addWarning(file, category, message) {
  validationState.warnings.push({
    file: path.relative('.', file),
    category,
    message,
    severity: 'warning'
  });
}

function addInfo(file, category, message) {
  validationState.info.push({
    file: path.relative('.', file),
    category,
    message,
    severity: 'info'
  });
}

/**
 * Generate validation report
 */
function generateReport() {
  if (!VALIDATE_CONFIG.output.generateReport) return;
  
  const report = {
    generatedAt: new Date().toISOString(),
    app: VALIDATE_CONFIG.APP_NAME,
    version: VALIDATE_CONFIG.APP_VERSION,
    duration: `${((validationState.endTime - validationState.startTime) / 1000).toFixed(1)} seconds`,
    summary: {
      filesScanned: validationState.filesScanned,
      errors: validationState.errors.length,
      warnings: validationState.warnings.length,
      info: validationState.info.length,
      passed: validationState.errors.length === 0
    },
    categories: {
      sheets: {
        endpointsFound: validationState.sheetsEndpoints.size,
        endpoints: Array.from(validationState.sheetsEndpoints).sort(),
        sheetsReferenced: validationState.sheetsReferences.size,
        sheets: Array.from(validationState.sheetsReferences).sort(),
        missingSheets: VALIDATE_CONFIG.gas.requiredSheets.filter(
          s => !validationState.sheetsReferences.has(s)
        )
      },
      gas: {
        compatibilityIssues: validationState.gasCompatibilityIssues.length,
        files: validationState.gasCompatibilityIssues.map(f => path.relative('.', f))
      },
      base64: {
        issues: validationState.base64Issues.length,
        details: validationState.base64Issues
      }
    },
    results: {
      errors: validationState.errors,
      warnings: validationState.warnings,
      info: validationState.info
    }
  };
  
  // Write JSON report
  const reportPath = path.join('./', 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📋 Report saved: validation-report.json`);
  
  // Write Base64 encoded report
  if (VALIDATE_CONFIG.output.generateBase64) {
    const encodedReport = Base64NodeUtil.encodeObject(report);
    const encodedPath = path.join('./', 'validation-report.base64');
    fs.writeFileSync(encodedPath, encodedReport);
    console.log(`📋 Encoded report: validation-report.base64`);
  }
  
  return report;
}

/**
 * Print validation summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`📱 App: ${VALIDATE_CONFIG.APP_NAME} v${VALIDATE_CONFIG.APP_VERSION}`);
  console.log(`📁 Files scanned: ${validationState.filesScanned}`);
  console.log(`⏱️  Duration: ${((validationState.endTime - validationState.startTime) / 1000).toFixed(1)}s`);
  console.log('');
  
  // Errors
  if (validationState.errors.length > 0) {
    console.log(`❌ ERRORS: ${validationState.errors.length}`);
    console.log('-'.repeat(70));
    
    const errorsByCategory = {};
    validationState.errors.forEach(err => {
      if (!errorsByCategory[err.category]) errorsByCategory[err.category] = [];
      errorsByCategory[err.category].push(err);
    });
    
    Object.entries(errorsByCategory).forEach(([category, errs]) => {
      console.log(`  [${category}] ${errs.length} issues`);
      errs.slice(0, 5).forEach(err => {
        console.log(`    • ${err.file}: ${err.message}`);
      });
      if (errs.length > 5) {
        console.log(`    ... and ${errs.length - 5} more`);
      }
    });
  } else {
    console.log('✅ No errors found');
  }
  
  console.log('');
  
  // Warnings
  if (validationState.warnings.length > 0) {
    console.log(`⚠️  WARNINGS: ${validationState.warnings.length}`);
    console.log('-'.repeat(70));
    
    const warningsByCategory = {};
    validationState.warnings.forEach(warn => {
      if (!warningsByCategory[warn.category]) warningsByCategory[warn.category] = [];
      warningsByCategory[warn.category].push(warn);
    });
    
    Object.entries(warningsByCategory).forEach(([category, warns]) => {
      console.log(`  [${category}] ${warns.length} issues`);
      warns.slice(0, 3).forEach(warn => {
        console.log(`    • ${warn.file}: ${warn.message}`);
      });
      if (warns.length > 3) {
        console.log(`    ... and ${warns.length - 3} more`);
      }
    });
  } else {
    console.log('✅ No warnings');
  }
  
  console.log('');
  
  // Info
  if (validationState.info.length > 0) {
    console.log(`ℹ️  INFO: ${validationState.info.length} items`);
  }
  
  console.log('');
  
  // Google Sheets / GAS summary
  console.log('🔗 GOOGLE SHEETS / GAS INTEGRATION');
  console.log('-'.repeat(70));
  console.log(`  Endpoints found: ${validationState.sheetsEndpoints.size}`);
  console.log(`  Sheets referenced: ${validationState.sheetsReferences.size}`);
  
  const missingSheets = VALIDATE_CONFIG.gas.requiredSheets.filter(
    s => !validationState.sheetsReferences.has(s)
  );
  
  if (missingSheets.length > 0) {
    console.log(`  ⚠️  Missing sheet references: ${missingSheets.join(', ')}`);
  } else {
    console.log('  ✅ All required sheets referenced');
  }
  
  console.log('');
  
  // Base64 summary
  if (validationState.base64Issues.length > 0) {
    console.log('🔐 BASE64 ISSUES');
    console.log('-'.repeat(70));
    console.log(`  Issues: ${validationState.base64Issues.length}`);
  }
  
  console.log('='.repeat(70));
}

// ============================================
// MAIN VALIDATION FUNCTION
// ============================================
async function runValidation() {
  validationState.startTime = Date.now();
  
  console.log('🔍 Starting validation for ' + VALIDATE_CONFIG.APP_NAME + ' v' + VALIDATE_CONFIG.APP_VERSION);
  console.log('='.repeat(70));
  
  try {
    // Collect all files
    const extensions = ['.js', '.css', '.html', '.json', '.gs', '.svg'];
    const files = ValidateUtils.getAllFiles(VALIDATE_CONFIG.srcDir, extensions, VALIDATE_CONFIG.exclude);
    
    // Also scan tools directory
    const toolFiles = ValidateUtils.getAllFiles(VALIDATE_CONFIG.toolsDir, extensions, VALIDATE_CONFIG.exclude);
    
    const allFiles = [...files, ...toolFiles];
    validationState.filesScanned = allFiles.length;
    
    console.log(`📁 Found ${allFiles.length} files to validate\n`);
    
    // Process each file
    let processedCount = 0;
    
    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Run all enabled checks
        if (VALIDATE_CONFIG.checks.syntax) validateSyntax(filePath, content);
        if (VALIDATE_CONFIG.checks.imports) validateImports(filePath, content);
        if (VALIDATE_CONFIG.checks.naming) validateNaming(filePath);
        if (VALIDATE_CONFIG.checks.structure) validateStructure(filePath, content);
        if (VALIDATE_CONFIG.checks.i18n) validateI18n(filePath, content);
        if (VALIDATE_CONFIG.checks.security) validateSecurity(filePath, content);
        if (VALIDATE_CONFIG.checks.gasCompatibility) validateGASCompatibility(filePath, content);
        if (VALIDATE_CONFIG.checks.sheetsIntegration) validateSheetsIntegration(filePath, content);
        if (VALIDATE_CONFIG.checks.base64Integrity) validateBase64Integrity(filePath, content);
        
        validateFileSize(filePath);
        
        processedCount++;
        
        if (processedCount % 10 === 0 || processedCount === allFiles.length) {
          process.stdout.write(`\r  Progress: ${processedCount}/${allFiles.length} files validated`);
        }
        
      } catch (error) {
        addError(filePath, 'System', `Failed to process file: ${error.message}`);
      }
    }
    
    console.log('\n');
    
    // Set end time
    validationState.endTime = Date.now();
    
    // Generate report
    generateReport();
    
    // Print summary
    printSummary();
    
    // Determine exit code
    if (VALIDATE_CONFIG.output.failOnError && validationState.errors.length > 0) {
      console.log('\n❌ Validation failed with errors!\n');
      process.exit(1);
    }
    
    if (VALIDATE_CONFIG.output.failOnWarning && validationState.warnings.length > 0) {
      console.log('\n⚠️  Validation completed with warnings!\n');
      process.exit(1);
    }
    
    console.log('\n✅ Validation passed!\n');
    
  } catch (error) {
    console.error('\n❌ Validation crashed:', error.message);
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
        VALIDATE_CONFIG.srcDir = args[++i];
        break;
      case '--skip-security':
        VALIDATE_CONFIG.checks.security = false;
        break;
      case '--skip-gas':
        VALIDATE_CONFIG.checks.gasCompatibility = false;
        break;
      case '--skip-sheets':
        VALIDATE_CONFIG.checks.sheetsIntegration = false;
        break;
      case '--skip-base64':
        VALIDATE_CONFIG.checks.base64Integrity = false;
        break;
      case '--fail-on-warning':
        VALIDATE_CONFIG.output.failOnWarning = true;
        break;
      case '--no-fail':
        VALIDATE_CONFIG.output.failOnError = false;
        break;
      case '--verbose':
      case '-v':
        VALIDATE_CONFIG.output.verbose = true;
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
🔍 Arsip Surat Digital Enterprise - Validate Script v${VALIDATE_CONFIG.APP_VERSION}

Usage: node tools/validate.js [options]

Options:
  --src <dir>           Source directory (default: ./src)
  --skip-security       Skip security checks
  --skip-gas            Skip GAS compatibility checks
  --skip-sheets         Skip Google Sheets integration checks
  --skip-base64         Skip Base64 integrity checks
  --fail-on-warning     Fail on warnings as well as errors
  --no-fail             Don't fail on errors (exit 0)
  -v, --verbose         Verbose output
  -h, --help            Show this help

Examples:
  node tools/validate.js                     # Full validation
  node tools/validate.js --skip-security      # Skip security checks
  node tools/validate.js --fail-on-warning    # Strict mode
  node tools/validate.js -v                   # Verbose mode
`);
}

// ============================================
// RUN VALIDATION
// ============================================
if (require.main === module) {
  parseArgs();
  runValidation().catch(console.error);
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  runValidation,
  validateSyntax,
  validateImports,
  validateNaming,
  validateStructure,
  validateI18n,
  validateSecurity,
  validateGASCompatibility,
  validateSheetsIntegration,
  validateBase64Integrity,
  ValidateUtils,
  VALIDATE_CONFIG,
  Base64NodeUtil
};
