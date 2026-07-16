#!/usr/bin/env node

// ==================== HEALTH CHECK SCRIPT ====================
// Arsip Surat Digital Enterprise
// System health monitoring

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG = {
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    checks: ['server', 'database', 'storage', 'memory', 'disk'],
};

class HealthChecker {
    constructor() {
        this.results = {};
        this.startTime = Date.now();
    }

    async runAll() {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║   SYSTEM HEALTH CHECK                        ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');

        for (const check of CONFIG.checks) {
            await this.runCheck(check);
        }

        this.printSummary();
    }

    async runCheck(name) {
        console.log(`🔍 Checking ${name}...`);
        
        try {
            switch (name) {
                case 'server':
                    await this.checkServer();
                    break;
                case 'database':
                    await this.checkDatabase();
                    break;
                case 'storage':
                    await this.checkStorage();
                    break;
                case 'memory':
                    this.checkMemory();
                    break;
                case 'disk':
                    this.checkDisk();
                    break;
            }
        } catch (error) {
            this.results[name] = {
                status: '❌ FAIL',
                message: error.message,
            };
        }
    }

    async checkServer() {
        return new Promise((resolve, reject) => {
            const url = new URL('/health', CONFIG.appUrl);
            const req = http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        this.results.server = {
                            status: result.status === 'ok' ? '✅ PASS' : '⚠️ WARN',
                            message: `Server is running (v${result.version})`,
                            uptime: `${Math.floor(result.uptime / 3600)}h ${Math.floor((result.uptime % 3600) / 60)}m`,
                            memory: result.memory,
                        };
                        resolve();
                    } catch (e) {
                        this.results.server = {
                            status: '❌ FAIL',
                            message: 'Invalid response from server',
                        };
                        resolve();
                    }
                });
            });
            
            req.on('error', (err) => {
                this.results.server = {
                    status: '❌ FAIL',
                    message: `Server not reachable: ${err.message}`,
                };
                resolve();
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                this.results.server = {
                    status: '❌ FAIL',
                    message: 'Server timeout',
                };
                resolve();
            });
        });
    }

    async checkDatabase() {
        const dbPath = path.join(__dirname, '..', 'src', 'database', 'database.sqlite');
        
        if (fs.existsSync(dbPath)) {
            const stats = fs.statSync(dbPath);
            this.results.database = {
                status: '✅ PASS',
                message: 'Database file exists',
                size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                lastModified: stats.mtime.toISOString(),
            };
        } else {
            this.results.database = {
                status: '⚠️ WARN',
                message: 'Database file not found (may use MySQL/PostgreSQL)',
            };
        }
    }

    async checkStorage() {
        const storagePath = path.join(__dirname, '..', 'src', 'storage', 'app');
        
        if (fs.existsSync(storagePath)) {
            const files = this.countFiles(storagePath);
            this.results.storage = {
                status: '✅ PASS',
                message: 'Storage directory exists',
                files: files,
            };
        } else {
            this.results.storage = {
                status: '⚠️ WARN',
                message: 'Storage directory not found',
            };
        }
    }

    countFiles(dir) {
        let count = 0;
        try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);
                if (stats.isDirectory()) {
                    count += this.countFiles(itemPath);
                } else {
                    count++;
                }
            }
        } catch (e) {
            // Ignore
        }
        return count;
    }

    checkMemory() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const percentUsed = ((usedMem / totalMem) * 100).toFixed(1);
        
        let status = '✅ PASS';
        if (percentUsed > 90) status = '❌ FAIL';
        else if (percentUsed > 75) status = '⚠️ WARN';
        
        this.results.memory = {
            status: status,
            message: `${percentUsed}% used`,
            total: `${(totalMem / 1024 / 1024 / 1024).toFixed(1)} GB`,
            free: `${(freeMem / 1024 / 1024 / 1024).toFixed(1)} GB`,
        };
    }

    checkDisk() {
        try {
            const df = require('child_process').execSync('df -h /').toString();
            const lines = df.split('\n');
            if (lines.length > 1) {
                const parts = lines[1].split(/\s+/);
                const percentUsed = parseInt(parts[4]);
                
                let status = '✅ PASS';
                if (percentUsed > 90) status = '❌ FAIL';
                else if (percentUsed > 80) status = '⚠️ WARN';
                
                this.results.disk = {
                    status: status,
                    message: `${percentUsed}% used`,
                    total: parts[1],
                    used: parts[2],
                    available: parts[3],
                };
            }
        } catch (e) {
            this.results.disk = {
                status: '⚠️ WARN',
                message: 'Could not check disk usage',
            };
        }
    }

    printSummary() {
        console.log('');
        console.log('╔══════════════════════════════════════════════╗');
        console.log('║   HEALTH CHECK SUMMARY                       ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');

        let passCount = 0;
        let failCount = 0;
        let warnCount = 0;

        for (const [name, result] of Object.entries(this.results)) {
            const icon = result.status.includes('PASS') ? '✅' : 
                         result.status.includes('WARN') ? '⚠️' : '❌';
            console.log(`${icon} ${name.padEnd(15)}: ${result.message}`);
            
            if (result.status.includes('PASS')) passCount++;
            else if (result.status.includes('WARN')) warnCount++;
            else failCount++;
        }

        console.log('');
        console.log(`Total: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
        console.log(`Time: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
        console.log('');

        if (failCount > 0) {
            process.exit(1);
        }
    }
}

const checker = new HealthChecker();
checker.runAll();
