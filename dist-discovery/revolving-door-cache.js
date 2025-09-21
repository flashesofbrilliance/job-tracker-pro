/**
 * Revolving Door Cache Strategy
 * 
 * Phase-offset cache busting synchronized with conveyor belt timing
 * Creates a narrow cache window that progressively syncs CDN → local cache
 * ensuring fresh resources without UI blocking.
 * 
 * Key Concept: Cache invalidation happens just out of phase with UI interactions,
 * creating a "revolving door" effect where fresh content is always ready.
 */

class RevolvingDoorCache {
  constructor(config = {}) {
    // Timing Configuration
    this.conveyorBeltCycle = config.conveyorBeltCycle || 3000; // 3s conveyor cycle
    this.cacheWindowWidth = config.cacheWindowWidth || 500; // 500ms narrow window
    this.phaseOffset = config.phaseOffset || 0.25; // 25% offset from conveyor
    this.revolvingCycles = config.revolvingCycles || 4; // 4 cache segments
    
    // Cache Strategy Parameters
    this.maxLocalCacheSize = config.maxLocalCacheSize || 50; // Max local items
    this.preloadLookahead = config.preloadLookahead || 3; // Jobs to preload ahead
    this.cdnSyncInterval = config.cdnSyncInterval || 1000; // CDN sync frequency
    
    // Cache Storage Layers
    this.localCache = new Map(); // Hot cache - immediate access
    this.warmCache = new Map(); // Warming cache - preparing for promotion
    this.coldCache = new Map(); // Background cache - CDN sync staging
    this.metadataCache = new Map(); // Cache metadata and timing info
    
    // Revolving Door State
    this.currentCacheSegment = 0; // Which segment is active (0-3)
    this.revolvingTimer = null;
    this.phaseTimer = null;
    this.lastConveyorAction = 0;
    
    // Performance Tracking
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      cdnFetches: 0,
      promotions: 0, // warm -> hot promotions
      evictions: 0,
      phaseAlignments: 0,
      avgResponseTime: 0,
      syncEfficiency: 0
    };
    
    // Resource Pipeline
    this.pendingFetches = new Map();
    this.syncQueue = [];
    this.evictionQueue = [];
    
