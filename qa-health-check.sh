#!/bin/bash

# Comprehensive QA Health Check for Sushi Discovery Engine
# Based on the surgical QA plan to eliminate 404s and performance issues

set -e

echo "🏮 Sushi Discovery Engine - Comprehensive QA Health Check"
echo "========================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    FAILED=$((FAILED + 1))
  fi
}

warning_result() {
  echo -e "${YELLOW}⚠️ WARNING${NC}: $1"
  WARNINGS=$((WARNINGS + 1))
}

info_result() {
  echo -e "${BLUE}ℹ️ INFO${NC}: $1"
}

echo ""
echo "🔍 PHASE 1: KILL THE 404s (PATHS & FILES)"
echo "========================================="

# Check if Node.js server is running
if lsof -i :8080 | grep -q node; then
  test_result 0 "Node.js development server is running on port 8080"
else
  if lsof -i :8080 | grep -q Python; then
    warning_result "Python server detected instead of Node.js - API endpoints won't work"
    echo "   💡 Run: kill -9 $(lsof -ti:8080) && ./start-clean.sh"
  else
    test_result 1 "No server running on port 8080"
    echo "   💡 Run: ./start-clean.sh"
  fi
fi

echo ""
echo "📁 Testing critical file paths..."

# Critical files that were causing 404s
critical_files=(
  "discovery.html"
  "style.css" 
  "discovery.js"
  "favicon.ico"
  "manifest.json"
  "icons/icon-192x192.png"
  "assets/sushi-sprites.webp"
  "assets/swipe-sounds.webm" 
  "shaders/particle-effects.glsl"
  "api/job-recommendations.json"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    test_result 0 "File exists: $file"
  else
    test_result 1 "Missing file: $file"
  fi
done

echo ""
echo "🌐 Testing HTTP endpoints..."

# Test HTTP endpoints that were failing
endpoints=(
  "http://127.0.0.1:8080/discovery.html|Discovery HTML"
  "http://127.0.0.1:8080/style.css|Stylesheet"
  "http://127.0.0.1:8080/favicon.ico|Favicon"
  "http://127.0.0.1:8080/manifest.json|PWA Manifest"
  "http://127.0.0.1:8080/icons/icon-192x192.png|App Icon"
  "http://127.0.0.1:8080/assets/sushi-sprites.webp|Sushi Sprites"
  "http://127.0.0.1:8080/shaders/particle-effects.glsl|WebGL Shader"
  "http://127.0.0.1:8080/api/job-recommendations|Jobs API"
)

for endpoint in "${endpoints[@]}"; do
  url=$(echo "$endpoint" | cut -d'|' -f1)
  name=$(echo "$endpoint" | cut -d'|' -f2)
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  
  if [ "$status_code" = "200" ]; then
    test_result 0 "$name responds with HTTP 200"
  else
    test_result 1 "$name responds with HTTP $status_code"
  fi
done

echo ""
echo "🔄 PHASE 2: SERVICE WORKER HYGIENE"  
echo "=================================="

# Check service worker cache version
if grep -q "v2025-09-21-clean" sw.js; then
  test_result 0 "Service worker has updated cache version"
else
  test_result 1 "Service worker cache version needs update"
  echo "   💡 Update CACHE_NAME in sw.js to force cache refresh"
fi

# Check for 404 caching prevention
if grep -q "Don't cache if not a valid response" sw.js; then
  test_result 0 "Service worker prevents 404 caching"
else
  warning_result "Service worker may cache 404 responses"
fi

echo ""
echo "📊 PHASE 3: API MOCKING VALIDATION"
echo "================================="

# Test API endpoints return proper JSON
api_response=$(curl -s http://127.0.0.1:8080/api/job-recommendations 2>/dev/null || echo '{"error":"no response"}')

if echo "$api_response" | grep -q '"jobs"'; then
  test_result 0 "API returns job data"
  
  # Count jobs in response
  job_count=$(echo "$api_response" | grep -o '"id"' | wc -l | tr -d ' ')
  if [ "$job_count" -gt 0 ]; then
    info_result "API returns $job_count jobs"
  fi
else
  test_result 1 "API does not return expected job data"
fi

# Test individual job endpoint
job_response=$(curl -s http://127.0.0.1:8080/api/jobs/job-1 2>/dev/null || echo '{"error":"no response"}')
if echo "$job_response" | grep -q '"company"'; then
  test_result 0 "Individual job API endpoint works"
else
  test_result 1 "Individual job API endpoint fails"
fi

echo ""
echo "🎨 PHASE 4: ASSET VALIDATION & MIME TYPES"
echo "========================================="

# Check content types are served correctly
webp_content_type=$(curl -s -I http://127.0.0.1:8080/assets/sushi-sprites.webp | grep -i content-type | cut -d' ' -f2 | tr -d '\r')
if echo "$webp_content_type" | grep -q "image/webp"; then
  test_result 0 "WebP files served with correct MIME type"
else
  test_result 1 "WebP files served with incorrect MIME type: $webp_content_type"
fi

glsl_content_type=$(curl -s -I http://127.0.0.1:8080/shaders/particle-effects.glsl | grep -i content-type | cut -d' ' -f2 | tr -d '\r')
if echo "$glsl_content_type" | grep -q "text/plain"; then
  test_result 0 "GLSL files served with correct MIME type"
else
  warning_result "GLSL files served with MIME type: $glsl_content_type (should be text/plain)"
fi

echo ""
echo "⚡ PHASE 5: PERFORMANCE & CACHE BUSTING"
echo "======================================="

# Check cache-busting parameters in HTML
if grep -q "t=[0-9]" discovery.html; then
  test_result 0 "Cache-busting timestamps found in HTML"
else
  warning_result "Cache-busting timestamps missing from HTML"
fi

# Check server response times
start_time=$(date +%s)
curl -s http://127.0.0.1:8080/discovery.html > /dev/null
end_time=$(date +%s)
response_time=$(((end_time - start_time) * 1000))

if [ "$response_time" -lt 500 ]; then
  test_result 0 "Discovery page loads in ${response_time}ms (< 500ms)"
elif [ "$response_time" -lt 1000 ]; then
  warning_result "Discovery page loads in ${response_time}ms (acceptable but could be faster)"  
else
  test_result 1 "Discovery page loads in ${response_time}ms (too slow, > 1000ms)"
fi

echo ""
echo "🔬 PHASE 6: JAVASCRIPT SYNTAX & RUNTIME VALIDATION"
echo "=================================================="

# Check JavaScript syntax
if node -c discovery.js > /dev/null 2>&1; then
  test_result 0 "discovery.js has valid syntax"
else
  test_result 1 "discovery.js has syntax errors"
fi

if node -c sushi-scene-manager.js > /dev/null 2>&1; then
  test_result 0 "sushi-scene-manager.js has valid syntax"
else
  test_result 1 "sushi-scene-manager.js has syntax errors"
fi

if node -c dev-server.js > /dev/null 2>&1; then
  test_result 0 "dev-server.js has valid syntax"
else
  test_result 1 "dev-server.js has syntax errors"
fi

echo ""
echo "🏆 FINAL HEALTH CHECK RESULTS"
echo "============================="

total_tests=$((PASSED + FAILED))
pass_rate=0
if [ "$total_tests" -gt 0 ]; then
  pass_rate=$(echo "scale=1; $PASSED * 100 / $total_tests" | bc -l 2>/dev/null || echo "N/A")
fi

echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}" 
echo -e "${YELLOW}⚠️ WARNINGS: $WARNINGS${NC}"
echo "📊 PASS RATE: ${pass_rate}%"

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CRITICAL TESTS PASSED!${NC}"
  echo "🍣 Sushi Discovery Engine is ready for smooth conveyor belt job discovery!"
  echo ""
  echo "🌐 Open in browser: http://127.0.0.1:8080/discovery.html"
  echo ""
  echo "💡 Next steps:"
  echo "   • Clear browser cache if you see old 404s" 
  echo "   • Use hard refresh (Cmd+Shift+R) to bypass cache"
  echo "   • Check browser console for any remaining JavaScript errors"
elif [ "$FAILED" -le 2 ] && [ "$PASSED" -ge 15 ]; then
  echo -e "${YELLOW}⚠️ MOSTLY HEALTHY - MINOR ISSUES DETECTED${NC}"
  echo "🍣 Sushi Discovery Engine should work but may have some issues"
  echo ""
  echo "🔧 Fix the failed tests above and run this script again"
else
  echo -e "${RED}❌ CRITICAL ISSUES DETECTED${NC}"
  echo "🚨 Sushi Discovery Engine needs attention before use"
  echo ""
  echo "🔧 Address the failed tests above, then run:"
  echo "   ./start-clean.sh"
  echo "   ./qa-health-check.sh"
fi

echo ""
echo "📋 For detailed server logs: cat server.log"
echo "🛑 To stop server: kill \$(lsof -ti:8080)"

exit $FAILED