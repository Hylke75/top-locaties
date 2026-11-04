import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { conceptBlocks, blocksToText, blocksToDocx, fileSlug } from '../src/client/lib/exporters.js';
import { fromBase, merge, check, EDITABLE } from '../src/client/lib/userconcept.js';

const concepts = JSON.parse(fs.readFileSync(new URL('../src/content/concepts.json', import.meta.url))).concepts;
const base = concepts.find((c) => c.slug === 'diner');

test('fromBase neemt de basis over en zet partners als keuze', () => {
  const d = fromBase(base);
  assert.equal(d.title, 'Het diner dat verbindt (mijn versie)');
  assert.deepEqual(d.venueIds, base.venueMatches.map((m) => m.venueId));
  assert.equal(d.program.length, base.program.length);
  assert.ok(Object.keys(d).every((k) => EDITABLE.includes(k)));
  d.program[0].title = 'Gewijzigd';
  assert.notEqual(base.program[0].title, 'Gewijzigd', 'basis blijft ongewijzigd');
});

test('merge: eigen bewerkingen winnen, de rest komt uit de basis', () => {
  const c = merge(base, { title: 'Ons diner', program: [{ time: '18:00', title: 'Start' }] });
  assert.equal(c.title, 'Ons diner');
  assert.deepEqual(c.headline, ['Ons diner']);
  assert.equal(c.program.length, 1);
  assert.deepEqual(c.journey, base.journey);
});

test('check: titel, programma en tijden', () => {
  assert.ok(check({ title: '', program: [] }).length >= 2);
  assert.ok(check({ title: 'x', program: [{ title: 'a', time: '9u' }] }).some((e) => e.includes('UU:MM')));
  assert.deepEqual(check({ title: 'x', program: [{ title: 'a', time: '09:00' }] }), []);
});

test('tekstexport bevat alle hoofdstukken', () => {
  const t = blocksToText(conceptBlocks(base, {}));
  for (const h of ['AANLEIDING', 'PROGRAMMA', 'DRAAIBOEK', 'CATERING', 'LOCATIE EN MAKERS', 'COMMUNICATIE']) assert.ok(t.includes(h), h);
  assert.ok(!t.includes('*'), 'geen opmaaktekens');
});

test('docx is een geldige ZIP met welgevormde XML', () => {
  const bytes = blocksToDocx(conceptBlocks({ ...base, title: 'Test & <diner>' }, {}), { title: 'Test & <diner>' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-docx-'));
  const f = path.join(dir, 't.docx'); fs.writeFileSync(f, bytes);
  const list = execFileSync('unzip', ['-Z1', f]).toString().trim().split('\n');
  assert.deepEqual(list.sort(), ['[Content_Types].xml', '_rels/.rels', 'docProps/core.xml', 'word/_rels/document.xml.rels', 'word/document.xml', 'word/styles.xml'].sort());
  const xml = execFileSync('unzip', ['-p', f, 'word/document.xml']).toString();
  assert.ok(xml.includes('Test &amp; &lt;diner&gt;'), 'tekst ge-escaped');
  execFileSync('unzip', ['-tq', f]);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fileSlug', () => { assert.equal(fileSlug('Kick-off Bureau Noord 2027!'), 'kick-off-bureau-noord-2027'); assert.equal(fileSlug('Ééndaags café'), 'eendaags-cafe'); });
