/**
 * ICON GENERATOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/generate-icons.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk icon data dan manifest
 * Generate PWA icons, favicons, dan assets dalam berbagai ukuran
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Check if canvas is available
let canvasModule;
try {
  canvasModule = require('canvas');
} catch (e) {
  console.log('⚠️  Canvas module not found. Installing...');
  console.log('   Run: npm install canvas');
  console.log('   Or use fallback SVG-based generation\n');
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
    return JSON.parse(this.decode(str));
  },
  encodeFile(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  },
  decodeToFile(base64Str, outputPath) {
    const buffer = Buffer.from(base64Str, 'base64');
    fs.writeFileSync(outputPath, buffer);
  },
  /**
   * Convert image buffer to Base64 data URI
   */
  toDataUri(buffer, mimeType = 'image/png') {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }
};

// ============================================
// ICON CONFIGURATION
// ============================================
const ICON_CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_SHORT_NAME: 'Arsip Surat',
  APP_VERSION: '3.2.2',
  
  // Output directories
  outputDir: './src/assets/icons',
  outputDirBuild: './build/assets/icons',
  
  // Icon sizes (PWA)
  pwaSizes: [72, 96, 128, 144, 152, 192, 384, 512],
  
  // Favicon sizes
  faviconSizes: [16, 32, 48, 64, 128, 256],
  
  // Apple touch icon sizes
  appleSizes: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180, 1024],
  
  // Microsoft tile sizes
  msSizes: [70, 150, 310],
  
  // Android adaptive icon sizes
  androidSizes: {
    foreground: 432,
    background: 432
  },
  
  // Colors
  colors: {
    primary: '#1565C0',        // Blue 800
    primaryDark: '#0D47A1',    // Blue 900
    primaryLight: '#1976D2',   // Blue 700
    accent: '#FF6F00',         // Amber 900
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textLight: '#FFFFFF',
    success: '#2E7D32',        // Green 800
    warning: '#F57F17',        // Yellow 900
    error: '#C62828',          // Red 800
    info: '#1565C0'            // Blue 800
  },
  
  // Design options
  design: {
    borderRadius: 0.2,         // 20% of icon size
    paddingRatio: 0.1,         // 10% padding
    textRatio: 0.35,           // Text size ratio
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontWeight: 'bold',
    letterSpacing: 0,
    
    // App abbreviation
    appAbbreviation: 'ASD',
    
    // Shapes
    shapes: {
      square: 'square',
      rounded: 'rounded',
      circle: 'circle'
    },
    defaultShape: 'rounded'
  },
  
  // Google Sheets themed icons
  sheetsThemed: true,
  
  // Generate options
  options: {
    generateSVG: true,
    generatePNG: canvasModule ? true : false,
    generateFavicon: true,
    generateAppleIcons: true,
    generateMsIcons: true,
    generateAndroidIcons: true,
    generateManifest: true,
    generateBase64Data: true,
    generateIconCatalog: true,
    optimizeOutput: true
  }
};

