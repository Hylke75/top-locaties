// /maker/: eventconceptmaker. Basis = een standaardconcept; alles aan te passen; bewaard in het account.
import * as A from './lib/account.js';
import { readData } from './lib/store.js';
import { partners, baseConcept, esc } from './lib/conceptdata.js';
import { fromBase, merge, check, byTime, startTime, fitTo, applyAnswers, costsFrom, costTotals, euro, COST_STATUS, STAGES, setStage } from './lib/userconcept.js';
import { naturalEnd, tailor, quoteRequests } from './lib/tailor.js';
import { sendQuotes, slugFromProfile, quoteResultText } from './lib/quote-send.js';
const openedAt = Date.now();
import { load } from './lib/store.js';
import { exportConcept } from './lib/export-actions.js';
import { track } from './lib/track.js';

const cfg = readData();
A.configure(cfg.accounts);
const $ = (s) => document.querySelector(s);
const form = $('[data-maker-form]');
const statusEl = $('[data-maker-status]');
const params = new URLSearchParams(location.search);
let P = null; let base = null; let data = null; let id = params.get('id'); let dirty = false; let saving = false; let timer = null;
let row = null; let me = null; let role = 'owner'; // owner | editor | viewer

/* ---------- Velddefinities ---------- */
const LISTS = {
  program: { label: 'Onderdeel', add: 'ONDERDEEL TOEVOEGEN +', sortable: true, fields: [['time', 'Tijd', 'time'], ['title', 'Onderdeel'], ['description', 'Korte omschrijving', 'area']],
    details: [['intro', 'Wat gebeurt er', 'area'], ['why', 'Waarom', 'area'], ['result', 'Resultaat', 'area'], ['steps', 'Zo pak je het aan (één stap per regel)', 'lines'], ['roles', 'Wie (komma-gescheiden)', 'csv'], ['needs', 'Nodig (komma-gescheiden)', 'csv'], ['tip', 'Tip', 'area']] },
  runbook: { label: 'Regel', add: 'REGEL TOEVOEGEN +', sortable: true, fields: [['time', 'Tijd', 'time'], ['duration', 'Duur'], ['title', 'Onderdeel'], ['description', 'Beschrijving', 'area'], ['owner', 'Wie'], ['space', 'Waar']] },
  'catering.moments': { label: 'Moment', add: 'MOMENT TOEVOEGEN +', fields: [['moment', 'Moment'], ['time', 'Tijd', 'time'], ['proposal', 'Voorstel', 'area'], ['format', 'Serveervorm'], ['dietary', 'Dieet']] },
  entertainment: { label: 'Onderdeel', add: 'ENTERTAINMENT TOEVOEGEN +', fields: [['moment', 'Moment'], ['option', 'Wat'], ['format', 'Vorm / duur'], ['why', 'Waarom', 'area']] },
  communication: { label: 'Moment', add: 'MOMENT TOEVOEGEN +', fields: [['when', 'Wanneer'], ['channel', 'Kanaal'], ['message', 'Boodschap', 'area']] },
  risks: { label: 'Risico', add: 'RISICO TOEVOEGEN +', fields: [['risk', 'Risico'], ['mitigation', 'Plan B', 'area']] },
  kpis: { label: 'KPI', add: 'KPI TOEVOEGEN +', fields: [['goal', 'Doel'], ['kpi', 'KPI'], ['when', 'Wanneer'], ['how', 'Meten']] },
};
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const setPath = (obj, path, v) => { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); o[ks.at(-1)] = v; };
const toVal = (kind, v) => (kind === 'lines' ? (v || []).join('\n') : kind === 'csv' ? (v || []).join(', ') : v ?? '');
const fromVal = (kind, v) => (kind === 'lines' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : kind === 'csv' ? v.split(',').map((x) => x.trim()).filter(Boolean) : kind === 'number' ? (v === '' ? null : Number(v)) : v);

const input = (path, label, kind = '', value = '') => {
  const v = esc(toVal(kind, value));
  const ctl = kind === 'area' || kind === 'lines'
    ? `<textarea data-path="${esc(path)}" data-kind="${kind}" rows="${kind === 'lines' ? 4 : 2}">${v}</textarea>`
    : `<input data-path="${esc(path)}" data-kind="${kind}" ${kind === 'time' ? 'inputmode="numeric" placeholder="UU:MM" maxlength="5"' : ''}${kind === 'number' ? 'type="number" min="1" max="10000" inputmode="numeric"' : ''}${kind === 'date' ? 'type="date"' : ''} value="${v}">`;
  return `<label class="tl-field"><span>${esc(label)}</span>${ctl}</label>`;
};

