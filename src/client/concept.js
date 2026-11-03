// Conceptpagina: gevoelsignatuur, locatie-/makerselectie en de composer.
import { parseFeelingParam, toggleFeeling } from './lib/rank.js';
import { venueFit } from './lib/tailor.js';
import { load, save, readData } from './lib/store.js';

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

function persist() { plan.updatedAt = new Date().toISOString(); plans[concept.slug] = plan; save(KEY, plans); }

function paint() {
  document.querySelectorAll('[data-venue-card]').forEach((card) => {
    const on = card.dataset.venueCard === plan.venueId;
    card.dataset.selected = String(on);
    const b = card.querySelector('[data-choose-venue]');
    b.setAttribute('aria-pressed', String(on));
    b.textContent = on ? 'GEKOZEN ✓' : 'KIES DEZE PLEK +';
  });
  document.querySelectorAll('[data-supplier-card]').forEach((card) => {
    const on = plan.supplierIds.includes(card.dataset.supplierCard);
    card.dataset.selected = String(on);
    const b = card.querySelector('[data-choose-supplier]');
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = on ? 'GEKOZEN ✓' : 'VOEG TOE <span aria-hidden="true">+</span>';
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
  bar.hidden = count === 0;
  bar.querySelector('[data-selection-count]').textContent = `${count} ${count === 1 ? 'ONDERDEEL' : 'ONDERDELEN'} GEKOZEN`;
}

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
  if (vb) {
    const id = vb.dataset.chooseVenue;
    plan.venueId = plan.venueId === id ? null : id; // één locatie tegelijk
    statusEl.textContent = plan.venueId ? `${data.venues[id].name} staat in je plan.` : 'Locatie uit je plan gehaald.';
  } else if (sb) {
    const id = sb.dataset.chooseSupplier;
    plan.supplierIds = plan.supplierIds.includes(id) ? plan.supplierIds.filter((x) => x !== id) : [...plan.supplierIds, id];
    statusEl.textContent = plan.supplierIds.includes(id) ? `${data.suppliers[id].name} toegevoegd.` : `${data.suppliers[id].name} verwijderd.`;
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

persist();
paint();

/* ---------- Concept op maat (vragenlijst → compleet draaiboek) ---------- */
import { tailor, toText, formatDate, quoteRequests, callsheet, budgetCsv } from './lib/tailor.js';

const tForm = document.querySelector('[data-tailor-form]');
const tOut = document.querySelector('[data-tailor-output]');
const tStatus = document.querySelector('[data-tailor-status]');
const escT = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

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
  <h3 class="tl-display tl-display--md">${escT(concept.title)}<br><span class="tl-accent">VOOR ${t.guests ? `${t.guests} GASTEN` : 'JOUW GROEP'}.</span></h3>
  <dl class="tl-facts tl-facts--on-dark">
    <div><dt>DOEL</dt><dd>${escT(a.doel || concept.objective)}</dd></div>
    <div><dt>LOCATIE</dt><dd>${escT(t.fit.text)}</dd></div>
    <div><dt>MAKERS</dt><dd>${t.suppliers.length ? t.suppliers.map((s) => `${escT(s.name)} (${escT(s.role.toLowerCase())})`).join(' · ') : 'Nog geen makers gekozen.'}</dd></div>
  </dl>
  ${t.fit.status === 'warn' ? `<p class="tl-warning">${escT(t.fit.text)}</p>` : ''}
  ${t.variations.length ? `<h4 class="tl-mono tl-subhead tl-body--gap">AANBEVOLEN VARIANT</h4><dl class="tl-facts tl-facts--stack tl-facts--on-dark">${t.variations.map((v) => `<div><dt>${escT(v.title)}</dt><dd>${escT(v.text)}</dd></div>`).join('')}</dl>` : ''}
  <h4 class="tl-mono tl-subhead tl-body--gap">DAGDRAAIBOEK — START ${escT(a.start || '')}</h4>
  <div class="tl-runbook tl-runbook--on-dark">${t.runbook.map((r) => `<div class="tl-runbook__row"><span class="tl-runbook__time">${escT(r.time)}</span><span class="tl-runbook__duration" data-label="DUUR">${escT(r.duration)}</span><span><strong class="tl-runbook__title">${escT(r.title)}</strong><span class="tl-runbook__desc">${escT(r.description)}</span></span><span class="tl-runbook__meta" data-label="WIE">${escT(r.owner)}</span><span class="tl-runbook__meta" data-label="WAAR">${escT(r.space)}</span></div>`).join('')}</div>
  <h4 class="tl-mono tl-subhead tl-body--gap">AFTELPLANNING MET DATA</h4>
  <div class="tl-checklist tl-checklist--on-dark">${t.planning.map((p, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(p.when)}${p.date ? ` — VANAF ${escT(formatDate(p.date).toUpperCase())}` : ''}</strong><span class="tl-runbook__desc">${escT(p.title)}</span>${p.tasks.map((x, j) => check(`p${i}-${j}`, x)).join('')}</div>`).join('')}</div>
  <h4 class="tl-mono tl-subhead tl-body--gap">CATERING${t.guests ? ` VOOR ${t.guests} GASTEN` : ''}${t.diets.length ? ` · DIEETWENSEN: ${escT(t.diets.join(', ').toUpperCase())}` : ''}</h4>
  <div class="tl-menu tl-menu--on-dark">${(concept.catering?.moments || []).map((m) => `<div class="tl-menu__item"><span class="tl-menu__when">${escT(m.time)} / ${escT(m.moment)}</span><p class="tl-menu__dish">${escT(m.proposal)}</p><span class="tl-menu__meta">${escT(m.format)}</span></div>`).join('')}</div>
  <h4 class="tl-mono tl-subhead tl-body--gap">BEZETTING VOOR JOUW GROEP</h4>
  <dl class="tl-facts tl-facts--stack tl-facts--on-dark">${t.crew.map((c) => `<div><dt>${escT(c.role)} — ${escT(c.count)}</dt><dd>${escT(c.task)}</dd></div>`).join('')}</dl>
  <h4 class="tl-mono tl-subhead tl-body--gap">CHECKLIST</h4>
  <div class="tl-checklist tl-checklist--on-dark">${(concept.checklist || []).map((g, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(g.group)}</strong>${g.items.map((x, j) => check(`c${i}-${j}`, x)).join('')}</div>`).join('')}${t.extraChecks.length ? `<div class="tl-checklist__group"><strong class="tl-checklist__title">Op maat</strong>${t.extraChecks.map((x, j) => check(`x${j}`, x)).join('')}</div>` : ''}</div>
  <h4 class="tl-mono tl-subhead tl-body--gap">JOUW UITNODIGING</h4>
  <div class="tl-invite"><strong>${escT(t.invitation.subject)}</strong><p>${escT(t.invitation.text)}</p><p class="tl-note tl-on-dark-note">Herinnering: ${escT(t.invitation.reminder)}</p></div>
  <h4 class="tl-mono tl-subhead tl-body--gap">OFFERTEAANVRAGEN — KLAAR OM TE VERSTUREN</h4>
  ${(() => { const qs = quoteRequests(concept, t, data.quoteQuestions); return qs.length ? `<div class="tl-checklist tl-checklist--on-dark">${qs.map((q, i) => `<div class="tl-checklist__group"><strong class="tl-checklist__title">${escT(q.to)}</strong><span class="tl-runbook__desc">${escT(q.subject)}</span><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-copy-quote="${i}">KOPIEER AANVRAAG</button><a class="tl-text-button" href="${escT(q.url)}" target="_blank" rel="noopener noreferrer">PROFIEL ↗</a></div>`).join('')}</div>` : '<p class="tl-note tl-on-dark-note">Kies een locatie en makers in de kolommen hierboven; dan schrijven we voor elk een offerteaanvraag.</p>'; })()}
  <h4 class="tl-mono tl-subhead tl-body--gap">CALLSHEET — WIE IS WIE OP DE DAG</h4>
  <dl class="tl-facts tl-facts--stack tl-facts--on-dark">${callsheet(concept, t).map((r) => `<div><dt>${escT(r.role)}${r.arrive ? ` — AANWEZIG ${escT(r.arrive)}` : ''}</dt><dd>${escT([r.name, r.party].filter(Boolean).join(' · ') || 'Naam en telefoonnummer invullen')}</dd></div>`).join('')}</dl>
  <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-tailor-copy-status>Alles staat ook in de kopie: ook entertainment, ruimtes, risico's, kostenposten en evaluatie.</span>
    <span class="tl-chip-set"><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-download-budget>DOWNLOAD BEGROTING (CSV)</button><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-tailor-print>PRINT / BEWAAR ALS PDF</button><button class="tl-button tl-button--accent" type="button" data-tailor-copy>KOPIEER HET COMPLETE DRAAIBOEK ↗</button></span></div>`;
  tOut.hidden = false;
}

if (tForm) {
  fillForm(plan.answers);
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
  tOut.addEventListener('change', (e) => {
    const c = e.target.closest('[data-check]');
    if (!c) return;
    const set = new Set(plan.checked || []);
    c.checked ? set.add(c.dataset.check) : set.delete(c.dataset.check);
    plan.checked = [...set];
    persist();
  });
  tOut.addEventListener('click', async (e) => {
    if (e.target.closest('[data-tailor-print]')) { window.print(); return; }
    const st0 = tOut.querySelector('[data-tailor-copy-status]');
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
      try { await navigator.clipboard.writeText(text); st0.textContent = `Offerteaanvraag voor ${q.to} gekopieerd ✓`; }
      catch { fallback.value = text; fallback.hidden = false; fallback.select(); st0.textContent = 'Kopiëren lukt hier niet automatisch; selecteer de tekst in het tekstvak.'; }
      return;
    }
    if (!e.target.closest('[data-tailor-copy]')) return;
    const text = toText(concept, currentTailor(), labels);
    const st = tOut.querySelector('[data-tailor-copy-status]');
    try { await navigator.clipboard.writeText(text); st.textContent = 'Het complete draaiboek is gekopieerd ✓'; }
    catch { fallback.value = text; fallback.hidden = false; fallback.select(); st.textContent = 'Kopiëren lukt hier niet automatisch; selecteer de tekst in het tekstvak.'; }
  });
  // Locatie- of makerkeuze werkt het draaiboek bij als het al gemaakt is.
  document.addEventListener('click', (e) => { if (plan.answers && e.target.closest('[data-choose-venue],[data-choose-supplier],[data-plan-reset]')) setTimeout(renderTailored, 0); });
}
