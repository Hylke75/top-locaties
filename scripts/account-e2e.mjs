// E2E voor accounts, conceptmaker, presentatie en downloads, met een gesimuleerde Supabase (Auth + PostgREST + RLS per gebruiker).
// Draait tegen de lokale build (npm run serve). Raakt de echte database niet.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.env.BASE_URL || 'http://localhost:4173';
const site = JSON.parse(fs.readFileSync(new URL('../src/content/site.json', import.meta.url)));
const SB = site.accounts.url;
let failed = 0;
const check = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FOUT'} ${label}`); if (!ok) failed++; };

// ---- Gesimuleerde Supabase ----
const users = new Map(); // email -> { id, password }
const tokens = new Map(); // token -> userId
const rows = []; // { id, user_id, base_slug, title, data, updated_at, share_token }
const members = []; // { concept_id, email, role }
const versions = []; // { id, concept_id, title, data, saved_by_email, created_at }
let n = 0;
const json = (route, status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
const issue = (u) => { const t = `tok-${++n}`; tokens.set(t, u.id); return { access_token: t, refresh_token: `ref-${t}`, expires_in: 3600, user: { id: u.id, email: u.email } }; };
async function supabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  const body = req.postData() ? JSON.parse(req.postData()) : null;
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  if (req.headers().apikey !== site.accounts.publishableKey) return json(route, 401, { message: 'No API key' });
  const uid = tokens.get((req.headers().authorization || '').replace('Bearer ', ''));
  if (url.pathname === '/auth/v1/signup') {
    if (users.has(body.email)) return json(route, 422, { msg: 'User already registered' });
    const u = { id: `u${users.size + 1}`, email: body.email, password: body.password }; users.set(body.email, u);
    return json(route, 200, issue(u));
  }
  if (url.pathname === '/auth/v1/token') {
    const u = users.get(body.email);
    if (!u || u.password !== body.password) return json(route, 400, { error_description: 'Invalid login credentials' });
    return json(route, 200, issue(u));
  }
  if (url.pathname === '/auth/v1/logout') return json(route, 204, {});
  const email = [...users.values()].find((u) => u.id === uid)?.email;
  const roleOf = (r) => (r.user_id === uid ? 'owner' : members.find((m) => m.concept_id === r.id && m.email === email)?.role);
  if (url.pathname === '/rest/v1/rpc/shared_concept') {
    const r = rows.find((x) => x.share_token && x.share_token === body?.token);
    return json(route, 200, r ? [{ title: r.title, base_slug: r.base_slug, data: r.data, updated_at: r.updated_at }] : []);
  }
  if (!uid) return json(route, 401, { message: 'JWT required' });
  if (url.pathname === '/rest/v1/concept_members') {
    const cid = url.searchParams.get('concept_id')?.replace('eq.', '');
    if (req.method() === 'GET') {
      const em = url.searchParams.get('email')?.replace('eq.', '');
      return json(route, 200, members.filter((m) => (!cid || m.concept_id === cid) && (!em || m.email === em) && (roleOf(rows.find((r) => r.id === m.concept_id) || {}) || m.email === email)));
    }
    if (req.method() === 'POST') { const r = rows.find((x) => x.id === body.concept_id); if (!r || r.user_id !== uid) return json(route, 403, { message: 'new row violates row-level security policy' }); members.push({ ...body, created_at: new Date().toISOString() }); return json(route, 201, {}); }
    if (req.method() === 'DELETE') { const em = url.searchParams.get('email')?.replace('eq.', ''); const i = members.findIndex((m) => m.concept_id === cid && m.email === em); if (i >= 0) members.splice(i, 1); return json(route, 204, {}); }
  }
  if (url.pathname === '/rest/v1/user_concept_versions') {
    const vid = url.searchParams.get('id')?.replace('eq.', '');
    if (vid) { const v = versions.find((x) => String(x.id) === vid); return v && roleOf(rows.find((r) => r.id === v.concept_id)) ? json(route, 200, v) : json(route, 406, {}); }
    const cid = url.searchParams.get('concept_id')?.replace('eq.', '');
    return json(route, 200, versions.filter((v) => v.concept_id === cid && roleOf(rows.find((r) => r.id === cid))).slice().reverse());
  }
  if (url.pathname.startsWith('/rest/v1/user_concepts')) {
    const idEq = url.searchParams.get('id')?.replace('eq.', '');
    const visible = rows.filter((r) => roleOf(r)); // RLS: eigenaar of lid
    if (req.method() === 'GET') {
      if (idEq) { const r = visible.find((x) => x.id === idEq); return r ? json(route, 200, r) : json(route, 406, { message: 'not found' }); }
      return json(route, 200, visible.map(({ id, title, base_slug, updated_at, user_id }) => ({ id, title, base_slug, updated_at, user_id })));
    }
    if (req.method() === 'POST') { const r = { id: `c${rows.length + 1}`, user_id: uid, share_token: null, ...body, updated_at: new Date(Date.now() + rows.length).toISOString() }; rows.push(r); return json(route, 201, [r]); }
    const r = visible.find((x) => x.id === idEq);
    if (req.method() === 'PATCH') {
      if (!r || !['owner', 'editor'].includes(roleOf(r))) return json(route, 200, []);
      const guard = url.searchParams.get('updated_at')?.replace('eq.', '');
      if (guard && guard !== r.updated_at) return json(route, 200, []); // conflict: 0 rijen
      if ('share_token' in body && body.share_token !== r.share_token && r.user_id !== uid) return json(route, 400, { message: 'Alleen de eigenaar kan de deellink wijzigen.' });
      if (body.data && JSON.stringify(body.data) !== JSON.stringify(r.data)) versions.push({ id: versions.length + 1, concept_id: r.id, title: r.title, data: JSON.parse(JSON.stringify(r.data)), saved_by_email: email, created_at: new Date().toISOString() });
      Object.assign(r, body, { updated_at: new Date(Date.now() + versions.length + 1).toISOString() });
      return json(route, 200, [r]);
    }
    if (req.method() === 'DELETE') { if (r && r.user_id === uid) rows.splice(rows.indexOf(r), 1); return json(route, 204, {}); }
  }
  return json(route, 404, { message: 'unknown' });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
await ctx.route(`${SB}/**`, supabase);
await ctx.addInitScript(() => { try { localStorage.setItem('tl-accounts-preview', '1'); } catch {} }); // voorvertoning (accounts kunnen site-breed uit staan)
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept());

