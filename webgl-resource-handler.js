/**
 * WebGL Resource Handler for Photorealistic 3D Sushi Discovery
 * Manages GPU resources, textures, models, and rendering pipeline
 */

class WebGLResourceHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Resource pools
    this.texturePool = new Map();
    this.modelPool = new Map();
    this.materialPool = new Map();
    this.shaderPool = new Map();
    
    // Performance tracking
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 60;
    this.gpuMemoryUsage = 0;
    
    // Quality settings
    this.qualityLevel = 'high'; // low, medium, high, ultra
    this.lodDistances = [50, 100, 200, 400];
    
    this.init();
  }
  
  async init() {
    console.log('🍣 Initializing WebGL Resource Handler for Photorealistic Sushi');
    
    // Initialize WebGL context
    this.gl = this.canvas.getContext('webgl2', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }
    
    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: this.gl,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.setupRenderer();
    this.createScene();
    this.setupCamera();
    this.loadShaders();
    
    // Pre-load sushi assets
    await this.preloadSushiAssets();
    
    console.log('✅ WebGL Resource Handler initialized');
  }
  
  setupRenderer() {
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable advanced rendering features
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.physicallyCorrectLights = true;
    
    // Enable extensions for better quality
    const extensions = [
      'EXT_texture_filter_anisotropic',
      'WEBGL_depth_texture',
      'OES_texture_float',
      'OES_texture_half_float'
    ];
    
    extensions.forEach(ext => {
      const extension = this.gl.getExtension(ext);
      if (extension) {
        console.log(`✅ WebGL Extension enabled: ${ext}`);
      }
    });
  }
  
  createScene() {
    this.scene = new THREE.Scene();
    
    // Japanese woodblock-inspired background with gradient
    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0xf5f5dc) }, // Cream
        bottomColor: { value: new THREE.Color(0xdeb887) }, // Burlywood
        waveOffset: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float waveOffset;
        varying vec2 vUv;
        
        void main() {
          // Woodblock print-inspired gradient with subtle wave pattern
          float wave = sin(vUv.x * 10.0 + waveOffset) * 0.02;
          float gradient = vUv.y + wave;
          vec3 color = mix(bottomColor, topColor, gradient);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthTest: false,
      depthWrite: false
    });
    
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    bgMesh.renderOrder = -1;
    this.scene.add(bgMesh);
    
    // Store reference for animation
    this.backgroundMaterial = bgMaterial;
  }
  
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      1000
    );
    
    // Position camera for sushi conveyor belt view
    this.camera.position.set(0, 8, 12);
    this.camera.lookAt(0, 0, 0);
    
    // Add subtle camera sway for organic feel
    this.cameraController = {
      basePosition: this.camera.position.clone(),
      swayAmount: 0.1,
      swaySpeed: 0.5
    };
  }
  
  async loadShaders() {
    // PBR shader for photorealistic sushi
    this.shaderPool.set('sushiPBR', {
      vertexShader: `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        attribute vec3 tangent;
        
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vTangent = normalize(normalMatrix * tangent);
          vBitangent = cross(vNormal, vTangent);
          
          vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          
          gl_Position = projectionMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform sampler2D diffuseTexture;
        uniform sampler2D normalTexture;
        uniform sampler2D roughnessTexture;
        uniform sampler2D aoTexture;
        
        uniform vec3 lightPosition;
        uniform vec3 lightColor;
        uniform vec3 cameraPosition;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vTangent;
        varying vec3 vBitangent;
        
        vec3 getNormalFromMap() {
          vec3 tangentNormal = texture2D(normalTexture, vUv).xyz * 2.0 - 1.0;
          mat3 tbn = mat3(vTangent, vBitangent, vNormal);
          return normalize(tbn * tangentNormal);
        }
        
        void main() {
          vec3 albedo = texture2D(diffuseTexture, vUv).rgb;
          float roughness = texture2D(roughnessTexture, vUv).r;
          float ao = texture2D(aoTexture, vUv).r;
          vec3 normal = getNormalFromMap();
          
          // PBR lighting calculation
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          vec3 lightDir = normalize(lightPosition - vWorldPosition);
          vec3 halfwayDir = normalize(lightDir + viewDir);
          
          float NdotV = max(dot(normal, viewDir), 0.0);
          float NdotL = max(dot(normal, lightDir), 0.0);
          float HdotV = max(dot(halfwayDir, viewDir), 0.0);
          float NdotH = max(dot(normal, halfwayDir), 0.0);
          
          // Fresnel
          vec3 F0 = vec3(0.04);
          vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
          
          // Distribution
          float alpha = roughness * roughness;
          float alpha2 = alpha * alpha;
          float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
          float D = alpha2 / (3.14159 * denom * denom);
          
          // Geometry
          float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
          float GL = NdotL / (NdotL * (1.0 - k) + k);
          float GV = NdotV / (NdotV * (1.0 - k) + k);
          float G = GL * GV;
          
          // BRDF
          vec3 numerator = D * G * F;
          float denominator = 4.0 * NdotV * NdotL + 0.001;
          vec3 specular = numerator / denominator;
          
          vec3 kS = F;
          vec3 kD = vec3(1.0) - kS;
          
          vec3 diffuse = albedo / 3.14159;
          
          vec3 color = (kD * diffuse + specular) * lightColor * NdotL * ao;
          
          // Tone mapping
          color = color / (color + vec3(1.0));
          color = pow(color, vec3(1.0/2.2));
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    // White oak table shader with zen aesthetics
    this.shaderPool.set('whiteOakTable', {
      vertexShader: `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform sampler2D woodTexture;
        uniform sampler2D woodNormalTexture;
        uniform float time;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        
        void main() {
          // White oak wood grain
          vec3 woodColor = texture2D(woodTexture, vUv * 4.0).rgb;
          vec3 woodNormal = texture2D(woodNormalTexture, vUv * 4.0).rgb * 2.0 - 1.0;
          
          // Zen-inspired subtle glow
          float zenGlow = sin(time * 0.5) * 0.05 + 0.95;
          
          // White oak characteristics - light, clean, minimal
          woodColor = mix(woodColor, vec3(0.95, 0.93, 0.88), 0.3) * zenGlow;
          
          gl_FragColor = vec4(woodColor, 1.0);
        }
      `
    });
  }
  
  async preloadSushiAssets() {
    console.log('🍣 Pre-loading photorealistic sushi assets...');
    
    // Define sushi types with their characteristics
    const sushiTypes = [
      {
        name: 'salmon',
        modelPath: '/assets/sushi/salmon-nigiri.gltf',
        textures: {
          diffuse: '/assets/textures/salmon-diffuse.jpg',
          normal: '/assets/textures/salmon-normal.jpg',
          roughness: '/assets/textures/salmon-roughness.jpg',
          ao: '/assets/textures/salmon-ao.jpg'
        }
      },
      {
        name: 'tuna',
        modelPath: '/assets/sushi/tuna-nigiri.gltf',
        textures: {
          diffuse: '/assets/textures/tuna-diffuse.jpg',
          normal: '/assets/textures/tuna-normal.jpg',
          roughness: '/assets/textures/tuna-roughness.jpg',
          ao: '/assets/textures/tuna-ao.jpg'
        }
      },
      {
        name: 'california_roll',
        modelPath: '/assets/sushi/california-roll.gltf',
        textures: {
          diffuse: '/assets/textures/california-roll-diffuse.jpg',
          normal: '/assets/textures/california-roll-normal.jpg',
          roughness: '/assets/textures/california-roll-roughness.jpg',
          ao: '/assets/textures/california-roll-ao.jpg'
        }
      },
      {
        name: 'dragon_roll',
        modelPath: '/assets/sushi/dragon-roll.gltf',
        textures: {
          diffuse: '/assets/textures/dragon-roll-diffuse.jpg',
          normal: '/assets/textures/dragon-roll-normal.jpg',
          roughness: '/assets/textures/dragon-roll-roughness.jpg',
          ao: '/assets/textures/dragon-roll-ao.jpg'
        }
      }
    ];
    
    // Load each sushi type
    for (const sushi of sushiTypes) {
      await this.loadSushiModel(sushi);
    }
    
    // Load table assets
    await this.loadTableAssets();
    
    console.log('✅ All sushi assets loaded');
  }
  
  async loadSushiModel(sushiData) {
    const loader = new THREE.GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    
    try {
      // Load 3D model
      const gltf = await new Promise((resolve, reject) => {
        loader.load(sushiData.modelPath, resolve, undefined, reject);
      });
      
      // Load textures
      const textures = {};
      for (const [type, path] of Object.entries(sushiData.textures)) {
        textures[type] = await new Promise((resolve, reject) => {
          textureLoader.load(path, resolve, undefined, reject);
        });
        
        // Configure texture settings for quality
        textures[type].wrapS = THREE.RepeatWrapping;
        textures[type].wrapT = THREE.RepeatWrapping;
        textures[type].anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      }
      
      // Store in pools
      this.modelPool.set(sushiData.name, gltf.scene);
      this.texturePool.set(sushiData.name, textures);
      
      console.log(`✅ Loaded sushi: ${sushiData.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to load sushi: ${sushiData.name}`, error);
      
      // Create fallback procedural sushi
      this.createFallbackSushi(sushiData.name);
    }
  }
  
  async loadTableAssets() {
    const textureLoader = new THREE.TextureLoader();
    
    try {
      // White oak table texture
      const woodTexture = await new Promise((resolve, reject) => {
        textureLoader.load('/assets/textures/white-oak-diffuse.jpg', resolve, undefined, reject);
      });
      
      const woodNormalTexture = await new Promise((resolve, reject) => {
        textureLoader.load('/assets/textures/white-oak-normal.jpg', resolve, undefined, reject);
      });
      
      // Configure for tiling
      [woodTexture, woodNormalTexture].forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      });
      
      this.texturePool.set('whiteOakTable', {
        diffuse: woodTexture,
        normal: woodNormalTexture
      });
      
      console.log('✅ Table assets loaded');
      
    } catch (error) {
      console.warn('⚠️ Using procedural table textures');
      this.createProceduralTableTextures();
    }
  }
  
  createFallbackSushi(sushiName) {
    // Create procedural sushi geometry as fallback
    const geometry = new THREE.BoxGeometry(2, 0.8, 1);
    const material = new THREE.MeshStandardMaterial({
      color: this.getSushiColor(sushiName),
      roughness: 0.3,
      metalness: 0.1
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    this.modelPool.set(sushiName, mesh);
    
    console.log(`🔄 Created fallback sushi: ${sushiName}`);
  }
  
  getSushiColor(sushiName) {
    const colors = {
      salmon: 0xff9999,
      tuna: 0xaa4444,
      california_roll: 0x99cc99,
      dragon_roll: 0xccaa66
    };
    return colors[sushiName] || 0xffffff;
  }
  
  createProceduralTableTextures() {
    // Generate white oak-inspired texture procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // White oak gradient
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#f5f3f0');
    gradient.addColorStop(0.5, '#e8e5e0');
    gradient.addColorStop(1, '#ddd8d0');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle wood grain
    for (let i = 0; i < 20; i++) {
      ctx.strokeStyle = `rgba(180, 170, 160, ${0.1 + Math.random() * 0.1})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * 512);
      ctx.bezierCurveTo(
        128 + Math.random() * 256, Math.random() * 512,
        256 + Math.random() * 128, Math.random() * 512,
        512, Math.random() * 512
      );
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    this.texturePool.set('whiteOakTable', {
      diffuse: texture,
      normal: texture // Simple fallback
    });
  }
  
  // Resource management methods
  optimizeForDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency < 4;
    
    if (isMobile || isLowEnd) {
      this.qualityLevel = 'medium';
      this.renderer.setPixelRatio(1);
    } else {
      this.qualityLevel = 'high';
    }
    
    console.log(`📱 Optimized for: ${this.qualityLevel} quality`);
  }
  
  getMemoryUsage() {
    if (this.renderer.info) {
      return {
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
        programs: this.renderer.info.programs?.length || 0
      };
    }
    return null;
  }
  
  cleanupResources() {
    // Dispose of unused resources
    this.texturePool.forEach(texture => {
      if (texture.dispose) texture.dispose();
    });
    
    this.modelPool.forEach(model => {
      if (model.dispose) model.dispose();
    });
    
    console.log('🧹 Resources cleaned up');
  }
  
  // Performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      this.fps = Math.round(1000 / (performance.now() - this.lastFrameTime));
      this.lastFrameTime = performance.now();
      
      if (this.fps < 30 && this.qualityLevel === 'high') {
        console.warn('⚠️ Performance degraded, reducing quality');
        this.qualityLevel = 'medium';
        this.optimizeForDevice();
      }
    }, 1000);
  }
}

export default WebGLResourceHandler;