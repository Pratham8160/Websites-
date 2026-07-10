const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

const server = http.createServer((req, res) => {
  // Always serve index.html for SPA routing (any path that isn't a file)
  let urlPath = req.url.split('?')[0];

  // Strip hash (though browsers don't send it)
  let filePath = path.join(ROOT, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  // Cache control: no-cache for HTML, cache assets
  const cacheHeader = ext === '.html' ? 'no-cache' : 'public, max-age=3600';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheHeader,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🏏 PCL Server running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/#/admin`);
  console.log(`   Admin password: PCL@Admin2024\n`);
});
