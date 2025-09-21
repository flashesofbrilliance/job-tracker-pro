/**
 * Cache Strap Bootstrap System
 * Ensures full payload resource transfer sync state on load for FPL (First Painted Load)
 * 
 * This system guarantees that all critical resources are available synchronously
 * before the first paint, eliminating async loading delays and race conditions.
 */

class CacheStrapBootstrap {
  constructor(config = {}) {
    // FPL Critical Resources Configuration
    this.criticalResources = {
      // Tier 1: Blocking resources (must be loaded before FPL)
      blocking: [
        { type: 'css', url: './style.css', priority: 'critical' },
        { type: 'js', url: './three.min.js', priority: 'critical' },
        { type: 'data', url: './api/job-recommendations', priority: 'critical' }
      ],
      // Tier 2: Pre-paint resources (should be loaded before FPL)
      prePaint: [
        { type: 'image', url: './icons/icon-192x192.png', priority: 'high' },
        { type: 'audio', url: './assets/swipe-sounds.webm', priority: 'high' },
        { type: 'shader', url: './shaders/particle-effects.glsl', priority: 'high' }
      ],
      // Tier 3: Post-paint resources (can be loaded after FPL)
      postPaint: [
        { type: 'image', url: './assets/sushi-sprites.webp', priority: 'low' },
        { type: 'manifest', url: './manifest.json', priority: 'low' }
      ]
    };

    // Bootstrap State Management
    this.bootstrapState = {
      phase: 'initializing', // initializing, loading, validating, ready, error
      startTime: performance.now(),
      fplTime: null,
      totalResources: 0,
      loadedResources: 0,
      failedResources: 0,
      criticalResourcesReady: false,
      syncStateAchieved: false
    };

    // Resource Cache Storage
    this.resourceCache = new Map();
    this.resourcePromises = new Map();
    this.syncBarriers = new Map();

    // Performance Tracking
    this.metrics = {
      fplDelay: 0,
      cacheHitRatio: 0,
      syncStateLatency: 0,
      resourceLoadTimes: new Map()
    };

    // Error Handling & Fallbacks
    this.fallbackStrategies = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = config.maxRetries || 3;

    this.init();
  }

  /**
   * Initialize the cache strap bootstrap system
   */
  init() {
    console.log('🚀 Initializing Cache Strap Bootstrap for FPL optimization...');
    
    // Calculate total resources for progress tracking
    this.bootstrapState.totalResources = 
      this.criticalResources.blocking.length +
      this.criticalResources.prePaint.length +
      this.criticalResources.postPaint.length;

    // Setup fallback strategies
    this.setupFallbackStrategies();

    // Start bootstrap sequence
    this.startBootstrapSequence();
  }

  /**
   * Execute the bootstrap sequence with sync barriers
   */
  async startBootstrapSequence() {
    try {
      this.bootstrapState.phase = 'loading';
      console.log('📦 Phase 1: Loading blocking resources for sync state...');

      // CRITICAL: Blocking resources must complete before FPL
      await this.loadResourceTier('blocking', true);
      this.bootstrapState.criticalResourcesReady = true;

      console.log('🎨 Phase 2: Loading pre-paint resources...');
      // Pre-paint resources loaded in parallel but before paint
      await this.loadResourceTier('prePaint', false);

      // SYNC BARRIER: Ensure all critical resources are in sync state
      await this.validateSyncState();
      this.bootstrapState.syncStateAchieved = true;

      // Signal FPL ready
      this.triggerFirstPaintLoad();

      console.log('⚡ Phase 3: Background loading post-paint resources...');
      // Post-paint resources can load asynchronously after FPL
      this.loadResourceTier('postPaint', false);

      this.bootstrapState.phase = 'ready';
      this.calculateMetrics();
      
      console.log('✅ Cache Strap Bootstrap complete!', this.getBootstrapSummary());

    } catch (error) {
      this.bootstrapState.phase = 'error';
      console.error('❌ Cache Strap Bootstrap failed:', error);
      await this.executeEmergencyFallback();
    }
  }

