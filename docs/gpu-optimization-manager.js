/**
 * GPU Hardware Detection and Optimization Manager
 * Automatically detects client hardware capabilities and optimizes rendering accordingly
 */

class GPUOptimizationManager {
  constructor() {
    this.hardwareProfile = null;
    this.gpuInfo = null;
    this.performanceProfile = 'auto';
    this.capabilities = {};
    this.benchmarkResults = {};
    this.adaptiveSettings = {};
    
    // Performance thresholds
    this.targetFPS = 60;
    this.minFPS = 30;
    this.frameTimeBuffer = [];
    this.maxFrameTimeBufferSize = 60; // 1 second at 60fps
    
    this.init();
  }
  
  async init() {
    console.log('🔧 Initializing GPU Hardware Detection...');
    
    await this.detectHardware();
    this.analyzeCapabilities();
    this.createPerformanceProfile();
    this.setupAdaptiveRendering();
    
    console.log('✅ GPU Optimization Manager initialized');
    console.log('📊 Hardware Profile:', this.hardwareProfile);
    console.log('⚙️ Performance Settings:', this.adaptiveSettings);
  }
  
  async detectHardware() {
    // Create temporary canvas for GPU detection
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    // Get GPU renderer info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      this.gpuInfo = {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      };
    }
    
    // Detect WebGL capabilities
    this.capabilities = {
      webgl2: !!gl.getExtension,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      
      // Extension support
      extensions: {
        anisotropicFiltering: !!gl.getExtension('EXT_texture_filter_anisotropic'),
        floatTextures: !!gl.getExtension('OES_texture_float'),
        halfFloatTextures: !!gl.getExtension('OES_texture_half_float'),
        depthTextures: !!gl.getExtension('WEBGL_depth_texture'),
        drawBuffers: !!gl.getExtension('WEBGL_draw_buffers'),
        instancing: !!gl.getExtension('ANGLE_instanced_arrays'),
        vertexArrayObject: !!gl.getExtension('OES_vertex_array_object')
      }
    };
    
    // Get max anisotropy if supported
    if (this.capabilities.extensions.anisotropicFiltering) {
      const anisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
      this.capabilities.maxAnisotropy = gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }
    
    // Device detection
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    this.hardwareProfile = {
      // Device type
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      
      // Platform specifics
      isMac: /Mac/i.test(platform),
      isWindows: /Win/i.test(platform),
      isLinux: /Linux/i.test(platform),
      isIOS: /iPad|iPhone|iPod/i.test(userAgent),
      isAndroid: /Android/i.test(userAgent),
      
      // CPU info
      cpuCores: navigator.hardwareConcurrency || 4,
      
      // Memory (approximate)
      deviceMemory: navigator.deviceMemory || 4,
      
      // Network
      effectiveType: navigator.connection?.effectiveType || '4g',
      
      // Screen
      screenWidth: screen.width,
      screenHeight: screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      
      // GPU info
      gpu: this.gpuInfo
    };
    
