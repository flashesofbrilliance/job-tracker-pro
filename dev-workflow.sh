#!/bin/bash

# Job Tracker Pro - Automated Development Workflow
# This script ensures proper version control, standards compliance, and deployment

set -e  # Exit on any error

# Load environment config
if [ -f .env.development ]; then
    source .env.development
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
    exit 1
}

# Get current version from package.json
get_version() {
    node -p "require('./package.json').version"
}

# Get git hash for cache busting
get_git_hash() {
    git rev-parse --short HEAD 2>/dev/null || echo "dev"
}

# Auto-increment version
increment_version() {
    local version=$1
    local type=${2:-patch}  # patch, minor, major
    
    IFS='.' read -r major minor patch <<< "$version"
    
    case $type in
        major) ((major++)); minor=0; patch=0 ;;
        minor) ((minor++)); patch=0 ;;
        patch) ((patch++)) ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Update version in package.json
update_version() {
    local new_version=$1
    node -e "
        const pkg = require('./package.json');
        pkg.version = '$new_version';
        require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
    "
}

# Auto-generate cache busting tags
generate_cache_tags() {
    local strategy=${VERSION_STRATEGY:-git-hash}
    local timestamp=$(date +%s)
    local git_hash=$(get_git_hash)
    local version=$(get_version)
    
    case $strategy in
        semantic) echo "v=$version" ;;
        timestamp) echo "t=$timestamp" ;;
        git-hash) echo "h=$git_hash" ;;
        *) echo "v=$version&h=$git_hash" ;;
    esac
}

# Update asset references with proper cache busting
update_asset_refs() {
    local cache_tag=$(generate_cache_tags)
    
    log "Updating asset references with cache tag: $cache_tag"
    
    # Update CSS references
    sed -i '' "s|style\.css?[^\"']*|style.css?$cache_tag|g" *.html
    
    # Update JS references  
    sed -i '' "s|\.js?[^\"']*\"|.js?$cache_tag\"|g" *.html
    
    success "Asset references updated"
}

# Validate code quality with comprehensive testing
validate_quality() {
    log "Validating code quality..."
    
    # Run pre-build test suite
    if [ -f "test-suite.js" ]; then
        log "Running comprehensive pre-build tests..."
        if node test-suite.js; then
            success "Pre-build test suite passed"
        else
            error "Pre-build tests failed - fix errors before continuing"
        fi
    else
        warning "test-suite.js not found, running basic validation"
        
        # Check file sizes
        find . -name "*.js" -size +500k | while read file; do
            warning "Large file detected: $file"
        done
        
        # Basic syntax validation
        find . -name "*.js" -exec node -c {} \; 2>/dev/null || {
            error "JavaScript syntax errors found"
        }
        
        success "Basic quality validation passed"
    fi
}

# Development server with proper version control
start_dev_server() {
    local port=${PORT:-8080}
    local host=${HOST:-127.0.0.1}
    
    log "Starting development server on $host:$port"
    
    # Update versions before starting
    update_asset_refs
    
    # Kill existing servers
    pkill -f "python3 -m http.server" 2>/dev/null || true
    sleep 1
    
    # Start server
    python3 -m http.server $port --bind $host > server.log 2>&1 &
    local server_pid=$!
    
    sleep 2
    
    # Verify server is running
    if curl -s -o /dev/null -w "%{http_code}" "http://$host:$port/" | grep -q "200"; then
        success "Server started successfully (PID: $server_pid)"
        echo "🌐 Open: http://$host:$port/discovery.html"
    else
        error "Server failed to start"
    fi
}

# Git workflow helpers
commit_changes() {
    local message=${1:-"feat: automated development update"}
    
    log "Committing changes..."
    
    git add .
    git commit -m "$message" || {
        warning "No changes to commit"
        return 0
    }
    
    success "Changes committed"
}

# Main workflow commands
case "${1:-help}" in
    "dev"|"start")
        log "🏮 Starting Japanese Sushi Discovery Engine development"
        validate_quality
        start_dev_server
        ;;
        
    "build")
        log "🔨 Building for deployment"
        validate_quality
        update_asset_refs
        npm run build:discovery
        success "Build completed"
        ;;
        
    "version")
        type=${2:-patch}
        current=$(get_version)
        new_version=$(increment_version $current $type)
        
        log "Updating version: $current → $new_version"
        update_version $new_version
        update_asset_refs
        commit_changes "chore: bump version to $new_version"
        success "Version updated to $new_version"
        ;;
        
    "deploy")
        log "🚀 Deploying to production"
        validate_quality
        update_asset_refs
        npm run build:discovery
        commit_changes "feat: deploy Japanese patterns and 3D sushi scene"
        success "Deployment ready"
        ;;
        
    "fix")
        log "🔧 Applying quick fixes"
        validate_quality
        update_asset_refs
        start_dev_server
        ;;
        
    "clean")
        log "🧹 Cleaning up"
        pkill -f "python3 -m http.server" 2>/dev/null || true
        rm -f server.log nohup.out
        rm -rf dist-discovery/
        success "Cleanup completed"
        ;;
        
    "help"|*)
        echo "🏮 Job Tracker Pro - Development Workflow"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dev, start    - Start development server with auto-versioning"
        echo "  build         - Build for deployment"
        echo "  version [type] - Increment version (patch|minor|major)"
        echo "  deploy        - Deploy to production"  
        echo "  fix          - Apply fixes and restart server"
        echo "  clean        - Clean up processes and temp files"
        echo "  help         - Show this help message"
        echo ""
        echo "Environment: $NODE_ENV"
        echo "Version: $(get_version)"
        echo "Git: $(get_git_hash)"
        ;;
esac