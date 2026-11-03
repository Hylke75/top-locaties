import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { recommend, scoreConcept, briefToAnswers, conceptLink, parseBriefParam } from '../src/client/lib/brief.js';

const doc = JSON.parse(fs.readFileSync(new URL('../src/content/concepts.json', import.meta.url)));
const concepts = doc.concepts.filter((c) => c.status === 'published');
const ctx = { occasionTypes: doc.occasionTypes, feelings: { energie: 'Energie', focus: 'Focus', rust: 'Rust', trots: 'Trots', verbinding: 'Verbinding', verwondering: 'Verwondering' } };

test('recommend geeft drie concepten uit verschillende categorieën', () => {
  const r = recommend(concepts, { aanleiding: 'strategie', gevoel: ['focus'], gasten: 20 }, ctx);
  assert.equal(r.length, 3);
  assert.equal(new Set(r.map((x) => x.concept.category)).size, 3);
  assert.deepEqual(r.map((x) => x.role), ['BESTE MATCH', 'ANDERE INVALSHOEK', 'VERRASSENDE KEUZE']);
});

test('strategie + focus + ochtend → vergaderconcept bovenaan, met uitleg', () => {
  const [top] = recommend(concepts, { aanleiding: 'strategie', gevoel: ['focus'], dagdeel: 'ochtend', gasten: 14 }, ctx);
  assert.equal(top.concept.category, 'vergaderen');
  assert.ok(top.reasons.some((x) => /aanleiding/.test(x)));
});

test('vieren + avond + trots → avondconcept bovenaan', () => {
  const [top] = recommend(concepts, { aanleiding: 'vieren', gevoel: ['trots'], dagdeel: 'avond', gasten: 150 }, ctx);
  assert.equal(top.concept.dayPart, 'avond');
});

test('halve dag matcht ochtend en middag', () => {
  const c = concepts.find((x) => x.dayPart === 'middag');
  assert.ok(scoreConcept(c, { dagdeel: 'halve' }, ctx).reasons.length > 0);
});

test('groepsgrootte buiten bereik geeft aandachtspunt, geen stille uitsluiting', () => {
  const c = concepts.find((x) => x.slug === 'boardroomdiner');
  const s = scoreConcept(c, { gasten: 500 }, ctx);
  assert.ok(s.watch.some((x) => /gasten/.test(x)));
});

test('briefToAnswers vertaalt budgetniveau en randvoorwaarden', () => {
  const a = briefToAnswers({ budgetniveau: 'ruim', gasten: '80', aanleiding: 'vieren', toegankelijk: true, duurzaam: true }, ctx);
  assert.equal(a.bijstelling, 'exclusiever');
  assert.equal(a.gasten, '80');
  assert.equal(a.toegankelijk, true);
  assert.equal(a.duurzaam, 'hoog');
  assert.match(a.aanleiding, /vieren/i);
});

test('conceptLink + parseBriefParam: round-trip en alleen bekende velden', () => {
  const href = conceptLink('kick-off', { gevoel: ['energie', 'trots'], gasten: 120, doel: 'Koers laten landen' }, ctx);
  const u = new URL(href, 'https://top-locaties.nl');
  assert.equal(u.pathname, '/eventconcepten/kick-off/');
  assert.equal(u.searchParams.get('gevoel'), 'energie,trots');
  const a = parseBriefParam(u.searchParams.get('brief'));
  assert.equal(a.gasten, '120');
  assert.equal(a.doel, 'Koers laten landen');
  assert.equal(parseBriefParam('{"evil":"<script>","bijstelling":"x"}').bijstelling, '');
  assert.equal(parseBriefParam('niet-json'), null);
});
