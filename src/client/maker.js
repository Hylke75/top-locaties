// /maker/: eventconceptmaker. Basis = een standaardconcept; alles aan te passen; bewaard in het account.
import * as A from './lib/account.js';
import { readData } from './lib/store.js';
import { partners, baseConcept, exportCtx, esc } from './lib/conceptdata.js';
import { fromBase, merge, check, byTime } from './lib/userconcept.js';
import { conceptBlocks, blocksToDocx, blocksToText, download, fileSlug, MIME } from './lib/exporters.js';

const cfg = readData();
A.configure(cfg.accounts);
const $ = (s) => document.querySelector(s);
const form = $('[data-maker-form]');
const statusEl = $('[data-maker-status]');
const params = new URLSearchParams(location.search);
let P = null; let base = null; let data = null; let id = params.get('id'); let dirty = false; let saving = false; let timer = null;

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
    <div class="tl-field"><span>GEVOEL DAT GASTEN MEENEMEN (MAX. DRIE)</span><div class="tl-chip-set">${Object.entries(P.feelings).map(([f, l]) => `<button class="tl-chip-button" type="button" data-feel="${esc(f)}" aria-pressed="${feel.has(f)}">${esc(l.toUpperCase())} ${feel.has(f) ? '✓' : '+'}</button>`).join('')}</div></div>
    <div class="tl-maker__fields">${input('audiences', 'Voor wie (één doelgroep per regel)', 'lines', data.audiences)}</div>
  </fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">02</span> HET PROGRAMMA</legend><p class="tl-note">Pas tijden, onderdelen en de details per onderdeel aan. Voeg toe, verwijder of verplaats.</p>${listHtml('program')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">03</span> HET DRAAIBOEK</legend>${listHtml('runbook')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">04</span> CATERING</legend>
    <div class="tl-maker__fields">${input('catering.concept', 'Cateringconcept', 'area', data.catering?.concept)}</div>${listHtml('catering.moments')}
    <div class="tl-maker__fields tl-maker__fields--two">${input('catering.drinks', 'Dranken', 'area', data.catering?.drinks)}${input('catering.notes', 'Notities voor de cateraar', 'area', data.catering?.notes)}</div></fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">05</span> ENTERTAINMENT</legend>${listHtml('entertainment')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">06</span> LOCATIE EN MAKERS</legend>${chooser()}<p class="tl-note">Uitsluitend aangesloten Greenbookings-partners. Beschikbaarheid en prijs vraag je op bij de partner.</p></fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">07</span> COMMUNICATIE</legend>${listHtml('communication')}</fieldset>
  <fieldset class="tl-maker__part"><legend class="tl-maker__legend"><span class="tl-mono">08</span> KOSTEN, RISICO'S EN IMPACT</legend>
    <div class="tl-maker__fields">${input('budgetItems', 'Kostenposten (één per regel; bedragen uit je offertes)', 'lines', data.budgetItems)}</div>
    <h3 class="tl-mono tl-subhead">RISICO'S EN PLAN B</h3>${listHtml('risks')}
    <h3 class="tl-mono tl-subhead tl-body--gap">KPI'S</h3>${listHtml('kpis')}
    <div class="tl-maker__fields">${input('notes', 'Eigen notities', 'area', data.notes)}</div></fieldset>`;
  form.hidden = false;
}

/* ---------- Opslaan ---------- */
const clean = (d) => JSON.parse(JSON.stringify(d, (k, v) => (k === '__open' ? undefined : v)));
function setStatus(t) { statusEl.textContent = t; }
function changed() { dirty = true; setStatus('NIET OPGESLAGEN'); if (id) { clearTimeout(timer); timer = setTimeout(save, 2500); } }
async function save() {
  if (saving) return;
  const errs = check(data);
  $('[data-maker-errors]').innerHTML = errs.map((e) => `<li data-level="error">${esc(e)}</li>`).join('');
  if (errs.length) { setStatus('NIET OPGESLAGEN — ZIE DE PUNTEN HIERONDER'); return; }
  saving = true; setStatus('OPSLAAN…');
  try {
    const body = { title: data.title.trim().slice(0, 160), data: clean(data) };
    if (id) await A.updateConcept(id, body);
    else {
      const row = await A.createConcept({ base_slug: base.slug, ...body });
      id = row.id;
      history.replaceState(null, '', `/maker/?id=${encodeURIComponent(id)}`);
      $('[data-maker-deck]').href = `/presentatie/?id=${encodeURIComponent(id)}`;
      $('[data-maker-deck]').removeAttribute('aria-disabled');
    }
    dirty = false;
    setStatus(`OPGESLAGEN ✓ ${new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`);
  } catch (e) { setStatus(A.message(e).toUpperCase()); }
  saving = false;
}

/* ---------- Interactie ---------- */
form.addEventListener('input', (e) => {
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
document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => {
  const c = merge(base, clean(data));
  const blocks = conceptBlocks(c, exportCtx(P));
  const name = fileSlug(c.title);
  if (b.dataset.export === 'docx') download(`${name}.docx`, blocksToDocx(blocks, { title: c.title }), MIME.docx);
  else download(`${name}.txt`, blocksToText(blocks), MIME.txt);
  setStatus(b.dataset.export === 'docx' ? 'WORD-BESTAND GEDOWNLOAD ✓' : 'TEKSTBESTAND GEDOWNLOAD ✓');
}));

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
      const row = await A.getConcept(id);
      base = await baseConcept(row.base_slug);
      data = { ...fromBase(base), ...row.data };
      $('[data-maker-deck]').href = `/presentatie/?id=${encodeURIComponent(id)}`;
      setStatus(`OPGESLAGEN ✓ ${new Date(row.updated_at).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}`);
    } else if (slug) {
      base = await baseConcept(slug);
      data = fromBase(base);
      $('[data-maker-deck]').setAttribute('aria-disabled', 'true');
    } else { location.replace('/account/'); return; }
    $('[data-maker-heading]').textContent = data.title;
    $('[data-maker-base]').innerHTML = `Basis: <a href="/eventconcepten/${esc(base.slug)}/">${esc(base.title)}</a>. Alles wat je hier wijzigt, geldt alleen voor jouw versie. Opslaan gebeurt automatisch zodra je concept één keer is bewaard.`;
    $('[data-maker-bar]').hidden = false;
    render();
  } catch (e) { fail(A.message(e)); }
})();
