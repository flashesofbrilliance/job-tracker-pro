/**
 * Cache Integration Layer
 * 
 * Seamlessly integrates the Revolving Door Cache strategy with
 * the existing Conveyor Cache Manager, providing unified caching
 * with phase-offset timing optimization.
 */

class CacheIntegrationLayer {
  constructor(config = {}) {
    // Initialize both caching systems
    this.revolvingDoorCache = new RevolvingDoorCache({
      conveyorBeltCycle: config.conveyorBeltCycle || 3000,
      phaseOffset: 0.25, // 25% offset from conveyor actions
      cacheWindowWidth: 500,
      maxLocalCacheSize: 50
    });
    
    this.conveyorCacheManager = null; // Will be set when conveyor initializes
    
    // Integration state
    this.integrationActive = false;
    this.syncMode = config.syncMode || 'adaptive'; // 'aggressive', 'adaptive', 'conservative'
    this.performanceProfile = {
      avgJobSwipeTime: 2500,
      avgLoadTime: 150,
      cacheEfficiency: 0,
      userPattern: 'exploring' // 'exploring', 'focused', 'fast_browsing'
    };
    
    // Event coordination
    this.eventBuffer = [];
    this.lastSyncTime = 0;
    
    this.init();
  }
  
  /**
   * Initialize the integration layer
   */
  init() {
    console.log('🔗 Initializing Cache Integration Layer...');
    
    // Set up event forwarding between systems
    this.setupEventForwarding();
    
    // Monitor performance and adjust strategies
    this.startPerformanceMonitoring();
    
    // Hook into discovery engine initialization
    document.addEventListener('cachestrapready', (event) => {
      this.onCacheStrapReady(event.detail);
    });
    
    console.log('✅ Cache Integration Layer initialized');
  }
  
  /**
   * Set up event forwarding between cache systems
   */
  setupEventForwarding() {
    // Forward conveyor events to revolving door cache
    document.addEventListener('conveyorAction', (event) => {
      this.forwardConveyorEvent(event.detail);
    });
    
    // Forward job swipe events with enhanced metadata
    document.addEventListener('jobSwipe', (event) => {
      this.forwardJobSwipeEvent(event.detail);
    });
    
    // Listen for discovery engine job requests
    document.addEventListener('jobRequest', (event) => {
      this.handleJobRequest(event.detail);
    });
  }
  
  /**
   * Forward conveyor action to revolving door cache with timing coordination
   */
  forwardConveyorEvent(actionDetail) {
    const enhancedDetail = {
      ...actionDetail,
      timestamp: Date.now(),
      integrationLayer: true,
      performanceProfile: this.performanceProfile
    };
    
    // Coordinate timing between both cache systems
    if (this.conveyorCacheManager) {
      // Ensure conveyor cache manager is synced
      this.coordinateCacheTiming(enhancedDetail);
    }
    
    // Forward to revolving door cache
    const revolvingEvent = new CustomEvent('conveyorAction', {
      detail: enhancedDetail
    });
    document.dispatchEvent(revolvingEvent);
  }
  
  /**
   * Forward job swipe event with performance analysis
   */
  forwardJobSwipeEvent(swipeDetail) {
    const enhancedSwipe = {
      ...swipeDetail,
      timestamp: Date.now(),
      userPattern: this.detectUserPattern(swipeDetail),
      predictedNext: this.predictNextJobRequests(swipeDetail)
    };
    
    // Update performance profile
    this.updatePerformanceProfile(enhancedSwipe);
    
    // Forward to revolving door cache
    const revolvingEvent = new CustomEvent('jobSwipe', {
      detail: enhancedSwipe
    });
    document.dispatchEvent(revolvingEvent);
  }
  
