#!/bin/bash

# 💰 Cache Money Bebe - Deployment & Management Script
# Usage: ./scripts/deploy.sh [command] [options]

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="cache-money-bebe"
PROJECT_DIR="/Users/zharris/job-tracker-pro/cache-money-bebe"
BRANCH_NAME="feature/cache-money-bebe"

# Helper functions
print_header() {
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}🚀 $PROJECT_NAME - $1${NC}"
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
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Change to project directory
cd "$PROJECT_DIR"

# Command functions
setup() {
    print_header "Setup & Installation"
    
    print_step "Installing dependencies..."
    npm install
    
    print_step "Building the project..."
    npm run build
    
    print_step "Running initial tests..."
    npm test
    
    print_success "Setup completed successfully!"
    
    print_info "Next steps:"
    echo "  • Run examples: ./scripts/deploy.sh demo"
    echo "  • Run benchmarks: ./scripts/deploy.sh benchmark"
    echo "  • Start development: ./scripts/deploy.sh dev"
}

build() {
    print_header "Build Project"
    
    print_step "Cleaning previous builds..."
    npm run clean
    
    print_step "Building all formats..."
    npm run build
    
    print_step "Type checking..."
    npm run type-check
    
    print_success "Build completed successfully!"
}

test() {
    print_header "Test Suite"
    
    print_step "Running linter..."
    npm run lint
    
    print_step "Running unit tests..."
    npm test
    
    print_step "Running integration tests..."
    npm run test:integration
    
    print_step "Checking code coverage..."
    npm run test:coverage
    
    print_success "All tests passed!"
}

demo() {
    print_header "Demo & Examples"
    
    echo -e "${CYAN}Available demo configurations:${NC}"
    echo "  1. balanced (recommended)"
    echo "  2. highPerformance"
    echo "  3. lowMemory"
    echo ""
    
    read -p "Select configuration (1-3) [1]: " choice
    case $choice in
        2) config="highPerformance" ;;
        3) config="lowMemory" ;;
        *) config="balanced" ;;
    esac
    
    print_step "Running demo with $config configuration..."
    node examples/basic-usage.js "$config"
    
    print_success "Demo completed!"
}

benchmark() {
    print_header "Performance Benchmarks"
    
    echo -e "${CYAN}Available benchmark types:${NC}"
    echo "  1. micro (1K ops, quick test)"
    echo "  2. standard (10K ops, recommended)"
    echo "  3. intensive (100K ops, thorough)"
    echo "  4. stress (500K ops, maximum load)"
    echo ""
    
    read -p "Select benchmark type (1-4) [2]: " choice
    case $choice in
        1) type="micro" ;;
        3) type="intensive" ;;
        4) type="stress" ;;
        *) type="standard" ;;
    esac
    
    print_step "Running $type benchmark..."
    node benchmark/performance-test.js "$type"
    
    print_success "Benchmark completed!"
    print_info "Results saved in test-results/ directory"
}

dev() {
    print_header "Development Mode"
    
    print_step "Starting development environment..."
    print_info "This will:"
    echo "  • Start file watchers"
    echo "  • Enable hot reload"
    echo "  • Run tests on changes"
    echo ""
    
    # Start development with file watching
    npm run dev &
    DEV_PID=$!
    
    print_info "Development server running (PID: $DEV_PID)"
    print_info "Press Ctrl+C to stop"
    
    # Handle cleanup
    trap "kill $DEV_PID 2>/dev/null; exit 0" INT TERM
    wait $DEV_PID
}

postman() {
    print_header "Postman Testing"
    
    if ! command -v newman &> /dev/null; then
        print_warning "Newman (Postman CLI) not found. Installing..."
        npm install -g newman
    fi
    
    echo -e "${CYAN}Available test suites:${NC}"
    echo "  1. Full test suite (all endpoints)"
    echo "  2. Cache Operations only"
    echo "  3. Performance & Monitoring"
    echo "  4. Advanced Features"
    echo "  5. Load Testing"
    echo ""
    
    read -p "Select test suite (1-5) [1]: " choice
    
    case $choice in
        2) folder="Cache Operations" ;;
        3) folder="Performance & Monitoring" ;;
        4) folder="Advanced Features" ;;
        5) folder="Load Testing Suite" ;;
        *) folder="" ;;
    esac
    
    print_step "Running Postman tests..."
    
    if [ -z "$folder" ]; then
        newman run postman/cache-money-bebe.postman_collection.json \
            -e postman/cache-money-bebe.postman_environment.json \
            --reporters cli,json \
            --reporter-json-export test-results/postman-results.json
    else
        newman run postman/cache-money-bebe.postman_collection.json \
            -e postman/cache-money-bebe.postman_environment.json \
            --folder "$folder" \
            --reporters cli,json \
            --reporter-json-export test-results/postman-results.json
    fi
    
    print_success "Postman tests completed!"
}

