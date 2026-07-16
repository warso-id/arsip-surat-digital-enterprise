#!/usr/bin/env node

// ==================== PASSWORD RESET SCRIPT ====================
// Arsip Surat Digital Enterprise
// Reset password pengguna dari command line

const bcrypt = require('bcryptjs');
const readline = require('readline');
const path = require('path');

// Setup database
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'src', 'database', 'database.sqlite');

let db;
try {
    db = new Database(dbPath);
} catch (error) {
    console.error('❌ Cannot open database:', error.message);
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   PASSWORD RESET UTILITY                     ║');
console.log('║   Arsip Surat Digital Enterprise             ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');

async function main() {
    // Get username
    const username = await new Promise((resolve) => {
        rl.question('Username: ', (ans) => resolve(ans.trim()));
    });

    if (!username) {
        console.log('❌ Username tidak boleh kosong');
        rl.close();
        return;
    }

    // Check user exists
    const user = db.prepare('SELECT id, username, fullname FROM pengguna WHERE username = ?').get(username);
    
    if (!user) {
        console.log(`❌ User "${username}" tidak ditemukan`);
        rl.close();
        return;
    }

    console.log(`👤 User: ${user.fullname} (${user.username})`);

    // Get new password
    const newPassword = await new Promise((resolve) => {
        rl.question('Password baru (kosongkan untuk generate otomatis): ', (ans) => {
            resolve(ans.trim() || generatePassword());
        });
    });

    // Confirm
    const confirm = await new Promise((resolve) => {
        rl.question(`Reset password untuk "${username}"? (y/n): `, (ans) => {
            resolve(ans.toLowerCase() === 'y');
        });
    });

    if (!confirm) {
        console.log('❌ Dibatalkan');
        rl.close();
        return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update database
    db.prepare('UPDATE pengguna SET password = ?, password_changed_at = datetime("now"), login_attempts = 0 WHERE id = ?')
      .run(hashedPassword, user.id);

    console.log('');
    console.log('✅ Password berhasil direset!');
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${newPassword}`);
    console.log('');
    console.log('⚠️  Simpan password ini dan beritahu pengguna');
    console.log('');

    rl.close();
}

function generatePassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

main().catch(console.error);