function listHtml(key) {
  const spec = LISTS[key];
  const items = getPath(data, key) || [];
  return `<div class="tl-maker__list" data-list="${key}">${items.map((it, i) => `<div class="tl-maker__row" data-row="${i}">
    <div class="tl-maker__rowhead"><span class="tl-mono">${String(i + 1).padStart(2, '0')} / ${esc(spec.label.toUpperCase())}</span>
      <span class="tl-chip-set"><button class="tl-maker__icon" type="button" data-move="-1" aria-label="${esc(spec.label)} ${i + 1} omhoog" ${i === 0 ? 'disabled' : ''}>↑</button><button class="tl-maker__icon" type="button" data-move="1" aria-label="${esc(spec.label)} ${i + 1} omlaag" ${i === items.length - 1 ? 'disabled' : ''}>↓</button><button class="tl-maker__icon" type="button" data-remove aria-label="${esc(spec.label)} ${i + 1} verwijderen">×</button></span></div>
    <div class="tl-maker__fields">${spec.fields.map(([f, l, k]) => input(`${key}.${i}.${f}`, l, k, it[f])).join('')}</div>
    ${spec.details ? `<details class="tl-maker__more"${it.__open ? ' open' : ''}><summary class="tl-mono">DETAILS VAN DIT ONDERDEEL (POP-UP OP DE SITE, PRESENTATIE, WORD)</summary><div class="tl-maker__fields">${spec.details.map(([f, l, k]) => input(`${key}.${i}.details.${f}`, l, k, it.details?.[f])).join('')}</div></details>` : ''}
  </div>`).join('')}</div>
  <div class="tl-chip-set"><button class="tl-button tl-button--outline" type="button" data-add="${key}">${spec.add}</button>${spec.sortable ? `<button class="tl-text-button" type="button" data-sort="${key}">SORTEER OP TIJD</button>` : ''}</div>`;
}

