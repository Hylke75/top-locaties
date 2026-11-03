#!/usr/bin/env node
// Functionele QA-routes uit design-system/QA-CHECKLIST.md (1–3, 5 deels), headless.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://localhost:4173';
let failures = 0;
const check = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FOUT'} ${label}`); if (!ok) failures++; };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

// 1. Gevoel → concept
await page.goto(base + '/');
await page.click('[data-feel="verbinding"]');
await page.click('[data-feel="rust"]');
check(await page.locator('[data-feel][aria-pressed="true"]').count() === 2, 'twee gevoelens geselecteerd (aria-pressed)');
await page.click('[data-feel="focus"]');
const pressed = await page.locator('[data-feel][aria-pressed="true"]').evaluateAll((els) => els.map((e) => e.dataset.feel));
check(pressed.length === 2 && !pressed.includes('verbinding'), `derde keuze vervangt de oudste → ${pressed.join('+')}`);
await page.click('[data-feel="focus"]'); await page.click('[data-feel="verbinding"]');
const first = page.locator('[data-match-grid] .tl-match').first();
check((await first.textContent()).includes('Het diner dat verbindt'), 'Verbinding + Rust → eerste match: Het diner dat verbindt');
check(/Past bij (rust en verbinding|verbinding en rust)/.test(await first.textContent()), 'match toont uitleg "Past bij …"');
check(!/%/.test(await page.locator('[data-match-grid]').textContent()), 'geen percentages in matches');
check(await first.evaluate((e) => getComputedStyle(e).color) === 'rgb(255, 255, 255)', 'beste match: witte tekst op kobalt');
await first.click();
await page.waitForURL(/eventconcepten\/diner/);
check((await page.textContent('[data-signature-chosen]')).includes('RUST'), 'conceptpagina toont gekozen gevoelens in signatuur');

// 2. Concept → keuze
await page.click('[data-choose-venue="nutshuis"]');
await page.click('[data-choose-venue="euromast"]');
check(await page.locator('[data-venue-card][data-selected="true"]').count() === 1, 'één locatie tegelijk');
await page.click('[data-choose-supplier="floris"]');
await page.click('[data-choose-supplier="jb"]');
check((await page.textContent('[data-plan-suppliers]')).includes('Floris') && (await page.textContent('[data-plan-suppliers]')).includes('JB'), 'composer toont twee makers');
check((await page.textContent('[data-plan-venue]')).includes('Euromast'), 'composer toont gekozen locatie');
check(!(await page.locator('[data-selection-bar]').isHidden()), 'selectiebalk zichtbaar');
await page.click('[data-plan-copy]');
const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
check(clip.includes('Euromast') && clip.includes('geen boeking'), 'kopieer mijn plan: platte tekst met disclaimer');
await page.reload();
check((await page.textContent('[data-plan-venue]')).includes('Euromast'), 'keuze blijft bewaard na herladen (localStorage)');
const ext = await page.locator('a[target="_blank"]').evaluateAll((as) => as.every((a) => (a.rel || '').includes('noopener')));
check(ext, 'alle externe links hebben rel=noopener');

// 3. Zoeker (alle aangesloten partners)
await page.goto(base + '/locaties/');
const count = async () => Number(await page.textContent('[data-result-count]'));
const visible = () => page.locator('[data-catalog] [data-venue]:not([hidden])');
check(await count() === 61, `start: ${await count()} aangesloten partners`);
check(!(await page.content()).includes('Graanfabriek'), 'niet-partner (Graanfabriek) staat nergens op de zoekpagina');
await page.fill('#q', 'den haag'); await page.waitForTimeout(300);
const dh = await visible().evaluateAll((els) => els.every((e) => e.dataset.search.includes('den haag')));
check(await count() > 0 && dh, `zoek "den haag" → ${await count()} relevante resultaten`);
await page.fill('#q', ''); await page.waitForTimeout(300);
await page.selectOption('#regio', 'Zuid-Holland');
await page.check('input[name="karakter"][value="historisch"]');
const zh = await visible().evaluateAll((els) => els.every((e) => e.dataset.province === 'Zuid-Holland' && e.dataset.character.includes('historisch')));
check(await count() > 0 && zh, `Zuid-Holland + historisch → ${await count()}, alle kloppen`);
check(page.url().includes('regio=Zuid-Holland') && page.url().includes('karakter=historisch'), 'filterstatus in URL');
await page.selectOption('#gasten', '1000');
const cap = await visible().evaluateAll((els) => els.every((e) => e.dataset.capMax === '' || Number(e.dataset.capMax) >= 1000));
check(cap, `gasten 1000 → alleen locaties met capaciteit ≥ 1000 (${await count()})`);
await page.fill('#q', 'zzzonbestaand'); await page.waitForTimeout(300);
check(await count() === 0 && await page.isVisible('[data-empty]'), 'nulresultaat toont lege staat');
await page.locator('[data-empty] [data-reset]').click();
check(await count() === 61, 'reset → alle partners terug');
await page.selectOption('#sort', 'naam');
const names = await visible().evaluateAll((els) => els.map((e) => e.dataset.name));
check(names.every((n, i) => !i || names[i - 1].localeCompare(n, 'nl') <= 0), 'sorteren op naam klopt');
await page.click('[data-view="regio"]');
check(await page.isVisible('[data-region-view]') && await page.locator('[data-region]:not([hidden])').count() >= 8, 'regio-overzicht per provincie');
await page.goto(base + '/locaties/?concept=diner');
check(await count() === 3, 'deeplink ?concept=diner → 3 locaties');