// ============================================
// SVG ICON TEMPLATES
// ============================================
const SVGTemplates = {
  /**
   * Generate base app icon SVG
   */
  appIcon(size, color = ICON_CONFIG.colors.primary) {
    const borderRadius = size * ICON_CONFIG.design.borderRadius;
    const fontSize = size * ICON_CONFIG.design.textRatio;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${ICON_CONFIG.colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ICON_CONFIG.colors.primaryDark};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="1" dy="2" stdDeviation="3" flood-color="#00000033"/>
    </filter>
  </defs>
  
  <!-- Background with gradient -->
  <rect x="${size * 0.08}" y="${size * 0.08}" 
        width="${size * 0.84}" height="${size * 0.84}" 
        rx="${borderRadius}" ry="${borderRadius}" 
        fill="url(#bgGradient)" filter="url(#shadow)"/>
  
  <!-- Document icon representation (simplified) -->
  <g transform="translate(${size * 0.2}, ${size * 0.15})" fill="${ICON_CONFIG.colors.textLight}" opacity="0.3">
    <rect x="0" y="${size * 0.05}" width="${size * 0.25}" height="${size * 0.03}" rx="${size * 0.005}"/>
    <rect x="0" y="${size * 0.12}" width="${size * 0.35}" height="${size * 0.03}" rx="${size * 0.005}"/>
    <rect x="0" y="${size * 0.19}" width="${size * 0.2}" height="${size * 0.03}" rx="${size * 0.005}"/>
  </g>
  
  <!-- App abbreviation text -->
  <text x="${size / 2}" y="${size * 0.55}" 
        text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" 
        font-weight="${ICON_CONFIG.design.fontWeight}" 
        font-size="${fontSize}" 
        fill="${ICON_CONFIG.colors.textLight}"
        letter-spacing="${ICON_CONFIG.design.letterSpacing}">${ICON_CONFIG.design.appAbbreviation}</text>
  
  <!-- Small sheets icon indicator (for Google Sheets themed) -->
  ${ICON_CONFIG.sheetsThemed ? `
  <g transform="translate(${size * 0.55}, ${size * 0.6})" fill="${ICON_CONFIG.colors.accent}" opacity="0.8">
    <rect x="0" y="0" width="${size * 0.2}" height="${size * 0.15}" rx="${size * 0.02}" fill="#0F9D58"/>
    <rect x="0" y="0" width="${size * 0.2}" height="${size * 0.03}" rx="${size * 0.005}" fill="#FFFFFF" opacity="0.5"/>
    <rect x="0" y="${size * 0.05}" width="${size * 0.2}" height="${size * 0.03}" rx="${size * 0.005}" fill="#FFFFFF" opacity="0.3"/>
  </g>` : ''}
</svg>`;
  },

  /**
   * Generate document-type icon
   */
  documentIcon(size, type = 'surat') {
    const colors = {
      surat: { bg: '#1565C0', accent: '#42A5F5' },
      disposisi: { bg: '#2E7D32', accent: '#66BB6A' },
      approval: { bg: '#F57F17', accent: '#FFCA28' },
      report: { bg: '#6A1B9A', accent: '#AB47BC' }
    };
    
    const colorScheme = colors[type] || colors.surat;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${size * 0.1}" y="${size * 0.05}" width="${size * 0.8}" height="${size * 0.9}" 
        rx="${size * 0.05}" fill="${colorScheme.bg}"/>
  <rect x="${size * 0.2}" y="${size * 0.15}" width="${size * 0.6}" height="${size * 0.05}" 
        rx="${size * 0.01}" fill="${colorScheme.accent}" opacity="0.5"/>
  <rect x="${size * 0.2}" y="${size * 0.25}" width="${size * 0.5}" height="${size * 0.04}" 
        rx="${size * 0.01}" fill="#FFFFFF" opacity="0.4"/>
  <rect x="${size * 0.2}" y="${size * 0.33}" width="${size * 0.4}" height="${size * 0.04}" 
        rx="${size * 0.01}" fill="#FFFFFF" opacity="0.3"/>
  <rect x="${size * 0.2}" y="${size * 0.41}" width="${size * 0.55}" height="${size * 0.04}" 
        rx="${size * 0.01}" fill="#FFFFFF" opacity="0.4"/>
  <rect x="${size * 0.2}" y="${size * 0.49}" width="${size * 0.35}" height="${size * 0.04}" 
        rx="${size * 0.01}" fill="#FFFFFF" opacity="0.3"/>
</svg>`;
  },

  /**
   * Generate favicon SVG
   */
  faviconSVG(size = 32) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.2}" 
        fill="${ICON_CONFIG.colors.primary}"/>
  <text x="${size / 2}" y="${size * 0.6}" text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" font-weight="bold" 
        font-size="${size * 0.5}" fill="${ICON_CONFIG.colors.textLight}">${ICON_CONFIG.design.appAbbreviation.charAt(0)}</text>
