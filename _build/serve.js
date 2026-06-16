// Minimal static file server for previewing the landing page.
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PORT = 4321;
const TYPES = { '.html':'text/html', '.png':'image/png', '.jpg':'image/jpeg',
  '.css':'text/css', '.js':'text/javascript', '.mp3':'audio/mpeg' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => console.log('serving on ' + PORT));
