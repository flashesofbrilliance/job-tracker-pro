#!/usr/bin/env node

/**
 * Development Server for Sushi Discovery Engine
 * Serves static files and mocks API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = '127.0.0.1';

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webm': 'audio/webm',
  '.mp3': 'audio/mpeg',
  '.glsl': 'text/plain'
};

// Mock job data
const mockJobs = [
  {
    id: "job-1",
    company: "Google",
    roleTitle: "Senior Software Engineer", 
    sector: "Tech",
    location: "San Francisco",
    salary: "$180k - $250k",
    fitScore: 9.2,
    tags: ["React", "Node.js", "TypeScript", "AWS"]
  },
  {
    id: "job-2",
    company: "Stripe", 
    roleTitle: "Staff Engineer",
    sector: "Fintech",
    location: "New York",
    salary: "$220k - $300k",
    fitScore: 8.8,
    tags: ["Python", "Go", "Kubernetes", "Distributed Systems"]
  },
  {
    id: "job-3",
    company: "Airbnb",
    roleTitle: "Principal Engineer",
    sector: "Tech", 
    location: "Seattle",
    salary: "$250k - $350k",
    fitScore: 9.5,
    tags: ["React", "GraphQL", "Microservices", "Machine Learning"]
  },
  {
    id: "job-4",
    company: "Netflix",
    roleTitle: "Engineering Manager",
    sector: "Tech",
    location: "Los Angeles", 
    salary: "$200k - $280k",
    fitScore: 8.1,
    tags: ["Leadership", "Scala", "Data Engineering", "Cloud"]
  },
  {
    id: "job-5",
    company: "Uber",
    roleTitle: "Senior Engineer",
    sector: "Tech",
    location: "Austin",
    salary: "$170k - $230k",
    fitScore: 7.9,
    tags: ["Java", "Kafka", "Redis", "Mobile"]
  }
];

function serveFile(req, res, filePath) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 - File Not Found</h1>
          <p>The requested file <code>${req.url}</code> was not found.</p>
          <p><a href="/discovery.html">← Back to Discovery Engine</a></p>
        </body>
      </html>
    `);
    return;
  }

  // Get file extension and content type
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // Read and serve file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      return;
    }

    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
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

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/job-recommendations') {
    res.writeHead(200, headers);
    res.end(JSON.stringify({
      jobs: mockJobs,
      meta: {
        total: mockJobs.length,
        page: 1,
        hasMore: true
      }
    }));
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

  // Default API 404
  res.writeHead(404, headers);
  res.end(JSON.stringify({ 
    error: 'API endpoint not found',
    available: ['/api/job-recommendations', '/api/jobs/{id}']
  }));
}

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, pathname);
    return;
  }

  // Handle static files
  let filePath;
  if (pathname === '/' || pathname === '') {
    filePath = path.join(__dirname, 'discovery.html');
  } else {
    // Remove leading slash and resolve relative to current directory
    filePath = path.join(__dirname, pathname.substring(1));
  }

  serveFile(req, res, filePath);
});

// Start server
server.listen(PORT, HOST, () => {
  console.log('🏮 Sushi Discovery Development Server');
  console.log('====================================');
  console.log(`🚀 Server running at: http://${HOST}:${PORT}`);
  console.log(`🍣 Discovery Engine: http://${HOST}:${PORT}/discovery.html`);
  console.log(`📊 API Mock Endpoints:`);
  console.log(`   GET /api/job-recommendations`);
  console.log(`   GET /api/jobs/{id}`);
  console.log('');
  console.log('✅ Ready for smooth conveyor belt job discovery!');
  console.log('');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try:`);
    console.error(`   lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   Then restart this server.`);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});