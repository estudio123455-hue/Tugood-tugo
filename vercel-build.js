const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check Node.js version
const nodeVersion = process.versions.node;
console.log(`Running Node.js ${nodeVersion}`);

// Verify Node.js version is 22.x
if (!nodeVersion.startsWith('22.')) {
  console.error('Error: This project requires Node.js 22.x');
  process.exit(1);
}

// Helper function to run commands with better error handling
const runCommand = (command, args = [], cwd = process.cwd()) => {
  console.log(`Running: ${command} ${args.join(' ')} in ${cwd}`);
  
  // Ensure the directory exists
  if (!fs.existsSync(cwd)) {
    console.error(`Directory does not exist: ${cwd}`);
    return { success: false, error: 'Directory does not exist' };
  }

  // Use spawnSync instead of execSync for better handling of output
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { 
      ...process.env, 
      NODE_ENV: 'production',
      // Ensure PATH includes node_modules/.bin
      PATH: `${process.env.PATH}:${path.join(cwd, 'node_modules', '.bin')}`
    }
  });

  if (result.status !== 0) {
    console.error(`Command failed with status ${result.status}: ${command} ${args.join(' ')}`);
    if (result.error) {
      console.error('Error:', result.error);
    }
    return { success: false, error: result.error || 'Command failed' };
  }
  
  return { success: true, result };
};

// Fix permissions for a directory
const fixPermissions = (dir) => {
  console.log(`Fixing permissions in ${dir}`);
  if (!fs.existsSync(dir)) {
    console.warn(`Directory does not exist: ${dir}`);
    return;
  }
  
  // Make node_modules/.bin files executable
  const binPath = path.join(dir, 'node_modules', '.bin');
  if (fs.existsSync(binPath)) {
    try {
      fs.readdirSync(binPath).forEach(file => {
        const filePath = path.join(binPath, file);
        try {
          fs.chmodSync(filePath, '755');
        } catch (err) {
          console.warn(`Warning: Could not set permissions for ${filePath}:`, err.message);
        }
      });
    } catch (err) {
      console.warn('Error fixing permissions:', err.message);
    }
  }
};

// Main build function
const build = async () => {
  try {
    const rootDir = process.cwd();
    const backendDir = path.join(rootDir, 'backend');
    
    // Install frontend dependencies
    console.log('Installing frontend dependencies...');
    const frontendInstall = runCommand('npm', ['install', '--legacy-peer-deps', '--prefer-offline', '--no-audit'], rootDir);
    if (!frontendInstall.success) {
      throw new Error('Failed to install frontend dependencies');
    }
    
    // Fix permissions for frontend node_modules
    fixPermissions(rootDir);

    // Build the frontend
    console.log('Building the frontend...');
    const frontendBuild = runCommand('npm', ['run', 'build'], rootDir);
    if (!frontendBuild.success) {
      throw new Error('Frontend build failed');
    }

    // Install backend dependencies
    console.log('Installing backend dependencies...');
    const backendInstall = runCommand('npm', ['install', '--legacy-peer-deps', '--prefer-offline', '--no-audit'], backendDir);
    if (!backendInstall.success) {
      throw new Error('Failed to install backend dependencies');
    }
    
    // Fix permissions for backend node_modules
    fixPermissions(backendDir);

    console.log('Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Build failed with error:', error.message);
    process.exit(1);
  }
};

// Start the build process
build();
