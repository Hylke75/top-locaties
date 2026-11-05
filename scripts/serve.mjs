#!/usr/bin/env node
// Minimale lokale server voor ./site (mappen → index.html, 404.html als fallback).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.xml': 'application/xml', '.txt': 'text/plain', '.md': 'text/markdown; charset=utf-8' };
// Zelfde gedrag als vercel.json: Markdown bij Accept: text/markdown, Link-headers op de homepage, juiste types voor ontdekbestanden.
const LINK = '</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json", </docs/api/>; rel="service-doc"; type="text/html", </index.md>; rel="alternate"; type="text/markdown", </.well-known/ai-catalog.json>; rel="describedby"; type="application/json"';

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(root, rel);
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' }).end(); return; }
    const md = path.join(file, 'index.md');
    file = /text\/markdown/.test(req.headers.accept || '') && fs.existsSync(md) ? md : path.join(file, 'index.html');
  }
  const found = fs.existsSync(file);
  const target = found ? file : path.join(root, '404.html');
  const type = rel === '/.well-known/api-catalog' ? 'application/linkset+json' : types[path.extname(target)] || 'application/octet-stream';
  res.writeHead(found ? 200 : 404, { 'Content-Type': type, Vary: 'Accept', ...(rel === '/' ? { Link: LINK } : {}), ...(/^\/(\.well-known|data|openapi)/.test(rel) || target.endsWith('.md') ? { 'Access-Control-Allow-Origin': '*' } : {}) });
  fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`Top Locaties lokaal: http://localhost:${port}/`));
