#!/bin/bash

echo "🏮 Starting clean rebuild of Japanese Sushi Discovery Engine..."

# Kill any running servers
echo "🔄 Stopping existing servers..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 2

# Clean any cached files
echo "🧹 Cleaning build artifacts..."
rm -rf dist-discovery/
rm -f server.log
rm -f nohup.out

# Create fresh dist directory
echo "📦 Creating fresh build directory..."
mkdir -p dist-discovery

# Copy all source files with fresh timestamps
echo "📋 Copying source files..."
cp -r *.html *.js *.css *.json *.md icons/ assets/ dist-discovery/ 2>/dev/null || true

# Update cache busting in discovery.html with current timestamp
TIMESTAMP=$(date +%s)
echo "🏷️  Updating cache busting to timestamp: $TIMESTAMP"

sed -i '' "s/v=[0-9]*&cb=[^\"']*/v=6&cb=$TIMESTAMP/g" discovery.html
sed -i '' "s/v=[0-9]*&cb=[^\"']*/v=6&cb=$TIMESTAMP/g" dist-discovery/discovery.html 2>/dev/null || true

# Validate JavaScript files
echo "🔍 Validating JavaScript files..."
for jsfile in discovery.js sushi-scene-manager.js woodblock-patterns.js performance-manager.js; do
    if [[ -f "$jsfile" ]]; then
        echo "  ✅ $jsfile exists"
        # Check for common syntax errors
        if grep -q "export default" "$jsfile"; then
            echo "  ⚠️  Found ES6 export in $jsfile - needs fixing"
        fi
    else
        echo "  ❌ $jsfile missing!"
    fi
done

# Start fresh server
echo "🚀 Starting fresh development server..."
python3 -m http.server 8080 --bind 127.0.0.1 > server.log 2>&1 &
sleep 3

# Check if server started
if lsof -i :8080 > /dev/null; then
    echo "✅ Server started successfully on http://localhost:8080"
    echo "🎌 Discovery Engine ready at: http://localhost:8080/discovery.html"
    echo "🧪 Debug 3D Scene at: http://localhost:8080/debug-3d.html"
    echo ""
    echo "🔄 Force refresh your browser (Cmd+Shift+R) to see changes"
else
    echo "❌ Server failed to start"
    exit 1
fi

echo "🏮 Rebuild complete!"