</svg>`;
  },

  /**
   * Generate Apple touch icon
   */
  appleTouchIcon(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${ICON_CONFIG.colors.background}"/>
  <rect x="${size * 0.15}" y="${size * 0.15}" width="${size * 0.7}" height="${size * 0.7}" 
        rx="${size * 0.15}" fill="${ICON_CONFIG.colors.primary}"/>
  <text x="${size / 2}" y="${size * 0.55}" text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" font-weight="bold" 
        font-size="${size * 0.3}" fill="${ICON_CONFIG.colors.textLight}">${ICON_CONFIG.design.appAbbreviation}</text>
</svg>`;
  },

  /**
   * Generate Microsoft tile icon
   */
  msTileIcon(size) {
    const bgColor = ICON_CONFIG.colors.primaryDark;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  <text x="${size / 2}" y="${size * 0.55}" text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" font-weight="bold" 
        font-size="${size * 0.35}" fill="${ICON_CONFIG.colors.textLight}">${ICON_CONFIG.design.appAbbreviation}</text>
</svg>`;
  },

  /**
   * Generate adaptive icon foreground
   */
  adaptiveForeground(size) {
    const safeZone = size * 0.66;
    const center = size / 2;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Safe zone circle -->
  <circle cx="${center}" cy="${center}" r="${safeZone / 2}" 
          fill="${ICON_CONFIG.colors.primary}"/>
  <text x="${center}" y="${center * 1.05}" text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" font-weight="bold" 
        font-size="${size * 0.25}" fill="${ICON_CONFIG.colors.textLight}">${ICON_CONFIG.design.appAbbreviation}</text>
</svg>`;
  },

  /**
   * Generate adaptive icon background
   */
  adaptiveBackground(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${ICON_CONFIG.colors.primaryLight}"/>
      <stop offset="100%" style="stop-color:${ICON_CONFIG.colors.primaryDark}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <!-- Grid pattern for Google Sheets theme -->
  ${ICON_CONFIG.sheetsThemed ? `
  <g stroke="${ICON_CONFIG.colors.textLight}" stroke-width="1" opacity="0.05">
    ${Array.from({length: 10}, (_, i) => `
    <line x1="0" y1="${size * (i + 1) / 11}" x2="${size}" y2="${size * (i + 1) / 11}"/>
    <line x1="${size * (i + 1) / 11}" y1="0" x2="${size * (i + 1) / 11}" y2="${size}"/>
    `).join('')}
  </g>` : ''}
</svg>`;
  },

  /**
   * Generate logo SVG (full size)
   */
  logoFull(size = 512) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${ICON_CONFIG.colors.primary};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${ICON_CONFIG.colors.primaryLight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${ICON_CONFIG.colors.primaryDark};stop-opacity:1" />
    </linearGradient>
    <filter id="logoShadow">
      <feDropShadow dx="2" dy="4" stdDeviation="6" flood-color="#00000044"/>
    </filter>
  </defs>
  
  <!-- Main shape -->
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" 
        rx="${size * 0.2}" fill="url(#logoGrad)" filter="url(#logoShadow)"/>
  
  <!-- Document icon -->
  <g transform="translate(${size * 0.15}, ${size * 0.12})" fill="${ICON_CONFIG.colors.textLight}" opacity="0.4">
    <rect x="0" y="0" width="${size * 0.3}" height="${size * 0.04}" rx="${size * 0.01}"/>
    <rect x="0" y="${size * 0.07}" width="${size * 0.45}" height="${size * 0.04}" rx="${size * 0.01}"/>
    <rect x="0" y="${size * 0.14}" width="${size * 0.25}" height="${size * 0.04}" rx="${size * 0.01}"/>
    <rect x="0" y="${size * 0.21}" width="${size * 0.35}" height="${size * 0.04}" rx="${size * 0.01}"/>
  </g>
  
  <!-- App name -->
  <text x="${size / 2}" y="${size * 0.55}" text-anchor="middle" dominant-baseline="central"
        font-family="${ICON_CONFIG.design.fontFamily}" font-weight="bold" 
        font-size="${size * 0.2}" fill="${ICON_CONFIG.colors.textLight}">${ICON_CONFIG.design.appAbbreviation}</text>
</svg>`;
  }
};

// ============================================
// ICON GENERATOR FUNCTIONS
// ============================================

/**
 * Generate PNG icon using Canvas
 */
