// Unit- en integratietests voor de harde productregels (FO §0, bouwplan L-02/L-03, P-01…).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isPublishablePartner, loadData } from '../src/lib/data.mjs';
import { rankConcepts, toggleFeeling, explainMatch, parseFeelingParam } from '../src/client/lib/rank.js';
import { validate } from '../scripts/validate-content.mjs';

const data = loadData();

test('partnerpoort is fail-closed', () => {
  assert.equal(isPublishablePartner({ status: 'gepubliceerd', aangesloten: true }), true);
  for (const bad of [null, undefined, {}, { status: 'gepubliceerd' }, { status: 'gepubliceerd', aangesloten: false }, { status: 'gepubliceerd', aangesloten: 'true' }, { status: 'gepubliceerd', aangesloten: 1 }, { status: 'verborgen', aangesloten: true }, { status: 'concept', aangesloten: true }]) {
    assert.equal(isPublishablePartner(bad), false, JSON.stringify(bad));
  }
});

test('alle publieke locaties zijn aangesloten partners', () => {
  const snap = JSON.parse(fs.readFileSync('src/content/greenbookings-snapshot.json', 'utf8'));
  for (const v of data.venues) {
    const src = snap.venues.find((x) => x.greenbookingsSlug === v.greenbookingsSlug);
    assert.ok(src && src.aangesloten === true && src.status === 'gepubliceerd', v.name);
  }
  assert.ok(data.venues.length > 0);
});

test('conceptmatches verwijzen alleen naar publiceerbare partners', () => {
  const ids = new Set(data.venues.map((v) => v.id));
  for (const c of data.concepts) for (const m of c.venueMatches) assert.ok(ids.has(m.venueId), `${c.slug} → ${m.venueId}`);
});

test('gebouwde site: sitemap en locatiepagina’s bevatten geen niet-partners', () => {
  if (!fs.existsSync('site/sitemap.xml')) return;
  const sitemap = fs.readFileSync('site/sitemap.xml', 'utf8');
  const partnerSlugs = new Set(data.venues.map((v) => v.slug));
  for (const [, slug] of sitemap.matchAll(/\/locaties\/([^/<]+)\//g)) assert.ok(partnerSlugs.has(slug), slug);
  const dirs = fs.readdirSync('site/locaties', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const d of dirs) assert.ok(partnerSlugs.has(d), d);
  // Bekende niet-partner uit het prototype mag nergens als pagina bestaan.
  assert.ok(!fs.existsSync('site/locaties/graanfabriek'));
  assert.ok(!fs.readFileSync('site/locaties/index.html', 'utf8').includes('Graanfabriek'));
});

test('gevoelskeuze: max. twee, derde vervangt de oudste', () => {
  let s = toggleFeeling([], 'energie');
  s = toggleFeeling(s, 'rust');
  s = toggleFeeling(s, 'focus');
  assert.deepEqual(s, ['rust', 'focus']);
  assert.deepEqual(toggleFeeling(s, 'rust'), ['focus']);
  assert.deepEqual(parseFeelingParam('verbinding,rust,trots,onzin', ['verbinding', 'rust', 'trots']), ['verbinding', 'rust']);
});

test('matching: gewogen, uitlegbaar, zonder percentages, altijd 3 resultaten', () => {
  const r = rankConcepts(data.concepts, ['verbinding', 'rust']);
  assert.equal(r.length, 3);
  assert.equal(r[0].concept.slug, 'diner');
  const text = explainMatch(r[0], data.feelingLabels);
  assert.match(text, /^Past bij /);
  assert.doesNotMatch(text, /%/);
  const none = rankConcepts(data.concepts.filter((c) => !c.feelings.includes('rust')), ['rust']);
  assert.equal(none.length, 3);
  assert.ok(none.every((x) => x.kind === 'alternative'));
  assert.equal(rankConcepts(data.concepts, []).every((x) => x.kind === 'inspiration'), true);
});

test('contentvalidatie heeft geen fouten', () => {
  assert.deepEqual(validate().errors, []);
});
