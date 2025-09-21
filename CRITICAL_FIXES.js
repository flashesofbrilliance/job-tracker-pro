/**
 * CRITICAL RECURSION BUG FIXES
 * Apply these patches immediately to prevent infinite loops and stack overflows
 */

// 1. RECURSION GUARD - Universal protection mechanism
class RecursionGuard {
  constructor(maxDepth = 10) {
    this.callStack = new Map();
    this.maxDepth = maxDepth;
    this.activeKeys = new Set();
  }
  
  isRecurring(key) {
    return this.activeKeys.has(key);
  }
  
  async guard(key, asyncFn) {
    const depth = (this.callStack.get(key) || 0) + 1;
    
    if (depth > this.maxDepth) {
      console.error(`🚨 RECURSION LIMIT EXCEEDED for ${key} at depth ${depth}`);
      throw new Error(`Recursion limit exceeded for ${key}`);
    }
    
    if (this.activeKeys.has(key)) {
      console.warn(`⚠️ RECURSIVE CALL DETECTED for ${key}, returning cached promise`);
      // Return a rejection to break the cycle
      return Promise.reject(new Error(`Recursive call blocked for ${key}`));
    }
    
    this.callStack.set(key, depth);
    this.activeKeys.add(key);
    
    try {
      const result = await asyncFn();
      return result;
    } finally {
      this.activeKeys.delete(key);
      this.callStack.set(key, depth - 1);
      if (depth === 1) {
        this.callStack.delete(key); // Clean up root calls
      }
    }
  }
}

