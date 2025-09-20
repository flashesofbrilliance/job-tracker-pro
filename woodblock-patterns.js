/**
 * Japanese Woodblock Pattern System
 * Creates sophisticated grayscale patterns inspired by ukiyo-e scoring techniques
 * for indicating depth, texture, and material properties in 64-bit precision
 */

class WoodblockPatternSystem {
  constructor() {
    this.patterns = new Map();
    this.canvasCache = new Map();
    this.init();
  }
  
  init() {
    console.log('🎨 Initializing Japanese Woodblock Pattern System...');
    this.createBasePatterns();
    this.createTexturePatterns();
    this.createDepthIndicators();
  }
  
  createBasePatterns() {
    // Traditional Japanese line scoring patterns
    
    // Bōkashi (gradation) - for depth transitions
    this.patterns.set('bokashi-horizontal', {
      type: 'linear-gradient',
      generator: (width, height, intensity = 0.8) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        const steps = 64; // 64-bit precision
        
        for (let i = 0; i <= steps; i++) {
          const position = i / steps;
          const grayValue = Math.floor(255 * (1 - position * intensity));
          gradient.addColorStop(position, `rgb(${grayValue}, ${grayValue}, ${grayValue})`);
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        return canvas;
      }
    });
    
    // Ame (rain lines) - for texture indication
    this.patterns.set('ame', {
      type: 'diagonal-lines',
      generator: (width, height, density = 0.3, angle = 45) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        const lineSpacing = Math.floor(width * density);
        const angleRad = (angle * Math.PI) / 180;
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.3;
        
        for (let x = -height; x < width + height; x += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + Math.tan(angleRad) * height, height);
          ctx.stroke();
        }
        
        return canvas;
      }
    });
    
    // Nami (wave pattern) - for water/fluid textures
    this.patterns.set('nami', {
      type: 'wave-pattern',
      generator: (width, height, frequency = 8, amplitude = 0.2) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const wave1 = Math.sin((x / width) * frequency * 2 * Math.PI);
            const wave2 = Math.sin((y / height) * frequency * 1.5 * Math.PI);
            const combined = (wave1 + wave2) * amplitude;
            
            const grayValue = Math.floor(128 + combined * 127);
            const index = (y * width + x) * 4;
            
            data[index] = grayValue;     // R
            data[index + 1] = grayValue; // G
            data[index + 2] = grayValue; // B
            data[index + 3] = 255;       // A
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    });
    
    // Kumiko (interlaced geometric) - for wood grain
    this.patterns.set('kumiko', {
      type: 'geometric-interlace',
      generator: (width, height, gridSize = 8) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f5f3f0';
        ctx.fillRect(0, 0, width, height);
        
        // Create interlaced pattern
        for (let y = 0; y < height; y += gridSize) {
          for (let x = 0; x < width; x += gridSize) {
            const pattern = (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2;
            const grayValue = pattern ? 240 : 220;
            
            ctx.fillStyle = `rgb(${grayValue}, ${grayValue-10}, ${grayValue-20})`;
            ctx.fillRect(x, y, gridSize, gridSize);
            
            // Add fine lines
            ctx.strokeStyle = `rgba(0, 0, 0, 0.1)`;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, gridSize, gridSize);
          }
        }
        
        return canvas;
      }
    });
  }
  
  createTexturePatterns() {
    // Fish skin texture with scales
    this.patterns.set('fish-scales', {
      type: 'organic-texture',
      generator: (width, height, scaleSize = 4) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Create scale pattern
            const scaleX = Math.floor(x / scaleSize);
            const scaleY = Math.floor(y / scaleSize);
            const localX = (x % scaleSize) / scaleSize;
            const localY = (y % scaleSize) / scaleSize;
            
            // Circular scale pattern
            const distance = Math.sqrt(Math.pow(localX - 0.5, 2) + Math.pow(localY - 0.5, 2));
            const scaleIntensity = Math.max(0, 1 - distance * 2);
            
            // Add noise for organic feel
            const noise = (Math.random() - 0.5) * 0.2;
            const grayValue = Math.floor(200 + (scaleIntensity + noise) * 40);
            
            const index = (y * width + x) * 4;
            data[index] = grayValue;
            data[index + 1] = grayValue;
            data[index + 2] = grayValue;
            data[index + 3] = 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    });
    
    // Rice texture with individual grains
    this.patterns.set('rice-grains', {
      type: 'granular-texture',
      generator: (width, height, grainSize = 2) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Base rice color
        ctx.fillStyle = '#fff8f0';
        ctx.fillRect(0, 0, width, height);
        
        // Add individual grain highlights and shadows
        for (let i = 0; i < (width * height) / (grainSize * grainSize * 2); i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = grainSize * (0.5 + Math.random() * 0.5);
          
          // Grain highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.ellipse(x, y, size, size * 0.6, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.fill();
          
          // Grain shadow
          ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.1})`;
          ctx.beginPath();
          ctx.ellipse(x + 0.5, y + 0.5, size * 0.8, size * 0.4, Math.random() * Math.PI, 0, 2 * Math.PI);
          ctx.fill();
        }
        
        return canvas;
      }
    });
    
    // Nori (seaweed) texture
    this.patterns.set('nori', {
      type: 'fibrous-texture',
      generator: (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Dark base
        ctx.fillStyle = '#1a2820';
        ctx.fillRect(0, 0, width, height);
        
        // Add fibrous texture
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Create fiber-like pattern
            const fiberNoise = Math.random() * 0.3;
            const directionNoise = Math.sin(x * 0.1) * Math.cos(y * 0.08) * 0.2;
            const baseGray = 26 + 40; // Dark green-gray
            
            const grayValue = Math.floor(baseGray + (fiberNoise + directionNoise) * 60);
            const index = (y * width + x) * 4;
            
            data[index] = Math.max(0, grayValue - 20);     // R
            data[index + 1] = grayValue;                   // G  
            data[index + 2] = Math.max(0, grayValue - 10); // B
            data[index + 3] = 255;                         // A
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
      }
    });
  }
  
  createDepthIndicators() {
    // Depth scoring patterns - traditional Japanese depth indication
    
    // Close depth - fine, dense lines
    this.patterns.set('depth-close', {
      type: 'depth-indicator',
      generator: (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Very fine parallel lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.6;
        
        for (let y = 0; y < height; y += 2) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        
        return canvas;
      }
    });
    
    // Medium depth - medium spacing
    this.patterns.set('depth-medium', {
      type: 'depth-indicator',
      generator: (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = 0.4;
        
        for (let y = 0; y < height; y += 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        
        return canvas;
      }
    });
    
    // Far depth - wide spacing, lighter
    this.patterns.set('depth-far', {
      type: 'depth-indicator',
      generator: (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = 0.2;
        
        for (let y = 0; y < height; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        
        return canvas;
      }
    });
  }
  
  // Get pattern as CSS background
  getPatternCSS(patternName, width = 64, height = 64, ...params) {
    const cacheKey = `${patternName}-${width}x${height}-${params.join(',')}`;
    
    if (this.canvasCache.has(cacheKey)) {
      return `url(${this.canvasCache.get(cacheKey).toDataURL()})`;
    }
    
    const pattern = this.patterns.get(patternName);
    if (!pattern) {
      console.warn(`Pattern '${patternName}' not found`);
      return 'none';
    }
    
    const canvas = pattern.generator(width, height, ...params);
    this.canvasCache.set(cacheKey, canvas);
    
    return `url(${canvas.toDataURL()})`;
  }
  
  // Create composite patterns for complex materials
  createCompositePattern(basePattern, overlayPattern, blendMode = 'multiply') {
    // Implementation for combining multiple patterns
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Draw base pattern
    const base = this.patterns.get(basePattern).generator(128, 128);
    ctx.drawImage(base, 0, 0);
    
    // Draw overlay with blend mode
    ctx.globalCompositeOperation = blendMode;
    const overlay = this.patterns.get(overlayPattern).generator(128, 128);
    ctx.drawImage(overlay, 0, 0);
    
    return canvas.toDataURL();
  }
  
  // Generate pattern for specific sushi type
  getSushiPattern(sushiType, quality = 'medium') {
    const patterns = {
      salmon: {
        base: 'fish-scales',
        overlay: 'depth-medium',
        color: '#ff6b6b'
      },
      tuna: {
        base: 'fish-scales', 
        overlay: 'depth-close',
        color: '#cc4444'
      },
      california_roll: {
        base: 'rice-grains',
        overlay: 'nori',
        color: '#f8f8f8'
      },
      dragon_roll: {
        base: 'rice-grains',
        overlay: 'ame',
        color: '#e8e8e8'
      }
    };
    
    const config = patterns[sushiType] || patterns.salmon;
    return this.createCompositePattern(config.base, config.overlay);
  }
}

// Initialize pattern system
const woodblockPatterns = new WoodblockPatternSystem();

export default WoodblockPatternSystem;