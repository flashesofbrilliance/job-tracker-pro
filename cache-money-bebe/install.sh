#!/bin/bash

# 💰 Cache Money Bebe - One-Line Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/flashesofbrilliance/job-tracker-pro/feature/cache-money-bebe/cache-money-bebe/install.sh | bash
# Or: curl -fsSL https://your-domain.com/install-cache-money-bebe | bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
GITHUB_REPO="flashesofbrilliance/job-tracker-pro"
BRANCH="feature/cache-money-bebe"
PACKAGE_NAME="cache-money-bebe"
INSTALL_DIR="$HOME/cache-money-bebe"
TEMP_DIR="/tmp/cache-money-bebe-install"

# Helper functions
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}💰 Cache Money Bebe - Installer${NC}"
    echo -e "${PURPLE}============================================${NC}"
}

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    # Check if running on macOS, Linux, or WSL
    case "$(uname -s)" in
        Darwin*)    OS="macOS" ;;
        Linux*)     OS="Linux" ;;
        CYGWIN*|MINGW*|MSYS*) OS="Windows" ;;
        *)          print_error "Unsupported operating system: $(uname -s)" ;;
    esac
    
    print_info "Detected OS: $OS"
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is required but not installed. Please install Node.js 14+ from https://nodejs.org/"
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        print_error "Node.js 14+ is required. Current version: $(node --version)"
    fi
    
    print_info "Node.js version: $(node --version)"
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm is required but not installed."
    fi
    
    print_info "npm version: $(npm --version)"
    
    # Check git
    if ! command -v git >/dev/null 2>&1; then
        print_error "Git is required but not installed."
    fi
    
    # Check curl
    if ! command -v curl >/dev/null 2>&1; then
        print_error "curl is required but not installed."
    fi
    
    print_success "System requirements check passed!"
}

# Install method selection
select_install_method() {
    echo -e "${CYAN}Select installation method:${NC}"
    echo "1. 📦 NPM Package (recommended for projects)"
    echo "2. 🔧 Development Clone (recommended for development)"
    echo "3. 📁 Standalone Download (no git history)"
    echo ""
    
    while true; do
        read -p "Choose method (1-3) [1]: " method
        case $method in
            1|"") INSTALL_METHOD="npm"; break ;;
            2) INSTALL_METHOD="clone"; break ;;
            3) INSTALL_METHOD="download"; break ;;
            *) echo "Please select 1, 2, or 3" ;;
        esac
    done
    
    print_info "Selected method: $INSTALL_METHOD"
}

# NPM installation
install_npm() {
    print_step "Installing via NPM..."
    
    # Create project directory
    read -p "Enter project directory [$PWD/my-cache-project]: " project_dir
    project_dir=${project_dir:-"$PWD/my-cache-project"}
    
    if [ ! -d "$project_dir" ]; then
        mkdir -p "$project_dir"
    fi
    
    cd "$project_dir"
    
    # Initialize package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        print_step "Initializing new Node.js project..."
        npm init -y
    fi
    
    # Install cache-money-bebe
    print_step "Installing cache-money-bebe package..."
    
    # For now, we'll install from the git repository
    # Later this can be changed to: npm install cache-money-bebe
    npm install "git+https://github.com/$GITHUB_REPO.git#$BRANCH:cache-money-bebe"
    
    # Create example usage file
    cat > example.js << 'EOF'
const { CacheManager, Config } = require('cache-money-bebe');

async function example() {
    // Initialize cache with balanced configuration
    const config = new Config({ preset: 'balanced' });
    const cache = new CacheManager(config);
    await cache.initialize();
    
    // Basic usage
    await cache.set('user:123', { name: 'John Doe', email: 'john@example.com' });
    const user = await cache.get('user:123');
    console.log('Retrieved user:', user);
    
    // Get cache stats
    const stats = await cache.getStats();
    console.log('Cache stats:', stats);
    
    await cache.shutdown();
}

example().catch(console.error);
EOF
    
    print_success "NPM installation completed!"
    print_info "Project created in: $project_dir"
    print_info "Run example: node example.js"
    
    cd "$project_dir"
    return 0
}

# Development clone installation
install_clone() {
    print_step "Cloning development repository..."
    
    # Remove existing directory if it exists
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists. Removing..."
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone the repository
    git clone --single-branch --branch "$BRANCH" "https://github.com/$GITHUB_REPO.git" "$TEMP_DIR"
    
    # Move only the cache-money-bebe directory
    mv "$TEMP_DIR/cache-money-bebe" "$INSTALL_DIR"
    rm -rf "$TEMP_DIR"
    
    cd "$INSTALL_DIR"
    
    # Install dependencies
    print_step "Installing dependencies..."
    npm install
    
    # Build the project
    print_step "Building the project..."
    npm run build
    
    # Run initial tests
    print_step "Running initial tests..."
    npm test
    
    print_success "Development clone installation completed!"
    print_info "Installation directory: $INSTALL_DIR"
    print_info "Run demo: ./scripts/deploy.sh demo"
    
    return 0
}

