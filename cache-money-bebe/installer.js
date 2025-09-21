#!/usr/bin/env node

/**
 * 💰 Cache Money Bebe - Node.js Installer
 * 
 * Professional Node.js installer script that downloads and sets up
 * the complete cache-money-bebe package with dependencies.
 * 
 * Usage:
 *   npx cache-money-bebe-installer
 *   node installer.js
 *   curl -fsSL https://raw.githubusercontent.com/.../installer.js | node
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn, execSync } = require('child_process');
const os = require('os');
const zlib = require('zlib');

// Configuration
const CONFIG = {
  packageName: 'cache-money-bebe',
  version: '1.0.0',
  githubRepo: 'flashesofbrilliance/job-tracker-pro',
  branch: 'feature/cache-money-bebe',
  defaultInstallDir: path.join(os.homedir(), 'cache-money-bebe'),
  tempDir: path.join(os.tmpdir(), 'cache-money-bebe-install'),
  packageUrl: 'https://github.com/flashesofbrilliance/job-tracker-pro/archive/refs/heads/feature/cache-money-bebe.tar.gz'
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class CacheMoneyBebeInstaller {
  constructor() {
    this.installDir = CONFIG.defaultInstallDir;
    this.tempDir = CONFIG.tempDir;
    this.interactive = process.stdout.isTTY;
    this.verbose = process.argv.includes('--verbose') || process.argv.includes('-v');
    this.skipDeps = process.argv.includes('--skip-deps');
  }

  // Utility methods
  log(message, color = 'cyan') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const colorCode = colors[color] || '';
    const resetCode = colors.reset;
    console.log(`${colorCode}[${timestamp}]${resetCode} ${message}`);
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  verbose(message) {
    if (this.verbose) {
      this.log(`🔍 ${message}`, 'magenta');
    }
  }

  // Header display
  displayHeader() {
    console.log(`
${colors.magenta}============================================${colors.reset}
${colors.magenta}💰 Cache Money Bebe - Node.js Installer${colors.reset}
${colors.magenta}============================================${colors.reset}
${colors.cyan}Version: ${CONFIG.version}${colors.reset}
${colors.cyan}High-performance caching library with safety mechanisms${colors.reset}
`);
  }

  // System requirements check
  async checkSystemRequirements() {
    this.log('Checking system requirements...');

    // Check Node.js version
    const nodeVersion = process.version;
    const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (nodeMajor < 14) {
      this.error(`Node.js 14+ required. Current version: ${nodeVersion}`);
      process.exit(1);
    }
    
    this.verbose(`Node.js version: ${nodeVersion} ✓`);

    // Check npm availability
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.verbose(`npm version: ${npmVersion} ✓`);
    } catch (error) {
      this.error('npm is required but not found in PATH');
      process.exit(1);
    }

    // Check disk space (basic check)
    try {
      const stats = fs.statSync(os.homedir());
      this.verbose('Disk space check passed ✓');
    } catch (error) {
      this.warning('Could not verify disk space');
    }

    this.success('System requirements check passed');
  }

  // Download and extract package
  async downloadPackage() {
    this.log('Downloading cache-money-bebe package...');

    return new Promise((resolve, reject) => {
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      const tarFile = path.join(this.tempDir, 'cache-money-bebe.tar.gz');
      const file = fs.createWriteStream(tarFile);

      https.get(CONFIG.packageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0');
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0 && this.interactive) {
            const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r📥 Downloaded: ${percent}%`);
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          if (this.interactive) {
            process.stdout.write('\n');
          }
          this.success('Package downloaded successfully');
          resolve(tarFile);
        });

      }).on('error', (error) => {
        fs.unlink(tarFile, () => {}); // Delete partial file
        reject(error);
      });
    });
  }

  // Extract tar.gz file
  async extractPackage(tarFile) {
    this.log('Extracting package...');

    return new Promise((resolve, reject) => {
      const extractDir = path.join(this.tempDir, 'extracted');
      
      // Create extraction directory
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }

      // Use tar command if available, otherwise use Node.js approach
      try {
        execSync(`tar -xzf "${tarFile}" -C "${extractDir}"`, { stdio: 'pipe' });
        
        // Find the cache-money-bebe directory
        const extractedContents = fs.readdirSync(extractDir);
        const projectDir = extractedContents.find(dir => 
          fs.existsSync(path.join(extractDir, dir, 'cache-money-bebe'))
        );

        if (!projectDir) {
          reject(new Error('Cache-money-bebe directory not found in package'));
          return;
        }

        const sourcePath = path.join(extractDir, projectDir, 'cache-money-bebe');
        this.success('Package extracted successfully');
        resolve(sourcePath);

      } catch (error) {
        reject(new Error(`Extraction failed: ${error.message}`));
      }
    });
  }

  // Install package to target directory
  async installPackage(sourcePath) {
    this.log(`Installing to: ${this.installDir}`);

    try {
      // Remove existing installation
      if (fs.existsSync(this.installDir)) {
        this.warning('Existing installation found. Removing...');
        fs.rmSync(this.installDir, { recursive: true, force: true });
      }

      // Create parent directory
      const parentDir = path.dirname(this.installDir);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      // Copy files
      this.copyRecursively(sourcePath, this.installDir);
      this.success('Files copied successfully');

      // Set permissions
      const scriptsDir = path.join(this.installDir, 'scripts');
      if (fs.existsSync(scriptsDir)) {
        const scripts = fs.readdirSync(scriptsDir);
        scripts.forEach(script => {
          const scriptPath = path.join(scriptsDir, script);
          if (script.endsWith('.sh')) {
            fs.chmodSync(scriptPath, 0o755);
          }
        });
      }

      const installScript = path.join(this.installDir, 'install.sh');
      if (fs.existsSync(installScript)) {
        fs.chmodSync(installScript, 0o755);
      }

    } catch (error) {
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  // Recursive file copy
  copyRecursively(src, dest) {
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const files = fs.readdirSync(src);
      files.forEach(file => {
        this.copyRecursively(
          path.join(src, file),
          path.join(dest, file)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  // Install npm dependencies
  async installDependencies() {
    if (this.skipDeps) {
      this.info('Skipping dependency installation (--skip-deps)');
      return;
    }

    this.log('Installing npm dependencies...');

    return new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        cwd: this.installDir,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      npmInstall.on('close', (code) => {
        if (code === 0) {
          this.success('Dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });

      npmInstall.on('error', (error) => {
        reject(new Error(`npm install failed: ${error.message}`));
      });
    });
  }

  // Build the project
  async buildProject() {
    this.log('Building project...');

    return new Promise((resolve, reject) => {
      const npmBuild = spawn('npm', ['run', 'build'], {
        cwd: this.installDir,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      npmBuild.on('close', (code) => {
        if (code === 0) {
          this.success('Project built successfully');
          resolve();
        } else {
          this.warning('Build failed, but installation can continue');
          resolve(); // Don't fail installation for build issues
        }
      });

      npmBuild.on('error', (error) => {
        this.warning(`Build error: ${error.message}`);
        resolve(); // Don't fail installation for build issues
      });
    });
  }

  // Run initial tests
  async runTests() {
    this.log('Running initial tests...');

    return new Promise((resolve) => {
      const npmTest = spawn('npm', ['test', '--', '--passWithNoTests'], {
        cwd: this.installDir,
        stdio: this.verbose ? 'inherit' : 'pipe'
      });

      npmTest.on('close', (code) => {
        if (code === 0) {
          this.success('Tests passed');
        } else {
          this.warning('Some tests failed, but installation is complete');
        }
        resolve();
      });

      npmTest.on('error', (error) => {
        this.warning(`Test error: ${error.message}`);
        resolve();
      });
    });
  }

  // Clean up temporary files
  async cleanup() {
    this.log('Cleaning up temporary files...');

    try {
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      }
      this.success('Cleanup completed');
    } catch (error) {
      this.warning(`Cleanup warning: ${error.message}`);
    }
  }

  // Create desktop shortcuts and aliases
  async createShortcuts() {
    this.log('Setting up shortcuts...');

    try {
      // Create alias in shell profile
      const shellProfile = process.env.SHELL?.includes('zsh') ? 
        path.join(os.homedir(), '.zshrc') : 
        path.join(os.homedir(), '.bash_profile');

      if (fs.existsSync(shellProfile)) {
        const aliasCommand = `alias cache-money-bebe='cd "${this.installDir}" && ./scripts/deploy.sh'`;
        const profileContent = fs.readFileSync(shellProfile, 'utf8');
        
        if (!profileContent.includes('cache-money-bebe')) {
          fs.appendFileSync(shellProfile, `\n# Cache Money Bebe\n${aliasCommand}\n`);
          this.success(`Added alias to ${path.basename(shellProfile)}`);
        }
      }

      // Create symlink in /usr/local/bin if possible
      try {
        const binPath = '/usr/local/bin/cache-money-bebe';
        const scriptPath = path.join(this.installDir, 'scripts', 'deploy.sh');
        
        if (!fs.existsSync(binPath) && fs.existsSync(scriptPath)) {
          fs.symlinkSync(scriptPath, binPath);
          this.success('Created global command: cache-money-bebe');
        }
      } catch (error) {
        this.verbose(`Could not create global command: ${error.message}`);
      }

    } catch (error) {
      this.warning(`Shortcut creation warning: ${error.message}`);
    }
  }

  // Display post-installation instructions
  displayPostInstall() {
    console.log(`
${colors.green}🎉 Installation completed successfully!${colors.reset}

${colors.cyan}📁 Installation Directory:${colors.reset} ${this.installDir}

${colors.cyan}🚀 Quick Start:${colors.reset}
  cd "${this.installDir}"
  ./scripts/deploy.sh demo

${colors.cyan}📚 Documentation:${colors.reset}
  • README.md - Main documentation
  • docs/QUICK_START.md - Quick start guide
  • docs/OPEN_SOURCE_GUIDE.md - Comprehensive guide
  • COMMANDS.md - Command reference

${colors.cyan}🧪 Examples & Testing:${colors.reset}
  • Run demo: ./scripts/deploy.sh demo
  • Run benchmarks: ./scripts/deploy.sh benchmark
  • Import Postman collections from: postman/

${colors.cyan}🔧 Development:${colors.reset}
  • Start dev mode: ./scripts/deploy.sh dev
  • Run tests: npm test
  • Build project: npm run build

${colors.cyan}💡 Pro Tips:${colors.reset}
  • Use 'cache-money-bebe' command from anywhere (if alias was created)
  • Check installation: ./scripts/deploy.sh status
  • Get help: ./scripts/deploy.sh help

${colors.yellow}⭐ Star the project on GitHub if you find it useful!${colors.reset}
${colors.blue}🔗 https://github.com/${CONFIG.githubRepo}${colors.reset}

Happy Caching! 💰✨
`);
  }

  // Main installation flow
  async install() {
    try {
      this.displayHeader();
      
      // Parse command line arguments
      if (process.argv.includes('--help') || process.argv.includes('-h')) {
        this.displayHelp();
        return;
      }

      // Custom install directory
      const dirIndex = process.argv.findIndex(arg => arg === '--dir');
      if (dirIndex > -1 && process.argv[dirIndex + 1]) {
        this.installDir = path.resolve(process.argv[dirIndex + 1]);
      }

      await this.checkSystemRequirements();
      
      const tarFile = await this.downloadPackage();
      const sourcePath = await this.extractPackage(tarFile);
      
      await this.installPackage(sourcePath);
      await this.installDependencies();
      await this.buildProject();
      await this.runTests();
      await this.createShortcuts();
      
      await this.cleanup();
      
      this.displayPostInstall();

    } catch (error) {
      this.error(`Installation failed: ${error.message}`);
      
      if (this.verbose) {
        console.error(error.stack);
      }
      
      // Cleanup on failure
      await this.cleanup();
      
      process.exit(1);
    }
  }

  // Help display
  displayHelp() {
    console.log(`
${colors.cyan}Cache Money Bebe - Node.js Installer${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node installer.js [options]
  npx cache-money-bebe-installer [options]

${colors.yellow}Options:${colors.reset}
  --dir <path>     Custom installation directory
  --skip-deps      Skip npm dependency installation
  --verbose, -v    Verbose output
  --help, -h       Show this help

${colors.yellow}Examples:${colors.reset}
  node installer.js
  node installer.js --dir ~/my-cache-app
  node installer.js --verbose --skip-deps

${colors.yellow}Remote Installation:${colors.reset}
  curl -fsSL https://raw.githubusercontent.com/${CONFIG.githubRepo}/${CONFIG.branch}/cache-money-bebe/installer.js | node
  
${colors.green}For more information, visit:${colors.reset}
${colors.blue}https://github.com/${CONFIG.githubRepo}/tree/${CONFIG.branch}/cache-money-bebe${colors.reset}
`);
  }
}

// Main execution
if (require.main === module) {
  const installer = new CacheMoneyBebeInstaller();
  installer.install().catch(console.error);
}

module.exports = CacheMoneyBebeInstaller;