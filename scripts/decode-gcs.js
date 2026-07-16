#!/usr/bin/env node

// ==================== GAS URL DECODER ====================
// Arsip Surat Digital Enterprise
// Decode Google Apps Script URL dari Base64

const crypto = require('crypto');

// Base64 encoded GAS URLs
const GAS_URLS = {
    production: 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==',
    staging: 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==',
};

function decodeBase64(encoded) {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch (error) {
        return `Error decoding: ${error.message}`;
    }
}

function encodeBase64(url) {
    return Buffer.from(url).toString('base64');
}

function verifyUrl(url) {
    return url.startsWith('https://script.google.com/macros/s/') && url.endsWith('/exec');
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0] || 'decode';
const env = args[1] || 'production';

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   GAS URL DECODER / ENCODER                  ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

switch (command) {
    case 'decode':
        if (GAS_URLS[env]) {
            const decoded = decodeBase64(GAS_URLS[env]);
            console.log(`📋 Environment: ${env}`);
            console.log(`🔒 Encoded: ${GAS_URLS[env].substring(0, 50)}...`);
            console.log(`🔓 Decoded: ${decoded}`);
            console.log(`✅ Valid: ${verifyUrl(decoded) ? 'Yes' : 'No'}`);
        } else {
            console.log('Available environments:');
            Object.keys(GAS_URLS).forEach(e => {
                console.log(`  - ${e}`);
            });
        }
        break;
        
    case 'encode':
        const url = args[1];
        if (!url) {
            console.log('Usage: node scripts/decode-gcs.js encode <url>');
            console.log('Example: node scripts/decode-gcs.js encode https://script.google.com/macros/s/.../exec');
            process.exit(1);
        }
        
        if (!verifyUrl(url)) {
            console.log('⚠️  Warning: URL does not match expected GAS pattern');
        }
        
        const encoded = encodeBase64(url);
        console.log(`📋 Original: ${url}`);
        console.log(`🔒 Encoded: ${encoded}`);
        console.log('\n📝 Add to .env:');
        console.log(`GAS_CONFIG_BASE64=${encoded}`);
        break;
        
    case 'verify':
        if (GAS_URLS[env]) {
            const decoded = decodeBase64(GAS_URLS[env]);
            console.log(`Testing connection to: ${decoded}`);
            
            fetch(`${decoded}?action=ping`)
                .then(res => res.json())
                .then(data => {
                    console.log('✅ GAS is reachable!');
                    console.log('Response:', JSON.stringify(data, null, 2));
                })
                .catch(err => {
                    console.log('❌ GAS is not reachable');
                    console.log('Error:', err.message);
                });
        }
        break;
        
    default:
        console.log('Usage:');
        console.log('  node scripts/decode-gcs.js decode [production|staging]');
        console.log('  node scripts/decode-gcs.js encode <url>');
        console.log('  node scripts/decode-gcs.js verify [production|staging]');
}

console.log('');
