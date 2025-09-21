#!/usr/bin/env node

/**
 * 💰 Cache Money Bebe - Basic Usage Example
 * 
 * This example demonstrates the core features of cache-money-bebe:
 * - Cache initialization with different presets
 * - Basic cache operations (get, set, invalidate)
 * - Advanced features (prefetch, batch operations)
 * - Performance monitoring and health checks
 * - Adaptive behavior under memory pressure
 * - Circuit breaker and recursion protection
 */

const { CacheManager, Config, SafetyUtils } = require('../src/index');
const fs = require('fs');
const path = require('path');

// Configuration examples
const configs = {
  highPerformance: {
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
  },
  
  lowMemory: {
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
  },
  
  balanced: {
    environment: 'webworker',
    preset: 'balanced'
  }
};

class CacheDemo {
  constructor() {
    this.cache = null;
    this.stats = {
      operations: 0,
      hits: 0,
      misses: 0,
      errors: 0
    };
  }

  async init(configType = 'balanced') {
    console.log(`\n🚀 Initializing Cache Money Bebe with ${configType} config...`);
    
    const config = new Config(configs[configType]);
    this.cache = new CacheManager(config);
    
    await this.cache.initialize();
    
    // Set up event listeners for monitoring
    this.cache.on('cache:hit', () => this.stats.hits++);
    this.cache.on('cache:miss', () => this.stats.misses++);
    this.cache.on('cache:error', () => this.stats.errors++);
    this.cache.on('memory:pressure', (level) => {
      console.log(`⚠️  Memory pressure detected: ${level}`);
    });
    this.cache.on('circuit:open', (key) => {
      console.log(`🔴 Circuit breaker opened for: ${key}`);
    });
    
    console.log('✅ Cache initialized successfully');
    return this;
  }

  async basicOperations() {
    console.log('\n📝 Running Basic Operations...');
    
    // Simple set and get
    await this.cache.set('user:123', {
      id: 123,
      name: 'John Doe',
      email: 'john@example.com',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    }, { ttl: 300000, tags: ['user', 'profile'] });
    
    const user = await this.cache.get('user:123');
    console.log('👤 Retrieved user:', user.name);
    this.stats.operations += 2;

    // Conditional operations
    const newData = { ...user, lastLogin: new Date().toISOString() };
    await this.cache.set('user:123', newData, { 
      ttl: 300000, 
      condition: 'nx' // Only if not exists
    });
    
    // Batch operations
    const batchData = {
      'product:456': { id: 456, name: 'Widget Pro', price: 99.99 },
      'product:789': { id: 789, name: 'Gadget Max', price: 149.99 },
      'category:electronics': { id: 1, name: 'Electronics', count: 1247 }
    };
    
    await this.cache.mset(batchData, { ttl: 600000 });
    const products = await this.cache.mget(['product:456', 'product:789']);
    console.log(`📦 Retrieved ${Object.keys(products).length} products`);
    this.stats.operations += 5;

    return this;
  }

