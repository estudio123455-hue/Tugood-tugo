const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fix permissions for node_modules/.bin
console.log('Fixing permissions...');
const fixPermissions = () => {
  const binPath = path.join(process.cwd(), 'node_modules', '.bin');
  if (fs.existsSync(binPath)) {
    fs.readdirSync(binPath).forEach(file => {
      const filePath = path.join(binPath, file);
      try {
        fs.chmodSync(filePath, '755');
      } catch (err) {
        console.warn(`Warning: Could not set permissions for ${filePath}`);
      }
    });
  }
};

// Install dependencies for the frontend
console.log('Installing frontend dependencies...');
const frontendDeps = execSync('npm ci --prefer-offline --no-audit', { stdio: 'inherit' });
if (frontendDeps !== 0) {
  console.error('Failed to install frontend dependencies');
  process.exit(1);
}

// Fix permissions for frontend node_modules
fixPermissions();

// Build the frontend
console.log('Building the frontend...');
const buildResult = execSync('npm run build', { stdio: 'inherit' });
if (buildResult !== 0) {
  console.error('Frontend build failed');
  process.exit(1);
}

// Install dependencies for the backend
console.log('Installing backend dependencies...');
const backendDeps = execSync('cd backend && npm ci --prefer-offline --no-audit', { stdio: 'inherit' });
if (backendDeps !== 0) {
  console.error('Failed to install backend dependencies');
  process.exit(1);
}

console.log('Build completed successfully!');
