// Gevoelskompas (home, /eventconcepten/, /eventconcepten/op-gevoel/): max. 2 keuzes,
// derde keuze vervangt de oudste (FO §7.2), uitlegbare matches, keuze in URL (?gevoel=).
import { toggleFeeling, rankConcepts, explainMatch, parseFeelingParam } from './lib/rank.js';
import { readData } from './lib/store.js';

const data = readData();
const labels = Object.fromEntries(data.feelings.map((f) => [f.id, f.label]));
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const notice = document.querySelector('[data-feel-notice]');

/* ---- Gevoelskompas ---- */
const grid = document.querySelector('[data-feeling-grid]');
const matchGrid = document.querySelector('[data-match-grid]');
const heading = document.querySelector('[data-match-heading]');
const reset = document.querySelector('[data-feel-reset]');
const status = document.querySelector('[data-match-status]');
let selected = [];

function card(entry, i) {
  const { concept, kind } = entry;
  const q = selected.length ? `?gevoel=${selected.join(',')}` : '';
  const rank = kind === 'match' ? (i === 0 ? 'ONZE MATCH' : 'OOK EEN MATCH') : kind === 'alternative' ? 'ANDERE RICHTING' : i === 0 ? 'UITGELICHT' : 'NOG EEN IDEE';
  const cls = ['tl-match', i === 0 && kind !== 'alternative' ? 'tl-match--first' : '', kind === 'alternative' ? 'tl-match--alt' : ''].join(' ').trim();
  return `<a class="${cls}" href="/eventconcepten/${concept.slug}/${q}"><span class="tl-mono">${pad(i + 1)} / ${rank}</span><strong class="tl-match__name">${esc(concept.title)}</strong><span class="tl-match__reason">${esc(explainMatch(entry, labels))}</span><span class="tl-match__footer"><span>BEKIJK HET VOLLEDIGE CONCEPT</span><span aria-hidden="true">↗</span></span></a>`;
}

function paint() {
  grid.querySelectorAll('[data-feel]').forEach((b) => {
    const on = selected.includes(b.dataset.feel);
    b.setAttribute('aria-pressed', String(on));
    b.querySelector('.tl-feeling__check').textContent = on ? '✓' : '+';
  });
  const ranked = rankConcepts(data.concepts, selected);
  matchGrid.innerHTML = ranked.map(card).join('');
  const hits = ranked.filter((r) => r.kind === 'match').length;
  heading.textContent = !selected.length ? 'VERRASSENDE IDEEËN.' : hits ? 'DIT PAST BIJ JOU.' : 'ANDERE RICHTINGEN.';
  reset.hidden = !selected.length;
  status.textContent = selected.length
    ? `Gekozen: ${selected.map((f) => labels[f]).join(' en ')}. ${hits} passende ${hits === 1 ? 'concept' : 'concepten'}.`
    : 'Geen gevoel gekozen.';
  try { sessionStorage.setItem('tl-feelings', JSON.stringify(selected)); } catch {}
  const url = new URL(location.href);
  if (selected.length) url.searchParams.set('gevoel', selected.join(',')); else url.searchParams.delete('gevoel');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  document.dispatchEvent(new CustomEvent('tl:feelings', { detail: selected }));
}

grid.addEventListener('click', (e) => {
  const b = e.target.closest('[data-feel]');
  if (!b) return;
  const before = selected.length;
  selected = toggleFeeling(selected, b.dataset.feel);
  notice.textContent = before === 2 && selected.length === 2 && selected.includes(b.dataset.feel) ? 'Je kunt twee gevoelens kiezen — de oudste keuze is vervangen.' : '';
  paint();
});
reset.addEventListener('click', () => { selected = []; paint(); grid.querySelector('[data-feel]').focus(); });
const fromUrl = parseFeelingParam(new URLSearchParams(location.search).get('gevoel'), Object.keys(labels));
let fromSession = [];
try { fromSession = JSON.parse(sessionStorage.getItem('tl-feelings') || '[]').filter((f) => labels[f]).slice(0, 2); } catch {}
selected = fromUrl.length ? fromUrl : fromSession;
if (selected.length) paint();

