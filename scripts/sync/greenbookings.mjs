#!/usr/bin/env node
/**
 * Top Locaties — Greenbookings-partnersync (FO §14.2, bouwplan L-01…L-04).
 *
 *   node scripts/sync/greenbookings.mjs --dry-run      # alleen ophalen + rapport
 *   node scripts/sync/greenbookings.mjs                # schrijft src/content/greenbookings-snapshot.json
 *   node scripts/sync/greenbookings.mjs --trust-filter # zie partnerregel hieronder
 *
 * Bron: de gedocumenteerde openbare API GET https://greenbookings.nl/api/v1/locaties
 * met alleen_partners=true, limiet=50, start=0,50,… (max. 600 req/uur/IP).
 *
 * Partnerregel (fail-closed): een record wordt alleen opgenomen als het een expliciet
 * positief partnerveld heeft (aangesloten/is_partner/partner === true). Levert de API
 * zo'n veld niet, dan stopt de sync — tenzij --trust-filter is meegegeven, als
 * vastgelegd besluit dat de gefilterde endpoint uitsluitend partners levert.
 *
 * Veiligheden: back-off bij 429, Vercel-checkpoint-detectie (HTML i.p.v. JSON),
 * schema-drift → quarantaine per record, en GEEN schrijfactie als de partnerset >30%
 * kleiner is dan de vorige snapshot (geen massale depublicatie bij een onvolledige sync).
 * Redactionele bestanden worden nooit aangeraakt.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SNAPSHOT = path.join(root, 'src/content/greenbookings-snapshot.json');
const LOG = path.join(root, '.admin/sync-log.json');
const BASE = process.env.GREENBOOKINGS_API || 'https://greenbookings.nl/api/v1/locaties';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const trustFilter = args.has('--trust-filter');
const PAGE = 50;
const MAX_PAGES = 200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchPage(start, attempt = 0) {
  const url = `${BASE}?alleen_partners=true&limiet=${PAGE}&start=${start}`;
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'TopLocatiesSync/1.0 (+https://top-locaties.nl)' } });
  if (res.status === 429 && attempt < 4) {
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt;
    await sleep(wait);
    return fetchPage(start, attempt + 1);
  }
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) throw new Error(`Bron gaf geen JSON (${res.status} ${type}) — mogelijk Vercel Security Checkpoint. Sync gestopt; niets gewijzigd.`);
  if (!res.ok) throw new Error(`Bron gaf HTTP ${res.status}. Sync gestopt; niets gewijzigd.`);
  return res.json();
}

const pick = (o, ...keys) => { for (const k of keys) if (o && o[k] !== undefined) return o[k]; return undefined; };
const list = (body) => (Array.isArray(body) ? body : pick(body, 'data', 'locaties', 'resultaten', 'items', 'results'));

/** Normaliseert één bronrecord. Retourneert { record } of { quarantine: reden }. */
export function normalize(raw) {
  const slug = pick(raw, 'slug');
  const name = pick(raw, 'naam', 'name');
  if (!slug || !name) return { quarantine: 'slug of naam ontbreekt (schema-drift?)' };
  const partnerFlag = pick(raw, 'aangesloten', 'is_partner', 'partner', 'isPartner');
  if (partnerFlag !== true && !(partnerFlag === undefined && trustFilter)) {
    return { quarantine: partnerFlag === undefined ? 'geen partnerveld in bron (gebruik --trust-filter alleen na vastgelegd besluit)' : 'niet aangesloten' };
  }
  const hero = pick(raw, 'hero_media_url', 'hoofdafbeelding', 'afbeelding', 'image');
  const heroUrl = typeof hero === 'string' ? hero : hero && pick(hero, 'url');
  const record = {
    greenbookingsSlug: slug,
    name,
    city: pick(raw, 'stad', 'plaats', 'city') ?? null,
    province: pick(raw, 'provincie', 'province') ?? null,
    type: pick(raw, 'type') ?? null,
    sfeer: pick(raw, 'sfeer') ?? null,
    tagline: pick(raw, 'tagline') ?? null,
    capacityMin: pick(raw, 'capaciteit_min', 'capacityMin') ?? null,
    capacityMax: pick(raw, 'capaciteit_max', 'capacityMax') ?? null,
    status: 'gepubliceerd',
    aangesloten: true,
    sfeerTags: pick(raw, 'sfeer_tags') || [],
    bijeenkomstTypes: pick(raw, 'bijeenkomst_types') || [],
    heroImage: heroUrl && !heroUrl.includes('_placeholder') ? { url: heroUrl, alt: pick(raw, 'hero_alt', 'alt') || name } : null,
    mediaCount: null,
    sourceUpdatedAt: pick(raw, 'bijgewerkt_op', 'updated_at') ?? null,
  };
  if (!record.city || !record.province) return { quarantine: 'plaats/provincie ontbreekt' };
  return { record };
}

