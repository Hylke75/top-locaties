#!/usr/bin/env node
// Top Locaties — afhankelijkheidsvrije statische build naar ./site
// Data: src/content (Greenbookings-snapshot + redactie). Stijl: design-system/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from '../src/lib/data.mjs';
import { validate } from './validate-content.mjs';
import { renderHome } from '../src/pages/home.mjs';
import { renderBriefing, renderPlanDocument } from '../src/pages/conceptplan.mjs';
import { renderEnHome, renderEnConcepts } from '../src/pages/en.mjs';
import { renderAccount, renderMaker, renderPresentation, renderSearch, renderRegister } from '../src/pages/account.mjs';
import { renderConcept } from '../src/pages/concept.mjs';
import { renderLocaties } from '../src/pages/locaties.mjs';
import { renderLegacy, renderNotFound } from '../src/pages/legacy.mjs';
import { htmlToMarkdown, estimateTokens } from './lib/html-to-md.mjs';
import { openApi, apiCatalog, skillMd, skillsIndex, aiCatalog } from './lib/agent-discovery.mjs';
import { renderApiDocs } from '../src/pages/apidocs.mjs';
import { renderConceptsOverview, renderOpGevoel, renderVenueDetail, renderSuppliers, renderSupplierDetail, renderPlan, renderAbout, renderPlaybook } from '../src/pages/more.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'site');
const write = (rel, content) => {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(out, to)), { recursive: true });
  fs.cpSync(path.join(root, from), path.join(out, to), { recursive: true });
};

const problems = validate();
if (problems.errors.length) {
  problems.errors.forEach((e) => console.error(`FOUT  ${e}`));
  process.exit(1);
}
problems.warnings.forEach((w) => console.warn(`LET OP ${w}`));

fs.rmSync(out, { recursive: true, force: true });
const data = loadData();

copy('design-system/tokens.css', 'assets/css/tokens.css');
copy('design-system/components.css', 'assets/css/components.css');
copy('design-system/deck-print.css', 'assets/css/deck-print.css');
copy('design-system/fonts.css', 'assets/css/fonts.css');
copy('src/assets/fonts', 'assets/fonts');
copy('src/assets/og', 'assets/og');
copy('src/client', 'assets/js');
for (const img of ['hero-event.webp', 'festival-event.webp']) copy(`dist/${img}`, `assets/img/${img}`);
for (const img of ['hero-event-800.webp', 'festival-event-640.webp']) copy(`src/assets/img/${img}`, `assets/img/${img}`);
copy('src/assets/favicon.svg', 'assets/img/favicon.svg');
// Eigen conceptbeelden (aangeleverd met gebruiksrecht; zie src/content/concept-images.json).
if (fs.existsSync(path.join(root, 'src/assets/img/concepten'))) fs.cpSync(path.join(root, 'src/assets/img/concepten'), path.join(out, 'assets/img/concepten'), { recursive: true, filter: (f) => !path.basename(f).startsWith('.') });

