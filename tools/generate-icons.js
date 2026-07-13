/**
 * ICON GENERATOR - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Generate PWA icons in various sizes
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = './src/assets/icons';
const BG_COLOR = '#1976D2';
const FG_COLOR = '#FFFFFF';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.roundRect(size * 0.1, size * 0.1, size * 0.8, size * 0.8, size * 0.2);
  ctx.fill();
  
  // Text
  ctx.fillStyle = FG_COLOR;
  ctx.font = `bold ${size * 0.35}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AS', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  const filePath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Generated icon-${size}x${size}.png`);
}

function generateFavicon() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = BG_COLOR;
  ctx.beginPath();
  ctx.roundRect(2, 2, 28, 28, 6);
  ctx.fill();
  
  ctx.fillStyle = FG_COLOR;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AS', 16, 16);
  
  const buffer = canvas.toBuffer('image/x-icon');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.ico'), buffer);
  console.log('✅ Generated favicon.ico');
}

function generateSVGLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect x="51.2" y="51.2" width="409.6" height="409.6" rx="102.4" fill="#1976D2"/>
    <text x="256" y="256" text-anchor="middle" dominant-baseline="central" 
          font-family="Arial, sans-serif" font-weight="bold" font-size="179.2" fill="#FFFFFF">AS</text>
  </svg>`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'logo.svg'), svg);
  console.log('✅ Generated logo.svg');
}

// Run
console.log('🎨 Generating icons...\n');

generateSVGLogo();
generateFavicon();

SIZES.forEach(size => generateIcon(size));

console.log('\n✅ All icons generated');
