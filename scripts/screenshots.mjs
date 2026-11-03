#!/usr/bin/env node
// Visuele regressie: screenshots per route bij 1440/1024/768/390/360 px.
// Gebruik: node scripts/build.mjs && (node scripts/serve.mjs &) && node scripts/screenshots.mjs
// Uitvoer: .qa/screens/*.jpg (+ referentiesets 1440/390 naar docs/screenshots met --reference).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Playwright: lokaal geïnstalleerd of globaal (cloudomgeving).
const { chromium } = require('playwright');

const base = process.env.BASE_URL || 'http://localhost:4173';
const reference = process.argv.includes('--reference');
const fullPage = !process.argv.includes('--viewport');
const routes = [
  ['home', '/'],
  ['concept-festival', '/eventconcepten/festival/'],
  ['concept-diner', '/eventconcepten/diner/?gevoel=verbinding,rust'],
  ['locaties', '/locaties/'],
  ['concepten', '/eventconcepten/'],
  ['op-gevoel', '/eventconcepten/op-gevoel/?gevoel=verbinding,rust'],
  ['locatie-euromast', '/locaties/euromast/'],
  ['locatie-pier', '/locaties/peopleplaces-den-haag-scheveningen-de-pier/'],
  ['leveranciers', '/leveranciers/'],
  ['leverancier-bourgonje', '/leveranciers/bourgonje/'],
  ['mijn-plan', '/mijn-plan/'],
  ['over', '/over/'],
  ['conceptplan-briefing', '/conceptplan/'],
  ['conceptplan-kick-off', '/eventconcepten/kick-off/conceptplan/'],
  ['concept-kick-off', '/eventconcepten/kick-off/'],
  ['styleguide', '/styleguide/'],
  ['proto-hupr', '/prototype/hupr.html'],
  ['proto-concept', '/prototype/concept.html?concept=festival'],
  ['proto-locaties', '/prototype/locaties.html'],
];
const widths = [[1440, 900], [1024, 768], [768, 1024], [390, 844], [360, 800]];
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(repo, '.qa/screens');
fs.mkdirSync(outDir, { recursive: true });
if (reference) fs.mkdirSync(path.join(repo, 'docs/screenshots'), { recursive: true });

const browser = await chromium.launch();
const report = [];
for (const [w, h] of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const [name, route] of routes) {
    errors.length = 0;
    await page.goto(base + route, { waitUntil: 'networkidle' });
    if (fullPage) { await page.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; i.decoding = 'sync'; })); await page.waitForLoadState('networkidle'); await page.waitForTimeout(400); }
    await page.addStyleTag({ content: '.tl-marquee__track{animation:none!important}' }).catch(() => {});
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const file = path.join(outDir, `${name}-${w}.jpg`);
    await page.screenshot({ path: file, fullPage, type: 'jpeg', quality: 72 });
    if (reference && (w === 1440 || w === 390) && !name.startsWith('proto')) fs.copyFileSync(file, `${repo}/docs/screenshots/${name}-${w}.jpg`);
    report.push({ route, width: w, overflowPx: overflow, errors: [...errors] });
  }
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
for (const r of report) console.log(`${String(r.width).padEnd(5)} ${r.route.padEnd(48)} overflow:${r.overflowPx}px ${r.errors.length ? 'FOUTEN: ' + r.errors.join(' | ') : 'ok'}`);