    // Clean up
    canvas.remove();
  }
  
  analyzeCapabilities() {
    // Analyze GPU vendor and model for performance characteristics
    let gpuTier = 'medium';
    
    if (this.gpuInfo) {
      const vendor = this.gpuInfo.vendor.toLowerCase();
      const renderer = this.gpuInfo.renderer.toLowerCase();
      
      // High-end GPUs
      if (
        renderer.includes('rtx') ||
        renderer.includes('gtx 1080') ||
        renderer.includes('gtx 1070') ||
        renderer.includes('rx 6') ||
        renderer.includes('rx 7') ||
        renderer.includes('m1') ||
        renderer.includes('m2') ||
        renderer.includes('m3')
      ) {
        gpuTier = 'high';
      }
      
      // Low-end GPUs
      else if (
        renderer.includes('intel hd') ||
        renderer.includes('intel uhd') ||
        renderer.includes('intel iris') ||
        renderer.includes('adreno 5') ||
        renderer.includes('mali-g') ||
        renderer.includes('powervr')
      ) {
        gpuTier = 'low';
      }
      
      // Mobile GPUs
      if (this.hardwareProfile.isMobile) {
        if (
          renderer.includes('adreno 7') ||
          renderer.includes('mali-g78') ||
          renderer.includes('mali-g710') ||
          renderer.includes('apple a15') ||
          renderer.includes('apple a16') ||
          renderer.includes('apple a17')
        ) {
          gpuTier = 'high';
        } else if (
          renderer.includes('adreno 6') ||
          renderer.includes('mali-g76') ||
          renderer.includes('apple a12') ||
          renderer.includes('apple a13') ||
          renderer.includes('apple a14')
        ) {
          gpuTier = 'medium';
        } else {
          gpuTier = 'low';
        }
      }
    }
    
    this.hardwareProfile.gpuTier = gpuTier;
    
    console.log(`🎮 GPU Tier detected: ${gpuTier}`);
    console.log(`📱 Device: ${this.hardwareProfile.isMobile ? 'Mobile' : 'Desktop'}`);
    console.log(`💾 Device Memory: ${this.hardwareProfile.deviceMemory}GB`);
    console.log(`⚡ CPU Cores: ${this.hardwareProfile.cpuCores}`);
  }
  
  createPerformanceProfile() {
    const { gpuTier, isMobile, deviceMemory, cpuCores, pixelRatio } = this.hardwareProfile;
    
    // Base settings by tier
    const profiles = {
      high: {
        shadowMapSize: 2048,
        textureQuality: 'high',
        anisotropy: Math.min(16, this.capabilities.maxAnisotropy || 1),
        antialias: true,
        toneMappingExposure: 1.2,
        pixelRatioMultiplier: Math.min(2, pixelRatio),
        maxLights: 8,
        lodBias: 0,
        particleCount: 500,
        reflectionProbes: true,
        screenSpaceReflections: true,
        bloom: true,
        motionBlur: true
      },
      
      medium: {
        shadowMapSize: 1024,
        textureQuality: 'medium',
        anisotropy: Math.min(8, this.capabilities.maxAnisotropy || 1),
        antialias: true,
        toneMappingExposure: 1.1,
        pixelRatioMultiplier: Math.min(1.5, pixelRatio),
        maxLights: 4,
        lodBias: 0.2,
        particleCount: 250,
        reflectionProbes: false,
        screenSpaceReflections: false,
        bloom: true,
        motionBlur: false
      },
      
      low: {
        shadowMapSize: 512,
        textureQuality: 'low',
        anisotropy: Math.min(4, this.capabilities.maxAnisotropy || 1),
        antialias: false,
        toneMappingExposure: 1.0,
        pixelRatioMultiplier: 1,
        maxLights: 2,
        lodBias: 0.5,
        particleCount: 100,
        reflectionProbes: false,
        screenSpaceReflections: false,
        bloom: false,
        motionBlur: false
      }
    };
    
    this.adaptiveSettings = { ...profiles[gpuTier] };
    
    // Mobile optimizations
    if (isMobile) {
      this.adaptiveSettings.shadowMapSize = Math.min(this.adaptiveSettings.shadowMapSize, 1024);
      this.adaptiveSettings.pixelRatioMultiplier = Math.min(this.adaptiveSettings.pixelRatioMultiplier, 1.5);
      this.adaptiveSettings.particleCount *= 0.5;
      this.adaptiveSettings.maxLights = Math.min(this.adaptiveSettings.maxLights, 3);
    }
    
    // Memory constraints
    if (deviceMemory < 4) {
      this.adaptiveSettings.textureQuality = 'low';
      this.adaptiveSettings.shadowMapSize = Math.min(this.adaptiveSettings.shadowMapSize, 512);
      this.adaptiveSettings.particleCount *= 0.5;
    }
    
    // CPU constraints
    if (cpuCores < 4) {
      this.adaptiveSettings.particleCount *= 0.7;
      this.adaptiveSettings.lodBias += 0.1;
    }
    
    console.log('⚙️ Performance profile created:', this.adaptiveSettings);
  }
  
  setupAdaptiveRendering() {
    // Performance monitoring
    this.performanceMonitor = {
      frameCount: 0,
      lastTime: performance.now(),
      avgFrameTime: 16.67, // Target 60fps
      performanceHistory: [],
      adaptationCooldown: 0
    };
    
    // Start monitoring
    this.startPerformanceMonitoring();
    
    // Thermal throttling detection
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('chargingchange', () => {
          if (!battery.charging) {
            this.enablePowerSaveMode();
          }
        });
      });
    }
  }
  
  startPerformanceMonitoring() {
    const monitor = () => {
      const now = performance.now();
      const frameTime = now - this.performanceMonitor.lastTime;
      
      this.frameTimeBuffer.push(frameTime);
      if (this.frameTimeBuffer.length > this.maxFrameTimeBufferSize) {
        this.frameTimeBuffer.shift();
      }
      
      // Calculate average frame time over last second
      if (this.frameTimeBuffer.length >= 30) { // At least 30 frames
        const avgFrameTime = this.frameTimeBuffer.reduce((a, b) => a + b) / this.frameTimeBuffer.length;
        const currentFPS = 1000 / avgFrameTime;
        
        this.performanceMonitor.avgFrameTime = avgFrameTime;
        this.performanceMonitor.lastTime = now;
        
        // Adaptive quality adjustment
        this.adaptQuality(currentFPS);
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }
  
  adaptQuality(currentFPS) {
    // Cooldown to prevent oscillation
    if (this.performanceMonitor.adaptationCooldown > 0) {
      this.performanceMonitor.adaptationCooldown--;
      return;
    }
    
    const targetFPS = this.targetFPS;
    const minFPS = this.minFPS;
    
    // Performance is too low - reduce quality
    if (currentFPS < minFPS) {
      console.warn(`⚠️ Performance below ${minFPS}fps (${currentFPS.toFixed(1)}), reducing quality`);
      this.reduceQuality();
      this.performanceMonitor.adaptationCooldown = 60; // Wait 1 second before next adaptation
    }
    
    // Performance is good - try to increase quality
    else if (currentFPS > targetFPS + 10 && this.canIncreaseQuality()) {
      console.log(`📈 Performance above target (${currentFPS.toFixed(1)}fps), increasing quality`);
      this.increaseQuality();
      this.performanceMonitor.adaptationCooldown = 120; // Wait 2 seconds before next adaptation
    }
  }
  
  reduceQuality() {
    const settings = this.adaptiveSettings;
    
    // Reduce settings in order of visual impact vs performance gain
    if (settings.bloom) {
      settings.bloom = false;
      console.log('🔧 Disabled bloom');
      return;
    }
    
    if (settings.screenSpaceReflections) {
      settings.screenSpaceReflections = false;
      console.log('🔧 Disabled screen space reflections');
      return;
    }
    
    if (settings.motionBlur) {
      settings.motionBlur = false;
      console.log('🔧 Disabled motion blur');
      return;
    }
    
    if (settings.shadowMapSize > 256) {
      settings.shadowMapSize = Math.max(256, settings.shadowMapSize / 2);
      console.log(`🔧 Reduced shadow map size to ${settings.shadowMapSize}`);
      return;
    }
    
    if (settings.pixelRatioMultiplier > 0.75) {
      settings.pixelRatioMultiplier = Math.max(0.75, settings.pixelRatioMultiplier - 0.25);
      console.log(`🔧 Reduced pixel ratio to ${settings.pixelRatioMultiplier}`);
      return;
    }
    
    if (settings.anisotropy > 1) {
      settings.anisotropy = Math.max(1, settings.anisotropy / 2);
      console.log(`🔧 Reduced anisotropy to ${settings.anisotropy}`);
      return;
    }
    
    if (settings.particleCount > 50) {
      settings.particleCount = Math.max(50, Math.floor(settings.particleCount * 0.7));
      console.log(`🔧 Reduced particles to ${settings.particleCount}`);
      return;
    }
    
    if (settings.maxLights > 1) {
      settings.maxLights = Math.max(1, settings.maxLights - 1);
      console.log(`🔧 Reduced lights to ${settings.maxLights}`);
      return;
    }
    
    if (settings.antialias) {
      settings.antialias = false;
      console.log('🔧 Disabled antialiasing');
      return;
    }
    
    console.log('⚠️ Already at minimum quality settings');
  }
  
  increaseQuality() {
    const settings = this.adaptiveSettings;
    const originalProfile = this.getOriginalProfile();
    
    // Increase settings in reverse order of reduction
    if (!settings.antialias && originalProfile.antialias) {
      settings.antialias = true;
      console.log('🔧 Enabled antialiasing');
      return;
    }
    
    if (settings.maxLights < originalProfile.maxLights) {
      settings.maxLights = Math.min(originalProfile.maxLights, settings.maxLights + 1);
      console.log(`🔧 Increased lights to ${settings.maxLights}`);
      return;
    }
    
    if (settings.particleCount < originalProfile.particleCount) {
      settings.particleCount = Math.min(originalProfile.particleCount, Math.floor(settings.particleCount * 1.3));
      console.log(`🔧 Increased particles to ${settings.particleCount}`);
      return;
    }
    
    if (settings.anisotropy < originalProfile.anisotropy) {
      settings.anisotropy = Math.min(originalProfile.anisotropy, settings.anisotropy * 2);
      console.log(`🔧 Increased anisotropy to ${settings.anisotropy}`);
      return;
    }
    
    if (settings.pixelRatioMultiplier < originalProfile.pixelRatioMultiplier) {
      settings.pixelRatioMultiplier = Math.min(originalProfile.pixelRatioMultiplier, settings.pixelRatioMultiplier + 0.25);
      console.log(`🔧 Increased pixel ratio to ${settings.pixelRatioMultiplier}`);
      return;
    }
    
    if (settings.shadowMapSize < originalProfile.shadowMapSize) {
      settings.shadowMapSize = Math.min(originalProfile.shadowMapSize, settings.shadowMapSize * 2);
      console.log(`🔧 Increased shadow map size to ${settings.shadowMapSize}`);
      return;
    }
    
    if (!settings.bloom && originalProfile.bloom) {
      settings.bloom = true;
      console.log('🔧 Enabled bloom');
      return;
    }
    
    console.log('✅ Already at maximum quality settings');
  }
  
  canIncreaseQuality() {
    const settings = this.adaptiveSettings;
    const original = this.getOriginalProfile();
    
    return (
      !settings.antialias && original.antialias ||
      settings.maxLights < original.maxLights ||
      settings.particleCount < original.particleCount ||
      settings.anisotropy < original.anisotropy ||
      settings.pixelRatioMultiplier < original.pixelRatioMultiplier ||
      settings.shadowMapSize < original.shadowMapSize ||
      !settings.bloom && original.bloom
    );
  }
  
  getOriginalProfile() {
    // Return the original profile based on detected tier
    const profiles = {
      high: {
        shadowMapSize: 2048,
        anisotropy: Math.min(16, this.capabilities.maxAnisotropy || 1),
        antialias: true,
        pixelRatioMultiplier: Math.min(2, this.hardwareProfile.pixelRatio),
        maxLights: 8,
        particleCount: 500,
        bloom: true
      },
      medium: {
        shadowMapSize: 1024,
        anisotropy: Math.min(8, this.capabilities.maxAnisotropy || 1),
        antialias: true,
        pixelRatioMultiplier: Math.min(1.5, this.hardwareProfile.pixelRatio),
        maxLights: 4,
        particleCount: 250,
        bloom: true
      },
      low: {
        shadowMapSize: 512,
        anisotropy: Math.min(4, this.capabilities.maxAnisotropy || 1),
        antialias: false,
        pixelRatioMultiplier: 1,
        maxLights: 2,
        particleCount: 100,
        bloom: false
      }
    };
    
    return profiles[this.hardwareProfile.gpuTier];
  }
  
  enablePowerSaveMode() {
    console.log('🔋 Enabling power save mode');
    
    // Reduce performance settings for battery conservation
    this.adaptiveSettings.pixelRatioMultiplier *= 0.8;
    this.adaptiveSettings.shadowMapSize = Math.max(256, this.adaptiveSettings.shadowMapSize / 2);
    this.adaptiveSettings.particleCount = Math.floor(this.adaptiveSettings.particleCount * 0.5);
    this.adaptiveSettings.bloom = false;
    this.adaptiveSettings.motionBlur = false;
    this.adaptiveSettings.maxLights = Math.max(1, this.adaptiveSettings.maxLights - 1);
    
    // Reduce target FPS
    this.targetFPS = 30;
  }
  
  // GPU memory management
  getGPUMemoryEstimate() {
    const settings = this.adaptiveSettings;
    
    // Estimate memory usage based on current settings
    const shadowMapMemory = (settings.shadowMapSize * settings.shadowMapSize * 4) / (1024 * 1024); // MB
    const textureMemory = this.estimateTextureMemory();
    const geometryMemory = this.estimateGeometryMemory();
    
    return {
      shadowMaps: shadowMapMemory,
      textures: textureMemory,
      geometry: geometryMemory,
      total: shadowMapMemory + textureMemory + geometryMemory
    };
  }
  
  estimateTextureMemory() {
    // Rough estimate based on quality settings
    const qualityMultipliers = {
      high: 1.0,
      medium: 0.6,
      low: 0.3
    };
    
    const baseMemory = 64; // MB base estimate for sushi textures
    return baseMemory * (qualityMultipliers[this.adaptiveSettings.textureQuality] || 0.6);
  }
  
  estimateGeometryMemory() {
    // Estimate based on particle count and model complexity
    const particleMemory = (this.adaptiveSettings.particleCount * 32) / (1024 * 1024); // MB
    const modelMemory = 16; // MB estimate for sushi models
    
    return particleMemory + modelMemory;
  }
  
  // Public API
  getOptimizedSettings() {
    return { ...this.adaptiveSettings };
  }
  
  getCurrentFPS() {
    return Math.round(1000 / this.performanceMonitor.avgFrameTime);
  }
  
  getHardwareProfile() {
    return { ...this.hardwareProfile };
  }
  
  getCapabilities() {
    return { ...this.capabilities };
  }
  
  // Force quality level (for user settings)
  setQualityLevel(level) {
    if (['low', 'medium', 'high'].includes(level)) {
      this.hardwareProfile.gpuTier = level;
      this.createPerformanceProfile();
      console.log(`🎮 Quality level set to: ${level}`);
    }
  }
  
  // Get performance statistics
  getPerformanceStats() {
    const memoryUsage = this.getGPUMemoryEstimate();
    
    return {
      fps: this.getCurrentFPS(),
      frameTime: this.performanceMonitor.avgFrameTime,
      gpuTier: this.hardwareProfile.gpuTier,
      qualityLevel: this.adaptiveSettings.textureQuality,
      memoryUsage,
      adaptiveSettings: this.getOptimizedSettings()
    };
  }
}

export default GPUOptimizationManager;