deploy() {
    print_header "Deploy to Production"
    
    print_step "Running pre-deployment checks..."
    
    # Check if we're on the right branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH_NAME" ]; then
        print_error "Not on $BRANCH_NAME branch. Current: $current_branch"
        exit 1
    fi
    
    # Run tests
    print_step "Running full test suite..."
    npm test
    
    # Run security audit
    print_step "Checking for security vulnerabilities..."
    npm audit --audit-level moderate
    
    # Build production bundle
    print_step "Building production bundle..."
    NODE_ENV=production npm run build:prod
    
    # Test production build
    print_step "Testing production build..."
    NODE_ENV=production node examples/basic-usage.js
    
    # Create deployment tag
    version=$(node -p "require('./package.json').version")
    tag="v$version"
    
    print_step "Creating deployment tag: $tag"
    git tag -a "$tag" -m "Release $tag - Cache Money Bebe production deployment"
    
    # Push changes and tags
    print_step "Pushing to remote repository..."
    git push origin "$BRANCH_NAME"
    git push origin "$tag"
    
    print_success "Deployment completed successfully!"
    print_info "Tagged as: $tag"
    print_info "Branch: $BRANCH_NAME"
}

publish() {
    print_header "Publish to NPM"
    
    print_step "Running pre-publish checks..."
    
    # Check if logged into npm
    if ! npm whoami &> /dev/null; then
        print_error "Not logged into NPM. Run: npm login"
        exit 1
    fi
    
    # Check version
    version=$(node -p "require('./package.json').version")
    print_info "Publishing version: $version"
    
    # Build and test
    npm run build
    npm test
    
    # Publish
    print_step "Publishing to NPM..."
    npm publish
    
    print_success "Published to NPM successfully!"
    print_info "Version: $version"
    print_info "Package: @your-org/cache-money-bebe"
}

status() {
    print_header "Project Status"
    
    print_info "Project Directory: $PROJECT_DIR"
    print_info "Current Branch: $(git branch --show-current)"
    print_info "Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    
    echo ""
    print_info "Package Information:"
    node -p "
        const pkg = require('./package.json');
        console.log(\`  Name: \${pkg.name}\`);
        console.log(\`  Version: \${pkg.version}\`);
        console.log(\`  Description: \${pkg.description}\`);
    "
    
    echo ""
    print_info "Git Status:"
    git status --short
    
    echo ""
    print_info "Available Scripts:"
    npm run | grep -E "^  [a-z]" || echo "  No scripts found"
}

help() {
    print_header "Available Commands"
    
    echo -e "${CYAN}Usage: ./scripts/deploy.sh [command]${NC}"
    echo ""
    echo -e "${YELLOW}Setup & Development:${NC}"
    echo "  setup     - Install dependencies and initial setup"
    echo "  build     - Build the project"
    echo "  dev       - Start development mode with watchers"
    echo "  test      - Run full test suite"
    echo ""
    echo -e "${YELLOW}Examples & Testing:${NC}"
    echo "  demo      - Run interactive demo"
    echo "  benchmark - Run performance benchmarks"
    echo "  postman   - Run Postman API tests"
    echo ""
    echo -e "${YELLOW}Deployment:${NC}"
    echo "  deploy    - Deploy to production"
    echo "  publish   - Publish to NPM"
    echo "  status    - Show project status"
    echo ""
    echo -e "${YELLOW}Utility:${NC}"
    echo "  help      - Show this help message"
    echo ""
    
    print_info "Quick Start:"
    echo "  1. ./scripts/deploy.sh setup"
    echo "  2. ./scripts/deploy.sh demo"
    echo "  3. ./scripts/deploy.sh benchmark"
}

# Main command handling
case "${1:-help}" in
    setup)     setup ;;
    build)     build ;;
    test)      test ;;
    demo)      demo ;;
    benchmark) benchmark ;;
    dev)       dev ;;
    postman)   postman ;;
    deploy)    deploy ;;
    publish)   publish ;;
    status)    status ;;
    help|*)    help ;;
esac