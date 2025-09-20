#!/bin/bash
set -euo pipefail

echo "🍣 Deploying Sushi Discovery PWA to GitHub Pages..."

# Build the discovery app
echo "📦 Building Discovery PWA..."
npm run build:discovery

# Create a temporary directory for gh-pages
TEMP_DIR=$(mktemp -d)
echo "📁 Using temp directory: $TEMP_DIR"

# Copy built files to temp directory
cp -R dist-discovery/* "$TEMP_DIR/"

# Create index.html redirect if it doesn't exist
if [ ! -f "$TEMP_DIR/index.html" ]; then
  cat > "$TEMP_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sushi Discovery PWA</title>
  <meta name="description" content="Immersive Japanese omakase-themed job discovery experience">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=./discovery.html">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍣</text></svg>">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div>
    <h1 style="font-size: 3rem; margin-bottom: 1rem;">🍣</h1>
    <h2 style="margin-bottom: 1rem;">Sushi Discovery PWA</h2>
    <p style="margin-bottom: 2rem;">Redirecting to the immersive omakase job discovery experience...</p>
    <a href="./discovery.html" style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 1rem 2rem; border-radius: 50px; text-decoration: none; border: 2px solid white; transition: all 0.3s;">Launch App</a>
  </div>
</body>
</html>
EOF
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "🔄 Current branch: $CURRENT_BRANCH"

# Stash any changes
git stash push -m "temp stash for deployment"

# Switch to gh-pages branch or create it
if git show-ref --verify --quiet refs/heads/gh-pages; then
  echo "🔄 Switching to existing gh-pages branch..."
  git checkout gh-pages
else
  echo "🔄 Creating new gh-pages branch..."
  git checkout --orphan gh-pages
fi

# Remove existing files (but keep .git)
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} \; 2>/dev/null || true

# Copy new files
cp -R "$TEMP_DIR"/* .

# Add all files
git add .

# Commit
COMMIT_MESSAGE="Deploy Sushi Discovery PWA - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE" || echo "Nothing to commit"

# Push
echo "🚀 Pushing to gh-pages..."
git push origin gh-pages --force

# Switch back to original branch
git checkout "$CURRENT_BRANCH"

# Restore stashed changes if any
git stash pop 2>/dev/null || echo "No stash to restore"

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🍣 Sushi Discovery PWA deployed to:"
echo "   https://flashesofbrilliance.github.io/job-tracker-pro/"
echo ""
echo "📱 The app includes:"
echo "   • Progressive Web App capabilities"
echo "   • Service Worker for offline functionality"  
echo "   • Mobile touch controls and haptic feedback"
echo "   • Japanese omakase experience with cultural immersion"
echo "   • Gamification with streaks, achievements, and rewards"
echo "   • Advanced job matching with AI-powered insights"
echo ""
echo "🎮 Controls:"
echo "   • Swipe Right / → : Accept job"
echo "   • Swipe Left / ← : Reject job"
echo "   • Swipe Up / Space : Next sushi"
echo ""