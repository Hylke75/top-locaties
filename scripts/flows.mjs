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
await page.click('[data-choose-supplier="localheroes"]');
check((await page.textContent('[data-plan-suppliers]')).includes('Floris') && (await page.textContent('[data-plan-suppliers]')).includes('Local Heroes'), 'composer toont twee makers');
check((await page.textContent('[data-plan-venue]')).includes('Euromast'), 'composer toont gekozen locatie');
check(!(await page.locator('[data-selection-bar]').isHidden()), 'selectiebalk zichtbaar');
await page.click('.tl-takeaway .tl-more > summary'); // kopiëren staat onder 'Meer opties'
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
check(await page.locator('[data-concept-card]:not([hidden])').count() === 22, 'conceptoverzicht toont 22 concepten');
await page.click('[data-ov-feeling="rust"]');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 5, 'filter Rust → 5 concepten');
await page.click('[data-ov-feeling="focus"]');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 4, 'Rust + Focus → 4 concepten');
await page.click('[data-ov-feeling="rust"]');
await page.click('[data-ov-feeling="trots"]');
check(await page.isVisible('[data-ov-empty]'), 'Focus + Trots → lege staat met alternatief');
await page.goto(base + '/eventconcepten/?dagdeel=avond');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 8 && await page.getAttribute('[data-ov-daypart="avond"]', 'aria-pressed') === 'true', 'deeplink ?dagdeel=avond → 8 avondconcepten');
await page.click('[data-ov-daypart="ochtend"]');
check(await page.locator('[data-concept-card]:not([hidden])').count() === 4, 'dagdeel ochtend → 4 concepten');

// Briefing → drie concepten → concept met vooringevulde vragenlijst → conceptplan (sjabloon, 12 hoofdstukken)
await page.goto(base + '/conceptplan/');
await page.selectOption('[name=aanleiding]', 'strategie');
await page.fill('[name=gasten]', '14');
await page.fill('[name=doel]', 'Drie besluiten over de koers');
await page.click('[data-brief-feel="focus"]');
await page.selectOption('[name=dagdeel]', 'halve');
await page.click('[data-brief-form] button[type=submit]');
await page.waitForSelector('[data-brief-card]');
const recs = await page.$$eval('[data-brief-card]', (els) => els.map((e) => e.dataset.briefCard));
check(recs.length === 3, `briefing → drie concepten (${recs.join(', ')})`);
check(['vergadering', 'walk-en-talk', 'kennisontbijt'].includes(recs[0]), 'briefing strategie + focus + halve dag → beste match is een halve-dagconcept');
check(await page.locator('[data-brief-card] .tl-brief-reasons li').count() >= 3, 'aanbevelingen zijn uitgelegd');
await page.click('[data-brief-card] .tl-catalog-card__title a');
await page.waitForSelector('[data-tailor-output]:not([hidden])');
check(await page.inputValue('[data-tailor-form] [name=gasten]') === '14' && !page.url().includes('brief='), 'concept opent met briefing ingevuld (en schone URL)');
await page.goto(base + `/eventconcepten/${recs[0]}/conceptplan/`);
check(await page.locator('.tl-doc__part').count() === 12, 'conceptplan heeft twaalf hoofdstukken');
check(await page.inputValue('[data-doc-field=opdracht]') === 'Drie besluiten over de koers', 'conceptplan vooraf ingevuld uit de vragenlijst');
await page.fill('[data-doc-field=eigenaar]', 'Directiesecretaris');
await page.check('[data-doc-check="kwaliteit-0"]');
await page.reload();
check(await page.inputValue('[data-doc-field=eigenaar]') === 'Directiesecretaris' && await page.isChecked('[data-doc-check="kwaliteit-0"]'), 'conceptplan bewaart invulvelden en vinkjes');
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
await page.click('[data-sup-cat="eten"]');
check(await page.locator('[data-supplier-dir]:not([hidden])').count() === 5, 'leveranciers: hoofdcategorie Eten & drinken → 5 partners');
check(await page.locator('[data-supplier-dir]').count() === 16, 'leveranciersgids toont alle 16 aangesloten partners');
await page.goto(base + '/leveranciers/bourgonje/');
check((await page.textContent('main')).includes('Het festival van morgen'), 'leverancierdetail toont rol per concept');
await page.goto(base + '/mijn-plan/');
check(await page.locator('[data-plan-item]').count() >= 1 && (await page.textContent('[data-plan-list]')).includes('Euromast'), 'mijn plan toont bewaard plan met locatie');
await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('tl-plans-v1')); p.diner.venueId = 'graan'; localStorage.setItem('tl-plans-v1', JSON.stringify(p)); });
await page.reload();
check((await page.textContent('[data-plan-list]')).includes('niet meer beschikbaar als aangesloten partner'), 'vervallen partner in plan → waarschuwing, niet als optie');
await page.click('[data-plan-remove="diner"]');
check(await page.locator('[data-plan-item="diner"]').count() === 0, 'plan verwijderen werkt');