function generatePNGIcon(size, name, svgContent, outputSubDir = '') {
  if (!canvasModule) return null;
  
  const { createCanvas } = canvasModule;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // For SVG rendering, we'd need a more complex approach
  // Here we'll create a simplified version programmatically
  const borderRadius = size * ICON_CONFIG.design.borderRadius;
  const fontSize = size * ICON_CONFIG.design.textRatio;
  
  // Background with gradient simulation
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, ICON_CONFIG.colors.primary);
  gradient.addColorStop(1, ICON_CONFIG.colors.primaryDark);
  
  ctx.fillStyle = gradient;
  
  // Draw rounded rectangle
  const padding = size * 0.08;
  const rectSize = size - padding * 2;
  
  ctx.beginPath();
  ctx.moveTo(padding + borderRadius, padding);
  ctx.lineTo(padding + rectSize - borderRadius, padding);
  ctx.quadraticCurveTo(padding + rectSize, padding, padding + rectSize, padding + borderRadius);
  ctx.lineTo(padding + rectSize, padding + rectSize - borderRadius);
  ctx.quadraticCurveTo(padding + rectSize, padding + rectSize, padding + rectSize - borderRadius, padding + rectSize);
  ctx.lineTo(padding + borderRadius, padding + rectSize);
  ctx.quadraticCurveTo(padding, padding + rectSize, padding, padding + rectSize - borderRadius);
  ctx.lineTo(padding, padding + borderRadius);
  ctx.quadraticCurveTo(padding, padding, padding + borderRadius, padding);
  ctx.closePath();
  ctx.fill();
  
  // Add shadow effect
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetX = size * 0.005;
  ctx.shadowOffsetY = size * 0.01;
  
  // Document lines (simplified)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  const lineX = size * 0.2;
  const lineStartY = size * 0.2;
  
  ctx.fillRect(lineX, lineStartY, size * 0.25, size * 0.03);
  ctx.fillRect(lineX, lineStartY + size * 0.07, size * 0.35, size * 0.03);
  ctx.fillRect(lineX, lineStartY + size * 0.14, size * 0.2, size * 0.03);
  
  // Text
  ctx.fillStyle = ICON_CONFIG.colors.textLight;
  ctx.font = `${ICON_CONFIG.design.fontWeight} ${fontSize}px ${ICON_CONFIG.design.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ICON_CONFIG.design.appAbbreviation, size / 2, size * 0.55);
  
  // Google Sheets indicator
  if (ICON_CONFIG.sheetsThemed && size >= 128) {
    ctx.fillStyle = '#0F9D58';
    const indicatorSize = size * 0.15;
    const indicatorX = size * 0.6;
    const indicatorY = size * 0.65;
    
    ctx.fillRect(indicatorX, indicatorY, size * 0.2, indicatorSize);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillRect(indicatorX, indicatorY, size * 0.2, indicatorSize * 0.2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(indicatorX, indicatorY + indicatorSize * 0.35, size * 0.2, indicatorSize * 0.2);
  }
  
  // Save
  const outputDir = path.join(ICON_CONFIG.outputDir, outputSubDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, `${name}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  
  return {
    path: filePath,
    buffer,
    size,
    name
  };
}

/**
 * Generate all PWA icons
 */
