// /presentatie/: liggende presentatie (16:9) van een standaard- of eigen concept; PDF via "Bewaar als PDF".
import * as A from './lib/account.js';
import { readData } from './lib/store.js';
import { partners, baseConcept, esc } from './lib/conceptdata.js';
import { merge } from './lib/userconcept.js';
import { exportConcept } from './lib/export-actions.js';
import { track } from './lib/track.js';

const cfg = readData();
A.configure(cfg.accounts);
const deck = document.querySelector('[data-deck]');
const status = document.querySelector('[data-deck-status]');
const params = new URLSearchParams(location.search);
let C = null; let P = null;

const lines = (arr) => (arr || []).map((l) => esc(l).replace(/\*(.+?)\*/g, '<span class="tl-accent">$1</span>')).join(' <br>');
const chunk = (xs, n) => { const out = []; for (let i = 0; i < (xs || []).length; i += n) out.push(xs.slice(i, i + n)); return out.length ? out : [[]]; };
const list = (xs) => `<ul class="tl-slide__list">${(xs || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

function slides(c) {
  const S = [];
  const add = (kind, n, title, inner, extra = '') => S.push({ kind, n, title, inner, extra });
  const feel = (c.feelings || []).map((f) => P.feelings[f] || f);
  const meta = [c.organisatie, c.datum && new Date(`${c.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), c.guests ? `${c.guests} gasten` : ''].filter(Boolean).join(' / ');

  add('cover', '', '', `<div class="tl-slide__cover-text"><span class="tl-slide__kicker">EVENTCONCEPT${meta ? ` / ${esc(meta.toUpperCase())}` : ''}</span>
    <h1 class="tl-slide__display">${lines(c.headline || [c.title])}</h1><p class="tl-slide__lead">${esc(c.proposition)}</p>
    <span class="tl-slide__kicker">${esc(feel.join(' + ').toUpperCase())}${c.duration ? ` / ${esc(c.duration.toUpperCase())}` : ''}</span></div>
    <figure class="tl-slide__photo"><img src="${esc(c.hero?.src)}" alt=""><figcaption>SFEERBEELD TER ILLUSTRATIE</figcaption></figure>`);

  add('text', '01', 'WAAROM DIT EVENT', `<div class="tl-slide__split"><div><p class="tl-slide__quote">${esc(c.objective)}</p><p>${esc(c.occasionText)}</p></div>
    <div class="tl-slide__cols3">${[['ORGANISATIE', c.goals?.business], ['DEELNEMER', c.goals?.participant], ['GEDRAG ERNA', c.goals?.behaviour]].map(([h, xs]) => `<div><h3 class="tl-slide__h3">${h}</h3>${list(xs)}</div>`).join('')}</div></div>`);

  if (c.audienceInsight || c.audiences) add('text', '02', 'VOOR WIE', `<div class="tl-slide__split"><div>${list(c.audiences)}</div><dl class="tl-slide__facts">${[['WAAROM ZE KOMEN', c.audienceInsight?.why], ['WAT ZE BOEIT', c.audienceInsight?.interests], ['WAT WE VERMIJDEN', c.audienceInsight?.avoid], ['ZO SPREKEN WE ZE AAN', c.audienceInsight?.approach]].filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`);

  add('idea', '03', 'HET IDEE', `<div class="tl-slide__split"><div><h2 class="tl-slide__display tl-slide__display--md">${lines(c.idea?.headline || [c.title])}</h2><p>${esc(c.idea?.body)}</p></div>
    <figure class="tl-slide__photo tl-slide__photo--inline"><img src="${esc(c.programImage?.src || c.hero?.src)}" alt=""><figcaption>SFEERBEELD TER ILLUSTRATIE</figcaption></figure></div>`);

  if ((c.journey || []).length) add('text', '04', 'ZO GAAT HET VOELEN', `<p class="tl-slide__lead">${esc(c.mood)}</p><ol class="tl-slide__journey">${c.journey.map((j, i) => `<li${i === 3 ? ' class="is-peak"' : ''}><span class="tl-slide__kicker">${String(i + 1).padStart(2, '0')} / ${esc(j.phase.toUpperCase())}</span><strong>${esc(j.title)}</strong><span>${esc(j.text)}</span></li>`).join('')}</ol>`);

  chunk(c.program, 6).forEach((part, k, all) => add('text', '05', `HET PROGRAMMA${all.length > 1 ? ` (${k + 1}/${all.length})` : ''}`, `<ol class="tl-slide__agenda">${part.map((p) => `<li><span class="tl-slide__time">${esc(p.time)}</span><div><strong>${esc(p.title)}</strong><span>${esc(p.description)}</span>${p.details?.result ? `<span class="tl-slide__result">→ ${esc(p.details.result)}</span>` : ''}</div></li>`).join('')}</ol>`));

  chunk(c.runbook, 11).forEach((part, k, all) => add('text', '06', `HET DRAAIBOEK${all.length > 1 ? ` (${k + 1}/${all.length})` : ''}`, `<table class="tl-slide__table"><thead><tr><th>TIJD</th><th>DUUR</th><th>ONDERDEEL</th><th>WIE</th><th>WAAR</th></tr></thead><tbody>${part.map((r) => `<tr><td>${esc(r.time)}</td><td>${esc(r.duration)}</td><td><strong>${esc(r.title)}</strong></td><td>${esc(r.owner)}</td><td>${esc(r.space)}</td></tr>`).join('')}</tbody></table>`));

  if (c.catering) add('text', '07', 'CATERING', `<div class="tl-slide__split"><div><p class="tl-slide__lead">${esc(c.catering.concept)}</p>${c.catering.drinks ? `<p><strong>Dranken.</strong> ${esc(c.catering.drinks)}</p>` : ''}</div>
    <ol class="tl-slide__agenda tl-slide__agenda--compact">${(c.catering.moments || []).slice(0, 6).map((m) => `<li><span class="tl-slide__time">${esc(m.time)}</span><div><strong>${esc(m.moment)}</strong><span>${esc(m.proposal)}</span></div></li>`).join('')}</ol></div>`);

  if ((c.entertainment || []).length) add('text', '08', 'ENTERTAINMENT', `<div class="tl-slide__grid">${c.entertainment.slice(0, 6).map((e) => `<div><span class="tl-slide__kicker">${esc((e.moment || '').toUpperCase())}</span><strong>${esc(e.option)}</strong><span>${esc(e.why)}</span></div>`).join('')}</div>`);

  const venues = (c.venueIds || []).map((v) => P.venues[v]).filter(Boolean);
  const sups = (c.supplierIds || []).map((s) => P.suppliers[s]).filter(Boolean);
  add('text', '09', 'LOCATIE EN MAKERS', `<div class="tl-slide__split"><div><h3 class="tl-slide__h3">LOCATIES</h3>${venues.length ? `<ul class="tl-slide__list">${venues.map((v) => `<li><strong>${esc(v.name)}</strong>, ${esc(v.city)}${v.capacityMax ? ` — tot ${v.capacityMax} gasten` : ''}</li>`).join('')}</ul>` : '<p>Nog te kiezen.</p>'}</div>
    <div><h3 class="tl-slide__h3">MAKERS</h3>${sups.length ? `<ul class="tl-slide__list">${sups.map((s) => `<li><strong>${esc(s.name)}</strong> — ${esc(s.role.toLowerCase())}</li>`).join('')}</ul>` : '<p>Nog te kiezen.</p>'}</div></div>
    <p class="tl-slide__note">Aangesloten Greenbookings-partners. Capaciteit volgens de bron; beschikbaarheid en prijs op te vragen bij de partner.</p>`);

  if ((c.communication || []).length) add('text', '10', 'COMMUNICATIE', `<table class="tl-slide__table"><thead><tr><th>WANNEER</th><th>KANAAL</th><th>BOODSCHAP</th></tr></thead><tbody>${c.communication.map((x) => `<tr><td>${esc(x.when)}</td><td>${esc(x.channel)}</td><td>${esc(x.message)}</td></tr>`).join('')}</tbody></table>`);

  const filled = (c.costs?.items || []).filter((it) => Number(it.amount) > 0);
  const eur = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const sub = (c.costs?.items || []).reduce((n, it) => n + (Number(it.amount) || 0), 0); const extra = Math.round(sub * (Number(c.costs?.contingency) || 0)) / 100;
  const costBlock = filled.length
    ? `<h3 class="tl-slide__h3">KOSTENRAMING (EIGEN BEDRAGEN)</h3><table class="tl-slide__table"><tbody>${c.costs.items.map((it) => `<tr><td>${esc(it.label)}</td><td>${Number(it.amount) > 0 ? eur(Number(it.amount)) : '—'}</td></tr>`).join('')}<tr><td>Onvoorzien (${esc(c.costs.contingency || 0)}%)</td><td>${eur(extra)}</td></tr><tr><td><strong>Totaal excl. btw</strong></td><td><strong>${eur(sub + extra)}</strong></td></tr></tbody></table>`
    : `<h3 class="tl-slide__h3">KOSTENPOSTEN</h3>${list(c.budgetItems)}<p class="tl-slide__note">Bedragen uit de offertes van locatie en makers.</p>`;
  add('text', '11', 'KOSTEN EN RISICO’S', `<div class="tl-slide__split"><div>${costBlock}</div>
    <div><h3 class="tl-slide__h3">RISICO’S EN PLAN B</h3><ul class="tl-slide__list">${(c.risks || []).slice(0, 5).map((r) => `<li><strong>${esc(r.risk)}</strong> — ${esc(r.mitigation)}</li>`).join('')}</ul></div></div>`);

  if ((c.kpis || []).length) add('text', '12', 'WAT HET OPLEVERT', `<table class="tl-slide__table"><thead><tr><th>DOEL</th><th>KPI</th><th>WANNEER</th><th>METEN</th></tr></thead><tbody>${c.kpis.map((k) => `<tr><td><strong>${esc(k.goal)}</strong></td><td>${esc(k.kpi)}</td><td>${esc(k.when)}</td><td>${esc(k.how)}</td></tr>`).join('')}</tbody></table>`);

  add('end', '', '', `<span class="tl-slide__kicker">VOLGENDE STAP</span><h2 class="tl-slide__display">LATEN WE HET <br><span class="tl-accent">WAARMAKEN.</span></h2>
    <ol class="tl-slide__steps"><li>Datum en aantallen bevestigen</li><li>Offertes bij locatie en makers</li><li>Draaiboek en callsheet delen</li></ol>`);
  return S;
}

