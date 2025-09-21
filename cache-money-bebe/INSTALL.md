# 📦 Installation Guide - Cache Money Bebe

## 🚀 One-Line Installation

### Quick Install (Recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash
```

### Alternative Installation Methods

#### Via wget
```bash
wget -qO- https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash
```

#### Manual Download and Execute
```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh -o install-cache-money-bebe.sh

# Make executable
chmod +x install-cache-money-bebe.sh

# Run installer
./install-cache-money-bebe.sh
```

## 🎯 Installation Options

The installer will prompt you to choose:

### 1. NPM Package (Recommended for Projects)
- Installs as a dependency in your Node.js project
- Creates example usage file
- Best for integrating into existing applications

### 2. Development Clone (Recommended for Development)
- Full development environment setup
- Includes all source code, examples, and tools
- Best for contributing or advanced usage

### 3. Standalone Download
- Downloads without git history
- Lighter installation
- Best for simple usage scenarios

## 📋 System Requirements

- **Node.js:** 14.0.0 or higher
- **npm:** 6.0.0 or higher  
- **Git:** Any recent version
- **Operating System:** macOS, Linux, or Windows (WSL)

## ⚡ Quick Verification

After installation, verify it works:

### For NPM Installation
```bash
cd your-project-directory
node example.js
```

### For Development/Standalone Installation
```bash
cd ~/cache-money-bebe
./scripts/deploy.sh demo
```

## 🔧 Advanced Installation

### Install Specific Version
```bash
# Install from specific branch or tag
curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/v1.0.0/cache-money-bebe/install.sh | bash
```

### Custom Installation Directory
```bash
# Set custom installation directory
export INSTALL_DIR="$HOME/my-custom-path/cache-money-bebe"
curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash
```

### Silent Installation (No Prompts)
```bash
# Development clone (option 2)
echo "2" | curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash

# NPM package (option 1)  
echo "1" | curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash
```

## 🛠️ Manual Installation

If you prefer manual installation:

### NPM Method
```bash
# In your project directory
npm install git+https://github.com/flashesofbrilliance/job-tracker-pro.git#feature/cache-money-bebe:cache-money-bebe
```

### Git Clone Method
```bash
# Clone the repository
git clone --single-branch --branch feature/cache-money-bebe https://github.com/flashesofbrilliance/job-tracker-pro.git temp-clone

# Move cache-money-bebe directory
mv temp-clone/cache-money-bebe ~/cache-money-bebe
rm -rf temp-clone

# Setup
cd ~/cache-money-bebe
npm install
npm run build
npm test
```

## 🚨 Troubleshooting

### Common Issues

#### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Network Issues
```bash
# Use alternative download method
wget -qO- https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash

# Or download and inspect first
curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh -o installer.sh
cat installer.sh  # Review the script
bash installer.sh
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Install Node.js 14+ from https://nodejs.org/
# Or use Node Version Manager
nvm install 16
nvm use 16
```

### Getting Help

If installation fails:

1. **Check requirements:** Ensure Node.js 14+, npm 6+, and git are installed
2. **Review logs:** The installer provides detailed error messages
3. **Manual installation:** Try the manual methods above
4. **Report issues:** Create an issue at https://github.com/flashesofbrilliance/job-tracker-pro/issues

## 🎉 Next Steps

After successful installation:

1. **Run demo:** `./scripts/deploy.sh demo` (dev install) or `node example.js` (npm install)
2. **Read documentation:** Check `README.md` or `docs/QUICK_START.md`
3. **Import Postman collections:** Use collections in `postman/` directory
4. **Run benchmarks:** `./scripts/deploy.sh benchmark` to test performance
5. **Start building:** Integrate cache-money-bebe into your applications!

---

**Happy Caching! 💰✨**