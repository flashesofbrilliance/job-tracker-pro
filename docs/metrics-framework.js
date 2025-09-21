// Performance Benchmarks & UX Metrics Framework
// Comprehensive testing suite for Sushi Discovery PWA

class UXMetricsFramework {
  constructor() {
    this.benchmarks = {
      performance: {
        // Core Web Vitals
        LCP: { target: 2500, warning: 4000 }, // Largest Contentful Paint
        FID: { target: 100, warning: 300 },   // First Input Delay
        CLS: { target: 0.1, warning: 0.25 },  // Cumulative Layout Shift
        
        // Custom Sushi App Metrics
        TTI: { target: 1500, warning: 3000 }, // Time to Interactive
        TTFB: { target: 600, warning: 1500 }, // Time to First Byte
        FCT: { target: 800, warning: 1600 },  // First Contentful Paint
        
        // Interaction Metrics
        swipeResponseTime: { target: 50, warning: 100 },
        cardTransitionTime: { target: 250, warning: 500 },
        chefMessageDelay: { target: 200, warning: 400 },
        
        // GPU/Rendering
        frameRate: { target: 60, warning: 30 },
        memoryUsage: { target: 50, warning: 80 }, // % of available
        batteryImpact: { target: 'low', warning: 'medium' }
      },
      
      usability: {
        // Time-based Metrics
        timeToFirstSwipe: { target: 5000, warning: 10000 },
        averageSessionDuration: { target: 180000, warning: 60000 }, // 3+ minutes
        swipesPerMinute: { target: 20, warning: 10 },
        
        // Success Metrics  
        jobDiscoverySuccess: { target: 0.3, warning: 0.15 }, // % finding relevant jobs
        streakAchievement: { target: 0.6, warning: 0.3 },   // % achieving 3+ streaks
        chefInteractionEngagement: { target: 0.8, warning: 0.5 },
        
        // Error/Frustration Metrics
        errorRate: { target: 0.02, warning: 0.05 },
        abandonmentRate: { target: 0.15, warning: 0.3 },
        backTrackingRate: { target: 0.1, warning: 0.25 } // returning to previous cards
      },
      
      accessibility: {
        // Touch Target Compliance
        minimumTouchSize: { target: 44, warning: 32 }, // px
        touchTargetSpacing: { target: 8, warning: 4 },
        
        // Screen Reader Support
        altTextCoverage: { target: 1.0, warning: 0.9 },
        ariaLabelCompliance: { target: 1.0, warning: 0.85 },
        keyboardNavigability: { target: 1.0, warning: 0.9 },
        
        // Color & Contrast
        contrastRatio: { target: 4.5, warning: 3.0 },
        colorBlindnessFriendly: { target: 1.0, warning: 0.8 }
      }
    };
    
    this.biometricTracking = {
      eyeTracking: null,
      facialRecognition: null,
      voiceAnalysis: null,
      enabled: false
    };
    
    this.realTimeMetrics = new Map();
    this.sessionData = [];
    this.A11yChecker = null;
    
    this.init();
  }

  // Initialize metrics collection
  init() {
    this.setupPerformanceObservers();
    this.initializeBiometricTracking();
    this.setupInteractionTracking();
    this.createMetricsDashboard();
    
    console.log('📊 UX Metrics Framework initialized');
  }