export async function run() {
  const previous = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'));
  const prevCount = previous.venues.filter((v) => v.aangesloten === true).length;
  const records = new Map();
  const quarantine = [];
  let complete = false;
  for (let page = 0; page < MAX_PAGES; page++) {
    const body = await fetchPage(page * PAGE);
    const items = list(body);
    if (!Array.isArray(items)) throw new Error('Onverwachte bronvorm: geen lijst met locaties. Sync gestopt.');
    for (const raw of items) {
      const { record, quarantine: why } = normalize(raw);
      if (record) records.set(record.greenbookingsSlug, record); else quarantine.push({ slug: raw?.slug, why });
    }
    if (items.length < PAGE) { complete = true; break; }
    await sleep(1500); // ruim onder 600 req/uur
  }
  const count = records.size;
  const report = { at: new Date().toISOString(), complete, partners: count, previous: prevCount, quarantined: quarantine.length, quarantine: quarantine.slice(0, 50), written: false };
  if (!complete) report.error = 'Partnerset niet volledig opgehaald — niets gewijzigd.';
  else if (prevCount && count < prevCount * 0.7) report.error = `Partnerset ${Math.round((1 - count / prevCount) * 100)}% kleiner dan vorige snapshot — geen massale depublicatie; beheerreview nodig.`;
  else if (!dryRun) {
    const hash = (v) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex');
    const prevBySlug = new Map(previous.venues.map((v) => [v.greenbookingsSlug, v]));
    const venues = [...records.values()].map((v) => {
      const old = prevBySlug.get(v.greenbookingsSlug);
      const h = hash(v);
      return { ...v, sourceHash: h, firstSeenAt: old?.firstSeenAt || report.at, lastSeenAt: report.at, changedAt: old && old.sourceHash === h ? old.changedAt || report.at : report.at };
    });
    report.added = venues.filter((v) => !prevBySlug.has(v.greenbookingsSlug)).length;
    report.removed = [...prevBySlug.keys()].filter((s) => !records.has(s));
    previous.venues = venues;
    previous._meta.syncedAt = report.at;
    previous._meta.mode = 'API-sync (alleen_partners=true)';
    previous._meta.partnerCountAtSync = { gepubliceerdEnAangesloten: count, inSnapshot: count };
    const tmp = SNAPSHOT + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(previous, null, 2));
    fs.renameSync(tmp, SNAPSHOT);
    report.written = true;
  }
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];
  log.unshift(report);
  fs.writeFileSync(LOG, JSON.stringify(log.slice(0, 50), null, 2));
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then((r) => { console.log(JSON.stringify(r, null, 2)); if (r.error) process.exitCode = 1; })
    .catch((e) => {
      const r = { at: new Date().toISOString(), error: e.message, written: false };
      try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : []; log.unshift(r); fs.writeFileSync(LOG, JSON.stringify(log.slice(0, 50), null, 2)); } catch {}
      console.error(`SYNC MISLUKT: ${e.message}`); process.exitCode = 1;
    });
}
