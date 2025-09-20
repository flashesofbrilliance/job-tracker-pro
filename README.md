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

```bash
npm install
npm run dev      # http://127.0.0.1:3000
# or
npm run serve    # http://127.0.0.1:8080
```

**Experience the Discovery Engine:**
- Main app: `http://localhost:8080/`
- Sushi Discovery: `http://localhost:8080/discovery.html`

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
- `dev`: Live-reload dev server on port 3000
- `serve`: Static server on port 8080
- `build:discovery`: Build optimized discovery app
- `bootstrap:ci`: Setup GitHub Pages + Environments (requires gh CLI)
- `setup:pipeline`: Fetch CI/CD workflows from reference repo

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