function renderDeck() {
  const S = slides(C);
  const total = S.length;
  deck.innerHTML = S.map((s, i) => `<section class="tl-slide tl-slide--${s.kind}" aria-label="Dia ${i + 1} van ${total}">
    ${s.title ? `<header class="tl-slide__head"><span class="tl-slide__kicker">${s.n} / ${esc(C.title.toUpperCase())}</span><h2 class="tl-slide__title">${esc(s.title)}</h2></header>` : ''}
    <div class="tl-slide__body">${s.inner}</div>
    <footer class="tl-slide__foot"><span>TOP LOCATIES ✳</span><span>${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></footer>
  </section>`).join('');
  document.title = `Presentatie ${C.title} | Top Locaties`;
  status.textContent = `${total} DIA'S / LIGGEND 16:9`;
}

async function printPdf() {
  status.textContent = 'PDF WORDT VOORBEREID…';
  await Promise.all([...deck.querySelectorAll('img')].map((img) => (img.complete ? null : img.decode?.().catch(() => null))));
  status.textContent = 'KIES “BEWAAR ALS PDF” IN HET PRINTVENSTER';
  window.print();
}
document.querySelector('[data-deck-pdf]').addEventListener('click', printPdf);
document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', async () => {
  if (!C) return;
  try { status.textContent = (await exportConcept(b.dataset.export, C, P)).toUpperCase(); } catch (err) { status.textContent = String(err.message || err).toUpperCase(); }
}));