write('index.html', renderHome(data));
data.concepts.forEach((c, i) => write(`eventconcepten/${c.slug}/index.html`, renderConcept(data, c, i)));
write('locaties/index.html', renderLocaties(data));
write('eventconcepten/index.html', renderConceptsOverview(data));
write('eventconcepten/op-gevoel/index.html', renderOpGevoel(data));
data.venues.forEach((v) => write(`locaties/${v.slug}/index.html`, renderVenueDetail(data, v)));
write('leveranciers/index.html', renderSuppliers(data));
data.suppliers.forEach((s) => write(`leveranciers/${s.slug}/index.html`, renderSupplierDetail(data, s)));
write('mijn-plan/index.html', renderPlan(data));
write('over/index.html', renderAbout(data));
write('zelf-organiseren/index.html', renderPlaybook(data));
write('conceptplan/index.html', renderBriefing(data));
// Conceptdata voor de conceptmaker, de presentatie en de downloads (alleen gepubliceerde concepten, alleen partners).
data.concepts.forEach((c) => write(`data/concepts/${c.slug}.json`, JSON.stringify(c)));
write('data/partners.json', JSON.stringify({
  quoteQuestions: data.playbook?.quoteQuestions || {}, contactEndpoint: data.site.contact?.endpoint || null,
  feelings: Object.fromEntries(data.feelings.map((f) => [f.id, f.label])),
  concepts: data.concepts.map((c) => ({ slug: c.slug, title: c.title, teaser: c.teaser, categoryLabel: c.categoryLabel, dayPartLabel: c.dayPartLabel, duration: c.duration, hero: c.hero.src })),
  venues: Object.fromEntries(data.venues.map((v) => [v.id, { name: v.name, city: v.city, capacityMax: v.capacityMax || null, url: v.profileUrl, page: `/locaties/${v.slug}/` }])),
  suppliers: Object.fromEntries(data.suppliers.map((s) => [s.id, { name: s.name, role: s.label || s.category || '', url: s.profileUrl, page: `/leveranciers/${s.slug}/` }])),
}));
write('account/index.html', renderAccount(data));
// Zoekindex (alleen gepubliceerde concepten en aangesloten partners).
// Kleine afbeelding en één regel uitleg per resultaat.
const smallImg = (src) => (src || '').replace('/assets/img/hero-event.webp', '/assets/img/hero-event-800.webp').replace('/assets/img/festival-event.webp', '/assets/img/festival-event-640.webp');
const oneLine = (t = '') => { const x = String(t).replace(/\s+/g, ' ').trim(); return x.length > 140 ? `${x.slice(0, 137).replace(/\s+\S*$/, '')}…` : x; };
write('data/search.json', JSON.stringify([
  ...data.concepts.map((c) => ({ t: 'concept', title: c.title, url: `/eventconcepten/${c.slug}/`, sub: `${c.categoryLabel} / ${c.dayPartLabel}`, min: c.guestCountMin, max: c.guestCountMax,
    img: smallImg(c.hero.src), why: oneLine(c.teaser || c.proposition), illustrative: true,
    text: [c.teaser, c.format, c.categoryLabel, c.dayPartLabel, c.duration, ...(c.tags || []), ...(c.audiences || []), ...c.feelings.map((f) => data.feelingLabels[f]), ...(c.occasions || []), c.category, c.dayPart].join(' ') })),
  ...data.venues.map((v) => ({ t: 'locatie', title: v.name, url: `/locaties/${v.slug}/`, sub: `${v.city}${v.capacityMax ? ` / tot ${v.capacityMax} gasten` : ''}`,
    img: v.image.kind === 'none' ? null : v.image.src, why: oneLine(v.line), place: `${v.city} ${v.province || ''}`, min: v.capacityMin || null, max: v.capacityMax || null,
    text: [v.label, v.type, v.sfeer, v.line, v.tagline, ...(v.sfeerTags || []), ...(v.bijeenkomstTypes || []), ...(v.eventTypes || []), ...(v.character || []), ...(v.concepts || []).map((c) => c.title || c)].join(' ') })),
  ...data.suppliers.map((s) => ({ t: 'maker', title: s.name, url: `/leveranciers/${s.slug}/`, sub: s.label || s.category, symbol: s.symbol || '✳', why: oneLine(s.tagline), place: s.city || '', text: [s.label, s.category, s.tagline].join(' ') })),
]));
write('zoeken/index.html', renderSearch(data));
write('aanmelden/index.html', renderRegister(data));
write('en/index.html', renderEnHome(data));
write('en/concepts/index.html', renderEnConcepts(data));
write('maker/index.html', renderMaker(data));
write('presentatie/index.html', renderPresentation(data));
data.concepts.forEach((c) => write(`eventconcepten/${c.slug}/conceptplan/index.html`, renderPlanDocument(data, c)));

// Oude prototype-URL's blijven werken; het prototype zelf staat ter vergelijking onder /prototype/.
write('hupr.html', renderLegacy({ to: '/', title: 'Top Locaties' }));
write('locaties.html', renderLegacy({ to: '/locaties/', title: 'Locaties — Top Locaties' }));
write('concept.html', renderLegacy({ to: '/eventconcepten/festival/', title: 'Eventconcept — Top Locaties', conceptMap: data.concepts.map((c) => c.slug) }));
write('404.html', renderNotFound());
copy('dist', 'prototype');
write('prototype/robots-note.txt', 'Prototype ter ontwerpvergelijking; niet indexeren.\n');

// Levende styleguide, met paden herschreven naar de gebouwde site.
const guide = fs.readFileSync(path.join(root, 'design-system/styleguide.html'), 'utf8')
  .replace('href="tokens.css"', 'href="/assets/css/tokens.css"')
  .replace('href="components.css"', 'href="/assets/css/components.css"')
  .replace(/\.\.\/dist\/hupr\.html/g, '/')
  .replace(/\.\.\/dist\/concept\.html\?concept=(\w+)/g, '/eventconcepten/$1/')
  .replace('../dist/concept.html?concept=${c.slug}', '/eventconcepten/${c.slug}/')
  .replace(/\.\.\/dist\/locaties\.html/g, '/locaties/')
  .replace(/\.\.\/dist\/([\w-]+\.webp)/g, '/assets/img/$1')
  .replace('<meta name="viewport"', '<meta name="robots" content="noindex">\n  <meta name="viewport"');
write('styleguide/index.html', guide);
copy('design-system/STYLE-GUIDE.md', 'styleguide/STYLE-GUIDE.md');