# Standalone download installation
install_download() {
    print_step "Downloading standalone package..."
    
    # Remove existing directory if it exists
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory $INSTALL_DIR already exists. Removing..."
        rm -rf "$INSTALL_DIR"
    fi
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Download archive
    curl -L "https://github.com/$GITHUB_REPO/archive/$BRANCH.tar.gz" | tar -xz
    
    # Move cache-money-bebe directory
    mv "job-tracker-pro-$BRANCH/cache-money-bebe" "$INSTALL_DIR"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    cd "$INSTALL_DIR"
    
    # Install dependencies
    print_step "Installing dependencies..."
    npm install
    
    # Build the project
    print_step "Building the project..."
    npm run build
    
    print_success "Standalone download installation completed!"
    print_info "Installation directory: $INSTALL_DIR"
    
    return 0
}

# Post-installation setup
post_install() {
    print_step "Running post-installation setup..."
    
    case $INSTALL_METHOD in
        "npm")
            print_info "Next steps:"
            echo "  • Run example: node example.js"
            echo "  • View documentation: node_modules/cache-money-bebe/README.md"
            echo "  • Import Postman collections from: node_modules/cache-money-bebe/postman/"
            ;;
        "clone"|"download")
            # Make scripts executable
            if [ -f "scripts/deploy.sh" ]; then
                chmod +x scripts/deploy.sh
            fi
            
            print_info "Next steps:"
            echo "  • Run demo: ./scripts/deploy.sh demo"
            echo "  • Run benchmarks: ./scripts/deploy.sh benchmark"
            echo "  • View documentation: docs/QUICK_START.md"
            echo "  • Start development: ./scripts/deploy.sh dev"
            ;;
    esac
    
    # Add to PATH suggestion
    if [ "$INSTALL_METHOD" = "clone" ] || [ "$INSTALL_METHOD" = "download" ]; then
        echo ""
        print_info "Optional: Add to PATH for global access"
        echo "  echo 'export PATH=\"$INSTALL_DIR/scripts:\$PATH\"' >> ~/.bashrc"
        echo "  source ~/.bashrc"
        echo "  # Then you can run: deploy.sh demo from anywhere"
    fi
}

# Create desktop shortcut (macOS/Linux)
create_shortcuts() {
    if [ "$INSTALL_METHOD" != "npm" ]; then
        read -p "Create desktop shortcuts? (y/N): " create_shortcuts
        if [ "$create_shortcuts" = "y" ] || [ "$create_shortcuts" = "Y" ]; then
            case $OS in
                "macOS")
                    # Create alias in .bash_profile or .zshrc
                    shell_config="$HOME/.bash_profile"
                    if [ -f "$HOME/.zshrc" ]; then
                        shell_config="$HOME/.zshrc"
                    fi
                    
                    echo "alias cache-money-bebe='cd $INSTALL_DIR && ./scripts/deploy.sh'" >> "$shell_config"
                    print_success "Added alias 'cache-money-bebe' to $shell_config"
                    ;;
                "Linux")
                    echo "alias cache-money-bebe='cd $INSTALL_DIR && ./scripts/deploy.sh'" >> "$HOME/.bashrc"
                    print_success "Added alias 'cache-money-bebe' to ~/.bashrc"
                    ;;
            esac
        fi
    fi
}

# Verification
verify_installation() {
    print_step "Verifying installation..."
    
    case $INSTALL_METHOD in
        "npm")
            if node -e "require('cache-money-bebe')" 2>/dev/null; then
                print_success "NPM package verification passed!"
            else
                print_error "NPM package verification failed!"
            fi
            ;;
        "clone"|"download")
            if [ -f "$INSTALL_DIR/package.json" ] && [ -d "$INSTALL_DIR/src" ]; then
                print_success "Installation verification passed!"
            else
                print_error "Installation verification failed!"
            fi
            ;;
    esac
}

# Main installation flow
main() {
    print_header
    
    print_info "This installer will help you set up Cache Money Bebe"
    print_info "A high-performance caching library with advanced safety mechanisms"
    echo ""
    
    check_requirements
    echo ""
    
    select_install_method
    echo ""
    
    case $INSTALL_METHOD in
        "npm")
            install_npm
            ;;
        "clone")
            install_clone
            ;;
        "download")
            install_download
            ;;
    esac
    
    echo ""
    post_install
    echo ""
    
    create_shortcuts
    echo ""
    
    verify_installation
    echo ""
    
    print_success "🎉 Cache Money Bebe installation completed successfully!"
    echo ""
    
    print_info "Documentation and support:"
    echo "  • GitHub: https://github.com/$GITHUB_REPO/tree/$BRANCH/cache-money-bebe"
    echo "  • Quick Start: See README.md or docs/QUICK_START.md"
    echo "  • Examples: Run demos and examples to get started"
    echo "  • Issues: Report bugs on GitHub Issues"
    echo ""
    
    print_info "Happy caching! 💰✨"
}

# Run main function if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi