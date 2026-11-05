// Conceptpagina: gevoelsignatuur, locatie-/makerselectie en de composer.
import { parseFeelingParam, toggleFeeling } from './lib/rank.js';
import { venueFit } from './lib/tailor.js';
import { load, save, readData } from './lib/store.js';
import { parseBriefParam } from './lib/brief.js';

const data = readData();
const { concept } = data;
const labels = Object.fromEntries(data.feelings.map((f) => [f.id, f.label]));
const KEY = 'tl-plans-v1';
const plans = load(KEY, {});
const plan = plans[concept.slug] || { feelings: [], venueId: null, supplierIds: [] };
if (!data.venues[plan.venueId]) plan.venueId = null;
plan.supplierIds = (plan.supplierIds || []).filter((id) => data.suppliers[id]);

// Gekozen gevoelens: URL > sessie (homepage) > eerder plan.
const fromUrl = parseFeelingParam(new URLSearchParams(location.search).get('gevoel'), Object.keys(labels));
let fromSession = [];
try { fromSession = JSON.parse(sessionStorage.getItem('tl-feelings') || '[]').filter((f) => labels[f]); } catch {}
const chosen = fromUrl.length ? fromUrl : fromSession.length ? fromSession : plan.feelings || [];
plan.feelings = chosen.slice(0, 2);

const chosenEl = document.querySelector('[data-signature-chosen]');
if (plan.feelings.length) {
  chosenEl.hidden = false;
  chosenEl.textContent = `JIJ KOOS: ${plan.feelings.map((f) => labels[f].toUpperCase()).join(' + ')}`;
  document.querySelectorAll('[data-signature-feel]').forEach((t) => { t.dataset.chosen = String(plan.feelings.includes(t.dataset.signatureFeel)); });
}

const $ = (s) => document.querySelector(s);
const statusEl = $('[data-plan-status]');
const fallback = $('[data-plan-fallback]');
const bar = $('[data-selection-bar]');

let persist = function persist() { plan.updatedAt = new Date().toISOString(); plans[concept.slug] = plan; save(KEY, plans); };

function paint() {
  document.querySelectorAll('[data-venue-card]').forEach((card) => {
    const on = card.dataset.venueCard === plan.venueId;
    card.dataset.selected = String(on);
    const b = card.querySelector('[data-choose-venue]');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? '✓ GEKOZEN' : 'KIES DEZE PLEK +';
  });
  document.querySelectorAll('[data-supplier-card]').forEach((card) => {
    const on = plan.supplierIds.includes(card.dataset.supplierCard);
    card.dataset.selected = String(on);
    const b = card.querySelector('[data-choose-supplier]');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = on ? '✓ GEKOZEN' : 'VOEG TOE <span aria-hidden="true">+</span>';
  });
  document.querySelectorAll('[data-composer-feel]').forEach((b) => b.setAttribute('aria-pressed', String(plan.feelings.includes(b.dataset.composerFeel))));
  const sel = $('[data-composer-venue]');
  if (sel) sel.value = plan.venueId || '';
  document.querySelectorAll('[data-composer-supplier]').forEach((c) => { c.checked = plan.supplierIds.includes(c.dataset.composerSupplier); });
  const fitEl = $('[data-plan-venue-fit]');
  if (fitEl) { const v = plan.venueId && data.venues[plan.venueId]; fitEl.textContent = v ? venueFit(v, Number(plan.answers?.gasten) || null).text : ''; }
  $('[data-plan-feelings]').textContent = plan.feelings.length
    ? plan.feelings.map((f) => labels[f]).join(' · ')
    : `${concept.feelings.map((f) => labels[f]).join(' · ')} (signatuur van dit concept)`;
  $('[data-plan-venue]').textContent = plan.venueId ? `${data.venues[plan.venueId].name}, ${data.venues[plan.venueId].city}` : 'Nog geen locatie gekozen.';
  $('[data-plan-suppliers]').textContent = plan.supplierIds.length
    ? plan.supplierIds.map((id) => `${data.suppliers[id].name} (${data.suppliers[id].role.toLowerCase()})`).join(' · ')
    : 'Nog geen makers gekozen.';
  const count = (plan.venueId ? 1 : 0) + plan.supplierIds.length;
  const countEl = bar.querySelector('[data-selection-count]');
  const prev = Number(bar.dataset.count || 0);
  bar.hidden = count === 0;
  countEl.textContent = `${count} ${count === 1 ? 'ONDERDEEL' : 'ONDERDELEN'} GEKOZEN`;
  bar.dataset.count = String(count);
  if (count !== prev) { bar.classList.remove('is-bumped'); void bar.offsetWidth; bar.classList.add('is-bumped'); }
  // Uitklapbare lijst met de gekozen onderdelen, elk met een verwijderknop.
  const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const items = [
    ...(plan.venueId ? [{ kind: 'LOCATIE', name: data.venues[plan.venueId].name, attr: `data-remove-venue="${esc(plan.venueId)}"` }] : []),
    ...plan.supplierIds.map((id) => ({ kind: data.suppliers[id].role.toUpperCase(), name: data.suppliers[id].name, attr: `data-remove-supplier="${esc(id)}"` })),
  ];
  bar.querySelector('[data-selection-list]').innerHTML = items.map((x) => `<li><span class="tl-selection-bar__kind">${esc(x.kind)}</span><strong>${esc(x.name)}</strong><button type="button" ${x.attr} aria-label="Verwijder ${esc(x.name)} uit je plan">×</button></li>`).join('');
  if (!count) setPanel(false);
}

function setPanel(open) {
  const panel = bar.querySelector('[data-selection-panel]');
  const t = bar.querySelector('[data-selection-toggle]');
  panel.hidden = !open; t.setAttribute('aria-expanded', String(open));
  t.querySelector('.tl-selection-bar__chev').textContent = open ? '↓' : '↑';
}
bar.querySelector('[data-selection-toggle]').addEventListener('click', () => setPanel(bar.querySelector('[data-selection-panel]').hidden));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !bar.querySelector('[data-selection-panel]').hidden) { setPanel(false); bar.querySelector('[data-selection-toggle]').focus(); } });

function planText() {
  const v = plan.venueId && data.venues[plan.venueId];
  return [
    'TOP LOCATIES — CONCEPTPLAN',
    concept.title,
    concept.proposition,
    '',
    `GEWENST GEVOEL: ${(plan.feelings.length ? plan.feelings : concept.feelings).map((f) => labels[f]).join(', ')}`,
    '',
    'LOCATIE:',
    v ? `- ${v.name} (${v.city}) — ${v.url}` : '- Nog niet gekozen',
    '',
    'MAKERS:',
    ...(plan.supplierIds.length ? plan.supplierIds.map((id) => `- ${data.suppliers[id].name}, ${data.suppliers[id].role} — ${data.suppliers[id].url}`) : ['- Nog niet gekozen']),
    '',
    `Concept: ${data.origin}/eventconcepten/${concept.slug}/`,
    'Let op: dit is een inspiratieplan, geen boeking. Beschikbaarheid, capaciteit en prijs bevestig je bij de locatie en leveranciers.',
  ].join('\n');
}

document.addEventListener('change', (e) => {
  const vs = e.target.closest('[data-composer-venue]');
  const sc = e.target.closest('[data-composer-supplier]');
  if (vs) {
    plan.venueId = vs.value || null;
    statusEl.textContent = plan.venueId ? `${data.venues[plan.venueId].name} staat in je plan.` : 'Locatie uit je plan gehaald.';
  } else if (sc) {
    const id = sc.dataset.composerSupplier;
    plan.supplierIds = sc.checked ? [...new Set([...plan.supplierIds, id])] : plan.supplierIds.filter((x) => x !== id);
    statusEl.textContent = sc.checked ? `${data.suppliers[id].name} toegevoegd.` : `${data.suppliers[id].name} verwijderd.`;
  } else return;
  persist(); paint();
  if (plan.answers && typeof renderTailored === 'function') renderTailored();
});

document.addEventListener('click', async (e) => {
  const fb = e.target.closest('[data-composer-feel]');
  if (fb) {
    plan.feelings = toggleFeeling(plan.feelings, fb.dataset.composerFeel);
    persist(); paint();
    if (plan.answers && typeof renderTailored === 'function') renderTailored();
    return;
  }
  const vb = e.target.closest('[data-choose-venue]');
  const sb = e.target.closest('[data-choose-supplier]');
  const rv = e.target.closest('[data-remove-venue]');
  const rs = e.target.closest('[data-remove-supplier]');
  if (rv || rs) {
    const name = rv ? data.venues[plan.venueId]?.name : data.suppliers[rs.dataset.removeSupplier]?.name;
    if (rv) plan.venueId = null; else plan.supplierIds = plan.supplierIds.filter((x) => x !== rs.dataset.removeSupplier);
    statusEl.textContent = `${name} verwijderd.`;
    bar.querySelector('[data-selection-live]').textContent = `${name} uit je plan gehaald.`;
    persist(); paint();
    bar.querySelector('[data-selection-list] button, [data-selection-toggle]')?.focus();
    if (plan.answers && typeof renderTailored === 'function') renderTailored();
    return;
  }
  if (vb) {
    const id = vb.dataset.chooseVenue;
    plan.venueId = plan.venueId === id ? null : id; // één locatie tegelijk
    statusEl.textContent = plan.venueId ? `${data.venues[id].name} staat in je plan.` : 'Locatie uit je plan gehaald.';
    bar.querySelector('[data-selection-live]').textContent = statusEl.textContent;
  } else if (sb) {
    const id = sb.dataset.chooseSupplier;
    plan.supplierIds = plan.supplierIds.includes(id) ? plan.supplierIds.filter((x) => x !== id) : [...plan.supplierIds, id];
    statusEl.textContent = plan.supplierIds.includes(id) ? `${data.suppliers[id].name} toegevoegd.` : `${data.suppliers[id].name} verwijderd.`;
    bar.querySelector('[data-selection-live]').textContent = statusEl.textContent;
  } else if (e.target.closest('[data-plan-reset]')) {
    plan.venueId = null; plan.supplierIds = [];
    statusEl.textContent = 'Keuzes gewist.';
  } else if (e.target.closest('[data-plan-copy]')) {
    const text = planText();
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = 'Het conceptplan is gekopieerd ✓';
      fallback.hidden = true;
    } catch {
      fallback.value = text; fallback.hidden = false; fallback.focus(); fallback.select();
      statusEl.textContent = 'Kopiëren lukt hier niet automatisch. Selecteer de tekst hieronder.';
    }
    return;
  } else return;
  persist();
  paint();
});

/* ---------- Stappenbalk: actieve stap en vinkjes bij stappen met een keuze ---------- */
const STEP_OF = { 'het-idee': 'idee', doelen: 'idee', beleving: 'idee', programma: 'programma', draaiboek: 'programma', catering: 'programma', locaties: 'locatie', leveranciers: 'makers', samenstellen: 'plan' };
const stepLinks = [...document.querySelectorAll('[data-steps] [data-step]')];
const stepSections = [...document.querySelectorAll('main section[id]')].map((el) => ({ el, step: STEP_OF[el.id] || (el.closest('[data-step-group]')?.dataset.stepGroup) })).filter((x) => x.step);
function paintSteps() {
  const done = { idee: plan.feelings.length > 0, locatie: Boolean(plan.venueId), makers: plan.supplierIds.length > 0, plan: Boolean(plan.answers) };
  for (const a of stepLinks) {
    const k = a.dataset.step;
    a.dataset.done = String(Boolean(done[k]));
    a.querySelector('[data-step-state]').textContent = done[k] ? ' (keuze gemaakt)' : '';
  }
}
let stepRaf = 0;
function activeStep() {
  stepRaf = 0;
  const line = innerHeight * 0.3;
  let cur = null;
  for (const s of stepSections) if (s.el.getBoundingClientRect().top <= line) cur = s.step;
  for (const a of stepLinks) { if (a.dataset.step === cur) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); }
}
addEventListener('scroll', () => { if (!stepRaf) stepRaf = requestAnimationFrame(activeStep); }, { passive: true });
activeStep();
const _persist = persist;
persist = function persistAndSteps() { _persist(); paintSteps(); };

// Print: dichtgeklapte onderdelen gaan mee open op papier.
addEventListener('beforeprint', () => document.querySelectorAll('details.tl-fold:not([open])').forEach((d) => { d.dataset.printOpened = '1'; d.open = true; }));
addEventListener('afterprint', () => document.querySelectorAll('details[data-print-opened]').forEach((d) => { d.open = false; delete d.dataset.printOpened; }));

persist();
paint();

/* ---------- Concept op maat (vragenlijst → compleet draaiboek) ---------- */
import { tailor, toText, formatDate, quoteRequests, callsheet, budgetCsv, naturalEnd } from './lib/tailor.js';
import { buildIcs, ICS_MIME } from './lib/ics.js';
import { sendQuotes, slugFromProfile, quoteResultText } from './lib/quote-send.js';
const openedAt = Date.now();

const tForm = document.querySelector('[data-tailor-form]');
const tOut = document.querySelector('[data-tailor-output]');
const tStatus = document.querySelector('[data-tailor-status]');
const escT = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// In het plan op maat zijn overgebleven invulplekken zichtbaar als duidelijk invulveld.
const fillT = (s) => escT(s).replace(/\[([^\]]{1,40})\]/g, (_, w) => `<span class="tl-fill" title="Zelf invullen">${w}</span>`);

function readAnswers() {
  const f = new FormData(tForm);
  const a = Object.fromEntries([...f.entries()].filter(([k]) => k !== 'dieet'));
  a.dieet = f.getAll('dieet');
  a.hybride = f.get('hybride') === 'ja';
  a.toegankelijk = f.get('toegankelijk') === 'ja';
  return a;
}
function fillForm(a) {
  if (!a) return;
  for (const [k, v] of Object.entries(a)) {
    const el = tForm.elements[k];
    if (!el) continue;
    if (k === 'dieet') tForm.querySelectorAll('[name=dieet]').forEach((c) => { c.checked = v.includes(c.value); });
    else if (el.type === 'checkbox') el.checked = Boolean(v);
    else el.value = v;
  }
}
function currentTailor() {
  const v = plan.venueId ? { ...data.venues[plan.venueId] } : null;
  const sups = plan.supplierIds.map((id) => data.suppliers[id]).filter(Boolean);
  return tailor(concept, { ...(plan.answers || readAnswers()), feelings: plan.feelings }, { venue: v, suppliers: sups });
}
function renderTailored() {
  const t = currentTailor();
  const a = t.answers;
  const done = new Set(plan.checked || []);
  const check = (id, text) => `<label class="tl-check tl-check--on-dark"><input type="checkbox" data-check="${escT(id)}" ${done.has(id) ? 'checked' : ''}> ${escT(text)}</label>`;
  tOut.innerHTML = `
  <div class="tl-overline"><span>JOUW DRAAIBOEK OP MAAT</span><span>${escT(a.organisatie || 'TOP LOCATIES')} / ${a.datum ? escT(formatDate(new Date(`${a.datum}T12:00:00`)).toUpperCase()) : 'DATUM NOG OPEN'}</span></div>
  <h3 class="tl-display tl-display--md">${escT(concept.title)} <br><span class="tl-accent">VOOR ${t.guests ? `${t.guests} GASTEN` : 'JOUW GROEP'}.</span></h3>
  <dl class="tl-facts tl-facts--on-dark">
    <div><dt>DOEL</dt><dd>${escT(a.doel || concept.objective)}</dd></div>
    <div><dt>LOCATIE</dt><dd>${escT(t.fit.text)}</dd></div>
    <div><dt>TIJDEN</dt><dd>${t.timing ? `${escT(t.timing.start)} – ${escT(t.timing.end)} (concept: tot ${escT(t.timing.naturalEnd || '?')})` : `Vanaf ${escT(a.start || '')}`}</dd></div>
    <div><dt>MAKERS</dt><dd>${t.suppliers.length ? t.suppliers.map((s) => `${escT(s.name)} (${escT(s.role.toLowerCase())})`).join(' · ') : 'Nog geen makers gekozen.'}</dd></div>
  </dl>
  ${t.fit.status === 'warn' ? `<p class="tl-warning">${escT(t.fit.text)}</p>` : ''}
  ${t.timing?.note ? `<p class="tl-warning">${escT(t.timing.note)}</p>` : ''}
  ${t.season ? `<p class="tl-warning">BUITEN / ${escT(t.season.season.toUpperCase())}: ${escT(t.season.text)}${t.season.risks.length ? ` Plan B: ${t.season.risks.map((r) => escT(r.mitigation)).join(' ')}` : ''}</p>` : ''}
  ${t.adjustment ? `<p class="tl-warning">BIJGESTELD — ${escT(t.adjustment.label.toUpperCase())}: ${escT(t.adjustment.text)}</p>` : ''}
  ${t.variations.length ? `<h4 class="tl-mono tl-subhead tl-body--gap">AANBEVOLEN VARIANT</h4><dl class="tl-facts tl-facts--stack tl-facts--on-dark">${t.variations.map((v) => `<div><dt>${escT(v.title)}</dt><dd>${escT(v.text)}</dd></div>`).join('')}</dl>` : ''}
  <details class="tl-fold tl-fold--on-dark"><summary><h4 class="tl-fold__title">DAGDRAAIBOEK — ${escT(a.start || '')}${t.timing ? ` TOT ${escT(t.timing.end)}` : ''}</h4><span class="tl-fold__meta">OPEN</span></summary><div class="tl-fold__body">
  <div class="tl-runbook tl-runbook--on-dark">${t.runbook.map((r) => `<div class="tl-runbook__row"><span class="tl-runbook__time">${escT(r.time)}</span><span class="tl-runbook__duration" data-label="DUUR">${escT(r.duration)}</span><span><strong class="tl-runbook__title">${escT(r.title)}</strong><span class="tl-runbook__desc">${escT(r.description)}</span></span><span class="tl-runbook__meta" data-label="WIE">${escT(r.owner)}</span><span class="tl-runbook__meta" data-label="WAAR">${escT(r.space)}</span></div>`).join('')}</div></div></details>
  <details class="tl-fold tl-fold--on-dark"><summary><h4 class="tl-fold__title">AFTELPLANNING MET DATA</h4><span class="tl-fold__meta">OPEN</span></summary><div class="tl-fold__body">
  <div class="tl-checklist tl-checklist--on-dark">${t.planning.map((p, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(p.when)}${p.date ? ` — VANAF ${escT(formatDate(p.date).toUpperCase())}` : ''}</strong><span class="tl-runbook__desc">${escT(p.title)}</span>${p.tasks.map((x, j) => check(`p${i}-${j}`, x)).join('')}</div>`).join('')}</div></div></details>
  <h4 class="tl-mono tl-subhead tl-body--gap">CATERING${t.guests ? ` VOOR ${t.guests} GASTEN` : ''}${t.diets.length ? ` · DIEETWENSEN: ${escT(t.diets.join(', ').toUpperCase())}` : ''}</h4>
  <div class="tl-menu tl-menu--on-dark">${(concept.catering?.moments || []).map((m) => `<div class="tl-menu__item"><span class="tl-menu__when">${escT(m.time)} / ${escT(m.moment)}</span><p class="tl-menu__dish">${escT(m.proposal)}</p><span class="tl-menu__meta">${escT(m.format)}</span></div>`).join('')}</div>
  <h4 class="tl-mono tl-subhead tl-body--gap">BEZETTING VOOR JOUW GROEP</h4>
  <dl class="tl-facts tl-facts--stack tl-facts--on-dark">${t.crew.map((c) => `<div><dt>${escT(c.role)} — ${escT(c.count)}</dt><dd>${escT(c.task)}</dd></div>`).join('')}</dl>
  <details class="tl-fold tl-fold--on-dark"><summary><h4 class="tl-fold__title">CHECKLIST</h4><span class="tl-fold__meta">OPEN</span></summary><div class="tl-fold__body">
  <div class="tl-checklist tl-checklist--on-dark">${(concept.checklist || []).map((g, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(g.group)}</strong>${g.items.map((x, j) => check(`c${i}-${j}`, x)).join('')}</div>`).join('')}${t.extraChecks.length ? `<div class="tl-checklist__group"><strong class="tl-checklist__title">Op maat</strong>${t.extraChecks.map((x, j) => check(`x${j}`, x)).join('')}</div>` : ''}</div></div></details>
  <h4 class="tl-mono tl-subhead tl-body--gap">JOUW UITNODIGING</h4>
  <div class="tl-invite"><strong>${fillT(t.invitation.subject)}</strong><p>${fillT(t.invitation.text)}</p><p class="tl-note tl-on-dark-note">Herinnering: ${fillT(t.invitation.reminder)}</p><p class="tl-note tl-on-dark-note"><span class="tl-fill">gemarkeerd</span> = zelf invullen.</p></div>
  <h4 class="tl-mono tl-subhead tl-body--gap">OFFERTEAANVRAGEN — KLAAR OM TE VERSTUREN</h4>
  ${(() => { const qs = quoteRequests(concept, t, data.quoteQuestions); const venueQ = qs.find((q) => q.kind === 'locatie'); return qs.length ? `${venueQ ? `<form class="tl-quote-send" data-quote-send><strong class="tl-mono">VERSTUUR DE AANVRAAG DIRECT AAN ${escT(venueQ.to.toUpperCase())}</strong>
    <div class="tl-questionnaire__grid tl-questionnaire__grid--two"><label class="tl-field"><span>JOUW NAAM</span><input name="qname" autocomplete="name" value="${escT(a.contact || '')}" required></label><label class="tl-field"><span>JOUW E-MAILADRES</span><input name="qemail" type="email" autocomplete="email" required></label></div>
    <label class="tl-check tl-check--on-dark"><input type="checkbox" name="qconsent"> Mijn naam, e-mailadres en de aanvraag worden via Greenbookings gedeeld met ${escT(venueQ.to)}.</label>
    <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-quote-status>${plan.quotes?.[plan.venueId] ? `AL VERSTUURD OP ${escT(new Date(plan.quotes[plan.venueId]).toLocaleDateString('nl-NL'))}` : 'Makers hebben nog geen directe route: kopieer hun aanvraag hieronder.'}</span><button class="tl-button tl-button--accent" type="submit">VERSTUUR AANVRAAG ↗</button></div></form>` : ''}<div class="tl-checklist tl-checklist--on-dark">${qs.map((q, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(q.to)}</strong><span class="tl-runbook__desc">${escT(q.subject)}</span><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-copy-quote="${i}">KOPIEER AANVRAAG</button><a class="tl-text-button" href="${escT(q.url)}" target="_blank" rel="noopener noreferrer">PROFIEL ↗</a></div>`).join('')}</div>` : '<p class="tl-note tl-on-dark-note">Kies een locatie en makers in de kolommen hierboven; dan schrijven we voor elk een offerteaanvraag.</p>'; })()}
  <details class="tl-fold tl-fold--on-dark"><summary><h4 class="tl-fold__title">CALLSHEET — WIE IS WIE OP DE DAG</h4><span class="tl-fold__meta">${callsheet(concept, t).length} ROLLEN</span></summary><div class="tl-fold__body"><dl class="tl-facts tl-facts--stack tl-facts--on-dark">${callsheet(concept, t).map((r) => `<div><dt>${escT(r.role)}${r.arrive ? ` — AANWEZIG ${escT(r.arrive)}` : ''}</dt><dd>${r.name ? escT(r.name) : '<span class="tl-fill" title="Zelf invullen">naam</span>'}${r.party ? ` · ${escT(r.party)}` : ''} · <span class="tl-fill" title="Zelf invullen">telefoon</span></dd></div>`).join('')}</dl></div></details>
  <p class="tl-note tl-on-dark-note">Downloads, agenda en kopie vind je hieronder bij ‘Neem je plan mee’.</p>`;
  tOut.hidden = false;
}

// Vanuit de briefing (/conceptplan/): antwoorden vooraf invullen, eigen eerdere antwoorden blijven leidend waar de briefing niets zegt.
const fromBrief = parseBriefParam(new URLSearchParams(location.search).get('brief'));
if (fromBrief) {
  plan.answers = { ...(plan.answers || {}), ...fromBrief };
  persist();
  history.replaceState(null, '', location.pathname + (plan.feelings.length ? `?gevoel=${plan.feelings.join(',')}` : '') + location.hash);
}

if (tForm) {
  // Eindtijd schuift mee met de starttijd zolang de bezoeker de eindtijd niet zelf heeft aangepast.
  const mins = (v) => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
  const hhmm = (n) => `${String(Math.floor(((n % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String((((n % 1440) + 1440) % 1440) % 60).padStart(2, '0')}`;
  let lastStart = tForm.elements.start?.value; let endTouched = Boolean(plan.answers?.eindAangepast);
  tForm.elements.eind?.addEventListener('input', () => { endTouched = true; });
  tForm.elements.start?.addEventListener('change', () => {
    const a = mins(lastStart), b = mins(tForm.elements.start.value), e = mins(tForm.elements.eind?.value);
    if (!endTouched && a != null && b != null && e != null) tForm.elements.eind.value = hhmm(e + (b - a));
    lastStart = tForm.elements.start.value;
  });
  tForm.addEventListener('submit', () => { if (plan.answers) plan.answers.eindAangepast = endTouched; }, true);
  fillForm(plan.answers);
  lastStart = tForm.elements.start?.value;
  if (plan.answers) renderTailored();
  tForm.addEventListener('submit', (e) => {
    e.preventDefault();
    plan.answers = readAnswers();
    persist();
    renderTailored();
    tStatus.textContent = 'Je draaiboek op maat staat hieronder ✓';
    tOut.focus();
    tOut.scrollIntoView({ block: 'start' });
  });
  tOut.addEventListener('submit', async (e) => {
    const f = e.target.closest('[data-quote-send]'); if (!f) return;
    e.preventDefault();
    const st = f.querySelector('[data-quote-status]');
    const name = f.elements.qname.value.trim(); const email = f.elements.qemail.value.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { st.textContent = 'Vul je naam en een geldig e-mailadres in.'; return; }
    if (!f.elements.qconsent.checked) { st.textContent = 'Geef toestemming om je gegevens met de locatie te delen.'; return; }
    const t = currentTailor(); const q = quoteRequests(concept, t, data.quoteQuestions).find((x) => x.kind === 'locatie');
    const endpoint = document.querySelector('[data-contact-dialog]')?.dataset.endpoint || data.contactEndpoint || '/api/contact/';
    st.textContent = 'VERSTUREN…';
    const [r] = await sendQuotes(endpoint, [{ slug: slugFromProfile(t.venue.url), name: t.venue.name, subject: q.subject, body: q.body.replace('[naam]', name) }], { name, email }, { datum: t.answers.datum, guests: t.guests, opened: openedAt });
    st.textContent = quoteResultText(r);
    if (r.ok) { plan.quotes = { ...(plan.quotes || {}), [plan.venueId]: new Date().toISOString() }; persist(); import('./lib/track.js').then((m) => m.track('quote', concept.slug)).catch(() => {}); }
  });
  tOut.addEventListener('change', (e) => {
    const c = e.target.closest('[data-check]');
    if (!c) return;
    const set = new Set(plan.checked || []);
    c.checked ? set.add(c.dataset.check) : set.delete(c.dataset.check);
    plan.checked = [...set];
    persist();
  });
  // Acties uit 'Neem je plan mee' werken ook zonder ingevulde vragenlijst (dan met de standaardantwoorden).
  document.querySelector('[data-composer]').addEventListener('click', async (e) => {
    if (e.target.closest('[data-tailor-print]')) { window.print(); return; }
    if (e.target.closest('[data-share-plan]')) {
      // Deellink: alleen keuzes (geen naam/e-mail) naar de server; de link bevat alleen een willekeurig id.
      const st = document.querySelector('[data-takeaway-status]');
      st.textContent = 'DEELLINK WORDT GEMAAKT…';
      try {
        const { sharePlan } = await import('./lib/sharedplan.js');
        const { url } = await sharePlan(concept.slug, plan);
        let copied = false; try { await navigator.clipboard.writeText(url); copied = true; } catch {}
        st.innerHTML = `${copied ? 'LINK GEKOPIEERD ✓ ' : 'JOUW LINK: '}<a href="${escT(url)}">${escT(url)}</a> — 180 dagen geldig, zonder naam of e-mail.`;
      } catch (err) { st.textContent = err.message; }
      return;
    }
    if (e.target.closest('[data-tailor-ics]')) {
      const t = currentTailor(); const a = t.answers; const st = document.querySelector('[data-takeaway-status]');
      if (!a.datum) { st.textContent = 'Vul eerst een datum in (vraag 02), dan zetten we het event en de planning in je agenda.'; return; }
      const ics = buildIcs({ title: `${concept.title}${a.organisatie ? ` — ${a.organisatie}` : ''}`, date: a.datum, start: a.start, end: t.timing?.end || naturalEnd(t.runbook),
        location: t.venue ? `${t.venue.name}, ${t.venue.city}` : '', uid: `${concept.slug}-${a.datum}@top-locaties.nl`,
        description: ['DRAAIBOEK', ...t.runbook.map((r) => `${r.time} ${r.title}${r.owner ? ` (${r.owner})` : ''}`), '', `Draaiboek op maat: ${location.origin}/eventconcepten/${concept.slug}/`].join('\n'),
        milestones: t.planning.filter((p) => p.date).map((p) => ({ date: p.date, title: p.title, description: (p.tasks || []).map((x) => `- ${x}`).join('\n') })) });
      const blob = new Blob([ics], { type: ICS_MIME }); const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); link.download = `${concept.slug}.ics`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      st.textContent = 'Agendabestand gedownload ✓ — met het event en de mijlpalen uit de aftelplanning.'; return;
    }
    const st0 = document.querySelector('[data-takeaway-status]');
    if (e.target.closest('[data-download-budget]')) {
      const blob = new Blob(['\ufeff' + budgetCsv(concept, currentTailor())], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `begroting-${concept.slug}.csv`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      st0.textContent = 'Begroting gedownload ✓ — vul de bedragen in uit de offertes.';
      return;
    }
    const cq = e.target.closest('[data-copy-quote]');
    if (cq) {
      const q = quoteRequests(concept, currentTailor(), data.quoteQuestions)[Number(cq.dataset.copyQuote)];
      const text = `Onderwerp: ${q.subject}\n\n${q.body}`;
      import('./lib/track.js').then((m) => m.track('quote', concept.slug)).catch(() => {});
      try { await navigator.clipboard.writeText(text); st0.textContent = `Offerteaanvraag voor ${q.to} gekopieerd ✓`; }
      catch { fallback.value = text; fallback.hidden = false; fallback.select(); st0.textContent = 'Kopiëren lukt hier niet automatisch; selecteer de tekst in het tekstvak.'; }
      return;
    }
    if (!e.target.closest('[data-tailor-copy]')) return;
    const text = toText(concept, currentTailor(), labels);
    const st = document.querySelector('[data-takeaway-status]');
    try { await navigator.clipboard.writeText(text); st.textContent = 'Het complete draaiboek is gekopieerd ✓'; }
    catch { fallback.value = text; fallback.hidden = false; fallback.select(); st.textContent = 'Kopiëren lukt hier niet automatisch; selecteer de tekst in het tekstvak.'; }
  });
  // Locatie- of makerkeuze werkt het draaiboek bij als het al gemaakt is.
  document.addEventListener('click', (e) => { if (plan.answers && e.target.closest('[data-choose-venue],[data-choose-supplier],[data-plan-reset]')) setTimeout(renderTailored, 0); });
}
