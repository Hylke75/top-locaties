// Concept op maat: tijden, data, aantallen, teksten — zonder prijzen of claims.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadData } from '../src/lib/data.mjs';
import { shiftRunbook, phaseDate, crewCount, pickVariation, venueFit, fillInvitation, tailor, toText, quoteRequests, callsheet, budgetCsv } from '../src/client/lib/tailor.js';

const data = loadData();
const festival = data.concepts.find((c) => c.slug === 'festival');
const answers = { organisatie: 'Testbedrijf', datum: '2027-03-18', start: '10:00', gasten: '600', doel: 'Kennis delen', contact: 'Sam', dieet: ['vegan'], hybride: true, toegankelijk: true, duurzaam: 'hoog' };
const venue = { name: 'Fokker Terminal', city: 'Den Haag', url: 'https://greenbookings.nl/locaties/fokker-terminal-den-haag', capacityMin: 2, capacityMax: 1000 };

test('alle concepten zijn compleet en publiceerbaar', () => {
  assert.ok(data.concepts.length >= 6);
  for (const c of data.concepts) {
    assert.ok(c.runbook.length >= 8 && c.planning.length >= 4 && c.catering.moments.length >= 3 && c.entertainment.length >= 2, c.slug);
    assert.ok(c.program.every((p) => p.details?.steps?.length >= 3), `${c.slug}: pop-upinhoud`);
  }
});

test('draaiboek schuift mee met de starttijd (opbouw blijft ervoor)', () => {
  const r = shiftRunbook(festival.runbook, '10:00');
  assert.equal(r.find((x) => x.title === 'Inloop en registratie').time, '10:00');
  assert.equal(r[0].time, '08:30'); // crew in schuift ook een uur
});

test('planning krijgt echte data', () => {
  assert.equal(phaseDate('12–10 WEKEN VOORAF', '2027-03-18').toISOString().slice(0, 10), '2026-12-24');
  assert.equal(phaseDate('DAG ERVOOR', '2027-03-18').toISOString().slice(0, 10), '2027-03-17');
  assert.equal(phaseDate('X', ''), null);
});

test('bezetting wordt omgerekend naar de groep', () => {
  assert.equal(crewCount('1 per 10–12 gasten', 110), '10 (1 per 10–12 gasten)');
  assert.equal(crewCount('1 per 20 deelnemers', 45), '3 (1 per 20 deelnemers)');
  assert.equal(crewCount('1 per zone', 100), '1 per zone');
});

test('variant en capaciteitscheck', () => {
  const v = pickVariation(festival, answers).map((x) => x.title);
  assert.ok(v.some((t) => /hybride/i.test(t)) && v.some((t) => /groter/i.test(t)));
  assert.equal(venueFit(venue, 600).status, 'ok');
  assert.equal(venueFit({ ...venue, capacityMax: 300 }, 600).status, 'warn');
  assert.equal(venueFit({ ...venue, capacityMax: null }, 600).status, 'unknown');
});

test('uitnodiging, offerteaanvragen, callsheet en begroting worden ingevuld', () => {
  const t = tailor(festival, answers, { venue, suppliers: [{ name: 'Bourgonje', role: 'AV & techniek', url: 'https://greenbookings.nl/partners/bourgonje' }, { name: "Catering van 't Hooge", role: 'Catering', url: 'x' }] });
  assert.match(t.invitation.text, /Fokker Terminal/);
  assert.doesNotMatch(t.invitation.text, /\[datum\]|\[locatie\]/);
  const qs = quoteRequests(festival, t, data.playbook.quoteQuestions);
  assert.equal(qs.length, 3);
  assert.match(qs[0].body, /600 gasten/);
  assert.match(qs[1].body, /Onderdelen in ons draaiboek/);
  assert.match(qs[2].body, /cateringvoorstel/i);
  assert.match(qs[2].body, /vegan/);
  assert.ok(callsheet(festival, t).some((r) => r.party === 'Bourgonje'));
  const csv = budgetCsv(festival, t);
  assert.match(csv, /^"Kostenpost";/);
  assert.doesNotMatch(csv, /€\s*\d/);
  const text = toText(festival, t, data.feelingLabels);
  for (const part of ['DAGDRAAIBOEK', 'AFTELPLANNING', 'CATERINGVOORSTEL', 'ENTERTAINMENT', 'BEZETTING', 'CHECKLIST', 'OFFERTEAANVRAGEN', 'CALLSHEET', 'geen boeking']) assert.ok(text.includes(part), part);
  assert.ok(text.includes('Rolstoeltoegankelijke route'));
});
