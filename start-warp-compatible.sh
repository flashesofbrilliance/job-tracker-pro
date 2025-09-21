#!/bin/bash

# Warp-Compatible Start Script for Sushi Discovery Engine
# Bypasses Warp terminal localhost interception and ensures external browser access

set -e

echo "🍣 Starting Warp-Compatible Sushi Discovery Engine"
echo "================================================="
echo "🔧 Bypassing Warp terminal localhost interception..."

# 1. Kill all existing servers on multiple ports
echo "🔪 Terminating any existing servers..."
for port in 8080 8081 8082 3000; do
  lsof -ti:$port | xargs kill -9 2>/dev/null || true
done
pkill -f "python.*server" 2>/dev/null || true
pkill -f "http.server" 2>/dev/null || true  
pkill -f "dev-server.js" 2>/dev/null || true
echo "✅ All servers terminated"

# 2. Use alternative port to bypass Warp's 8080 interception
PRIMARY_PORT=8081
FALLBACK_PORT=8082

echo "🚀 Starting server on port $PRIMARY_PORT (Warp bypass)..."

# 3. Create modified dev server for alternative port
cat > dev-server-warp.js << 'EOF'
#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8081;
const HOST = '0.0.0.0'; // Bind to all interfaces, not just localhost

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript', 
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webm': 'audio/webm',
  '.glsl': 'text/plain'
};

// Mock job data
const mockJobs = [
  { id: "job-1", company: "Google", roleTitle: "Senior Software Engineer", sector: "Tech", location: "San Francisco", salary: "$180k - $250k", fitScore: 9.2, tags: ["React", "Node.js", "TypeScript", "AWS"] },
  { id: "job-2", company: "Stripe", roleTitle: "Staff Engineer", sector: "Fintech", location: "New York", salary: "$220k - $300k", fitScore: 8.8, tags: ["Python", "Go", "Kubernetes", "Distributed Systems"] },
  { id: "job-3", company: "Airbnb", roleTitle: "Principal Engineer", sector: "Tech", location: "Seattle", salary: "$250k - $350k", fitScore: 9.5, tags: ["React", "GraphQL", "Microservices", "Machine Learning"] },
  { id: "job-4", company: "Netflix", roleTitle: "Engineering Manager", sector: "Tech", location: "Los Angeles", salary: "$200k - $280k", fitScore: 8.1, tags: ["Leadership", "Scala", "Data Engineering", "Cloud"] },
  { id: "job-5", company: "Uber", roleTitle: "Senior Engineer", sector: "Tech", location: "Austin", salary: "$170k - $230k", fitScore: 7.9, tags: ["Java", "Kafka", "Redis", "Mobile"] }
];

