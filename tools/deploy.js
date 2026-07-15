/**
 * DEPLOY SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * File: tools/deploy.js
 * Support: Google Apps Script (code.gs) + Google Sheets + Frontend
 * Encoding: Base64 untuk keamanan deploy artifacts
 * Multi-platform deployment: GitHub Pages, Google Apps Script, Netlify, Vercel
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

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
    const buffer = fs.readFileSync(filePath);
    return buffer.toString('base64');
  },
  decodeToFile(base64Str, outputPath) {
    const buffer = Buffer.from(base64Str, 'base64');
    fs.writeFileSync(outputPath, buffer);
  }
};

// ============================================
// DEPLOY CONFIGURATION
// ============================================
const DEPLOY_CONFIG = {
  // App Info
  APP_NAME: 'Arsip Surat Digital Enterprise',
  APP_VERSION: '3.2.2',
  
  // Directories
  buildDir: './build',
  deployDir: './.deploy',
  backupDir: './.deploy-backups',
  
  // Git Configuration
  git: {
    deployBranch: 'gh-pages',
    remote: 'origin',
    commitPrefix: '🚀 Deploy',
    tagPrefix: 'v',
    pushForce: false
  },
  
  // Google Apps Script Configuration
  gas: {
    enabled: true,
    scriptId: '', // Will be read from .env or config
    deploymentDescription: 'Production Deployment',
    deploymentVersion: '1',
    claspConfigPath: './.clasp.json',
    manifestPath: './appsscript.json'
  },
  
  // Deployment Targets
  targets: {
    github: {
      enabled: true,
      name: 'GitHub Pages',
      url: '' // Will be set during deploy
    },
    gas: {
      enabled: true,
      name: 'Google Apps Script',
      url: '' // Will be set during deploy
    },
    netlify: {
      enabled: false,
      name: 'Netlify',
      siteId: '', // From NETLIFY_SITE_ID env
      token: ''   // From NETLIFY_AUTH_TOKEN env
    },
    vercel: {
      enabled: false,
      name: 'Vercel',
      token: '',  // From VERCEL_TOKEN env
      orgId: '',  // From VERCEL_ORG_ID env
      projectId: '' // From VERCEL_PROJECT_ID env
    }
  },
  
  // Backup Settings
  backup: {
    enabled: true,
    keepLast: 5,
    includeGasFiles: true
  },
  
  // Validation Settings
  validation: {
    checkBuildSize: true,
    maxBuildSizeMB: 50,
    checkEndpoints: true,
    requiredFiles: [
      'index.html',
      'css/app.bundle.css',
      'js/app.bundle.js',
      'manifest.json',
      'service-worker.js'
    ]
  },
  
  // Post-Deploy Actions
  postDeploy: {
    runTests: false,
    notifySlack: false,
    slackWebhookUrl: '',
    updateChangelog: true,
    createTag: true
  }
};

// ============================================
// DEPLOY STATE
// ============================================
const deployState = {
  startTime: null,
  endTime: null,
  target: null,
  status: 'pending',
  steps: [],
  errors: [],
  warnings: [],
  artifacts: {},
  backupPath: null
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const DeployUtils = {
  /**
   * Execute shell command
   */
  exec(command, options = {}) {
    try {
      return execSync(command, {
        encoding: 'utf-8',
        stdio: options.silent ? 'pipe' : 'inherit',
        ...options
      });
    } catch (error) {
      if (!options.ignoreError) {
        throw error;
      }
      return error.stdout || '';
    }
  },

  /**
   * Execute async command
   */
  execAsync(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        ...options
      });
      
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed with code ${code}`));
      });
      
      child.on('error', reject);
    });
  },

  /**
   * Copy directory recursively
   */
  copyDir(src, dest, excludePatterns = []) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      // Check exclude patterns
      if (excludePatterns.some(pattern => entry.name.match(pattern))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath, excludePatterns);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  },

  /**
   * Get directory size
   */
  getDirSize(dirPath) {
    let size = 0;
    if (!fs.existsSync(dirPath)) return size;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += this.getDirSize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
    return size;
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
   * Generate hash
   */
  generateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  /**
   * Timestamp formatter
   */
  timestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  },

  /**
   * Create backup of current deployment
   */
  createBackup() {
    if (!DEPLOY_CONFIG.backup.enabled) return null;
    
    const backupName = `deploy-backup-${this.timestamp()}`;
    const backupPath = path.join(DEPLOY_CONFIG.backupDir, backupName);
    
    if (fs.existsSync(DEPLOY_CONFIG.buildDir)) {
      this.copyDir(DEPLOY_CONFIG.buildDir, path.join(backupPath, 'build'));
    }
    
    // Backup GAS files
    if (DEPLOY_CONFIG.backup.includeGasFiles) {
      const gasFiles = ['.clasp.json', 'appsscript.json', 'code.gs'];
      gasFiles.forEach(file => {
        const filePath = path.join('./', file);
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, path.join(backupPath, file));
        }
      });
    }
    
    // Clean old backups
    this.cleanOldBackups();
    
    return backupPath;
  },

  /**
   * Clean old backups
   */
  cleanOldBackups() {
    const backupDir = DEPLOY_CONFIG.backupDir;
    if (!fs.existsSync(backupDir)) return;
    
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('deploy-backup-'))
      .sort()
      .reverse();
    
    const toDelete = backups.slice(DEPLOY_CONFIG.backup.keepLast);
    toDelete.forEach(backup => {
      const backupPath = path.join(backupDir, backup);
      fs.rmSync(backupPath, { recursive: true });
      console.log(`  🗑️  Removed old backup: ${backup}`);
    });
  },

  /**
   * Validate build
   */
  validateBuild() {
    console.log('\n🔍 Validating build...');
    const errors = [];
    const warnings = [];
    
    // Check build directory exists
    if (!fs.existsSync(DEPLOY_CONFIG.buildDir)) {
      errors.push('Build directory not found. Run "npm run build" first.');
      return { valid: false, errors, warnings };
    }
    
    // Check required files
    for (const file of DEPLOY_CONFIG.validation.requiredFiles) {
      const filePath = path.join(DEPLOY_CONFIG.buildDir, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Required file missing: ${file}`);
      }
    }
    
    // Check build size
    if (DEPLOY_CONFIG.validation.checkBuildSize) {
      const buildSize = this.getDirSize(DEPLOY_CONFIG.buildDir);
      const maxSize = DEPLOY_CONFIG.validation.maxBuildSizeMB * 1024 * 1024;
      
      if (buildSize > maxSize) {
        warnings.push(`Build size (${this.formatSize(buildSize)}) exceeds maximum (${this.formatSize(maxSize)})`);
      }
      
      console.log(`  📦 Build size: ${this.formatSize(buildSize)}`);
    }
    
    // Check endpoints if validation enabled
    if (DEPLOY_CONFIG.validation.checkEndpoints) {
      const gasConfigPath = path.join(DEPLOY_CONFIG.buildDir, 'data', 'gas-config.json');
      if (fs.existsSync(gasConfigPath)) {
        const gasConfig = JSON.parse(fs.readFileSync(gasConfigPath, 'utf-8'));
        console.log(`  🔗 GAS Endpoints: ${gasConfig.totalEndpoints || gasConfig.endpoints?.length || 0}`);
      }
    }
    
    const valid = errors.length === 0;
    
    if (valid) {
      console.log('  ✅ Build validation passed');
    } else {
      console.log('  ❌ Build validation failed');
      errors.forEach(e => console.log(`    - ${e}`));
    }
    
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    
    return { valid, errors, warnings };
  },

  /**
   * Get current Git info
   */
  getGitInfo() {
    const info = {
      branch: '',
      commit: '',
      tag: '',
      remote: ''
    };
    
    try {
      info.branch = this.exec('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();
      info.commit = this.exec('git rev-parse --short HEAD', { silent: true }).trim();
      info.tag = this.exec('git describe --tags --exact-match 2>/dev/null || echo ""', { silent: true, ignoreError: true }).trim();
      info.remote = this.exec('git remote get-url origin', { silent: true }).trim();
    } catch (e) {
      // Not a git repository or git not available
    }
    
    return info;
  }
};

