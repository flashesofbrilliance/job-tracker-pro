# 🚀 Quick Start Guide - Cache Money Bebe

## Prerequisites

Ensure you have Node.js installed (v14+ recommended):
```bash
node --version
npm --version
```

## Installation

```bash
# Navigate to the cache-money-bebe directory
cd /Users/zharris/job-tracker-pro/cache-money-bebe

# Install dependencies
npm install

# Build the package
npm run build

# Run tests to verify installation
npm test
```

## 🎯 Quick Commands Reference

### Basic Development Commands

```bash
# Install dependencies
npm install

# Build the package (all formats)
npm run build

# Build and watch for changes
npm run build:watch

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint and format code
npm run lint
npm run format

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

### 📊 Performance & Benchmarking

```bash
# Run standard performance benchmark
npm run benchmark

# Run different benchmark types
npm run benchmark:micro     # Quick 1K operations test
npm run benchmark:standard  # Standard 10K operations 
npm run benchmark:intensive # Intensive 100K operations
npm run benchmark:stress    # Stress 500K operations

# Run benchmarks with custom parameters
node benchmark/performance-test.js standard
node benchmark/performance-test.js intensive
```

### 🧪 Example Scripts

```bash
# Run the basic usage example (balanced config)
node examples/basic-usage.js

# Run with different configurations
node examples/basic-usage.js highPerformance
node examples/basic-usage.js lowMemory
node examples/basic-usage.js balanced

# Make example executable and run directly
chmod +x examples/basic-usage.js
./examples/basic-usage.js
```

## 🔧 Configuration Examples

### High Performance Setup
```javascript
const config = {
  environment: 'browser',
  preset: 'high-performance',
  revolvingDoor: {
    maxLocalCacheSize: 200,
    conveyorBeltCycle: 1000,
    enablePrefetch: true
  },
  payloadCache: {
    compressionThreshold: 1024,
    maxPayloadSize: 10 * 1024 * 1024
  },
  integration: {
    syncMode: 'aggressive',
    maxPrefetchDistance: 10
  }
};
```

### Low Memory Setup
```javascript
const config = {
  environment: 'nodejs',
  preset: 'low-memory',
  revolvingDoor: {
    maxLocalCacheSize: 50,
    conveyorBeltCycle: 3000
  },
  memoryPressure: {
    enabled: true,
    threshold: 0.8,
    aggressiveCleanup: true
  }
};
```

### Balanced Setup (Recommended for most use cases)
```javascript
const config = {
  environment: 'webworker',
  preset: 'balanced'
  // Uses optimal defaults for most scenarios
};
```

## 📡 API Testing with Postman

### Import Collections

1. **Import the main collection:**
   ```bash
   # Open Postman and import:
   # File: /Users/zharris/job-tracker-pro/cache-money-bebe/postman/cache-money-bebe.postman_collection.json
   ```

2. **Import the environment:**
   ```bash
   # File: /Users/zharris/job-tracker-pro/cache-money-bebe/postman/cache-money-bebe.postman_environment.json
   ```

### Quick Test Commands

```bash
# If you have newman (Postman CLI) installed
npm install -g newman

# Run the entire test suite
newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json

# Run specific folders
newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json \
  --folder "Cache Operations"

newman run postman/cache-money-bebe.postman_collection.json \
  -e postman/cache-money-bebe.postman_environment.json \
  --folder "Performance & Monitoring"
```

## 🚀 Quick Start - Basic Usage

### 1. Initialize Cache

```javascript
const { CacheManager, Config } = require('cache-money-bebe');

// Create and initialize cache
const config = new Config({ preset: 'balanced' });
const cache = new CacheManager(config);
await cache.initialize();
```

### 2. Basic Operations

```javascript
// Set a value
await cache.set('user:123', { 
  name: 'John Doe', 
  email: 'john@example.com' 
}, { ttl: 300000 });

// Get a value
const user = await cache.get('user:123');
console.log(user); // { name: 'John Doe', email: 'john@example.com' }

// Get or fetch pattern
const weather = await cache.getOrFetch('weather:current', async () => {
  // This function runs if cache miss
  const response = await fetch('https://api.weather.com/current');
  return response.json();
}, { ttl: 180000 });
```

### 3. Advanced Features

```javascript
// Batch operations
await cache.mset({
  'product:1': { name: 'Widget', price: 9.99 },
  'product:2': { name: 'Gadget', price: 19.99 }
});

const products = await cache.mget(['product:1', 'product:2']);

// Prefetch for performance
await cache.prefetch([
  { key: 'user:124', fetcher: () => fetchUser(124) },
  { key: 'user:125', fetcher: () => fetchUser(125) }
]);

// Pattern-based invalidation
await cache.invalidate('user:*');
```

## 📊 Monitoring & Health

```javascript
// Check cache health
const health = await cache.getHealth();
console.log('Status:', health.status);
console.log('Uptime:', health.uptime);
console.log('Memory Usage:', health.memoryUsage);

// Get performance statistics  
const stats = await cache.getStats();
console.log('Hit Ratio:', stats.hitRatio);
console.log('Avg Response Time:', stats.avgResponseTime);
```

## 🐛 Debugging & Development

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=cache-money-bebe:*

# Run your application
node your-app.js

# Or run with inline debug
DEBUG=cache-money-bebe:* node your-app.js
```

### Development Mode

```bash
# Run in development mode with hot reload
npm run dev

# Run tests with coverage
npm run test:coverage

# Generate documentation
npm run docs:generate

# View documentation locally
npm run docs:serve
```

## 🔍 Troubleshooting

### Common Issues

1. **Memory Issues:**
   ```bash
   # Run with increased memory
   node --max-old-space-size=4096 your-app.js
   
   # Enable garbage collection logging
   node --trace-gc your-app.js
   ```

2. **Performance Issues:**
   ```bash
   # Run performance benchmark
   npm run benchmark
   
   # Profile your application
   node --prof your-app.js
   node --prof-process isolate-*.log > profile.txt
   ```

3. **Configuration Issues:**
   ```bash
   # Validate configuration
   node -e "
   const { Config } = require('./src');
   const config = new Config(yourConfigHere);
   console.log(config.validate());
   "
   ```

## 📈 Production Deployment

### Pre-deployment Checklist

```bash
# 1. Run all tests
npm test

# 2. Run benchmarks
npm run benchmark

# 3. Check for security vulnerabilities
npm audit

# 4. Build production bundle
npm run build:prod

# 5. Test production build
NODE_ENV=production node examples/basic-usage.js
```

### Production Configuration Example

```javascript
const productionConfig = {
  environment: 'nodejs',
  preset: 'high-performance',
  logging: {
    enabled: true,
    level: 'warn'
  },
  monitoring: {
    enabled: true,
    metricsInterval: 30000
  },
  memoryPressure: {
    enabled: true,
    threshold: 0.85,
    aggressiveCleanup: true
  },
  circuitBreaker: {
    enabled: true,
    threshold: 10,
    timeout: 60000
  }
};
```

## 🔗 Next Steps

1. **Explore Examples:** Check out `/examples` directory for more usage patterns
2. **Read API Docs:** See `/docs/API.md` for complete API reference
3. **Performance Tuning:** Use `/benchmark` tools to optimize for your use case
4. **Testing:** Import Postman collections for comprehensive API testing
5. **Contributing:** See `/docs/CONTRIBUTING.md` for development guidelines

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/cache-money-bebe/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/cache-money-bebe/discussions)
- **Documentation:** `/docs` directory in this repository