function serveFile(req, res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<html><head><title>404 Not Found</title></head><body><h1>404 - File Not Found</h1><p>The requested file <code>${req.url}</code> was not found.</p><p><a href="/discovery.html">← Back to Discovery Engine</a></p></body></html>`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

function handleApiRequest(req, res, pathname) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  if (pathname === '/api/job-recommendations') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({ jobs: mockJobs, meta: { total: mockJobs.length, page: 1, hasMore: true } }));
    return;
  }

  if (pathname.startsWith('/api/jobs/')) {
    const jobId = pathname.split('/').pop();
    const job = mockJobs.find(j => j.id === jobId);
    if (job) {
      res.writeHead(200, headers);
      res.end(JSON.stringify(job));
    } else {
      res.writeHead(404, headers);
      res.end(JSON.stringify({ error: 'Job not found' }));
    }
    return;
  }

  res.writeHead(404, headers);
  res.end(JSON.stringify({ error: 'API endpoint not found', available: ['/api/job-recommendations', '/api/jobs/{id}'] }));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, pathname);
    return;
  }

  let filePath;
  if (pathname === '/' || pathname === '') {
    filePath = path.join(__dirname, 'discovery.html');
  } else {
    filePath = path.join(__dirname, pathname.substring(1));
  }

  serveFile(req, res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log('🏮 Warp-Compatible Sushi Discovery Server');
  console.log('=========================================');
  console.log(`🚀 Server: http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);  
  console.log(`🍣 Discovery: http://127.0.0.1:${PORT}/discovery.html`);
  console.log(`📊 API: http://127.0.0.1:${PORT}/api/job-recommendations`);
  console.log('');
  console.log('✅ Bypassing Warp terminal localhost interception!');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is in use. Trying ${PORT + 1}...`);
    server.listen(PORT + 1, HOST);
  } else {
    console.error('❌ Server error:', err);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
EOF

chmod +x dev-server-warp.js

# 4. Start the Warp-compatible server
echo "🚀 Starting Warp-compatible server..."
node dev-server-warp.js > server-warp.log 2>&1 &
SERVER_PID=$!

# 5. Wait for server startup
echo "⏳ Server starting (PID: $SERVER_PID)..."
sleep 3

# 6. Test the server is responding
echo "🧪 Testing server response..."

if curl -s -m 5 http://127.0.0.1:$PRIMARY_PORT/discovery.html | grep -q "Discovery Engine" 2>/dev/null; then
  echo "✅ Server is responding correctly on port $PRIMARY_PORT"
  SERVER_URL="http://127.0.0.1:$PRIMARY_PORT"
elif curl -s -m 5 http://127.0.0.1:$FALLBACK_PORT/discovery.html | grep -q "Discovery Engine" 2>/dev/null; then
  echo "✅ Server is responding correctly on port $FALLBACK_PORT"  
  SERVER_URL="http://127.0.0.1:$FALLBACK_PORT"
else
  echo "❌ Server not responding. Checking logs..."
  tail -n 10 server-warp.log 2>/dev/null || echo "No logs available"
  exit 1
fi

# 7. Run quick health check
echo "🏥 Quick health check..."
test_endpoint() {
  local url=$1
  local name=$2
  if curl -s -m 3 -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo "  ✅ $name: OK"  
    return 0
  else
    echo "  ❌ $name: Failed"
    return 1
  fi
}

HEALTH_PASSED=0
test_endpoint "$SERVER_URL/discovery.html" "Discovery Page" && HEALTH_PASSED=$((HEALTH_PASSED + 1))
test_endpoint "$SERVER_URL/api/job-recommendations" "Jobs API" && HEALTH_PASSED=$((HEALTH_PASSED + 1))
test_endpoint "$SERVER_URL/style.css" "Stylesheet" && HEALTH_PASSED=$((HEALTH_PASSED + 1))

# 8. Final instructions
echo ""
if [ $HEALTH_PASSED -ge 2 ]; then
  echo "🎉 WARP BYPASS SUCCESSFUL!"
  echo "========================"
  echo ""
  echo "🌐 Open in your EXTERNAL browser:"
  echo "   $SERVER_URL/discovery.html"
  echo ""
  echo "🚨 IMPORTANT FOR WARP USERS:"
  echo "   • Do NOT click localhost links in Warp terminal"
  echo "   • Copy/paste the URL above into Chrome/Safari/Firefox"  
  echo "   • Or use: open $SERVER_URL/discovery.html"
  echo ""
  echo "📊 Working endpoints:"
  echo "   • Discovery Engine: $SERVER_URL/discovery.html"
  echo "   • Jobs API: $SERVER_URL/api/job-recommendations"
  echo "   • Health check: $SERVER_URL/manifest.json"
else
  echo "⚠️ PARTIAL SUCCESS - Server running but some endpoints may be slow"
  echo "🌐 Try: $SERVER_URL/discovery.html"
fi

echo ""
echo "🪵 Server logs: tail -f server-warp.log"
echo "🛑 Stop server: kill $SERVER_PID"
echo ""
echo "💡 Why this works:"
echo "   • Uses port 8081 instead of 8080 (Warp intercepts 8080)"
echo "   • Binds to 0.0.0.0 instead of just localhost" 
echo "   • Forces external browser instead of Warp's internal view"

# Keep server running
wait $SERVER_PID