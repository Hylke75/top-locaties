// Sync-adapter: normalisatie en partnerregel (zonder netwerk).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../scripts/sync/greenbookings.mjs';

test('record zonder partnerveld gaat in quarantaine (fail-closed)', () => {
  assert.ok(normalize({ slug: 'x', naam: 'X', stad: 'A', provincie: 'B' }).quarantine);
});
test('niet-aangesloten record wordt geweigerd', () => {
  assert.equal(normalize({ slug: 'x', naam: 'X', stad: 'A', provincie: 'B', aangesloten: false }).quarantine, 'niet aangesloten');
});
test('aangesloten record wordt genormaliseerd', () => {
  const { record } = normalize({ slug: 'x', naam: 'X', stad: 'A', provincie: 'B', aangesloten: true, capaciteit_max: 100, hero_media_url: 'https://e/x.jpg' });
  assert.equal(record.aangesloten, true);
  assert.equal(record.capacityMax, 100);
  assert.equal(record.heroImage.url, 'https://e/x.jpg');
});
test('placeholderfoto wordt niet als echte foto overgenomen', () => {
  const { record } = normalize({ slug: 'x', naam: 'X', stad: 'A', provincie: 'B', aangesloten: true, hero_media_url: 'https://e/_placeholder-foto-volgt.jpg' });
  assert.equal(record.heroImage, null);
});
test('schema-drift (geen slug) → quarantaine', () => {
  assert.ok(normalize({ name_new: 'X' }).quarantine);
});