// 1. Conceptmaker zonder account → registreren gevraagd
await page.goto(base + '/maker/?basis=kick-off');
await page.waitForSelector('[data-maker-gate]:not([hidden])');
check((await page.textContent('[data-maker-gate]')).includes('REGISTREER'), 'conceptmaker vraagt eerst om registratie');
check(await page.isHidden('[data-maker-form]'), 'zonder account geen bewerkformulier');

// 2. Registreren en terug naar de maker
await page.click('[data-maker-gate] a.tl-button--accent');
await page.waitForSelector('[data-auth-tab="register"][aria-pressed="true"]');
await page.fill('[name=email]', 'test@voorbeeld.nl');
await page.fill('[name=password]', 'kort');
await page.click('[data-auth-submit]');
check((await page.textContent('[data-auth-status]')).includes('8 tekens'), 'validatie: wachtwoord te kort');
await page.fill('[name=password]', 'lang-genoeg-123');
await page.click('[data-auth-submit]');
check((await page.textContent('[data-auth-status]')).includes('akkoord'), 'validatie: toestemming nodig');
await page.check('[name=consent]');
await page.click('[data-auth-submit]');
await page.waitForURL('**/maker/?basis=kick-off');
await page.waitForSelector('[data-maker-form]:not([hidden])');
check(await page.inputValue('[data-path="title"]') === 'De kick-off (mijn versie)', 'maker start met het standaardconcept als basis');
check(await page.locator('[data-list="program"] [data-row]').count() >= 4, 'programma van de basis staat in de maker');

// 3. Bewerken: titel, programma-onderdeel toevoegen, verplaatsen, details, locatie
await page.fill('[data-path="title"]', 'Kick-off Bureau Noord 2027');
await page.fill('[data-path="guests"]', '120');
const before = await page.locator('[data-list="program"] [data-row]').count();
await page.click('[data-add="program"]');
await page.fill(`[data-path="program.${before}.time"]`, '13:15');
await page.fill(`[data-path="program.${before}.title"]`, 'Welkom door de directeur');
await page.fill(`[data-path="program.${before}.description"]`, 'Vijf minuten, zonder slides.');
await page.locator(`[data-list="program"] [data-row="${before}"] .tl-maker__more summary`).click();
await page.fill(`[data-path="program.${before}.details.why"]`, 'Iedereen hoort het van de baas zelf.');
await page.click('[data-sort="program"]');
const titles = await page.$$eval('[data-list="program"] [data-path$=".title"]', (els) => els.map((e) => e.value));
check(titles[1] === 'Welkom door de directeur', 'nieuw onderdeel toegevoegd en op tijd gesorteerd');
await page.locator('[data-list="program"] [data-row="1"] [data-move="-1"]').click();
check((await page.inputValue('[data-path="program.0.title"]')) === 'Welkom door de directeur', 'onderdeel omhoog verplaatst');
await page.locator('[data-list="runbook"] [data-row="0"] [data-remove]').click();
await page.selectOption('[data-add-venue]', { index: 1 });
check(await page.locator('[data-chosen-venues] li [data-unvenue]').count() >= 1, 'locatie toegevoegd (alleen partners in de keuzelijst)');
await page.fill('[data-path="program.1.time"]', '1u30');
await page.click('[data-maker-save]');
check((await page.textContent('[data-maker-errors]')).includes('UU:MM'), 'controle: ongeldige tijd blokkeert opslaan');
await page.fill('[data-path="program.1.time"]', '13:30');
await page.click('[data-maker-save]');
await page.waitForFunction(() => document.querySelector('[data-maker-status]').textContent.includes('OPGESLAGEN ✓'));
check(/\/maker\/\?id=c1$/.test(page.url()) && rows.length === 1 && rows[0].title === 'Kick-off Bureau Noord 2027', 'concept opgeslagen in het account');
check(rows[0].data.program[0].details.why === 'Iedereen hoort het van de baas zelf.', 'details van het onderdeel opgeslagen');

