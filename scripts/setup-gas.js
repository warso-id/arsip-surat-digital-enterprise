#!/usr/bin/env node

// ==================== GAS SETUP SCRIPT ====================
// Arsip Surat Digital Enterprise
// Setup dan konfigurasi Google Apps Script

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Base64 encoded GAS URL
const GAS_URL_BASE64 = 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3YmxhdXcyOUN2OHJtcmpRSGhmWGdkbDBjc0JIbHhPM3h2WkppbXlCc1N5QTRGNWY5cUgyNUVqNVFZSXUtLU9HeTZCdwvZXhlYw==';
const GAS_URL = Buffer.from(GAS_URL_BASE64, 'base64').toString('utf-8');

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   GOOGLE APPS SCRIPT SETUP                   ║');
console.log('║   Arsip Surat Digital Enterprise             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

async function setup() {
    console.log('📋 Konfigurasi Google Apps Script');
    console.log('');
    console.log('🔒 GAS URL (Base64 Encoded):');
    console.log(`   ${GAS_URL_BASE64.substring(0, 60)}...`);
    console.log('');
    console.log('🔓 Decoded URL:');
    console.log(`   ${GAS_URL}`);
    console.log('');

    // Test connection
    console.log('🔍 Testing connection to GAS...');
    
    try {
        const response = await fetch(`${GAS_URL}?action=ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                payload: Buffer.from(JSON.stringify({ 
                    action: 'ping',
                    timestamp: new Date().toISOString(),
                    source: 'setup-script',
                })).toString('base64')
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ GAS connection successful!');
            console.log('   Response:', JSON.stringify(data).substring(0, 100));
        } else {
            console.log('⚠️  GAS responded with status:', response.status);
        }
    } catch (error) {
        console.log('⚠️  Could not connect to GAS:', error.message);
        console.log('   (This is normal if GAS is not yet deployed)');
    }

    console.log('');

    // Setup sheets
    console.log('📊 Google Sheets yang diperlukan:');
    const sheets = [
        'SuratMasuk',
        'SuratKeluar', 
        'Disposisi',
        'ActivityLog',
        'Pengguna',
        'Instansi',
    ];

    sheets.forEach((sheet, index) => {
        console.log(`   ${index + 1}. ${sheet}`);
    });

    console.log('');
    console.log('📝 Pastikan Google Apps Script memiliki akses ke spreadsheet');
    console.log('   dengan sheet-sheet di atas.');
    console.log('');

    // Save to .env
    const envPath = path.join(__dirname, '..', '.env');
    
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        
        if (!envContent.includes('GAS_CONFIG_BASE64=')) {
            envContent += `\n# Google Apps Script Configuration (Base64 Encoded)\n`;
            envContent += `GAS_CONFIG_BASE64=${GAS_URL_BASE64}\n`;
            fs.writeFileSync(envPath, envContent);
            console.log('✅ GAS_CONFIG_BASE64 added to .env');
        } else {
            console.log('ℹ️  GAS_CONFIG_BASE64 already exists in .env');
        }
    }

    console.log('');
    console.log('✅ GAS Setup Complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Deploy Google Apps Script dari Google Apps Script Editor');
    console.log('   2. Pastikan spreadsheet memiliki sheet yang diperlukan');
    console.log('   3. Jalankan "npm run verify-gas" untuk test koneksi');
    console.log('   4. Gunakan "npm run decode-gas" untuk melihat URL');
    console.log('');
    
    rl.close();
}

setup().catch(console.error);