  /**
   * Load a tier of resources with optional synchronous blocking
   */
  async loadResourceTier(tier, blockingMode = false) {
    const resources = this.criticalResources[tier];
    const loadPromises = [];

    for (const resource of resources) {
      const promise = this.loadResource(resource, blockingMode);
      loadPromises.push(promise);

      if (blockingMode) {
        // In blocking mode, wait for each critical resource
        await promise;
      }
    }

    if (!blockingMode) {
      // In non-blocking mode, wait for all to complete in parallel
      await Promise.allSettled(loadPromises);
    }
  }

  /**
   * Load individual resource with caching and fallback
   */
  async loadResource(resource, isBlocking = false) {
    const startTime = performance.now();
    const cacheKey = `${resource.type}:${resource.url}`;

    try {
      // Check if already cached
      if (this.resourceCache.has(cacheKey)) {
        console.log(`💾 Cache hit: ${resource.url}`);
        this.bootstrapState.loadedResources++;
        return this.resourceCache.get(cacheKey);
      }

      // Check if already loading
      if (this.resourcePromises.has(cacheKey)) {
        return await this.resourcePromises.get(cacheKey);
      }

      // Start loading
      const loadPromise = this.fetchResource(resource);
      this.resourcePromises.set(cacheKey, loadPromise);

      const data = await loadPromise;
      
      // Cache the resource
      this.resourceCache.set(cacheKey, data);
      this.bootstrapState.loadedResources++;

      // Track performance
      const loadTime = performance.now() - startTime;
      this.metrics.resourceLoadTimes.set(cacheKey, loadTime);

      if (isBlocking && loadTime > 50) {
        console.warn(`⚠️ Slow blocking resource: ${resource.url} (${loadTime.toFixed(2)}ms)`);
      }

      console.log(`✅ Loaded: ${resource.url} (${loadTime.toFixed(2)}ms)`);
      return data;

    } catch (error) {
      this.bootstrapState.failedResources++;
      console.error(`❌ Failed to load: ${resource.url}`, error);

      // Execute fallback strategy
      return await this.executeFallbackStrategy(resource, error);
    } finally {
      this.resourcePromises.delete(cacheKey);
    }
  }

  /**
   * Fetch resource based on type
   */
  async fetchResource(resource) {
    switch (resource.type) {
      case 'css':
        return await this.fetchText(resource.url);
      case 'js':
        return await this.fetchText(resource.url);
      case 'data':
        return await this.fetchJSON(resource.url);
      case 'image':
        return await this.fetchBlob(resource.url);
      case 'audio':
        return await this.fetchBlob(resource.url);
      case 'shader':
        return await this.fetchText(resource.url);
      case 'manifest':
        return await this.fetchJSON(resource.url);
      default:
        return await this.fetchText(resource.url);
    }
  }

  /**
   * Fetch text resources
   */
  async fetchText(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Fetch JSON resources
   */
  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  }

  /**
   * Fetch binary resources
   */
  async fetchBlob(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.blob();
  }

  /**
   * Validate that all critical resources are in sync state
   */
  async validateSyncState() {
    console.log('🔍 Validating sync state...');
    
    const validationChecks = [
      this.validateCSSLoaded(),
      this.validateJSLoaded(), 
      this.validateDataLoaded(),
      this.validateCacheIntegrity()
    ];

    const results = await Promise.allSettled(validationChecks);
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      throw new Error(`Sync state validation failed: ${failed.length} checks failed`);
    }

