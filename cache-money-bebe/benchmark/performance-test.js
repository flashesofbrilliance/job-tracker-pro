#!/usr/bin/env node

/**
 * 💰 Cache Money Bebe - Performance Benchmark Suite
 * 
 * Comprehensive performance testing and benchmarking for cache-money-bebe.
 * Tests various scenarios including:
 * - Throughput and latency benchmarks
 * - Memory efficiency tests
 * - Scalability analysis
 * - Comparative performance across configurations
 * - Real-world usage simulation
 */

const { performance } = require('perf_hooks');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { CacheManager, Config } = require('../src/index');

// Benchmark configurations
const BENCHMARK_CONFIGS = {
  micro: {
    operations: 1000,
    concurrency: 5,
    duration: 10000,
    dataSize: 100
  },
  standard: {
    operations: 10000,
    concurrency: 25,
    duration: 30000,
    dataSize: 1024
  },
  intensive: {
    operations: 100000,
    concurrency: 100,
    duration: 60000,
    dataSize: 4096
  },
  stress: {
    operations: 500000,
    concurrency: 200,
    duration: 120000,
    dataSize: 8192
  }
};

class PerformanceBenchmark {
  constructor(config = 'standard') {
    this.config = BENCHMARK_CONFIGS[config];
    this.results = {
      systemInfo: this.getSystemInfo(),
      startTime: null,
      endTime: null,
      scenarios: {}
    };
    this.cacheInstances = new Map();
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.floor(os.totalmem() / 1024 / 1024),
      freeMemory: Math.floor(os.freemem() / 1024 / 1024),
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    };
  }

  async initializeCache(configName, cacheConfig) {
    console.log(`🚀 Initializing cache: ${configName}`);
    const config = new Config(cacheConfig);
    const cache = new CacheManager(config);
    await cache.initialize();
    
    this.cacheInstances.set(configName, cache);
    return cache;
  }

  generateTestData(size) {
    const data = {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: Date.now(),
      payload: 'x'.repeat(size - 100), // Approximate size accounting for other fields
      metadata: {
        version: '1.0',
        type: 'benchmark',
        checksum: Math.random().toString(36).substring(2, 10)
      }
    };
    return data;
  }

  async runThroughputTest(cache, name) {
    console.log(`⚡ Running throughput test: ${name}`);
    
    const { operations, concurrency, dataSize } = this.config;
    const operationsPerWorker = Math.floor(operations / concurrency);
    
    const startTime = performance.now();
    const memBefore = process.memoryUsage();
    
    const workers = Array.from({ length: concurrency }, (_, i) => 
      this.throughputWorker(cache, i, operationsPerWorker, dataSize)
    );
    
    const workerResults = await Promise.all(workers);
    
    const endTime = performance.now();
    const memAfter = process.memoryUsage();
    
    const totalOps = workerResults.reduce((sum, w) => sum + w.operations, 0);
    const totalErrors = workerResults.reduce((sum, w) => sum + w.errors, 0);
    const avgLatency = workerResults.reduce((sum, w) => sum + w.avgLatency, 0) / concurrency;
    
    const duration = endTime - startTime;
    const throughput = Math.floor((totalOps / duration) * 1000);
    
    return {
      name,
      duration,
      operations: totalOps,
      throughput,
      avgLatency,
      errors: totalErrors,
      errorRate: totalErrors / totalOps,
      memoryDelta: {
        heap: memAfter.heapUsed - memBefore.heapUsed,
        external: memAfter.external - memBefore.external
      },
      workers: workerResults.length
    };
  }

  async throughputWorker(cache, workerId, operations, dataSize) {
    const results = {
      workerId,
      operations: 0,
      errors: 0,
      latencies: []
    };
    
    for (let i = 0; i < operations; i++) {
      try {
        const key = `worker:${workerId}:op:${i}`;
        const data = this.generateTestData(dataSize);
        
        const start = performance.now();
        
        // Mix of operations: 60% gets, 30% sets, 10% invalidations
        const rand = Math.random();
        if (rand < 0.6 && i > operations * 0.1) {
          // Get operation (only after some initial sets)
          const getKey = `worker:${workerId}:op:${Math.floor(Math.random() * i)}`;
          await cache.get(getKey);
        } else if (rand < 0.9) {
          // Set operation
          await cache.set(key, data, { ttl: 300000 });
        } else {
          // Invalidation operation
          const pattern = `worker:${workerId}:op:${Math.floor(i / 10) * 10}*`;
          await cache.invalidate(pattern);
        }
        
        const end = performance.now();
        results.latencies.push(end - start);
        results.operations++;
        
      } catch (error) {
        results.errors++;
      }
    }
    
    results.avgLatency = results.latencies.reduce((a, b) => a + b, 0) / results.latencies.length;
    results.p95Latency = results.latencies.sort((a, b) => a - b)[Math.floor(results.latencies.length * 0.95)];
    
    return results;
  }

  async runLatencyTest(cache, name) {
    console.log(`📊 Running latency test: ${name}`);
    
    const operations = 1000;
    const latencies = [];
    const data = this.generateTestData(this.config.dataSize);
    
    // Warm up
    for (let i = 0; i < 100; i++) {
      await cache.set(`warmup:${i}`, data);
    }
    
    // Measure latencies
    for (let i = 0; i < operations; i++) {
      const key = `latency:${i}`;
      
      // Set operation
      const setStart = performance.now();
      await cache.set(key, data, { ttl: 300000 });
      const setEnd = performance.now();
      latencies.push({ operation: 'set', latency: setEnd - setStart });
      
      // Get operation
      const getStart = performance.now();
      await cache.get(key);
      const getEnd = performance.now();
      latencies.push({ operation: 'get', latency: getEnd - getStart });
    }
    
    const setLatencies = latencies.filter(l => l.operation === 'set').map(l => l.latency);
    const getLatencies = latencies.filter(l => l.operation === 'get').map(l => l.latency);
    
    const percentile = (arr, p) => {
      const sorted = arr.sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[index];
    };
    
    return {
      name,
      operations: operations * 2,
      set: {
        avg: setLatencies.reduce((a, b) => a + b, 0) / setLatencies.length,
        p50: percentile(setLatencies, 50),
        p95: percentile(setLatencies, 95),
        p99: percentile(setLatencies, 99),
        max: Math.max(...setLatencies)
      },
      get: {
        avg: getLatencies.reduce((a, b) => a + b, 0) / getLatencies.length,
        p50: percentile(getLatencies, 50),
        p95: percentile(getLatencies, 95),
        p99: percentile(getLatencies, 99),
        max: Math.max(...getLatencies)
      }
    };
  }

  async runMemoryEfficiencyTest(cache, name) {
    console.log(`🧠 Running memory efficiency test: ${name}`);
    
    const measurements = [];
    const baseMemory = process.memoryUsage();
    
    // Insert data in batches and measure memory usage
    const batchSize = 1000;
    const batches = 10;
    
    for (let batch = 0; batch < batches; batch++) {
      // Insert batch
      for (let i = 0; i < batchSize; i++) {
        const key = `memory:batch:${batch}:item:${i}`;
        const data = this.generateTestData(this.config.dataSize);
        await cache.set(key, data, { ttl: 600000 });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Measure memory
      const currentMemory = process.memoryUsage();
      measurements.push({
        batch,
        itemsStored: (batch + 1) * batchSize,
        heapUsed: currentMemory.heapUsed,
        heapTotal: currentMemory.heapTotal,
        external: currentMemory.external,
        heapDelta: currentMemory.heapUsed - baseMemory.heapUsed
      });
      
      await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
    }
    
    const totalItems = batches * batchSize;
    const totalMemoryIncrease = measurements[measurements.length - 1].heapDelta;
    const memoryPerItem = totalMemoryIncrease / totalItems;
    
    return {
      name,
      totalItems,
      totalMemoryIncrease,
      memoryPerItem,
      measurements
    };
  }

  async runCacheEfficiencyTest(cache, name) {
    console.log(`🎯 Running cache efficiency test: ${name}`);
    
    const operations = 5000;
    let hits = 0;
    let misses = 0;
    
    // Populate cache with initial data
    const initialKeys = [];
    for (let i = 0; i < 1000; i++) {
      const key = `efficiency:${i}`;
      const data = this.generateTestData(this.config.dataSize);
      await cache.set(key, data, { ttl: 300000 });
      initialKeys.push(key);
    }
    
    // Run mixed operations with cache hit/miss tracking
    for (let i = 0; i < operations; i++) {
      const rand = Math.random();
      
      if (rand < 0.7) {
        // 70% chance of hitting existing keys
        const key = initialKeys[Math.floor(Math.random() * initialKeys.length)];
        const result = await cache.get(key);
        if (result !== null) hits++;
        else misses++;
      } else {
        // 30% chance of missing keys
        const key = `efficiency:new:${i}`;
        const result = await cache.get(key);
        if (result !== null) hits++;
        else misses++;
      }
    }
    
    const hitRate = hits / (hits + misses);
    
    return {
      name,
      operations,
      hits,
      misses,
      hitRate,
      efficiency: hitRate > 0.6 ? 'excellent' : hitRate > 0.4 ? 'good' : 'poor'
    };
  }

  async runScalabilityTest(cache, name) {
    console.log(`📈 Running scalability test: ${name}`);
    
    const concurrencyLevels = [1, 5, 10, 25, 50];
    const operationsPerLevel = 1000;
    const results = [];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`   Testing concurrency level: ${concurrency}`);
      
      const operationsPerWorker = Math.floor(operationsPerLevel / concurrency);
      const startTime = performance.now();
      
      const workers = Array.from({ length: concurrency }, (_, i) => 
        this.scalabilityWorker(cache, i, operationsPerWorker)
      );
      
      const workerResults = await Promise.all(workers);
      const endTime = performance.now();
      
      const totalOps = workerResults.reduce((sum, w) => sum + w.operations, 0);
      const totalErrors = workerResults.reduce((sum, w) => sum + w.errors, 0);
      const duration = endTime - startTime;
      const throughput = Math.floor((totalOps / duration) * 1000);
      
      results.push({
        concurrency,
        operations: totalOps,
        duration,
        throughput,
        errors: totalErrors,
        errorRate: totalErrors / totalOps
      });
    }
    
    return {
      name,
      results,
      scalabilityScore: this.calculateScalabilityScore(results)
    };
  }

  async scalabilityWorker(cache, workerId, operations) {
    const results = { workerId, operations: 0, errors: 0 };
    
    for (let i = 0; i < operations; i++) {
      try {
        const key = `scale:${workerId}:${i}`;
        const data = this.generateTestData(512); // Smaller data for scalability test
        
        if (Math.random() < 0.8) {
          await cache.set(key, data, { ttl: 180000 });
        } else {
          await cache.get(key);
        }
        
        results.operations++;
      } catch (error) {
        results.errors++;
      }
    }
    
    return results;
  }

  calculateScalabilityScore(results) {
    // Calculate how well performance scales with concurrency
    const baselineThroughput = results[0].throughput;
    let score = 0;
    
    for (let i = 1; i < results.length; i++) {
      const expectedThroughput = baselineThroughput * results[i].concurrency;
      const actualThroughput = results[i].throughput;
      const efficiency = actualThroughput / expectedThroughput;
      score += efficiency;
    }
    
    return score / (results.length - 1);
  }

  async runComparisonTest() {
    console.log('\n🔄 Running configuration comparison tests...');
    
    const configs = {
      'High Performance': {
        preset: 'high-performance',
        revolvingDoor: { maxLocalCacheSize: 200, conveyorBeltCycle: 1000 },
        payloadCache: { compressionEnabled: true }
      },
      'Low Memory': {
        preset: 'low-memory',
        revolvingDoor: { maxLocalCacheSize: 50, conveyorBeltCycle: 3000 },
        memoryPressure: { enabled: true, threshold: 0.7 }
      },
      'Balanced': {
        preset: 'balanced'
      }
    };
    
    const comparisonResults = {};
    
    for (const [configName, config] of Object.entries(configs)) {
      console.log(`\n📊 Testing configuration: ${configName}`);
      
      const cache = await this.initializeCache(configName, config);
      
      const results = {
        throughput: await this.runThroughputTest(cache, `${configName} Throughput`),
        latency: await this.runLatencyTest(cache, `${configName} Latency`),
        memory: await this.runMemoryEfficiencyTest(cache, `${configName} Memory`),
        efficiency: await this.runCacheEfficiencyTest(cache, `${configName} Efficiency`)
      };
      
      comparisonResults[configName] = results;
      
      // Cleanup
      await cache.clear();
    }
    
    return comparisonResults;
  }

  async runBenchmarkSuite() {
    console.log('💰 Cache Money Bebe - Performance Benchmark Suite\n');
    console.log(`Benchmark Configuration: ${JSON.stringify(this.config, null, 2)}\n`);
    
    this.results.startTime = Date.now();
    
    try {
      // Run comparison tests
      this.results.scenarios = await this.runComparisonTest();
      
      // Generate summary
      this.results.summary = this.generateSummary();
      
      this.results.endTime = Date.now();
      this.results.totalDuration = this.results.endTime - this.results.startTime;
      
      console.log('\n✅ Benchmark suite completed successfully!');
      
      return this.results;
      
    } catch (error) {
      console.error('\n❌ Benchmark failed:', error);
      throw error;
    } finally {
      // Cleanup all cache instances
      for (const [name, cache] of this.cacheInstances) {
        try {
          await cache.shutdown();
        } catch (error) {
          console.warn(`Warning: Failed to shutdown cache ${name}:`, error.message);
        }
      }
    }
  }

  generateSummary() {
    const summary = {
      bestThroughput: { config: '', value: 0 },
      bestLatency: { config: '', value: Infinity },
      bestMemoryEfficiency: { config: '', value: Infinity },
      bestCacheHitRate: { config: '', value: 0 },
      recommendations: []
    };
    
    for (const [configName, results] of Object.entries(this.results.scenarios)) {
      // Throughput comparison
      if (results.throughput.throughput > summary.bestThroughput.value) {
        summary.bestThroughput = { config: configName, value: results.throughput.throughput };
      }
      
      // Latency comparison (lower is better)
      if (results.latency.get.avg < summary.bestLatency.value) {
        summary.bestLatency = { config: configName, value: results.latency.get.avg };
      }
      
      // Memory efficiency comparison (lower is better)
      if (results.memory.memoryPerItem < summary.bestMemoryEfficiency.value) {
        summary.bestMemoryEfficiency = { config: configName, value: results.memory.memoryPerItem };
      }
      
      // Cache hit rate comparison
      if (results.efficiency.hitRate > summary.bestCacheHitRate.value) {
        summary.bestCacheHitRate = { config: configName, value: results.efficiency.hitRate };
      }
    }
    
    // Generate recommendations
    if (summary.bestThroughput.config === summary.bestLatency.config) {
      summary.recommendations.push(
        `${summary.bestThroughput.config} offers the best overall performance (throughput + latency)`
      );
    } else {
      summary.recommendations.push(
        `For high throughput: ${summary.bestThroughput.config} (${summary.bestThroughput.value} ops/sec)`
      );
      summary.recommendations.push(
        `For low latency: ${summary.bestLatency.config} (${summary.bestLatency.value.toFixed(2)}ms avg)`
      );
    }
    
    summary.recommendations.push(
      `For memory efficiency: ${summary.bestMemoryEfficiency.config} (${(summary.bestMemoryEfficiency.value / 1024).toFixed(2)} KB/item)`
    );
    
    summary.recommendations.push(
      `For cache hit rate: ${summary.bestCacheHitRate.config} (${(summary.bestCacheHitRate.value * 100).toFixed(1)}%)`
    );
    
    return summary;
  }

  async exportResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `benchmark-results-${timestamp}.json`;
    const filepath = path.join(__dirname, '..', 'test-results', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write detailed results
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    
    // Generate and write summary report
    const summaryPath = path.join(dir, `benchmark-summary-${timestamp}.md`);
    const summaryReport = this.generateMarkdownReport();
    fs.writeFileSync(summaryPath, summaryReport);
    
    console.log(`\n📋 Results exported to: ${filepath}`);
    console.log(`📄 Summary report: ${summaryPath}`);
    
    return { resultsFile: filepath, summaryFile: summaryPath };
  }

  generateMarkdownReport() {
    const { summary, systemInfo } = this.results;
    
    return `
# 💰 Cache Money Bebe - Performance Benchmark Report

**Generated:** ${new Date().toISOString()}

## System Information

- **Platform:** ${systemInfo.platform} ${systemInfo.arch}
- **CPUs:** ${systemInfo.cpus}
- **Total Memory:** ${systemInfo.totalMemory} MB
- **Node.js Version:** ${systemInfo.nodeVersion}

## Benchmark Configuration

- **Operations:** ${this.config.operations.toLocaleString()}
- **Concurrency:** ${this.config.concurrency}
- **Duration:** ${this.config.duration}ms
- **Data Size:** ${this.config.dataSize} bytes

## Results Summary

### 🏆 Best Performers

- **Throughput:** ${summary.bestThroughput.config} (${summary.bestThroughput.value.toLocaleString()} ops/sec)
- **Latency:** ${summary.bestLatency.config} (${summary.bestLatency.value.toFixed(2)}ms avg)
- **Memory Efficiency:** ${summary.bestMemoryEfficiency.config} (${(summary.bestMemoryEfficiency.value / 1024).toFixed(2)} KB/item)
- **Cache Hit Rate:** ${summary.bestCacheHitRate.config} (${(summary.bestCacheHitRate.value * 100).toFixed(1)}%)

### 📊 Detailed Results

${Object.entries(this.results.scenarios).map(([configName, results]) => `
#### ${configName}

**Throughput Test:**
- Operations: ${results.throughput.operations.toLocaleString()}
- Throughput: ${results.throughput.throughput.toLocaleString()} ops/sec
- Average Latency: ${results.throughput.avgLatency.toFixed(2)}ms
- Error Rate: ${(results.throughput.errorRate * 100).toFixed(3)}%

**Latency Test:**
- GET Average: ${results.latency.get.avg.toFixed(2)}ms
- GET P95: ${results.latency.get.p95.toFixed(2)}ms
- SET Average: ${results.latency.set.avg.toFixed(2)}ms
- SET P95: ${results.latency.set.p95.toFixed(2)}ms

**Memory Efficiency:**
- Items Stored: ${results.memory.totalItems.toLocaleString()}
- Memory Per Item: ${(results.memory.memoryPerItem / 1024).toFixed(2)} KB
- Total Memory Increase: ${(results.memory.totalMemoryIncrease / 1024 / 1024).toFixed(2)} MB

**Cache Efficiency:**
- Hit Rate: ${(results.efficiency.hitRate * 100).toFixed(1)}%
- Efficiency Rating: ${results.efficiency.efficiency}
`).join('')}

### 🎯 Recommendations

${summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Performance Analysis

This benchmark demonstrates the performance characteristics of different cache-money-bebe configurations under various workloads. The results can help you choose the optimal configuration for your specific use case.

---

*Generated by cache-money-bebe performance benchmark suite*
`;
  }

  printSummary() {
    const { summary } = this.results;
    
    console.log('\n🏆 Benchmark Summary:');
    console.log('====================');
    console.log(`Best Throughput: ${summary.bestThroughput.config} (${summary.bestThroughput.value.toLocaleString()} ops/sec)`);
    console.log(`Best Latency: ${summary.bestLatency.config} (${summary.bestLatency.value.toFixed(2)}ms)`);
    console.log(`Best Memory Efficiency: ${summary.bestMemoryEfficiency.config} (${(summary.bestMemoryEfficiency.value / 1024).toFixed(2)} KB/item)`);
    console.log(`Best Cache Hit Rate: ${summary.bestCacheHitRate.config} (${(summary.bestCacheHitRate.value * 100).toFixed(1)}%)`);
    
    console.log('\n🎯 Recommendations:');
    summary.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }
}

// Main execution
async function main() {
  const benchmarkType = process.argv[2] || 'standard';
  
  if (!BENCHMARK_CONFIGS[benchmarkType]) {
    console.error(`❌ Unknown benchmark type: ${benchmarkType}`);
    console.log(`Available types: ${Object.keys(BENCHMARK_CONFIGS).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🎯 Running ${benchmarkType} benchmark...\n`);
  
  const benchmark = new PerformanceBenchmark(benchmarkType);
  
  try {
    const results = await benchmark.runBenchmarkSuite();
    benchmark.printSummary();
    await benchmark.exportResults();
    
    console.log('\n🎉 Benchmark completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = { PerformanceBenchmark, BENCHMARK_CONFIGS };
}