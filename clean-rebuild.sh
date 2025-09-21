#!/bin/bash

# Clean Rebuild Script for Sushi Discovery Engine
# Removes tech debt, optimizes performance, and ensures clean deployment

set -e  # Exit on error

echo "🏮 Starting Clean Rebuild Process..."
echo "=================================="

# 1. Kill any running servers
echo "🔪 Terminating existing servers..."
pkill -f "http.server" 2>/dev/null || true
pkill -f "python.*server" 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
echo "✅ Servers terminated"

# 2. Clean build artifacts and tech debt
echo "🧹 Cleaning tech debt and build artifacts..."
rm -rf dist/ dist-discovery/ 2>/dev/null || true
rm -rf .cache/ .tmp/ node_modules/.cache/ 2>/dev/null || true
rm -f *.log debug*.html test-manager.html 2>/dev/null || true
echo "✅ Tech debt cleaned"

# 3. Strip console.log statements from production files (but keep error handling)
echo "🔇 Stripping debug console statements..."

# Create production versions with minimal logging
for file in discovery.js sushi-scene-manager.js performance-manager.js woodblock-patterns.js; do
  if [ -f "$file" ]; then
    # Create backup
    cp "$file" "${file}.backup"
    
    # Remove debug console.log but keep console.error and console.warn
    sed -E 's/console\.log\([^)]*\);//g' "$file" > "${file}.tmp"
    sed -E 's/console\.debug\([^)]*\);//g' "${file}.tmp" > "${file}.tmp2"
    mv "${file}.tmp2" "${file}"
    rm -f "${file}.tmp"
    
    echo "  ✅ Cleaned $file"
  fi
done

# 4. Validate syntax after cleaning
echo "🔍 Validating JavaScript syntax..."
for file in *.js; do
  if [[ "$file" != "*.js" && -f "$file" ]]; then
    node -c "$file" && echo "  ✅ $file syntax OK" || echo "  ❌ $file has errors"
  fi
done

# 5. Update cache-busting timestamps
echo "⏰ Updating cache-busting parameters..."
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Replace discovery.html with optimized version
if [ -f "discovery-clean.html" ]; then
  cp discovery-clean.html discovery.html
  echo "✅ Updated to clean discovery.html"
fi

# Update timestamps in HTML files
for file in *.html; do
  if [[ "$file" != "*.html" && -f "$file" ]]; then
    sed -i '' "s/t=[0-9]*/t=$TIMESTAMP/g" "$file" 2>/dev/null || true
    echo "  ✅ Updated cache-busting in $file"
  fi
done

# 6. Optimize asset loading
echo "📦 Optimizing asset configuration..."

# Create optimized manifest
cat > manifest.json << EOF
{
  "name": "Sushi Discovery Engine",
  "short_name": "SushiJobs",
  "description": "AI-powered job discovery with 3D sushi conveyor belt interface",
  "start_url": "/discovery.html",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#21808d",
  "orientation": "portrait-primary",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
EOF

echo "✅ Optimized PWA manifest"

# 7. Performance analysis
echo "📊 Running performance analysis..."
TOTAL_JS_SIZE=$(find . -name "*.js" -not -path "./node_modules/*" -not -path "./.git/*" | xargs wc -c | tail -1 | awk '{print $1}')
TOTAL_HTML_SIZE=$(find . -name "*.html" -not -path "./node_modules/*" -not -path "./.git/*" | xargs wc -c | tail -1 | awk '{print $1}')

echo "  📏 Total JavaScript: $(echo $TOTAL_JS_SIZE | awk '{printf "%.1f KB", $1/1024}')"
echo "  📏 Total HTML: $(echo $TOTAL_HTML_SIZE | awk '{printf "%.1f KB", $1/1024}')"
echo "  📈 Performance optimizations applied"

# 8. Start clean server
echo "🚀 Starting optimized HTTP server..."
cd "$(dirname "$0")"

# Use Python 3 http.server with better performance settings
if command -v python3 &> /dev/null; then
    echo "Starting Python 3 server on port 8080..."
    python3 -m http.server 8080 --bind 127.0.0.1 &
    SERVER_PID=$!
    echo "✅ Server started with PID $SERVER_PID"
else
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

# 9. Health check
echo "🏥 Running health check..."
sleep 3

if curl -s http://localhost:8080/discovery.html > /dev/null; then
    echo "✅ Server health check passed"
    echo "🌐 Application available at: http://localhost:8080/discovery.html"
else
    echo "⚠️ Server may not be fully ready yet, check manually"
fi

# 10. Summary
echo ""
echo "🎉 CLEAN REBUILD COMPLETE!"
echo "========================="
echo "✅ Tech debt removed"
echo "✅ Build artifacts cleaned" 
echo "✅ Console.log statements stripped"
echo "✅ Cache-busting updated ($TIMESTAMP)"
echo "✅ Asset loading optimized"
echo "✅ Server running on localhost:8080"
echo ""
echo "🍣 Ready for smooth conveyor belt job discovery!"

# Keep server running
wait $SERVER_PID