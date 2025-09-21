/**
 * Framework-agnostic Event System for cache-money-bebe
 * Replaces DOM events with a safer, more predictable system
 */

/**
 * @typedef {Object} CacheEvent
 * @property {string} type - Event type
 * @property {*} data - Event data
 * @property {number} timestamp - Event timestamp
 * @property {string} [source] - Event source
 */

export class EventEmitter {
  constructor() {
    this.listeners = new Map(); // eventType -> Set of listeners
    this.maxListeners = 50; // Prevent memory leaks
    this.eventHistory = []; // For debugging and loop detection
    this.suspiciousPatterns = new Set(); // Track problematic patterns
    this.recursionDepth = new Map(); // Track recursive calls
    this.maxRecursionDepth = 10;
    this.eventStats = {
      emitted: 0,
      blocked: 0,
      recursionBlocked: 0
    };
  }

  /**
   * Add event listener with safety checks
   * @param {string} eventType - Event type to listen for
   * @param {Function} listener - Callback function
   * @param {Object} [options] - Listener options
   * @param {number} [options.maxCalls] - Maximum number of calls
   * @param {boolean} [options.once] - Remove after first call
   */
  on(eventType, listener, options = {}) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listeners = this.listeners.get(eventType);
    
    // Check for listener limit
    if (listeners.size >= this.maxListeners) {
      console.warn(`⚠️ Too many listeners for ${eventType}, rejecting new listener`);
      return false;
    }

    // Wrap listener with safety checks
    const safeListener = this.createSafeListener(listener, eventType, options);
    listeners.add(safeListener);

