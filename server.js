const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath);

  // Security check
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try to serve the file directly
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
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
      res.writeHead(500);
      res.end('Server error');
    }
  } else {
    // For SPA routing, serve index.html
    filePath = path.join(ROOT, 'index.html');
    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n🏏 PCL Server running at http://localhost:${PORT}`);
  console.log(`   Admin panel: http://localhost:${PORT}/#/admin`);
  console.log(`   Admin password: PCL@Admin2024\n`);
});
