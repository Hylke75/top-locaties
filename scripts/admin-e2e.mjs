#!/usr/bin/env node
// E2E-test van het beheer: rollen, validatie, publicatieregels, audit. Herstelt alle content na afloop.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const content = path.join(root, 'src/content');
const backup = path.join(root, '.admin/e2e-backup');
fs.rmSync(backup, { recursive: true, force: true });
fs.cpSync(content, backup, { recursive: true });
const PORT = 4179;
const env = { ...process.env, ADMIN_PORT: String(PORT), TL_EDITOR_TOKEN: 'e2e-redacteur', TL_CHIEF_TOKEN: 'e2e-hoofdredacteur' };
const server = spawn(process.execPath, ['scripts/admin.mjs'], { cwd: root, env });
await new Promise((r) => server.stdout.once('data', r));
const base = `http://127.0.0.1:${PORT}`;
let failures = 0;
const check = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FOUT'} ${label}`); if (!ok) failures++; };

try {
  const browser = await chromium.launch();
  const login = async (token) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(base + '/admin/');
    await page.fill('#token', token);
    await page.click('[data-login] button');
    await page.waitForSelector('[data-userbar]:not([hidden])');
    return page;
  };
  // Onbekende code
  const anon = await browser.newPage();
  await anon.goto(base + '/admin/');
  await anon.fill('#token', 'fout'); await anon.click('[data-login] button');
  await anon.waitForTimeout(900);
  check((await anon.textContent('[data-login-status]')).includes('Onbekend'), 'onbekende toegangscode wordt geweigerd');
  const apiAnon = await anon.evaluate(() => fetch('/api/content').then((r) => r.status));
  check(apiAnon === 401, 'API zonder sessie → 401');

  // Redacteur
  const ed = await login('e2e-redacteur');
  check((await ed.textContent('[data-userbar]')).includes('REDACTEUR'), 'redacteur ingelogd');
  check((await ed.locator('.ad-tile b').first().textContent()).trim() === '06', 'overzicht toont 6 live concepten');
  await ed.goto(base + '/admin/#concept/festival');
  await ed.waitForSelector('[data-concept-form]');
  check(await ed.locator('[data-concept-form] fieldset[disabled]').count() > 0, 'redacteur kan live concept niet bewerken');
  const forbidden = await ed.evaluate(async () => { const s = await fetch('/api/session').then((r) => r.json()); return fetch('/api/concepts/festival/status', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': s.csrf }, body: JSON.stringify({ status: 'archived' }) }).then((r) => r.status); });
  check(forbidden === 403, 'redacteur mag niet archiveren/publiceren (403)');
  const csrf = await ed.evaluate(() => fetch('/api/concepts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'zonder-csrf' }) }).then((r) => r.status));
  check(csrf === 403, 'mutatie zonder CSRF-token → 403');
  await ed.goto(base + '/admin/#concepten');
  await ed.fill('[data-new] [name=title]', 'De ochtend die opent');
  await ed.fill('[data-new] [name=slug]', 'ochtend-die-opent');
  await ed.click('[data-new] button');
  await ed.waitForSelector('[data-concept-form]');
  check(ed.url().includes('#concept/ochtend-die-opent'), 'redacteur maakt draft aan');
  const statusOpts = await ed.locator('[name=status] option').allTextContents();
  check(!statusOpts.includes('published'), 'redacteur ziet geen publiceer-optie');
  await ed.fill('[name=teaser]', 'Een kick-off die begint bij de eerste minuut.');
  await ed.click('[data-concept-form] button[type=submit]');
  await ed.waitForFunction(() => document.querySelector('[data-save-status]').textContent.includes('OPGESLAGEN'));
  check(true, 'draft opgeslagen');
  const partnerOptions = await ed.evaluate(() => fetch('/api/content').then((r) => r.json()).then((d) => d.partners.length));
  await ed.click('[data-add="venue"]');
  const opts = await ed.locator('[data-venues] select').first().locator('option').count();
  check(opts === partnerOptions && opts === 61, `locatiekeuze bevat uitsluitend de ${opts} aangesloten partners`);

  // Hoofdredacteur
  const chief = await login('e2e-hoofdredacteur');
  const pub = await chief.evaluate(async () => { const s = await fetch('/api/session').then((r) => r.json()); const r = await fetch('/api/concepts/ochtend-die-opent/status', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': s.csrf }, body: JSON.stringify({ status: 'published' }) }); return { status: r.status, body: await r.json() }; });
  check(pub.status === 422 && pub.body.errors.some((e) => e.includes('2–4 aanbevolen locaties')), 'onvolledig concept kan niet gepubliceerd worden (422 + reden)');
  // Roundtrip: openen en opslaan zonder wijzigingen mag niets van het complete concept verliezen.
  const before = JSON.parse(fs.readFileSync(path.join(content, 'concepts.json'), 'utf8')).concepts.find((c) => c.slug === 'nacht');
  await chief.goto(base + '/admin/#concept/nacht');
  await chief.waitForSelector('[data-concept-form]');
  await chief.click('[data-concept-form] button[type=submit]');
  await chief.waitForFunction(() => document.querySelector('[data-save-status]').textContent.includes('OPGESLAGEN'));
  const after = JSON.parse(fs.readFileSync(path.join(content, 'concepts.json'), 'utf8')).concepts.find((c) => c.slug === 'nacht');
  const keys = ['program', 'runbook', 'planning', 'catering', 'entertainment', 'crew', 'spaces', 'checklist', 'variations', 'risks', 'budgetItems', 'sustainability', 'evaluation', 'invitation', 'venueMatches', 'supplierMatches', 'feelingWeights', 'status'];
  const diff = keys.filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  check(diff.length === 0, `opslaan zonder wijziging behoudt het complete concept${diff.length ? ' — verschil in: ' + diff.join(', ') : ''}`);
  await chief.goto(base + '/admin/#locatie/kunstlinie');
  await chief.waitForSelector('[data-venue-form]');
  await chief.fill('[name=line]', 'Een theater in Almere.');
  await chief.check('[name=eventTypes][value=congres]');
  await chief.click('[data-venue-form] button[type=submit]');
  await chief.waitForFunction(() => document.querySelector('[data-save-status]').textContent.includes('OPGESLAGEN'));
  check(JSON.parse(fs.readFileSync(path.join(content, 'venues.editorial.json'), 'utf8')).venues.some((v) => v.greenbookingsSlug === 'kunstlinie'), 'redactie voor partnerlocatie opgeslagen');
  const nonPartner = await chief.evaluate(async () => { const s = await fetch('/api/session').then((r) => r.json()); return fetch('/api/venues/graanfabriek', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': s.csrf }, body: '{}' }).then((r) => r.status); });
  check(nonPartner === 400, 'redactie voor niet-partner wordt geweigerd (400)');
  await chief.goto(base + '/admin/#data');
  await chief.click('[data-build]');
  await chief.waitForFunction(() => document.querySelector('[data-output]').textContent.includes('TOP LOCATIES BUILD'), null, { timeout: 60000 });
  check(true, 'hoofdredacteur bouwt de site vanuit beheer');
  const preview = await chief.evaluate(() => fetch('/preview/locaties/kunstlinie/').then((r) => r.text()));
  check(preview.includes('Een theater in Almere.'), 'voorvertoning toont nieuwe redactie');
  await chief.goto(base + '/admin/#audit');
  await chief.waitForSelector('.ad-table tbody tr');
  const auditText = await chief.textContent('.ad-table');
  check(auditText.includes('concept.create') && auditText.includes('venue.editorial') && auditText.includes('site.build'), 'auditlog bevat alle mutaties');
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(base + '/admin/');
  check(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'beheer bruikbaar op 390 px (geen horizontale scroll)');
  await browser.close();
} finally {
  server.kill();
  fs.rmSync(content, { recursive: true, force: true });
  fs.cpSync(backup, content, { recursive: true });
  fs.rmSync(path.join(root, '.admin/revisions'), { recursive: true, force: true });
  await new Promise((r) => { const b = spawn(process.execPath, ['scripts/build.mjs'], { cwd: root }); b.on('close', r); });
}
console.log(failures ? `${failures} beheercontroles mislukt` : 'Alle beheercontroles geslaagd');
process.exitCode = failures ? 1 : 0;
