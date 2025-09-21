#!/usr/bin/env node

/**
 * 💰 Cache Money Bebe - Professional Package Builder
 * 
 * Creates a complete, standalone ZIP package with all dependencies,
 * configurations, and resources for distribution.
 * 
 * Usage: node scripts/build-package.js [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Configuration
const CONFIG = {
  packageName: 'cache-money-bebe',
  version: require('../package.json').version,
  buildDir: path.join(__dirname, '..', 'dist'),
  packageDir: path.join(__dirname, '..', 'dist', 'package'),
  zipFile: path.join(__dirname, '..', 'dist', `cache-money-bebe-v${require('../package.json').version}-complete.zip`),
  rootDir: path.join(__dirname, '..')
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class PackageBuilder {
  constructor() {
    this.verboseEnabled = process.argv.includes('--verbose') || process.argv.includes('-v');
    this.includeDevDeps = process.argv.includes('--dev-deps');
    this.minify = !process.argv.includes('--no-minify');
  }

  log(message, color = 'cyan') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const colorCode = colors[color] || '';
    console.log(`${colorCode}[${timestamp}]${colors.reset} ${message}`);
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
    process.exit(1);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  verbose(message) {
    if (this.verboseEnabled) {
      this.log(`🔍 ${message}`, 'magenta');
    }
  }

  displayHeader() {
    console.log(`
${colors.magenta}============================================${colors.reset}
${colors.magenta}💰 Cache Money Bebe - Package Builder${colors.reset}
${colors.magenta}============================================${colors.reset}
${colors.cyan}Version: ${CONFIG.version}${colors.reset}
${colors.cyan}Building complete distribution package...${colors.reset}
`);
  }

  // Clean and create build directories
  prepareBuildDirectory() {
    this.log('Preparing build directory...');

    // Clean existing build
    if (fs.existsSync(CONFIG.buildDir)) {
      fs.rmSync(CONFIG.buildDir, { recursive: true, force: true });
    }

    // Create build directories
    fs.mkdirSync(CONFIG.buildDir, { recursive: true });
    fs.mkdirSync(CONFIG.packageDir, { recursive: true });

    this.success('Build directory prepared');
  }

  // Copy source files
  copySourceFiles() {
    this.log('Copying source files...');

    const filesToCopy = [
      // Core files
      'package.json',
      'package-lock.json',
      'README.md',
      'COMMANDS.md',
      'INSTALL.md',
      'DEPLOYMENT_STATUS.md',
      'rollup.config.js',
      'installer.js',
      'install.sh',

      // Directories
      'src',
      'examples',
      'benchmark',
      'postman',
      'scripts',
      'docs',
      'tests'
    ];

    filesToCopy.forEach(item => {
      const srcPath = path.join(CONFIG.rootDir, item);
      const destPath = path.join(CONFIG.packageDir, item);

      if (fs.existsSync(srcPath)) {
        const stats = fs.statSync(srcPath);
        if (stats.isDirectory()) {
          this.copyDirectory(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
        this.verbose(`Copied: ${item}`);
      } else {
        this.warning(`Not found: ${item}`);
      }
    });

    this.success('Source files copied');
  }

  // Recursive directory copy
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    
    entries.forEach(entry => {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, .git, and other build artifacts
        if (!['node_modules', '.git', '.nyc_output', 'coverage', 'dist'].includes(entry)) {
          this.copyDirectory(srcPath, destPath);
        }
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  // Install production dependencies
  installDependencies() {
    this.log('Installing dependencies...');

    const options = this.includeDevDeps ? '' : '--omit=dev';
    const command = `npm install ${options} --ignore-scripts`;

    try {
      execSync(command, {
        cwd: CONFIG.packageDir,
        stdio: this.verboseEnabled ? 'inherit' : 'pipe'
      });
      
      this.success('Dependencies installed');
    } catch (error) {
      this.error(`Dependency installation failed: ${error.message}`);
    }
  }

  // Build the project
  buildProject() {
    this.log('Building project...');

    try {
      // Create a simple build script since rollup might not be available
      const buildScript = `
const fs = require('fs');
const path = require('path');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy main source files to dist
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  const copyRecursive = (src, dest) => {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(item => {
        copyRecursive(path.join(src, item), path.join(dest, item));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  
  copyRecursive(srcDir, distDir);
  console.log('Build completed successfully');
} else {
  console.log('No src directory found, skipping build');
}
`;

      fs.writeFileSync(path.join(CONFIG.packageDir, 'build.js'), buildScript);
      execSync('node build.js', {
        cwd: CONFIG.packageDir,
        stdio: this.verboseEnabled ? 'inherit' : 'pipe'
      });

      // Clean up build script
      fs.unlinkSync(path.join(CONFIG.packageDir, 'build.js'));

      this.success('Project built');
    } catch (error) {
      this.warning(`Build failed, but packaging will continue: ${error.message}`);
    }
  }

  // Create version info file
  createVersionInfo() {
    this.log('Creating version info...');

    const versionInfo = {
      name: CONFIG.packageName,
      version: CONFIG.version,
      buildDate: new Date().toISOString(),
      buildEnvironment: {
        node: process.version,
        npm: this.getNpmVersion(),
        platform: process.platform,
        arch: process.arch
      },
      features: [
        'Multi-strategy caching',
        'Safety mechanisms (recursion guards, circuit breakers)',
        'Memory pressure monitoring',
        'Framework-agnostic event system',
        'Performance benchmarking tools',
        'Comprehensive API testing suite',
        'Production-ready deployment automation'
      ],
      installation: {
        'One-line install': 'curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash',
        'Node.js installer': 'node installer.js',
        'NPM package': 'npm install git+https://github.com/flashesofbrilliance/job-tracker-pro.git#feature/cache-money-bebe:cache-money-bebe'
      }
    };

    fs.writeFileSync(
      path.join(CONFIG.packageDir, 'VERSION.json'),
      JSON.stringify(versionInfo, null, 2)
    );

    this.success('Version info created');
  }

  // Get npm version
  getNpmVersion() {
    try {
      return execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  // Create installation instructions
  createInstallInstructions() {
    this.log('Creating installation instructions...');

    const instructions = `# 💰 Cache Money Bebe - Installation Instructions

## Package Contents

This ZIP package contains a complete, standalone installation of Cache Money Bebe v${CONFIG.version} with all dependencies and resources.

## Quick Installation

1. **Extract the package:**
   \`\`\`bash
   unzip cache-money-bebe-v${CONFIG.version}-complete.zip
   cd cache-money-bebe
   \`\`\`

2. **Set executable permissions:**
   \`\`\`bash
   chmod +x scripts/deploy.sh
   chmod +x install.sh
   \`\`\`

3. **Run the demo:**
   \`\`\`bash
   ./scripts/deploy.sh demo
   \`\`\`

## Installation Methods

### Method 1: Direct Usage (No Installation)
\`\`\`bash
# Run directly from the extracted directory
./scripts/deploy.sh demo
./scripts/deploy.sh benchmark
\`\`\`

### Method 2: Local Installation
\`\`\`bash
# Run the included installer
./install.sh
\`\`\`

### Method 3: Node.js Installer
\`\`\`bash
# Use the Node.js installer
node installer.js
\`\`\`

## What's Included

- ✅ **Complete source code** with all modules
- ✅ **All dependencies** (node_modules included)
- ✅ **Documentation** (README, guides, API docs)
- ✅ **Examples and demos** with different configurations
- ✅ **Performance benchmarking tools**
- ✅ **Postman API testing collections** (50+ test scenarios)
- ✅ **Deployment automation scripts**
- ✅ **Professional installers** (bash and Node.js)

## System Requirements

- **Node.js:** 14.0.0 or higher
- **npm:** 6.0.0 or higher
- **Operating System:** macOS, Linux, or Windows (WSL)

## Quick Start

1. **Basic usage:**
   \`\`\`bash
   ./scripts/deploy.sh demo
   \`\`\`

2. **Performance testing:**
   \`\`\`bash
   ./scripts/deploy.sh benchmark
   \`\`\`

3. **API testing with Postman:**
   - Import: \`postman/cache-money-bebe.postman_collection.json\`
   - Environment: \`postman/cache-money-bebe.postman_environment.json\`

4. **Read documentation:**
   - Main guide: \`README.md\`
   - Quick start: \`docs/QUICK_START.md\`
   - Commands: \`COMMANDS.md\`

## Support

- **GitHub:** https://github.com/flashesofbrilliance/job-tracker-pro/tree/feature/cache-money-bebe/cache-money-bebe
- **Documentation:** See \`docs/\` directory
- **Examples:** See \`examples/\` directory

---

**Package built on:** ${new Date().toISOString()}  
**Version:** ${CONFIG.version}  
**Happy Caching! 💰✨**
`;

    fs.writeFileSync(
      path.join(CONFIG.packageDir, 'INSTALL_INSTRUCTIONS.md'),
      instructions
    );

    this.success('Installation instructions created');
  }

  // Create ZIP package
  async createZipPackage() {
    this.log('Creating ZIP package...');

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(CONFIG.zipFile);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      let totalFiles = 0;

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        this.success(`ZIP package created: ${path.basename(CONFIG.zipFile)} (${sizeInMB} MB, ${totalFiles} files)`);
        resolve();
      });

      archive.on('error', (error) => {
        reject(error);
      });

      archive.on('entry', () => {
        totalFiles++;
        if (totalFiles % 100 === 0) {
          process.stdout.write(`\r📦 Archiving: ${totalFiles} files...`);
        }
      });

      archive.pipe(output);

      // Add all files from package directory
      archive.directory(CONFIG.packageDir, 'cache-money-bebe');

      archive.finalize();
    });
  }

  // Clean up build directory (optional)
  cleanup() {
    if (!process.argv.includes('--keep-build')) {
      this.log('Cleaning up build files...');
      
      // Keep the ZIP but remove the temporary package directory
      if (fs.existsSync(CONFIG.packageDir)) {
        fs.rmSync(CONFIG.packageDir, { recursive: true, force: true });
      }
      
      this.success('Cleanup completed');
    } else {
      this.info(`Build files kept at: ${CONFIG.packageDir}`);
    }
  }

  // Main build process
  async build() {
    try {
      this.displayHeader();

      this.prepareBuildDirectory();
      this.copySourceFiles();
      this.installDependencies();
      this.buildProject();
      this.createVersionInfo();
      this.createInstallInstructions();
      
      await this.createZipPackage();
      
      this.cleanup();

      // Display final results
      console.log(`
${colors.green}🎉 Package build completed successfully!${colors.reset}

${colors.cyan}📦 Package Information:${colors.reset}
  • Name: ${CONFIG.packageName}
  • Version: ${CONFIG.version}
  • File: ${path.basename(CONFIG.zipFile)}
  • Location: ${CONFIG.zipFile}

${colors.cyan}🚀 Distribution Ready:${colors.reset}
  • Complete standalone package with all dependencies
  • Professional installers (bash and Node.js)
  • Comprehensive documentation and examples
  • Performance benchmarking and testing tools
  • Postman API testing collections

${colors.cyan}📋 Usage:${colors.reset}
  1. Distribute the ZIP file to users
  2. Users extract and run: ./scripts/deploy.sh demo
  3. Or users run installer: ./install.sh

${colors.yellow}⭐ Professional open-source package ready for distribution!${colors.reset}
`);

    } catch (error) {
      this.error(`Build failed: ${error.message}`);
    }
  }

  // Display help
  displayHelp() {
    console.log(`
${colors.cyan}Cache Money Bebe - Package Builder${colors.reset}

${colors.yellow}Usage:${colors.reset}
  node scripts/build-package.js [options]

${colors.yellow}Options:${colors.reset}
  --verbose, -v      Verbose output
  --dev-deps         Include development dependencies
  --no-minify        Skip minification
  --keep-build       Keep build files after packaging
  --help, -h         Show this help

${colors.yellow}Examples:${colors.reset}
  node scripts/build-package.js
  node scripts/build-package.js --verbose --keep-build
  node scripts/build-package.js --dev-deps

${colors.green}This will create a complete, standalone ZIP package with:${colors.reset}
  • All source code and dependencies
  • Professional installers
  • Documentation and examples
  • Testing and benchmarking tools
`);
  }
}

// Check if archiver is available, install if needed
function checkArchiver() {
  try {
    require('archiver');
  } catch (error) {
    console.log('📦 Installing archiver dependency...');
    execSync('npm install archiver --no-save', { stdio: 'inherit' });
  }
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    new PackageBuilder().displayHelp();
    process.exit(0);
  }

  checkArchiver();
  const builder = new PackageBuilder();
  builder.build().catch(console.error);
}

module.exports = PackageBuilder;