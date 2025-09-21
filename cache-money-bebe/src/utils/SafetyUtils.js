/**
 * Core Safety Utilities for cache-money-bebe
 * Provides recursion guards, circuit breakers, and other safety mechanisms
 */

/**
 * Recursion Guard - Prevents infinite loops and stack overflows
 */
export class RecursionGuard {
  constructor(maxDepth = 10) {
    this.callStack = new Map();
    this.maxDepth = maxDepth;
    this.activeKeys = new Set();
  }

  /**
   * Check if a key is currently being processed (immediate recursion)
   * @param {string} key - Operation key
   */
  isRecurring(key) {
    return this.activeKeys.has(key);
  }

  /**
   * Execute function with recursion protection
   * @param {string} key - Unique operation key
   * @param {Function} fn - Function to execute
   * @returns {Promise<*>} Function result
   */
  async guard(key, fn) {
    const depth = (this.callStack.get(key) || 0) + 1;

    if (depth > this.maxDepth) {
      throw new Error(`Recursion limit exceeded for ${key} at depth ${depth}`);
    }

    if (this.activeKeys.has(key)) {
      throw new Error(`Recursive call blocked for ${key}`);
    }

    this.callStack.set(key, depth);
    this.activeKeys.add(key);

    try {
      const result = await fn();
      return result;
    } finally {
      this.activeKeys.delete(key);
      this.callStack.set(key, depth - 1);
      if (depth === 1) {
        this.callStack.delete(key);
      }
    }
  }

  /**
   * Get current recursion depth for a key
   * @param {string} key - Operation key
   */
  getDepth(key) {
    return this.callStack.get(key) || 0;
  }

  /**
   * Reset all recursion tracking
   */
  reset() {
    this.callStack.clear();
    this.activeKeys.clear();
  }
}

/**
 * Circuit Breaker - Prevents cascade failures
 */
