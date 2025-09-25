const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to run commands with better error handling
const runCommand = (command, cwd = process.cwd()) => {
  console.log(`Running: ${command} in ${cwd}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    return { success: true, result };
  } catch (error) {
    console.error(`Command failed: ${command}`, error);
    return { success: false, error };
  }
};

// Main build function
const build = async () => {
  try {
    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    const frontendInstall = runCommand('npm install --legacy-peer-deps --prefer-offline --no-audit');
    if (!frontendInstall.success) {
      console.error('Failed to install frontend dependencies');
      process.exit(1);
    }

    // Build the frontend
    console.log('Building the frontend...');
    const frontendBuild = runCommand('npm run build');
    if (!frontendBuild.success) {
      console.error('Frontend build failed');
      process.exit(1);
    }

    // Install backend dependencies
    console.log('Installing backend dependencies...');
    const backendInstall = runCommand('npm install --legacy-peer-deps --prefer-offline --no-audit', path.join(process.cwd(), 'backend'));
    if (!backendInstall.success) {
      console.error('Failed to install backend dependencies');
      process.exit(1);
    }

    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed with error:', error);
    process.exit(1);
  }
};

// Start the build process
build();