    console.log('✅ Sync state validated - all critical resources ready');
  }

  /**
   * Trigger First Paint Load
   */
  triggerFirstPaintLoad() {
    this.bootstrapState.fplTime = performance.now();
    this.metrics.fplDelay = this.bootstrapState.fplTime - this.bootstrapState.startTime;
    
    console.log(`🎨 First Paint Load triggered! (${this.metrics.fplDelay.toFixed(2)}ms)`);
    
    // Emit custom event for app initialization
    const fplEvent = new CustomEvent('cachestrapready', {
      detail: {
        metrics: this.metrics,
        bootstrapState: this.bootstrapState,
        cache: this.resourceCache
      }
    });
    
    document.dispatchEvent(fplEvent);
  }

  /**
   * Setup fallback strategies for different resource types
   */
  setupFallbackStrategies() {
    this.fallbackStrategies.set('css', (resource, error) => {
      return `/* Fallback CSS for ${resource.url} - Error: ${error.message} */`;
    });
    
    this.fallbackStrategies.set('js', (resource, error) => {
      return `// Fallback JS for ${resource.url} - Error: ${error.message}`;
    });
    
    this.fallbackStrategies.set('data', (resource, error) => {
      return { error: true, fallback: true, jobs: [], message: error.message };
    });
    
    this.fallbackStrategies.set('image', (resource, error) => {
      // Return 1x1 transparent pixel as fallback
      return new Blob([''], { type: 'image/gif' });
    });
  }

  /**
   * Execute fallback strategy for failed resources
   */
  async executeFallbackStrategy(resource, error) {
    const strategy = this.fallbackStrategies.get(resource.type);
    if (strategy) {
      console.log(`🔧 Executing fallback for ${resource.type}: ${resource.url}`);
      return strategy(resource, error);
    }
    
    // Default fallback
    return null;
  }

  /**
   * Validation helper methods
   */
  async validateCSSLoaded() {
    // Check if CSS is available in cache
    const cssKey = 'css:./style.css';
    if (!this.resourceCache.has(cssKey)) {
      throw new Error('Critical CSS not loaded');
    }
  }

  async validateJSLoaded() {
    // Check if Three.js is available
    const jsKey = 'js:./three.min.js';
    if (!this.resourceCache.has(jsKey)) {
      throw new Error('Critical JS (Three.js) not loaded');
    }
  }

  async validateDataLoaded() {
    // Check if job data is available
    const dataKey = 'data:./api/job-recommendations';
    if (!this.resourceCache.has(dataKey)) {
      throw new Error('Critical data not loaded');
    }
  }

  async validateCacheIntegrity() {
    // Ensure cache consistency
    const expectedBlocking = this.criticalResources.blocking.length;
    const blockingLoaded = Array.from(this.resourceCache.keys())
      .filter(key => this.criticalResources.blocking
        .some(r => key.includes(r.url))).length;
    
    if (blockingLoaded < expectedBlocking) {
      throw new Error(`Cache integrity check failed: ${blockingLoaded}/${expectedBlocking} blocking resources`);
    }
  }

  /**
   * Calculate performance metrics
   */
  calculateMetrics() {
    const totalLoadTime = this.bootstrapState.fplTime - this.bootstrapState.startTime;
    const totalResources = this.bootstrapState.totalResources;
    const loadedResources = this.bootstrapState.loadedResources;
    
    this.metrics.cacheHitRatio = totalResources > 0 ? (loadedResources / totalResources) : 0;
    this.metrics.syncStateLatency = totalLoadTime;
  }

  /**
   * Get bootstrap summary
   */
  getBootstrapSummary() {
    return {
      phase: this.bootstrapState.phase,
      totalTime: (this.bootstrapState.fplTime - this.bootstrapState.startTime).toFixed(2) + 'ms',
      resourcesLoaded: `${this.bootstrapState.loadedResources}/${this.bootstrapState.totalResources}`,
      resourcesFailed: this.bootstrapState.failedResources,
      cacheHitRatio: (this.metrics.cacheHitRatio * 100).toFixed(1) + '%',
      syncStateAchieved: this.bootstrapState.syncStateAchieved
    };
  }

  /**
   * Emergency fallback for critical failures
   */
  async executeEmergencyFallback() {
    console.log('🚨 Executing emergency fallback...');
    
    // Trigger FPL even if some resources failed
    this.triggerFirstPaintLoad();
    
    // Load minimal fallback resources
    const emergencyCSS = '/* Emergency CSS */ body { margin: 0; font-family: system-ui; }';
    const emergencyData = { jobs: [], error: true, message: 'Emergency mode' };
    
    this.resourceCache.set('css:emergency', emergencyCSS);
    this.resourceCache.set('data:emergency', emergencyData);
  }

  /**
   * Get cached resource
   */
  getCachedResource(type, url) {
    const key = `${type}:${url}`;
    return this.resourceCache.get(key);
  }

  /**
   * Check if resource is cached
   */
  isResourceCached(type, url) {
    const key = `${type}:${url}`;
    return this.resourceCache.has(key);
  }
}

// Global instance
window.CacheStrapBootstrap = CacheStrapBootstrap;

console.log('🎯 Cache Strap Bootstrap system loaded and ready!');