/**
 * DEPLOY SCRIPT - ARSIP SURAT DIGITAL ENTERPRISE v3.2.2
 * Deploy to GitHub Pages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
  buildDir: './build',
  deployBranch: 'gh-pages',
  commitMessage: 'Deploy v3.2.2 - ' + new Date().toISOString(),
  remote: 'origin'
};

function deploy() {
  console.log('🚀 Starting deployment...\n');
  
  try {
    // Check if build exists
    if (!fs.existsSync(CONFIG.buildDir)) {
      console.error('❌ Build directory not found. Run "npm run build" first.');
      process.exit(1);
    }
    
    // Check if we're in the right branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    console.log(`📁 Current branch: ${currentBranch}`);
    
    // Save current changes
    console.log('💾 Saving current changes...');
    execSync('git add .');
    
    try {
      execSync('git commit -m "Pre-deploy commit"');
    } catch {
      console.log('  No changes to commit');
    }
    
    // Create deploy directory
    const deployDir = path.join(__dirname, '..', '.deploy');
    if (fs.existsSync(deployDir)) {
      fs.rmSync(deployDir, { recursive: true });
    }
    fs.mkdirSync(deployDir);
    
    // Copy build files to deploy directory
    console.log('📦 Copying build files...');
    copyDir(CONFIG.buildDir, deployDir);
    
    // Create CNAME if needed
    const cnamePath = path.join(__dirname, '..', 'CNAME');
    if (fs.existsSync(cnamePath)) {
      fs.copyFileSync(cnamePath, path.join(deployDir, 'CNAME'));
    }
    
    // Create .nojekyll for GitHub Pages
    fs.writeFileSync(path.join(deployDir, '.nojekyll'), '');
    
    // Switch to deploy branch
    console.log(`🔄 Switching to ${CONFIG.deployBranch} branch...`);
    
    try {
      execSync(`git checkout ${CONFIG.deployBranch}`);
    } catch {
      // Create orphan branch
      execSync(`git checkout --orphan ${CONFIG.deployBranch}`);
      execSync('git rm -rf .');
    }
    
    // Copy deploy files
    console.log('📦 Copying files to deploy branch...');
    const deployFiles = fs.readdirSync(deployDir);
    deployFiles.forEach(file => {
      const src = path.join(deployDir, file);
      const dest = path.join(__dirname, '..', file);
      
      if (fs.statSync(src).isDirectory()) {
        copyDir(src, dest);
      } else {
        fs.copyFileSync(src, dest);
      }
    });
    
    // Commit and push
    console.log('📝 Committing...');
    execSync('git add .');
    execSync(`git commit -m "${CONFIG.commitMessage}"`);
    
    console.log('📤 Pushing...');
    execSync(`git push ${CONFIG.remote} ${CONFIG.deployBranch} --force`);
    
    // Switch back to original branch
    console.log(`🔄 Switching back to ${currentBranch}...`);
    execSync(`git checkout ${currentBranch}`);
    
    // Clean up
    fs.rmSync(deployDir, { recursive: true });
    
    console.log('\n✅ Deployment complete!');
    console.log(`🌐 Site should be available at your GitHub Pages URL`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run deploy
deploy();
