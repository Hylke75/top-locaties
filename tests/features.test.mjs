import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { search, parseQuery } from '../src/client/lib/search.js';
import { validateContact } from '../src/lib/contact-validate.mjs';
import { buildPptx } from '../src/client/lib/pptx.js';
import { fromBase, startTime, shiftTo, applyAnswers } from '../src/client/lib/userconcept.js';

const concepts = JSON.parse(fs.readFileSync(new URL('../src/content/concepts.json', import.meta.url))).concepts;
const kick = concepts.find((c) => c.slug === 'kick-off');
const idx = [
  { t: 'concept', title: 'De vergadering die werkt', url: '/c/v/', text: 'vergaderen focus ochtend', min: 8, max: 40 },
  { t: 'concept', title: 'De jubileumavond', url: '/c/j/', text: 'feest avond', min: 80, max: 600 },
  { t: 'locatie', title: 'Milk & Meetings', url: '/l/m/', place: 'Wilnis Utrecht', text: 'boerderij vergadering', min: 4, max: 40 },
  { t: 'locatie', title: 'Kunstlinie', url: '/l/k/', place: 'Almere Flevoland', text: 'theater congres', max: 975 },
  { t: 'maker', title: 'Catering van t Hooge', url: '/m/h/', text: 'catering', place: '' },
];

test('zoeken: groepsgrootte en synoniemen', () => {
  assert.deepEqual(parseQuery('Vergaderen met 20 personen'), { size: 20, words: ['vergadering'] });
});
test('zoeken: plaats filtert locaties, concepten blijven', () => {
  const r = search(idx, 'vergaderen utrecht 20 personen').results.map((x) => x.title);
  assert.ok(r.includes('Milk & Meetings') && r.includes('De vergadering die werkt'));
  assert.ok(!r.includes('Kunstlinie'));
});
test('zoeken: capaciteit sluit te kleine locaties uit', () => {
  const r = search(idx, 'congres 500 gasten').results.map((x) => x.title);
  assert.ok(r.includes('Kunstlinie') && !r.includes('Milk & Meetings'));
});
test('zoeken: type-filter', () => { assert.deepEqual(search(idx, 'catering', 'maker').results.map((x) => x.t), ['maker']); });

test('contact: geldig bericht', () => {
  const v = validateContact({ locatie_slug: 'euromast', bezoeker_naam: 'Anna', bezoeker_email: 'Anna@Voorbeeld.NL', bericht: 'Is jullie zaal vrij op 12 juni?', aantal_personen: '40', event_datum: '2027-06-12', t: 9000 });
  assert.equal(v.errors.length, 0); assert.equal(v.data.bezoeker_email, 'anna@voorbeeld.nl'); assert.equal(v.data.aantal_personen, 40);
});
test('contact: honeypot en te snel = spam', () => {
  assert.equal(validateContact({ website: 'http://spam' }).spam, true);
  assert.equal(validateContact({ t: 800 }).spam, true);
});
test('contact: ongeldige velden', () => {
  const v = validateContact({ locatie_slug: '../x', bezoeker_naam: 'A', bezoeker_email: 'geen', bericht: 'kort', event_datum: 'morgen', t: 5000 });
  assert.deepEqual(v.errors.sort(), ['bericht', 'email', 'locatie', 'naam']); assert.equal(v.data.event_datum, null);
});

test('maker: tijden verschuiven met programma, draaiboek en catering', () => {
  const d = fromBase(kick);
  assert.equal(startTime(d), '13:00');
  const { data, delta } = shiftTo(d, '14:30');
  assert.equal(delta, 90); assert.equal(startTime(data), '14:30');
  assert.equal(data.runbook[0].time, '11:30'); assert.equal(data.catering.moments[0].time, '14:30');
});
test('maker: antwoorden uit de vragenlijst overnemen', () => {
  const d = applyAnswers(fromBase(kick), { organisatie: 'Bureau Noord', gasten: '120', start: '14:00', dieet: ['vegan'] }, { venueId: 'tobacco', supplierIds: ['objektiv'] });
  assert.equal(d.organisatie, 'Bureau Noord'); assert.equal(d.guests, 120); assert.equal(startTime(d), '14:00');
  assert.equal(d.venueIds[0], 'tobacco'); assert.ok(d.supplierIds.includes('objektiv')); assert.match(d.notes, /vegan/);
});

test('pptx: geldige ZIP met welgevormde XML en 16:9', () => {
  const P = { feelings: { energie: 'Energie', trots: 'Trots', verbinding: 'Verbinding' }, venues: {}, suppliers: {} };
  const bytes = buildPptx({ ...kick, title: 'Test & <pptx>', venueIds: [], supplierIds: [] }, P);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-pptx-'));
  const f = path.join(dir, 't.pptx'); fs.writeFileSync(f, bytes);
  execFileSync('unzip', ['-tq', f]);
  const list = execFileSync('unzip', ['-Z1', f]).toString().split('\n');
  assert.ok(list.includes('ppt/presentation.xml') && list.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length >= 12);
  const pres = execFileSync('unzip', ['-p', f, 'ppt/presentation.xml']).toString();
  assert.match(pres, /<p:sldSz cx="12192000" cy="6858000"\/>/);
  assert.ok(execFileSync('unzip', ['-p', f, 'ppt/slides/slide2.xml']).toString().includes('Test &amp; &lt;pptx&gt;'));
  fs.rmSync(dir, { recursive: true, force: true });
});

import { fitRunbook, naturalEnd } from '../src/client/lib/tailor.js';
import { fitTo } from '../src/client/lib/userconcept.js';
const verg = concepts.find((c) => c.slug === 'vergadering');
test('eindtijd: natuurlijke eind en gelijk venster laat de duur intact', () => {
  const end = naturalEnd(verg.runbook);
  const r = fitRunbook(verg.runbook, '09:00', end);
  assert.equal(r.timing.ratio, 1); assert.equal(r.timing.note, '');
});
test('eindtijd: korter venster comprimeert en waarschuwt, afbouw schuift mee', () => {
  const end = naturalEnd(verg.runbook);
  const r = fitRunbook(verg.runbook, '09:00', '11:00');
  assert.ok(r.timing.ratio < 0.75 && r.timing.note.includes('minder tijd'));
  const guest = r.runbook.filter((x) => !/crew|opbouw|briefing|inrichten|generale|afbouw/i.test(x.title));
  assert.ok(guest.every((x) => x.time >= '09:00' && x.time < '11:00'), `alle onderdelen binnen het venster (${end})`);
});
test('eindtijd in de maker: programma, draaiboek en catering passen in het venster', () => {
  const { data, ratio } = fitTo(fromBase(kick), '13:00', '16:00');
  assert.ok(ratio < 1);
  assert.ok(data.program.every((p) => p.time >= '13:00' && p.time < '16:00'));
  assert.equal(data.duration, '13:00–16:00');
});
