// /mijn-plan/: toont de lokaal bewaarde plannen per concept. Een locatie die niet (meer)
// als aangesloten partner gepubliceerd is, wordt NIET als geschikte optie getoond (bouwplan P-UI-05).
import { load, save, readData } from './lib/store.js';
import { sharePlan, loadSharedPlan, adoptPlan, toConceptData } from './lib/sharedplan.js';
import * as A from './lib/account.js';
import { baseConcept } from './lib/conceptdata.js';

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
      <span class="tl-chip-set"><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-plan-remove="${esc(slug)}">VERWIJDER</button><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-plan-copy-one="${esc(slug)}">KOPIEER ALS BRIEFING</button><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-plan-share="${esc(slug)}">DEEL MET EEN LINK</button><a class="tl-button tl-button--accent" href="/eventconcepten/${esc(slug)}/#samenstellen">STEL MIJN PLAN SAMEN ↗</a></span></div>
      <p class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-share-out="${esc(slug)}"></p>
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
  const sh = e.target.closest('[data-plan-share]');
  if (sh) {
    const slug = sh.dataset.planShare; const out = list.querySelector(`[data-share-out="${slug}"]`);
    out.textContent = 'DEELLINK WORDT GEMAAKT…';
    try {
      const { url } = await sharePlan(slug, plans()[slug]);
      let copied = false; try { await navigator.clipboard.writeText(url); copied = true; } catch {}
      out.innerHTML = `${copied ? 'LINK GEKOPIEERD ✓ ' : 'JOUW LINK: '}<a href="${esc(url)}">${esc(url)}</a> — 180 dagen geldig, zonder naam of e-mail.`;
    } catch (err) { out.textContent = err.message; }
    return;
  }
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

/* ---------- Gedeeld plan openen (?p=<id>) ---------- */
const sharedBox = document.querySelector('[data-shared-plan]');
const sharedId = new URLSearchParams(location.search).get('p');
if (sharedId) (async () => {
  sharedBox.hidden = false;
  sharedBox.innerHTML = '<p class="tl-mono">GEDEELD PLAN LADEN…</p>';
  try {
    const sp = await loadSharedPlan(sharedId);
    const c = sp && data.concepts[sp.base_slug];
    if (!c) { sharedBox.innerHTML = '<div class="tl-state tl-state--empty"><h2 class="tl-state__title">LINK VERLOPEN.</h2><p>Dit gedeelde plan bestaat niet (meer). Deellinks zijn 180 dagen geldig.</p></div>'; return; }
    const d = sp.data || {};
    const v = d.venueId && data.venues[d.venueId];
    const sups = (d.supplierIds || []).filter((id) => data.suppliers[id]);
    const a = d.answers || {};
    sharedBox.innerHTML = `<article class="tl-plan-item tl-plan-item--shared"><div class="tl-plan-item__head"><div><span class="tl-mono">GEDEELD MET JOU / GELDIG TOT ${esc(new Date(sp.expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase())}</span><h2 class="tl-plan-item__title"><a href="/eventconcepten/${esc(sp.base_slug)}/">${esc(c.title)} ↗</a></h2></div>
      <span class="tl-chip-set"><button class="tl-button tl-button--accent" type="button" data-adopt>NEEM OVER IN MIJN PLANNEN ↓</button></span></div>
      <div class="tl-composer__grid tl-composer__grid--three">
        <div class="tl-composer__column"><span class="tl-mono">01 / GEVOEL</span><div class="tl-composer__result">${esc((d.feelings && d.feelings.length ? d.feelings : c.feelings).map((f) => labels[f]).join(' · '))}</div></div>
        <div class="tl-composer__column"><span class="tl-mono">02 / LOCATIE</span><div class="tl-composer__result">${v ? `<a href="${v.page}">${esc(v.name)}</a>, ${esc(v.city)}` : 'Nog geen locatie gekozen.'}</div></div>
        <div class="tl-composer__column"><span class="tl-mono">03 / MAKERS</span><div class="tl-composer__result">${sups.length ? sups.map((id) => `<a href="${data.suppliers[id].page}">${esc(data.suppliers[id].name)}</a>`).join(' · ') : 'Nog geen makers gekozen.'}</div></div>
      </div>${a.gasten || a.datum ? `<p class="tl-mono tl-on-dark-note">${[a.gasten && `${esc(a.gasten)} GASTEN`, a.datum && esc(new Date(`${a.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase())].filter(Boolean).join(' / ')}</p>` : ''}
      <p class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-adopt-status></p></article>`;
    sharedBox.querySelector('[data-adopt]').addEventListener('click', () => {
      const exists = plans()[sp.base_slug] && meaningful(plans()[sp.base_slug]);
      if (exists && !confirm(`Je hebt al een plan voor “${c.title}”. Vervangen door het gedeelde plan?`)) return;
      const ok = adoptPlan(sp.base_slug, d);
      sharedBox.querySelector('[data-adopt-status]').textContent = ok ? 'OVERGENOMEN ✓ — je vindt het hieronder en op de conceptpagina.' : 'Deze browser staat opslaan niet toe.';
      render();
    });
  } catch (err) { sharedBox.innerHTML = `<div class="tl-state tl-state--error"><h2 class="tl-state__title">NIET GELADEN.</h2><p>${esc(err.message)}</p></div>`; }
})();

/* ---------- Bewaren in een account: lokale plannen gaan mee ---------- */
A.configure(data.accounts);
const keepStatus = document.querySelector('[data-keep-status]');
async function importPlans() {
  const all = plans();
  const entries = Object.entries(all).filter(([slug, p]) => data.concepts[slug] && meaningful(p) && !p.accountId);
  if (!entries.length) { keepStatus.textContent = 'Alle plannen uit deze browser staan al in je account.'; return; }
  keepStatus.textContent = `${entries.length} ${entries.length === 1 ? 'PLAN' : 'PLANNEN'} WORDEN MEEGENOMEN…`;
  let done = 0;
  for (const [slug, p] of entries) {
    try {
      const base = await baseConcept(slug);
      const d = toConceptData(base, p);
      const row = await A.createConcept({ base_slug: slug, title: d.title, data: d });
      all[slug] = { ...p, accountId: row?.id || row?.[0]?.id || true }; done++;
    } catch (err) { keepStatus.textContent = A.message(err); save(KEY, all); return; }
  }
  save(KEY, all);
  keepStatus.innerHTML = `${done} ${done === 1 ? 'PLAN' : 'PLANNEN'} IN JE ACCOUNT ✓ — <a href="/account/">open Mijn concepten ↗</a>`;
}
(async () => {
  if (!A.enabled()) { document.querySelector('[data-keep]').hidden = true; return; }
  const s = await A.session().catch(() => null);
  if (!s) return;
  document.querySelector('[data-keep-out]').hidden = true;
  document.querySelector('[data-keep-in]').hidden = false;
  document.querySelector('[data-keep-email]').textContent = s.user?.email || '';
  document.querySelector('[data-keep-import]').addEventListener('click', importPlans);
  if (new URLSearchParams(location.search).get('meenemen') === '1') { history.replaceState(null, '', location.pathname); importPlans(); }
})();