// 5. Compleet concept: programma-pop-up, keuzes in de composer, vragenlijst op maat
await page.goto(base + '/eventconcepten/festival/');
check(await page.locator('#prog-festival-1 .tl-agenda__panel').isHidden() && await page.locator('.tl-agenda__item').count() >= 4, 'programma is compact: onderdelen standaard dicht');
await page.click('#prog-festival-1 summary');
check(await page.isVisible('#prog-festival-1 .tl-agenda__panel') && (await page.textContent('#prog-festival-1')).includes('ZO PAK JE HET AAN'), 'klik op programma-onderdeel toont de aanpak ter plekke');
await page.click('#prog-festival-2 summary');
check(await page.isVisible('#prog-festival-2 .tl-agenda__panel') && await page.locator('#prog-festival-1 .tl-agenda__panel').isHidden(), 'één onderdeel tegelijk open');
await page.focus('#prog-festival-3 summary');
await page.keyboard.press('Enter');
check(await page.isVisible('#prog-festival-3 .tl-agenda__panel'), 'toetsenbord: Enter opent een onderdeel');
await page.goto(base + '/eventconcepten/festival/#prog-festival-4');
check(await page.isVisible('#prog-festival-4 .tl-agenda__panel'), 'deeplink #prog-… opent dat onderdeel');
const emojiArrows = await page.evaluate(() => (document.body.innerText.match(/[↗↘](?!\uFE0E)/g) || []).length);
check(emojiArrows === 0, 'pijlen staan als tekstteken (geen emoji op iOS)');
check(!(await page.content()).includes('>VOORBEELD<'), 'programma niet meer als voorbeeld gelabeld');
await page.selectOption('[data-composer-venue]', 'beeld');
check((await page.textContent('[data-plan-venue]')).includes('Beeld & Geluid'), 'locatie kiezen in de composer');
check(await page.getAttribute('[data-venue-card="beeld"]', 'data-selected') === 'true', 'composerkeuze synchroon met locatiekaart');
await page.check('[data-composer-supplier="bourgonje"]');
await page.click('.tl-composer__more summary');
await page.check('[data-composer-supplier="objektiv"]');
check((await page.textContent('[data-plan-suppliers]')).includes('Objektiv'), 'makers kiezen in de composer (ook overige partners)');
const wasOn = await page.getAttribute('[data-composer-feel="focus"]', 'aria-pressed');
await page.click('[data-composer-feel="focus"]');
check(await page.getAttribute('[data-composer-feel="focus"]', 'aria-pressed') !== wasOn, 'gevoel kiezen in de composer');
await page.fill('[data-tailor-form] [name=organisatie]', 'Testbedrijf');
await page.fill('[data-tailor-form] [name=datum]', '2027-03-18');
await page.fill('[data-tailor-form] [name=start]', '10:00');
await page.fill('[data-tailor-form] [name=gasten]', '700');
await page.fill('[data-tailor-form] [name=contact]', 'Sam');
await page.check('[data-tailor-form] [name=dieet][value=vegan]');
await page.click('[data-tailor-form] button[type=submit]');
const out = await page.textContent('[data-tailor-output]');
check(out.includes('10:00') && out.includes('Inloop en registratie'), 'draaiboek op maat start op 10:00');
check(/VANAF .*2026/.test(out), 'aftelplanning met echte data');
check(out.includes('700 GASTEN') && out.includes('VEGAN'), 'catering op maat met aantallen en dieet');
check(out.includes('Groter (500+ gasten)'), 'passende variant aanbevolen bij 700 gasten');
check(out.includes('OFFERTEAANVRAGEN') && await page.locator('[data-copy-quote]').count() === 3, 'offerteaanvragen voor locatie en 2 makers');
await page.click('[data-copy-quote="0"]');
const q = await page.evaluate(() => navigator.clipboard.readText());
check(q.includes('700 gasten') && q.includes('Beeld & Geluid'), 'offerteaanvraag gekopieerd met gegevens');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-download-budget]')]);
check(dl.suggestedFilename() === 'begroting-festival.csv', 'begroting downloadbaar als CSV');
await page.evaluate(() => { document.querySelector('.tl-takeaway .tl-more').open = true; });
await page.click('[data-tailor-copy]');
const full = await page.evaluate(() => navigator.clipboard.readText());
check(['DAGDRAAIBOEK', 'CALLSHEET', 'ENTERTAINMENT', 'UITNODIGING', 'Testbedrijf'].every((x) => full.includes(x)), 'compleet draaiboek gekopieerd');
await page.reload();
check((await page.textContent('[data-tailor-output]')).includes('Testbedrijf'), 'antwoorden blijven bewaard na herladen');

// 6. Contact-pop-up op locatiedetail
await page.goto(base + '/locaties/nederlands-instituut-voor-beeld-geluid-hilversum/');
await page.locator('[data-open-dialog^="contact-"]').first().click();
check(await page.isVisible('[data-contact-dialog]') && (await page.textContent('[data-contact-dialog]')).includes('Jessie Schaduw'), 'contact-pop-up met contactpersoon');
check((await page.inputValue('[data-contact-form] [name=aantal]')) === '700', 'contactformulier voorgevuld vanuit het plan');
await page.click('[data-contact-submit]');
check(await page.isVisible('[data-contact-error]'), 'validatie: verplichte velden');
await page.fill('[data-contact-form] [name=naam]', 'Sam');
await page.fill('[data-contact-form] [name=email]', 'sam@example.com');
await page.click('[data-contact-submit]');
await page.waitForSelector('[data-contact-done]:not([hidden])');
check((await page.textContent('[data-contact-done]')).includes('OPEN HET CONTACTFORMULIER'), 'zonder endpoint: eerlijke afronding via Greenbookings-profiel');

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
