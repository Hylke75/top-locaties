#!/usr/bin/env node
/**
 * Top Locaties — redactioneel beheer (FO §16, bouwplan C-06 / B-01 / B-03 / B-04).
 *
 *   TL_EDITOR_TOKEN=… TL_CHIEF_TOKEN=… node scripts/admin.mjs   → http://localhost:4174/admin/
 *
 * Rollen (server-side afgedwongen):
 *   redacteur       — concepten/locatie-/makerredactie opslaan als draft of review; niet publiceren.
 *   hoofdredacteur  — alles van redacteur + publiceren/archiveren, site bouwen, Greenbookings-sync starten.
 * Zonder tokens in de omgeving worden eenmalige tokens gegenereerd en in de terminal getoond.
 *
 * Elke mutatie: validatie, revisie (.admin/revisions), auditregel (src/content/audit-log.jsonl).
 * Bronvelden uit Greenbookings zijn hier NIET bewerkbaar; alleen de redactionele laag.
 * Draai deze server alleen lokaal of achter eigen toegangsbeveiliging — nooit publiek.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadUsers, verifyPassword } from './admin-user.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(root, 'src/content');
const ADMIN_UI = path.join(root, 'admin');
const SITE = path.join(root, 'site');
const REVISIONS = path.join(root, '.admin/revisions');
const AUDIT = path.join(CONTENT, 'audit-log.jsonl');
const PORT = Number(process.env.ADMIN_PORT || 4174);
const HOST = process.env.ADMIN_HOST || '127.0.0.1';

// Accounts (e-mail + wachtwoord, scrypt) uit .admin/users.json of TL_ADMIN_USERS.
// Toegangscodes (TL_EDITOR_TOKEN / TL_CHIEF_TOKEN) alleen als ze expliciet gezet zijn (bijv. voor tests).
const tokens = {};
if (process.env.TL_EDITOR_TOKEN) tokens[process.env.TL_EDITOR_TOKEN] = { role: 'redacteur', name: process.env.TL_EDITOR_NAME || 'Redacteur' };
if (process.env.TL_CHIEF_TOKEN) tokens[process.env.TL_CHIEF_TOKEN] = { role: 'hoofdredacteur', name: process.env.TL_CHIEF_NAME || 'Hoofdredacteur' };
const failed = new Map(); // ip → { count, until } — rem op raden
function authenticate({ email, password, token } = {}) {
  if (token && tokens[token]) return tokens[token];
  if (!email || !password) return null;
  const u = loadUsers().find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
  if (!u || !verifyPassword(String(password), u.passwordHash)) return null;
  return { role: u.role, name: u.name, email: u.email };
}
const sessions = new Map(); // sid → { role, name, csrf, expires }
const FILES = { playbook: 'playbook.json', concepts: 'concepts.json', venues: 'venues.editorial.json', suppliers: 'suppliers.editorial.json', feelings: 'feelings.json', snapshot: 'greenbookings-snapshot.json' };

const readDoc = (k) => JSON.parse(fs.readFileSync(path.join(CONTENT, FILES[k]), 'utf8'));
function writeDoc(k, doc, user, action, detail) {
  if (k === 'snapshot') throw new Error('Bronbestand is niet bewerkbaar via beheer.');
  const file = path.join(CONTENT, FILES[k]);
  fs.mkdirSync(REVISIONS, { recursive: true });
  fs.copyFileSync(file, path.join(REVISIONS, `${FILES[k]}.${Date.now()}.json`));
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(doc, null, 2) + '\n');
  fs.renameSync(tmp, file);
  audit(user, action, detail);
}
function audit(user, action, detail) {
  fs.appendFileSync(AUDIT, JSON.stringify({ at: new Date().toISOString(), user: user.name, role: user.role, action, detail }) + '\n');
}
async function validate() {
  const mod = await import(pathToFileURL(path.join(root, 'scripts/validate-content.mjs')).href + `?t=${Date.now()}`);
  return mod.validate();
}
const run = (cmd, argv) => new Promise((resolve) => {
  const p = spawn(cmd, argv, { cwd: root });
  let out = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { out += d; });
  p.on('close', (code) => resolve({ code, output: out.slice(-20000) }));
});

function send(res, code, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(code, { 'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}
const readBody = (req) => new Promise((resolve, reject) => {
  let b = '';
  req.on('data', (c) => { b += c; if (b.length > 2e6) reject(new Error('Te groot')); });
  req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('Ongeldige JSON')); } });
});
function session(req) {
  const sid = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith('tl_admin='))?.slice(9);
  const s = sid && sessions.get(sid);
  if (!s || s.expires < Date.now()) return null;
  return s;
}
const serveFile = (res, file) => {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml' };
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Niet gevonden');
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
};

const CONCEPT_FIELDS = ['title', 'slug', 'number', 'status', 'priority', 'headline', 'category', 'categoryLabel', 'format', 'teaser', 'proposition', 'tags', 'guestCountMin', 'guestCountMax', 'feelings', 'feelingWeights', 'feelingReasons', 'audiences', 'objective', 'idea', 'hero', 'programImage', 'program', 'venueMatches', 'supplierRoles', 'supplierMatches', 'seo', 'duration', 'runbook', 'planning', 'catering', 'entertainment', 'crew', 'spaces', 'checklist', 'variations', 'risks', 'budgetItems', 'sustainability', 'evaluation', 'invitation'];

async function api(req, res, user, url) {
  const m = req.method;
  const p = url.pathname.replace(/^\/api/, '');
  const chief = user.role === 'hoofdredacteur';
  if (m !== 'GET' && req.headers['x-csrf-token'] !== user.csrf) return send(res, 403, { error: 'CSRF-controle mislukt' });

  if (m === 'GET' && p === '/session') return send(res, 200, { role: user.role, name: user.name, csrf: user.csrf });
  if (m === 'GET' && p === '/content') {
    const snapshot = readDoc('snapshot');
    const partners = snapshot.venues.filter((v) => v.status === 'gepubliceerd' && v.aangesloten === true)
      .map((v) => ({ slug: v.greenbookingsSlug, name: v.name, city: v.city, province: v.province, type: v.type, capacityMax: v.capacityMax, hasImage: Boolean(v.heroImage) }));
    const syncLog = fs.existsSync(path.join(root, '.admin/sync-log.json')) ? JSON.parse(fs.readFileSync(path.join(root, '.admin/sync-log.json'), 'utf8')).slice(0, 10) : [];
    const build = fs.existsSync(path.join(SITE, 'build-info.json')) ? JSON.parse(fs.readFileSync(path.join(SITE, 'build-info.json'), 'utf8')) : null;
    return send(res, 200, {
      concepts: readDoc('concepts').concepts, categories: readDoc('concepts').categories || [], playbook: readDoc('playbook'), venues: readDoc('venues'), suppliers: readDoc('suppliers'), feelings: readDoc('feelings'),
      snapshotMeta: snapshot._meta, partners, supplierSources: snapshot.suppliers, validation: await validate(), syncLog, build,
    });
  }
  if (m === 'GET' && p === '/audit') {
    const lines = fs.existsSync(AUDIT) ? fs.readFileSync(AUDIT, 'utf8').trim().split('\n').filter(Boolean).slice(-200).reverse().map((l) => JSON.parse(l)) : [];
    return send(res, 200, lines);
  }

  // ---- Concepten
  const cm = p.match(/^\/concepts\/([a-z0-9-]+)$/);
  if (m === 'PUT' && cm) {
    const body = await readBody(req);
    const doc = readDoc('concepts');
    const i = doc.concepts.findIndex((c) => c.slug === cm[1]);
    if (i < 0) return send(res, 404, { error: 'Concept niet gevonden' });
    const current = doc.concepts[i];
    const next = { ...current };
    for (const f of CONCEPT_FIELDS) if (body[f] !== undefined) next[f] = body[f];
    if (!/^[a-z0-9-]+$/.test(next.slug)) return send(res, 400, { error: 'Slug: alleen kleine letters, cijfers en streepjes.' });
    if (next.slug !== current.slug && doc.concepts.some((c) => c.slug === next.slug)) return send(res, 400, { error: 'Slug bestaat al.' });
    if (!chief && current.status === 'published') return send(res, 403, { error: 'Dit concept staat live. Alleen de hoofdredacteur wijzigt gepubliceerde inhoud.' });
    if (!chief && (next.status === 'published' || next.status === 'archived')) next.status = 'review';
    doc.concepts[i] = next;
    const { errors } = await validateCandidate('concepts', doc);
    if (errors.length && (next.status === 'published')) return send(res, 422, { error: 'Validatie mislukt — niet gepubliceerd.', errors });
    writeDoc('concepts', doc, user, 'concept.save', { slug: next.slug, status: next.status });
    return send(res, 200, { ok: true, concept: next, errors });
  }
  if (m === 'POST' && p === '/concepts') {
    const body = await readBody(req);
    const doc = readDoc('concepts');
    const slug = String(body.slug || '').trim();
    if (!/^[a-z0-9-]{3,60}$/.test(slug) || doc.concepts.some((c) => c.slug === slug)) return send(res, 400, { error: 'Geef een unieke slug (kleine letters, cijfers, streepjes).' });
    const base = structuredClone(doc.concepts[0]);
    const n = String(doc.concepts.length + 1).padStart(3, '0');
    const fresh = { ...base, id: slug, slug, number: n, status: 'draft', priority: doc.concepts.length + 1, title: body.title || 'Nieuw concept', headline: [String(body.title || 'NIEUW CONCEPT').toUpperCase()], teaser: '', proposition: '', venueMatches: [], supplierMatches: [], seo: { title: `${body.title || 'Nieuw concept'} — eventconcept | Top Locaties`, description: '' } };
    doc.concepts.push(fresh);
    writeDoc('concepts', doc, user, 'concept.create', { slug });
    return send(res, 201, { ok: true, concept: fresh });
  }
  const sm = p.match(/^\/concepts\/([a-z0-9-]+)\/status$/);
  if (m === 'POST' && sm) {
    const { status } = await readBody(req);
    if (!['draft', 'review', 'published', 'archived'].includes(status)) return send(res, 400, { error: 'Ongeldige status' });
    if ((status === 'published' || status === 'archived') && !chief) return send(res, 403, { error: 'Alleen de hoofdredacteur publiceert of archiveert.' });
    const doc = readDoc('concepts');
    const c = doc.concepts.find((x) => x.slug === sm[1]);
    if (!c) return send(res, 404, { error: 'Concept niet gevonden' });
    const prev = c.status;
    c.status = status;
    const { errors } = await validateCandidate('concepts', doc);
    if (status === 'published' && errors.length) return send(res, 422, { error: 'Kan niet publiceren: los eerst de fouten op.', errors });
    writeDoc('concepts', doc, user, 'concept.status', { slug: c.slug, from: prev, to: status });
    return send(res, 200, { ok: true });
  }

  // ---- Locatieredactie (alleen voor aangesloten partners in de bron)
  const vm = p.match(/^\/venues\/([a-z0-9-]+)$/);
  if (m === 'PUT' && vm) {
    const body = await readBody(req);
    const snapshot = readDoc('snapshot');
    const src = snapshot.venues.find((v) => v.greenbookingsSlug === vm[1]);
    if (!src || !(src.status === 'gepubliceerd' && src.aangesloten === true)) return send(res, 400, { error: 'Alleen gepubliceerde, aangesloten partners kunnen redactie krijgen.' });
    const doc = readDoc('venues');
    let ed = doc.venues.find((v) => v.greenbookingsSlug === vm[1]);
    if (!ed) { ed = { id: body.id || vm[1], greenbookingsSlug: vm[1], order: doc.venues.length + 1, label: [src.type, src.sfeer].filter(Boolean).join(' / ').toUpperCase().slice(0, 40) || 'LOCATIE', eventTypes: [], character: [], line: src.tagline || `${src.type || 'Locatie'} in ${src.city}.`, illustrativeImage: null, editorialCheckedAt: null }; doc.venues.push(ed); }
    for (const f of ['label', 'line', 'eventTypes', 'character', 'order']) if (body[f] !== undefined) ed[f] = body[f];
    if (body.checked) ed.editorialCheckedAt = new Date().toISOString();
    const { errors } = await validateCandidate('venues', doc);
    if (errors.length) return send(res, 422, { error: 'Validatie mislukt', errors });
    writeDoc('venues', doc, user, 'venue.editorial', { slug: vm[1] });
    return send(res, 200, { ok: true, editorial: ed });
  }
  const sp = p.match(/^\/suppliers\/([a-z0-9-]+)$/);
  if (m === 'PUT' && sp) {
    const body = await readBody(req);
    const doc = readDoc('suppliers');
    const ed = doc.suppliers.find((s) => s.id === sp[1]);
    if (!ed) return send(res, 404, { error: 'Maker niet gevonden' });
    for (const f of ['label', 'symbol']) if (body[f] !== undefined) ed[f] = String(body[f]).slice(0, 60);
    if (body.profileLinkStatus && ['bevestigd', 'onbevestigd'].includes(body.profileLinkStatus)) ed.profileLinkStatus = body.profileLinkStatus;
    writeDoc('suppliers', doc, user, 'supplier.editorial', { id: ed.id });
    return send(res, 200, { ok: true, editorial: ed });
  }
  const fm = p.match(/^\/feelings\/([a-z]+)$/);
  if (m === 'PUT' && fm) {
    const body = await readBody(req);
    const doc = readDoc('feelings');
    const f = doc.feelings.find((x) => x.id === fm[1]);
    if (!f) return send(res, 404, { error: 'Gevoel bestaat niet (de zes gevoelens zijn vast).' });
    for (const k of ['sub', 'explanation']) if (body[k] !== undefined) f[k] = String(body[k]).slice(0, 160);
    writeDoc('feelings', doc, user, 'feeling.edit', { id: f.id });
    return send(res, 200, { ok: true });
  }

  if (m === 'PUT' && p === '/playbook') {
    if (!chief) return send(res, 403, { error: 'Alleen de hoofdredacteur wijzigt de gids.' });
    const body = await readBody(req);
    const doc = readDoc('playbook');
    if (typeof body.intro === 'string') doc.intro = body.intro.slice(0, 600);
    if (Array.isArray(body.steps) && body.steps.length) doc.steps = body.steps.map((x) => ({ id: String(x.id).replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'stap', when: String(x.when || ''), title: String(x.title || ''), items: (x.items || []).map(String) }));
    if (Array.isArray(body.agencyVsYou)) doc.agencyVsYou = body.agencyVsYou.filter((x) => x[0]).map(([a, b]) => [String(a), String(b || '')]);
    if (body.quoteQuestions && typeof body.quoteQuestions === 'object') for (const [k, v] of Object.entries(body.quoteQuestions)) if (doc.quoteQuestions[k] && Array.isArray(v)) doc.quoteQuestions[k] = v.map(String);
    writeDoc('playbook', doc, user, 'playbook.edit', { steps: doc.steps.length });
    return send(res, 200, { ok: true });
  }

  // ---- Publiceren en bron
  if (m === 'POST' && p === '/build') {
    if (!chief) return send(res, 403, { error: 'Alleen de hoofdredacteur bouwt en publiceert de site.' });
    const r = await run(process.execPath, ['scripts/build.mjs']);
    audit(user, 'site.build', { code: r.code });
    return send(res, r.code ? 500 : 200, r);
  }
  if (m === 'POST' && p === '/sync') {
    if (!chief) return send(res, 403, { error: 'Alleen de hoofdredacteur start een bronsync.' });
    const { dryRun } = await readBody(req);
    const r = await run(process.execPath, ['scripts/sync/greenbookings.mjs', ...(dryRun ? ['--dry-run'] : [])]);
    audit(user, 'source.sync', { code: r.code, dryRun: Boolean(dryRun) });
    return send(res, 200, r);
  }
  return send(res, 404, { error: 'Onbekende route' });
}

async function validateCandidate(kind, doc) {
  // Schrijf tijdelijk naar een schaduwmap zou complexer zijn; we valideren door het document
  // in te lezen via dezelfde regels. Hier: tijdelijk wegschrijven en terugzetten bij fouten.
  const file = path.join(CONTENT, FILES[kind]);
  const original = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, JSON.stringify(doc, null, 2));
  try { return await validate(); } finally { fs.writeFileSync(file, original); }
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/admin/login' && req.method === 'POST') {
      const ip = req.socket.remoteAddress;
      const f = failed.get(ip);
      if (f && f.until > Date.now()) return send(res, 429, { error: 'Te veel pogingen. Probeer het over een paar minuten opnieuw.' });
      const user = authenticate(await readBody(req));
      if (!user) {
        const n = (f?.count || 0) + 1;
        failed.set(ip, { count: n, until: n >= 5 ? Date.now() + 5 * 60e3 : 0 });
        await new Promise((r) => setTimeout(r, 600));
        return send(res, 401, { error: 'Onbekend e-mailadres of onjuist wachtwoord' });
      }
      failed.delete(ip);
      const sid = crypto.randomBytes(24).toString('hex');
      sessions.set(sid, { ...user, csrf: crypto.randomBytes(16).toString('hex'), expires: Date.now() + 8 * 3600e3 });
      audit(user, 'login', {});
      return send(res, 200, { ok: true }, { 'Set-Cookie': `tl_admin=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800` });
    }
    if (url.pathname === '/admin/logout') {
      const sid = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith('tl_admin='))?.slice(9);
      sessions.delete(sid);
      return send(res, 302, '', { Location: '/admin/', 'Set-Cookie': 'tl_admin=; Path=/; Max-Age=0' });
    }
    if (url.pathname.startsWith('/api/')) {
      const user = session(req);
      if (!user) return send(res, 401, { error: 'Log opnieuw in' });
      return await api(req, res, user, url);
    }
    if (url.pathname === '/admin' || url.pathname === '/admin/') return serveFile(res, path.join(ADMIN_UI, 'index.html'));
    if (url.pathname.startsWith('/admin/')) return serveFile(res, path.join(ADMIN_UI, path.normalize(url.pathname.slice(7)).replace(/^(\.\.[/\\])+/, '')));
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/preview/')) {
      // Voorvertoning van de laatst gebouwde site (en de gedeelde design-assets voor de admin).
      const rel = url.pathname.replace(/^\/preview/, '');
      let file = path.join(SITE, path.normalize(rel));
      if (!file.startsWith(SITE)) return send(res, 403, 'Geen toegang');
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      return serveFile(res, file);
    }
    if (url.pathname === '/') return send(res, 302, '', { Location: '/admin/' });
    return send(res, 404, 'Niet gevonden');
  } catch (e) {
    return send(res, 500, { error: e.message });
  }
}).listen(PORT, HOST, () => {
  console.log(`TOP LOCATIES BEHEER → http://${HOST}:${PORT}/admin/`);
  const users = loadUsers();
  console.log(`  ${users.length} account(s): ${users.map((u) => `${u.email} (${u.role})`).join(', ') || 'geen — maak er een aan met: node scripts/admin-user.mjs add <email> hoofdredacteur'}`);
  if (Object.keys(tokens).length) console.log('  + toegangscodes uit de omgeving actief');
});
