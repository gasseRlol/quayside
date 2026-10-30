// Quayside local server. No dependencies. Run: node server.js  (then open http://127.0.0.1:3500)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3500;
const HOST = process.env.HOST || "127.0.0.1";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
// Only the app's own files are served
const PUBLIC = /^\/(index\.html|app\.js|data\.js|manifest\.webmanifest|icons\/[a-z0-9-]+\.(?:svg|png))$/;

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  if (!PUBLIC.test(p)) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
  fs.readFile(path.join(__dirname, p), (err, body) => {
    if (err) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(body);
  });
}).listen(PORT, HOST, () => console.log(`Quayside on http://${HOST}:${PORT}`));