  // Performance Monitoring Setup
  setupPerformanceObservers() {
    // Core Web Vitals
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            this.recordMetric('LCP', entry.startTime);
            break;
          case 'first-input':
            this.recordMetric('FID', entry.processingStart - entry.startTime);
            break;
          case 'layout-shift':
            if (!entry.hadRecentInput) {
              this.recordMetric('CLS', entry.value);
            }
            break;
          case 'navigation':
            this.recordMetric('TTFB', entry.responseStart);
            break;
        }
      }
    }).observe({ 
      entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] 
    });

    // Custom Performance Metrics
    this.trackTimeToInteractive();
    this.monitorFrameRate();
    this.trackMemoryUsage();
  }

  // Biometric Tracking Integration
  async initializeBiometricTracking() {
    if (!navigator.mediaDevices || !window.location.protocol === 'https:') {
      console.log('📷 Biometric tracking requires HTTPS and camera permissions');
      return;
    }

    try {
      // Request camera permission for eye tracking and facial analysis
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          frameRate: 30 
        } 
      });

      this.setupEyeTracking(stream);
      this.setupFacialRecognition(stream);
      this.biometricTracking.enabled = true;

    } catch (error) {
      console.log('📷 Camera access denied, skipping biometric tracking');
    }
  }

  setupEyeTracking(stream) {
    // Simplified eye tracking implementation
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Eye tracking analysis every 100ms
    setInterval(() => {
      if (this.biometricTracking.enabled) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const eyeData = this.analyzeEyeMovement(imageData);
        this.recordBiometricData('eyeTracking', {
          gazePoint: eyeData.gazePoint,
          blinkRate: eyeData.blinkRate,
          fixationDuration: eyeData.fixationDuration,
          saccadeVelocity: eyeData.saccadeVelocity,
          timestamp: Date.now()
        });
      }
    }, 100);
  }

  setupFacialRecognition(stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();

    // Facial expression analysis every 500ms
    setInterval(() => {
      if (this.biometricTracking.enabled) {
        const emotionData = this.analyzeFacialExpression(video);
        this.recordBiometricData('facialRecognition', {
          emotions: emotionData.emotions,
          engagement: emotionData.engagement,
          frustration: emotionData.frustration,
          satisfaction: emotionData.satisfaction,
          timestamp: Date.now()
        });
      }
    }, 500);
  }

  // Interaction Tracking
  setupInteractionTracking() {
    // Swipe gesture timing
    let swipeStartTime;
    document.addEventListener('touchstart', (e) => {
      swipeStartTime = performance.now();
      this.recordInteractionStart('swipe', e);
    });

    document.addEventListener('touchend', (e) => {
      if (swipeStartTime) {
        const swipeTime = performance.now() - swipeStartTime;
        this.recordMetric('swipeResponseTime', swipeTime);
        this.recordInteractionEnd('swipe', e, swipeTime);
      }
    });

    // Card transition timing
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('sushi-card')) {
          this.trackCardTransition(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Chef message timing
    this.trackChefMessageTiming();
  }

  // Usability Testing Framework
  createUsabilityTests() {
    return {
      // Task-based Testing
      taskCompletion: {
        'find_relevant_job': {
          description: 'User finds and swipes right on a job relevant to their skills',
          success: (session) => session.relevantJobsFound > 0,
          timeLimit: 60000, // 1 minute
          difficulty: 'easy'
        },
        
        'achieve_streak': {
          description: 'User achieves a 3+ swipe streak',
          success: (session) => session.maxStreak >= 3,
          timeLimit: 120000, // 2 minutes
          difficulty: 'medium'
        },
        
        'interact_with_chef': {
          description: 'User successfully engages with chef messages',
          success: (session) => session.chefInteractions > 2,
          timeLimit: 180000, // 3 minutes
          difficulty: 'medium'
        },
        
        'install_pwa': {
          description: 'User successfully installs the PWA',
          success: (session) => session.pwaInstalled,
          timeLimit: 30000, // 30 seconds
          difficulty: 'easy'
        }
      },

      // A/B Testing Variants
      variants: {
        'swipe_sensitivity': {
          A: { threshold: 50, animation: 'smooth' },
          B: { threshold: 75, animation: 'snappy' }
        },
        
        'chef_frequency': {
          A: { messageInterval: 3, personality: 'enthusiastic' },
          B: { messageInterval: 5, personality: 'calm' }
        },
        
        'card_layout': {
          A: { style: '80s-retro', colors: 'neon' },
          B: { style: 'modern-minimal', colors: 'muted' }
        }
      }
    };
  }

  // Accessibility Audit
  runAccessibilityAudit() {
    const auditResults = {
      touchTargets: this.auditTouchTargets(),
      colorContrast: this.auditColorContrast(),
      screenReader: this.auditScreenReaderSupport(),
      keyboardNav: this.auditKeyboardNavigation(),
      focusManagement: this.auditFocusManagement()
    };

    // Generate accessibility score
    const scores = Object.values(auditResults).map(result => result.score);
    const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    return {
      overallScore: Math.round(overallScore * 100),
      details: auditResults,
      recommendations: this.generateA11yRecommendations(auditResults)
    };
  }

  auditTouchTargets() {
    const interactiveElements = document.querySelectorAll('button, a, [tabindex], input, select, textarea');
    let compliantTargets = 0;
    let totalTargets = interactiveElements.length;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      
      if (size >= this.benchmarks.accessibility.minimumTouchSize.target) {
        compliantTargets++;
      }
    });

    return {
      score: compliantTargets / totalTargets,
      compliant: compliantTargets,
      total: totalTargets,
      issues: totalTargets - compliantTargets
    };
  }

  // Performance Benchmarking
  runPerformanceBenchmark() {
    return new Promise((resolve) => {
      const benchmark = {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        connection: navigator.connection?.effectiveType || 'unknown',
        
        // Run performance tests
        renderingTest: this.benchmarkRendering(),
        interactionTest: this.benchmarkInteractions(),
        memoryTest: this.benchmarkMemoryUsage(),
        batteryTest: this.benchmarkBatteryImpact(),
        
        // Device capabilities
        device: {
          cores: navigator.hardwareConcurrency || 'unknown',
          memory: navigator.deviceMemory || 'unknown',
          gpu: this.detectGPUCapabilities(),
          screen: {
            width: screen.width,
            height: screen.height,
            density: window.devicePixelRatio
          }
        }
      };

      setTimeout(() => {
        resolve(benchmark);
      }, 5000); // 5-second benchmark
    });
  }

  // Real-time Monitoring Dashboard
  createMetricsDashboard() {
    const dashboard = document.createElement('div');
    dashboard.id = 'ux-metrics-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 8px;
      z-index: 10000;
      overflow-y: auto;
      display: none;
    `;

    dashboard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h4 style="margin: 0;">🍣 UX Metrics</h4>
        <button id="toggle-biometrics" style="background: #4CAF50; border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px;">
          Biometrics: OFF
        </button>
      </div>
      <div id="metrics-content"></div>
    `;

    document.body.appendChild(dashboard);

    // Toggle dashboard with keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
      }
    });

    // Toggle biometric tracking
    document.getElementById('toggle-biometrics').addEventListener('click', () => {
      this.toggleBiometricTracking();
    });

    // Update dashboard every second
    setInterval(() => {
      this.updateMetricsDashboard();
    }, 1000);
  }

  updateMetricsDashboard() {
    const content = document.getElementById('metrics-content');
    if (!content) return;

    const metrics = Array.from(this.realTimeMetrics.entries());
    const recentMetrics = metrics.slice(-10); // Show last 10 metrics

    content.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Performance</strong><br>
        FPS: <span style="color: ${this.getMetricColor('frameRate')}">${this.getLatestMetric('frameRate') || 'N/A'}</span><br>
        Memory: <span style="color: ${this.getMetricColor('memoryUsage')}">${this.getLatestMetric('memoryUsage') || 'N/A'}%</span><br>
        Latency: <span style="color: ${this.getMetricColor('swipeResponseTime')}">${this.getLatestMetric('swipeResponseTime') || 'N/A'}ms</span>
      </div>
      
      <div style="margin-bottom: 10px;">
        <strong>Engagement</strong><br>
        Session: ${Math.round((Date.now() - this.sessionStart) / 1000)}s<br>
        Swipes: ${this.sessionMetrics.totalSwipes || 0}<br>
        Streak: ${this.sessionMetrics.currentStreak || 0}
      </div>
      
      ${this.biometricTracking.enabled ? `
        <div style="margin-bottom: 10px;">
          <strong>Biometrics</strong><br>
          Engagement: <span style="color: ${this.getBiometricColor('engagement')}">${this.getLatestBiometric('engagement') || 'N/A'}%</span><br>
          Eye Focus: <span style="color: ${this.getBiometricColor('eyeFocus')}">${this.getLatestBiometric('eyeFocus') || 'N/A'}%</span>
        </div>
      ` : ''}
      
      <div style="font-size: 10px; color: #888;">
        Press Ctrl+Shift+M to toggle this panel
      </div>
    `;
  }

  // Utility Methods
  recordMetric(name, value) {
    this.realTimeMetrics.set(`${name}_${Date.now()}`, {
      name,
      value,
      timestamp: Date.now()
    });

    // Keep only recent metrics to prevent memory bloat
    if (this.realTimeMetrics.size > 1000) {
      const oldestKey = this.realTimeMetrics.keys().next().value;
      this.realTimeMetrics.delete(oldestKey);
    }
  }

  recordBiometricData(type, data) {
    if (!this.biometricTracking.enabled) return;
    
    this.biometricTracking[type] = this.biometricTracking[type] || [];
    this.biometricTracking[type].push(data);

    // Keep only recent data
    if (this.biometricTracking[type].length > 100) {
      this.biometricTracking[type].shift();
    }
  }

  getMetricColor(metricName) {
    const latest = this.getLatestMetric(metricName);
    const benchmark = this.benchmarks.performance[metricName];
    
    if (!latest || !benchmark) return '#fff';
    
    if (latest <= benchmark.target) return '#4CAF50'; // Green
    if (latest <= benchmark.warning) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  getLatestMetric(name) {
    const entries = Array.from(this.realTimeMetrics.entries());
    const filtered = entries.filter(([key]) => key.startsWith(name));
    return filtered.length > 0 ? filtered[filtered.length - 1][1].value : null;
  }

  toggleBiometricTracking() {
    this.biometricTracking.enabled = !this.biometricTracking.enabled;
    const button = document.getElementById('toggle-biometrics');
    button.textContent = `Biometrics: ${this.biometricTracking.enabled ? 'ON' : 'OFF'}`;
    button.style.background = this.biometricTracking.enabled ? '#4CAF50' : '#757575';
  }

  // Export Results
  exportMetrics() {
    return {
      benchmarks: this.benchmarks,
      sessionData: this.sessionData,
      realTimeMetrics: Array.from(this.realTimeMetrics.entries()),
      biometricData: this.biometricTracking,
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  // Generate Report
  generateUXReport() {
    const metrics = this.exportMetrics();
    const accessibility = this.runAccessibilityAudit();
    
    return {
      summary: {
        overallScore: this.calculateOverallUXScore(),
        performanceGrade: this.getPerformanceGrade(),
        usabilityGrade: this.getUsabilityGrade(),
        accessibilityScore: accessibility.overallScore
      },
      recommendations: this.generateRecommendations(),
      detailedMetrics: metrics,
      accessibility,
      timestamp: Date.now()
    };
  }
}

// Initialize UX Metrics Framework
window.UXMetricsFramework = UXMetricsFramework;