  /**
   * Handle job requests with intelligent cache routing
   */
  async handleJobRequest(requestDetail) {
    const { jobId, priority, context } = requestDetail;
    const startTime = performance.now();
    
    try {
      let job = null;
      
      // Try revolving door cache first (hot/warm/cold hierarchy)
      if (this.revolvingDoorCache) {
        job = await this.revolvingDoorCache.getResource(
          `job_${jobId}`,
          () => this.fetchJobFromAPI(jobId)
        );
      }
      
      // Fallback to conveyor cache manager
      if (!job && this.conveyorCacheManager) {
        job = await this.conveyorCacheManager.loadJob(jobId);
      }
      
      // Track performance
      const loadTime = performance.now() - startTime;
      this.trackJobLoadPerformance(jobId, loadTime, job ? 'success' : 'failed');
      
      // Emit job loaded event
      const jobLoadedEvent = new CustomEvent('jobLoaded', {
        detail: {
          jobId,
          job,
          loadTime,
          cacheSource: job ? this.determineCacheSource(jobId) : null
        }
      });
      document.dispatchEvent(jobLoadedEvent);
      
      return job;
      
    } catch (error) {
      console.error('❌ Job request failed:', jobId, error);
      throw error;
    }
  }
  
  /**
   * Coordinate timing between cache systems
   */
  coordinateCacheTiming(actionDetail) {
    if (!this.conveyorCacheManager) return;
    
    const now = Date.now();
    const timeSinceLastSync = now - this.lastSyncTime;
    
    // Sync every 1 second or on significant action
    if (timeSinceLastSync > 1000 || actionDetail.type === 'next') {
      this.syncCacheStates();
      this.lastSyncTime = now;
    }
  }
  
  /**
   * Synchronize state between cache systems
   */
  syncCacheStates() {
    if (!this.conveyorCacheManager || !this.revolvingDoorCache) return;
    
    // Get current state from both systems
    const conveyorState = this.conveyorCacheManager.getStats?.() || {};
    const revolvingState = this.revolvingDoorCache.getStatus();
    
    // Coordinate cache priorities based on performance
    this.adjustCacheStrategies(conveyorState, revolvingState);
    
    console.log('🔄 Cache states synchronized', {
      conveyor: conveyorState,
      revolving: revolvingState.efficiency
    });
  }
  
  /**
   * Adjust cache strategies based on performance analysis
   */
  adjustCacheStrategies(conveyorState, revolvingState) {
    const efficiency = revolvingState.efficiency;
    const hitRatio = parseFloat(efficiency.hitRatio) / 100;
    
    // Adaptive strategy adjustment
    if (hitRatio < 0.7) {
      // Low hit ratio - increase prefetch aggressiveness
      this.syncMode = 'aggressive';
      console.log('📈 Switching to aggressive caching mode');
    } else if (hitRatio > 0.9) {
      // High hit ratio - optimize for efficiency
      this.syncMode = 'conservative';
      console.log('📉 Switching to conservative caching mode');
    } else {
      // Balanced performance
      this.syncMode = 'adaptive';
    }
  }
  
  /**
   * Detect user interaction patterns
   */
  detectUserPattern(swipeDetail) {
    const { velocity, direction, timeSpent } = swipeDetail;
    
    if (velocity > 0.8 && timeSpent < 1000) {
      return 'fast_browsing';
    } else if (timeSpent > 5000) {
      return 'focused';
    } else {
      return 'exploring';
    }
  }
  
  /**
   * Predict next job requests based on patterns
   */
  predictNextJobRequests(swipeDetail) {
    const { jobId, direction, userPattern } = swipeDetail;
    const predictions = [];
    
    if (userPattern === 'fast_browsing') {
      // Aggressive prefetching for fast users
      for (let i = 1; i <= 5; i++) {
        predictions.push(`job_${parseInt(jobId) + i}`);
      }
    } else if (userPattern === 'exploring') {
      // Moderate prefetching
      for (let i = 1; i <= 3; i++) {
        predictions.push(`job_${parseInt(jobId) + i}`);
      }
    }
    
    return predictions;
  }
  
