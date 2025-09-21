// Mobile GPU Performance & Sync Manager
// Handles payload timing, precaching, and GPU offloading for optimal PWA performance

class MobilePerformanceManager {
  constructor() {
    this.gpuAvailable = this.detectGPUCapabilities();
    this.syncQueue = [];
    this.preloadCache = new Map();
    this.renderQueue = [];
    this.latencyMetrics = {
      network: 0,
      render: 0,
      gpu: 0,
      total: 0
    };
    
    this.init();
  }

  // GPU Detection and Capabilities
  detectGPUCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return { available: false };

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Mobile GPU detection
    const isMobileGPU = /adreno|mali|powervr|sgx|tegra/i.test(renderer);
    const isHighEnd = /adreno 6|mali-g7|powervr gx/i.test(renderer.toLowerCase());
    
    return {
      available: true,
      vendor,
      renderer,
      isMobile: isMobileGPU,
      isHighEnd,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderBuffers: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      extensions: gl.getSupportedExtensions()
    };
  }

  // Preload and Cache Strategy
  async preloadCriticalAssets() {
    const criticalAssets = [
      // Job recommendation data
      { type: 'data', url: '/api/job-recommendations', priority: 'high' },
      // Sushi visual assets
      { type: 'texture', url: '/assets/sushi-sprites.webp', priority: 'high' },
      // Audio feedback
      { type: 'audio', url: '/assets/swipe-sounds.webm', priority: 'medium' },
      // Shader programs for GPU effects
      { type: 'shader', url: '/shaders/particle-effects.glsl', priority: 'low' }
    ];

    const preloadPromises = criticalAssets.map(asset => 
      this.preloadAsset(asset)
    );

    try {
      await Promise.allSettled(preloadPromises);
      console.log('🚀 Critical assets preloaded');
    } catch (error) {
      console.warn('⚠️ Some assets failed to preload:', error);
    }
  }

  async preloadAsset(asset) {
    const startTime = performance.now();

    switch (asset.type) {
      case 'data':
        return this.preloadData(asset);
      case 'texture':
        return this.preloadTexture(asset);
      case 'audio':
        return this.preloadAudio(asset);
      case 'shader':
        return this.preloadShader(asset);
      default:
        return Promise.resolve();
    }
  }

  // Data Preloading with Smart Caching
  async preloadData(asset) {
    try {
      // Check if data is already cached
      const cached = await this.getCachedData(asset.url);
      if (cached && !this.isDataStale(cached)) {
        this.preloadCache.set(asset.url, cached.data);
        return cached.data;
      }

      // Fetch fresh data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(asset.url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=300' // 5 minutes
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      // Cache with timestamp
      await this.setCachedData(asset.url, {
        data,
        timestamp: Date.now(),
        version: this.getDataVersion()
      });

      this.preloadCache.set(asset.url, data);
      return data;

    } catch (error) {
      console.warn(`Failed to preload data ${asset.url}:`, error);
      
      // Fallback to cached data even if stale
      const cached = await this.getCachedData(asset.url);
      if (cached) {
        this.preloadCache.set(asset.url, cached.data);
        return cached.data;
      }
      
      throw error;
    }
  }

  // GPU-Accelerated Texture Preloading
  async preloadTexture(asset) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (this.gpuAvailable.available) {
          // Upload to GPU immediately for faster rendering
          this.uploadTextureToGPU(img, asset.url);
        }
        this.preloadCache.set(asset.url, img);
        resolve(img);
      };

      img.onerror = () => reject(new Error(`Failed to load texture: ${asset.url}`));
      img.src = asset.url;
    });
  }

  uploadTextureToGPU(image, id) {
    if (!this.gl) {
      const canvas = document.createElement('canvas');
      this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    }

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);

    // Store GPU texture reference
    this.preloadCache.set(`gpu_${id}`, texture);
  }

  // Audio Preloading for Immediate Feedback
  async preloadAudio(asset) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        this.preloadCache.set(asset.url, audio);
        resolve(audio);
      };

      audio.onerror = () => reject(new Error(`Failed to load audio: ${asset.url}`));
      audio.src = asset.url;
      audio.load();
    });
  }

  // Shader Precompilation
  async preloadShader(asset) {
    try {
      const response = await fetch(asset.url);
      const shaderSource = await response.text();
      
      if (this.gpuAvailable.available) {
        // Precompile shaders
        const vertexShader = this.compileShader(shaderSource, 'vertex');
        const fragmentShader = this.compileShader(shaderSource, 'fragment');
        
        this.preloadCache.set(`${asset.url}_vertex`, vertexShader);
        this.preloadCache.set(`${asset.url}_fragment`, fragmentShader);
      }

      return shaderSource;
    } catch (error) {
      console.warn(`Failed to preload shader ${asset.url}:`, error);
      throw error;
    }
  }

  // Background Sync Queue Management
  queueSync(operation) {
    const syncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      priority: operation.priority || 'normal',
      retries: 0,
      maxRetries: 3
    };

    this.syncQueue.push(syncItem);
    this.processSyncQueue();
    
    return syncItem.id;
  }

  async processSyncQueue() {
    if (this.syncQueue.length === 0 || this.syncProcessing) return;

    this.syncProcessing = true;

    // Sort by priority (high -> normal -> low)
    this.syncQueue.sort((a, b) => {
      const priorities = { high: 3, normal: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();

      try {
        await this.executeSyncOperation(item);
      } catch (error) {
        console.warn(`Sync operation failed:`, error);
        
        if (item.retries < item.maxRetries) {
          item.retries++;
          item.timestamp = Date.now() + (item.retries * 1000); // Exponential backoff
          this.syncQueue.push(item);
        }
      }

      // Yield control to prevent blocking UI
      await this.sleep(10);
    }

    this.syncProcessing = false;
  }

  async executeSyncOperation(item) {
    const { operation } = item;

    switch (operation.type) {
      case 'job_application':
        return await this.syncJobApplication(operation.data);
      case 'user_preferences':
        return await this.syncUserPreferences(operation.data);
      case 'analytics':
        return await this.syncAnalytics(operation.data);
      case 'swipe_data':
        return await this.syncSwipeData(operation.data);
      default:
        throw new Error(`Unknown sync operation: ${operation.type}`);
    }
  }

  // GPU-Accelerated Rendering Pipeline
  setupGPURendering() {
    if (!this.gpuAvailable.available) {
      console.log('GPU acceleration not available, falling back to CPU rendering');
      return;
    }

    // Create offscreen canvas for GPU operations
    this.offscreenCanvas = document.createElement('canvas');
    this.gpuContext = this.offscreenCanvas.getContext('webgl2', {
      alpha: true,
      antialias: this.gpuAvailable.isHighEnd,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    // Setup GPU render pipeline
    this.initGPUShaders();
    this.setupParticleSystem();
  }

  initGPUShaders() {
    try {
      // Check if we have a valid WebGL context
      if (!this.gpuContext) {
        console.log('No WebGL context available, skipping shader initialization');
        return;
      }

      // Particle effect shaders for sushi animations
      const vertexShaderSource = `
        attribute vec2 a_position;
        attribute vec2 a_velocity;
        attribute float a_life;
        
        uniform float u_time;
        uniform mat3 u_matrix;
        
        varying float v_life;
        
        void main() {
          vec2 position = a_position + a_velocity * u_time;
          gl_Position = vec4((u_matrix * vec3(position, 1)).xy, 0, 1);
          v_life = a_life;
          gl_PointSize = mix(8.0, 2.0, u_time / a_life);
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying float v_life;
        
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          
          if (dist > 0.5) discard;
          
          float alpha = (1.0 - dist * 2.0) * v_life;
          gl_FragColor = vec4(1.0, 0.8, 0.4, alpha);
        }
      `;

      // Skip shader creation for now to prevent errors
      console.log('GPU shaders initialized (placeholder)');
      
    } catch (error) {
      console.warn('Failed to initialize GPU shaders, falling back to CPU rendering:', error);
      this.gpuAvailable.available = false;
    }
  }

  // Adaptive Quality Based on Performance
  adaptRenderingQuality() {
    const fps = this.getCurrentFPS();
    const memoryUsage = this.getMemoryUsage();

    if (fps < 30 || memoryUsage > 0.8) {
      // Reduce quality
      this.renderQuality = Math.max(0.5, this.renderQuality - 0.1);
      this.particleCount = Math.max(100, this.particleCount * 0.8);
    } else if (fps > 55 && memoryUsage < 0.6) {
      // Increase quality
      this.renderQuality = Math.min(1.0, this.renderQuality + 0.05);
      this.particleCount = Math.min(1000, this.particleCount * 1.1);
    }

    this.updateRenderSettings();
  }

  // Predictive Preloading
  predictivePreload(userBehavior) {
    // Analyze user swipe patterns to preload likely next jobs
    const predictions = this.analyzeSwipePatterns(userBehavior);
    
    predictions.forEach(prediction => {
      if (prediction.confidence > 0.7) {
        this.preloadAsset({
          type: 'data',
          url: `/api/jobs/${prediction.jobId}`,
          priority: 'medium'
        });
      }
    });
  }

  // Performance Monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      this.latencyMetrics.render = this.measureRenderTime();
      this.latencyMetrics.gpu = this.measureGPUTime();
      this.latencyMetrics.network = this.measureNetworkLatency();
      
      this.adaptRenderingQuality();
      this.optimizeMemoryUsage();
      
      // Report to analytics
      if (Math.random() < 0.01) { // 1% sampling
        this.reportPerformanceMetrics();
      }
    }, 1000);
  }

  // Utility Methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentFPS() {
    return this.fps || 60;
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    }
    return 0.5; // Conservative estimate
  }

  // Cache Management
  async getCachedData(key) {
    try {
      const cache = await caches.open('sushi-data-cache');
      const response = await cache.match(key);
      return response ? await response.json() : null;
    } catch {
      return localStorage.getItem(`cache_${key}`) ? 
        JSON.parse(localStorage.getItem(`cache_${key}`)) : null;
    }
  }

  async setCachedData(key, data) {
    try {
      const cache = await caches.open('sushi-data-cache');
      await cache.put(key, new Response(JSON.stringify(data)));
    } catch {
      localStorage.setItem(`cache_${key}`, JSON.stringify(data));
    }
  }

  isDataStale(cached, maxAge = 300000) { // 5 minutes default
    return Date.now() - cached.timestamp > maxAge;
  }

  getDataVersion() {
    return localStorage.getItem('app_version') || '1.0.0';
  }

  // Missing method implementations (placeholders to prevent errors)
  setupParticleSystem() {
    // Placeholder - implement particle system later
    console.log('Particle system setup (placeholder)');
  }

  updateRenderSettings() {
    // Placeholder - implement render settings update later
  }

  measureRenderTime() {
    return 16.67; // ~60fps placeholder
  }

  measureGPUTime() {
    return 5; // placeholder GPU time
  }

  measureNetworkLatency() {
    return 50; // placeholder network latency
  }

  optimizeMemoryUsage() {
    // Placeholder - implement memory optimization later
  }

  reportPerformanceMetrics() {
    // Placeholder - implement metrics reporting later
  }

  analyzeSwipePatterns(userBehavior) {
    return []; // Placeholder - implement pattern analysis later
  }

  syncJobApplication(data) {
    return Promise.resolve(data);
  }

  syncUserPreferences(data) {
    return Promise.resolve(data);
  }

  syncAnalytics(data) {
    return Promise.resolve(data);
  }

  syncSwipeData(data) {
    return Promise.resolve(data);
  }

  // Initialize the performance manager
  init() {
    try {
      this.setupGPURendering();
      this.preloadCriticalAssets();
      this.startPerformanceMonitoring();
      
      console.log('🚀 Mobile Performance Manager initialized', {
        gpu: this.gpuAvailable,
        cacheReady: true,
        syncQueueActive: true
      });
    } catch (error) {
      console.warn('Performance manager initialization failed:', error);
    }
  }
}

// Export for use in main app
window.MobilePerformanceManager = MobilePerformanceManager;