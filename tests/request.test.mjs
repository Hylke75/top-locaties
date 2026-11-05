// Fase 7: validatie en serverfunctie van één aanvraag (fetch nagebootst; geen echte database of mail).
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest } from '../src/lib/request-validate.mjs';
import handler from '../api/aanvraag.mjs';

const good = { base_slug: 'teamdag', name: 'Sam Test', email: 'Sam@Example.nl', guests: 40, event_date: '2027-03-01', venue: { slug: 'geofort', name: 'Geofort' }, suppliers: [{ slug: 'bourgonje', name: 'Bourgonje', role: 'AV' }], consent: true, website: '', t: 9000, quotes: [{ to: 'Geofort', kind: 'locatie', subject: 'Offerte', body: 'Beste Geofort, ...' }] };

test('validatie: geldige aanvraag', () => {
  const v = validateRequest(good);
  assert.equal(v.errors.length, 0); assert.equal(v.data.email, 'sam@example.nl'); assert.equal(v.data.guests, 40);
});
test('validatie: honeypot en te snel = spam', () => {
  assert.equal(validateRequest({ ...good, website: 'http://spam' }).spam, true);
  assert.equal(validateRequest({ ...good, t: 900 }).spam, true);
});
test('validatie: vriendelijke foutcodes', () => {
  const v = validateRequest({ ...good, name: 'S', email: 'x', venue: null, suppliers: [], consent: false });
  assert.deepEqual(v.errors.sort(), ['email', 'naam', 'ontvangers', 'toestemming']);
});

function res() { return { headers: {}, statusCode: 0, body: '', setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } }; }
const req = (body, origin = 'https://top-locaties.nl', ip = '1.2.3.4') => ({ method: 'POST', headers: { origin, 'x-forwarded-for': ip }, body });

test('serverfunctie: herkomst buiten de site geweigerd', async () => {
  const r = res(); await handler(req(good, 'https://kwaad.example'), r); assert.equal(r.statusCode, 403);
});
test('serverfunctie: slaat op via RPC, niet-partner wordt geen ontvanger, geen sleutel = redactie stuurt door', async () => {
  const calls = []; const orig = globalThis.fetch;
  globalThis.fetch = async (url, opt) => { calls.push({ url: String(url), body: opt?.body ? JSON.parse(opt.body) : null }); return new Response(JSON.stringify('11111111-2222-4333-8444-555555555555'), { status: 200 }); };
  try {
    delete process.env.GREENBOOKINGS_SUPABASE_SERVICE_KEY; delete process.env.RESEND_API_KEY;
    const r = res(); await handler(req({ ...good, venue: { slug: 'graanfabriek', name: 'Geen partner' } }, undefined, '9.9.9.1'), r);
    const out = JSON.parse(r.body);
    assert.equal(r.statusCode, 200); assert.equal(out.venueForwarded, false); assert.equal(out.venue, null); assert.deepEqual(out.makers, ['Bourgonje']);
    assert.equal(calls.length, 1); assert.match(calls[0].url, /\/rest\/v1\/rpc\/submit_quote_request$/);
    assert.equal(calls[0].body.p.venue_slug, null); assert.equal(calls[0].body.p.email, 'sam@example.nl');
  } finally { globalThis.fetch = orig; }
});
test('serverfunctie: zonder ontvanger 422, spam stil 200 zonder opslag', async () => {
  const orig = globalThis.fetch; let n = 0; globalThis.fetch = async () => { n++; return new Response('null', { status: 200 }); };
  try {
    const a = res(); await handler(req({ ...good, venue: null, suppliers: [{ slug: 'bestaatniet', name: 'X' }] }, undefined, '9.9.9.2'), a); assert.equal(a.statusCode, 422);
    const b = res(); await handler(req({ ...good, website: 'x' }, undefined, '9.9.9.3'), b); assert.equal(b.statusCode, 200); assert.equal(n, 0);
  } finally { globalThis.fetch = orig; }
});
test('serverfunctie: niets bewaard en niets verstuurd = eerlijke fout', async () => {
  const orig = globalThis.fetch; globalThis.fetch = async () => new Response('{}', { status: 500 });
  try { const r = res(); await handler(req(good, undefined, '9.9.9.4'), r); assert.equal(r.statusCode, 502); } finally { globalThis.fetch = orig; }
});