// 4. Automatisch opslaan na eerste keer
await page.fill('[data-path="notes"]', 'Bel de locatie over parkeren.');
await page.waitForFunction(() => document.querySelector('[data-maker-status]').textContent.includes('OPGESLAGEN ✓'), null, { timeout: 8000 });
check(rows[0].data.notes === 'Bel de locatie over parkeren.', 'wijzigingen worden automatisch opgeslagen');

// 5. Downloads: Word (.docx) en tekst
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-'));
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-maker-bar] [data-export="docx"]')]);
const docx = path.join(tmp, dl.suggestedFilename()); await dl.saveAs(docx);
let docOk = false;
try { const xml = execFileSync('unzip', ['-p', docx, 'word/document.xml']).toString(); docOk = xml.includes('Kick-off Bureau Noord 2027') && xml.includes('Welkom door de directeur'); } catch {}
check(dl.suggestedFilename() === 'kick-off-bureau-noord-2027.docx' && docOk, 'Word-download is een geldige .docx met de eigen inhoud');
const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('[data-maker-bar] [data-export="txt"]')]);
const txt = fs.readFileSync(await dl2.path(), 'utf8');
check(txt.includes('KICK-OFF BUREAU NOORD 2027') && txt.includes('Bel de locatie over parkeren.'), 'tekstdownload bevat het complete concept');

// 6. Presentatie (liggend) en PDF
await page.click('[data-maker-deck]');
await page.waitForSelector('.tl-slide');
const slides = await page.locator('.tl-slide').count();
check(slides >= 12, `presentatie met ${slides} dia's`);
check((await page.textContent('.tl-slide--cover')).includes('KICK-OFF BUREAU NOORD 2027'.toUpperCase()) || (await page.textContent('.tl-slide--cover')).includes('Kick-off Bureau Noord 2027'), 'presentatie toont het eigen concept');
const box = await page.locator('.tl-slide').first().boundingBox();
check(Math.abs(box.width / box.height - 16 / 9) < 0.02, 'dia is liggend 16:9');
const pdf = path.join(tmp, 'deck.pdf');
await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true });
const info = execFileSync('pdfinfo', [pdf]).toString();
const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1]);
const size = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(info);
check(pages === slides && size && Number(size[1]) > Number(size[2]), `PDF: ${pages} liggende pagina's (${size?.[1]}×${size?.[2]} pt)`);

// 6b. Delen, samenwerken, versies en dupliceren
await page.goto(base + '/maker/?id=c1');
await page.waitForSelector('[data-maker-collab]:not([hidden]) [data-share-on]');
await page.click('[data-share-on]');
await page.waitForSelector('[data-share-link]');
const shareUrl = await page.inputValue('[data-share-link]');
check(/\/presentatie\/\?t=[A-Za-z0-9_-]{24,}$/.test(shareUrl), 'deellink gemaakt');
const anonCtx = await browser.newContext(); await anonCtx.route(`${SB}/**`, supabase);
const anon = await anonCtx.newPage();
await anon.goto(shareUrl.replace(/^https?:\/\/[^/]+/, base));
await anon.waitForSelector('.tl-slide');
check((await anon.textContent('.tl-slide--cover')).includes('Kick-off Bureau Noord 2027'), 'deellink werkt zonder account (alleen lezen)');
await anon.goto(base + '/presentatie/?t=bestaat-niet-bestaat-niet-12345');
await anon.waitForSelector('.tl-state');
check((await anon.textContent('.tl-state')).includes('bestaat niet'), 'onjuiste deellink geeft een nette melding');
await anonCtx.close();
await page.fill('[data-invite] [name=email]', 'collega@voorbeeld.nl');
await page.selectOption('[data-invite] [name=role]', 'editor');
await page.click('[data-invite] button[type=submit]');
await page.waitForFunction(() => document.querySelector('[data-maker-collab]').textContent.includes('collega@voorbeeld.nl'));
check(members.length === 1 && members[0].role === 'editor', 'collega uitgenodigd als redacteur');
check(await page.locator('[data-restore]').count() >= 1, 'versiegeschiedenis toont eerdere versies');
await page.locator('[data-restore]').last().click();
await page.waitForFunction(() => document.querySelector('[data-maker-status]').textContent.includes('HERSTELD'));
check(rows[0].data.notes !== 'Bel de locatie over parkeren.', 'oudere versie hersteld');
await page.click('[data-duplicate]');
await page.waitForURL('**/maker/?id=c2');
await page.waitForSelector('[data-maker-form]:not([hidden])');
check(rows.length === 2 && rows[1].title.endsWith('(variant)'), 'concept gedupliceerd als variant');
// conflict: iemand anders slaat intussen op
await page.goto(base + '/maker/?id=c1');
await page.waitForSelector('[data-maker-form]:not([hidden])');
rows[0].updated_at = new Date(Date.now() + 99999).toISOString();
await page.fill('[data-path="organisatie"]', 'Bureau Noord');
await page.click('[data-maker-save]');
await page.waitForSelector('[data-reload]');
check((await page.textContent('[data-maker-errors]')).includes('intussen opgeslagen'), 'conflict bij gelijktijdig bewerken wordt gemeld (niets overschreven)');
page.removeAllListeners('dialog'); page.on('dialog', (d) => d.accept());

