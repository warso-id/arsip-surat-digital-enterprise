/**
 * VALIDATE SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Code quality validation
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  srcDir: './src',
  checks: {
    syntax: true,
    imports: true,
    naming: true,
    structure: true,
    i18n: true
  }
};

let errors = 0;
let warnings = 0;

function validateSyntax(filePath, content) {
  if (filePath.endsWith('.js')) {
    try {
      new Function(content);
    } catch (error) {
      reportError(filePath, `Syntax error: ${error.message}`);
    }
  }
  
  if (filePath.endsWith('.json')) {
    try {
      JSON.parse(content);
    } catch (error) {
      reportError(filePath, `Invalid JSON: ${error.message}`);
    }
  }
}

function validateImports(filePath, content) {
  if (!filePath.endsWith('.html')) return;
  
  const scriptRegex = /<script src="([^"]+)"><\/script>/g;
  const cssRegex = /<link rel="stylesheet" href="([^"]+)">/g;
  
  let match;
  
  while ((match = scriptRegex.exec(content)) !== null) {
    const importPath = path.join(path.dirname(filePath), match[1]);
    if (!fs.existsSync(importPath)) {
      reportError(filePath, `Missing script: ${match[1]}`);
    }
  }
  
  while ((match = cssRegex.exec(content)) !== null) {
    const importPath = path.join(path.dirname(filePath), match[1]);
    if (!fs.existsSync(importPath)) {
      reportError(filePath, `Missing stylesheet: ${match[1]}`);
    }
  }
}

function validateNaming(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // Check kebab-case for CSS
  if (ext === '.css' && !/^[a-z][a-z0-9-]*\.css$/.test(fileName)) {
    reportWarning(filePath, 'CSS filename should be kebab-case');
  }
  
  // Check kebab-case for JS
  if (ext === '.js' && !/^[a-z][a-z0-9.-]*\.js$/.test(fileName)) {
    reportWarning(filePath, 'JS filename should be kebab-case');
  }
}

function validateStructure(filePath, content) {
  // Check for required elements in pages
  if (filePath.includes('/pages/') && filePath.endsWith('.js')) {
    if (!content.includes('render(container)')) {
      reportWarning(filePath, 'Page component should have render(container) method');
    }
    if (!content.includes('getTemplate()')) {
      reportWarning(filePath, 'Page component should have getTemplate() method');
    }
  }
  
  // Check for required elements in components
  if (filePath.includes('/components/') && filePath.endsWith('.js')) {
    if (!content.includes('init()')) {
      reportWarning(filePath, 'Component should have init() method');
    }
  }
}

function validateI18n(filePath, content) {
  if (!filePath.endsWith('.js')) return;
  
  // Check for hardcoded Indonesian text
  const hardcodedPattern = /['"]([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)['"]/g;
  let match;
  
  while ((match = hardcodedPattern.exec(content)) !== null) {
    const text = match[1];
    if (text.length > 10 && !text.includes('http') && !text.includes('function')) {
      reportWarning(filePath, `Possible hardcoded text: "${text}"`);
    }
  }
}

function reportError(file, message) {
  console.error(`❌ ${file}: ${message}`);
  errors++;
}

function reportWarning(file, message) {
  console.warn(`⚠️  ${file}: ${message}`);
  warnings++;
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (CONFIG.checks.syntax) validateSyntax(filePath, content);
  if (CONFIG.checks.imports) validateImports(filePath, content);
  if (CONFIG.checks.naming) validateNaming(filePath);
  if (CONFIG.checks.structure) validateStructure(filePath, content);
  if (CONFIG.checks.i18n) validateI18n(filePath, content);
}

function getAllFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      getAllFiles(fullPath, files);
    } else if (['.js', '.css', '.html', '.json'].includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run
console.log('🔍 Validating code...\n');

const files = getAllFiles(CONFIG.srcDir);

files.forEach(file => {
  validateFile(file);
});

console.log(`\n📊 Validation complete: ${errors} errors, ${warnings} warnings`);

if (errors > 0) {
  process.exit(1);
}
