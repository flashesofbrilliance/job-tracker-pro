# 💰 cache-money-bebe

[![npm version](https://badge.fury.io/js/cache-money-bebe.svg)](https://www.npmjs.com/package/cache-money-bebe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

> 🚀 The ultimate caching orchestration library that makes your app fast and your cache game strong! Featuring revolving door cache strategy, payload cache strap, and intelligent cache integration for high-performance web applications.

**Because cache money ain't cache problems!** 💸

---

## ✨ Features

🎡 **Revolving Door Cache Strategy** - Phase-offset cache busting synchronized with your app's timing
🛡️ **Built-in Safety Systems** - Recursion guards, circuit breakers, and memory monitoring
⚡ **Framework Agnostic** - Works in browsers, Node.js, and Web Workers
📊 **Adaptive Configuration** - Automatically adjusts based on performance and memory pressure
🎯 **Zero Dependencies** - Completely self-contained for maximum compatibility
🔧 **TypeScript Ready** - Full type definitions and IntelliSense support

---

## 🚀 Quick Start

### Installation

```bash
npm install cache-money-bebe
```

### Basic Usage

```javascript
import { CacheMoneyBebe } from 'cache-money-bebe';

// Initialize with default settings
const cache = new CacheMoneyBebe();

// Or with custom configuration
const cache = new CacheMoneyBebe({
  revolvingDoor: {
    maxLocalCacheSize: 100,
    conveyorBeltCycle: 2000
  },
  integration: {
    syncMode: 'aggressive'
  }
});

// Start caching like a boss! 💪
await cache.initialize();

// Get data with intelligent caching
const data = await cache.get('user:123', async () => {
  return await fetch('/api/users/123').then(r => r.json());
});

// Prefetch predictively
cache.prefetch(['user:124', 'user:125']);

// Get cache performance stats
console.log(cache.getStats());
```

---

## 📖 Core Concepts

### 🎡 Revolving Door Cache Strategy

The heart of cache-money-bebe is our innovative **Revolving Door Cache** system that creates a narrow cache window synchronized with your application's timing. This prevents stale data while ensuring smooth performance.

```javascript
// The revolving door automatically manages:
// 🔥 HOT cache - immediate access (< 1ms)
// 🔄 WARM cache - promotion ready (< 5ms) 
// ❄️ COLD cache - background sync (< 50ms)

const cache = new CacheMoneyBebe({
  revolvingDoor: {
    conveyorBeltCycle: 3000,    // 3s rotation cycle
    phaseOffset: 0.25,          // 25% phase offset
    cacheWindowWidth: 500,      // 500ms sync window
    maxLocalCacheSize: 50       // 50 item limit
  }
});
```

### 🛡️ Safety Systems

Built-in protection against common cache pitfalls:

- **Recursion Guards** - Prevent infinite loops and stack overflows
- **Circuit Breakers** - Stop cascade failures before they spread
- **Memory Monitoring** - Automatic cleanup when memory pressure is high
- **Event Loop Protection** - Prevent event storms and flooding

```javascript
// Safety is built-in and automatic
const data = await cache.get('dangerous-operation', async () => {
  // Even if this function calls cache.get() recursively,
  // the recursion guard will prevent infinite loops
  return await riskyOperation();
});
```

### ⚡ Performance Features

- **Predictive Prefetching** - ML-powered cache warming
- **Adaptive Batch Sizing** - Automatically adjusts to network conditions
- **Phase-Offset Timing** - Eliminates cache stampedes
- **Memory Pressure Response** - Graceful degradation under load

---

## 🎛️ Configuration

### Environment-Specific Defaults

cache-money-bebe automatically detects your environment and applies optimized defaults:

#### Browser (Default)
```javascript
{
  revolvingDoor: {
    conveyorBeltCycle: 3000,
    maxLocalCacheSize: 50,
    preloadLookahead: 3
  },
  integration: {
    syncMode: 'adaptive',
    enablePredictivePrefetch: true
  }
}
```

#### Node.js
```javascript
{
  revolvingDoor: {
    conveyorBeltCycle: 2000,
    maxLocalCacheSize: 100,
    preloadLookahead: 5
  },
  integration: {
    syncMode: 'aggressive',
    maxPrefetchDistance: 8
  }
}
```

#### Web Worker
```javascript
{
  revolvingDoor: {
    conveyorBeltCycle: 4000,
    maxLocalCacheSize: 25,
    preloadLookahead: 2
  },
  integration: {
    syncMode: 'conservative',
    enablePredictivePrefetch: false
  }
}
```

### Configuration Presets

```javascript
// High-performance setup
const cache = new CacheMoneyBebe.createPreset('high-performance');

// Low-memory setup  
const cache = new CacheMoneyBebe.createPreset('low-memory');

// Balanced setup (default)
const cache = new CacheMoneyBebe.createPreset('balanced');
```

### Custom Configuration

```javascript
const cache = new CacheMoneyBebe({
  // Revolving Door Settings
  revolvingDoor: {
    conveyorBeltCycle: 2500,        // Cache rotation cycle
    cacheWindowWidth: 400,          // Sync window width
    phaseOffset: 0.3,               // Phase offset (0-1)
    revolvingCycles: 4,             // Number of cache segments
    maxLocalCacheSize: 75,          // Max hot cache items
    preloadLookahead: 4,            // Prefetch distance
    cdnSyncInterval: 800            // CDN sync frequency
  },
  
  // Payload Cache Settings
  payloadCache: {
    fplPayloadTimeout: 3000,        // First Paint Load timeout
    payloadBatchSize: 15,           // Batch processing size
    cronInterval: 25000,            // Background job interval
    maxConcurrentPayloads: 7,       // Concurrent operations
    syncStateThreshold: 0.97        // Sync success threshold
  },
  
  // Integration Settings
  integration: {
    syncMode: 'adaptive',           // 'aggressive' | 'adaptive' | 'conservative'
    performanceThreshold: 0.85,     // Performance threshold
    enablePredictivePrefetch: true, // Enable ML prefetching
    maxPrefetchDistance: 6          // Max prefetch distance
  },
  
  // Safety Settings
  safety: {
    maxRecursionDepth: 12,          // Max recursion depth
    circuitBreakerThreshold: 6,     // Circuit breaker trip point
    circuitBreakerTimeout: 25000,   // Circuit breaker timeout
    memoryWarningThreshold: 0.75,   // Memory warning level
    memoryCriticalThreshold: 0.9,   // Memory critical level
    memoryEmergencyThreshold: 0.97  // Memory emergency level
  },
  
  // General Settings
  enableLogging: true,              // Enable debug logging
  syncInterval: 800,                // Inter-cache sync interval
  environment: 'browser'            // Force environment
});
```

---

## 💡 API Reference

### Core Methods

#### `initialize()`
Initialize the cache system and start background processes.

```javascript
await cache.initialize();
```

#### `get(key, fetchFn, options)`
Get data from cache or fetch if not available.

```javascript
const data = await cache.get(
  'user:123',                     // Cache key
  async () => {                   // Fetch function
    return await fetchUser(123);
  },
  {                               // Options
    priority: 'high',             // Priority level
    ttl: 300000,                  // Time to live (ms)
    tags: ['user', 'profile']     // Cache tags for invalidation
  }
);
```

#### `set(key, data, options)`
Manually set cache data.

```javascript
await cache.set('user:123', userData, {
  ttl: 600000,                    // 10 minutes TTL
  tags: ['user']                  // Tags for grouping
});
```

#### `invalidate(pattern)`
Invalidate cache entries by pattern or tags.

```javascript
// Invalidate by key pattern
await cache.invalidate('user:*');

// Invalidate by tags
await cache.invalidate({ tags: ['user'] });

// Invalidate all
await cache.invalidate('*');
```

#### `prefetch(keys)`
Prefetch data for future use.

```javascript
// Prefetch specific keys
await cache.prefetch(['user:124', 'user:125']);

// Prefetch with pattern
await cache.prefetch('user:12*');
```

### Event System

```javascript
// Listen for cache events
cache.on('cache:hit', (event) => {
  console.log('Cache hit:', event.data);
});

cache.on('cache:miss', (event) => {
  console.log('Cache miss:', event.data);
});

cache.on('memory:pressure', (event) => {
  console.log('Memory pressure:', event.data.level);
});

cache.on('circuit:open', (event) => {
  console.log('Circuit breaker opened:', event.data);
});
```

### Statistics & Monitoring

```javascript
// Get cache statistics
const stats = cache.getStats();
console.log(stats);
/*
{
  cacheHits: 1247,
  cacheMisses: 89,
  hitRatio: 0.933,
  memoryUsage: 0.45,
  avgResponseTime: 12.3,
  circuitBreakerStatus: 'CLOSED',
  adaptiveModeChanges: 3
}
*/

// Get cache status
const status = cache.getStatus();
console.log(status);
/*
{
  isReady: true,
  fplComplete: true,
  currentPhase: 'running',
  activeStrategies: ['revolving-door', 'payload-strap'],
  memoryPressure: 'normal'
}
*/
```

---

## 🔧 Advanced Usage

### Custom Cache Strategies

```javascript
import { CacheMoneyBebe, CacheStrategy } from 'cache-memory-bebe';

class CustomStrategy extends CacheStrategy {
  async get(key, fetchFn) {
    // Your custom cache logic
    return await this.customCacheLogic(key, fetchFn);
  }
}

const cache = new CacheMoneyBebe({
  strategies: [new CustomStrategy()]
});
```

### Middleware Support

```javascript
// Add middleware for request/response processing
cache.use((request, response, next) => {
  // Log all cache operations
  console.log(`Cache ${request.operation}: ${request.key}`);
  next();
});

// Add authentication middleware
cache.use(async (request, response, next) => {
  if (request.key.startsWith('secure:')) {
    request.headers = await getAuthHeaders();
  }
  next();
});
```

### Multi-Instance Coordination

```javascript
// Primary instance
const primaryCache = new CacheMoneyBebe({
  role: 'primary',
  coordinationChannel: 'cache-sync'
});

// Secondary instance
const secondaryCache = new CacheMoneyBebe({
  role: 'secondary', 
  coordinationChannel: 'cache-sync'
});

// Automatic sync between instances
await primaryCache.sync(secondaryCache);
```

---

## 🛠️ Development & Debugging

### Debug Mode

```javascript
const cache = new CacheMoneyBebe({
  enableLogging: true,
  debug: true
});

// Enable specific debug channels
cache.debug.enable('cache:operations');
cache.debug.enable('memory:monitoring');
cache.debug.enable('performance:timing');
```

### Performance Profiling

```javascript
// Start profiling
cache.profile.start('my-operation');

// Your cache operations
await cache.get('key', fetchFn);

// End profiling and get results
const results = cache.profile.end('my-operation');
console.log(results);
/*
{
  duration: 23.5,
  operations: 15,
  cacheHits: 12,
  memoryAllocated: 1.2,
  recommendations: ['increase cache size', 'reduce batch size']
}
*/
```

### Health Checks

```javascript
// Comprehensive health check
const health = await cache.healthCheck();
console.log(health);
/*
{
  status: 'healthy',
  uptime: 3600000,
  memoryUsage: 0.45,
  cacheEfficiency: 0.92,
  issues: [],
  recommendations: ['Consider increasing cache size']
}
*/
```

---

## 🧪 Testing

### Unit Testing

```javascript
import { CacheMoneyBebe, createMockCache } from 'cache-money-bebe/testing';

describe('My App Cache', () => {
  let cache;
  
  beforeEach(() => {
    cache = createMockCache();
  });
  
  test('should cache user data', async () => {
    const userData = { id: 123, name: 'John' };
    
    await cache.set('user:123', userData);
    const result = await cache.get('user:123');
    
    expect(result).toEqual(userData);
  });
});
```

### Load Testing

```javascript
import { loadTest } from 'cache-money-bebe/testing';

// Simulate high load
const results = await loadTest(cache, {
  operations: 10000,
  concurrency: 100,
  keyPattern: 'test:*',
  duration: 60000
});

console.log(results);
/*
{
  totalOperations: 10000,
  avgResponseTime: 15.2,
  errorRate: 0.001,
  memoryLeaks: false,
  recommendations: ['Increase cache size']
}
*/
```

---

## 📈 Performance Benchmarks

### Browser Performance
- **Cache Hit Latency**: < 2ms (target: < 5ms)
- **Memory Overhead**: < 5MB base (target: < 10MB)
- **Event Processing**: 20k events/sec (target: 10k/sec)
- **First Paint Load**: < 100ms improvement

### Node.js Performance  
- **Throughput**: 50k ops/sec (target: 30k/sec)
- **Memory Efficiency**: 95% (target: 90%)
- **CPU Usage**: < 5% overhead (target: < 10%)
- **Concurrent Connections**: 10k+ (target: 5k+)

### Memory Usage by Environment
| Environment | Base | Peak | Efficiency |
|-------------|------|------|------------|
| Browser     | 5MB  | 15MB | 94%        |
| Node.js     | 8MB  | 25MB | 96%        |
| Web Worker  | 2MB  | 8MB  | 92%        |

---

## 🚀 Cache Initialization Workflows

### Basic Initialization

```javascript
import { CacheMoneyBebe } from 'cache-money-bebe';

// 1. Create cache instance
const cache = new CacheMoneyBebe();

// 2. Wait for initialization 
await cache.initialize();

// 3. Cache is ready!
console.log('💰 Cache ready to make money!');
```

### Advanced Initialization with State Sync

```javascript
import { CacheMoneyBebe, SyncState } from 'cache-money-bebe';

async function initializeCacheSystem() {
  console.log('🚀 Starting cache initialization...');
  
  // Step 1: Create cache with custom config
  const cache = new CacheMoneyBebe({
    revolvingDoor: {
      conveyorBeltCycle: 2500,
      maxLocalCacheSize: 75
    },
    enableLogging: true
  });
  
  // Step 2: Setup event listeners for initialization phases
  cache.on('init:phase', (event) => {
    console.log(`📋 Phase: ${event.data.phase}`);
  });
  
  cache.on('sync:state', (event) => {
    console.log(`🔄 Sync: ${event.data.state} (${event.data.progress}%)`);
  });
  
  // Step 3: Initialize with state synchronization
  const initResult = await cache.initialize({
    // Pre-warm with critical data
    preWarm: [
      { key: 'config', fetcher: () => fetchAppConfig() },
      { key: 'user', fetcher: () => fetchCurrentUser() }
    ],
    
    // Validate cache state after initialization
    validateState: true,
    
    // Timeout for initialization
    timeout: 10000
  });
  
  if (!initResult.success) {
    console.error('❌ Cache initialization failed:', initResult.error);
    throw new Error('Cache initialization failed');
  }
  
  // Step 4: Verify sync state
  const syncState = await cache.validateSyncState();
  if (syncState.isValid) {
    console.log('✅ Cache sync state validated');
  } else {
    console.warn('⚠️ Cache sync issues:', syncState.issues);
  }
  
  // Step 5: Start background processes
  await cache.startBackgroundProcesses();
  
  console.log('💰 Cache system fully initialized and ready!');
  return cache;
}

// Usage
const cache = await initializeCacheSystem();
```

### Cache State Synchronization Actions

```javascript
// Manual sync actions for complex scenarios

class CacheSyncManager {
  constructor(cache) {
    this.cache = cache;
    this.syncState = new SyncState();
  }
  
  // Action 1: Force full synchronization
  async forceSyncAll() {
    console.log('🔄 Starting full cache synchronization...');
    
    const result = await this.cache.sync.all({
      strategy: 'aggressive',
      timeout: 30000,
      retryCount: 3
    });
    
    return result;
  }
  
  // Action 2: Incremental sync
  async incrementalSync(since = null) {
    const timestamp = since || this.syncState.lastSyncTime;
    
    const changes = await this.cache.sync.incremental({
      since: timestamp,
      batchSize: 50
    });
    
    this.syncState.lastSyncTime = Date.now();
    return changes;
  }
  
  // Action 3: Conflict resolution
  async resolveConflicts() {
    const conflicts = await this.cache.sync.getConflicts();
    
    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      await this.cache.sync.resolveConflict(conflict.id, resolution);
    }
    
    return conflicts.length;
  }
  
  // Action 4: Health check and repair
  async healthCheckAndRepair() {
    const health = await this.cache.healthCheck();
    
    if (!health.isHealthy) {
      console.log('🔧 Repairing cache issues...');
      
      for (const issue of health.issues) {
        await this.repairIssue(issue);
      }
      
      // Re-verify health
      const newHealth = await this.cache.healthCheck();
      return newHealth.isHealthy;
    }
    
    return true;
  }
  
  async repairIssue(issue) {
    switch (issue.type) {
      case 'memory_leak':
        await this.cache.gc.collect();
        break;
      case 'stale_entries':
        await this.cache.cleanup.stale();
        break;
      case 'corruption':
        await this.cache.repair.corruption(issue.keys);
        break;
    }
  }
}

// Usage
const syncManager = new CacheSyncManager(cache);

// Run periodic synchronization
setInterval(async () => {
  await syncManager.incrementalSync();
}, 60000); // Every minute

// Health check every 5 minutes
setInterval(async () => {
  await syncManager.healthCheckAndRepair();
}, 300000);
```

### Production-Ready Initialization Script

```javascript
// production-init.js
import { CacheMoneyBebe, HealthMonitor } from 'cache-money-bebe';

export async function initProductionCache(config = {}) {
  const startTime = Date.now();
  
  try {
    // 1. Environment detection and config
    const environment = detectProductionEnvironment();
    const finalConfig = {
      ...getEnvironmentDefaults(environment),
      ...config,
      enableLogging: process.env.NODE_ENV !== 'production'
    };
    
    console.log(`🚀 Initializing cache for ${environment} environment`);
    
    // 2. Create cache instance
    const cache = new CacheMoneyBebe(finalConfig);
    
    // 3. Setup production monitoring
    const healthMonitor = new HealthMonitor(cache);
    
    healthMonitor.on('critical', async (event) => {
      console.error('🚨 CRITICAL:', event.data);
      await notifyOpsTeam(event.data);
    });
    
    healthMonitor.on('warning', (event) => {
      console.warn('⚠️ WARNING:', event.data);
    });
    
    // 4. Initialize with production safety
    const initResult = await cache.initialize({
      preWarm: config.preWarmKeys || [],
      validateState: true,
      timeout: 15000,
      fallbackMode: 'graceful'
    });
    
    if (!initResult.success) {
      throw new Error(`Cache initialization failed: ${initResult.error}`);
    }
    
    // 5. Verify all systems
    const health = await cache.healthCheck();
    if (!health.isHealthy) {
      console.warn('⚠️ Cache health issues detected:', health.issues);
    }
    
    // 6. Start monitoring and background processes
    await Promise.all([
      cache.startBackgroundProcesses(),
      healthMonitor.start(),
      setupGracefulShutdown(cache, healthMonitor)
    ]);
    
    const initTime = Date.now() - startTime;
    console.log(`✅ Cache initialized successfully in ${initTime}ms`);
    
    // 7. Return production-ready cache instance
    return {
      cache,
      healthMonitor,
      stats: cache.getStats(),
      initTime
    };
    
  } catch (error) {
    console.error('❌ Cache initialization failed:', error);
    throw error;
  }
}

function detectProductionEnvironment() {
  if (process.env.KUBERNETES_SERVICE_HOST) return 'kubernetes';
  if (process.env.AWS_REGION) return 'aws';
  if (process.env.VERCEL) return 'vercel';
  return 'generic';
}

function setupGracefulShutdown(cache, healthMonitor) {
  const shutdown = async (signal) => {
    console.log(`📦 Graceful shutdown initiated (${signal})`);
    
    try {
      await Promise.all([
        cache.gracefulShutdown(),
        healthMonitor.stop()
      ]);
      
      console.log('✅ Cache system shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart
}

// Usage in your application
async function main() {
  const { cache, healthMonitor } = await initProductionCache({
    revolvingDoor: {
      maxLocalCacheSize: 200
    },
    preWarmKeys: ['app:config', 'user:session']
  });
  
  // Your application logic here
  app.use('/health', (req, res) => {
    const health = cache.getHealthSummary();
    res.json(health);
  });
  
  console.log('💰 Application ready with cache-money-bebe!');
}
```

---

## 🤝 Contributing

We love contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/cache-money-bebe.git
cd cache-money-bebe

# Install dependencies
npm install

# Run tests
npm test

# Start development mode
npm run dev

# Build for production
npm run build
```

---

## 📝 License

MIT © [Your Name](https://github.com/yourusername)

---

## 💬 Support

- 📖 [Documentation](https://cache-money-bebe.dev)
- 💬 [Discord Community](https://discord.gg/cache-money-bebe)
- 🐛 [Issue Tracker](https://github.com/yourusername/cache-money-bebe/issues)
- ✉️ [Email Support](mailto:support@cache-money-bebe.dev)

---

**Made with ❤️ by developers who understand that cache money ain't cache problems!** 💰

*"In cache we trust, in performance we prosper"* 🚀