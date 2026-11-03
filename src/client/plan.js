// /mijn-plan/: toont de lokaal bewaarde plannen per concept. Een locatie die niet (meer)
// als aangesloten partner gepubliceerd is, wordt NIET als geschikte optie getoond (bouwplan P-UI-05).
import { load, save, readData } from './lib/store.js';

const data = readData();
const labels = Object.fromEntries(data.feelings.map((f) => [f.id, f.label]));
const KEY = 'tl-plans-v1';
const list = document.querySelector('[data-plan-list]');
const status = document.querySelector('[data-plan-page-status]');
const fallback = document.querySelector('[data-plan-page-fallback]');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let storageOk = true;
try { localStorage.setItem('tl-probe', '1'); localStorage.removeItem('tl-probe'); } catch { storageOk = false; }

function plans() { return load(KEY, {}); }
function meaningful(p) { return p && (p.venueId || (p.supplierIds || []).length); }

function text(slug, p) {
  const c = data.concepts[slug];
  const v = p.venueId && data.venues[p.venueId];
  const feel = (p.feelings && p.feelings.length ? p.feelings : c.feelings).map((f) => labels[f]).join(', ');
  return ['TOP LOCATIES — CONCEPTPLAN', c.title, c.proposition, '', `GEWENST GEVOEL: ${feel}`, '', 'LOCATIE:',
    v ? `- ${v.name} (${v.city}) — ${v.url}` : '- Nog niet gekozen', '', 'MAKERS:',
    ...((p.supplierIds || []).filter((id) => data.suppliers[id]).map((id) => `- ${data.suppliers[id].name}, ${(data.roles[slug] || {})[id] || 'maker'} — ${data.suppliers[id].url}`)),
    ...((p.supplierIds || []).filter((id) => data.suppliers[id]).length ? [] : ['- Nog niet gekozen']),
    '', `Concept: ${data.origin}/eventconcepten/${slug}/`,
    'Let op: dit is een inspiratieplan, geen boeking. Beschikbaarheid, capaciteit en prijs bevestig je bij de locatie en leveranciers.'].join('\n');
}

function render() {
  if (!storageOk) { document.querySelector('[data-plan-error]').hidden = false; return; }
  const all = plans();
  const entries = Object.entries(all).filter(([slug, p]) => data.concepts[slug] && meaningful(p))
    .sort((a, b) => String(b[1].updatedAt).localeCompare(String(a[1].updatedAt)));
  document.querySelector('[data-plan-empty]').hidden = entries.length > 0;
  list.innerHTML = entries.map(([slug, p], i) => {
    const c = data.concepts[slug];
    const v = p.venueId && data.venues[p.venueId];
    const lost = p.venueId && !v;
    const sups = (p.supplierIds || []).filter((id) => data.suppliers[id]);
    const feel = (p.feelings && p.feelings.length ? p.feelings : c.feelings).map((f) => labels[f]).join(' · ');
    return `<article class="tl-plan-item" data-plan-item="${esc(slug)}">
      <div class="tl-plan-item__head"><div><span class="tl-mono">${String(i + 1).padStart(2, '0')} / CONCEPTPLAN</span><h2 class="tl-plan-item__title"><a href="/eventconcepten/${esc(slug)}/#samenstellen">${esc(c.title)} ↗</a></h2></div>
      <span class="tl-chip-set"><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-plan-remove="${esc(slug)}">VERWIJDER</button><button class="tl-button tl-button--accent" type="button" data-plan-copy-one="${esc(slug)}">KOPIEER ALS BRIEFING ↗</button></span></div>
      <div class="tl-composer__grid tl-composer__grid--three">
        <div class="tl-composer__column"><span class="tl-mono">01 / GEWENST GEVOEL</span><div class="tl-composer__result">${esc(feel)}</div></div>
        <div class="tl-composer__column"><span class="tl-mono">02 / LOCATIE</span><div class="tl-composer__result">${v ? `<a href="${v.page}">${esc(v.name)}</a>, ${esc(v.city)}` : 'Nog geen locatie gekozen.'}${lost ? '<span class="tl-warning">De eerder gekozen locatie is niet meer beschikbaar als aangesloten partner en is uit je plan gehaald.</span>' : ''}</div></div>
        <div class="tl-composer__column"><span class="tl-mono">03 / MAKERS</span><div class="tl-composer__result">${sups.length ? sups.map((id) => `<a href="${data.suppliers[id].page}">${esc(data.suppliers[id].name)}</a>`).join(' · ') : 'Nog geen makers gekozen.'}</div></div>
      </div></article>`;
  }).join('');
}

list.addEventListener('click', async (e) => {
  const rm = e.target.closest('[data-plan-remove]');
  const cp = e.target.closest('[data-plan-copy-one]');
  if (rm) {
    const all = plans(); delete all[rm.dataset.planRemove]; save(KEY, all);
    status.textContent = 'Plan verwijderd.'; render();
  } else if (cp) {
    const slug = cp.dataset.planCopyOne;
    const t = text(slug, plans()[slug]);
    try { await navigator.clipboard.writeText(t); status.textContent = 'Plan gekopieerd ✓'; fallback.hidden = true; }
    catch { fallback.value = t; fallback.hidden = false; fallback.select(); status.textContent = 'Kopiëren lukt hier niet automatisch. Selecteer de tekst hieronder.'; }
  }
});
render();
