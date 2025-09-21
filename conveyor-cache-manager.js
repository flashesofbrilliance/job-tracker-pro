/**
 * Conveyor Cache Manager
 * Intelligent pre-caching and lazy loading for smooth left-to-right job delivery
 */

class ConveyorCacheManager {
  constructor(options = {}) {
    // Configuration
    this.bufferSize = options.bufferSize || 5; // Jobs to keep in buffer
    this.prefetchSize = options.prefetchSize || 3; // Jobs to prefetch ahead
    this.maxCacheSize = options.maxCacheSize || 20; // Maximum cached jobs
    
    // Cache storage
    this.jobCache = new Map(); // Job data cache
    this.jobQueue = []; // Ordered queue of job IDs
    this.currentIndex = 0;
    this.bufferQueue = []; // Pre-loaded buffer ready for animation
    
    // Animation state
    this.isAnimating = false;
    this.animationQueue = [];
    this.lastSwipeTime = Date.now();
    this.swipeVelocity = 0;
    
    // Performance tracking
    this.cacheStats = {
      hits: 0,
      misses: 0,
      prefetches: 0,
      evictions: 0
    };
    
    // User behavior patterns
    this.swipePattern = {
      averageTime: 3000, // 3 seconds average
      velocity: 0,
      direction: 'forward', // 'forward' or 'backward'
      recentSpeeds: []
    };
    
    this.init();
  }
  
  init() {
    console.log('🎯 Initializing Conveyor Cache Manager...');
    this.setupPerformanceMonitoring();
    this.startPredictiveLoading();
  }
  
  /**
   * Load initial job set and populate buffer
   */
  async loadInitialJobs(jobIds) {
    console.log(`📦 Loading initial ${jobIds.length} jobs...`);
    this.jobQueue = [...jobIds];
    
    // Pre-load first batch
    const initialBatch = jobIds.slice(0, this.bufferSize);
    await this.loadJobBatch(initialBatch);
    
    // Setup buffer queue
    this.bufferQueue = initialBatch.map(id => this.jobCache.get(id));
    
    // Start background prefetching
    this.startPredictiveLoading();
    
    console.log(`✅ Initial buffer loaded: ${this.bufferQueue.length} jobs ready`);
  }
  
  /**
   * Get next job with smooth animation guarantee
   */
  async getNextJob() {
    const startTime = performance.now();
    
    // Update swipe patterns
    this.updateSwipePattern();
    
    // Get job from buffer (should be instant)
    let job = this.bufferQueue.shift();
    
    if (!job) {
      // Cache miss - emergency load
      console.warn('⚠️ Buffer underrun - emergency loading...');
      this.cacheStats.misses++;
      job = await this.loadJob(this.jobQueue[this.currentIndex]);
    } else {
      this.cacheStats.hits++;
    }
    
    this.currentIndex++;
    
    // Maintain buffer in background
    this.maintainBuffer();
    
    // Track performance
    const loadTime = performance.now() - startTime;
    if (loadTime > 16) { // 60fps threshold
      console.warn(`🐌 Slow job fetch: ${loadTime.toFixed(2)}ms`);
    }
    
    return job;
  }
  
  /**
   * Get previous job (for back navigation)
   */
  async getPreviousJob() {
    if (this.currentIndex <= 0) return null;
    
    this.currentIndex--;
    const jobId = this.jobQueue[this.currentIndex];
    
    // Check if already cached
    if (this.jobCache.has(jobId)) {
      this.cacheStats.hits++;
      return this.jobCache.get(jobId);
    }
    
    // Load if not cached
    this.cacheStats.misses++;
    return await this.loadJob(jobId);
  }
  
