// generate-placeholder.js - Generate placeholder images using Node.js
// Run: node generate-placeholder.js

const fs = require('fs');
const { createCanvas } = require('canvas');

const icons = [
    { name: 'favicon.png', size: 32 },
    { name: 'icon-192x192.png', size: 192 },
    { name: 'icon-512x512.png', size: 512 },
    { name: 'logo.png', size: 200 },
    { name: 'default-avatar.png', size: 100 }
];

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    
    // Rounded rectangle
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (size >= 192) {
        ctx.font = `bold ${size * 0.35}px Arial`;
        ctx.fillText('AS', size/2, size/2);
        
        if (size >= 512) {
            ctx.font = `${size * 0.08}px Arial`;
            ctx.fillText('ENTERPRISE 2026', size/2, size * 0.7);
        }
    } else if (size >= 100) {
        ctx.font = `bold ${size * 0.4}px Arial`;
        ctx.fillText('AS', size/2, size/2);
    } else {
        ctx.font = `bold ${size * 0.5}px Arial`;
        ctx.fillText('A', size/2, size/2);
    }
    
    return canvas.toBuffer('image/png');
}

// Create images directory if not exists
if (!fs.existsSync('./')) {
    fs.mkdirSync('./', { recursive: true });
}

// Generate all icons
icons.forEach(icon => {
    const buffer = generateIcon(icon.size);
    fs.writeFileSync(icon.name, buffer);
    console.log(`Generated: ${icon.name} (${icon.size}x${icon.size})`);
});

console.log('All icons generated successfully!');