// ============================================
// DEPLOY TARGET HANDLERS
// ============================================

/**
 * Deploy to GitHub Pages
 */
async function deployToGitHubPages() {
  console.log('\n📦 Deploying to GitHub Pages...');
  
  const gitInfo = DeployUtils.getGitInfo();
  
  if (!gitInfo.branch) {
    throw new Error('Not a git repository. Cannot deploy to GitHub Pages.');
  }
  
  const currentBranch = gitInfo.branch;
  console.log(`  📁 Current branch: ${currentBranch}`);
  console.log(`  📝 Commit: ${gitInfo.commit}`);
  
  // Save current changes
  console.log('  💾 Saving current changes...');
  DeployUtils.exec('git add .');
  
  try {
    DeployUtils.exec('git commit -m "💾 Pre-deploy save"', { silent: true });
    console.log('  ✅ Changes committed');
  } catch {
    console.log('  ℹ️  No changes to commit');
  }
  
  // Create deploy directory
  const deployDir = path.resolve(DEPLOY_CONFIG.deployDir);
  if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true });
  }
  fs.mkdirSync(deployDir, { recursive: true });
  
  // Copy build files to deploy directory
  console.log('  📦 Copying build files...');
  DeployUtils.copyDir(DEPLOY_CONFIG.buildDir, deployDir, ['node_modules', '.git']);
  
  // Create CNAME if exists
  const cnamePath = path.resolve('./CNAME');
  if (fs.existsSync(cnamePath)) {
    fs.copyFileSync(cnamePath, path.join(deployDir, 'CNAME'));
    console.log('  🌐 CNAME file copied');
  }
  
  // Create .nojekyll for GitHub Pages
  fs.writeFileSync(path.join(deployDir, '.nojekyll'), '');
  
  // Create 404.html for SPA
  const indexPath = path.join(deployDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(deployDir, '404.html'));
    console.log('  📄 404.html created for SPA routing');
  }
  
  // Create deploy info file
  const deployInfo = {
    app: DEPLOY_CONFIG.APP_NAME,
    version: DEPLOY_CONFIG.APP_VERSION,
    deployedAt: new Date().toISOString(),
    gitCommit: gitInfo.commit,
    gitBranch: currentBranch,
    buildSize: DeployUtils.formatSize(DeployUtils.getDirSize(deployDir))
  };
  
  fs.writeFileSync(
    path.join(deployDir, 'data', 'deploy-info.json'),
    JSON.stringify(deployInfo, null, 2)
  );
  
  // Base64 encoded deploy info
  fs.writeFileSync(
    path.join(deployDir, 'data', 'deploy-info.base64'),
    Base64NodeUtil.encodeObject(deployInfo)
  );
  
  // Switch to deploy branch
  const deployBranch = DEPLOY_CONFIG.git.deployBranch;
  console.log(`  🔄 Switching to ${deployBranch} branch...`);
  
  try {
    DeployUtils.exec(`git checkout ${deployBranch}`, { silent: true });
  } catch {
    // Create orphan branch if not exists
    console.log(`  📝 Creating ${deployBranch} branch...`);
    DeployUtils.exec(`git checkout --orphan ${deployBranch}`, { silent: true });
    DeployUtils.exec('git rm -rf .', { silent: true, ignoreError: true });
  }
  
  // Clean existing files
  try {
    DeployUtils.exec('git rm -rf .', { silent: true, ignoreError: true });
  } catch {}
  
  // Remove all except .git
  const existingFiles = fs.readdirSync('./').filter(f => f !== '.git');
  existingFiles.forEach(file => {
    const filePath = path.resolve(file);
    if (fs.statSync(filePath).isDirectory()) {
      fs.rmSync(filePath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(filePath);
    }
  });
  
  // Copy deploy files to root
  console.log('  📦 Copying files to deploy branch...');
  DeployUtils.copyDir(deployDir, './');
  
  // Git add, commit, push
  console.log('  📝 Committing...');
  const commitMessage = `${DEPLOY_CONFIG.git.commitPrefix} ${DEPLOY_CONFIG.APP_VERSION} - ${new Date().toISOString()}`;
  
  DeployUtils.exec('git add .');
  
  try {
    DeployUtils.exec(`git commit -m "${commitMessage}"`);
    console.log('  ✅ Committed');
  } catch (e) {
    if (e.message.includes('nothing to commit')) {
      console.log('  ℹ️  No changes to deploy');
    } else {
      throw e;
    }
  }
  
  // Push
  console.log('  📤 Pushing...');
  const pushCommand = DEPLOY_CONFIG.git.pushForce 
    ? `git push ${DEPLOY_CONFIG.git.remote} ${deployBranch} --force`
    : `git push ${DEPLOY_CONFIG.git.remote} ${deployBranch}`;
  
  DeployUtils.exec(pushCommand);
  console.log('  ✅ Pushed');
  
  // Switch back
  console.log(`  🔄 Switching back to ${currentBranch}...`);
  DeployUtils.exec(`git checkout ${currentBranch}`);
  
  // Clean up deploy directory
  fs.rmSync(deployDir, { recursive: true });
  
  // Get GitHub Pages URL
  let pagesUrl = '';
  if (gitInfo.remote.includes('github.com')) {
    const match = gitInfo.remote.match(/github\.com[:/]([^/]+)\/([^.]+)/);
    if (match) {
      pagesUrl = `https://${match[1]}.github.io/${match[2]}`;
    }
  }
  
  DEPLOY_CONFIG.targets.github.url = pagesUrl;
  
  console.log(`  ✅ GitHub Pages deployment complete`);
  if (pagesUrl) {
    console.log(`  🌐 URL: ${pagesUrl}`);
  }
  
  return { success: true, url: pagesUrl };
}

