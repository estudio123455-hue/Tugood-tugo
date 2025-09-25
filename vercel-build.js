const { execSync } = require('child_process');

// Install dependencies for the frontend
console.log('Installing frontend dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the frontend
console.log('Building the frontend...');
execSync('npm run build', { stdio: 'inherit' });

// Install dependencies for the backend
console.log('Installing backend dependencies...');
execSync('cd backend && npm install', { stdio: 'inherit' });

console.log('Build completed successfully!');
