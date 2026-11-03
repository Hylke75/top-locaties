// Locatiezoeker: filtert server-gerenderde kaarten (geen dubbele markup),
// houdt filterstatus in de URL, toont lege/fout-states en onbekende capaciteit apart.
import { load, save, readData } from './lib/store.js';

const root = document.querySelector('[data-finder]');
const form = document.querySelector('[data-finder-search]');
const errorEl = document.querySelector('[data-error]');
try {
  init();
} catch (err) {
  console.error(err);
  errorEl.hidden = false;
}

function init() {
  const { labels } = readData();
  const $ = (s) => document.querySelector(s);
  const pad = (n) => String(n).padStart(2, '0');
  const norm = (s) => s.toLocaleLowerCase('nl-NL').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const catalog = $('[data-catalog]');
  const cards = [...catalog.querySelectorAll('[data-venue]')];
  const unknownHead = $('[data-unknown-head]');
  const regionView = $('[data-region-view]');
  const panel = $('#filterPanel');
  const toggle = $('[data-filter-toggle]');
  const els = { q: $('#q'), regio: $('#regio'), gasten: $('#gasten'), concept: $('#concept'), sort: $('#sort') };
  const checks = (name) => [...root.querySelectorAll(`input[name="${name}"]`)];
  let view = 'beeld';
  let saved = new Set(load('tl-saved-venues', []));

  // Startstatus uit URL (terugknop en deelbare links behouden filters).
  const params = new URLSearchParams(location.search);
  for (const k of ['q', 'regio', 'gasten', 'concept', 'sort']) if (params.get(k)) els[k].value = params.get(k);
  for (const name of ['type', 'karakter']) {
    const vals = (params.get(name) || '').split(',');
    checks(name).forEach((c) => { c.checked = vals.includes(c.value); });
  }
  if (params.get('weergave') === 'regio') view = 'regio';

  function state() {
    return {
      q: els.q.value.trim(), regio: els.regio.value, gasten: els.gasten.value, concept: els.concept.value, sort: els.sort.value,
      type: checks('type').filter((c) => c.checked).map((c) => c.value),
      karakter: checks('karakter').filter((c) => c.checked).map((c) => c.value),
    };
  }

  function writeUrl(s) {
    const p = new URLSearchParams();
    for (const k of ['q', 'regio', 'gasten', 'concept', 'sort']) if (s[k]) p.set(k, s[k]);
    if (s.type.length) p.set('type', s.type.join(','));
    if (s.karakter.length) p.set('karakter', s.karakter.join(','));
    if (view === 'regio') p.set('weergave', 'regio');
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
  }

  function evaluate(card, s) {
    const d = card.dataset;
    const has = (attr, list) => !list.length || list.some((x) => d[attr].split(' ').includes(x));
    const textOk = !s.q || norm(d.search).includes(norm(s.q));
    const ok = textOk && (!s.regio || d.province === s.regio) && (!s.concept || d.concepts.split(' ').includes(s.concept)) && has('events', s.type) && has('character', s.karakter);
    if (!ok) return 'out';
    if (!s.gasten) return 'in';
    const n = Number(s.gasten);
    if (d.capMax === '') return 'unknown';
    const min = d.capMin === '' ? 0 : Number(d.capMin);
    return Number(d.capMax) >= n && min <= n ? 'in' : 'out';
  }

  function sortCards(list, s) {
    const by = {
      '': (a, b) => a.dataset.order - b.dataset.order,
      naam: (a, b) => a.dataset.name.localeCompare(b.dataset.name, 'nl'),
      plaats: (a, b) => a.dataset.city.localeCompare(b.dataset.city, 'nl') || a.dataset.name.localeCompare(b.dataset.name, 'nl'),
      capaciteit: (a, b) => (Number(b.dataset.capMax) || 0) - (Number(a.dataset.capMax) || 0),
    }[s.sort] || ((a, b) => a.dataset.order - b.dataset.order);
    return list.sort(by);
  }

  function chip(label, clear) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = `${label} ×`; b.setAttribute('aria-label', `Verwijder filter ${label}`);
    b.addEventListener('click', () => { clear(); render(); });
    return b;
  }

  function render() {
    const s = state();
    const results = cards.map((c) => [c, evaluate(c, s)]);
    const inList = sortCards(results.filter(([, r]) => r === 'in').map(([c]) => c), s);
    const unknown = sortCards(results.filter(([, r]) => r === 'unknown').map(([c]) => c), s);
    results.forEach(([c, r]) => { c.hidden = r === 'out'; });
    [...inList, unknownHead, ...unknown].forEach((el) => catalog.appendChild(el));
    unknownHead.hidden = !unknown.length;
    [...inList, ...unknown].forEach((c, i) => { c.querySelector('[data-index]').textContent = pad(i + 1); });

    const visibleIds = new Set([...inList, ...unknown].map((c) => c.dataset.venue));
    regionView.querySelectorAll('[data-region-item]').forEach((a) => { a.hidden = !visibleIds.has(a.dataset.regionItem); });
    regionView.querySelectorAll('[data-region]').forEach((g) => { g.hidden = !g.querySelector('[data-region-item]:not([hidden])'); });

    const total = inList.length + unknown.length;
    $('[data-result-count]').textContent = pad(total);
    $('[data-apply-count]').textContent = total;
    $('[data-result-label]').textContent = `DE COLLECTIE / ${s.regio ? s.regio.toUpperCase() : 'NEDERLAND'}${s.gasten ? ` / PLEK VOOR ${s.gasten} GASTEN` : ''}`;
    $('[data-result-status]').textContent = `${total} ${total === 1 ? 'locatie' : 'locaties'} gevonden${unknown.length ? `, waarvan ${unknown.length} met onbekende capaciteit` : ''}.`;
    $('[data-empty]').hidden = total > 0;
    catalog.hidden = view !== 'beeld' || total === 0;
    regionView.hidden = view !== 'regio' || total === 0;
    root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));

    const active = $('[data-active-filters]');
    active.replaceChildren();
    if (s.q) active.append(chip(`"${s.q}"`, () => { els.q.value = ''; }));
    if (s.regio) active.append(chip(s.regio, () => { els.regio.value = ''; }));
    if (s.gasten) active.append(chip(`${s.gasten}+ gasten`, () => { els.gasten.value = ''; }));
    if (s.concept) active.append(chip(labels.concept[s.concept], () => { els.concept.value = ''; }));
    for (const name of ['type', 'karakter']) s[name].forEach((v) => active.append(chip(labels[name][v], () => { checks(name).find((c) => c.value === v).checked = false; })));
    const n = active.children.length;
    $('[data-filter-count]').textContent = n ? `(${n} ACTIEF)` : '';

    cards.forEach((c) => {
      const b = c.querySelector('[data-save]');
      const on = saved.has(c.dataset.venue);
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? '✓' : '+';
      b.setAttribute('aria-label', `${on ? 'Verwijder' : 'Bewaar'} ${c.dataset.name}`);
    });
    $('[data-saved-count]').textContent = `${saved.size} BEWAARD`;
    writeUrl(s);
  }

  function reset() {
    form.reset(); els.concept.value = ''; els.sort.value = '';
    checks('type').concat(checks('karakter')).forEach((c) => { c.checked = false; });
    render();
  }

  const toast = $('[data-toast]');
  let toastTimer;
  function notify(text) { toast.textContent = text; toast.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 1800); }

  form.addEventListener('submit', (e) => { e.preventDefault(); render(); $('#resultTitle').scrollIntoView({ block: 'start' }); });
  els.q.addEventListener('input', () => { clearTimeout(els.q._t); els.q._t = setTimeout(render, 180); });
  [els.regio, els.gasten, els.concept, els.sort].forEach((el) => el.addEventListener('change', render));
  root.addEventListener('change', (e) => { if (e.target.matches('input[type="checkbox"]')) render(); });
  root.querySelectorAll('[data-reset]').forEach((b) => b.addEventListener('click', reset));
  root.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { view = b.dataset.view; render(); }));
  document.querySelectorAll('[data-reload]').forEach((b) => b.addEventListener('click', () => location.reload()));
  const setPanel = (open) => { panel.dataset.open = String(open); toggle.setAttribute('aria-expanded', String(open)); };
  toggle.addEventListener('click', () => setPanel(panel.dataset.open !== 'true'));
  $('[data-apply]').addEventListener('click', () => { setPanel(false); toggle.focus(); $('#resultTitle').scrollIntoView({ block: 'start' }); });
  catalog.addEventListener('click', (e) => {
    const b = e.target.closest('[data-save]');
    if (!b) return;
    const id = b.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    save('tl-saved-venues', [...saved]);
    notify(saved.has(id) ? 'LOCATIE BEWAARD ✓' : 'LOCATIE VERWIJDERD');
    render();
  });
  render();
}