function costsHtml() {
  const c = costsFrom(data); const t = costTotals(c);
  return `<div class="tl-maker__costs" data-costs>${c.items.map((it, i) => `<div class="tl-maker__cost">
      <label class="tl-field"><span>KOSTENPOST</span><input data-cost="${i}" data-f="label" value="${esc(it.label)}"></label>
      <label class="tl-field"><span>BEDRAG (EXCL. BTW)</span><input data-cost="${i}" data-f="amount" type="number" min="0" step="50" inputmode="numeric" value="${it.amount ?? ''}"></label>
      <label class="tl-field"><span>STATUS</span><select data-cost="${i}" data-f="status">${Object.entries(COST_STATUS).map(([k, l]) => `<option value="${k}" ${it.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button class="tl-maker__icon" type="button" data-cost-remove="${i}" aria-label="${esc(it.label || 'Kostenpost')} verwijderen">×</button></div>`).join('')}
    <div class="tl-chip-set"><button class="tl-button tl-button--outline" type="button" data-cost-add>KOSTENPOST TOEVOEGEN +</button>
      <label class="tl-field tl-maker__contingency"><span>ONVOORZIEN (%)</span><input data-cost-contingency type="number" min="0" max="50" value="${c.contingency}"></label></div>
    <dl class="tl-facts tl-facts--two" data-cost-totals>${totalsHtml(t)}</dl></div>`;
}
const totalsHtml = (t) => `<div><dt>SUBTOTAAL (${t.filled}/${t.count} INGEVULD)</dt><dd>${euro(t.sub)}</dd></div><div><dt>ONVOORZIEN</dt><dd>${euro(t.extra)}</dd></div><div><dt>TOTAAL EXCL. BTW</dt><dd><strong>${euro(t.total)}</strong></dd></div><div><dt>WAARVAN BEVESTIGD</dt><dd>${euro(t.confirmed)}</dd></div>`;
function syncCosts(mutate) { const c = costsFrom(data); mutate(c); data.costs = c; data.budgetItems = c.items.map((x) => x.label).filter(Boolean); }

function quoteHtml() {
  const vs = (data.venueIds || []).filter((v) => P.venues[v]);
  if (!vs.length || !id) return vs.length ? '<p class="tl-note">Sla je concept eerst op; dan vraag je hier in één keer offertes aan bij je gekozen locaties.</p>' : '';
  return `<div class="tl-maker__quotes" data-quotes><h3 class="tl-mono tl-subhead tl-body--gap">OFFERTES AANVRAGEN — IN ÉÉN KEER</h3>
    <div class="tl-maker__checks">${vs.map((v) => `<label class="tl-check"><input type="checkbox" data-quote-venue="${esc(v)}" ${data.quotes?.[v] ? '' : 'checked'}> ${esc(P.venues[v].name)} <span class="tl-note">${data.quotes?.[v] ? `/ verstuurd op ${esc(new Date(data.quotes[v]).toLocaleDateString('nl-NL'))}` : '/ nog niet verstuurd'}</span></label>`).join('')}</div>
    <div class="tl-maker__fields tl-maker__fields--two"><label class="tl-field"><span>JOUW NAAM</span><input data-quote-name autocomplete="name" value="${esc(data.contactName || '')}"></label><label class="tl-field"><span>JOUW E-MAILADRES</span><input data-quote-email type="email" autocomplete="email" value="${esc(me?.email || '')}"></label></div>
    <label class="tl-check"><input type="checkbox" data-quote-consent> Mijn naam, e-mailadres en de aanvraag worden via Greenbookings gedeeld met de aangevinkte locaties.</label>
    <div class="tl-chip-set tl-body--gap"><button class="tl-button tl-button--accent" type="button" data-quote-send>VERSTUUR AANVRAGEN ↗</button></div>
    <ul class="tl-maker__issues" data-quote-results></ul></div>`;
}

function chooser() {
  const vSel = new Set(data.venueIds || []);
  const sSel = new Set(data.supplierIds || []);
  const venues = Object.entries(P.venues).sort((a, b) => a[1].name.localeCompare(b[1].name, 'nl'));
  return `<div class="tl-maker__fields tl-maker__fields--two">
    <div><h3 class="tl-mono tl-subhead">GEKOZEN LOCATIES (AANGESLOTEN PARTNERS)</h3>
      <ul class="tl-maker__chosen" data-chosen-venues>${[...vSel].filter((v) => P.venues[v]).map((v) => `<li><span>${esc(P.venues[v].name)}, ${esc(P.venues[v].city)} <span class="tl-note">${P.venues[v].capacityMax ? `tot ${P.venues[v].capacityMax} gasten` : 'capaciteit onbekend'}</span></span><button class="tl-maker__icon" type="button" data-unvenue="${esc(v)}" aria-label="${esc(P.venues[v].name)} verwijderen">×</button></li>`).join('') || '<li class="tl-note">Nog geen locatie gekozen.</li>'}</ul>
      <label class="tl-field"><span>LOCATIE TOEVOEGEN</span><select data-add-venue><option value="">Kies een partnerlocatie…</option>${venues.filter(([v]) => !vSel.has(v)).map(([v, x]) => `<option value="${esc(v)}">${esc(x.name)} — ${esc(x.city)}</option>`).join('')}</select></label></div>
    <div><h3 class="tl-mono tl-subhead">MAKERS (LEVERANCIERSPARTNERS)</h3>
      <div class="tl-maker__checks">${Object.entries(P.suppliers).map(([s, x]) => `<label class="tl-check"><input type="checkbox" data-supplier="${esc(s)}" ${sSel.has(s) ? 'checked' : ''}> ${esc(x.name)} <span class="tl-note">/ ${esc(x.role.toLowerCase())}</span></label>`).join('')}</div></div>
  </div>`;
}

function render() {
  const feel = new Set(data.feelings || []);
  form.innerHTML = `
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">01</span> DE KERN</legend>
    <div class="tl-maker__fields tl-maker__fields--two">${input('title', 'Titel van jouw concept', '', data.title)}${input('organisatie', 'Organisatie', '', data.organisatie)}</div>
    <div class="tl-maker__fields">${input('proposition', 'Belofte in één zin', 'area', data.proposition)}${input('objective', 'Wat moet het opleveren?', 'area', data.objective)}</div>
    <div class="tl-maker__fields tl-maker__fields--three">${input('datum', 'Datum', 'date', data.datum)}${input('guests', 'Aantal gasten', 'number', data.guests)}${input('duration', 'Duur en tijden', '', data.duration)}</div>
    <div class="tl-maker__tailor"><label class="tl-field"><span>STARTTIJD</span><input data-start inputmode="numeric" placeholder="UU:MM" maxlength="5" value="${esc(startTime(data) || '')}"></label>
      <label class="tl-field"><span>EINDTIJD</span><input data-end inputmode="numeric" placeholder="UU:MM" maxlength="5" value="${esc(naturalEnd(data.runbook || []) || '')}"></label>
      <button class="tl-button tl-button--outline" type="button" data-shift>PAS TIJDEN AAN ↓</button>
      ${savedPlan()?.answers ? '<button class="tl-text-button" type="button" data-apply-answers>NEEM MIJN ANTWOORDEN UIT DE VRAGENLIJST OVER</button>' : ''}
      <span class="tl-note">Programma, draaiboek en cateringmomenten passen zich samen aan: bij een andere eindtijd worden de onderdelen naar verhouding korter of langer.</span></div>
    <div class="tl-field"><span>GEVOEL DAT GASTEN MEENEMEN (MAX. DRIE)</span><div class="tl-chip-set">${Object.entries(P.feelings).map(([f, l]) => `<button class="tl-chip-button" type="button" data-feel="${esc(f)}" aria-pressed="${feel.has(f)}">${esc(l.toUpperCase())} ${feel.has(f) ? '✓' : '+'}</button>`).join('')}</div></div>
    <div class="tl-maker__fields">${input('audiences', 'Voor wie (één doelgroep per regel)', 'lines', data.audiences)}</div>
  </fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">02</span> HET PROGRAMMA</legend><p class="tl-note">Pas tijden, onderdelen en de details per onderdeel aan. Voeg toe, verwijder of verplaats.</p>${listHtml('program')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">03</span> HET DRAAIBOEK</legend>${listHtml('runbook')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">04</span> CATERING</legend>
    <div class="tl-maker__fields">${input('catering.concept', 'Cateringconcept', 'area', data.catering?.concept)}</div>${listHtml('catering.moments')}
    <div class="tl-maker__fields tl-maker__fields--two">${input('catering.drinks', 'Dranken', 'area', data.catering?.drinks)}${input('catering.notes', 'Notities voor de cateraar', 'area', data.catering?.notes)}</div></fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">05</span> ENTERTAINMENT</legend>${listHtml('entertainment')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">06</span> LOCATIE EN MAKERS</legend>${chooser()}<p class="tl-note">Uitsluitend aangesloten Greenbookings-partners. Beschikbaarheid en prijs vraag je op bij de partner.</p>${quoteHtml()}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">07</span> COMMUNICATIE</legend>${listHtml('communication')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">08</span> KOSTEN, RISICO'S EN IMPACT</legend>
    <h3 class="tl-mono tl-subhead">JOUW KOSTENRAMING</h3>
    <p class="tl-note">Vul bedragen in uit je eigen offertes. Top Locaties noemt geen prijzen; dit is jouw eigen overzicht.</p>
    ${costsHtml()}
    <h3 class="tl-mono tl-subhead">RISICO'S EN PLAN B</h3>${listHtml('risks')}
    <h3 class="tl-mono tl-subhead tl-body--gap">KPI'S</h3>${listHtml('kpis')}
    <div class="tl-maker__fields">${input('notes', 'Eigen notities', 'area', data.notes)}</div></fieldset>`;
  form.hidden = false;
}

const savedPlan = () => (base ? load('tl-plans-v1', {})[base.slug] : null);

/* ---------- Opslaan ---------- */
const clean = (d) => JSON.parse(JSON.stringify(d, (k, v) => (k === '__open' ? undefined : v)));
function setStatus(t) { statusEl.textContent = t; }
function changed() { if (role === 'viewer') return; dirty = true; setStatus('NIET OPGESLAGEN'); if (id) { clearTimeout(timer); timer = setTimeout(save, 2500); } }
async function save() {
  if (saving) return;
  const errs = check(data);
  $('[data-maker-errors]').innerHTML = errs.map((e) => `<li data-level="error">${esc(e)}</li>`).join('');
  if (errs.length) { setStatus('NIET OPGESLAGEN — ZIE DE PUNTEN HIERONDER'); return; }
  saving = true; setStatus('OPSLAAN…');
  try {
    const body = { title: data.title.trim().slice(0, 160), data: clean(data) };
    if (id) row = await A.updateConcept(id, body, row?.updated_at);
    else {
      row = await A.createConcept({ base_slug: base.slug, ...body });
      id = row.id;
      track('save_concept', base.slug);
      renderCollab();
      history.replaceState(null, '', `/maker/?id=${encodeURIComponent(id)}`);
      $('[data-maker-deck]').href = `/presentatie/?id=${encodeURIComponent(id)}`;
      $('[data-maker-deck]').removeAttribute('aria-disabled');
    }
    dirty = false;
    setStatus(`OPGESLAGEN ✓ ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`);
  } catch (e) {
    setStatus(A.message(e).toUpperCase());
    if (e.conflict) { clearTimeout(timer); $('[data-maker-errors]').innerHTML = `<li data-level="error">${esc(A.message(e))} <button class="tl-text-button" type="button" data-reload>LAAD DE NIEUWSTE VERSIE</button></li>`; }
  }
  saving = false;
}
document.addEventListener('click', (e) => { if (e.target.closest('[data-reload]')) { dirty = false; location.reload(); } });

/* ---------- Interactie ---------- */
form.addEventListener('input', (e) => {
  const ce = e.target.closest('[data-cost],[data-cost-contingency]');
  if (ce) {
    syncCosts((c) => { if (ce.hasAttribute('data-cost-contingency')) c.contingency = Math.max(0, Math.min(50, Number(ce.value) || 0)); else { const it = c.items[Number(ce.dataset.cost)]; it[ce.dataset.f] = ce.dataset.f === 'amount' ? (ce.value === '' ? null : Math.max(0, Number(ce.value))) : ce.value; } });
    form.querySelector('[data-cost-totals]').innerHTML = totalsHtml(costTotals(costsFrom(data))); changed(); return;
  }
  const el = e.target.closest('[data-path]');
  if (!el) return;
  setPath(data, el.dataset.path, fromVal(el.dataset.kind, el.value));
  if (el.dataset.path === 'title') $('[data-maker-heading]').textContent = el.value || 'CONCEPTMAKER';
  changed();
});
form.addEventListener('toggle', (e) => { const d = e.target; if (!d.matches?.('.tl-maker__more')) return; const row = d.closest('[data-row]'); const key = d.closest('[data-list]').dataset.list; const it = getPath(data, key)[Number(row.dataset.row)]; if (it) Object.defineProperty(it, '__open', { value: d.open, enumerable: true, configurable: true, writable: true }); }, true);
function rerender(focusSel) { const y = window.scrollY; render(); window.scrollTo(0, y); if (focusSel) form.querySelector(focusSel)?.focus(); }
form.addEventListener('change', (e) => {
  const av = e.target.closest('[data-add-venue]');
  if (av && av.value) { data.venueIds = [...(data.venueIds || []), av.value]; changed(); rerender('[data-add-venue]'); return; }
  const sc = e.target.closest('[data-supplier]');
  if (sc) { const s = new Set(data.supplierIds || []); sc.checked ? s.add(sc.dataset.supplier) : s.delete(sc.dataset.supplier); data.supplierIds = [...s]; changed(); }
});
form.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const listEl = b.closest('[data-list]') || (b.dataset.add || b.dataset.sort ? null : null);
  if (b.dataset.feel) {
    const s = data.feelings || []; const f = b.dataset.feel;
    data.feelings = s.includes(f) ? s.filter((x) => x !== f) : [...s, f].slice(-3);
    changed(); rerender(`[data-feel="${f}"]`); return;
  }
  if (b.hasAttribute('data-shift')) {
    const t = form.querySelector('[data-start]').value.trim(); const e2 = form.querySelector('[data-end]').value.trim();
    if (!/^\d{1,2}:\d{2}$/.test(t) || (e2 && !/^\d{1,2}:\d{2}$/.test(e2))) { setStatus('SCHRIJF START- EN EINDTIJD ALS UU:MM'); return; }
    if (e2 && e2 <= t.padStart(5, '0')) { setStatus('DE EINDTIJD LIGT VÓÓR DE STARTTIJD'); return; }
    const r = fitTo(data, t, e2); data = r.data; changed(); rerender('[data-shift]');
    const warn = r.ratio < 0.75 ? ' — FLINK KORTER: OVERWEEG EEN ONDERDEEL TE SCHRAPPEN' : r.ratio > 1.35 ? ' — RUIMER: MEER TIJD VOOR PAUZES OF EEN EXTRA ONDERDEEL' : '';
    setStatus(`TIJDEN AANGEPAST (${t}${e2 ? `–${e2}` : ''})${warn} — NIET OPGESLAGEN`); return;
  }
  if (b.hasAttribute('data-apply-answers')) {
    const p = savedPlan(); data = applyAnswers(data, p.answers, p); changed(); rerender('[data-apply-answers]');
    setStatus('ANTWOORDEN OVERGENOMEN — NIET OPGESLAGEN'); return;
  }
  if (b.hasAttribute('data-cost-add')) { syncCosts((c) => c.items.push({ label: '', amount: null, status: 'indicatief', note: '' })); changed(); rerender(`[data-cost="${costsFrom(data).items.length - 1}"][data-f="label"]`); return; }
  if (b.dataset.costRemove) { syncCosts((c) => c.items.splice(Number(b.dataset.costRemove), 1)); changed(); rerender('[data-cost-add]'); return; }
  if (b.hasAttribute('data-quote-send')) {
    const box = form.querySelector('[data-quotes]'); const out = box.querySelector('[data-quote-results]');
    const name = box.querySelector('[data-quote-name]').value.trim(); const email = box.querySelector('[data-quote-email]').value.trim();
    const chosen = [...box.querySelectorAll('[data-quote-venue]:checked')].map((x) => x.dataset.quoteVenue);
    if (!chosen.length) { setStatus('VINK MINSTENS ÉÉN LOCATIE AAN'); return; }
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus('VUL JE NAAM EN E-MAILADRES IN'); return; }
    if (!box.querySelector('[data-quote-consent]').checked) { setStatus('GEEF TOESTEMMING OM JE GEGEVENS TE DELEN'); return; }
    const c = merge(base, clean(data));
    const answers = { organisatie: c.organisatie, datum: c.datum, gasten: c.guests, contact: name, start: startTime(c), eind: naturalEnd(c.runbook || []) };
    const items = chosen.map((v) => { const venue = { ...P.venues[v] }; const t = tailor(c, answers, { venue }); const q = quoteRequests(c, t, P.quoteQuestions || {}).find((x) => x.kind === 'locatie'); return { id: v, slug: slugFromProfile(venue.url), name: venue.name, subject: q.subject, body: q.body }; });
    b.disabled = true; setStatus(`VERSTUREN NAAR ${items.length} LOCATIE${items.length > 1 ? 'S' : ''}…`);
    sendQuotes(P.contactEndpoint || '/api/contact/', items, { name, email }, { datum: c.datum, guests: c.guests, opened: openedAt }).then((res) => {
      b.disabled = false;
      out.innerHTML = res.map((r) => `<li data-level="${r.ok ? 'ok' : 'error'}">${esc(quoteResultText(r))}</li>`).join('');
      const sent = res.filter((r) => r.ok);
      if (sent.length) { data.quotes = { ...(data.quotes || {}), ...Object.fromEntries(sent.map((r) => [r.id, new Date().toISOString()])) }; data.contactName = name; data = setStage(data, data.status?.stage === 'bevestigd' || data.status?.stage === 'afgerond' ? data.status.stage : 'offerte'); changed(); track('quote', base.slug); }
      setStatus(`${sent.length} VAN ${res.length} AANVRAGEN VERSTUURD${sent.length ? ' — NIET OPGESLAGEN' : ''}`);
    });
    return;
  }
  if (b.dataset.unvenue) { data.venueIds = (data.venueIds || []).filter((v) => v !== b.dataset.unvenue); changed(); rerender('[data-add-venue]'); return; }
  if (b.dataset.add) {
    const key = b.dataset.add; const arr = getPath(data, key) || []; const spec = LISTS[key];
    arr.push(spec.details ? { time: '', title: '', description: '', details: {} } : {});
    setPath(data, key, arr); changed(); rerender(`[data-path="${key}.${arr.length - 1}.${spec.fields[0][0]}"]`); return;
  }
  if (b.dataset.sort) { const key = b.dataset.sort; setPath(data, key, (getPath(data, key) || []).slice().sort(byTime)); changed(); rerender(); setStatus('GESORTEERD OP TIJD — NIET OPGESLAGEN'); return; }
  if (listEl && (b.dataset.move || b.hasAttribute('data-remove'))) {
    const key = listEl.dataset.list; const arr = getPath(data, key); const i = Number(b.closest('[data-row]').dataset.row);
    if (b.hasAttribute('data-remove')) {
      const name = arr[i]?.title || arr[i]?.moment || arr[i]?.risk || arr[i]?.kpi || `${LISTS[key].label} ${i + 1}`;
      if (!confirm(`“${name}” verwijderen?`)) return;
      arr.splice(i, 1); changed(); rerender(); return;
    }
    const j = i + Number(b.dataset.move); if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; changed(); rerender(`[data-list="${key}"] [data-row="${j}"] [data-move="${b.dataset.move}"]`);
  }
});
$('[data-maker-save]').addEventListener('click', save);
document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); } });
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
$('[data-maker-deck]').addEventListener('click', (e) => { if (!id) { e.preventDefault(); setStatus('SLA JE CONCEPT EERST OP; DAN MAAK JE ER EEN PRESENTATIE VAN.'); } else if (dirty) { e.preventDefault(); save().then(() => { location.href = `/presentatie/?id=${encodeURIComponent(id)}`; }); } });
document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', async () => {
  const c = merge(base, clean(data));
  try { setStatus((await exportConcept(b.dataset.export, c, P)).toUpperCase()); track('download', base.slug); } catch (err) { setStatus(String(err.message || err).toUpperCase()); }
}));

/* ---------- Delen, samenwerken, versies, dupliceren ---------- */
const collab = $('[data-maker-collab]');
const when = (iso) => new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
async function renderCollab() {
  if (!collab) return;
  if (!id) { collab.hidden = true; return; }
  collab.hidden = false;
  const owner = role === 'owner';
  const link = row?.share_token ? `${location.origin}/presentatie/?t=${row.share_token}` : '';
  let members = []; let versions = [];
  let regs = [];
  try { [members, versions, regs] = await Promise.all([A.listMembers(id), A.listVersions(id), A.listRegistrations(id).catch(() => [])]); } catch {}
  const regLink = row?.registration_token ? `${location.origin}/aanmelden/?t=${row.registration_token}` : '';
  const dietTally = Object.entries(regs.flatMap((r) => r.diet || []).reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {}));
  collab.innerHTML = `<div class="tl-maker__collab">
  <div><h3 class="tl-mono tl-subhead">DELEN (ALLEEN LEZEN)</h3>
    ${owner ? (link ? `<p class="tl-note">Iedereen met deze link ziet de presentatie en kan downloaden, zonder account.</p><div class="tl-maker__share"><input readonly value="${esc(link)}" aria-label="Deellink" data-share-link><button class="tl-button" type="button" data-copy-share>KOPIEER LINK</button></div><button class="tl-text-button" type="button" data-share-off>STOP MET DELEN</button>`
      : '<p class="tl-note">Maak een geheime link om de presentatie te laten zien aan een opdrachtgever of collega, zonder dat die een account nodig heeft.</p><button class="tl-button tl-button--outline" type="button" data-share-on>MAAK DEELLINK ↗</button>')
      : `<p class="tl-note">${link ? 'Dit concept heeft een deellink; de eigenaar beheert die.' : 'Alleen de eigenaar kan een deellink maken.'}</p>`}
  </div>
  <div><h3 class="tl-mono tl-subhead">SAMENWERKEN</h3>
    ${owner ? '' : `<p class="tl-note">Gedeeld met jou als <strong>${role === 'editor' ? 'redacteur' : 'lezer'}</strong>.</p>`}
    <ul class="tl-maker__chosen">${members.map((m) => `<li><span>${esc(m.email)} <span class="tl-note">${m.role === 'editor' ? 'redacteur' : 'lezer'}</span></span>${owner || m.email === (me?.email || '').toLowerCase() ? `<button class="tl-maker__icon" type="button" data-remove-member="${esc(m.email)}" aria-label="${esc(m.email)} verwijderen">×</button>` : ''}</li>`).join('') || '<li class="tl-note">Nog niemand uitgenodigd.</li>'}</ul>
    ${owner ? `<form class="tl-maker__invite" data-invite><label class="tl-field"><span>E-MAILADRES</span><input name="email" type="email" required></label><label class="tl-field"><span>ROL</span><select name="role"><option value="editor">Redacteur (mag bewerken)</option><option value="viewer">Lezer</option></select></label><button class="tl-button tl-button--outline" type="submit">NODIG UIT +</button></form>
      <p class="tl-note">De uitgenodigde maakt een account aan met dít e-mailadres en vindt het concept dan bij Mijn concepten.</p>` : ''}
  </div>
  <div><h3 class="tl-mono tl-subhead">VERSIES</h3>
    <ul class="tl-maker__chosen">${versions.map((v) => `<li><span>${esc(when(v.created_at))} <span class="tl-note">${esc(v.saved_by_email || '')}</span></span>${role !== 'viewer' ? `<button class="tl-text-button" type="button" data-restore="${v.id}">HERSTEL</button>` : ''}</li>`).join('') || '<li class="tl-note">Nog geen eerdere versies. Bij het bewaren houden we automatisch een versie bij (hooguit één per 10 minuten, maximaal 50).</li>'}</ul>
    <button class="tl-button tl-button--outline" type="button" data-duplicate>DUPLICEER ALS VARIANT</button>
  </div>
  <div><h3 class="tl-mono tl-subhead">AANMELDEN</h3>
    ${owner ? (regLink ? `<div class="tl-maker__share"><input readonly value="${esc(regLink)}" aria-label="Aanmeldlink" data-reg-link><button class="tl-button" type="button" data-copy-reg>KOPIEER</button></div>
      <p class="tl-note">${row.registration_open ? 'Aanmelden staat open.' : 'Aanmelden is gesloten.'}${row.registration_limit ? ` Maximaal ${row.registration_limit} gasten.` : ''}</p>
      <span class="tl-chip-set"><button class="tl-text-button" type="button" data-reg-toggle>${row.registration_open ? 'SLUIT AANMELDEN' : 'OPEN AANMELDEN'}</button></span>`
      : `<p class="tl-note">Deel een aanmeldlink met je gasten: naam, e-mail, organisatie en dieetwensen komen hier binnen.</p><label class="tl-field"><span>MAXIMUM (OPTIONEEL)</span><input type="number" min="1" max="5000" data-reg-limit value="${esc(data.guests || '')}"></label><button class="tl-button tl-button--outline" type="button" data-reg-on>MAAK AANMELDLINK ↗</button>`)
      : `<p class="tl-note">${regLink ? 'De eigenaar beheert de aanmeldlink.' : 'De eigenaar kan een aanmeldlink maken.'}</p>`}
    <p class="tl-mono tl-body--gap">${regs.length} AANMELDING${regs.length === 1 ? '' : 'EN'}${dietTally.length ? ` / ${dietTally.map(([d, n]) => `${n}× ${d}`).join(', ').toUpperCase()}` : ''}</p>
    ${regs.length ? `<ul class="tl-maker__chosen">${regs.slice(0, 12).map((r) => `<li><span>${esc(r.name)} <span class="tl-note">${esc(r.organisation || '')}${r.diet?.length ? ` / ${esc(r.diet.join(', '))}` : ''}</span></span></li>`).join('')}${regs.length > 12 ? `<li class="tl-note">en nog ${regs.length - 12}…</li>` : ''}</ul>
      <span class="tl-chip-set"><button class="tl-button tl-button--outline" type="button" data-reg-apply>NEEM AANTAL EN DIEETWENSEN OVER</button><button class="tl-text-button" type="button" data-reg-csv>DOWNLOAD LIJST (CSV)</button></span>` : ''}
  </div>
</div>`;
  collab._regs = regs;
}
collab?.addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.hasAttribute('data-share-on')) { row = await A.shareOn(id); setStatus('DEELLINK GEMAAKT ✓'); }
    else if (b.hasAttribute('data-share-off')) { if (!confirm('De deellink werkt daarna niet meer. Doorgaan?')) return; row = await A.shareOff(id); setStatus('DELEN GESTOPT'); }
    else if (b.hasAttribute('data-reg-on')) { const lim = Number(collab.querySelector('[data-reg-limit]')?.value) || null; row = await A.registrationOn(id, lim); setStatus('AANMELDLINK GEMAAKT ✓'); }
    else if (b.hasAttribute('data-reg-toggle')) { row = await A.registrationSet(id, { registration_open: !row.registration_open }); setStatus(row.registration_open ? 'AANMELDEN STAAT OPEN' : 'AANMELDEN GESLOTEN'); }
    else if (b.hasAttribute('data-copy-reg')) { const v = collab.querySelector('[data-reg-link]'); try { await navigator.clipboard.writeText(v.value); setStatus('AANMELDLINK GEKOPIEERD ✓'); } catch { v.select(); } return; }
    else if (b.hasAttribute('data-reg-apply')) {
      const regs = collab._regs || []; const tally = regs.flatMap((r) => r.diet || []).reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {});
      data.guests = regs.length;
      const line = `Aanmeldingen (${new Date().toLocaleDateString('nl-NL')}): ${regs.length} gasten${Object.keys(tally).length ? `; dieet: ${Object.entries(tally).map(([d, n]) => `${n}× ${d}`).join(', ')}` : ''}.`;
      data.notes = [String(data.notes || '').split('\n').filter((l) => !l.startsWith('Aanmeldingen (')).join('\n').trim(), line].filter(Boolean).join('\n');
      changed(); render(); setStatus(`${regs.length} GASTEN EN DIEETWENSEN OVERGENOMEN — NIET OPGESLAGEN`); return;
    }
    else if (b.hasAttribute('data-reg-csv')) {
      const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const csv = ['Naam;E-mail;Organisatie;Dieetwensen;Opmerking;Aangemeld op', ...(collab._regs || []).map((r) => [r.name, r.email, r.organisation, (r.diet || []).join(', '), r.remarks, new Date(r.created_at).toLocaleString('nl-NL')].map(q).join(';'))].join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'aanmeldingen.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); return;
    }
    else if (b.hasAttribute('data-copy-share')) { const v = collab.querySelector('[data-share-link]'); try { await navigator.clipboard.writeText(v.value); setStatus('DEELLINK GEKOPIEERD ✓'); } catch { v.select(); } return; }
    else if (b.dataset.removeMember) { if (!confirm(`${b.dataset.removeMember} verwijderen uit dit concept?`)) return; await A.removeMember(id, b.dataset.removeMember); if (b.dataset.removeMember === (me?.email || '').toLowerCase() && role !== 'owner') { location.href = '/account/'; return; } }
    else if (b.dataset.restore) {
      if (!confirm('Deze versie terugzetten? De huidige stand wordt eerst als versie bewaard.')) return;
      const v = await A.getVersion(b.dataset.restore);
      data = { ...fromBase(base), ...v.data }; dirty = true; render(); await save(); setStatus('VERSIE HERSTELD ✓');
    } else if (b.hasAttribute('data-duplicate')) {
      const copy = await A.createConcept({ base_slug: base.slug, title: `${data.title} (variant)`.slice(0, 160), data: { ...clean(data), title: `${data.title} (variant)`.slice(0, 160) } });
      dirty = false; location.href = `/maker/?id=${encodeURIComponent(copy.id)}`; return;
    }
    renderCollab();
  } catch (err) { setStatus(A.message(err).toUpperCase()); }
});
collab?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const email = f.elements.email.value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setStatus('VUL EEN GELDIG E-MAILADRES IN'); return; }
  if (email.toLowerCase() === (me?.email || '').toLowerCase()) { setStatus('JE BENT AL EIGENAAR VAN DIT CONCEPT'); return; }
  try { await A.addMember(id, email, f.elements.role.value); setStatus(`${email.toUpperCase()} UITGENODIGD ✓`); renderCollab(); } catch (err) { setStatus(A.message(err).toUpperCase()); }
});

/* ---------- Start ---------- */
function gate(slug) {
  const next = encodeURIComponent(location.pathname + location.search);
  const el = $('[data-maker-gate]');
  el.hidden = false;
  el.innerHTML = `<div class="tl-state tl-state--empty"><h2 class="tl-state__title">REGISTREER OM TE MAKEN.</h2><p>Met een gratis account pas je elk standaardconcept helemaal aan en bewaar je het: programma, draaiboek, catering, entertainment, locatie en makers. Daarna download je het als presentatie (PDF), Word of tekst.</p>
  <span class="tl-chip-set"><a class="tl-button tl-button--accent" href="/account/?stap=registreren&next=${next}">REGISTREER GRATIS ↗</a><a class="tl-button tl-button--outline" href="/account/?next=${next}">INLOGGEN ↗</a>${slug ? `<a class="tl-text-button" href="/presentatie/?basis=${esc(slug)}">BEKIJK EERST DE PRESENTATIE VAN HET STANDAARDCONCEPT ↗</a>` : ''}</span></div>`;
}
function fail(msg) { const el = $('[data-maker-gate]'); el.hidden = false; el.innerHTML = `<div class="tl-state tl-state--error"><h2 class="tl-state__title">NIET GELADEN.</h2><p>${esc(msg)}</p><a class="tl-button" href="/account/">NAAR MIJN CONCEPTEN ↗</a></div>`; }

(async () => {
  try {
    P = await partners();
    const slug = params.get('basis');
    if (!A.enabled()) { const el = $('[data-maker-gate]'); el.hidden = false; el.innerHTML = `<div class="tl-state tl-state--empty"><h2 class="tl-state__title">BINNENKORT.</h2><p>Eigen concepten bewaren en bewerken komt binnenkort. Intussen download je elk standaardconcept als presentatie (PDF), Word of tekst op de conceptpagina.</p>${slug ? `<a class="tl-button" href="/presentatie/?basis=${esc(slug)}">PRESENTATIE VAN DIT CONCEPT ↗</a>` : ''}</div>`; return; }
    const s = await A.session();
    if (!s) { gate(slug); return; }
    if (id) {
      row = await A.getConcept(id);
      me = s.user;
      if (row.user_id !== me?.id) role = (await A.myRoles())[id] || 'viewer';
      base = await baseConcept(row.base_slug);
      data = { ...fromBase(base), ...row.data };
      $('[data-maker-deck]').href = `/presentatie/?id=${encodeURIComponent(id)}`;
      setStatus(`OPGESLAGEN ✓ ${new Date(row.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}`);
    } else if (slug) {
      base = await baseConcept(slug);
      data = fromBase(base);
      const p = savedPlan();
      if (p?.answers || p?.venueId) data = applyAnswers(data, p.answers || {}, p);
      $('[data-maker-deck]').setAttribute('aria-disabled', 'true');
    } else { location.replace('/account/'); return; }
    $('[data-maker-heading]').textContent = data.title;
    $('[data-maker-base]').innerHTML = `Basis: <a href="/eventconcepten/${esc(base.slug)}/">${esc(base.title)}</a>. Alles wat je hier wijzigt, geldt alleen voor jouw versie. Opslaan gebeurt automatisch zodra je concept één keer is bewaard.`;
    $('[data-maker-bar]').hidden = false;
    if (!id) track('start_maker', base.slug);
    const stageSel = $('[data-maker-stage]');
    stageSel.innerHTML = STAGES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
    stageSel.value = data.status?.stage || 'idee';
    stageSel.addEventListener('change', () => { data = setStage(data, stageSel.value); changed(); setStatus(`STATUS: ${stageSel.selectedOptions[0].textContent.toUpperCase()} — NIET OPGESLAGEN`); });
    me = me || s.user;
    render();
    if (role === 'viewer') { form.querySelectorAll('input,textarea,select,button').forEach((el) => { el.disabled = true; }); $('[data-maker-save]').hidden = true; setStatus('ALLEEN LEZEN — JE BENT LEZER VAN DIT CONCEPT'); }
    renderCollab();
  } catch (e) { fail(A.message(e)); }
})();
