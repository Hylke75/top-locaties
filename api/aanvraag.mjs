// Vercel-functie: één aanvraag naar de gekozen locatie én alle gekozen makers.
//  1. Controleert herkomst, tempo (honeypot + invultijd), limiet per IP en de velden.
//  2. Locatie: alleen een gepubliceerde, aangesloten Greenbookings-partner (fail-closed). Als
//     GREENBOOKINGS_SUPABASE_SERVICE_KEY is ingesteld, gaat de aanvraag direct naar Greenbookings
//     (public.contactberichten, bron 'top-locaties'); anders stuurt de redactie hem door.
//  3. Slaat de hele aanvraag op in Top Locaties (RPC submit_quote_request; RLS: niemand kan hem publiek lezen).
//     Makers hebben (nog) geen eigen inbox: de redactie stuurt hun deel door vanuit Beheer.
//  4. Bevestigingsmail via Resend als RESEND_API_KEY en CONTACT_FROM zijn ingesteld (domein geverifieerd).
// Sleutels uitsluitend via omgevingsvariabelen; de publishable key van Top Locaties staat (bewust) in site.json.
import { readFileSync } from 'node:fs';
import { validateRequest, requestText } from '../src/lib/request-validate.mjs';

const site = JSON.parse(readFileSync(new URL('../src/content/site.json', import.meta.url), 'utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../src/content/greenbookings-snapshot.json', import.meta.url), 'utf8'));
const suppliersDoc = JSON.parse(readFileSync(new URL('../src/content/suppliers.editorial.json', import.meta.url), 'utf8'));
const conceptsDoc = JSON.parse(readFileSync(new URL('../src/content/concepts.json', import.meta.url), 'utf8'));
const PARTNER = new Set(snapshot.venues.filter((v) => v.status === 'gepubliceerd' && v.aangesloten === true).map((v) => v.greenbookingsSlug));
// Makers worden aangeduid met hun vaste redactionele id (bv. 'xr'), zoals op de conceptpagina.
const SUPPLIERS = new Set((suppliersDoc.suppliers || suppliersDoc).map((s) => s.id));
const TITLES = Object.fromEntries((conceptsDoc.concepts || []).filter((c) => c.status === 'published').map((c) => [c.slug, c.title]));

const ORIGINS = [/^https:\/\/(www\.)?top-locaties\.nl$/, /^https:\/\/top-locaties-[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];
const hits = new Map(); // per instantie: max. 5 aanvragen per 10 minuten per IP
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  list.push(now); hits.set(ip, list);
  return list.length > 5;
}
const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 80_000) throw new Error('too_large'); }
  return JSON.parse(raw || '{}');
}

async function forwardToVenue(d, title) {
  const key = process.env.GREENBOOKINGS_SUPABASE_SERVICE_KEY;
  const url = process.env.GREENBOOKINGS_SUPABASE_URL || 'https://irheuxoqlrtlxrloamns.supabase.co';
  if (!key || !d.venue) return false;
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  try {
    const r = await fetch(`${url}/rest/v1/locaties?slug=eq.${encodeURIComponent(d.venue.slug)}&status=eq.gepubliceerd&aangesloten=eq.true&select=id,naam`, { headers: h });
    const rows = r.ok ? await r.json() : [];
    if (!rows.length) return false;
    const q = d.quotes.find((x) => x.kind === 'locatie');
    const ins = await fetch(`${url}/rest/v1/contactberichten`, {
      method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ locatie_id: rows[0].id, onderwerp: (q?.subject || `Aanvraag via Top Locaties — ${title}`).slice(0, 200), bezoeker_naam: d.name, bezoeker_email: d.email, bericht: [q?.body || '', '', requestText(d, title)].join('\n').trim().slice(0, 4000), event_datum: d.event_date, aantal_personen: d.guests, bron: 'top-locaties' }),
    });
    return ins.ok;
  } catch { return false; }
}

async function store(d, venueForwarded) {
  const url = (process.env.TL_SUPABASE_URL || site.accounts?.url || '').replace(/\/$/, '');
  const key = process.env.TL_SUPABASE_KEY || site.accounts?.publishableKey;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url}/rest/v1/rpc/submit_quote_request`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p: { base_slug: d.base_slug, name: d.name, email: d.email, organisation: d.organisation, event_date: d.event_date, guests: d.guests, message: d.message, venue_slug: d.venue?.slug || null, venue_name: d.venue?.name || null, suppliers: d.suppliers, plan: { ...(d.plan || {}), quotes: d.quotes }, venue_forwarded: venueForwarded } }),
    });
    const text = await r.text();
    if (!r.ok && /te veel|te druk/i.test(text)) return { limited: true };
    return r.ok ? { id: JSON.parse(text) } : null;
  } catch { return null; }
}

async function confirm(d, title, result) {
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM) return false;
  const who = [d.venue && `<li><strong>${esc(d.venue.name)}</strong> (locatie) — ${result.venueForwarded ? 'heeft je aanvraag direct ontvangen' : 'krijgt je aanvraag via de redactie'}</li>`,
    ...d.suppliers.map((s) => `<li><strong>${esc(s.name)}</strong>${s.role ? ` (${esc(s.role.toLowerCase())})` : ''} — krijgt je aanvraag via de redactie</li>`)].filter(Boolean).join('');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.CONTACT_FROM, to: [d.email], subject: `Je aanvraag voor ${title} is ontvangen`,
        html: `<p>Hallo ${esc(d.name)},</p><p>Bedankt voor je aanvraag voor <strong>${esc(title)}</strong>. Zo gaat het verder:</p><ul>${who}</ul><p>De partijen nemen zelf contact met je op via dit e-mailadres. Top Locaties boekt niets en bevestigt geen beschikbaarheid of prijs.</p><p style="white-space:pre-wrap;border-left:3px solid #F45269;padding-left:12px">${esc(requestText(d, title))}</p><p>Aanvraagnummer: ${esc(result.id || '—')}</p><p>— Top Locaties, onderdeel van het Greenbookings-netwerk</p>` }),
    });
    return r.ok;
  } catch { return false; }
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (!ORIGINS.some((re) => re.test(origin))) return send(res, 403, { error: 'origin' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'onbekend';
  if (limited(ip)) return send(res, 429, { error: 'rate_limited' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'invalid_json' }); }
  const v = validateRequest(body);
  if (v.spam) return send(res, 200, { ok: true, spam: true });
  if (v.errors.length) return send(res, 422, { error: 'invalid', fields: v.errors });
  const d = v.data;
  if (!TITLES[d.base_slug]) return send(res, 422, { error: 'invalid', fields: ['concept'] });
  // Fail-closed: alleen aangesloten partners als ontvanger.
  if (d.venue && !PARTNER.has(d.venue.slug)) d.venue = null;
  d.suppliers = d.suppliers.filter((s) => SUPPLIERS.has(s.slug));
  if (!d.venue && !d.suppliers.length) return send(res, 422, { error: 'invalid', fields: ['ontvangers'] });
  const title = TITLES[d.base_slug];

  const venueForwarded = await forwardToVenue(d, title);
  const stored = await store(d, venueForwarded);
  if (stored?.limited) return send(res, 429, { error: 'rate_limited' });
  if (!stored && !venueForwarded) return send(res, 502, { error: 'store' }); // niets bewaard of verstuurd: eerlijk melden
  const result = { id: stored?.id || null, venueForwarded };
  const mailed = await confirm(d, title, result);
  return send(res, 200, { ok: true, id: result.id, stored: Boolean(stored), venue: d.venue?.name || null, venueForwarded, makers: d.suppliers.map((s) => s.name), mailed });
}
