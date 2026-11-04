// /zoeken/: zoeken over concepten, locaties en makers (index: /data/search.json).
import { search } from './lib/search.js';

const $ = (s) => document.querySelector(s);
const input = $('[data-search-input]');
const out = $('[data-search-results]');
const status = $('[data-search-status]');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TYPE = { concept: 'CONCEPT', locatie: 'LOCATIE', maker: 'MAKER' };
let index = null;
let type = new URLSearchParams(location.search).get('type') || '';

async function run(push) {
  const q = input.value.trim();
  const p = new URLSearchParams(); if (q) p.set('q', q); if (type) p.set('type', type);
  if (push) history.replaceState(null, '', `/zoeken/${p.toString() ? `?${p}` : ''}`);
  document.querySelectorAll('[data-search-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.searchType === type)));
  if (!q) { out.innerHTML = ''; status.textContent = 'Typ een zoekvraag.'; return; }
  try { index = index || await fetch('/data/search.json').then((r) => r.json()); } catch { status.textContent = 'Zoeken is even niet beschikbaar. Probeer het opnieuw.'; return; }
  const { results, size } = search(index, q, type);
  status.textContent = results.length
    ? `${results.length} ${results.length === 1 ? 'resultaat' : 'resultaten'}${size ? ` — passend bij ${size} personen (capaciteit volgens Greenbookings)` : ''}.`
    : 'Geen resultaten. Haal een woord weg of zoek op plaats of soort bijeenkomst.';
  out.innerHTML = results.slice(0, 60).map((r, i) => `<li class="tl-search__item"><span class="tl-mono">${String(i + 1).padStart(2, '0')} / ${TYPE[r.t]}</span><a class="tl-search__title" href="${esc(r.url)}">${esc(r.title)} ↗</a><span class="tl-mono tl-note">${esc(r.sub || '')}</span></li>`).join('');
}
let t = null;
input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(true), 180); });
$('[data-search-form]').addEventListener('submit', (e) => { e.preventDefault(); run(true); out.querySelector('a')?.focus(); });
document.querySelectorAll('[data-search-type]').forEach((b) => b.addEventListener('click', () => { type = b.dataset.searchType; run(true); }));
input.value = new URLSearchParams(location.search).get('q') || '';
run(false);
