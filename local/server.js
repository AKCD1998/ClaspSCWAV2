const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 5173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function renderIndex() {
  let html = readText('index.html');

  html = html
    .replace(/<\?!=\s*include\('styles'\);\s*\?>/g, readText('styles.html'))
    .replace(/<\?!= include\('closeup'\); \?>/g, readText('closeup.html'))
    .replace(/<\?!=\s*include\('scripts'\);\s*\?>/g, readText('scripts.html'))
    .replace(/<\?!=\s*include\('styles'\);\s*\?>/g, '')
    .replace(/<\?= SUPABASE_URL \?>/g, process.env.SUPABASE_URL || 'https://example.supabase.co')
    .replace(/<\?= SUPABASE_KEY \?>/g, process.env.SUPABASE_KEY || 'local-preview-anon-key');

  html = html.replace('</body>', '<script src="/local/mock-google-script.js"></script>\n</body>');

  return html;
}

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendFile(reqPath, res) {
  const normalized = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const abs = path.join(root, normalized);
  if (!abs.startsWith(root) || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    return;
  }

  const ext = path.extname(abs).toLowerCase();
  send(res, 200, fs.readFileSync(abs), contentTypes[ext] || 'application/octet-stream');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/' || pathname === '/index.html') {
    send(res, 200, renderIndex(), 'text/html; charset=utf-8');
    return;
  }

  if (pathname.startsWith('/assets/') || pathname.startsWith('/local/')) {
    sendFile(pathname.slice(1), res);
    return;
  }

  send(res, 404, 'Not found', 'text/plain; charset=utf-8');
});

server.listen(port, () => {
  console.log(`Local preview: http://localhost:${port}`);
});
