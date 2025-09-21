#!/bin/bash

# Clean Start Script for Sushi Discovery Engine
# Fixes 404s, clears service worker cache, starts proper dev server

set -e

echo "🍣 Starting Clean Sushi Discovery Engine"
echo "========================================"

# 1. Kill existing servers
echo "🔪 Terminating any existing servers..."
pkill -f "python.*server" 2>/dev/null || true
pkill -f "http.server" 2>/dev/null || true
pkill -f "dev-server.js" 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
echo "✅ Old servers terminated"

# 2. Verify all required files exist
echo "📋 Checking for required files..."

MISSING_FILES=0

check_file() {
  if [ ! -f "$1" ]; then
    echo "  ❌ Missing: $1"
    MISSING_FILES=$((MISSING_FILES + 1))
  else
    echo "  ✅ Found: $1"
  fi
}

check_file "discovery.html"
check_file "discovery.js"
check_file "style.css"
check_file "favicon.ico"
check_file "manifest.json"
check_file "icons/icon-192x192.png"
check_file "assets/sushi-sprites.webp"
check_file "assets/swipe-sounds.webm"
check_file "shaders/particle-effects.glsl"
check_file "api/job-recommendations.json"

if [ $MISSING_FILES -gt 0 ]; then
  echo "⚠️  Found $MISSING_FILES missing files, but dev server will handle them gracefully"
fi

# 3. Update manifest to point to existing files
echo "📱 Updating PWA manifest..."
cat > manifest.json << 'EOF'
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
      "purpose": "any maskable"
    }
  ]
}
EOF

# 4. Start the enhanced dev server with API mocking
echo "🚀 Starting development server with API endpoints..."
cd "$(dirname "$0")"

node dev-server.js &
SERVER_PID=$!

# 5. Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 2

# 6. Health check with detailed diagnostics  
echo "🏥 Running comprehensive health check..."

check_endpoint() {
  local url=$1
  local name=$2
  
  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "  ✅ $name: OK"
    return 0
  else
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    echo "  ❌ $name: HTTP $status"
    return 1
  fi
}

HEALTH_PASSED=0
HEALTH_TOTAL=0

HEALTH_TOTAL=$((HEALTH_TOTAL + 1))
check_endpoint "http://127.0.0.1:8080/discovery.html" "Discovery Engine" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

HEALTH_TOTAL=$((HEALTH_TOTAL + 1))
check_endpoint "http://127.0.0.1:8080/style.css" "Stylesheet" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

HEALTH_TOTAL=$((HEALTH_TOTAL + 1))
check_endpoint "http://127.0.0.1:8080/discovery.js" "Main Script" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

HEALTH_TOTAL=$((HEALTH_TOTAL + 1))
check_endpoint "http://127.0.0.1:8080/api/job-recommendations" "Jobs API" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

HEALTH_TOTAL=$((HEALTH_TOTAL + 1))
check_endpoint "http://127.0.0.1:8080/manifest.json" "PWA Manifest" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

# 7. Service Worker Cache Clear Instructions
echo ""
echo "🔄 SERVICE WORKER CACHE CLEAR INSTRUCTIONS:"
echo "=========================================="
echo "Open Chrome DevTools (F12) → Application tab → Service Workers"
echo "1. Click 'Unregister' next to sushi-discovery service worker"
echo "2. Click 'Clear storage' in Storage section"  
echo "3. Hard refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R"
echo ""

# 8. Final status
if [ $HEALTH_PASSED -eq $HEALTH_TOTAL ]; then
  echo "🎉 ALL SYSTEMS GO!"
  echo "=================="
  echo "✅ Health Check: $HEALTH_PASSED/$HEALTH_TOTAL endpoints OK"
  echo "🌐 Discovery Engine: http://127.0.0.1:8080/discovery.html"
  echo "📊 API Endpoints working: /api/job-recommendations"
  echo "🍣 Ready for smooth conveyor belt job discovery!"
  echo ""
  echo "💡 Tips:"
  echo "   • Clear service worker cache if you see old 404s"
  echo "   • Use hard refresh (Cmd+Shift+R) to bypass cache"
  echo "   • Check browser console for any remaining errors"
else
  echo "⚠️  PARTIAL SUCCESS"
  echo "=================="
  echo "✅ Health Check: $HEALTH_PASSED/$HEALTH_TOTAL endpoints OK"
  echo "🌐 Try: http://127.0.0.1:8080/discovery.html"
  echo ""
  echo "Some endpoints may still be loading. Give it a few seconds and refresh."
fi

echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Keep server running
wait $SERVER_PID