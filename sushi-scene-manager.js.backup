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
    
    // Simple, reliable settings for diorama
    this.qualitySettings = {
      shadows: true,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2)
    };
    
    // Conveyor belt animation
    this.conveyorBelt = {
      speed: 0.01,
      sushiPlates: [],
      position: 0
    };
    
    this.init();
  }
  
  async init() {
    try {
      
      
      this.setupScene();
      this.setupStaticCamera();
      this.setupRenderer();
      this.setupLighting();
      
      await this.createShojiBox();
      await this.createWhiteOakBoard();
      await this.createConveyorBelt();
      await this.createSushiModels();
      
      this.startRenderLoop();
      
      
    } catch (error) {
      console.error('❌ Failed to initialize Shoji Box:', error);
    }
  }
  
  getQualityFromProfile(profile) {
    const tier = profile.performanceTier;
    
    switch (tier) {
      case 'high':
        return {
          shadows: true,
          textureQuality: 2.0,
          antialias: true,
          pixelRatio: Math.min(window.devicePixelRatio, 3),
          shadowMapSize: 4096,
          anisotropy: 16,
          maxLights: 6
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
  
  setupStaticCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 50);
    
    // Fixed camera position for traditional diorama view
    // Slightly elevated, looking down at the shoji box
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
    
    
  }
  
  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.qualitySettings.antialias,
      alpha: true
    });
    
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(this.qualitySettings.pixelRatio);
    
    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Warm, soft rendering for traditional aesthetic
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
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
      const shadowMapSize = this.qualitySettings.shadowMapSize || 4096;
      this.directionalLight.shadow.mapSize.width = shadowMapSize;
      this.directionalLight.shadow.mapSize.height = shadowMapSize;
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
    
    
    // Load texture loader
    this.textureLoader = new THREE.TextureLoader();
    
    // For now, we'll create procedural materials
    // In a production app, you'd load actual high-res sushi textures
  }
  
  async createSushiModels() {
    
    
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
    
    
    // Wooden table surface with enhanced grain
    const tableGeometry = new THREE.PlaneGeometry(12, 8);
    const tableTexture = this.createEnhancedWoodTexture();
    const tableNormalTexture = this.createWoodNormalTexture();
    const tableMaterial = new THREE.MeshPhysicalMaterial({
      map: tableTexture,
      normalMap: tableNormalTexture,
      roughness: 0.7,
      metalness: 0.05,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8
    });
    
    this.woodenTable = new THREE.Mesh(tableGeometry, tableMaterial);
    this.woodenTable.rotation.x = -Math.PI / 2;
    this.woodenTable.position.y = -0.5;
    this.woodenTable.receiveShadow = true;
    this.scene.add(this.woodenTable);
    
    // White orchid (elegant ceramic pot with white flowers)
    this.createWhiteOrchid();
    
    // Casual bonsai tree (small, zen-like)
    this.createBonsaiTree();
    
    // Sakura banner (subtle background element)
    this.createSakuraBanner();
    
    // Ambient zen elements
    this.addZenAccents();
  }
  
  createEnhancedWoodTexture() {
    const resolution = Math.floor(1024 * this.qualitySettings.textureQuality);
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    
    // Rich cherry wood base
    const gradient = ctx.createLinearGradient(0, 0, resolution, 0);
    gradient.addColorStop(0, '#8b4513');
    gradient.addColorStop(0.3, '#a0522d');
    gradient.addColorStop(0.7, '#8b6914');
    gradient.addColorStop(1, '#704214');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, resolution, resolution);
    
    // Complex wood grain patterns
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < resolution; i += 3) {
      const waveIntensity = Math.sin(i * 0.008) * 0.15;
      const opacity = 0.7 + waveIntensity + Math.random() * 0.1;
      ctx.fillStyle = `rgba(101, 67, 33, ${opacity})`;
      ctx.fillRect(0, i, resolution, Math.random() * 2 + 1);
    }
    
    // Wood knots and imperfections
    ctx.globalCompositeOperation = 'overlay';
    for (let j = 0; j < 8; j++) {
      const x = Math.random() * resolution;
      const y = Math.random() * resolution;
      const radius = Math.random() * 30 + 10;
      const knotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      knotGradient.addColorStop(0, 'rgba(62, 39, 35, 0.6)');
      knotGradient.addColorStop(1, 'rgba(62, 39, 35, 0)');
      ctx.fillStyle = knotGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    if (this.qualitySettings.anisotropy) {
      texture.anisotropy = this.qualitySettings.anisotropy;
    }
    return texture;
  }
  
  createWoodNormalTexture() {
    const resolution = Math.floor(512 * this.qualitySettings.textureQuality);
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    
    // Normal map for wood grain depth
    ctx.fillStyle = '#8080ff'; // Neutral normal
    ctx.fillRect(0, 0, resolution, resolution);
    
    // Grain direction normals
    for (let i = 0; i < resolution; i += 2) {
      const intensity = Math.sin(i * 0.01) * 32 + 128;
      ctx.fillStyle = `rgb(128, ${Math.floor(intensity)}, 255)`;
      ctx.fillRect(0, i, resolution, 1);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }
  
  createWhiteOrchid() {
    const orchidGroup = new THREE.Group();
    
    // Ceramic pot (elegant white/cream)
    const potGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.25, 12);
    const potMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5f5dc,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.125;
    pot.castShadow = true;
    orchidGroup.add(pot);
    
    // Orchid stems (thin green)
    for (let i = 0; i < 3; i++) {
      const stemGeometry = new THREE.CylinderGeometry(0.005, 0.008, 0.4, 4);
      const stemMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x228b22,
        roughness: 0.8
      });
      const stem = new THREE.Mesh(stemGeometry, stemMaterial);
      stem.position.set(
        (Math.random() - 0.5) * 0.1,
        0.45,
        (Math.random() - 0.5) * 0.1
      );
      stem.rotation.z = (Math.random() - 0.5) * 0.2;
      orchidGroup.add(stem);
      
      // White orchid flowers
      const flowerGeometry = new THREE.SphereGeometry(0.025, 8, 6);
      const flowerMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.3,
        transmission: 0.1,
        thickness: 0.5
      });
      const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
      flower.position.copy(stem.position);
      flower.position.y += 0.2;
      flower.scale.set(1, 0.6, 1);
      orchidGroup.add(flower);
    }
    
    orchidGroup.position.set(-3, -0.5, -2);
    orchidGroup.scale.setScalar(0.8);
    this.environmentObjects.push(orchidGroup);
    this.scene.add(orchidGroup);
  }
  
  createBonsaiTree() {
    const bonsaiGroup = new THREE.Group();
    
    // Bonsai pot (dark ceramic)
    const potGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.12, 8);
    const potMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2f2f2f,
      roughness: 0.9,
      metalness: 0.1
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = 0.06;
    pot.castShadow = true;
    bonsaiGroup.add(pot);
    
    // Trunk (gnarled and twisted)
    const trunkGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6);
    const trunkMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4a4a4a,
      roughness: 0.95
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.27;
    trunk.rotation.z = 0.1;
    bonsaiGroup.add(trunk);
    
    // Foliage clusters (small green spheres)
    const leafMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f5132,
      roughness: 0.8
    });
    
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.04 + Math.random() * 0.02, 6, 4);
      const leafCluster = new THREE.Mesh(leafGeometry, leafMaterial);
      leafCluster.position.set(
        (Math.random() - 0.5) * 0.2,
        0.35 + Math.random() * 0.15,
        (Math.random() - 0.5) * 0.2
      );
      bonsaiGroup.add(leafCluster);
    }
    
    bonsaiGroup.position.set(3.5, -0.5, -1.5);
    bonsaiGroup.scale.setScalar(0.6);
    this.environmentObjects.push(bonsaiGroup);
    this.scene.add(bonsaiGroup);
  }
  
  createSakuraBanner() {
    // Subtle background banner with sakura motif
    const bannerGeometry = new THREE.PlaneGeometry(4, 1.5);
    const bannerTexture = this.createSakuraTexture();
    const bannerMaterial = new THREE.MeshPhysicalMaterial({
      map: bannerTexture,
      transparent: true,
      opacity: 0.6,
      roughness: 0.8
    });
    
    const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
    banner.position.set(0, 2, -4);
    banner.rotation.y = Math.PI;
    this.environmentObjects.push(banner);
    this.scene.add(banner);
  }
  
  createSakuraTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Soft cream background
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#faf7f2');
    gradient.addColorStop(0.5, '#f5f0ea');
    gradient.addColorStop(1, '#faf7f2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Delicate sakura petals
    ctx.fillStyle = 'rgba(255, 182, 193, 0.7)';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const size = Math.random() * 8 + 4;
      
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const angle = (j * 2 * Math.PI) / 5;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size * 0.6;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  async createShojiBox() {
    
    
    const shojiGroup = new THREE.Group();
    
    // Shoji frame material (dark wood)
    const frameMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3d2b1f,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 6),
      new THREE.MeshPhysicalMaterial({
        color: 0xfaf7f0,
        roughness: 0.9
      })
    );
    backWall.position.set(0, 2, -4);
    backWall.receiveShadow = true;
    shojiGroup.add(backWall);
    
    // Side frames
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 6, 0.2),
      frameMaterial
    );
    leftFrame.position.set(-5, 2, -4);
    leftFrame.castShadow = true;
    shojiGroup.add(leftFrame);
    
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 6, 0.2),
      frameMaterial
    );
    rightFrame.position.set(5, 2, -4);
    rightFrame.castShadow = true;
    shojiGroup.add(rightFrame);
    
    // Top frame
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.2, 0.2),
      frameMaterial
    );
    topFrame.position.set(0, 5, -4);
    topFrame.castShadow = true;
    shojiGroup.add(topFrame);
    
    this.scene.add(shojiGroup);
  }
  
  async createWhiteOakBoard() {
    
    
    // Enhanced white oak texture
    const oakTexture = this.createWhiteOakTexture();
    
    const boardGeometry = new THREE.BoxGeometry(8, 0.3, 3);
    const boardMaterial = new THREE.MeshPhysicalMaterial({
      map: oakTexture,
      roughness: 0.7,
      metalness: 0.05,
      clearcoat: 0.2,
      clearcoatRoughness: 0.8
    });
    
    this.oakBoard = new THREE.Mesh(boardGeometry, boardMaterial);
    this.oakBoard.position.set(0, 0.15, 0);
    this.oakBoard.castShadow = true;
    this.oakBoard.receiveShadow = true;
    
    this.scene.add(this.oakBoard);
  }
  
  async createConveyorBelt() {
    
    
    // Invisible conveyor track for sushi movement
    this.conveyorTrack = new THREE.Group();
    this.scene.add(this.conveyorTrack);
    
    // Track markers (subtle guide lines)
    const trackMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b7355,
      transparent: true,
      opacity: 0.1
    });
    
    for (let i = 0; i < 3; i++) {
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 0.5),
        trackMaterial
      );
      marker.position.set(-6 + i * 6, 0.31, 0);
      marker.rotation.x = -Math.PI / 2;
      this.conveyorTrack.add(marker);
    }
  }
  
  createWhiteOakTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // White oak base color (lighter than regular oak)
    const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
    gradient.addColorStop(0, '#f5f0e8');
    gradient.addColorStop(0.3, '#ede4d3');
    gradient.addColorStop(0.7, '#e6d7c3');
    gradient.addColorStop(1, '#ddd0b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Fine wood grain
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 512; i += 2) {
      const waveIntensity = Math.sin(i * 0.02) * 0.1;
      const opacity = 0.9 + waveIntensity + Math.random() * 0.05;
      ctx.fillStyle = `rgba(200, 180, 150, ${opacity})`;
      ctx.fillRect(0, i, 1024, 1);
    }
    
    // Subtle knots
    ctx.globalCompositeOperation = 'overlay';
    for (let j = 0; j < 4; j++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const radius = Math.random() * 20 + 8;
      const knotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      knotGradient.addColorStop(0, 'rgba(160, 140, 120, 0.3)');
      knotGradient.addColorStop(1, 'rgba(160, 140, 120, 0)');
      ctx.fillStyle = knotGradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }
  
  cloneSushiGroup(originalGroup) {
    // Create a new group
    const clonedGroup = new THREE.Group();
    
    // Check if originalGroup has children
    if (!originalGroup || !originalGroup.children) {
      console.warn('Cannot clone sushi group - no children found');
      return clonedGroup;
    }
    
    // Clone all children
    originalGroup.children.forEach(child => {
      if (child.isMesh) {
        const clonedMesh = new THREE.Mesh(
          child.geometry.clone(),
          child.material.clone()
        );
        clonedMesh.position.copy(child.position);
        clonedMesh.rotation.copy(child.rotation);
        clonedMesh.scale.copy(child.scale);
        clonedMesh.castShadow = child.castShadow;
        clonedMesh.receiveShadow = child.receiveShadow;
        clonedGroup.add(clonedMesh);
      }
    });
    
    return clonedGroup;
  }
  
  displaySushi(type, strategicValue = 0.5, category = 'normal') {
    // Create new sushi on the conveyor belt
    const sushiModel = this.sushiTypes[type];
    if (!sushiModel) {
      console.warn(`Unknown sushi type: ${type}`);
      return;
    }
    
    // Clone and position sushi at the start of the belt
    const newSushi = sushiModel.clone ? sushiModel.clone() : this.cloneSushiGroup(sushiModel);
    newSushi.position.set(-8, 0.5, 0); // Start from left side
    
    // Apply strategic effects
    this.applyStrategicEffects(newSushi, strategicValue, category);
    
    // Add to conveyor belt group
    this.conveyorBelt.sushiPlates.push({
      mesh: newSushi,
      startTime: Date.now(),
      category: category
    });
    
    this.scene.add(newSushi);
    
    // Remove current sushi (it will be animated off)
    if (this.currentSushi) {
      this.currentSushi = null;
    }
    
    
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
      
      // Update conveyor belt animation
      this.updateConveyorBelt();
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
    };
    
    render();
  }
  
  updateConveyorBelt() {
    const currentTime = Date.now();
    
    // Move sushi plates along the belt
    for (let i = this.conveyorBelt.sushiPlates.length - 1; i >= 0; i--) {
      const plate = this.conveyorBelt.sushiPlates[i];
      const elapsedTime = (currentTime - plate.startTime) / 1000; // seconds
      
      // Move sushi from left to right
      const progress = elapsedTime * this.conveyorBelt.speed * 10;
      plate.mesh.position.x = -8 + progress;
      
      // Gentle floating animation
      plate.mesh.position.y = 0.5 + Math.sin(currentTime * 0.002 + i) * 0.02;
      
      // Subtle rotation
      plate.mesh.rotation.y = Math.sin(currentTime * 0.001 + i) * 0.05;
      
      // Remove sushi that has moved off screen
      if (plate.mesh.position.x > 8) {
        this.scene.remove(plate.mesh);
        this.conveyorBelt.sushiPlates.splice(i, 1);
      }
    }
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