  /**
   * Pre-load job batch asynchronously
   */
  async loadJobBatch(jobIds) {
    const promises = jobIds.map(id => this.loadJob(id));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to load job ${jobIds[index]}:`, result.reason);
      }
    });
  }
  
  /**
   * Load single job with caching
   */
  async loadJob(jobId) {
    if (this.jobCache.has(jobId)) {
      return this.jobCache.get(jobId);
    }
    
    try {
      // Simulate job loading (replace with actual API call)
      const job = await this.fetchJobData(jobId);
      
      // Cache the job
      this.jobCache.set(jobId, job);
      this.cacheStats.prefetches++;
      
      // Maintain cache size
      this.evictOldEntries();
      
      return job;
    } catch (error) {
      console.error(`Failed to load job ${jobId}:`, error);
      return this.generateFallbackJob(jobId);
    }
  }
  
  /**
   * Maintain buffer by prefetching ahead
   */
  maintainBuffer() {
    const needed = this.bufferSize - this.bufferQueue.length;
    if (needed <= 0) return;
    
    const startIndex = this.currentIndex + this.bufferQueue.length;
    const endIndex = Math.min(startIndex + needed, this.jobQueue.length);
    const jobsToLoad = this.jobQueue.slice(startIndex, endIndex);
    
    if (jobsToLoad.length > 0) {
      this.loadJobBatch(jobsToLoad).then(() => {
        // Add to buffer queue
        jobsToLoad.forEach(id => {
          const job = this.jobCache.get(id);
          if (job) this.bufferQueue.push(job);
        });
      });
    }
  }
  
  /**
   * Predictive prefetching based on user patterns
   */
  startPredictiveLoading() {
    setInterval(() => {
      this.predictivelyPrefetch();
    }, 1000); // Check every second
  }
  
  predictivelyPrefetch() {
    const velocity = this.swipePattern.velocity;
    const direction = this.swipePattern.direction;
    
    // Calculate how far ahead to prefetch based on velocity
    let prefetchDistance = this.prefetchSize;
    if (velocity > 1.0) { // Fast swiping
      prefetchDistance = Math.min(8, this.prefetchSize * 2);
    } else if (velocity < 0.3) { // Slow, deliberate viewing
      prefetchDistance = Math.max(2, Math.floor(this.prefetchSize * 0.7));
    }
    
    const startIndex = this.currentIndex + this.bufferQueue.length;
    const endIndex = Math.min(startIndex + prefetchDistance, this.jobQueue.length);
    
    if (direction === 'forward' && startIndex < this.jobQueue.length) {
      const jobsToFetch = this.jobQueue.slice(startIndex, endIndex)
        .filter(id => !this.jobCache.has(id));
      
      if (jobsToFetch.length > 0) {
        // Background prefetch (non-blocking)
        this.loadJobBatch(jobsToFetch).catch(console.error);
      }
    }
  }
  
  /**
   * Update swipe pattern analysis
   */
  updateSwipePattern() {
    const now = Date.now();
    const timeSinceLastSwipe = now - this.lastSwipeTime;
    
    // Track swipe timing
    this.swipePattern.recentSpeeds.push(timeSinceLastSwipe);
    if (this.swipePattern.recentSpeeds.length > 10) {
      this.swipePattern.recentSpeeds.shift();
    }
    
    // Calculate velocity (swipes per second)
    const avgTime = this.swipePattern.recentSpeeds.reduce((a, b) => a + b, 0) / 
                   this.swipePattern.recentSpeeds.length;
    this.swipePattern.velocity = avgTime > 0 ? 1000 / avgTime : 0;
    this.swipePattern.averageTime = avgTime;
    
    this.lastSwipeTime = now;
  }
  
  /**
   * Animation queue management for smooth transitions
   */
  queueAnimation(animationData) {
    return new Promise((resolve) => {
      this.animationQueue.push({
        ...animationData,
        resolve
      });
      
      if (!this.isAnimating) {
        this.processAnimationQueue();
      }
    });
  }
  
  async processAnimationQueue() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      return;
    }
    
    this.isAnimating = true;
    const animation = this.animationQueue.shift();
    
    try {
      // Execute animation with guaranteed data availability
      await this.executeAnimation(animation);
      animation.resolve();
    } catch (error) {
      console.error('Animation failed:', error);
      animation.resolve(); // Resolve anyway to prevent hanging
    }
    
    // Process next animation
    requestAnimationFrame(() => this.processAnimationQueue());
  }
  
  async executeAnimation(animation) {
    const { type, job, direction, duration = 600 } = animation;
    
    if (type === 'slide') {
      return this.createSlideAnimation(job, direction, duration);
    } else if (type === 'conveyor') {
      return this.createConveyorAnimation(job, duration);
    }
  }
  
  createSlideAnimation(job, direction, duration) {
    return new Promise((resolve) => {
      const startX = direction === 'left' ? 100 : -100;
      const element = document.getElementById('job-card');
      
      if (element) {
        // Set initial position
        element.style.transform = `translateX(${startX}%)`;
        element.style.opacity = '0';
        
        // Update job data
        this.updateJobDisplay(job);
        
        // Animate to center
        requestAnimationFrame(() => {
          element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease`;
          element.style.transform = 'translateX(0%)';
          element.style.opacity = '1';
        });
        
        setTimeout(resolve, duration);
      } else {
        resolve();
      }
    });
  }
  
  createConveyorAnimation(job, duration) {
    return new Promise((resolve) => {
      // Update 3D scene with new sushi
      if (window.sushiScene && window.sushiScene.updateSushi) {
        window.sushiScene.updateSushi(job);
      }
      
      // Animate conveyor movement
      const conveyorElement = document.querySelector('.sushi-conveyor');
      if (conveyorElement) {
        conveyorElement.style.animation = `conveyor-move ${duration}ms linear`;
      }
      
      // Update job display with smooth transition
      this.updateJobDisplaySmooth(job, duration);
      
      setTimeout(resolve, duration);
    });
  }
  
  updateJobDisplay(job) {
    if (!job) return;
    
    const elements = {
      company: document.getElementById('card-company'),
      role: document.getElementById('card-role'),
      salary: document.getElementById('salary-value'),
      fitScore: document.getElementById('fit-score-value'),
      sector: document.getElementById('sector-value'),
      location: document.getElementById('location-value')
    };
    
    if (elements.company) elements.company.textContent = job.company;
    if (elements.role) elements.role.textContent = job.roleTitle;
    if (elements.salary) elements.salary.textContent = job.salary || '$--';
    if (elements.fitScore) elements.fitScore.textContent = job.fitScore?.toFixed(1) || '--';
    if (elements.sector) elements.sector.textContent = job.sector || '--';
    if (elements.location) elements.location.textContent = job.location || '--';
    
    // Update tags
    this.updateSkillTags(job.tags || []);
  }
  
  updateJobDisplaySmooth(job, duration) {
    const fadeOutDuration = duration * 0.3;
    const fadeInDuration = duration * 0.4;
    const updateDelay = fadeOutDuration;
    
    const jobCard = document.getElementById('job-card');
    if (!jobCard) return;
    
    // Fade out
    jobCard.style.transition = `opacity ${fadeOutDuration}ms ease-out`;
    jobCard.style.opacity = '0.3';
    
    // Update content after fade out
    setTimeout(() => {
      this.updateJobDisplay(job);
      
      // Fade in
      jobCard.style.transition = `opacity ${fadeInDuration}ms ease-in`;
      jobCard.style.opacity = '1';
    }, updateDelay);
  }
  
  updateSkillTags(tags) {
    const tagsContainer = document.getElementById('card-tags');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = tags
      .map(tag => `<span class="skill-tag">${tag}</span>`)
      .join('');
  }
  
  /**
   * Cache management
   */
  evictOldEntries() {
    if (this.jobCache.size <= this.maxCacheSize) return;
    
    // Simple LRU eviction (remove entries beyond current viewing window)
    const keepStart = Math.max(0, this.currentIndex - 5);
    const keepEnd = Math.min(this.jobQueue.length, this.currentIndex + this.maxCacheSize);
    
    this.jobCache.forEach((value, key) => {
      const index = this.jobQueue.indexOf(key);
      if (index < keepStart || index > keepEnd) {
        this.jobCache.delete(key);
        this.cacheStats.evictions++;
      }
    });
  }
  
  /**
   * Performance monitoring
   */
  setupPerformanceMonitoring() {
    setInterval(() => {
      this.logCacheStats();
    }, 30000); // Every 30 seconds
  }
  
  logCacheStats() {
    const hitRate = (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1);
    
    console.log(`📊 Cache Stats: ${hitRate}% hit rate, ${this.jobCache.size} cached, ${this.bufferQueue.length} buffered`);
    
    if (parseFloat(hitRate) < 90) {
      console.warn('⚠️ Low cache hit rate - consider increasing buffer size');
    }
  }
  
  /**
   * Data fetching (implement with actual API)
   */
  async fetchJobData(jobId) {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    // Return mock job data (replace with actual API call)
    return this.generateMockJob(jobId);
  }
  
  generateMockJob(jobId) {
    const companies = ['Google', 'Apple', 'Microsoft', 'Stripe', 'Airbnb', 'Uber', 'Netflix'];
    const roles = ['Senior Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager'];
    const sectors = ['Tech', 'Fintech', 'Healthcare', 'E-commerce'];
    const locations = ['San Francisco', 'New York', 'Seattle', 'Austin'];
    const skills = ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Kubernetes'];
    
    return {
      id: jobId,
      company: companies[Math.floor(Math.random() * companies.length)],
      roleTitle: roles[Math.floor(Math.random() * roles.length)],
      sector: sectors[Math.floor(Math.random() * sectors.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      salary: `$${150 + Math.floor(Math.random() * 100)}k - $${200 + Math.floor(Math.random() * 150)}k`,
      fitScore: Math.random() * 3 + 7, // 7-10 range
      tags: skills.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3))
    };
  }
  
  generateFallbackJob(jobId) {
    return {
      id: jobId,
      company: 'Loading...',
      roleTitle: 'Please wait...',
      sector: '--',
      location: '--',
      salary: '$--',
      fitScore: 0,
      tags: []
    };
  }
  
  /**
   * Public API
   */
  getCacheSize() {
    return this.jobCache.size;
  }
  
  getBufferStatus() {
    return {
      bufferSize: this.bufferQueue.length,
      targetSize: this.bufferSize,
      cacheHitRate: (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)
    };
  }
  
  getSwipePattern() {
    return { ...this.swipePattern };
  }
  
  // Preload specific job IDs
  async preloadJobs(jobIds) {
    return this.loadJobBatch(jobIds);
  }
  
  // Reset cache and patterns
  reset() {
    this.jobCache.clear();
    this.bufferQueue = [];
    this.currentIndex = 0;
    this.swipePattern.recentSpeeds = [];
    this.cacheStats = { hits: 0, misses: 0, prefetches: 0, evictions: 0 };
  }
}

// Expose for global use
window.ConveyorCacheManager = ConveyorCacheManager;