    return () => this.off(eventType, safeListener);
  }

  /**
   * Create a safe wrapper around listener functions
   */
  createSafeListener(originalListener, eventType, options = {}) {
    let callCount = 0;
    const maxCalls = options.maxCalls || Infinity;
    const once = options.once || false;
    
    return (event) => {
      try {
        // Check call limits
        if (callCount >= maxCalls) {
          console.warn(`Listener for ${eventType} exceeded max calls (${maxCalls})`);
          this.off(eventType, originalListener);
          return;
        }

        callCount++;
        
        // Execute listener
        const result = originalListener(event);
        
        // Handle once option
        if (once) {
          this.off(eventType, originalListener);
        }

        return result;
      } catch (error) {
        console.error(`Event listener error for ${eventType}:`, error);
        // Don't propagate listener errors
      }
    };
  }

  /**
   * Remove event listener
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener to remove
   */
  off(eventType, listener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Remove all listeners for an event type
   * @param {string} eventType - Event type to clear
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit event with safety checks and loop detection
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   * @param {Object} [metadata] - Additional event metadata
   */
  emit(eventType, data, metadata = {}) {
    const now = Date.now();
    const eventKey = `${eventType}_${JSON.stringify(data)}`;

    // Check for recursion
    const currentDepth = (this.recursionDepth.get(eventType) || 0) + 1;
    if (currentDepth > this.maxRecursionDepth) {
      console.error(`🚨 Recursion limit exceeded for event: ${eventType}`);
      this.eventStats.recursionBlocked++;
      return false;
    }

    // Check for suspicious patterns
    if (this.suspiciousPatterns.has(eventKey)) {
      console.warn(`🛡️ Blocking suspicious event pattern: ${eventType}`);
      this.eventStats.blocked++;
      return false;
    }

    // Event frequency analysis
    if (!this.isEventFrequencyAcceptable(eventType)) {
      this.suspiciousPatterns.add(eventKey);
      this.eventStats.blocked++;
      return false;
    }

    // Update recursion depth
    this.recursionDepth.set(eventType, currentDepth);

    // Create event object
    const event = {
      type: eventType,
      data,
      timestamp: now,
      source: metadata.source || 'unknown',
      ...metadata
    };

    // Track event history for analysis
    this.eventHistory.push({
      ...event,
      listeners: this.listeners.get(eventType)?.size || 0
    });

    // Clean old history (keep last 100 events)
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }

    try {
      // Emit to listeners
      const listeners = this.listeners.get(eventType);
      if (listeners && listeners.size > 0) {
        // Use Array.from to avoid issues with Set modification during iteration
        const listenerArray = Array.from(listeners);
        
        for (const listener of listenerArray) {
          try {
            listener(event);
          } catch (error) {
            console.error(`Listener error for ${eventType}:`, error);
            // Continue with other listeners
          }
        }
        
        this.eventStats.emitted++;
        return true;
      }
      
      return false; // No listeners
      
    } finally {
      // Always clean up recursion depth
      this.recursionDepth.set(eventType, currentDepth - 1);
      if (currentDepth === 1) {
        this.recursionDepth.delete(eventType);
      }
    }
  }

  /**
   * Check if event frequency is within acceptable limits
   * @param {string} eventType - Event type to check
   */
  isEventFrequencyAcceptable(eventType) {
    const now = Date.now();
    const recentEvents = this.eventHistory.filter(e => 
      e.type === eventType && (now - e.timestamp) < 1000
    );

    // Allow max 20 events per second per type
    if (recentEvents.length > 20) {
      console.warn(`Event flood detected for ${eventType}: ${recentEvents.length} events/second`);
      return false;
    }

    // Check for rapid-fire identical events (potential infinite loop)
    const veryRecentEvents = recentEvents.filter(e => (now - e.timestamp) < 100);
    if (veryRecentEvents.length > 3) {
      console.warn(`Rapid-fire events detected for ${eventType}`);
      return false;
    }

    return true;
  }

  /**
   * Emit event only once (deduplicated within timeframe)
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   * @param {number} [dedupeTime=100] - Deduplication time in ms
   */
  emitOnce(eventType, data, dedupeTime = 100) {
    const now = Date.now();
    const eventKey = `${eventType}_${JSON.stringify(data)}`;
    
    // Check recent identical events
    const recentIdentical = this.eventHistory.find(e => 
      e.type === eventType && 
      JSON.stringify(e.data) === JSON.stringify(data) &&
      (now - e.timestamp) < dedupeTime
    );

    if (recentIdentical) {
      console.debug(`Deduplicating event ${eventType} (within ${dedupeTime}ms)`);
      return false;
    }

    return this.emit(eventType, data);
  }

  /**
   * Create a namespaced event emitter
   * @param {string} namespace - Namespace prefix
   */
  namespace(namespace) {
    return {
      on: (eventType, listener, options) => 
        this.on(`${namespace}:${eventType}`, listener, options),
      
      off: (eventType, listener) => 
        this.off(`${namespace}:${eventType}`, listener),
        
      emit: (eventType, data, metadata) => 
        this.emit(`${namespace}:${eventType}`, data, { 
          ...metadata, 
          source: namespace 
        }),
        
      emitOnce: (eventType, data, dedupeTime) => 
        this.emitOnce(`${namespace}:${eventType}`, data, dedupeTime)
    };
  }

  /**
   * Get event system statistics
   */
  getStats() {
    const activeListeners = Array.from(this.listeners.entries()).reduce((acc, [type, listeners]) => {
      acc[type] = listeners.size;
      return acc;
    }, {});

    return {
      ...this.eventStats,
      activeListeners,
      totalListenerTypes: this.listeners.size,
      suspiciousPatterns: this.suspiciousPatterns.size,
      recentEvents: this.eventHistory.slice(-10).map(e => ({
        type: e.type,
        timestamp: e.timestamp,
        listeners: e.listeners
      }))
    };
  }

  /**
   * Reset suspicious patterns (for debugging)
   */
  resetSuspiciousPatterns() {
    this.suspiciousPatterns.clear();
    console.log('🧹 Cleared suspicious event patterns');
  }

  /**
   * Destroy the event emitter and clean up
   */
  destroy() {
    this.listeners.clear();
    this.eventHistory = [];
    this.suspiciousPatterns.clear();
    this.recursionDepth.clear();
    console.log('🗑️ EventEmitter destroyed');
  }
}

/**
 * Global event emitter singleton for cache operations
 */
export const globalCacheEvents = new EventEmitter();

/**
 * Create event emitter with cache-specific safety defaults
 */
export function createCacheEventEmitter(options = {}) {
  const emitter = new EventEmitter();
  
  // Cache-specific configuration
  emitter.maxListeners = options.maxListeners || 25;
  emitter.maxRecursionDepth = options.maxRecursionDepth || 5;
  
  return emitter;
}