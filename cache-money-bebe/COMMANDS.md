# 💰 Cache Money Bebe - Quick Command Reference

## 🚀 Essential Commands

### Navigate to Project
```bash
cd /Users/zharris/job-tracker-pro/cache-money-bebe
```

### One-Time Setup
```bash
# Install and setup everything
./scripts/deploy.sh setup

# Or manually:
npm install && npm run build && npm test
```

## 📋 Daily Development Commands

### Development Workflow
```bash
# Start development mode (file watchers, hot reload)
./scripts/deploy.sh dev

# Run quick demo
./scripts/deploy.sh demo

# Run tests
npm test                    # Quick tests
./scripts/deploy.sh test    # Full test suite

# Build project
npm run build               # Standard build
./scripts/deploy.sh build   # Build with checks
```

### Code Quality
```bash
npm run lint                # Check code style
npm run format              # Auto-format code
npm run type-check          # TypeScript checks
npm run clean               # Clean build files
```

## 🧪 Testing & Examples

### Example Scripts
```bash
# Basic usage examples
node examples/basic-usage.js                    # Default (balanced)
node examples/basic-usage.js highPerformance    # High performance config
node examples/basic-usage.js lowMemory          # Low memory config
node examples/basic-usage.js balanced           # Balanced config

# Interactive demo
./scripts/deploy.sh demo
```

### Performance Benchmarks
```bash
# Quick benchmark
npm run benchmark

# Different benchmark types
./scripts/deploy.sh benchmark     # Interactive selection
node benchmark/performance-test.js micro        # 1K operations
node benchmark/performance-test.js standard     # 10K operations  
node benchmark/performance-test.js intensive    # 100K operations
node benchmark/performance-test.js stress       # 500K operations
```

### API Testing with Postman
```bash
# Install Newman (Postman CLI) if needed
npm install -g newman

# Run all API tests
./scripts/deploy.sh postman

# Manual Newman commands
newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json

# Run specific test suites
newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json \
  --folder "Cache Operations"

newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json \
  --folder "Performance & Monitoring"
```

## 🔧 Configuration Examples

### Quick Config Snippets

**High Performance (Browser/SPA):**
```javascript
const config = {
  environment: 'browser',
  preset: 'high-performance',
  revolvingDoor: { maxLocalCacheSize: 200, conveyorBeltCycle: 1000 },
  integration: { syncMode: 'aggressive' }
};
```

**Low Memory (Constrained Environments):**
```javascript
const config = {
  environment: 'nodejs', 
  preset: 'low-memory',
  revolvingDoor: { maxLocalCacheSize: 50 },
  memoryPressure: { enabled: true, threshold: 0.8 }
};
```

**Balanced (Recommended Default):**
```javascript
const config = { preset: 'balanced' }; // Uses smart defaults
```

## 🐛 Debugging & Monitoring

### Enable Debug Logging
```bash
# Full debug logging
DEBUG=cache-money-bebe:* node your-app.js

# Specific components
DEBUG=cache-memory:* node your-app.js         # Memory management
DEBUG=cache-performance:* node your-app.js    # Performance metrics
```

### Memory Debugging  
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 your-app.js

# Enable garbage collection logging
node --trace-gc your-app.js

# Profile performance
node --prof your-app.js
node --prof-process isolate-*.log > profile.txt
```

### Health Monitoring
```javascript
// In your application
const health = await cache.getHealth();
console.log('Cache Status:', health.status);
console.log('Memory Usage:', health.memoryUsage);
console.log('Hit Ratio:', health.hitRatio);

const stats = await cache.getStats();
console.log('Performance Stats:', stats);
```

## 🚀 Deployment Commands

### Git Workflow
```bash
# Check current status
git status
git branch --show-current

# Current branch should be: feature/cache-money-bebe
./scripts/deploy.sh status

# Commit changes
git add .
git commit -m "feat: your changes here"
git push origin feature/cache-money-bebe
```

### Production Deployment
```bash
# Full deployment (includes all checks)
./scripts/deploy.sh deploy

# Manual steps:
npm test                                    # Run tests
npm audit                                   # Security check
NODE_ENV=production npm run build:prod     # Production build
NODE_ENV=production node examples/basic-usage.js  # Test build
```

### NPM Publishing
```bash
# Publish to NPM (when ready)
npm login                    # Login to NPM first
./scripts/deploy.sh publish  # Automated publish

# Manual publish
npm version patch            # Bump version
npm publish                  # Publish package
```

## 📊 Monitoring & Analytics

### Performance Monitoring
```bash
# Check current performance
./scripts/deploy.sh benchmark

# Monitor during development
npm run dev                  # Includes performance monitoring

# Production monitoring
NODE_ENV=production DEBUG=cache-performance:* node your-app.js
```

### View Results
```bash
# Results are saved in test-results/ directory
ls test-results/

# View latest benchmark
cat test-results/benchmark-summary-*.md

# View latest demo results  
cat test-results/cache-demo-*.json
```

## ⚡ Quick Troubleshooting

### Common Issues
```bash
# Node/NPM version issues
node --version              # Should be 14+
npm --version              # Should be 6+

# Permission issues
sudo chown -R $(whoami) ~/.npm

# Module resolution issues  
rm -rf node_modules package-lock.json
npm install

# Build issues
npm run clean
npm run build

# Test failures
npm run lint --fix          # Fix linting issues
npm test -- --verbose       # Detailed test output
```

### Performance Issues
```bash
# Check memory usage
node -e "console.log(process.memoryUsage())"

# Run memory benchmark
./scripts/deploy.sh benchmark
# Select option 3 (intensive) to stress test

# Check for memory leaks
DEBUG=cache-memory:* node examples/basic-usage.js
```

## 🎯 Project Structure Quick Reference

```
cache-money-bebe/
├── src/core/                    # Core cache implementation
├── examples/                    # Usage examples & demos
├── benchmark/                   # Performance testing
├── postman/                     # API testing collections
├── scripts/deploy.sh            # Main deployment script
├── docs/QUICK_START.md         # Detailed documentation
├── package.json                # NPM configuration
└── README.md                   # Main documentation
```

## 🔗 Useful Links

- **GitHub Branch:** `feature/cache-money-bebe`
- **Project Directory:** `/Users/zharris/job-tracker-pro/cache-money-bebe`
- **Documentation:** `docs/QUICK_START.md`
- **Examples:** `examples/basic-usage.js`
- **Postman Collections:** `postman/`

---

💡 **Pro Tip:** Use `./scripts/deploy.sh help` for the interactive command menu!