export class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000, monitorWindow = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.monitorWindow = monitorWindow;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    this.successCount = 0;
    this.recentFailures = [];
  }

  /**
   * Execute function with circuit breaker protection
   * @param {Function} fn - Function to execute
   * @param {string} key - Operation key for logging
   */
  async execute(fn, key = 'default') {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker is OPEN for ${key}`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    const now = Date.now();
    this.failures++;
    this.lastFailureTime = now;
    this.recentFailures.push(now);

    // Clean old failures outside monitor window
    this.recentFailures = this.recentFailures.filter(
      time => now - time < this.monitorWindow
    );

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = now + this.timeout;
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      recentFailures: this.recentFailures.length,
      nextAttemptTime: this.nextAttemptTime,
      isHealthy: this.state === 'CLOSED'
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successCount = 0;
    this.recentFailures = [];
  }
}

/**
 * Request Deduplicator - Prevents duplicate operations
 */
export class RequestDeduplicator {
  constructor(defaultTTL = 10000) {
    this.pendingRequests = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Deduplicate async operations by key
   * @param {string} key - Unique operation key
   * @param {Function} fn - Function to execute
   * @param {number} ttl - Time to live for deduplication
   */
  async dedupe(key, fn, ttl = this.defaultTTL) {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      const existing = this.pendingRequests.get(key);
      if (Date.now() < existing.expiry) {
        return existing.promise;
      }
      // Expired, remove it
      this.pendingRequests.delete(key);
    }

    // Create new request
    const promise = fn();
    const expiry = Date.now() + ttl;
    
    this.pendingRequests.set(key, { promise, expiry });

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up completed request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Check if a request is currently pending
   * @param {string} key - Operation key
   */
  isPending(key) {
    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() < pending.expiry) {
      return true;
    }
    if (pending) {
      this.pendingRequests.delete(key); // Clean expired
    }
    return false;
  }

  /**
   * Get pending requests count
   */
  getPendingCount() {
    // Clean expired requests first
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now >= request.expiry) {
        this.pendingRequests.delete(key);
      }
    }
    return this.pendingRequests.size;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }
}

/**
 * Memory Pressure Monitor - Tracks memory usage and triggers cleanup
 */
export class MemoryPressureMonitor {
  constructor() {
    this.thresholds = {
      warning: 0.7,    // 70%
      critical: 0.85,  // 85%
      emergency: 0.95  // 95%
    };
    this.listeners = [];
    this.isMonitoring = false;
    this.monitorInterval = null;
  }

  /**
   * Get current memory usage (0-1 scale)
   */
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    
    // Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      // Estimate based on heap usage (rough approximation)
      return usage.heapUsed / (usage.heapTotal * 2);
    }
    
    return 0; // Cannot determine
  }

  /**
   * Check current memory usage and emit events if needed
   */
  check() {
    const usage = this.getMemoryUsage();

    if (usage > this.thresholds.emergency) {
      this.emit('emergency', usage);
    } else if (usage > this.thresholds.critical) {
      this.emit('critical', usage);
    } else if (usage > this.thresholds.warning) {
      this.emit('warning', usage);
    }

    return usage;
  }

  /**
   * Add memory pressure listener
   * @param {Function} callback - Callback function (level, usage) => void
   */
  onPressure(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.listeners.push(callback);

    // Auto-start monitoring if not already running
    if (!this.isMonitoring) {
      this.startMonitoring();
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Start continuous memory monitoring
   * @param {number} interval - Check interval in ms
   */
  startMonitoring(interval = 5000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitorInterval = setInterval(() => {
      this.check();
    }, interval);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Emit memory pressure event to all listeners
   */
  emit(level, usage) {
    this.listeners.forEach(callback => {
      try {
        callback(level, usage);
      } catch (error) {
        console.error('Memory pressure callback failed:', error);
      }
    });
  }

  /**
   * Clean up and stop monitoring
   */
  destroy() {
    this.stopMonitoring();
    this.listeners = [];
  }
}

/**
 * Timer Manager - Centralized timer management to prevent leaks
 */
export class TimerManager {
  constructor() {
    this.timers = new Map();
    this.intervals = new Map();
  }

  /**
   * Set a managed timeout
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @param {string} id - Unique identifier
   */
  setTimeout(callback, delay, id) {
    // Clear existing timer with same ID
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
    }

    const timerId = setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);

    this.timers.set(id, timerId);
    return timerId;
  }

  /**
   * Set a managed interval
   * @param {Function} callback - Function to execute
   * @param {number} interval - Interval in milliseconds
   * @param {string} id - Unique identifier
   */
  setInterval(callback, interval, id) {
    // Clear existing interval with same ID
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
    }

    const intervalId = setInterval(callback, interval);
    this.intervals.set(id, intervalId);
    return intervalId;
  }

  /**
   * Clear a specific timeout
   * @param {string} id - Timer identifier
   */
  clearTimeout(id) {
    const timerId = this.timers.get(id);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(id);
    }
  }

  /**
   * Clear a specific interval
   * @param {string} id - Interval identifier
   */
  clearInterval(id) {
    const intervalId = this.intervals.get(id);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(id);
    }
  }

  /**
   * Clear all timers and intervals
   */
  clearAll() {
    // Clear all timeouts
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }

    // Clear all intervals
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }

    this.timers.clear();
    this.intervals.clear();
  }

  /**
   * Get timer statistics
   */
  getStats() {
    return {
      activeTimeouts: this.timers.size,
      activeIntervals: this.intervals.size,
      total: this.timers.size + this.intervals.size
    };
  }

  /**
   * Clean up all timers
   */
  destroy() {
    this.clearAll();
  }
}

/**
 * Timeout Manager - Adds timeout protection to promises
 */
export class TimeoutManager {
  /**
   * Add timeout to a promise
   * @param {Promise} promise - Promise to timeout
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} operation - Operation name for error messages
   */
  static withTimeout(promise, timeout, operation = 'operation') {
    const timeoutPromise = new Promise((_, reject) => {
      const id = setTimeout(() => {
        reject(new Error(`${operation} timeout after ${timeout}ms`));
      }, timeout);
      
      // Clear timeout when original promise resolves/rejects
      promise.finally(() => clearTimeout(id));
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Create a timeout wrapper function
   * @param {number} defaultTimeout - Default timeout in ms
   */
  static createWrapper(defaultTimeout = 10000) {
    return (promise, timeout = defaultTimeout, operation = 'operation') => {
      return TimeoutManager.withTimeout(promise, timeout, operation);
    };
  }
}

/**
 * Adaptive Configuration Manager - Adjusts settings based on performance
 */
export class AdaptiveConfig {
  constructor(baseConfig) {
    this.config = { ...baseConfig };
    this.baseConfig = { ...baseConfig };
    this.adaptationHistory = [];
    this.memoryMonitor = new MemoryPressureMonitor();
    
    // Setup automatic adaptation
    this.memoryMonitor.onPressure((level, usage) => {
      this.adaptToMemoryPressure(level, usage);
    });
  }

  /**
   * Get current configuration
   */
  get() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  update(updates) {
    Object.assign(this.config, updates);
    this.recordAdaptation('manual', updates);
  }

  /**
   * Adapt configuration based on memory pressure
   * @param {string} level - Pressure level (warning, critical, emergency)
   * @param {number} usage - Memory usage (0-1)
   */
  adaptToMemoryPressure(level, usage) {
    const adaptations = {};

    switch (level) {
      case 'warning':
        adaptations.maxCacheSize = Math.floor(this.config.maxCacheSize * 0.9);
        adaptations.prefetchDistance = Math.max(1, this.config.prefetchDistance - 1);
        break;
        
      case 'critical':
        adaptations.maxCacheSize = Math.floor(this.config.maxCacheSize * 0.7);
        adaptations.prefetchDistance = 1;
        adaptations.cacheWindowWidth = Math.floor(this.config.cacheWindowWidth * 0.8);
        break;
        
      case 'emergency':
        adaptations.maxCacheSize = Math.floor(this.config.maxCacheSize * 0.5);
        adaptations.prefetchDistance = 0;
        adaptations.cacheWindowWidth = Math.floor(this.config.cacheWindowWidth * 0.6);
        adaptations.batchSize = 1;
        break;
    }

    Object.assign(this.config, adaptations);
    this.recordAdaptation(`memory_${level}`, adaptations);
  }

  /**
   * Reset configuration to base values
   */
  reset() {
    this.config = { ...this.baseConfig };
    this.recordAdaptation('reset', this.config);
  }

  /**
   * Record adaptation for analysis
   * @param {string} reason - Reason for adaptation
   * @param {Object} changes - Configuration changes
   */
  recordAdaptation(reason, changes) {
    this.adaptationHistory.push({
      timestamp: Date.now(),
      reason,
      changes,
      memoryUsage: this.memoryMonitor.getMemoryUsage()
    });

    // Keep only last 50 adaptations
    if (this.adaptationHistory.length > 50) {
      this.adaptationHistory = this.adaptationHistory.slice(-50);
    }
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory() {
    return [...this.adaptationHistory];
  }

  /**
   * Clean up
   */
  destroy() {
    this.memoryMonitor.destroy();
  }
}