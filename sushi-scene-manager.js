/**
 * 3D Sushi Scene Manager
 * Handles photorealistic WebGL rendering of sushi using Three.js
 */

class SushiSceneManager {
  constructor(canvasElement, gpuOptimizer = null) {
    this.canvas = canvasElement;
    this.gpuOptimizer = gpuOptimizer;
    
    // Scene components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    
    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;
    this.spotLight = null;
    
    // Scene objects
    this.woodenTable = null;
    this.currentSushi = null;
    this.environmentObjects = [];
    
    // Animation
    this.animationId = null;
    this.clock = new THREE.Clock();
    
    // Sushi types and materials
    this.sushiTypes = {
      salmon: { geometry: null, material: null },
      tuna: { geometry: null, material: null },
      roll: { geometry: null, material: null }
    };
    
    // Quality settings from GPU optimizer
    this.qualitySettings = {
      shadows: true,
      textureQuality: 1.0,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2)
    };
    
    this.init();
  }
  
  async init() {
    try {
      console.log('🍣 Initializing 3D Sushi Scene...');
      
      // Apply GPU optimization settings
      if (this.gpuOptimizer) {
        const profile = this.gpuOptimizer.getHardwareProfile();
        this.qualitySettings = this.getQualityFromProfile(profile);
      }
      
      this.setupScene();
      this.setupCamera();
      this.setupRenderer();
      this.setupLighting();
      
      await this.loadAssets();
      await this.createSushiModels();
      await this.createEnvironment();
      
      this.startRenderLoop();
      
      console.log('✅ 3D Sushi Scene initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize 3D Sushi Scene:', error);
    }
  }
  
  getQualityFromProfile(profile) {
    const tier = profile.performanceTier;
    
    switch (tier) {
      case 'high':
        return {
          shadows: true,
          textureQuality: 1.0,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio, 2),
          maxLights: 4
        };
      case 'medium':
        return {
          shadows: true,
          textureQuality: 0.75,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio, 1.5),
          maxLights: 3
        };
      case 'low':
        return {
          shadows: false,
          textureQuality: 0.5,
          antialias: false,
          pixelRatio: 1,
          maxLights: 2
        };
      default:
        return this.qualitySettings;
    }
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e); // Match the app's dark theme
    
    // Add subtle fog for depth
    this.scene.fog = new THREE.Fog(0x1a1a2e, 5, 15);
  }
  
  setupCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    
    // Position camera for optimal sushi viewing angle
    this.camera.position.set(3, 2, 4);
    this.camera.lookAt(0, 0, 0);
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.qualitySettings.antialias,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(this.qualitySettings.pixelRatio);
    
    // Enable shadows for realism
    if (this.qualitySettings.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Enable tone mapping for realistic lighting
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    // Enable physically correct lights
    this.renderer.physicallyCorrectLights = true;
  }
  
  setupLighting() {
    // Ambient light for overall illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);
    
    // Main directional light (simulates window light)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(5, 10, 5);
    this.directionalLight.castShadow = this.qualitySettings.shadows;
    
    if (this.qualitySettings.shadows) {
      this.directionalLight.shadow.mapSize.width = 2048;
      this.directionalLight.shadow.mapSize.height = 2048;
      this.directionalLight.shadow.camera.near = 0.5;
      this.directionalLight.shadow.camera.far = 50;
      this.directionalLight.shadow.camera.left = -10;
      this.directionalLight.shadow.camera.right = 10;
      this.directionalLight.shadow.camera.top = 10;
      this.directionalLight.shadow.camera.bottom = -10;
    }
    
    this.scene.add(this.directionalLight);
    
    // Warm spotlight from above for food photography effect
    this.spotLight = new THREE.SpotLight(0xfff4e6, 0.6);
    this.spotLight.position.set(0, 4, 2);
    this.spotLight.angle = Math.PI / 6;
    this.spotLight.penumbra = 0.3;
    this.spotLight.castShadow = this.qualitySettings.shadows;
    
    this.scene.add(this.spotLight);
  }
  
  async loadAssets() {
    // We'll create procedural textures for now, but this could load actual texture files
    console.log('📦 Loading sushi assets...');
    
    // Load texture loader
    this.textureLoader = new THREE.TextureLoader();
    
    // For now, we'll create procedural materials
    // In a production app, you'd load actual high-res sushi textures
  }
  
  async createSushiModels() {
    console.log('🍱 Creating photorealistic sushi models...');
    
    // Salmon Nigiri
    this.sushiTypes.salmon = this.createSalmonNigiri();
    
    // Tuna Nigiri  
    this.sushiTypes.tuna = this.createTunaNigiri();
    
    // Maki Roll
    this.sushiTypes.roll = this.createMakiRoll();
  }
  
  createSalmonNigiri() {
    const group = new THREE.Group();
    
    // Rice base
    const riceGeometry = new THREE.BoxGeometry(1.8, 0.4, 0.8);
    const riceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      roughness: 0.7,
      metalness: 0,
      clearcoat: 0.1
    });
    const rice = new THREE.Mesh(riceGeometry, riceMaterial);
    rice.position.y = 0.2;
    rice.castShadow = true;
    rice.receiveShadow = true;
    group.add(rice);
    
    // Salmon slice with marbling
    const salmonGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.8);
    
    // Create procedural salmon texture with marbling
    const salmonCanvas = document.createElement('canvas');
    salmonCanvas.width = 512;
    salmonCanvas.height = 512;
    const ctx = salmonCanvas.getContext('2d');
    
    // Base salmon color
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#ff8a65');
    gradient.addColorStop(0.3, '#ff6347');
    gradient.addColorStop(0.7, '#e64545');
    gradient.addColorStop(1, '#d32f2f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add marbling effect
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 50 + 10,
        Math.random() * 20 + 5,
        Math.random() * Math.PI,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
    
    const salmonTexture = new THREE.CanvasTexture(salmonCanvas);
    const salmonMaterial = new THREE.MeshPhysicalMaterial({
      map: salmonTexture,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.1
    });
    
    const salmon = new THREE.Mesh(salmonGeometry, salmonMaterial);
    salmon.position.y = 0.55;
    salmon.castShadow = true;
    group.add(salmon);
    
    return group;
  }
  
  createTunaNigiri() {
    const group = new THREE.Group();
    
    // Rice base (same as salmon)
    const riceGeometry = new THREE.BoxGeometry(1.8, 0.4, 0.8);
    const riceMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      roughness: 0.7,
      metalness: 0,
      clearcoat: 0.1
    });
    const rice = new THREE.Mesh(riceGeometry, riceMaterial);
    rice.position.y = 0.2;
    rice.castShadow = true;
    rice.receiveShadow = true;
    group.add(rice);
    
    // Tuna slice with darker, richer texture
    const tunaGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.8);
    
    const tunaCanvas = document.createElement('canvas');
    tunaCanvas.width = 512;
    tunaCanvas.height = 512;
    const ctx = tunaCanvas.getContext('2d');
    
    // Deep red tuna color
    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#8b0000');
    gradient.addColorStop(0.3, '#dc143c');
    gradient.addColorStop(0.7, '#b22222');
    gradient.addColorStop(1, '#800000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    
    // Add subtle muscle fiber texture
    ctx.globalCompositeOperation = 'multiply';
    for (let y = 0; y < 512; y += 8) {
      ctx.fillStyle = `rgba(200, 200, 200, ${0.05 + Math.sin(y * 0.1) * 0.02})`;
      ctx.fillRect(0, y, 512, 2);
    }
    
    const tunaTexture = new THREE.CanvasTexture(tunaCanvas);
    const tunaMaterial = new THREE.MeshPhysicalMaterial({
      map: tunaTexture,
      roughness: 0.4,
      metalness: 0,
      clearcoat: 0.15
    });
    
    const tuna = new THREE.Mesh(tunaGeometry, tunaMaterial);
    tuna.position.y = 0.55;
    tuna.castShadow = true;
    group.add(tuna);
    
    return group;
  }
  
  createMakiRoll() {
    const group = new THREE.Group();
    
    // Nori (seaweed) outer layer
    const noriGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 16);
    const noriMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2d5016,
      roughness: 0.9,
      metalness: 0
    });
    const nori = new THREE.Mesh(noriGeometry, noriMaterial);
    nori.position.y = 0.4;
    nori.castShadow = true;
    nori.receiveShadow = true;
    group.add(nori);
    
    // Rice interior
    const riceInteriorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.78, 16);
    const riceInteriorMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf8f5f0,
      roughness: 0.8,
      metalness: 0
    });
    const riceInterior = new THREE.Mesh(riceInteriorGeometry, riceInteriorMaterial);
    riceInterior.position.y = 0.4;
    group.add(riceInterior);
    
    // Center filling (salmon)
    const fillingGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8);
    const fillingMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff6347,
      roughness: 0.3,
      metalness: 0
    });
    const filling = new THREE.Mesh(fillingGeometry, fillingMaterial);
    filling.position.y = 0.4;
    group.add(filling);
    
    return group;
  }
  
  async createEnvironment() {
    console.log('🏮 Creating zen environment...');
    
    // Wooden table surface
    const tableGeometry = new THREE.PlaneGeometry(12, 8);
    const tableTexture = this.createWoodTexture();
    const tableMaterial = new THREE.MeshPhysicalMaterial({
      map: tableTexture,
      roughness: 0.8,
      metalness: 0.1
    });
    
    this.woodenTable = new THREE.Mesh(tableGeometry, tableMaterial);
    this.woodenTable.rotation.x = -Math.PI / 2;
    this.woodenTable.position.y = -0.5;
    this.woodenTable.receiveShadow = true;
    this.scene.add(this.woodenTable);
    
    // Add subtle environment details
    // TODO: Add white orchid, bonsai, sakura banner in next iteration
  }
  
  createWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Base wood color
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // Wood grain
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 1024; i += 4) {
      const opacity = 0.8 + Math.sin(i * 0.02) * 0.1;
      ctx.fillStyle = `rgba(139, 69, 20, ${opacity})`;
      ctx.fillRect(0, i, 1024, 2);
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  displaySushi(type, strategicValue = 0.5, category = 'normal') {
    // Remove current sushi
    if (this.currentSushi) {
      this.scene.remove(this.currentSushi);
    }
    
    // Clone the sushi model
    const sushiModel = this.sushiTypes[type];
    if (!sushiModel) {
      console.warn(`Unknown sushi type: ${type}`);
      return;
    }
    
    this.currentSushi = sushiModel.clone();
    this.currentSushi.position.set(0, 0, 0);
    
    // Apply strategic effects
    this.applyStrategicEffects(this.currentSushi, strategicValue, category);
    
    this.scene.add(this.currentSushi);
    
    // Gentle floating animation
    this.animateSushi(this.currentSushi);
  }
  
  applyStrategicEffects(sushiObject, strategicValue, category) {
    // Scale based on strategic value
    const scale = 0.8 + strategicValue * 0.4;
    sushiObject.scale.setScalar(scale);
    
    // Add glow effects for special categories
    if (category === 'golden_sushi') {
      // Add golden rim light
      const rimLight = new THREE.PointLight(0xffd700, 1, 3);
      rimLight.position.set(0, 2, 1);
      sushiObject.add(rimLight);
    } else if (category === 'quality_choice') {
      // Add green accent light
      const accentLight = new THREE.PointLight(0x00ff41, 0.5, 2);
      accentLight.position.set(0, 1.5, 1);
      sushiObject.add(accentLight);
    }
  }
  
  animateSushi(sushiObject) {
    const startY = sushiObject.position.y;
    
    const animate = () => {
      const time = this.clock.getElapsedTime();
      sushiObject.position.y = startY + Math.sin(time * 2) * 0.05;
      sushiObject.rotation.y += 0.005;
    };
    
    // Store animation function for cleanup
    sushiObject.userData.animate = animate;
  }
  
  startRenderLoop() {
    const render = () => {
      this.animationId = requestAnimationFrame(render);
      
      // Update animations
      if (this.currentSushi && this.currentSushi.userData.animate) {
        this.currentSushi.userData.animate();
      }
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    };
    
    render();
  }
  
  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Dispose of geometries, materials, and textures
    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    this.renderer.dispose();
  }
}

// Export for use in other modules
window.SushiSceneManager = SushiSceneManager;