    this.init();
  }
  
  /**
   * Initialize the revolving door cache system
   */
  init() {
    console.log('🎡 Initializing Revolving Door Cache Strategy...');
    console.log(`📊 Config: Conveyor=${this.conveyorBeltCycle}ms, Window=${this.cacheWindowWidth}ms, Offset=${this.phaseOffset * 100}%`);
    
    this.setupRevolvingTimers();
    this.startCDNSyncPipeline();
    this.initializeCacheSegments();
    
    // Hook into conveyor belt events
    this.setupConveyorBeltSync();
    
    console.log('✅ Revolving Door Cache initialized with phase-offset timing');
  }
  
  /**
   * Setup revolving timers with phase offset
   */
  setupRevolvingTimers() {
    // Calculate phase offset timing
    const offsetDelay = this.conveyorBeltCycle * this.phaseOffset;
    const segmentDuration = this.conveyorBeltCycle / this.revolvingCycles;
    
    // Main revolving timer - rotates cache segments
    this.revolvingTimer = setInterval(() => {
      this.rotateCacheSegment();
    }, segmentDuration);
    
    // Phase-offset timer - triggers cache operations between conveyor actions
    setTimeout(() => {
      this.phaseTimer = setInterval(() => {
        this.executePhaseOffsetOperations();
      }, this.conveyorBeltCycle);
    }, offsetDelay);
    
    console.log(`🕐 Revolving timers started: Segment=${segmentDuration}ms, Phase offset=${offsetDelay}ms`);
  }
  
  /**
   * Initialize cache segments for revolving strategy
   */
  initializeCacheSegments() {
    const segments = ['alpha', 'beta', 'gamma', 'delta'];
    
    segments.forEach((segment, index) => {
      this.metadataCache.set(`segment_${index}`, {
        name: segment,
        lastRotation: Date.now(),
        itemCount: 0,
        hitRate: 0,
        isActive: index === 0
      });
    });
  }
  
  /**
   * Rotate to next cache segment (revolving door mechanism)
   */
  rotateCacheSegment() {
    const previousSegment = this.currentCacheSegment;
    this.currentCacheSegment = (this.currentCacheSegment + 1) % this.revolvingCycles;
    
    const currentMeta = this.metadataCache.get(`segment_${this.currentCacheSegment}`);
    const previousMeta = this.metadataCache.get(`segment_${previousSegment}`);
    
    // Update metadata
    currentMeta.isActive = true;
    currentMeta.lastRotation = Date.now();
    previousMeta.isActive = false;
    
    console.log(`🎡 Cache segment rotation: ${previousMeta.name} → ${currentMeta.name}`);
    
    // Execute segment-specific operations
    this.onSegmentRotation(previousSegment, this.currentCacheSegment);
  }
  
  /**
   * Execute operations during phase offset (between conveyor actions)
   */
  executePhaseOffsetOperations() {
    const now = Date.now();
    const timeSinceLastConveyor = now - this.lastConveyorAction;
    
    // Only execute if we're in the phase-offset window
    const isInPhaseWindow = timeSinceLastConveyor > (this.conveyorBeltCycle * this.phaseOffset) &&
                           timeSinceLastConveyor < (this.conveyorBeltCycle * (this.phaseOffset + 0.1));
    
    if (isInPhaseWindow) {
      this.stats.phaseAlignments++;
      
      console.log('⚡ Executing phase-offset operations...');
      
      // 1. Promote warm cache items to hot cache
      this.promoteWarmToHot();
      
      // 2. Sync cold cache with CDN
      this.syncColdCacheWithCDN();
      
      // 3. Preemptive eviction of stale items
      this.executeEvictionQueue();
      
      // 4. Predictive resource loading
      this.predictiveResourceLoad();
    }
  }
  
  /**
   * Hook into conveyor belt timing events
   */
  setupConveyorBeltSync() {
    // Listen for conveyor belt events
    document.addEventListener('conveyorAction', (event) => {
      this.lastConveyorAction = Date.now();
      this.onConveyorAction(event.detail);
    });
    
    // Listen for job swipes to predict next resources
    document.addEventListener('jobSwipe', (event) => {
      this.onJobSwipe(event.detail);
    });
  }
  
  /**
   * Handle conveyor belt action timing
   */
  onConveyorAction(action) {
    console.log(`🍣 Conveyor action detected: ${action.type}`);
    
    if (action.type === 'next') {
      // Predict next resources needed
      this.scheduleResourcePrefetch(action.currentJobIndex + this.preloadLookahead);
    }
  }
  
  /**
   * Handle job swipe to predict patterns
   */
  onJobSwipe(swipeData) {
    const { direction, velocity, jobId } = swipeData;
    
    // Update cache priority based on swipe patterns
    this.adjustCachePriority(jobId, direction, velocity);
    
    // Schedule predictive loading
    if (velocity > 0.5) { // Fast swiping
      this.scheduleAggressivePrefetch();
    }
  }
  
  /**
   * Get resource with revolving door cache strategy
   */
  async getResource(resourceKey, fetchFn) {
    const startTime = performance.now();
    
    // 1. Check hot cache first (immediate access)
    if (this.localCache.has(resourceKey)) {
      this.stats.cacheHits++;
      const resource = this.localCache.get(resourceKey);
      this.updateCacheMetadata(resourceKey, 'hit', Date.now() - startTime);
      return resource;
    }
    
    // 2. Check warm cache (promoting to hot)
    if (this.warmCache.has(resourceKey)) {
      this.stats.cacheHits++;
      const resource = this.warmCache.get(resourceKey);
      
      // Promote to hot cache
      this.promoteResource(resourceKey, resource);
      this.updateCacheMetadata(resourceKey, 'warm_hit', Date.now() - startTime);
      return resource;
    }
    
    // 3. Check cold cache (needs warming)
    if (this.coldCache.has(resourceKey)) {
      const resource = this.coldCache.get(resourceKey);
      
      // Move to warm cache for future promotion
      this.warmCache.set(resourceKey, resource);
      this.coldCache.delete(resourceKey);
      
      this.updateCacheMetadata(resourceKey, 'cold_hit', Date.now() - startTime);
      return resource;
    }
    
    // 4. Cache miss - fetch from CDN with revolving door placement
    this.stats.cacheMisses++;
    this.stats.cdnFetches++;
    
    try {
      const resource = await this.fetchWithRevolvingPlacement(resourceKey, fetchFn);
      const fetchTime = Date.now() - startTime;
      this.updateCacheMetadata(resourceKey, 'miss', fetchTime);
      
      return resource;
    } catch (error) {
      console.error(`❌ Failed to fetch resource: ${resourceKey}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch resource and place in appropriate cache segment
   */
  async fetchWithRevolvingPlacement(resourceKey, fetchFn) {
    // Check if already being fetched
    if (this.pendingFetches.has(resourceKey)) {
      return await this.pendingFetches.get(resourceKey);
    }
    
    const fetchPromise = fetchFn();
    this.pendingFetches.set(resourceKey, fetchPromise);
    
    try {
      const resource = await fetchPromise;
      
      // Place in cold cache initially (will warm up through revolving door)
      this.coldCache.set(resourceKey, resource);
      
      // Schedule for promotion based on current segment timing
      this.scheduleResourcePromotion(resourceKey);
      
      console.log(`📦 Resource cached in revolving door: ${resourceKey}`);
      return resource;
      
    } finally {
      this.pendingFetches.delete(resourceKey);
    }
  }
  
  /**
   * Promote warm cache items to hot cache during phase offset
   */
  promoteWarmToHot() {
    const promotionCandidates = Array.from(this.warmCache.entries()).slice(0, 5);
    
    promotionCandidates.forEach(([key, resource]) => {
      this.promoteResource(key, resource);
      this.warmCache.delete(key);
      this.stats.promotions++;
    });
    
    if (promotionCandidates.length > 0) {
      console.log(`⬆️ Promoted ${promotionCandidates.length} resources to hot cache`);
    }
  }
  
  /**
   * Promote resource to hot cache
   */
  promoteResource(key, resource) {
    this.localCache.set(key, resource);
    
    // Maintain cache size limits
    if (this.localCache.size > this.maxLocalCacheSize) {
      this.evictLRUFromHotCache();
    }
  }
  
  /**
   * Sync cold cache with CDN during phase offset
   */
  async syncColdCacheWithCDN() {
    const syncBatch = this.syncQueue.splice(0, 3); // Process 3 items per phase
    
    for (const syncItem of syncBatch) {
      try {
        await this.refreshResourceFromCDN(syncItem);
      } catch (error) {
        console.warn(`⚠️ CDN sync failed for: ${syncItem}`, error);
      }
    }
  }
  
  /**
   * Execute scheduled evictions during phase offset
   */
  executeEvictionQueue() {
    const evictBatch = this.evictionQueue.splice(0, 5);
    
    evictBatch.forEach(key => {
      this.coldCache.delete(key);
      this.warmCache.delete(key);
      this.stats.evictions++;
    });
    
    if (evictBatch.length > 0) {
      console.log(`🗑️ Evicted ${evictBatch.length} stale resources`);
    }
  }
  
  /**
   * Predictive resource loading based on usage patterns
   */
  predictiveResourceLoad() {
    // Analyze cache hit patterns to predict next resources
    const hotItems = Array.from(this.localCache.keys());
    const recentHits = hotItems.slice(-5); // Last 5 accessed items
    
    // Predict next resources based on patterns
    recentHits.forEach(item => {
      const predictedNext = this.predictNextResource(item);
      if (predictedNext && !this.hasResource(predictedNext)) {
        this.scheduleBackgroundFetch(predictedNext);
      }
    });
  }
  
  /**
   * Schedule resource prefetch during next phase offset
   */
  scheduleResourcePrefetch(jobIndex) {
    const resourceKey = `job_${jobIndex}`;
    
    if (!this.hasResource(resourceKey)) {
      this.syncQueue.push(resourceKey);
      console.log(`📅 Scheduled prefetch: ${resourceKey}`);
    }
  }
  
  /**
   * Check if resource exists in any cache layer
   */
  hasResource(resourceKey) {
    return this.localCache.has(resourceKey) ||
           this.warmCache.has(resourceKey) ||
           this.coldCache.has(resourceKey);
  }
  
  /**
   * Update cache metadata and performance stats
   */
  updateCacheMetadata(resourceKey, hitType, responseTime) {
    const metadata = {
      lastAccess: Date.now(),
      hitType,
      responseTime,
      accessCount: (this.metadataCache.get(resourceKey)?.accessCount || 0) + 1
    };
    
    this.metadataCache.set(resourceKey, metadata);
    
    // Update average response time
    const currentAvg = this.stats.avgResponseTime;
    const totalHits = this.stats.cacheHits + this.stats.cacheMisses;
    this.stats.avgResponseTime = (currentAvg * (totalHits - 1) + responseTime) / totalHits;
  }
  
  /**
   * Calculate sync efficiency metrics
   */
  calculateSyncEfficiency() {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses;
    const hitRatio = totalRequests > 0 ? (this.stats.cacheHits / totalRequests) : 0;
    const phaseAlignment = this.stats.phaseAlignments / (Date.now() / this.conveyorBeltCycle);
    
    this.stats.syncEfficiency = (hitRatio * 0.7) + (phaseAlignment * 0.3);
    
    return {
      hitRatio: (hitRatio * 100).toFixed(1) + '%',
      avgResponseTime: this.stats.avgResponseTime.toFixed(2) + 'ms',
      syncEfficiency: (this.stats.syncEfficiency * 100).toFixed(1) + '%',
      phaseAlignments: this.stats.phaseAlignments,
      currentSegment: this.metadataCache.get(`segment_${this.currentCacheSegment}`).name
    };
  }
  
  /**
   * Get cache status and performance metrics
   */
  getStatus() {
    return {
      cacheSegment: this.currentCacheSegment,
      cacheSizes: {
        hot: this.localCache.size,
        warm: this.warmCache.size,
        cold: this.coldCache.size
      },
      stats: this.stats,
      efficiency: this.calculateSyncEfficiency(),
      timing: {
        conveyorCycle: this.conveyorBeltCycle,
        phaseOffset: this.phaseOffset,
        lastConveyorAction: Date.now() - this.lastConveyorAction
      }
    };
  }
  
  /**
   * Cleanup and stop revolving door
   */
  destroy() {
    if (this.revolvingTimer) clearInterval(this.revolvingTimer);
    if (this.phaseTimer) clearInterval(this.phaseTimer);
    
    console.log('🛑 Revolving Door Cache stopped');
  }
  
  // Utility methods for cache operations
  evictLRUFromHotCache() {
    const entries = Array.from(this.localCache.entries());
    const lruEntry = entries.reduce((oldest, current) => {
      const currentMeta = this.metadataCache.get(current[0]);
      const oldestMeta = this.metadataCache.get(oldest[0]);
      return (currentMeta?.lastAccess || 0) < (oldestMeta?.lastAccess || 0) ? current : oldest;
    });
    
    this.localCache.delete(lruEntry[0]);
    this.stats.evictions++;
  }
  
  predictNextResource(currentResource) {
    // Simple pattern-based prediction (can be enhanced with ML)
    const match = currentResource.match(/job_(\d+)/);
    return match ? `job_${parseInt(match[1]) + 1}` : null;
  }
  
  adjustCachePriority(jobId, direction, velocity) {
    // Adjust cache priorities based on user behavior
    // Fast swipers get more aggressive prefetching
  }
  
  scheduleAggressivePrefetch() {
    // Schedule more aggressive prefetching for fast swipes
  }
  
  scheduleResourcePromotion(resourceKey) {
    // Schedule resource for promotion in next cycle
  }
  
  scheduleBackgroundFetch(resourceKey) {
    // Schedule background fetch
  }
  
  refreshResourceFromCDN(resourceKey) {
    // Refresh resource from CDN
  }
  
  onSegmentRotation(previousSegment, currentSegment) {
    // Handle segment rotation logic
    console.log(`🔄 Segment ${previousSegment} → ${currentSegment} rotation complete`);
  }
}

// Export for use
window.RevolvingDoorCache = RevolvingDoorCache;

console.log('🎡 Revolving Door Cache Strategy loaded - Ready for phase-offset caching!');