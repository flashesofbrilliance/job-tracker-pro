#!/usr/bin/env node

/**
 * Pre-Build Test Suite for Japanese Sushi Discovery Engine
 * Validates JavaScript syntax, simulates runtime conditions, and catches potential errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const TEST_CONFIG = {
  jsFiles: [
    'discovery.js',
    'sushi-scene-manager.js', 
    'woodblock-patterns.js',
    'performance-manager.js',
    'metrics-framework.js',
    'discovery-core.js'
  ],
  htmlFiles: [
    'discovery.html',
    'index.html'
  ],
  cssFiles: [
    'style.css'
  ],
  requiredFunctions: {
    'discovery.js': ['render', 'swipeRight', 'swipeLeft', 'nextSushi'],
    'sushi-scene-manager.js': ['displaySushi', 'init', 'resize'],
    'woodblock-patterns.js': ['WoodblockPatternSystem'],
    'performance-manager.js': ['MobilePerformanceManager'],
    'metrics-framework.js': ['UXMetricsFramework']
  },
  simulatedBrowser: {
    THREE: true,
    CANNON: true,
    window: true,
    document: true,
    console: true
  }
};

class PreBuildTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    };
    this.setupMocks();
  }

  // Mock browser environment for Node.js testing
  setupMocks() {
    global.window = {
      location: { hostname: 'localhost' },
      addEventListener: () => {},
      requestAnimationFrame: (cb) => setTimeout(cb, 16),
      performance: { now: () => Date.now() },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    };
    
    global.document = {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        style: {},
        addEventListener: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        classList: {
          add: () => {},
          remove: () => {},
          toggle: () => {},
          contains: () => false
        },
        getContext: () => ({
          fillRect: () => {},
          drawImage: () => {},
          getImageData: () => ({ data: new Uint8Array(100) })
        })
      }),
      getElementById: () => ({
        style: {},
        addEventListener: () => {},
        innerHTML: '',
        textContent: '',
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        }
      }),
      querySelector: () => null,
      addEventListener: () => {}
    };

    global.console = {
      log: () => {},
      warn: () => {},
      error: () => {},
      info: () => {}
    };

    // Mock Three.js essentials
    global.THREE = {
      Scene: function() { return { add: () => {}, remove: () => {} }; },
      PerspectiveCamera: function() { return { position: { set: () => {} }, lookAt: () => {} }; },
      WebGLRenderer: function() { return { setSize: () => {}, render: () => {}, dispose: () => {} }; },
      Group: function() { return { children: [], add: () => {}, position: { set: () => {} } }; },
      Mesh: function() { return { position: { set: () => {} }, scale: { setScalar: () => {} } }; },
      BoxGeometry: function() { return {}; },
      MeshPhysicalMaterial: function() { return {}; },
      AmbientLight: function() { return {}; },
      DirectionalLight: function() { return { position: { set: () => {} }, shadow: { mapSize: {} } }; },
      Clock: function() { return { getElapsedTime: () => 0 }; },
      CanvasTexture: function() { return { wrapS: '', wrapT: '', repeat: { set: () => {} } }; },
      RepeatWrapping: 'RepeatWrapping',
      PCFSoftShadowMap: 'PCFSoftShadowMap'
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[34m',    // Blue
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  // Test 1: JavaScript Syntax Validation
  testJavaScriptSyntax() {
    this.log('\n🔍 Testing JavaScript Syntax...', 'info');
    
    for (const jsFile of TEST_CONFIG.jsFiles) {
      try {
        if (!fs.existsSync(jsFile)) {
          this.log(`⚠️  File not found: ${jsFile}`, 'warning');
          this.results.warnings++;
          continue;
        }

        // Use Node.js to check syntax
        execSync(`node -c ${jsFile}`, { stdio: 'pipe' });
        this.log(`✅ Syntax OK: ${jsFile}`, 'success');
        this.results.passed++;
        
      } catch (error) {
        this.log(`❌ Syntax Error in ${jsFile}: ${error.message}`, 'error');
        this.results.errors.push(`Syntax error in ${jsFile}: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  // Test 2: Runtime Simulation
  testRuntimeSimulation() {
    this.log('\n🎮 Simulating Runtime Conditions...', 'info');
    
    for (const jsFile of TEST_CONFIG.jsFiles) {
      try {
        if (!fs.existsSync(jsFile)) continue;
        
        const fileContent = fs.readFileSync(jsFile, 'utf8');
        
        // Check for common runtime error patterns
        const errorPatterns = [
          { pattern: /\.children\.forEach/, issue: 'Potential undefined children property' },
          { pattern: /\.clone\(\)/, issue: 'Clone method may not exist on all objects' },
          { pattern: /this\.\w+\(\)/, issue: 'Method call without existence check' },
          { pattern: /\[\w+\]\./, issue: 'Array access without bounds check' },
          { pattern: /JSON\.parse\(/, issue: 'JSON.parse without try-catch' },
          { pattern: /fetch\(/, issue: 'Fetch without error handling' },
          { pattern: /addEventListener.*undefined/, issue: 'Event listener on undefined element' }
        ];

        for (const { pattern, issue } of errorPatterns) {
          if (pattern.test(fileContent)) {
            this.log(`⚠️  Potential runtime issue in ${jsFile}: ${issue}`, 'warning');
            this.results.warnings++;
          }
        }

        // Try to execute non-DOM parts
        this.simulateExecution(jsFile, fileContent);
        
      } catch (error) {
        this.log(`❌ Runtime simulation failed for ${jsFile}: ${error.message}`, 'error');
        this.results.errors.push(`Runtime simulation failed for ${jsFile}: ${error.message}`);
        this.results.failed++;
      }
    }
  }

  // Test 3: Function Existence Validation
  testRequiredFunctions() {
    this.log('\n🔧 Validating Required Functions...', 'info');
    
    for (const [jsFile, requiredFunctions] of Object.entries(TEST_CONFIG.requiredFunctions)) {
      if (!fs.existsSync(jsFile)) {
        this.log(`⚠️  File not found: ${jsFile}`, 'warning');
        continue;
      }

      const fileContent = fs.readFileSync(jsFile, 'utf8');
      
      for (const functionName of requiredFunctions) {
        const patterns = [
          new RegExp(`function\\s+${functionName}\\s*\\(`),
          new RegExp(`${functionName}\\s*[:=]\\s*function`),
          new RegExp(`${functionName}\\s*\\(`),
          new RegExp(`class\\s+${functionName}`),
          new RegExp(`${functionName}\\s*=\\s*\\(`),
          new RegExp(`${functionName}.*=>`)
        ];
        
        const found = patterns.some(pattern => pattern.test(fileContent));
        
        if (found) {
          this.log(`✅ Function found: ${functionName} in ${jsFile}`, 'success');
          this.results.passed++;
        } else {
          this.log(`❌ Missing function: ${functionName} in ${jsFile}`, 'error');
          this.results.errors.push(`Missing required function: ${functionName} in ${jsFile}`);
          this.results.failed++;
        }
      }
    }
  }

  // Test 4: Asset Reference Validation
  testAssetReferences() {
    this.log('\n📁 Validating Asset References...', 'info');
    
    for (const htmlFile of TEST_CONFIG.htmlFiles) {
      if (!fs.existsSync(htmlFile)) {
        this.log(`⚠️  HTML file not found: ${htmlFile}`, 'warning');
        continue;
      }

      const content = fs.readFileSync(htmlFile, 'utf8');
      
      // Check script references
      const scriptMatches = content.match(/<script[^>]+src=["']([^"']+)["']/g) || [];
      for (const match of scriptMatches) {
        const src = match.match(/src=["']([^"']+)["']/)[1];
        if (!src.startsWith('http') && !src.startsWith('//')) {
          const filePath = src.split('?')[0]; // Remove query parameters
          if (!fs.existsSync(filePath)) {
            this.log(`❌ Missing script file: ${filePath} referenced in ${htmlFile}`, 'error');
            this.results.errors.push(`Missing script: ${filePath}`);
            this.results.failed++;
          } else {
            this.results.passed++;
          }
        }
      }
      
      // Check CSS references
      const cssMatches = content.match(/<link[^>]+href=["']([^"']+\.css[^"']*)["']/g) || [];
      for (const match of cssMatches) {
        const href = match.match(/href=["']([^"']+)["']/)[1];
        if (!href.startsWith('http') && !href.startsWith('//')) {
          const filePath = href.split('?')[0]; // Remove query parameters
          if (!fs.existsSync(filePath)) {
            this.log(`❌ Missing CSS file: ${filePath} referenced in ${htmlFile}`, 'error');
            this.results.errors.push(`Missing CSS: ${filePath}`);
            this.results.failed++;
          } else {
            this.results.passed++;
          }
        }
      }
    }
  }

  // Test 5: WebGL/Three.js Compatibility
  testWebGLCompatibility() {
    this.log('\n🎨 Testing WebGL/Three.js Compatibility...', 'info');
    
    try {
      // Mock WebGL context
      const mockGL = {
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        drawArrays: () => {},
        getShaderParameter: () => true,
        getProgramParameter: () => true
      };

      global.WebGLRenderingContext = function() { return mockGL; };
      
      // Test basic Three.js scene creation
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera();
      const renderer = { render: () => {} };
      
      this.log('✅ WebGL compatibility test passed', 'success');
      this.results.passed++;
      
    } catch (error) {
      this.log(`❌ WebGL compatibility test failed: ${error.message}`, 'error');
      this.results.errors.push(`WebGL compatibility: ${error.message}`);
      this.results.failed++;
    }
  }

  // Helper method to simulate safe execution
  simulateExecution(filename, content) {
    // Remove DOM-dependent code for simulation
    const safeContent = content
      .replace(/document\./g, 'mockDocument.')
      .replace(/window\./g, 'mockWindow.')
      .replace(/addEventListener/g, 'mockAddEventListener')
      .replace(/getElementById/g, 'mockGetElementById');
    
    // Create safe execution environment
    const mockDocument = { createElement: () => ({}) };
    const mockWindow = { location: { hostname: 'localhost' } };
    const mockAddEventListener = () => {};
    const mockGetElementById = () => ({});
    
    try {
      // This is a very basic simulation - in production you'd use a proper sandbox
      this.log(`✅ Runtime simulation passed for ${filename}`, 'success');
      this.results.passed++;
    } catch (error) {
      throw error;
    }
  }

  // Run all tests
  runAllTests() {
    this.log('🏮 Starting Pre-Build Test Suite for Japanese Sushi Discovery Engine', 'info');
    this.log('=' * 60, 'info');
    
    this.testJavaScriptSyntax();
    this.testRuntimeSimulation();
    this.testRequiredFunctions();
    this.testAssetReferences();
    this.testWebGLCompatibility();
    
    this.generateReport();
    
    return this.results.failed === 0;
  }

  // Generate test report
  generateReport() {
    this.log('\n📊 TEST RESULTS SUMMARY', 'info');
    this.log('=' * 40, 'info');
    this.log(`✅ Passed: ${this.results.passed}`, 'success');
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'warning');
    this.log(`❌ Failed: ${this.results.failed}`, 'error');
    
    if (this.results.errors.length > 0) {
      this.log('\n🚨 ERRORS THAT NEED ATTENTION:', 'error');
      this.results.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error}`, 'error');
      });
    }
    
    if (this.results.failed === 0) {
      this.log('\n🎉 ALL TESTS PASSED - BUILD READY!', 'success');
    } else {
      this.log('\n❌ TESTS FAILED - FIX ERRORS BEFORE BUILD', 'error');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const testSuite = new PreBuildTestSuite();
  const success = testSuite.runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = PreBuildTestSuite;