// Maakt deelafbeeldingen (1200×630, JPEG) per concept en één algemene, in de huisstijl.
// Draai lokaal na het toevoegen van concepten: node scripts/og-images.mjs (vereist de lokale build en Playwright).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const out = path.join(root, 'src/assets/og');
fs.mkdirSync(out, { recursive: true });
const concepts = JSON.parse(fs.readFileSync(path.join(root, 'src/content/concepts.json'), 'utf8')).concepts.filter((c) => c.status === 'published');
const feelings = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, 'src/content/feelings.json'), 'utf8')).feelings.map((f) => [f.id, f.label]));
const base = process.env.BASE_URL || 'http://localhost:4173'; // lokale build (npm run serve)
const fontCss = fs.readFileSync(path.join(root, 'design-system/fonts.css'), 'utf8').replace(/url\(\/assets\/fonts\//g, `url(${base}/assets/fonts/`);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const lines = (arr) => arr.map((l) => esc(l).replace(/\*(.+?)\*/g, '<span style="color:#F45269">$1</span>')).join('<br>');
const card = ({ kicker, headline, sub, img }) => `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:#292A2C;color:#fff;font-family:'DM Sans';display:grid;grid-template-columns:690px 510px;overflow:hidden}
.l{padding:56px 56px 48px;display:flex;flex-direction:column;justify-content:space-between}.k{font:400 17px 'DM Mono';letter-spacing:.02em;text-transform:uppercase;border-bottom:1px solid #5a5b5d;padding-bottom:14px}
h1{font:400 78px/.88 'Archivo Black';letter-spacing:-.065em;text-transform:uppercase}.s{font:400 17px/1.5 'DM Mono';text-transform:uppercase}.b{font:400 30px/.9 'Archivo Black';letter-spacing:-.07em}
.r{position:relative;background:#D9C9BF url('${img}') center/cover}.r span{position:absolute;left:18px;bottom:18px;background:#fff;color:#292A2C;font:400 13px 'DM Mono';padding:6px 9px}</style></head>
<body><div class="l"><div class="k">${esc(kicker)}</div><h1>${headline}</h1><div><div class="s">${esc(sub)}</div><div class="b" style="margin-top:18px">TOP LOCATIES <span style="color:#F45269">✳︎</span></div></div></div><div class="r"><span>SFEERBEELD TER ILLUSTRATIE</span></div></body></html>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${base}/404.html`).catch(() => {}); // zelfde herkomst voor fonts en beelden
const shot = async (name, html) => { await page.setContent(html, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 82 }); };
await shot('default', card({ kicker: 'EVENTCONCEPTEN × LOCATIES × MAKERS', headline: lines(['BUITENGEWOON', '*SAMEN.*']), sub: 'Begin bij het gevoel dat je wilt achterlaten', img: `${base}/assets/img/hero-event.webp` }));
for (const c of concepts) await shot(c.slug, card({ kicker: `${c.categoryLabel} / ${c.format}`, headline: lines(c.headline), sub: `${c.feelings.map((f) => feelings[f]).join(' + ')} / ${c.guestCountMin}–${c.guestCountMax} gasten`, img: `${base}${c.hero.src}` }));
await browser.close();
console.log(`OG-afbeeldingen: ${concepts.length + 1} → src/assets/og/`);
