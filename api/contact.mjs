// Vercel-functie: contactbericht van top-locaties.nl → Greenbookings public.contactberichten (bron 'top-locaties').
// Sleutels uitsluitend via omgevingsvariabelen (nooit in de repository of de gebouwde site):
//   GREENBOOKINGS_SUPABASE_URL          optioneel; standaard het Greenbookings-project
//   GREENBOOKINGS_SUPABASE_SERVICE_KEY  service-role/secret key (alleen server-side)
// Optioneel (bevestigingsmail aan de bezoeker via Resend):
//   RESEND_API_KEY, CONTACT_FROM (bv. "Top Locaties <hallo@top-locaties.nl>")
// Zonder configuratie antwoordt de functie 503; de site valt dan terug op het Greenbookings-profiel.
import { validateContact } from '../src/lib/contact-validate.mjs';

const ORIGINS = [/^https:\/\/(www\.)?top-locaties\.nl$/, /^https:\/\/top-locaties-[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/];
const hits = new Map(); // eenvoudige snelheidsbeperking per instantie: 5 berichten / 10 min per IP
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 600_000);
  list.push(now); hits.set(ip, list);
  return list.length > 5;
}
const send = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(body)); };

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 12_000) throw new Error('too_large'); }
  return JSON.parse(raw || '{}');
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (!ORIGINS.some((re) => re.test(origin))) return send(res, 403, { error: 'origin' });
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return send(res, 405, { error: 'method' });

  const url = process.env.GREENBOOKINGS_SUPABASE_URL || 'https://irheuxoqlrtlxrloamns.supabase.co'; // project-URL is geen geheim
  const key = process.env.GREENBOOKINGS_SUPABASE_SERVICE_KEY;
  if (!url || !key) return send(res, 503, { error: 'not_configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'onbekend';
  if (limited(ip)) return send(res, 429, { error: 'rate_limited' });

  let body;
  try { body = await readJson(req); } catch { return send(res, 400, { error: 'invalid_json' }); }
  const v = validateContact(body);
  if (v.spam) return send(res, 200, { ok: true }); // honeypot: stil accepteren, niets opslaan
  if (v.errors.length) return send(res, 422, { error: 'invalid', fields: v.errors });

  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  try {
    // Fail-closed: alleen gepubliceerde én aangesloten partnerlocaties.
    const r = await fetch(`${url}/rest/v1/locaties?slug=eq.${encodeURIComponent(v.data.locatie_slug)}&status=eq.gepubliceerd&aangesloten=eq.true&select=id,naam`, { headers: h });
    const rows = r.ok ? await r.json() : [];
    if (!rows.length) return send(res, 404, { error: 'venue' });
    const ins = await fetch(`${url}/rest/v1/contactberichten`, {
      method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ locatie_id: rows[0].id, onderwerp: v.data.onderwerp, bezoeker_naam: v.data.bezoeker_naam, bezoeker_email: v.data.bezoeker_email, bericht: v.data.bericht, event_datum: v.data.event_datum, aantal_personen: v.data.aantal_personen, bron: 'top-locaties' }),
    });
    if (!ins.ok) return send(res, 502, { error: 'store' });

    if (process.env.RESEND_API_KEY && process.env.CONTACT_FROM) {
      const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.CONTACT_FROM, to: [v.data.bezoeker_email], subject: `Je vraag aan ${rows[0].naam} is verstuurd`,
          html: `<p>Hallo ${esc(v.data.bezoeker_naam)},</p><p>Je bericht aan <strong>${esc(rows[0].naam)}</strong> is via Top Locaties doorgestuurd. De locatie neemt contact met je op via dit e-mailadres.</p><blockquote style="border-left:3px solid #F45269;padding-left:12px;white-space:pre-wrap">${esc(v.data.bericht)}</blockquote><p>— Top Locaties, onderdeel van het Greenbookings-netwerk</p>` }),
      }).catch(() => null); // bevestigingsmail is een extraatje; het bericht is al opgeslagen
    }
    return send(res, 200, { ok: true, venue: rows[0].naam });
  } catch { return send(res, 502, { error: 'upstream' }); }
}
