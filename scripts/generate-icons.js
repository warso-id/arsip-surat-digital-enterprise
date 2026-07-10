// Script to generate PWA icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Simple SVG-based icon generator
function generateSVGIcon(size, color = '#1976D2') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${color}"/>
  <g transform="translate(${size * 0.2}, ${size * 0.25})">
    <rect x="0" y="0" width="${size * 0.6}" height="${size * 0.08}" fill="white" rx="2"/>
    <rect x="0" y="${size * 0.15}" width="${size * 0.6}" height="${size * 0.08}" fill="white" rx="2"/>
    <rect x="0" y="${size * 0.3}" width="${size * 0.45}" height="${size * 0.08}" fill="white" rx="2"/>
  </g>
  <g transform="translate(${size * 0.65}, ${size * 0.55})">
    <line x1="0" y1="0" x2="${size * 0.12}" y2="${size * 0.12}" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <line x1="${size * 0.12}" y1="${size * 0.12}" x2="0" y2="${size * 0.24}" stroke="white" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>`;
}

// Generate icons
const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'pwa-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'pwa-512x512.png' }
];

const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files (browsers can use SVGs directly)
sizes.forEach(({ size, name }) => {
  const svg = generateSVGIcon(size);
  const svgName = name.replace('.png', '.svg');
  const filePath = path.join(publicDir, svgName);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated: ${svgName}`);
});

// Generate favicon SVG
const faviconSvg = generateSVGIcon(32, '#1976D2');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);
console.log('Generated: favicon.svg');

// Generate apple-touch-icon
const appleIcon = generateSVGIcon(180, '#1976D2');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleIcon);
console.log('Generated: apple-touch-icon.svg');

console.log('\n✅ All icons generated successfully!');
console.log('📁 Location: public/');