// 7. Mijn concepten, uitloggen, privé
await page.goto(base + '/account/');
await page.waitForSelector('[data-my-item]');
check(await page.locator('[data-my-item]').count() === 2, 'Mijn concepten toont het concept en de variant');
await page.click('[data-sign-out]');
await page.goto(base + '/presentatie/?id=c1');
await page.waitForSelector('.tl-state');
check((await page.textContent('.tl-state')).includes('LOG IN'), 'eigen presentatie is privé na uitloggen');

// 8. Tweede gebruiker ziet het concept niet (RLS)
await page.goto(base + '/account/?stap=registreren');
await page.fill('[name=email]', 'ander@voorbeeld.nl'); await page.fill('[name=password]', 'ander-wachtwoord'); await page.check('[name=consent]');
await page.click('[data-auth-submit]');
await page.waitForSelector('[data-my-list] .tl-state--empty');
check(true, 'andere gebruiker ziet geen concepten van een ander');
await page.goto(base + '/maker/?id=c1');
await page.waitForSelector('[data-maker-gate]:not([hidden])');
check((await page.textContent('[data-maker-gate]')).includes('NIET GELADEN'), 'concept van een ander openen faalt netjes');

// 8b. Uitgenodigde collega registreert met hetzelfde e-mailadres en bewerkt mee
await page.goto(base + '/account/');
await page.click('[data-sign-out]');
await page.goto(base + '/account/?stap=registreren');
await page.fill('[name=email]', 'collega@voorbeeld.nl'); await page.fill('[name=password]', 'collega-wachtwoord'); await page.check('[name=consent]');
await page.click('[data-auth-submit]');
await page.waitForSelector('[data-my-item]');
check((await page.textContent('[data-my-list]')).includes('GEDEELD MET JOU (REDACTEUR)'), 'collega ziet het gedeelde concept');
check(await page.locator('[data-my-item] [data-delete]').count() === 0, 'collega kan het concept niet verwijderen');
await page.goto(base + '/maker/?id=c1');
await page.waitForSelector('[data-maker-form]:not([hidden])');
await page.fill('[data-path="notes"]', 'Aangevuld door collega.');
await page.click('[data-maker-save]');
await page.waitForFunction(() => document.querySelector('[data-maker-status]').textContent.includes('OPGESLAGEN ✓'));
check(rows[0].data.notes === 'Aangevuld door collega.', 'redacteur kan meebewerken');
check(await page.locator('[data-share-on]').count() === 0 && await page.locator('[data-invite]').count() === 0, 'redacteur beheert geen deellink en leden');

// 9. Standaardconcept: presentatie en downloads zonder account
await page.goto(base + '/eventconcepten/diner/');
const [dl3] = await Promise.all([page.waitForEvent('download'), page.click('[data-concept-tools] [data-download="docx"]')]);
check(dl3.suggestedFilename() === 'het-diner-dat-verbindt.docx', 'standaardconcept downloadbaar als Word');
await page.click('[data-concept-tools] a[href^="/presentatie/"]');
await page.waitForSelector('.tl-slide');
check(await page.locator('.tl-slide').count() >= 12, 'standaardconcept als presentatie');
check(errors.length === 0, `geen JS-fouten (${errors.join(' | ')})`);

await browser.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(failed ? `${failed} accountcontroles mislukt` : 'Alle accountcontroles geslaagd');
process.exit(failed ? 1 : 0);