  async advancedFeatures() {
    console.log('\n🔬 Demonstrating Advanced Features...');

    // Prefetch with fetch function
    await this.cache.prefetch([
      {
        key: 'weather:current',
        fetcher: async () => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: 'sunny',
            timestamp: Date.now()
          };
        }
      },
      {
        key: 'news:headlines',
        fetcher: async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
          return {
            headlines: [
              'Breaking: Cache performance improved by 300%',
              'New safety features prevent memory leaks',
              'Developers love the new adaptive configuration'
            ],
            timestamp: Date.now()
          };
        }
      }
    ]);

    // Get or fetch pattern
    const weather = await this.cache.getOrFetch('weather:current', async () => {
      console.log('🌤️  Fetching fresh weather data...');
      return { temperature: 25, condition: 'cloudy', timestamp: Date.now() };
    }, { ttl: 180000 });
    
    console.log(`🌡️  Current temperature: ${weather.temperature}°C`);

    // Pattern-based invalidation
    await this.cache.set('cache:stats:daily', { hits: 1500, misses: 200 });
    await this.cache.set('cache:stats:weekly', { hits: 12000, misses: 1800 });
    await this.cache.invalidate('cache:stats:*');
    console.log('🗑️  Invalidated all cache stats');

    this.stats.operations += 6;
    return this;
  }

  async performanceTesting() {
    console.log('\n⚡ Running Performance Tests...');

    const iterations = 1000;
    const concurrency = 10;
    
    console.log(`🏃‍♂️ Testing ${iterations} operations with ${concurrency} concurrent workers...`);
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(this.workerTask(i, Math.floor(iterations / concurrency)));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const opsPerSecond = Math.floor((iterations / duration) * 1000);
    
    console.log(`📊 Performance Results:`);
    console.log(`   Operations: ${iterations}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Throughput: ${opsPerSecond} ops/sec`);
    console.log(`   Avg Response Time: ${(duration / iterations).toFixed(2)}ms`);

    return this;
  }

  async workerTask(workerId, operations) {
    for (let i = 0; i < operations; i++) {
      const key = `worker:${workerId}:item:${i}`;
      const data = {
        workerId,
        itemId: i,
        timestamp: Date.now(),
        randomData: Math.random().toString(36).substring(7)
      };
      
      await this.cache.set(key, data, { ttl: 60000 });
      
      if (i % 3 === 0) {
        await this.cache.get(key);
      }
      
      this.stats.operations++;
    }
  }

  async stressTests() {
    console.log('\n💪 Running Stress Tests...');

    // Memory pressure simulation
    console.log('🧠 Testing memory pressure handling...');
    const largeData = Buffer.alloc(1024 * 1024).toString('base64'); // 1MB
    
    try {
      for (let i = 0; i < 100; i++) {
        await this.cache.set(`large:${i}`, { data: largeData }, { ttl: 300000 });
        
        if (i % 20 === 0) {
          const memUsage = process.memoryUsage();
          console.log(`   Memory usage: ${Math.floor(memUsage.heapUsed / 1024 / 1024)}MB`);
        }
      }
    } catch (error) {
      console.log(`   Memory protection activated: ${error.message}`);
    }

    // Recursion protection test
    console.log('🔄 Testing recursion protection...');
    let recursionDepth = 0;
    
    const recursiveFunction = async (depth) => {
      recursionDepth = Math.max(recursionDepth, depth);
      if (depth > 100) return { maxDepth: depth };
      
      return await this.cache.getOrFetch(`recursive:${depth}`, () => 
        recursiveFunction(depth + 1)
      );
    };
    
    try {
      await recursiveFunction(1);
    } catch (error) {
      console.log(`   Recursion guard activated at depth ${recursionDepth}: ${error.message}`);
    }

    // Circuit breaker test
    console.log('⚡ Testing circuit breaker...');
    let failureCount = 0;
    
    for (let i = 0; i < 15; i++) {
      try {
        await this.cache.getOrFetch(`failing:${i}`, async () => {
          if (Math.random() > 0.3) {
            throw new Error('Simulated failure');
          }
          return { success: true, attempt: i };
        });
      } catch (error) {
        failureCount++;
      }
    }
    
    console.log(`   Circuit breaker handled ${failureCount} failures`);
    
    return this;
  }

  async monitoringAndHealth() {
    console.log('\n📊 Cache Monitoring & Health Check...');

    const health = await this.cache.getHealth();
    console.log(`🏥 Health Status: ${health.status}`);
    console.log(`   Uptime: ${Math.floor(health.uptime / 1000)}s`);
    console.log(`   Memory Usage: ${Math.floor(health.memoryUsage / 1024 / 1024)}MB`);
    console.log(`   Cache Efficiency: ${(health.cacheEfficiency * 100).toFixed(1)}%`);

    const stats = await this.cache.getStats();
    console.log(`📈 Performance Stats:`);
    console.log(`   Total Operations: ${this.stats.operations}`);
    console.log(`   Cache Hits: ${stats.hits}`);
    console.log(`   Cache Misses: ${stats.misses}`);
    console.log(`   Hit Ratio: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`);
    console.log(`   Avg Response Time: ${stats.avgResponseTime.toFixed(2)}ms`);
    
    if (stats.circuitBreakerTrips > 0) {
      console.log(`   Circuit Breaker Trips: ${stats.circuitBreakerTrips}`);
    }
    
    if (stats.recursionGuardActivations > 0) {
      console.log(`   Recursion Guard Activations: ${stats.recursionGuardActivations}`);
    }

    return this;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.cache) {
      await this.cache.clear();
      await this.cache.shutdown();
      console.log('✅ Cache cleaned up successfully');
    }
  }

  async exportResults() {
    console.log('\n📄 Exporting test results...');
    
    const results = {
      timestamp: new Date().toISOString(),
      configuration: this.cache?.config?.getAll() || {},
      performance: await this.cache?.getStats() || {},
      health: await this.cache?.getHealth() || {},
      testStats: this.stats
    };
    
    const resultsPath = path.join(__dirname, '..', 'test-results', 
      `cache-demo-${Date.now()}.json`);
    
    // Ensure directory exists
    const dir = path.dirname(resultsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📋 Results exported to: ${resultsPath}`);
    
    return results;
  }
}

// Main execution
async function main() {
  console.log('💰 Cache Money Bebe - Comprehensive Demo\n');
  console.log('This demo showcases the core features and capabilities of cache-money-bebe:');
  console.log('• High-performance caching with multiple strategies');
  console.log('• Adaptive behavior under different conditions');
  console.log('• Safety mechanisms and error handling');
  console.log('• Performance monitoring and health checks');
  console.log('• Stress testing and reliability validation\n');

  const demo = new CacheDemo();
  
  try {
    await demo.init('balanced')
      .then(d => d.basicOperations())
      .then(d => d.advancedFeatures())
      .then(d => d.performanceTesting())
      .then(d => d.stressTests())
      .then(d => d.monitoringAndHealth())
      .then(d => d.exportResults());

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nNext Steps:');
    console.log('• Try different configuration presets');
    console.log('• Integrate with your application');
    console.log('• Run performance benchmarks');
    console.log('• Explore advanced features in the documentation');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await demo.cleanup();
  }
}

// CLI support
if (require.main === module) {
  const configType = process.argv[2] || 'balanced';
  
  if (!configs[configType]) {
    console.error(`❌ Unknown config type: ${configType}`);
    console.log(`Available configs: ${Object.keys(configs).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🎯 Running demo with ${configType} configuration...\n`);
  
  // Override config for CLI
  const demo = new CacheDemo();
  demo.init(configType).then(() => main()).catch(console.error);
} else {
  module.exports = { CacheDemo, configs };
}