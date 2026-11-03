// Conceptpagina: gevoelsignatuur, locatie-/makerselectie en de composer.
import { parseFeelingParam } from './lib/rank.js';
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

document.addEventListener('click', async (e) => {
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
