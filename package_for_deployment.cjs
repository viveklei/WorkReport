const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = 'deployment_package';
const ZIP_NAME = 'reports_leip_co_in_dist.zip';

console.log('🚀 Starting deployment preparation...');

try {
  // 1. Run build
  console.log('📦 Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Create clean deployment directory
  if (fs.existsSync(DEPLOY_DIR)) {
    fs.rmSync(DEPLOY_DIR, { recursive: true });
  }
  fs.mkdirSync(DEPLOY_DIR);

  // 3. Copy dist folder contents
  console.log('📂 Copying dist folder...');
  const distPath = path.join(process.cwd(), 'dist');
  fs.cpSync(distPath, path.join(DEPLOY_DIR, 'dist'), { recursive: true });

  // 4. Copy server logic
  console.log('📂 Copying server files...');
  fs.cpSync('server', path.join(DEPLOY_DIR, 'server'), { recursive: true });

  // 5. Copy manifest/entry files
  console.log('📄 Copying entry points and config...');
  fs.copyFileSync('app.js', path.join(DEPLOY_DIR, 'app.js'));
  fs.copyFileSync('.htaccess', path.join(DEPLOY_DIR, '.htaccess'));
  
  // Use server-package.json as the main package.json for Namecheap
  if (fs.existsSync('server-package.json')) {
    fs.copyFileSync('server-package.json', path.join(DEPLOY_DIR, 'package.json'));
  } else {
    fs.copyFileSync('package.json', path.join(DEPLOY_DIR, 'package.json'));
  }

  // Copy producton .env
  if (fs.existsSync('server/.env')) {
    fs.copyFileSync('server/.env', path.join(DEPLOY_DIR, '.env'));
  }

  console.log('\n✅ Standalone Deployment package ready in /' + DEPLOY_DIR);
  console.log('--------------------------------------------------');
  console.log('Next Steps for New Deployment (reports.leip.co.in):');
  console.log('1. Zip all contents of /' + DEPLOY_DIR);
  console.log('2. Upload to the subdomain root on cPanel File Manager.');
  console.log('3. Use "Setup Node.js App" in cPanel:');
  console.log('   - Application Root: [your subdomain folder]');
  console.log('   - Application URL: reports.leip.co.in');
  console.log('   - Startup File: app.js');
  console.log('4. Click "Run JS Install" in the Node tool.');
  console.log('--------------------------------------------------');

} catch (error) {
  console.error('❌ Error during packaging:', error.message);
  process.exit(1);
}