function generatePWAIcons() {
  console.log('\n📱 Generating PWA icons...');
  const icons = [];
  
  for (const size of ICON_CONFIG.pwaSizes) {
    // SVG
    if (ICON_CONFIG.options.generateSVG) {
      const svgContent = SVGTemplates.appIcon(size);
      const svgPath = path.join(ICON_CONFIG.outputDir, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent);
      console.log(`  ✅ icon-${size}x${size}.svg`);
    }
    
    // PNG
    if (ICON_CONFIG.options.generatePNG) {
      const result = generatePNGIcon(size, `icon-${size}x${size}`, null);
      if (result) {
        icons.push({
          src: `assets/icons/icon-${size}x${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          size
        });
        console.log(`  ✅ icon-${size}x${size}.png`);
      }
    }
  }
  
  return icons;
}

/**
 * Generate favicons
 */
function generateFavicons() {
  console.log('\n🌟 Generating favicons...');
  const favicons = [];
  
  // Generate multi-size favicon (16, 32, 48)
  if (ICON_CONFIG.options.generateFavicon) {
    // SVG favicon
    const faviconSVG = SVGTemplates.faviconSVG(32);
    fs.writeFileSync(path.join(ICON_CONFIG.outputDir, 'favicon.svg'), faviconSVG);
    console.log('  ✅ favicon.svg');
    
    // PNG favicons
    for (const size of ICON_CONFIG.faviconSizes) {
      if (ICON_CONFIG.options.generatePNG) {
        const result = generatePNGIcon(size, `favicon-${size}x${size}`, null, 'favicons');
        if (result) {
          favicons.push({
            size,
            path: result.path
          });
          console.log(`  ✅ favicon-${size}x${size}.png`);
        }
      }
    }
    
    // Create favicon.ico (multi-resolution) - simplified 32x32
    if (ICON_CONFIG.options.generatePNG) {
      generatePNGIcon(32, 'favicon', null);
      const srcPath = path.join(ICON_CONFIG.outputDir, 'favicon.png');
      const destPath = path.join(ICON_CONFIG.outputDir, 'favicon.ico');
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log('  ✅ favicon.ico');
      }
    }
  }
  
  return favicons;
}

/**
 * Generate Apple touch icons
 */
function generateAppleIcons() {
  if (!ICON_CONFIG.options.generateAppleIcons) return [];
  
  console.log('\n🍎 Generating Apple touch icons...');
  const icons = [];
  
  for (const size of ICON_CONFIG.appleSizes) {
    // SVG
    const svgContent = SVGTemplates.appleTouchIcon(size);
    const svgPath = path.join(ICON_CONFIG.outputDir, 'apple', `apple-touch-icon-${size}x${size}.svg`);
    if (!fs.existsSync(path.dirname(svgPath))) {
      fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    }
    fs.writeFileSync(svgPath, svgContent);
    
    // PNG
    if (ICON_CONFIG.options.generatePNG) {
      generatePNGIcon(size, `apple-touch-icon-${size}x${size}`, null, 'apple');
      icons.push({ size, type: 'apple' });
    }
    
    console.log(`  ✅ apple-touch-icon-${size}x${size}`);
  }
  
  // Generate apple-touch-icon.png (180x180 default)
  if (ICON_CONFIG.options.generatePNG) {
    generatePNGIcon(180, 'apple-touch-icon', null);
    console.log('  ✅ apple-touch-icon.png');
  }
  
  return icons;
}

/**
 * Generate Microsoft tile icons
 */
function generateMsIcons() {
  if (!ICON_CONFIG.options.generateMsIcons) return [];
  
  console.log('\n🪟 Generating Microsoft tile icons...');
  const icons = [];
  
  for (const size of ICON_CONFIG.msSizes) {
    const svgContent = SVGTemplates.msTileIcon(size);
    const svgPath = path.join(ICON_CONFIG.outputDir, 'ms', `mstile-${size}x${size}.svg`);
    if (!fs.existsSync(path.dirname(svgPath))) {
      fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    }
    fs.writeFileSync(svgPath, svgContent);
    
    if (ICON_CONFIG.options.generatePNG) {
      generatePNGIcon(size, `mstile-${size}x${size}`, null, 'ms');
      icons.push({ size, type: 'ms' });
    }
    
    console.log(`  ✅ mstile-${size}x${size}`);
  }
  
  return icons;
}

/**
 * Generate Android adaptive icons
 */
function generateAndroidIcons() {
  if (!ICON_CONFIG.options.generateAndroidIcons) return [];
  
  console.log('\n🤖 Generating Android adaptive icons...');
  const icons = [];
  
  const fgSize = ICON_CONFIG.androidSizes.foreground;
  const bgSize = ICON_CONFIG.androidSizes.background;
  
  // Foreground
  const fgSVG = SVGTemplates.adaptiveForeground(fgSize);
  const fgPath = path.join(ICON_CONFIG.outputDir, 'android', 'ic_launcher_foreground.svg');
  if (!fs.existsSync(path.dirname(fgPath))) {
    fs.mkdirSync(path.dirname(fgPath), { recursive: true });
  }
  fs.writeFileSync(fgPath, fgSVG);
  console.log('  ✅ ic_launcher_foreground.svg');
  
  // Background
  const bgSVG = SVGTemplates.adaptiveBackground(bgSize);
  const bgPath = path.join(ICON_CONFIG.outputDir, 'android', 'ic_launcher_background.svg');
  fs.writeFileSync(bgPath, bgSVG);
  console.log('  ✅ ic_launcher_background.svg');
  
  if (ICON_CONFIG.options.generatePNG) {
    generatePNGIcon(fgSize, 'ic_launcher_foreground', null, 'android');
    generatePNGIcon(bgSize, 'ic_launcher_background', null, 'android');
  }
  
  return icons;
}

/**
 * Generate SVG logo (full size)
 */
function generateLogo() {
  console.log('\n🎨 Generating logo...');
  
  const logoContent = SVGTemplates.logoFull(512);
  fs.writeFileSync(path.join(ICON_CONFIG.outputDir, 'logo.svg'), logoContent);
  console.log('  ✅ logo.svg (512x512)');
  
  // Also generate smaller versions
  [128, 256].forEach(size => {
    const content = SVGTemplates.logoFull(size);
    fs.writeFileSync(path.join(ICON_CONFIG.outputDir, `logo-${size}.svg`), content);
    console.log(`  ✅ logo-${size}.svg`);
  });
  
  if (ICON_CONFIG.options.generatePNG) {
    generatePNGIcon(512, 'logo', null);
    generatePNGIcon(256, 'logo-256', null);
    generatePNGIcon(128, 'logo-128', null);
    console.log('  ✅ logo PNGs generated');
  }
}

/**
 * Generate document type icons (for Google Sheets integration)
 */
function generateDocumentIcons() {
  console.log('\n📄 Generating document type icons...');
  
  const types = ['surat', 'disposisi', 'approval', 'report'];
  
  types.forEach(type => {
    const svgContent = SVGTemplates.documentIcon(64, type);
    const filePath = path.join(ICON_CONFIG.outputDir, `doc-${type}.svg`);
    fs.writeFileSync(filePath, svgContent);
    console.log(`  ✅ doc-${type}.svg`);
  });
}

// ============================================
// MANIFEST GENERATION
// ============================================
function generateManifest(icons) {
  if (!ICON_CONFIG.options.generateManifest) return;
  
  console.log('\n📋 Generating web app manifest...');
  
  const manifest = {
    name: ICON_CONFIG.APP_NAME,
    short_name: ICON_CONFIG.APP_SHORT_NAME,
    description: 'Sistem Arsip Surat Digital Enterprise dengan dukungan Google Sheets',
    version: ICON_CONFIG.APP_VERSION,
    manifest_version: 3,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: ICON_CONFIG.colors.background,
    theme_color: ICON_CONFIG.colors.primary,
    status_bar: 'black-translucent',
    categories: ['business', 'productivity', 'utilities'],
    icons: [],
    shortcuts: [
      {
        name: 'Surat Masuk',
        short_name: 'Masuk',
        description: 'Lihat surat masuk',
        url: '/#/surat-masuk',
        icons: [{ src: 'assets/icons/doc-surat.svg', sizes: '64x64' }]
      },
      {
        name: 'Surat Keluar',
        short_name: 'Keluar',
        description: 'Lihat surat keluar',
        url: '/#/surat-keluar',
        icons: [{ src: 'assets/icons/doc-surat.svg', sizes: '64x64' }]
      },
      {
        name: 'Disposisi',
        short_name: 'Disposisi',
        description: 'Lihat disposisi',
        url: '/#/disposisi',
        icons: [{ src: 'assets/icons/doc-disposisi.svg', sizes: '64x64' }]
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'Lihat dashboard',
        url: '/#/dashboard',
        icons: [{ src: 'assets/icons/icon-96x96.svg', sizes: '96x96' }]
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    screenshots: [],
    iarc_rating_id: '',
    lang: 'id-ID',
    dir: 'ltr'
  };
  
  // Add generated icons to manifest
  ICON_CONFIG.pwaSizes.forEach(size => {
    manifest.icons.push({
      src: `assets/icons/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any maskable'
    });
  });
  
  // Add SVG icon
  manifest.icons.push({
    src: 'assets/icons/logo.svg',
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any'
  });
  
  // Write manifest
  const manifestPath = path.join(ICON_CONFIG.outputDir, '..', '..', 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('  ✅ manifest.json generated');
  
  // Generate Base64 encoded manifest for GAS integration
  const encodedManifest = Base64NodeUtil.encodeObject(manifest);
  const encodedPath = path.join(ICON_CONFIG.outputDir, 'manifest.base64');
  fs.writeFileSync(encodedPath, encodedManifest);
  console.log('  ✅ manifest.base64 generated (for GAS)');
  
  return manifest;
}

/**
 * Generate browserconfig.xml for Microsoft
 */
function generateBrowserConfig() {
  console.log('\n🪟 Generating browserconfig.xml...');
  
  const config = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="assets/icons/ms/mstile-70x70.png"/>
      <square150x150logo src="assets/icons/ms/mstile-150x150.png"/>
      <square310x310logo src="assets/icons/ms/mstile-310x310.png"/>
      <TileColor>${ICON_CONFIG.colors.primaryDark}</TileColor>
      <TileImage src="assets/icons/ms/mstile-150x150.png"/>
    </tile>
  </msapplication>
</browserconfig>`;
  
  const configPath = path.join(ICON_CONFIG.outputDir, '..', '..', 'browserconfig.xml');
  fs.writeFileSync(configPath, config);
  console.log('  ✅ browserconfig.xml generated');
}

/**
 * Generate icon catalog (JSON + Base64)
 */
function generateIconCatalog(allIcons) {
  if (!ICON_CONFIG.options.generateIconCatalog) return;
  
  console.log('\n📋 Generating icon catalog...');
  
  const catalog = {
    generatedAt: new Date().toISOString(),
    version: ICON_CONFIG.APP_VERSION,
    app: ICON_CONFIG.APP_NAME,
    totalIcons: 0,
    categories: {
      pwa: [],
      favicon: [],
      apple: [],
      microsoft: [],
      android: [],
      documents: [],
      logo: []
    },
    manifest: null,
    base64Data: {}
  };
  
  // Scan output directory
  const scanDir = (dir, category, basePath = '') => {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const relativePath = basePath ? `${basePath}/${item}` : item;
      
      if (fs.statSync(itemPath).isFile()) {
        const stats = fs.statSync(itemPath);
        const iconInfo = {
          name: item,
          path: relativePath,
          size: stats.size,
          sizeFormatted: formatSize(stats.size),
          extension: path.extname(item)
        };
        
        // Generate Base64 data for icons
        if (ICON_CONFIG.options.generateBase64Data && 
            (item.endsWith('.svg') || item.endsWith('.png'))) {
          const mimeType = item.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
          const base64 = Base64NodeUtil.encodeFile(itemPath);
          if (base64) {
            iconInfo.base64 = `data:${mimeType};base64,${base64}`;
            catalog.base64Data[relativePath] = iconInfo.base64;
          }
        }
        
        catalog.categories[category].push(iconInfo);
        catalog.totalIcons++;
      }
    });
  };
  
  scanDir(ICON_CONFIG.outputDir, 'pwa');
  scanDir(path.join(ICON_CONFIG.outputDir, 'favicons'), 'favicon', 'favicons');
  scanDir(path.join(ICON_CONFIG.outputDir, 'apple'), 'apple', 'apple');
  scanDir(path.join(ICON_CONFIG.outputDir, 'ms'), 'microsoft', 'ms');
  scanDir(path.join(ICON_CONFIG.outputDir, 'android'), 'android', 'android');
  
  // Read manifest
  const manifestPath = path.join(ICON_CONFIG.outputDir, '..', '..', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    catalog.manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  }
  
  // Write catalog
  const catalogPath = path.join(ICON_CONFIG.outputDir, 'icon-catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log(`  ✅ icon-catalog.json (${catalog.totalIcons} icons)`);
  
  // Write Base64 encoded catalog
  const encodedCatalog = Base64NodeUtil.encodeObject(catalog);
  const encodedPath = path.join(ICON_CONFIG.outputDir, 'icon-catalog.base64');
  fs.writeFileSync(encodedPath, encodedCatalog);
  console.log('  ✅ icon-catalog.base64 generated');
  
  return catalog;
}

/**
 * Generate HTML snippet for icon includes
 */
function generateHTMLSnippet(catalog) {
  console.log('\n📝 Generating HTML snippet...');
  
  const manifest = catalog?.manifest || {};
  
  const snippet = `<!-- PWA Icons - Generated by generate-icons.js -->
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
<link rel="shortcut icon" href="/assets/icons/favicon.ico">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple/apple-touch-icon-180x180.png">
<link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/apple/apple-touch-icon-152x152.png">
<link rel="apple-touch-icon" sizes="120x120" href="/assets/icons/apple/apple-touch-icon-120x120.png">
<link rel="apple-touch-icon" sizes="76x76" href="/assets/icons/apple/apple-touch-icon-76x76.png">
<link rel="mask-icon" href="/assets/icons/logo.svg" color="${ICON_CONFIG.colors.primary}">

<!-- Microsoft Tiles -->
<meta name="msapplication-TileColor" content="${ICON_CONFIG.colors.primaryDark}">
<meta name="msapplication-TileImage" content="/assets/icons/ms/mstile-150x150.png">
<meta name="msapplication-config" content="/browserconfig.xml">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="${ICON_CONFIG.colors.primary}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${ICON_CONFIG.APP_SHORT_NAME}">

<!-- Google Sheets Integration Meta -->
<meta name="google-sheets-integration" content="enabled">
<meta name="google-apps-script-url" content="${Base64NodeUtil.encode('https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec')}">
`;
  
  const snippetPath = path.join(ICON_CONFIG.outputDir, 'icon-snippet.html');
  fs.writeFileSync(snippetPath, snippet);
  console.log('  ✅ icon-snippet.html generated');
  
  return snippet;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function ensureDirectories() {
  const dirs = [
    ICON_CONFIG.outputDir,
    path.join(ICON_CONFIG.outputDir, 'favicons'),
    path.join(ICON_CONFIG.outputDir, 'apple'),
    path.join(ICON_CONFIG.outputDir, 'ms'),
    path.join(ICON_CONFIG.outputDir, 'android')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function copyToBuild() {
  if (!fs.existsSync(ICON_CONFIG.outputDirBuild)) return;
  
  console.log('\n📦 Copying icons to build directory...');
  
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src, { withFileTypes: true });
    items.forEach(item => {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyDir(ICON_CONFIG.outputDir, ICON_CONFIG.outputDirBuild);
  console.log('  ✅ Icons copied to build directory');
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================
async function generateIcons() {
  console.log('🎨 Generating icons for ' + ICON_CONFIG.APP_NAME + ' v' + ICON_CONFIG.APP_VERSION);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const allIcons = [];
  
  try {
    // Ensure directories exist
    ensureDirectories();
    
    // Generate logo
    generateLogo();
    
    // Generate PWA icons
    const pwaIcons = generatePWAIcons();
    allIcons.push(...pwaIcons);
    
    // Generate favicons
    const favicons = generateFavicons();
    allIcons.push(...favicons);
    
    // Generate Apple icons
    const appleIcons = generateAppleIcons();
    allIcons.push(...appleIcons);
    
    // Generate Microsoft icons
    const msIcons = generateMsIcons();
    allIcons.push(...msIcons);
    
    // Generate Android icons
    const androidIcons = generateAndroidIcons();
    allIcons.push(...androidIcons);
    
    // Generate document icons
    generateDocumentIcons();
    
    // Generate manifest
    const manifest = generateManifest(pwaIcons);
    
    // Generate browserconfig
    generateBrowserConfig();
    
    // Generate icon catalog
    const catalog = generateIconCatalog(allIcons);
    
    // Generate HTML snippet
    generateHTMLSnippet(catalog);
    
    // Copy to build directory
    copyToBuild();
    
    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ICON GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📁 Output: ${path.resolve(ICON_CONFIG.outputDir)}`);
    console.log(`📋 Total icons generated: ${catalog?.totalIcons || 'N/A'}`);
    
    if (catalog) {
      console.log('\n📊 Icon Categories:');
      Object.entries(catalog.categories).forEach(([category, icons]) => {
        if (icons.length > 0) {
          console.log(`  ${category}: ${icons.length} icons`);
        }
      });
    }
    
    console.log('\n📝 Next Steps:');
    console.log('  1. Copy icon-snippet.html content to your index.html <head>');
    console.log('  2. Verify manifest.json is in your root directory');
    console.log('  3. Test PWA installation on mobile devices');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// RUN GENERATOR
// ============================================
if (require.main === module) {
  generateIcons().catch(console.error);
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  generateIcons,
  generatePWAIcons,
  generateFavicons,
  generateAppleIcons,
  generateMsIcons,
  generateAndroidIcons,
  generateLogo,
  generateManifest,
  generateIconCatalog,
  SVGTemplates,
  ICON_CONFIG,
  Base64NodeUtil
};