// 4. Nieuwe pagina's
await page.goto(base + '/eventconcepten/');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 4, 'conceptoverzicht toont 4 concepten');
await page.click('[data-ov-feeling="rust"]');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 1, 'filter Rust → 1 concept');
await page.click('[data-ov-feeling="focus"]');
check(await page.isVisible('[data-ov-empty]'), 'Rust + Focus → lege staat met alternatief');
await page.goto(base + '/eventconcepten/op-gevoel/?gevoel=verwondering,trots');
check(await page.getAttribute('[data-feel="trots"]', 'aria-pressed') === 'true', 'op-gevoel herstelt keuze uit URL');
check((await page.locator('[data-match-grid] .tl-match').first().textContent()).includes('Nacht van verwondering'), 'Verwondering + Trots → Nacht van verwondering');
await page.click('[data-feel="energie"]');
check((await page.textContent('[data-feel-notice]')).includes('twee gevoelens'), 'derde keuze toont melding');
const vres = await page.goto(base + '/locaties/euromast/');
check(vres.status() === 200 && (await page.textContent('h1')).includes('Euromast'), 'locatiedetail Euromast');
check((await page.textContent('#concepten')).includes('Het diner dat verbindt'), 'locatiedetail toont passend concept met reden');
const np = await page.goto(base + '/locaties/graanfabriek/');
check(np.status() === 404, 'directe route naar niet-partner → 404');
await page.goto(base + '/leveranciers/');
await page.click('[data-sup-cat="Catering"]');
check(await page.locator('[data-supplier-dir]:not([hidden])').count() === 2, 'leveranciers filter Catering → 2');
await page.goto(base + '/leveranciers/bourgonje/');
check((await page.textContent('main')).includes('Het festival van morgen'), 'leverancierdetail toont rol per concept');
await page.goto(base + '/mijn-plan/');
check(await page.locator('[data-plan-item]').count() >= 1 && (await page.textContent('[data-plan-list]')).includes('Euromast'), 'mijn plan toont bewaard plan met locatie');
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('tl-plans-v1')); p.diner.venueId = 'graan'; localStorage.setItem('tl-plans-v1', JSON.stringify(p)); });
await page.reload();
check((await page.textContent('[data-plan-list]')).includes('niet meer beschikbaar als aangesloten partner'), 'vervallen partner in plan → waarschuwing, niet als optie');
await page.click('[data-plan-remove="diner"]');
check(await page.locator('[data-plan-item="diner"]').count() === 0, 'plan verwijderen werkt');

// Mobiel: menu en filterpaneel
const m = await browser.newPage({ viewport: { width: 360, height: 800 } });
await m.goto(base + '/locaties/');
check(!(await m.isVisible('#tl-nav a[href="/locaties/"]')), 'mobiel: navigatie dicht');
await m.click('[data-menu-toggle]');
check(await m.isVisible('#tl-nav a[href="/locaties/"]'), 'mobiel: MENU opent navigatie');
await m.keyboard.press('Escape');
check(!(await m.isVisible('#tl-filters-dummy')) && !(await m.isVisible('#filterPanel')), 'mobiel: filterpaneel standaard dicht');
await m.click('[data-filter-toggle]');
check(await m.isVisible('#filterPanel'), 'mobiel: filterpaneel opent');
const small = await m.locator('button:visible, a.tl-button:visible').evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 36; }).map((e) => e.textContent.trim().slice(0, 30)));
check(small.length === 0, `touch targets ≥36px (${small.join(', ') || 'geen afwijkingen'})`);

// Toetsenbord: gevoel kiezen met Space
const k = await browser.newPage();
await k.goto(base + '/');
await k.focus('[data-feel="trots"]');
await k.keyboard.press('Space');
check(await k.getAttribute('[data-feel="trots"]', 'aria-pressed') === 'true', 'toetsenbord: Space selecteert gevoel');
await k.goto(base + '/concept.html?concept=nacht');
await k.waitForURL(/eventconcepten\/nacht/);
check(true, 'oude URL concept.html?concept=nacht → /eventconcepten/nacht/');

check(errors.length === 0, `geen JS-fouten (${errors.join(' | ')})`);
await browser.close();
console.log(failures ? `${failures} controles mislukt` : 'Alle functionele controles geslaagd');
process.exitCode = failures ? 1 : 0;
