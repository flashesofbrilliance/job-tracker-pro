# 🍣 Job Tracker Pro - Photorealistic Sushi Discovery

A revolutionary job tracking and discovery web app featuring **photorealistic 3D sushi** on a **Japanese zen-inspired conveyor belt**. Transform your job search into an immersive, strategic experience with culinary-inspired skill systems.

## ✨ Key Features

### 🎮 **Photorealistic 3D Sushi Discovery**
- **WebGL2-powered** photorealistic sushi with PBR materials
- **GPU-optimized rendering** with adaptive quality settings
- **Japanese woodblock-inspired** zen table setting
- **White oak** minimalist design with subtle zen glow
- **White orchid** and **casual bonsai** table accents
- **Sakura print banner** background for authentic aesthetic
- **Fish marbling/fattiness** attributes for ultra-realistic detail

### 🍽️ **Culinary Job Search Systems**
- **Mise en Place**: Daily preparation habit tracker with luck surface area multiplier
- **Knife Skills**: Application precision & speed measurement system
- **Chef Strategy**: Strategic pacing based on offer targets and deadlines
- **Skill Progression**: NOVICE → APPRENTICE → CHEF → MASTER levels
- **Mastery Achievements**: 🎯 Sniper, ⚡ Lightning, 🎨 Artisan badges

### 🎯 **Interactive Controls**
- **Zen Studio Mixer**: Tune oak characteristics, wood grain, zen glow
- **Real-time Material Adjustment**: Interactive shader parameter controls
- **Adaptive Quality Settings**: Hardware-optimized rendering performance

## 🚀 Quick Start

### Option 1: Warp Terminal Compatible (Recommended for Warp users)
```bash
./start-warp-compatible.sh
```
**Specifically designed for Warp terminal users** - bypasses localhost interception

### Option 2: Clean Development Server 
```bash
./start-clean.sh
```
**Features:**
- ✅ Node.js development server with API mocking
- ✅ All asset types supported (WebP, GLSL, WebM, JSON)
- ✅ Comprehensive 404 handling and diagnostics
- ✅ Service worker cache management
- ✅ Real-time health checks for all endpoints
- ✅ Automatic server cleanup and port management

### Option 2: Legacy Python Server
```bash
./rebuild.sh     # Basic Python http.server
```

### Option 3: NPM Scripts
```bash
npm install
npm run dev      # http://127.0.0.1:3000
npm run serve    # http://127.0.0.1:8080
```

**Experience the Discovery Engine:**
- Sushi Discovery (Primary): `http://127.0.0.1:8080/discovery.html`
- Main Job Tracker: `http://127.0.0.1:8080/`
- API Endpoints: `http://127.0.0.1:8080/api/job-recommendations`

### 🔧 Troubleshooting 404s & "Enable JavaScript" Errors

**Problem:** Seeing "Warp You need to enable JavaScript" or 404s?

**Solution for Warp Terminal Users:**
1. **Use Warp-compatible server:** `./start-warp-compatible.sh` 
2. **Copy/paste URL into external browser** (don't click links in Warp)
3. **Use port 8081** instead of 8080: `http://127.0.0.1:8081/discovery.html`
4. **Alternative:** Use `open http://127.0.0.1:8081/discovery.html`

**Solution for Other Terminals:**
1. **Use clean dev server:** `./start-clean.sh` 
2. **Clear browser cache:** DevTools → Application → Storage → Clear Storage
3. **Hard refresh:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
4. **Check Node.js:** `node --version` (should be >= 14)

**Root Causes:**
- **Warp terminal intercepts localhost:8080** and shows its own "enable JavaScript" page
- Python `http.server` can't handle API endpoints (`/api/*`)
- Missing MIME types for WebP, GLSL, WebM assets
- Service worker caching old 404 responses

**How Warp Bypass Works:**
- Uses port 8081 instead of 8080 (avoids Warp interception)
- Binds to 0.0.0.0 instead of just localhost
- Forces external browser usage instead of Warp's internal view

## 🏧 Technical Architecture

### 🚀 **Performance Systems**
- **GPU Hardware Detection**: Automatic client-side hardware profiling
- **Adaptive Quality Rendering**: Dynamic quality adjustment based on FPS
- **Resource Management**: Texture streaming, model LOD, GPU memory optimization
- **WebGL Extensions**: Anisotropic filtering, float textures, instancing
- **Mobile Optimization**: Battery-aware power saving, thermal throttling detection

### 🎨 **Rendering Pipeline**
- **PBR Materials**: Physically-based rendering for photorealistic sushi
- **Real-time Lighting**: Dynamic shadows, reflections, bloom effects
- **Procedural Textures**: Fallback generation for white oak wood grain
- **Shader Systems**: Custom GLSL shaders for zen aesthetics

### 📊 **Data & Analytics**
- **Learning Signals**: ML-style recommendation analysis
- **Strategic Analytics**: Application timing, competition analysis
- **Performance Metrics**: Real-time FPS, GPU memory usage tracking

## 🛠️ Scripts

### Development
- `npm start` or `./start-clean.sh`: Clean development server with API mocking
- `npm run dev-server`: Node.js server only  
- `npm run serve`: Legacy Python server
- `./qa-health-check.sh`: Comprehensive health check and 404 diagnostics

### Build & Deploy  
- `npm run build:discovery`: Build optimized discovery app
- `npm run bootstrap:ci`: Setup GitHub Pages + Environments (requires gh CLI)
- `npm run setup:pipeline`: Fetch CI/CD workflows from reference repo

### Testing & QA
- `npm run test:syntax`: JavaScript syntax validation
- `npm run api:health`: API endpoint health check

## CI/CD
- Run to configure Environments + Pages:
```bash
npm run bootstrap:ci
```
- Then scaffold workflows from the reference project (optional):
```bash
npm run setup:pipeline
```

## 🌍 **Live Demo**

**🍣 Experience the Photorealistic Sushi Discovery:**
https://flashesofbrilliance.github.io/job-tracker-pro/discovery.html

**📋 Main Job Tracker:**
https://flashesofbrilliance.github.io/job-tracker-pro/

## 🚀 **Deployment**

Automatic deployment via GitHub Actions:

```bash
# Setup CI/CD
npm run bootstrap:ci

# Add remote and deploy
git remote add origin https://github.com/<owner>/job-tracker-pro.git
git push -u origin main
```

### 🎯 **Branch Strategy**
- `main`: Production deployment
- `discovery/main`: Discovery engine development
- `gh-pages`: Automated deployment target

### 💡 **Features in Development**
- [ ] Interactive zen studio mixer controls
- [ ] Additional sushi varieties (uni, ikura, hamachi)
- [ ] Advanced fish marbling/fattiness parameters
- [ ] VR/AR sushi discovery mode
- [ ] Multiplayer sushi bar networking

---

*Transform your job search into a zen, strategic, and visually stunning experience with photorealistic 3D sushi discovery! 🍣🎆*