/**
 * Deploy to Google Apps Script
 */
async function deployToGoogleAppsScript() {
  console.log('\n📦 Deploying to Google Apps Script...');
  
  // Check if clasp is installed
  try {
    DeployUtils.exec('npx clasp --version', { silent: true });
  } catch {
    console.log('  📦 Installing @google/clasp...');
    DeployUtils.exec('npm install -g @google/clasp', { silent: true });
  }
  
  // Check clasp config
  const claspConfigPath = DEPLOY_CONFIG.gas.claspConfigPath;
  if (!fs.existsSync(claspConfigPath)) {
    console.log('  ⚠️  .clasp.json not found. Skipping GAS deployment.');
    console.log('  ℹ️  Run "npx clasp login" and "npx clasp create" first.');
    return { success: false, skipped: true, reason: 'No .clasp.json' };
  }
  
  // Read clasp config
  const claspConfig = JSON.parse(fs.readFileSync(claspConfigPath, 'utf-8'));
  console.log(`  📋 Script ID: ${claspConfig.scriptId}`);
  
  // Prepare GAS deployment files
  const gasDeployDir = path.join(DEPLOY_CONFIG.deployDir, 'gas');
  if (fs.existsSync(gasDeployDir)) {
    fs.rmSync(gasDeployDir, { recursive: true });
  }
  fs.mkdirSync(gasDeployDir, { recursive: true });
  
  // Copy GAS-specific files
  const gasFiles = [
    'code.gs',
    'appsscript.json',
    '.clasp.json',
    '.claspignore'
  ];
  
  gasFiles.forEach(file => {
    const srcPath = path.resolve(file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(gasDeployDir, file));
    }
  });
  
  // Copy frontend files (for GAS web app)
  const frontendDir = path.join(gasDeployDir, 'frontend');
  fs.mkdirSync(frontendDir, { recursive: true });
  
  if (fs.existsSync(DEPLOY_CONFIG.buildDir)) {
    DeployUtils.copyDir(DEPLOY_CONFIG.buildDir, frontendDir);
  }
  
  // Generate GAS-specific config
  const gasDeployConfig = {
    app: DEPLOY_CONFIG.APP_NAME,
    version: DEPLOY_CONFIG.APP_VERSION,
    deployedAt: new Date().toISOString(),
    scriptId: claspConfig.scriptId,
    type: 'webapp',
    access: 'DOMAIN',
    executeAs: 'USER_ACCESSING'
  };
  
  fs.writeFileSync(
    path.join(gasDeployDir, 'deploy-config.json'),
    JSON.stringify(gasDeployConfig, null, 2)
  );
  
  // Base64 encoded config
  fs.writeFileSync(
    path.join(gasDeployDir, 'deploy-config.base64'),
    Base64NodeUtil.encodeObject(gasDeployConfig)
  );
  
  // Push to Google Apps Script
  console.log('  📤 Pushing to Google Apps Script...');
  
  try {
    // Change to GAS deploy directory
    const originalDir = process.cwd();
    process.chdir(gasDeployDir);
    
    DeployUtils.exec('npx clasp push', { silent: true });
    console.log('  ✅ Code pushed');
    
    // Deploy
    const deployCommand = `npx clasp deploy --description "${DEPLOY_CONFIG.gas.deploymentDescription}"`;
    const deployOutput = DeployUtils.exec(deployCommand, { silent: true });
    console.log('  ✅ Deployment created');
    
    // Extract deployment ID
    const deployMatch = deployOutput.match(/- ([^\s]+) @/);
    const deploymentId = deployMatch ? deployMatch[1] : 'unknown';
    
    console.log(`  📋 Deployment ID: ${deploymentId}`);
    
    // Get web app URL
    const webappUrl = `https://script.google.com/macros/s/${claspConfig.scriptId}/exec`;
    DEPLOY_CONFIG.targets.gas.url = webappUrl;
    
    console.log(`  🌐 Web App URL: ${webappUrl}`);
    
    // Return to original directory
    process.chdir(originalDir);
    
    return { success: true, deploymentId, url: webappUrl };
    
  } catch (error) {
    console.error('  ❌ GAS deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Netlify
 */
async function deployToNetlify() {
  console.log('\n📦 Deploying to Netlify...');
  
  const siteId = process.env.NETLIFY_SITE_ID || DEPLOY_CONFIG.targets.netlify.siteId;
  const token = process.env.NETLIFY_AUTH_TOKEN || DEPLOY_CONFIG.targets.netlify.token;
  
  if (!siteId || !token) {
    console.log('  ⚠️  Netlify credentials not configured. Skipping.');
    return { success: false, skipped: true, reason: 'Missing credentials' };
  }
  
  // Check if netlify-cli is installed
  try {
    DeployUtils.exec('npx netlify --version', { silent: true });
  } catch {
    console.log('  📦 Installing netlify-cli...');
    DeployUtils.exec('npm install -g netlify-cli', { silent: true });
  }
  
  console.log('  📤 Deploying to Netlify...');
  
  const deployCommand = `npx netlify deploy --prod --dir=${DEPLOY_CONFIG.buildDir} --site=${siteId} --auth=${token} --message="Deploy ${DEPLOY_CONFIG.APP_VERSION}"`;
  
  try {
    DeployUtils.exec(deployCommand);
    console.log('  ✅ Netlify deployment complete');
    return { success: true };
  } catch (error) {
    console.error('  ❌ Netlify deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Deploy to Vercel
 */
async function deployToVercel() {
  console.log('\n📦 Deploying to Vercel...');
  
  const token = process.env.VERCEL_TOKEN || DEPLOY_CONFIG.targets.vercel.token;
  
  if (!token) {
    console.log('  ⚠️  Vercel token not configured. Skipping.');
    return { success: false, skipped: true, reason: 'Missing token' };
  }
  
  try {
    DeployUtils.exec('npx vercel --version', { silent: true });
  } catch {
    console.log('  📦 Installing vercel...');
    DeployUtils.exec('npm install -g vercel', { silent: true });
  }
  
  console.log('  📤 Deploying to Vercel...');
  
  const deployCommand = `npx vercel deploy --prod --token=${token} ${DEPLOY_CONFIG.buildDir}`;
  
  try {
    DeployUtils.exec(deployCommand);
    console.log('  ✅ Vercel deployment complete');
    return { success: true };
  } catch (error) {
    console.error('  ❌ Vercel deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

// ============================================
// POST-DEPLOY ACTIONS
// ============================================
async function runPostDeployActions(deployResults) {
  console.log('\n📋 Running post-deploy actions...');
  
  // Create Git tag
  if (DEPLOY_CONFIG.postDeploy.createTag) {
    const tagName = `${DEPLOY_CONFIG.git.tagPrefix}${DEPLOY_CONFIG.APP_VERSION}`;
    const tagMessage = `Release ${DEPLOY_CONFIG.APP_VERSION} - ${new Date().toISOString()}`;
    
    try {
      // Check if tag exists
      DeployUtils.exec(`git tag -d ${tagName}`, { silent: true, ignoreError: true });
      DeployUtils.exec(`git tag -a ${tagName} -m "${tagMessage}"`);
      DeployUtils.exec(`git push ${DEPLOY_CONFIG.git.remote} ${tagName}`);
      console.log(`  🏷️  Git tag created: ${tagName}`);
    } catch (error) {
      console.log(`  ⚠️  Could not create tag: ${error.message}`);
    }
  }
  
  // Update changelog
  if (DEPLOY_CONFIG.postDeploy.updateChangelog) {
    const changelogPath = './CHANGELOG.md';
    const changelogEntry = `\n## [${DEPLOY_CONFIG.APP_VERSION}] - ${new Date().toISOString().split('T')[0]}\n\n### Deployed\n- Deployment date: ${new Date().toISOString()}\n- Targets: ${Object.entries(deployResults).filter(([_, v]) => v.success).map(([k]) => k).join(', ')}\n`;
    
    if (fs.existsSync(changelogPath)) {
      let changelog = fs.readFileSync(changelogPath, 'utf-8');
      changelog = changelog.replace('# Changelog', `# Changelog\n${changelogEntry}`);
      fs.writeFileSync(changelogPath, changelog);
      console.log('  📝 Changelog updated');
    }
  }
  
  // Save deploy record
  const deployRecord = {
    version: DEPLOY_CONFIG.APP_VERSION,
    deployedAt: new Date().toISOString(),
    results: deployResults,
    gitInfo: DeployUtils.getGitInfo()
  };
  
  const recordsPath = './.deploy-records.json';
  let records = [];
  if (fs.existsSync(recordsPath)) {
    records = JSON.parse(fs.readFileSync(recordsPath, 'utf-8'));
  }
  records.push(deployRecord);
  
  // Keep last 20 records
  if (records.length > 20) {
    records = records.slice(-20);
  }
  
  fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
  console.log('  📋 Deploy record saved');
  
  // Base64 encoded record
  fs.writeFileSync(
    './.deploy-records.base64',
    Base64NodeUtil.encodeObject(deployRecord)
  );
}

// ============================================
// DEPLOY SUMMARY
// ============================================
function printDeploySummary(deployResults) {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`📱 App: ${DEPLOY_CONFIG.APP_NAME} v${DEPLOY_CONFIG.APP_VERSION}`);
  console.log(`⏱️  Duration: ${((Date.now() - deployState.startTime) / 1000).toFixed(1)} seconds`);
  console.log('');
  
  for (const [target, result] of Object.entries(deployResults)) {
    const status = result.success ? '✅' : result.skipped ? '⏭️' : '❌';
    console.log(`${status} ${DEPLOY_CONFIG.targets[target]?.name || target}`);
    
    if (result.url) {
      console.log(`   🌐 ${result.url}`);
    }
    if (result.deploymentId) {
      console.log(`   📋 ID: ${result.deploymentId}`);
    }
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    if (result.reason) {
      console.log(`   ℹ️  ${result.reason}`);
    }
  }
  
  console.log('');
  console.log(`📁 Build: ${path.resolve(DEPLOY_CONFIG.buildDir)}`);
  
  if (deployState.backupPath) {
    console.log(`💾 Backup: ${deployState.backupPath}`);
  }
  
  console.log('='.repeat(60));
}

// ============================================
// INTERACTIVE DEPLOY
// ============================================
async function interactiveDeploy() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('\n📋 Available deployment targets:');
    
    const targets = Object.entries(DEPLOY_CONFIG.targets)
      .filter(([, config]) => config.enabled);
    
    targets.forEach(([key, config], index) => {
      console.log(`  ${index + 1}. ${config.name} (${key})`);
    });
    console.log(`  ${targets.length + 1}. All targets`);
    console.log(`  ${targets.length + 2}. Cancel`);
    
    rl.question('\nSelect target (number): ', (answer) => {
      rl.close();
      
      const choice = parseInt(answer);
      
      if (choice === targets.length + 2 || isNaN(choice)) {
        console.log('❌ Deployment cancelled');
        resolve(null);
        return;
      }
      
      if (choice === targets.length + 1) {
        resolve('all');
        return;
      }
      
      if (choice >= 1 && choice <= targets.length) {
        resolve(targets[choice - 1][0]);
        return;
      }
      
      console.log('❌ Invalid choice');
      resolve(null);
    });
  });
}

// ============================================
// MAIN DEPLOY FUNCTION
// ============================================
async function deploy(target = 'all') {
  deployState.startTime = Date.now();
  
  console.log('🚀 Starting deployment for ' + DEPLOY_CONFIG.APP_NAME + ' v' + DEPLOY_CONFIG.APP_VERSION);
  console.log('📅 ' + new Date().toISOString());
  
  try {
    // Interactive mode if no target specified
    if (!target || target === 'interactive') {
      target = await interactiveDeploy();
      if (!target) {
        process.exit(0);
      }
    }
    
    // Validate build
    const validation = DeployUtils.validateBuild();
    if (!validation.valid) {
      console.error('\n❌ Build validation failed. Fix errors before deploying.');
      validation.errors.forEach(e => console.error(`  - ${e}`));
      process.exit(1);
    }
    
    // Create backup
    deployState.backupPath = DeployUtils.createBackup();
    if (deployState.backupPath) {
      console.log(`\n💾 Backup created: ${deployState.backupPath}`);
    }
    
    // Determine targets
    let targetsToDeploy = [];
    if (target === 'all') {
      targetsToDeploy = Object.keys(DEPLOY_CONFIG.targets).filter(
        t => DEPLOY_CONFIG.targets[t].enabled
      );
    } else {
      targetsToDeploy = [target];
    }
    
    console.log(`\n🎯 Deploying to: ${targetsToDeploy.map(t => DEPLOY_CONFIG.targets[t]?.name || t).join(', ')}`);
    
    // Deploy to each target
    const deployResults = {};
    
    for (const targetName of targetsToDeploy) {
      switch (targetName) {
        case 'github':
          deployResults.github = await deployToGitHubPages();
          break;
        case 'gas':
          deployResults.gas = await deployToGoogleAppsScript();
          break;
        case 'netlify':
          deployResults.netlify = await deployToNetlify();
          break;
        case 'vercel':
          deployResults.vercel = await deployToVercel();
          break;
        default:
          console.log(`  ⚠️  Unknown target: ${targetName}`);
      }
    }
    
    // Run post-deploy actions
    await runPostDeployActions(deployResults);
    
    // Update state
    deployState.endTime = Date.now();
    deployState.status = 'success';
    
    // Print summary
    printDeploySummary(deployResults);
    
    console.log('\n✅ Deployment complete!\n');
    
  } catch (error) {
    deployState.status = 'failed';
    deployState.errors.push(error.message);
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// CLI PARSING
// ============================================
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'all',
    force: false,
    skipValidation: false,
    skipBackup: false,
    interactive: false
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
      case '-t':
        options.target = args[++i];
        break;
      case '--force':
      case '-f':
        options.force = true;
        DEPLOY_CONFIG.git.pushForce = true;
        break;
      case '--skip-validation':
        options.skipValidation = true;
        break;
      case '--skip-backup':
        options.skipBackup = true;
        DEPLOY_CONFIG.backup.enabled = false;
        break;
      case '--interactive':
      case '-i':
        options.interactive = true;
        break;
      case '--github':
        options.target = 'github';
        break;
      case '--gas':
        options.target = 'gas';
        break;
      case '--netlify':
        options.target = 'netlify';
        break;
      case '--vercel':
        options.target = 'vercel';
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function printHelp() {
  console.log(`
🚀 Arsip Surat Digital Enterprise - Deploy Script v${DEPLOY_CONFIG.APP_VERSION}

Usage: node tools/deploy.js [options]

Options:
  -t, --target <target>   Deploy to specific target (github, gas, netlify, vercel, all)
  -f, --force             Force push to deploy branch
  --github                Deploy to GitHub Pages
  --gas                   Deploy to Google Apps Script
  --netlify               Deploy to Netlify
  --vercel                Deploy to Vercel
  -i, --interactive       Interactive mode (select target)
  --skip-validation       Skip build validation
  --skip-backup           Skip creating backup
  -h, --help              Show this help

Examples:
  node tools/deploy.js                    # Deploy to all enabled targets
  node tools/deploy.js --github           # Deploy to GitHub Pages only
  node tools/deploy.js -t gas             # Deploy to Google Apps Script only
  node tools/deploy.js -i                 # Interactive mode
  node tools/deploy.js --force            # Force push deployment
`);
}

// ============================================
// RUN DEPLOY
// ============================================
if (require.main === module) {
  const options = parseArgs();
  
  deploy(options.interactive ? 'interactive' : options.target)
    .catch(console.error);
}

// ============================================
// EXPORT FOR MODULE USAGE
// ============================================
module.exports = {
  deploy,
  deployToGitHubPages,
  deployToGoogleAppsScript,
  deployToNetlify,
  deployToVercel,
  DeployUtils,
  DEPLOY_CONFIG,
  Base64NodeUtil
};
