// Local server laid out like the public site (gasserlol.github.io), so Quayside and the
// delivery tracker share one address and can talk to each other. No dependencies.
// Run: node server.js  then open http://127.0.0.1:3500/quayside/
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3500;
const HOST = process.env.HOST || "127.0.0.1";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };
// Only the apps' own files are served
const SITES = {
  quayside: { dir: __dirname, files: /^(index\.html|app\.js|data\.js|manifest\.webmanifest|icons\/[a-z0-9-]+\.(?:svg|png))$/ },
  "parcel-tracker": { dir: path.join(__dirname, "..", "parcel-tracker"), files: /^(index\.html|lookup\.html|app\.js|globe\.js|connect\.js|backend-(?:firebase|demo|room)\.js|firebase-config\.js|manifest\.webmanifest|icons\/[a-z0-9-]+\.png)$/ },
};

http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/" || p === "/quayside") { res.writeHead(302, { Location: "/quayside/" }).end(); return; }
  if (p === "/parcel-tracker") { res.writeHead(302, { Location: "/parcel-tracker/" }).end(); return; }
  const m = p.match(/^\/([a-z-]+)\/(.*)$/);
  const site = m && SITES[m[1]];
  const file = m && (m[2] || "index.html");
  if (!site || !site.files.test(file)) { res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found"); return; }
  fs.readFile(path.join(site.dir, file), (err, body) => {
    if (err) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(body);
  });
}).listen(PORT, HOST, () => console.log(`Quayside on http://${HOST}:${PORT}/quayside/  (tracker at /parcel-tracker/)`));