// Sitemap: uitsluitend gepubliceerde concepten en AANGESLOTEN partnerlocaties (data.venues is al partner-only).
const urls = ['/', '/eventconcepten/', '/eventconcepten/op-gevoel/', '/locaties/', '/leveranciers/', '/over/', '/zelf-organiseren/', '/conceptplan/', '/zoeken/', '/docs/api/', '/en/', '/en/concepts/',
  ...data.concepts.map((c) => `/eventconcepten/${c.slug}/`),
  ...data.venues.map((v) => `/locaties/${v.slug}/`),
  ...data.suppliers.map((s) => `/leveranciers/${s.slug}/`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>https://top-locaties.nl${u}</loc></url>`).join('\n')}\n</urlset>\n`);
// Content Signals (contentsignals.org): wel zoeken en citeren/samenvatten in AI-antwoorden (met link), geen modeltraining.
write('robots.txt', 'User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no\nAllow: /\nDisallow: /prototype/\nDisallow: /styleguide/\n\nSitemap: https://top-locaties.nl/sitemap.xml\nAgentmap: https://top-locaties.nl/.well-known/ai-catalog.json\n');

// Ontdekbestanden voor AI-agents (beschrijven alleen wat echt bestaat).
write('docs/api/index.html', renderApiDocs(data));
write('openapi.json', JSON.stringify(openApi(data), null, 2));
write('.well-known/api-catalog', JSON.stringify(apiCatalog(), null, 2));
const skill = skillMd(data);
write('.well-known/agent-skills/top-locaties/SKILL.md', skill);
write('.well-known/agent-skills/index.json', JSON.stringify(skillsIndex(skill), null, 2));
write('.well-known/ai-catalog.json', JSON.stringify(aiCatalog(data), null, 2));

// Pijlen en sterretjes altijd als tekstteken, nooit als emoji (iOS valt anders terug op het emojifont).
// U+FE0E = tekstpresentatie. Het prototype in /prototype/ blijft ongemoeid.
const htmlProblems = [];
const TEXT_GLYPHS = /([↖↗↘↙↔↕✳▶])(?!︎)/g;
(function textGlyphs(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (f !== path.join(out, 'prototype')) textGlyphs(f); continue; }
    if (!/\.(html|js|css)$/.test(e.name)) continue;
    const src = fs.readFileSync(f, 'utf8');
    let next = src.replace(TEXT_GLYPHS, '$1︎');
    // Kleinere varianten van de twee sfeerbeelden voor mobiel (srcset), alleen in HTML.
    if (e.name.endsWith('.html')) next = next.replace(/<img((?:(?!srcset)[^>])*?) src="\/assets\/img\/(hero-event|festival-event)\.webp"/g, (m, attrs, n) => { const w = n === 'hero-event' ? [800, 1672] : [640, 1122]; return `<img${attrs} src="/assets/img/${n}.webp" srcset="/assets/img/${n}-${w[0]}.webp ${w[0]}w, /assets/img/${n}.webp ${w[1]}w" sizes="(max-width: 800px) 100vw, 50vw"`; });
    if (e.name.endsWith('.html')) {
      // Spatie vóór elke regelafbreking: koppen als "NEEM<br>CONTACT OP" lezen anders als "NEEMCONTACT OP" (schermlezers, zoekmachines, kopiëren).
      next = next.replace(/(\S)<br>/g, '$1 <br>');
      // Lege koppen zijn nooit toegestaan (toegankelijkheid en SEO).
      if (/<h[1-6][^>]*>\s*<\/h[1-6]>/.test(next)) htmlProblems.push(`Lege kop in ${path.relative(out, f)}`);
    }
    if (next !== src) fs.writeFileSync(f, next);
  }
})(out);
if (htmlProblems.length) { console.error(htmlProblems.join("\n")); process.exit(1); }

// Markdown voor agents: naast elke publieke index.html een index.md (geserveerd bij Accept: text/markdown).
const mdTokens = {};
(function markdown(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    const rel = path.relative(out, f);
    if (e.isDirectory()) { if (!/^(prototype|styleguide|admin|assets|data|\.well-known)$/.test(rel)) markdown(f); continue; }
    if (e.name !== 'index.html') continue;
    const html = fs.readFileSync(f, 'utf8');
    if (/<meta name="robots" content="noindex">/.test(html) || !/<main\b/.test(html)) continue;
    const pagePath = `/${path.dirname(rel) === '.' ? '' : `${path.dirname(rel).split(path.sep).join('/')}/`}`;
    const md = htmlToMarkdown(html, { path: pagePath });
    fs.writeFileSync(path.join(dir, 'index.md'), md);
    mdTokens[pagePath] = estimateTokens(md);
  }
})(out);

fs.writeFileSync(path.join(out, 'build-info.json'), JSON.stringify({ builtAt: new Date().toISOString(), pages: urls.length, partnerVenues: data.venues.length, suppliers: data.suppliers.length, concepts: data.concepts.length, syncedAt: data.snapshotMeta.syncedAt }, null, 2));
console.log(`TOP LOCATIES BUILD / ${urls.length} pagina's → site/ (bronstand Greenbookings ${data.syncedDate})`);