// 2. CIRCUIT BREAKER - Prevent cascade failures
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
  }
  
  async execute(fn, key = 'default') {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker HALF_OPEN for ${key}`);
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
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.timeout;
      console.error(`🚨 Circuit breaker OPENED: ${this.failures} failures`);
    }
  }
}

// 3. FIXES FOR CACHE-INTEGRATION-LAYER.JS
const cacheIntegrationFixes = {
  // Add recursion protection to handleJobRequest
  patchHandleJobRequest(originalMethod) {
    const recursionGuard = new RecursionGuard(5);
    const circuitBreaker = new CircuitBreaker(3, 10000);
    
    return async function(requestDetail) {
      const { jobId } = requestDetail;
      const requestKey = `job_request_${jobId}`;
      
      return recursionGuard.guard(requestKey, async () => {
        return circuitBreaker.execute(async () => {
          return originalMethod.call(this, requestDetail);
        }, requestKey);
      });
    };
  },
  
  // Safe fetchJobFromAPI that won't trigger events
  createSafeFetchJobFromAPI() {
    const circuitBreaker = new CircuitBreaker(5, 15000);
    
    return async function(jobId) {
      return circuitBreaker.execute(async () => {
        // Direct fetch without triggering cache events
        const response = await fetch(`/api/jobs/${jobId}?direct=true`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      }, `fetch_job_${jobId}`);
    };
  }
};

// 4. FIXES FOR REVOLVING-DOOR-CACHE.JS
const revolvingDoorFixes = {
  // Add timeout and recursion protection to getResource
  patchGetResource(originalMethod) {
    const recursionGuard = new RecursionGuard(8);
    const requestTimeouts = new Map();
    
    return async function(resourceKey, fetchFn) {
      return recursionGuard.guard(`resource_${resourceKey}`, async () => {
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`Resource fetch timeout: ${resourceKey}`));
          }, 10000); // 10 second timeout
          
          requestTimeouts.set(resourceKey, timeoutId);
        });
        
        try {
          const result = await Promise.race([
            originalMethod.call(this, resourceKey, fetchFn),
            timeoutPromise
          ]);
          
          return result;
        } finally {
          const timeoutId = requestTimeouts.get(resourceKey);
          if (timeoutId) {
            clearTimeout(timeoutId);
            requestTimeouts.delete(resourceKey);
          }
        }
      });
    };
  },
  
  // Prevent fetchFn from calling back into cache system
  createSafeFetchWrapper() {
    return function(originalFetchFn, resourceKey) {
      return async () => {
        // Mark this fetch as "direct" to prevent cache callbacks
        const originalContext = globalThis.__CACHE_CONTEXT;
        globalThis.__CACHE_CONTEXT = { direct: true, resource: resourceKey };
        
        try {
          return await originalFetchFn();
        } finally {
          globalThis.__CACHE_CONTEXT = originalContext;
        }
      };
    };
  }
};

// 5. EVENT LOOP PROTECTION
class EventLoopProtector {
  constructor() {
    this.eventCounts = new Map();
    this.eventHistory = [];
    this.maxEventsPerSecond = 50;
    this.suspiciousPatterns = new Set();
  }
  
  checkEvent(eventType, source) {
    const now = Date.now();
    const key = `${eventType}_${source}`;
    
    // Track event frequency
    this.eventHistory.push({ type: eventType, source, timestamp: now });
    
    // Clean old events (older than 1 second)
    this.eventHistory = this.eventHistory.filter(e => now - e.timestamp < 1000);
    
    // Check for event flooding
    const recentEvents = this.eventHistory.filter(e => e.type === eventType);
    if (recentEvents.length > this.maxEventsPerSecond) {
      console.error(`🚨 EVENT FLOOD DETECTED: ${eventType} from ${source}`);
      this.suspiciousPatterns.add(key);
      return false; // Block the event
    }
    
    // Check for suspicious patterns (same event repeating rapidly)
    const veryRecentSameEvents = recentEvents.filter(e => now - e.timestamp < 100);
    if (veryRecentSameEvents.length > 5) {
      console.warn(`⚠️ SUSPICIOUS EVENT PATTERN: ${eventType}`);
      this.suspiciousPatterns.add(key);
      return false;
    }
    
    return true; // Allow the event
  }
  
  isBlocked(eventType, source) {
    const key = `${eventType}_${source}`;
    return this.suspiciousPatterns.has(key);
  }
  
  reset() {
    this.suspiciousPatterns.clear();
    this.eventHistory = [];
  }
}

// 6. TIMER MANAGEMENT SYSTEM
class TimerManager {
  constructor() {
    this.timers = new Map();
    this.intervals = new Map();
  }
  
  setTimeout(callback, delay, id) {
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
  
  setInterval(callback, interval, id) {
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
    }
    
    const intervalId = setInterval(callback, interval);
    this.intervals.set(id, intervalId);
    return intervalId;
  }
  
  clearAll() {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId);
    }
    for (const intervalId of this.intervals.values()) {
      clearInterval(intervalId);
    }
    this.timers.clear();
    this.intervals.clear();
  }
}

// 7. MEMORY PRESSURE MONITOR
class MemoryPressureMonitor {
  constructor() {
    this.thresholds = {
      warning: 0.7,    // 70%
      critical: 0.85,  // 85%
      emergency: 0.95  // 95%
    };
    this.listeners = [];
  }
  
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    return 0; // Fallback for environments without memory API
  }
  
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
  
  onPressure(callback) {
    this.listeners.push(callback);
  }
  
  emit(level, usage) {
    this.listeners.forEach(callback => {
      try {
        callback(level, usage);
      } catch (error) {
        console.error('Memory pressure callback failed:', error);
      }
    });
  }
}

// 8. GLOBAL PATCHING SYSTEM
class CacheBugFixer {
  constructor() {
    this.recursionGuard = new RecursionGuard(10);
    this.eventProtector = new EventLoopProtector();
    this.timerManager = new TimerManager();
    this.memoryMonitor = new MemoryPressureMonitor();
    this.applied = false;
  }
  
  applyFixes() {
    if (this.applied) {
      console.warn('Cache bug fixes already applied');
      return;
    }
    
    console.log('🛠️ Applying critical cache bug fixes...');
    
    // Patch CacheIntegrationLayer if it exists
    if (window.CacheIntegrationLayer) {
      this.patchCacheIntegrationLayer();
    }
    
    // Patch RevolvingDoorCache if it exists
    if (window.RevolvingDoorCache) {
      this.patchRevolvingDoorCache();
    }
    
    // Setup memory monitoring
    this.setupMemoryMonitoring();
    
    // Setup event protection
    this.setupEventProtection();
    
    this.applied = true;
    console.log('✅ Critical cache bug fixes applied successfully');
  }
  
  patchCacheIntegrationLayer() {
    const prototype = window.CacheIntegrationLayer.prototype;
    
    // Patch handleJobRequest
    if (prototype.handleJobRequest) {
      const original = prototype.handleJobRequest;
      prototype.handleJobRequest = cacheIntegrationFixes.patchHandleJobRequest(original);
    }
    
    // Replace fetchJobFromAPI with safe version
    prototype.fetchJobFromAPI = cacheIntegrationFixes.createSafeFetchJobFromAPI();
    
    console.log('✅ CacheIntegrationLayer patched');
  }
  
  patchRevolvingDoorCache() {
    const prototype = window.RevolvingDoorCache.prototype;
    
    // Patch getResource
    if (prototype.getResource) {
      const original = prototype.getResource;
      prototype.getResource = revolvingDoorFixes.patchGetResource(original);
    }
    
    console.log('✅ RevolvingDoorCache patched');
  }
  
  setupMemoryMonitoring() {
    this.memoryMonitor.onPressure((level, usage) => {
      console.warn(`🧠 Memory pressure ${level}: ${(usage * 100).toFixed(1)}%`);
      
      if (level === 'emergency') {
        // Emergency cache clearing
        this.emergencyCacheClear();
      }
    });
    
    // Check memory every 5 seconds
    this.timerManager.setInterval(() => {
      this.memoryMonitor.check();
    }, 5000, 'memory_monitor');
  }
  
  setupEventProtection() {
    // Intercept document.dispatchEvent
    const originalDispatchEvent = Document.prototype.dispatchEvent;
    Document.prototype.dispatchEvent = function(event) {
      const eventType = event.type;
      const source = event.detail?.source || 'unknown';
      
      if (!window.cacheBugFixer.eventProtector.checkEvent(eventType, source)) {
        console.warn(`🛡️ Blocked suspicious event: ${eventType}`);
        return false;
      }
      
      return originalDispatchEvent.call(this, event);
    };
  }
  
  emergencyCacheClear() {
    console.error('🚨 EMERGENCY CACHE CLEAR - Memory critically low');
    
    // Clear all caches
    if (window.revolvingDoorCache) {
      window.revolvingDoorCache.localCache.clear();
      window.revolvingDoorCache.warmCache.clear();
      window.revolvingDoorCache.coldCache.clear();
    }
    
    if (window.conveyorCacheManager) {
      window.conveyorCacheManager.jobCache.clear();
      window.conveyorCacheManager.bufferQueue = [];
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }
  
  getStatus() {
    return {
      applied: this.applied,
      memoryUsage: this.memoryMonitor.getMemoryUsage(),
      suspiciousPatterns: Array.from(this.eventProtector.suspiciousPatterns),
      activeTimers: this.timerManager.timers.size,
      activeIntervals: this.timerManager.intervals.size
    };
  }
  
  destroy() {
    this.timerManager.clearAll();
    this.eventProtector.reset();
    this.applied = false;
  }
}

// Initialize and apply fixes immediately
window.cacheBugFixer = new CacheBugFixer();

// Auto-apply fixes when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cacheBugFixer.applyFixes();
  });
} else {
  // DOM already ready
  window.cacheBugFixer.applyFixes();
}

console.log('🛡️ Cache bug protection system loaded and ready!');

export { RecursionGuard, CircuitBreaker, EventLoopProtector, TimerManager, MemoryPressureMonitor, CacheBugFixer };