  /**
   * Update performance profile based on user behavior
   */
  updatePerformanceProfile(swipeDetail) {
    const { timeSpent, velocity, userPattern } = swipeDetail;
    
    // Update averages
    this.performanceProfile.avgJobSwipeTime = 
      (this.performanceProfile.avgJobSwipeTime * 0.9) + (timeSpent * 0.1);
    
    this.performanceProfile.userPattern = userPattern;
    
    // Adjust cache parameters based on patterns
    if (userPattern === 'fast_browsing') {
      // Increase cache window for fast users
      this.revolvingDoorCache.cacheWindowWidth = 800;
      this.revolvingDoorCache.preloadLookahead = 5;
    } else if (userPattern === 'focused') {
      // Conservative caching for focused users
      this.revolvingDoorCache.cacheWindowWidth = 300;
      this.revolvingDoorCache.preloadLookahead = 2;
    }
  }
  
  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.analyzePerformance();
    }, 5000); // Analyze every 5 seconds
  }
  
  /**
   * Analyze overall cache performance
   */
  analyzePerformance() {
    if (!this.revolvingDoorCache) return;
    
    const status = this.revolvingDoorCache.getStatus();
    const efficiency = status.efficiency;
    
    this.performanceProfile.cacheEfficiency = parseFloat(efficiency.syncEfficiency) / 100;
    
    // Log performance summary
    console.log('📊 Cache Performance Analysis:', {
      efficiency: efficiency.syncEfficiency,
      hitRatio: efficiency.hitRatio,
      avgResponseTime: efficiency.avgResponseTime,
      userPattern: this.performanceProfile.userPattern,
      syncMode: this.syncMode
    });
  }
  
  /**
   * Track job load performance metrics
   */
  trackJobLoadPerformance(jobId, loadTime, status) {
    this.performanceProfile.avgLoadTime = 
      (this.performanceProfile.avgLoadTime * 0.9) + (loadTime * 0.1);
    
    // Emit performance event for analytics
    const perfEvent = new CustomEvent('jobLoadPerformance', {
      detail: {
        jobId,
        loadTime,
        status,
        avgLoadTime: this.performanceProfile.avgLoadTime,
        cacheEfficiency: this.performanceProfile.cacheEfficiency
      }
    });
    document.dispatchEvent(perfEvent);
  }
  
  /**
   * Determine which cache system provided the resource
   */
  determineCacheSource(jobId) {
    if (this.revolvingDoorCache?.hasResource(`job_${jobId}`)) {
      return 'revolving_door';
    } else if (this.conveyorCacheManager?.jobCache?.has(jobId)) {
      return 'conveyor';
    } else {
      return 'api_direct';
    }
  }
  
  /**
   * Fetch job from API (fallback method)
   */
  async fetchJobFromAPI(jobId) {
    const response = await fetch(`/api/jobs/${jobId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }
  
  /**
   * Set conveyor cache manager reference
   */
  setConveyorCacheManager(conveyorCacheManager) {
    this.conveyorCacheManager = conveyorCacheManager;
    this.integrationActive = true;
    
    console.log('🔗 Conveyor Cache Manager linked to integration layer');
  }
  
  /**
   * Handle cache strap ready event
   */
  onCacheStrapReady(detail) {
    console.log('🚀 Cache Strap ready - enabling full integration');
    this.integrationActive = true;
    
    // Use cached resources from cache strap
    const cachedJobs = detail.cache.get('data:./api/job-recommendations');
    if (cachedJobs) {
      this.preloadJobsIntoCache(cachedJobs);
    }
  }
  
  /**
   * Preload jobs into revolving door cache
   */
  preloadJobsIntoCache(jobsData) {
    if (!jobsData.jobs) return;
    
    jobsData.jobs.forEach((job, index) => {
      const resourceKey = `job_${job.id}`;
      
      // Place in cold cache to start revolving door process
      this.revolvingDoorCache.coldCache.set(resourceKey, job);
    });
    
    console.log(`📦 Preloaded ${jobsData.jobs.length} jobs into revolving door cache`);
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    return {
      integrationActive: this.integrationActive,
      syncMode: this.syncMode,
      performanceProfile: this.performanceProfile,
      revolvingDoorStatus: this.revolvingDoorCache?.getStatus() || null,
      conveyorConnected: !!this.conveyorCacheManager
    };
  }
  
  /**
   * Destroy integration layer
   */
  destroy() {
    if (this.revolvingDoorCache) {
      this.revolvingDoorCache.destroy();
    }
    
    console.log('🛑 Cache Integration Layer stopped');
  }
}

// Global instance
window.CacheIntegrationLayer = CacheIntegrationLayer;

console.log('🔗 Cache Integration Layer loaded - Ready for unified caching!');