try {
  require('dotenv').config();
} catch (e) {}

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const handler = require('./api/certificates.js');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle /api/certificates
  if (pathname.startsWith('/api/certificates')) {
    req.query = parsedUrl.query;
    
    // Read body if POST
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          req.body = JSON.parse(body);
        } catch (e) {
          req.body = body;
        }
        await handler(req, res);
      });
      return;
    }

    await handler(req, res);
    return;
  }

  // Handle static files
  let filePath = path.join(__dirname, pathname);

  // Check if file exists directly
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Rewrite /admin -> admin.html
  if (pathname === '/admin' || pathname === '/admin.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'admin.html')).pipe(res);
    return;
  }

  // Rewrite /qr-generator -> qr-generator.html
  if (pathname === '/qr-generator' || pathname === '/qr-generator.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'qr-generator.html')).pipe(res);
    return;
  }

  // Default SPA fallback: rewrite all other routes (/84920, /CS/2026/JP/84920) to index.html
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
});

server.listen(PORT, () => {
  console.log(`[CodSoft] Server with MongoDB Atlas running on http://127.0.0.1:${PORT}`);
});