function fail(msg, loginNeeded) {
  const next = encodeURIComponent(location.pathname + location.search);
  deck.innerHTML = `<section class="tl-section"><div class="tl-state tl-state--${loginNeeded ? 'empty' : 'error'}"><h1 class="tl-state__title">${loginNeeded ? 'LOG IN.' : 'NIET GELADEN.'}</h1><p>${esc(msg)}</p>${loginNeeded ? `<a class="tl-button tl-button--accent" href="/account/?next=${next}">INLOGGEN ↗</a>` : '<a class="tl-button" href="/eventconcepten/">NAAR DE CONCEPTEN ↗</a>'}</div></section>`;
  status.textContent = '';
  document.querySelectorAll('[data-deck-pdf],[data-export]').forEach((b) => { b.disabled = true; });
}

(async () => {
  try {
    P = await partners();
    const id = params.get('id');
    const t = params.get('t');
    const back = document.querySelector('[data-deck-back]');
    if (t) {
      A.configure({ ...cfg.accounts, enabled: true }); // deellinks werken ook als accounts site-breed nog uit staan
      const row = await A.getShared(t);
      const base = await baseConcept(row.base_slug);
      C = merge(base, row.data);
      track('share_view', row.base_slug);
      back.href = '/'; back.textContent = '← TOP LOCATIES';
    } else if (id) {
      if (!A.enabled() || !(await A.session())) { fail('Eigen concepten zijn privé. Log in om de presentatie te maken.', true); return; }
      const row = await A.getConcept(id);
      const base = await baseConcept(row.base_slug);
      C = merge(base, row.data);
      back.href = `/maker/?id=${encodeURIComponent(id)}`; back.textContent = '← TERUG NAAR DE MAKER';
    } else if (!params.get('basis')) {
      // Rechtstreeks geopend: leg uit hoe je bij een presentatie komt, in plaats van eeuwig te laden.
      deck.innerHTML = `<section class="tl-section"><div class="tl-state tl-state--empty"><h1 class="tl-state__title">KIES EERST <br><span class="tl-accent">EEN CONCEPT.</span></h1><p>Een presentatie maak je vanuit een concept of vanuit je eigen plan. Open een concept en kies daar ‘Neem je plan mee’ → Presentatie, of ga naar Mijn plan.</p><span class="tl-chip-set"><a class="tl-button tl-button--accent" href="/mijn-plan/">NAAR MIJN PLAN ↗</a><a class="tl-button tl-button--outline" href="/eventconcepten/">ALLE CONCEPTEN ↗</a></span></div></section>`;
      status.textContent = '';
      document.querySelectorAll('[data-deck-pdf],[data-export]').forEach((b) => { b.disabled = true; });
      return;
    } else {
      const base = await baseConcept(params.get('basis'));
      C = merge(base, { venueIds: base.venueMatches.map((m) => m.venueId), supplierIds: base.supplierMatches.map((m) => m.supplierId) });
      back.href = `/eventconcepten/${base.slug}/`; back.textContent = '← TERUG NAAR HET CONCEPT';
    }
    renderDeck();
    if (location.hash === '#pdf') setTimeout(printPdf, 300);
  } catch (e) { fail(A.message(e)); }
})();
