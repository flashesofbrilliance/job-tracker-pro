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
