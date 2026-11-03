// Top Locaties — beheerinterface (praat alleen met scripts/admin.mjs).
const $ = (s, el = document) => el.querySelector(s);
const view = $('[data-view]');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
let me = null;
let content = null;

async function call(method, url, body) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(me ? { 'X-CSRF-Token': me.csrf } : {}) }, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && me) { me = null; location.hash = ''; location.reload(); }
  if (!res.ok) throw Object.assign(new Error(data.error || `Fout ${res.status}`), { data });
  return data;
}
function toast(text) {
  const t = $('[data-toast]'); t.textContent = text; t.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}
const overline = (l, r) => `<div class="tl-overline"><span>${esc(l)}</span><span>${esc(r)}</span></div>`;
const chief = () => me && me.role === 'hoofdredacteur';
const issues = (list, kind) => list.map((x) => `<li data-kind="${kind}">${esc(x)}</li>`).join('');

/* ---------- Inloggen ---------- */
$('[data-login]')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#email').value.trim();
  const secret = $('#token').value;
  try { await call('POST', '/admin/login', email ? { email, password: secret } : { token: secret.trim() }); start(); }
  catch (err) { $('[data-login-status]').textContent = err.message; }
});

async function start() {
  try { me = await call('GET', '/api/session'); } catch { return; }
  $('[data-admin-nav]').hidden = false;
  $('[data-menu-toggle]').hidden = false;
  const bar = $('[data-userbar]');
  bar.hidden = false;
  bar.innerHTML = `<span>INGELOGD ALS ${esc(me.name.toUpperCase())} / ${esc(me.role.toUpperCase())}</span><span>${chief() ? 'MAG PUBLICEREN' : 'OPSLAAN ALS DRAFT OF REVIEW'}</span>`;
  const toggle = $('[data-menu-toggle]'); const nav = $('#tl-nav');
  toggle.onclick = () => { const open = nav.dataset.open !== 'true'; nav.dataset.open = String(open); toggle.setAttribute('aria-expanded', String(open)); };
  nav.onclick = (e) => { if (e.target.closest('a')) { nav.dataset.open = 'false'; toggle.setAttribute('aria-expanded', 'false'); } };
  await reload();
  window.addEventListener('hashchange', route);
  route();
}
async function reload() { content = await call('GET', '/api/content'); }

function route() {
  const [name, arg] = (location.hash.slice(1) || 'dashboard').split('/');
  document.querySelectorAll('[data-admin-nav] a').forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === `#${name === 'concept' ? 'concepten' : name}`));
  const views = { gids: guideView, dashboard, concepten, concept: () => conceptEditor(arg), locaties, locatie: () => venueEditor(arg), makers, gevoelens, data: dataView, audit: auditView };
  (views[name] || dashboard)();
  window.scrollTo(0, 0);
}

/* ---------- Overzicht ---------- */
function dashboard() {
  const c = content.concepts;
  const count = (s) => c.filter((x) => x.status === s).length;
  const v = content.validation;
  const curated = content.venues.venues.length;
  view.innerHTML = `<section class="tl-section">
    ${overline('01 / OVERZICHT', `BRONSTAND ${content.snapshotMeta.syncedAt?.slice(0, 10) || 'ONBEKEND'}`)}
    <h1 class="tl-display tl-display--md">DE REDACTIE<br><span class="tl-accent">IN ÉÉN BLIK.</span></h1>
    <div class="ad-grid">
      <div class="ad-tile"><span class="tl-mono">CONCEPTEN LIVE</span><b>${pad(count('published'))}</b><span class="tl-note">${count('review')} in review · ${count('draft')} draft</span></div>
      <div class="ad-tile"><span class="tl-mono">AANGESLOTEN PARTNERS</span><b>${pad(content.partners.length)}</b><span class="tl-note">${curated} met redactie</span></div>
      <div class="ad-tile"><span class="tl-mono">MAKERS</span><b>${pad(content.suppliers.suppliers.length)}</b><span class="tl-note">voorlopige selectie</span></div>
      <div class="ad-tile"><span class="tl-mono">VALIDATIE</span><b>${pad(v.errors.length)}</b><span class="tl-note">fouten · ${v.warnings.length} aandachtspunten</span></div>
    </div>
    <div class="tl-columns tl-columns--equal">
      <div><h2 class="tl-display tl-display--sm">WAT AANDACHT<br>VRAAGT.</h2><ul class="ad-issues tl-note--gap">${issues(v.errors, 'error') + issues(v.warnings.slice(0, 30), 'warning') || '<li>Niets — alles is in orde.</li>'}</ul></div>
      <div><h2 class="tl-display tl-display--sm">LAATSTE<br>PUBLICATIE.</h2>
        <p class="tl-body tl-body--gap">${content.build ? `Gebouwd op ${esc(new Date(content.build.builtAt).toLocaleString('nl-NL'))}: ${content.build.pages} pagina's, ${content.build.partnerVenues} partnerlocaties.` : 'Nog niet gebouwd in deze omgeving.'}</p>
        <p class="tl-chip-set"><a class="tl-button" href="#concepten">CONCEPTEN BEHEREN ↗</a><a class="tl-button tl-button--outline" href="#data">DATA &amp; PUBLICATIE ↗</a><a class="tl-button tl-button--outline" href="/preview/" target="_blank" rel="noopener">BEKIJK DE SITE ↗</a></p>
      </div>
    </div></section>`;
}


/* ---------- Generieke repeaters voor het complete concept ---------- */
const SPECS = {
  program: [['time', 'Tijd'], ['title', 'Onderdeel'], ['description', 'Korte omschrijving', 'area'], ['d_intro', 'Pop-up: wat gebeurt er', 'area'], ['d_steps', 'Pop-up: zo pak je het aan (één stap per regel)', 'lines'], ['d_roles', 'Pop-up: wie (rollen, komma-gescheiden)', 'list'], ['d_needs', 'Pop-up: wat je nodig hebt (komma-gescheiden)', 'list'], ['d_tip', 'Pop-up: tip', 'area'], ['d_why', 'Waarom (functie voor het concept)', 'area'], ['d_result', 'Resultaat', 'area']],
  runbook: [['time', 'Tijd'], ['duration', 'Duur'], ['title', 'Onderdeel'], ['description', 'Beschrijving', 'area'], ['owner', 'Wie (rol)'], ['space', 'Waar'], ['needs', 'Nodig (komma-gescheiden)', 'list']],
  planning: [['when', 'Wanneer (bv. 8–4 WEKEN VOORAF)'], ['title', 'Fase'], ['tasks', 'Taken (één per regel)', 'lines']],
  moments: [['moment', 'Moment'], ['time', 'Tijd'], ['proposal', 'Voorstel (gerechten)', 'area'], ['format', 'Serveervorm'], ['dietary', 'Dieet']],
  entertainment: [['moment', 'Moment'], ['option', 'Wat'], ['format', 'Vorm / duur'], ['why', 'Waarom', 'area'], ['role', 'Rol']],
  crew: [['role', 'Rol'], ['count', 'Aantal (bv. 1 per 10–12 gasten)'], ['task', 'Taak']],
  spaces: [['space', 'Ruimte'], ['use', 'Gebruik'], ['requirements', 'Eisen']],
  checklist: [['group', 'Groep'], ['items', 'Items (één per regel)', 'lines']],
  variations: [['title', 'Variant'], ['text', 'Uitleg', 'area']],
  risks: [['risk', 'Risico'], ['mitigation', 'Plan B', 'area']],
  steps: [['when', 'Wanneer'], ['title', 'Stap'], ['items', 'Punten (één per regel)', 'lines']],
  journey: [['phase', 'Fase (Vooraf, Aankomst, Programma, Hoogtepunt, Afsluiting, Nazorg)'], ['title', 'Gewenst gevoel'], ['text', 'Contactmoment of actie', 'area']],
  communication: [['when', 'Wanneer'], ['channel', 'Middel'], ['message', 'Boodschap / gewenste actie', 'area']],
  kpis: [['goal', 'Doel'], ['kpi', 'KPI', 'area'], ['when', 'Meetmoment (direct / 30 / 60 / 90 dagen)'], ['how', 'Meetmethode']],
  agency: [['task', 'Wat een bureau doet'], ['here', 'Waar het op de site staat', 'area']],
};
function repItem(key, item = {}) {
  const spec = SPECS[key];
  const val = (f, kind) => (kind === 'list' ? (item[f] || []).join(', ') : kind === 'lines' ? (item[f] || []).join('\n') : item[f] ?? '');
  return `<div class="ad-repeat__item" style="--cols:${Math.min(spec.length, 4)}">${spec.map(([f, label, kind]) => `<label class="ad-field"><span>${esc(label)}</span>${kind === 'area' || kind === 'lines' ? `<textarea data-f="${f}" data-k="${kind || ''}">${esc(val(f, kind))}</textarea>` : `<input data-f="${f}" data-k="${kind || ''}" value="${esc(val(f, kind))}">`}</label>`).join('')}<button class="tl-button tl-button--outline" type="button" data-remove>×</button></div>`;
}
const repeater = (key, items) => `<div class="ad-repeat" data-rep="${key}">${(items || []).map((it) => repItem(key, it)).join('')}</div><div><button class="tl-button tl-button--outline" type="button" data-add-rep="${key}">TOEVOEGEN +</button></div>`;
function readRep(form, key) {
  return [...form.querySelectorAll(`[data-rep="${key}"] > .ad-repeat__item`)].map((row) => Object.fromEntries([...row.querySelectorAll('[data-f]')].map((el) => {
    const v = el.value.trim();
    return [el.dataset.f, el.dataset.k === 'list' ? v.split(',').map((x) => x.trim()).filter(Boolean) : el.dataset.k === 'lines' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : v];
  }))).filter((o) => Object.values(o).some((v) => (Array.isArray(v) ? v.length : v)));
}
const lines = (arr) => (arr || []).join('\n');
const fromLines = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);

/* ---------- Concepten ---------- */
function concepten() {
  const rows = content.concepts.slice().sort((a, b) => a.priority - b.priority).map((c) => `<div class="ad-row">
    <div><span class="tl-mono">CONCEPT ${esc(c.number)} / ${esc(c.categoryLabel || '')}</span><div class="ad-row__title">${esc(c.title)}</div></div>
    <div><span class="ad-status" data-s="${esc(c.status)}">${esc(c.status)}</span></div>
    <div class="tl-mono">${(c.venueMatches || []).length} LOCATIES · ${(c.supplierMatches || []).length} MAKERS</div>
    <div class="tl-chip-set"><a class="tl-button" href="#concept/${esc(c.slug)}">BEWERK ↗</a>${c.status === 'published' ? `<a class="tl-button tl-button--outline" href="/preview/eventconcepten/${esc(c.slug)}/" target="_blank" rel="noopener">BEKIJK ↗</a>` : ''}</div></div>`).join('');
  view.innerHTML = `<section class="tl-section">
    ${overline('02 / EVENTCONCEPTEN', 'DRAFT → REVIEW → PUBLISHED')}
    <div class="tl-section-head"><h1 class="tl-display tl-display--md">CONCEPTEN.</h1><p>Een redacteur schrijft en zet op review; de hoofdredacteur publiceert. Publiceren kan alleen als het concept volledig is (programma, 2–4 partnerlocaties met reden, uitleg per gevoel, SEO).</p></div>
    <div class="ad-list">${rows}</div>
    <form class="ad-form tl-note--gap" data-new><fieldset><legend>NIEUW CONCEPT</legend><div class="ad-two">
      <label class="ad-field"><span>Titel</span><input name="title" required placeholder="Bijv. De ochtend die alles opent"></label>
      <label class="ad-field"><span>Slug (URL)</span><input name="slug" required pattern="[a-z0-9-]{3,60}" placeholder="ochtend-die-opent"></label></div>
      <div><button class="tl-button" type="submit">MAAK DRAFT AAN +</button></div></fieldset></form></section>`;
  $('[data-new]').onsubmit = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { const r = await call('POST', '/api/concepts', { title: f.get('title'), slug: f.get('slug') }); await reload(); location.hash = `concept/${r.concept.slug}`; toast('Draft aangemaakt'); }
    catch (err) { toast(err.message); }
  };
}

const field = (label, name, value, opts = {}) => {
  const attrs = `name="${name}" ${opts.required ? 'required' : ''} ${opts.type === 'number' ? 'type="number" min="0"' : ''} ${opts.max ? `maxlength="${opts.max}"` : ''}`;
  const input = opts.area ? `<textarea ${attrs}>${esc(value)}</textarea>` : `<input ${attrs} value="${esc(value)}">`;
  return `<label class="ad-field"><span>${esc(label)}</span>${input}${opts.help ? `<small>${esc(opts.help)}</small>` : ''}</label>`;
};
// Kwaliteitsmodel (100 punten) — gelijk aan scripts/validate-content.mjs.
const QUALITY = [['doelen', 'Doelen helder en meetbaar', 25], ['doelgroep', 'Doelgroep aantoonbaar verwerkt', 20], ['originaliteit', 'Eigen creatieve kern', 15], ['betrokkenheid', 'Actieve betrokkenheid', 15], ['haalbaarheid', 'Haalbaar [locatie, partners, begroting]', 15], ['duurzaamheid', 'Duurzaamheid en inclusie', 10]];
const QUALITY_MIN = 70;
const qualityTotal = (q) => QUALITY.reduce((n, [k]) => n + (Number(q?.[k]) || 0), 0);
// Bestaande volgorde behouden; nieuw aangevinkte waarden achteraan.
const keepOrder = (prev = [], picked) => [...prev.filter((x) => picked.includes(x)), ...picked.filter((x) => !prev.includes(x))];
const opt = (v, l, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(l)}</option>`;

function conceptEditor(slug) {
  const c = content.concepts.find((x) => x.slug === slug);
  if (!c) { view.innerHTML = `<section class="tl-section"><div class="tl-state tl-state--empty"><h1 class="tl-state__title">NIET GEVONDEN.</h1><p>Dit concept bestaat niet.</p><a class="tl-button" href="#concepten">TERUG ↗</a></div></section>`; return; }
  const locked = !chief() && c.status === 'published';
  const feelings = content.feelings.feelings;
  const partners = content.partners.slice().sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  const suppliers = content.suppliers.suppliers;
  const supName = (id) => content.supplierSources.find((s) => s.greenbookingsSlug === (suppliers.find((x) => x.id === id) || {}).greenbookingsSlug)?.name || id;
  const venueSlugById = Object.fromEntries(content.venues.venues.map((v) => [v.id, v.greenbookingsSlug]));
  const vm = (c.venueMatches || []).map((m) => venueRow(venueSlugById[m.venueId] || m.venueId, m.reason, m)).join('');
  const smx = (c.supplierMatches || []).map((m) => supplierRow(m.supplierId, m.role, m.reason)).join('');
  function venueRow(sel, reason, m = {}) { return `<div class="ad-repeat__item" style="--cols:4"><label class="ad-field"><span>Aangesloten partnerlocatie</span><select name="v_slug">${partners.map((p) => opt(p.slug, `${p.name} — ${p.city}`, p.slug === sel)).join('')}</select></label><label class="ad-field"><span>Rol</span><select name="v_role">${opt('VOORKEUR', 'Voorkeur', m.role === 'VOORKEUR')}${opt('ALTERNATIEF', 'Alternatief', m.role !== 'VOORKEUR')}</select></label>${field('Redactionele reden (waarom hier?)', 'v_reason', reason)}${field('Pluspunt', 'v_pro', m.pro || '')}${field('Let op', 'v_watch', m.watch || '')}<button class="tl-button tl-button--outline" type="button" data-remove>×</button></div>`; }
  function supplierRow(sel, role, reason) { return `<div class="ad-repeat__item" style="--cols:3"><label class="ad-field"><span>Maker</span><select name="s_id">${suppliers.map((s) => opt(s.id, supName(s.id), s.id === sel)).join('')}</select></label>${field('Rol in dit concept', 's_role', role)}${field('Waarom deze maker', 's_reason', reason)}<button class="tl-button tl-button--outline" type="button" data-remove>×</button></div>`; }
  const statuses = chief() ? ['draft', 'review', 'published', 'archived'] : ['draft', 'review'];

  view.innerHTML = `<section class="tl-section">
    ${overline(`CONCEPT ${c.number} / ${c.status.toUpperCase()}`, locked ? 'LIVE — ALLEEN HOOFDREDACTEUR' : 'BEWERKEN')}
    <div class="tl-section-head"><h1 class="tl-display tl-display--md">${esc(c.title)}</h1><p><a class="tl-text-button" href="#concepten">← ALLE CONCEPTEN</a></p></div>
    ${locked ? '<p class="tl-warning">Dit concept staat live. Wijzigingen lopen via de hoofdredacteur.</p>' : ''}
    <form class="ad-form" data-concept-form>
      <fieldset ${locked ? 'disabled' : ''}><legend>01 / KERN</legend>
        <div class="ad-two">${field('Titel', 'title', c.title, { required: true })}${field('Slug', 'slug', c.slug, { required: true, help: 'Wijzigen verandert de URL.' })}</div>
        ${field('Kopregels (één per regel; *tekst* = koraal)', 'headline', (c.headline || []).join('\n'), { area: true, help: 'Breek bewust af — max. 2–3 korte regels.' })}
        <div class="ad-three">
          <label class="ad-field"><span>Type</span><select name="category">${(content.categories || []).map((x) => opt(x.id, x.label, c.category === x.id)).join('')}</select></label>
          ${field('Categorielabel', 'categoryLabel', c.categoryLabel)}${field('Format (mono)', 'format', c.format)}</div>
        <div class="ad-three">${field('Gasten min (indicatief)', 'guestCountMin', c.guestCountMin, { type: 'number' })}${field('Gasten max (indicatief)', 'guestCountMax', c.guestCountMax, { type: 'number' })}${field('Prioriteit (1 = eerst)', 'priority', c.priority, { type: 'number' })}</div>
        ${field('Teaser (kaarten)', 'teaser', c.teaser, { area: true })}${field('Belofte (hero)', 'proposition', c.proposition, { area: true })}
        ${field('Tags (komma-gescheiden)', 'tags', (c.tags || []).join(', '))}
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>02 / GEVOELSIGNATUUR (2–3, MET GEWICHT 1–5 EN UITLEG)</legend>
        ${feelings.map((f) => `<div class="ad-repeat__item" style="--cols:3"><label class="tl-check"><input type="checkbox" name="f_on" value="${f.id}" ${c.feelings.includes(f.id) ? 'checked' : ''}> ${esc(f.label)}</label>${field('Gewicht', `w_${f.id}`, (c.feelingWeights || {})[f.id] ?? 3, { type: 'number' })}${field('Waarom dit gevoel?', `r_${f.id}`, (c.feelingReasons || {})[f.id] || '')}<span></span></div>`).join('')}
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>03 / HET IDEE</legend>
        ${field('Intro-label (links)', 'idea_label', c.idea?.label, { area: true })}
        ${field('Kop (regels)', 'idea_headline', (c.idea?.headline || []).join('\n'), { area: true })}
        ${field('Verhaal', 'idea_body', c.idea?.body, { area: true })}
        ${field('Voor wie (komma-gescheiden)', 'audiences', (c.audiences || []).join(', '))}${field('Bedoeling', 'objective', c.objective)}
        ${field('Kernwaarden (TITEL: uitleg, één per regel)', 'values', (c.idea?.values || []).map(([t, x]) => `${t}: ${x}`).join('\n'), { area: true })}
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>04 / PROGRAMMA (MIN. 4) — MET DE INHOUD VAN DE POP-UP PER ONDERDEEL</legend>
        ${repeater('program', (c.program || []).map((p) => ({ time: p.time, title: p.title, description: p.description, d_intro: p.details?.intro, d_steps: p.details?.steps, d_roles: p.details?.roles, d_needs: p.details?.needs, d_tip: p.details?.tip, d_why: p.details?.why, d_result: p.details?.result })))}
        <small class="tl-note">De pop-up toont ook automatisch de draaiboekregels tussen dit en het volgende programmaonderdeel.</small>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>05 / LOCATIES (2–4 AANGESLOTEN PARTNERS, ELK MET REDEN)</legend>
        <div class="ad-repeat" data-venues>${vm}</div><div><button class="tl-button tl-button--outline" type="button" data-add="venue">LOCATIE TOEVOEGEN +</button></div>
        <small class="tl-note">De keuzelijst bevat uitsluitend gepubliceerde, aangesloten Greenbookings-partners.</small>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>06 / MAKERS EN ROLLEN</legend>
        ${field('Benodigde rollen (komma-gescheiden)', 'supplierRoles', (c.supplierRoles || []).join(', '))}
        <div class="ad-repeat" data-suppliers>${smx}</div><div><button class="tl-button tl-button--outline" type="button" data-add="supplier">MAKER TOEVOEGEN +</button></div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>07 / HET COMPLETE DRAAIBOEK (MIN. 8 ONDERDELEN)</legend>
        ${field('Duur en opbouw (bv. 1 dag 09:00–17:30, opbouw de dag ervoor)', 'duration', c.duration)}
        ${repeater('runbook', c.runbook)}
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>08 / AFTELPLANNING (MIN. 4 FASEN)</legend>${repeater('planning', c.planning)}</fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>09 / CATERINGVOORSTEL</legend>
        ${field('Cateringconcept', 'cat_concept', c.catering?.concept, { area: true })}
        ${repeater('moments', c.catering?.moments)}
        <div class="ad-two">${field('Dranken', 'cat_drinks', c.catering?.drinks, { area: true })}${field('Notities voor de cateraar', 'cat_notes', c.catering?.notes, { area: true })}</div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>10 / ENTERTAINMENT</legend>${repeater('entertainment', c.entertainment)}</fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>11 / BEZETTING EN RUIMTES</legend>${repeater('crew', c.crew)}${repeater('spaces', c.spaces)}<small class="tl-note">Tip: schrijf aantallen als “1 per 10–12 gasten” — de site rekent dat om voor de groep van de bezoeker.</small></fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>12 / CHECKLIST, VARIANTEN EN PLAN B</legend>${repeater('checklist', c.checklist)}${repeater('variations', c.variations)}${repeater('risks', c.risks)}<small class="tl-note">Varianten met “klein/intiem/compact”, “groot” of “hybride” in de titel worden automatisch aanbevolen op basis van de antwoorden van de bezoeker.</small></fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>13 / KOSTENPOSTEN, DUURZAAM, EVALUATIE</legend>
        <div class="ad-three">${field('Kostenposten (één per regel, geen bedragen)', 'budgetItems', lines(c.budgetItems), { area: true })}${field('Duurzaam (één per regel)', 'sustainability', lines(c.sustainability), { area: true })}${field('Evaluatie (één per regel)', 'evaluation', lines(c.evaluation), { area: true })}</div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>14 / UITNODIGING</legend>
        ${field('Onderwerp', 'inv_subject', c.invitation?.subject)}
        ${field('Tekst — gebruik [datum], [dag], [locatie], [plaats], [link], [centrale vraag]', 'inv_text', c.invitation?.text, { area: true })}
        ${field('Herinnering', 'inv_reminder', c.invitation?.reminder, { area: true })}
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>16 / METHODE: AANLEIDING, DOELEN EN DOELGROEP</legend>
        <div class="ad-two"><label class="ad-field"><span>Dagdeel</span><select name="dayPart">${(content.dayParts || []).map((x) => opt(x.id, x.label, c.dayPart === x.id)).join('')}</select></label>${field('Stemming in één zin', 'mood', c.mood)}</div>
        <div class="tl-chip-set">${(content.occasionTypes || []).map((o) => `<label class="tl-check"><input type="checkbox" name="occ" value="${esc(o.id)}" ${(c.occasions || []).includes(o.id) ? 'checked' : ''}> ${esc(o.label)}</label>`).join('')}</div>
        ${field('Aanleiding (wanneer is dit concept het antwoord?)', 'occasionText', c.occasionText, { area: true })}
        <div class="ad-three">${field('Doelen organisatie (één per regel)', 'g_business', lines(c.goals?.business), { area: true })}${field('Doelen deelnemer (één per regel)', 'g_participant', lines(c.goals?.participant), { area: true })}${field('Gedrag erna (één per regel)', 'g_behaviour', lines(c.goals?.behaviour), { area: true })}</div>
        <div class="ad-two">${field('Waarom komen ze?', 'ai_why', c.audienceInsight?.why, { area: true })}${field('Wat boeit ze?', 'ai_interests', c.audienceInsight?.interests, { area: true })}</div>
        <div class="ad-three">${field('Wat vermijden we?', 'ai_avoid', c.audienceInsight?.avoid, { area: true })}${field('Zo spreken we ze aan', 'ai_approach', c.audienceInsight?.approach, { area: true })}${field('Zo doen ze mee', 'ai_mode', c.audienceInsight?.mode, { area: true })}</div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>17 / METHODE: BELEVING, BEZOEKERSREIS (6 FASEN), COMMUNICATIE, IMPACT</legend>
        <div class="tl-chip-set">${(content.moodDirections || []).map((o) => `<label class="tl-check"><input type="checkbox" name="mdir" value="${esc(o.id)}" ${(c.moodDirections || []).includes(o.id) ? 'checked' : ''}> ${esc(o.label)}</label>`).join('')}</div>
        ${field('Zo ontstaat verbinding (één per regel)', 'connectionDesign', lines(c.connectionDesign), { area: true })}
        ${repeater('journey', c.journey)}
        ${repeater('communication', c.communication)}
        ${repeater('kpis', c.kpis)}
        <div class="ad-two">${field('Randvoorwaarden (één per regel)', 'conditions', lines(c.conditions), { area: true })}${field('Toegankelijkheid (één per regel)', 'accessibility', lines(c.accessibility), { area: true })}</div>
        <div class="ad-three">${field('Bijstelling: exclusiever', 'adj_ex', c.adjustments?.exclusiever, { area: true })}${field('Bijstelling: meer interactie', 'adj_in', c.adjustments?.interactiever, { area: true })}${field('Bijstelling: budgetbewust', 'adj_bu', c.adjustments?.budgetbewust, { area: true })}</div>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>18 / CONCEPTPLAN (SJABLOON IN TWAALF HOOFDSTUKKEN)</legend>
        <div class="ad-two">${field('Wat gebeurt er zonder dit evenement?', 'pl_whyLive', c.plan?.whyLive, { area: true })}${field('Afbakening: wat hoort er niet bij?', 'pl_scope', c.plan?.scope, { area: true })}</div>
        <div class="ad-two">${field('Rode draad', 'pl_redThread', c.plan?.redThread, { area: true })}${field('Eén onvervangbaar onderdeel', 'pl_irreplaceable', c.plan?.irreplaceable, { area: true })}</div>
        <div class="ad-three">${field('Drie sfeerwoorden (komma-gescheiden)', 'pl_moodWords', (c.plan?.moodWords || []).join(', '))}${field('Belangrijkste boodschap', 'pl_keyMessage', c.plan?.keyMessage)}${field('Bewuste rustmomenten', 'pl_restMoments', c.plan?.restMoments)}</div>
        <div class="ad-three">${field('Visuele richting', 'pl_visual', c.plan?.visual, { area: true })}${field('Geluid en zintuigen', 'pl_senses', c.plan?.senses, { area: true })}${field('Wrijvingspunten', 'pl_frictions', c.plan?.frictions, { area: true })}</div>
      </fieldset>
      <fieldset ${!chief() ? 'disabled' : ''}><legend>19 / KWALITEITSTOETS (100 PUNTEN, HOOFDREDACTEUR)</legend>
        <div class="ad-three">${QUALITY.map(([k, l, max]) => field(`${l} (0–${max})`, `q_${k}`, c.quality?.[k] ?? '', { type: 'number' })).join('')}</div>
        <p class="tl-note">${c.quality ? `Totaal ${qualityTotal(c.quality)} / 100 — beoordeeld door ${esc(c.quality.reviewedBy || '?')}${c.quality.reviewedAt ? ` op ${esc(c.quality.reviewedAt.slice(0, 10))}` : ''}.` : 'Nog niet beoordeeld.'} Publiceren vraagt minstens ${QUALITY_MIN} punten als de toets is ingevuld. Dit is een menselijk oordeel: controleer ook haalbaarheid bij locatie en leveranciers.</p>
      </fieldset>
      <fieldset ${locked ? 'disabled' : ''}><legend>15 / BEELD EN SEO</legend>
        <div class="ad-two">${field('Hero-beeld (pad of URL)', 'hero_src', c.hero?.src)}${field('Alt-tekst hero', 'hero_alt', c.hero?.alt)}</div>
        <label class="tl-check"><input type="checkbox" name="hero_ill" ${c.hero?.illustrative !== false ? 'checked' : ''}> Sfeerbeeld ter illustratie (geen foto van een specifieke locatie)</label>
        ${field('SEO-titel (uniek)', 'seo_title', c.seo?.title, { max: 70 })}${field('SEO-beschrijving (uniek, 70–160 tekens)', 'seo_description', c.seo?.description, { area: true, max: 300 })}
      </fieldset>
      <div class="ad-actions">
        <label class="ad-field"><span>Status</span><select name="status" ${locked ? 'disabled' : ''}>${statuses.map((s) => opt(s, s, s === c.status)).join('')}</select></label>
        <button class="tl-button" type="submit" ${locked ? 'disabled' : ''}>OPSLAAN ✓</button>
        ${c.status === 'published' ? `<a class="tl-button tl-button--outline" href="/preview/eventconcepten/${esc(c.slug)}/" target="_blank" rel="noopener">BEKIJK LIVE VERSIE ↗</a>` : ''}
        <span class="tl-mono" role="status" data-save-status></span>
      </div>
      <ul class="ad-issues" data-errors></ul>
    </form></section>`;

  const form = $('[data-concept-form]');
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-remove]')) e.target.closest('.ad-repeat__item').remove();
    const add = e.target.closest('[data-add]')?.dataset.add;
    if (add === 'venue') $('[data-venues]').insertAdjacentHTML('beforeend', venueRow(partners[0]?.slug, ''));
    if (add === 'supplier') $('[data-suppliers]').insertAdjacentHTML('beforeend', supplierRow(suppliers[0]?.id, '', ''));
    const rep = e.target.closest('[data-add-rep]')?.dataset.addRep;
    if (rep) form.querySelector(`[data-rep="${rep}"]`).insertAdjacentHTML('beforeend', repItem(rep));
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const g = (n) => form.elements[n]?.value ?? '';
    const all = (sel, n) => [...form.querySelectorAll(`${sel} [name="${n}"]`)].map((x) => x.value.trim());
    const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const checkedF = [...form.querySelectorAll('[name="f_on"]:checked')].map((x) => x.value);
    const on = [...c.feelings.filter((f) => checkedF.includes(f)), ...checkedF.filter((f) => !c.feelings.includes(f))]; // bestaande volgorde behouden
    // Locaties: zorg voor een redactionele id per gekozen partner (bestaand of slug).
    const idBySlug = Object.fromEntries(content.venues.venues.map((v) => [v.greenbookingsSlug, v.id]));
    const vSlugs = all('[data-venues]', 'v_slug'); const vReasons = all('[data-venues]', 'v_reason');
    const vRoles = all('[data-venues]', 'v_role'); const vPros = all('[data-venues]', 'v_pro'); const vWatch = all('[data-venues]', 'v_watch');
    for (const s of vSlugs) if (!idBySlug[s]) { await call('PUT', `/api/venues/${s}`, { id: s }); idBySlug[s] = s; }
    const sid = all('[data-suppliers]', 's_id'), sr = all('[data-suppliers]', 's_role'), sre = all('[data-suppliers]', 's_reason');
    const body = {
      title: g('title'), slug: g('slug'), status: g('status'), priority: Number(g('priority')) || 99,
      headline: g('headline').split('\n').map((x) => x.trim()).filter(Boolean),
      category: g('category'), categoryLabel: (content.categories || []).find((x) => x.id === g('category'))?.label || g('categoryLabel'), format: g('format'),
      guestCountMin: Number(g('guestCountMin')) || null, guestCountMax: Number(g('guestCountMax')) || null,
      teaser: g('teaser'), proposition: g('proposition'), tags: list(g('tags')),
      feelings: on,
      feelingWeights: Object.fromEntries(on.map((f) => [f, Math.max(1, Math.min(5, Number(g(`w_${f}`)) || 3))])),
      feelingReasons: Object.fromEntries(on.map((f) => [f, g(`r_${f}`)])),
      idea: { label: g('idea_label'), headline: g('idea_headline').split('\n').map((x) => x.trim()).filter(Boolean), body: g('idea_body'), values: g('values').split('\n').map((l) => l.split(':')).filter((p) => p.length > 1).map(([t, ...x]) => [t.trim().toUpperCase(), x.join(':').trim()]) },
      audiences: list(g('audiences')), objective: g('objective'),
      program: readRep(form, 'program').filter((p) => p.title).map((p) => ({ time: p.time, title: p.title, description: p.description, details: { intro: p.d_intro, steps: p.d_steps || [], roles: p.d_roles || [], needs: p.d_needs || [], tip: p.d_tip, why: p.d_why, result: p.d_result } })),
      venueMatches: vSlugs.map((s, i) => ({ venueId: idBySlug[s], priority: i + 1, reason: vReasons[i], pro: vPros[i], watch: vWatch[i], role: vRoles[i] || (i === 0 ? 'VOORKEUR' : 'ALTERNATIEF') })),
      supplierRoles: list(g('supplierRoles')),
      supplierMatches: sid.map((s, i) => ({ supplierId: s, role: sr[i], reason: sre[i] })).filter((m) => m.role),
      hero: { ...c.hero, src: g('hero_src'), alt: g('hero_alt'), illustrative: form.elements.hero_ill.checked, credit: c.hero?.credit || 'Top Locaties' },
      seo: { title: g('seo_title'), description: g('seo_description') },
      duration: g('duration'),
      runbook: readRep(form, 'runbook'),
      planning: readRep(form, 'planning'),
      catering: { concept: g('cat_concept'), moments: readRep(form, 'moments'), drinks: g('cat_drinks'), notes: g('cat_notes') },
      entertainment: readRep(form, 'entertainment'),
      crew: readRep(form, 'crew'),
      spaces: readRep(form, 'spaces'),
      checklist: readRep(form, 'checklist'),
      variations: readRep(form, 'variations'),
      risks: readRep(form, 'risks'),
      budgetItems: fromLines(g('budgetItems')), sustainability: fromLines(g('sustainability')), evaluation: fromLines(g('evaluation')),
      invitation: { subject: g('inv_subject'), text: g('inv_text'), reminder: g('inv_reminder') },
      dayPart: g('dayPart'), mood: g('mood'), occasionText: g('occasionText'),
      occasions: keepOrder(c.occasions, [...form.querySelectorAll('[name="occ"]:checked')].map((x) => x.value)),
      moodDirections: keepOrder(c.moodDirections, [...form.querySelectorAll('[name="mdir"]:checked')].map((x) => x.value)),
      goals: { business: fromLines(g('g_business')), participant: fromLines(g('g_participant')), behaviour: fromLines(g('g_behaviour')) },
      audienceInsight: { why: g('ai_why'), interests: g('ai_interests'), avoid: g('ai_avoid'), approach: g('ai_approach'), mode: g('ai_mode') },
      connectionDesign: fromLines(g('connectionDesign')),
      journey: readRep(form, 'journey'), communication: readRep(form, 'communication'), kpis: readRep(form, 'kpis'),
      conditions: fromLines(g('conditions')), accessibility: fromLines(g('accessibility')),
      adjustments: { exclusiever: g('adj_ex'), interactiever: g('adj_in'), budgetbewust: g('adj_bu') },
      plan: { ...(c.plan || {}), whyLive: g('pl_whyLive'), scope: g('pl_scope'), redThread: g('pl_redThread'), moodWords: list(g('pl_moodWords')), visual: g('pl_visual'), senses: g('pl_senses'), restMoments: g('pl_restMoments'), frictions: g('pl_frictions'), keyMessage: g('pl_keyMessage'), irreplaceable: g('pl_irreplaceable') },
      ...(chief() && QUALITY.some(([k]) => g(`q_${k}`) !== '') ? { quality: Object.fromEntries(QUALITY.map(([k, , max]) => [k, Math.max(0, Math.min(max, Number(g(`q_${k}`)) || 0))])) } : {}),
    };
    const status = $('[data-save-status]');
    try {
      const r = await call('PUT', `/api/concepts/${c.slug}`, body);
      await reload();
      $('[data-errors]').innerHTML = issues(r.errors || [], 'error');
      status.textContent = r.errors?.length ? `OPGESLAGEN ALS ${r.concept.status.toUpperCase()} — ${r.errors.length} PUNTEN VOOR PUBLICATIE` : `OPGESLAGEN ✓ (${r.concept.status.toUpperCase()})`;
      if (r.concept.slug !== c.slug) location.hash = `concept/${r.concept.slug}`;
      toast('Opgeslagen');
    } catch (err) {
      $('[data-errors]').innerHTML = issues(err.data?.errors || [err.message], 'error');
      status.textContent = err.message;
    }
  });
}

/* ---------- Locaties ---------- */
function locaties() {
  const ed = Object.fromEntries(content.venues.venues.map((v) => [v.greenbookingsSlug, v]));
  const usedIn = (slug) => content.concepts.filter((c) => (c.venueMatches || []).some((m) => (content.venues.venues.find((v) => v.id === m.venueId) || {}).greenbookingsSlug === slug)).map((c) => c.title);
  view.innerHTML = `<section class="tl-section">
    ${overline('03 / AANGESLOTEN PARTNERLOCATIES', `${content.partners.length} IN DE BRON`)}
    <div class="tl-section-head"><h1 class="tl-display tl-display--md">LOCATIES.</h1><p>Bronvelden (naam, plaats, capaciteit, foto) komen uit Greenbookings en zijn hier niet te bewerken. Je beheert alleen de redactionele laag: label, eigen beschrijving en filters.</p></div>
    <input class="ad-search" type="search" placeholder="Zoek op naam of plaats…" aria-label="Zoek locatie" data-q>
    <table class="ad-table"><thead><tr><th>Locatie</th><th>Plaats</th><th>Capaciteit</th><th>Redactie</th><th>In concepten</th><th></th></tr></thead><tbody data-rows>
    ${content.partners.map((p) => `<tr data-name="${esc((p.name + ' ' + p.city).toLowerCase())}"><td>${esc(p.name)}${p.hasImage ? '' : ' <span class="tl-chip">GEEN FOTO</span>'}</td><td>${esc(p.city)}, ${esc(p.province)}</td><td>${p.capacityMax ?? 'onbekend'}</td><td>${ed[p.slug] ? (ed[p.slug].editorialCheckedAt ? 'gecontroleerd ✓' : 'concept') : '—'}</td><td>${esc(usedIn(p.slug).join(', ') || '—')}</td><td><a class="tl-button tl-button--outline" href="#locatie/${esc(p.slug)}">BEWERK</a></td></tr>`).join('')}
    </tbody></table></section>`;
  $('[data-q]').oninput = (e) => { const q = e.target.value.toLowerCase(); view.querySelectorAll('[data-rows] tr').forEach((r) => { r.hidden = q && !r.dataset.name.includes(q); }); };
}
function venueEditor(slug) {
  const p = content.partners.find((x) => x.slug === slug);
  if (!p) { location.hash = 'locaties'; return; }
  const ed = content.venues.venues.find((v) => v.greenbookingsSlug === slug) || { label: '', line: '', eventTypes: [], character: [] };
  const tax = content.venues.taxonomy;
  const checks = (name, map, sel) => Object.entries(map).map(([k, l]) => `<label class="tl-check"><input type="checkbox" name="${name}" value="${k}" ${sel.includes(k) ? 'checked' : ''}> ${esc(l)}</label>`).join('');
  view.innerHTML = `<section class="tl-section">
    ${overline('LOCATIEREDACTIE', `${p.city} / ${p.province}`.toUpperCase())}
    <div class="tl-section-head"><h1 class="tl-display tl-display--md">${esc(p.name)}</h1><p><a class="tl-text-button" href="#locaties">← ALLE LOCATIES</a></p></div>
    <form class="ad-form" data-venue-form><fieldset><legend>REDACTIONELE LAAG</legend>
      ${field('Label (mono, bv. MONUMENT / STAD)', 'label', ed.label, { max: 40 })}
      ${field('Eigen beschrijving (één tot twee zinnen, alleen controleerbare feiten)', 'line', ed.line, { area: true, max: 240 })}
      <div class="ad-two"><div class="ad-field"><span>Soort bijeenkomst</span>${checks('eventTypes', tax.eventTypes, ed.eventTypes || [])}</div><div class="ad-field"><span>Karakter van de plek</span>${checks('character', tax.character, ed.character || [])}</div></div>
      <label class="tl-check"><input type="checkbox" name="checked"> Tekst is nagelezen en klopt met het Greenbookings-profiel</label>
    </fieldset>
    <div class="ad-actions"><button class="tl-button" type="submit">OPSLAAN ✓</button><a class="tl-button tl-button--outline" href="/preview/locaties/${esc(slug)}/" target="_blank" rel="noopener">BEKIJK ↗</a><span class="tl-mono" data-save-status></span></div>
    <ul class="ad-issues" data-errors></ul></form></section>`;
  $('[data-venue-form]').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const body = { label: f.elements.label.value.trim(), line: f.elements.line.value.trim(), eventTypes: [...f.querySelectorAll('[name=eventTypes]:checked')].map((x) => x.value), character: [...f.querySelectorAll('[name=character]:checked')].map((x) => x.value), checked: f.elements.checked.checked };
    try { await call('PUT', `/api/venues/${slug}`, body); await reload(); $('[data-save-status]').textContent = 'OPGESLAGEN ✓'; toast('Opgeslagen'); }
    catch (err) { $('[data-errors]').innerHTML = issues(err.data?.errors || [err.message], 'error'); }
  };
}

/* ---------- Makers en gevoelens ---------- */
function makers() {
  const src = Object.fromEntries(content.supplierSources.map((s) => [s.greenbookingsSlug, s]));
  view.innerHTML = `<section class="tl-section">
    ${overline('04 / MAKERS', 'LEVERANCIERSFEED NOG NIET BEVESTIGD')}
    <div class="tl-section-head"><h1 class="tl-display tl-display--md">MAKERS.</h1><p>Naam, plaats en tagline komen uit Greenbookings. Bevestig de profiellink pas na handmatige controle in de browser.</p></div>
    <div class="ad-list">${content.suppliers.suppliers.map((s) => `<form class="ad-row" data-sup="${esc(s.id)}">
      <div><span class="tl-mono">${esc(src[s.greenbookingsSlug]?.category || '')}</span><div class="ad-row__title">${esc(src[s.greenbookingsSlug]?.name || s.id)}</div></div>
      <label class="ad-field"><span>Label</span><input name="label" value="${esc(s.label)}"></label>
      <label class="ad-field"><span>Symbool / profiellink</span><input name="symbol" value="${esc(s.symbol)}" maxlength="2"><select name="profileLinkStatus">${opt('onbevestigd', 'Link onbevestigd', s.profileLinkStatus !== 'bevestigd')}${opt('bevestigd', 'Link gecontroleerd ✓', s.profileLinkStatus === 'bevestigd')}</select></label>
      <button class="tl-button" type="submit">OPSLAAN</button></form>`).join('')}</div></section>`;
  view.querySelectorAll('[data-sup]').forEach((f) => { f.onsubmit = async (e) => { e.preventDefault(); try { await call('PUT', `/api/suppliers/${f.dataset.sup}`, { label: f.elements.label.value, symbol: f.elements.symbol.value, profileLinkStatus: f.elements.profileLinkStatus.value }); await reload(); toast('Opgeslagen'); } catch (err) { toast(err.message); } }; });
}
function gevoelens() {
  view.innerHTML = `<section class="tl-section tl-section--mist">
    ${overline('05 / GEVOELENS', 'ZES VASTE GEVOELENS — ALLEEN TEKST AANPASBAAR')}
    <h1 class="tl-display tl-display--md tl-section-head">GEVOELENS.</h1>
    <div class="ad-list">${content.feelings.feelings.map((f) => `<form class="ad-row" data-feel="${f.id}"><div class="ad-row__title">${esc(f.label)}</div>
      <label class="ad-field"><span>Korte zin op de kaart</span><input name="sub" value="${esc(f.sub)}" maxlength="60"></label>
      <label class="ad-field"><span>Uitleg</span><input name="explanation" value="${esc(f.explanation)}" maxlength="120"></label>
      <button class="tl-button" type="submit">OPSLAAN</button></form>`).join('')}</div></section>`;
  view.querySelectorAll('[data-feel]').forEach((f) => { f.onsubmit = async (e) => { e.preventDefault(); try { await call('PUT', `/api/feelings/${f.dataset.feel}`, { sub: f.elements.sub.value, explanation: f.elements.explanation.value }); await reload(); toast('Opgeslagen'); } catch (err) { toast(err.message); } }; });
}

/* ---------- Gids 'Zo regel je het zelf' ---------- */
function guideView() {
  const p = content.playbook;
  view.innerHTML = `<section class="tl-section">${overline('06 / GIDS ZELF ORGANISEREN', 'GEDEELD DOOR ALLE CONCEPTEN')}
    <h1 class="tl-display tl-display--md tl-section-head">ZO REGEL JE<br><span class="tl-accent">HET ZELF.</span></h1>
    <form class="ad-form" data-guide-form>
      <fieldset><legend>INTRO</legend>${field('Introductie', 'intro', p.intro, { area: true })}</fieldset>
      <fieldset><legend>STAPPEN</legend>${repeater('steps', p.steps)}</fieldset>
      <fieldset><legend>WAT EEN BUREAU DOET → WAAR HET OP DE SITE STAAT</legend>${repeater('agency', p.agencyVsYou.map(([task, here]) => ({ task, here })))}</fieldset>
      <fieldset><legend>OFFERTEVRAGEN (ÉÉN PER REGEL)</legend><div class="ad-two">${Object.entries(p.quoteQuestions).map(([k, v]) => field(k, `q_${k}`, lines(v), { area: true })).join('')}</div></fieldset>
      <div class="ad-actions"><button class="tl-button" type="submit" ${chief() ? '' : 'disabled'}>OPSLAAN ✓</button>${chief() ? '' : '<span class="tl-mono">Alleen de hoofdredacteur wijzigt de gids.</span>'}<span class="tl-mono" data-save-status></span></div>
    </form></section>`;
  const form = $('[data-guide-form]');
  form.addEventListener('click', (e) => { if (e.target.closest('[data-remove]')) e.target.closest('.ad-repeat__item').remove(); const rep = e.target.closest('[data-add-rep]')?.dataset.addRep; if (rep) form.querySelector(`[data-rep="${rep}"]`).insertAdjacentHTML('beforeend', repItem(rep)); });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const body = { intro: form.elements.intro.value.trim(), steps: readRep(form, 'steps').map((x, i) => ({ id: x.id || `stap-${i + 1}`, ...x })), agencyVsYou: readRep(form, 'agency').map((x) => [x.task, x.here]), quoteQuestions: Object.fromEntries(Object.keys(p.quoteQuestions).map((k) => [k, fromLines(form.elements[`q_${k}`].value)])) };
    try { await call('PUT', '/api/playbook', body); await reload(); $('[data-save-status]').textContent = 'OPGESLAGEN ✓'; toast('Gids opgeslagen'); } catch (err) { toast(err.message); }
  };
}

/* ---------- Data, sync en publicatie ---------- */
function dataView() {
  const m = content.snapshotMeta;
  view.innerHTML = `<section class="tl-section">
    ${overline('06 / DATA & PUBLICATIE', 'PARTNER-ONLY / FAIL-CLOSED')}
    <h1 class="tl-display tl-display--md tl-section-head">BRON EN<br><span class="tl-accent">PUBLICATIE.</span></h1>
    <dl class="tl-facts">
      <div><dt>LAATSTE BRONSTAND</dt><dd>${esc(m.syncedAt)} — ${esc(m.mode)}</dd></div>
      <div><dt>AANGESLOTEN PARTNERS</dt><dd>${content.partners.length} gepubliceerd in de snapshot</dd></div>
      <div><dt>PARTNERREGEL</dt><dd>${esc(m.partnerRule || '')}</dd></div>
    </dl>
    <div class="ad-actions"><button class="tl-button tl-button--outline" type="button" data-sync="dry" ${chief() ? '' : 'disabled'}>TEST BRONSYNC (DRY RUN)</button><button class="tl-button tl-button--outline" type="button" data-sync="real" ${chief() ? '' : 'disabled'}>SYNC GREENBOOKINGS-PARTNERS</button><button class="tl-button tl-button--accent" type="button" data-build ${chief() ? '' : 'disabled'}>VALIDEER &amp; BOUW DE SITE ↗</button>${chief() ? '' : '<span class="tl-mono">Alleen de hoofdredacteur publiceert of synchroniseert.</span>'}</div>
    <pre class="ad-pre" data-output>${esc(content.syncLog.length ? JSON.stringify(content.syncLog[0], null, 2) : 'Nog geen sync uitgevoerd in deze omgeving.')}</pre>
    <p class="tl-note tl-note--gap">Bouwen schrijft de statische site naar site/. Deploy daarna die map (bijv. Vercel-project top-locaties met vercel.json). Een mislukte of onvolledige sync wijzigt nooit de bestaande partnerset.</p></section>`;
  const out = $('[data-output]');
  view.querySelectorAll('[data-sync]').forEach((b) => { b.onclick = async () => { out.textContent = 'Bezig…'; try { const r = await call('POST', '/api/sync', { dryRun: b.dataset.sync === 'dry' }); out.textContent = r.output; await reload(); } catch (err) { out.textContent = err.message; } }; });
  $('[data-build]').onclick = async () => { out.textContent = 'Valideren en bouwen…'; try { const r = await call('POST', '/api/build', {}); out.textContent = r.output; await reload(); toast('Site gebouwd ✓'); } catch (err) { out.textContent = err.data?.output || err.message; } };
}
async function auditView() {
  const rows = await call('GET', '/api/audit');
  view.innerHTML = `<section class="tl-section">${overline('07 / AUDITLOG', 'ELKE MUTATIE WORDT VASTGELEGD')}<h1 class="tl-display tl-display--md tl-section-head">AUDITLOG.</h1>
    <table class="ad-table"><thead><tr><th>Moment</th><th>Wie</th><th>Rol</th><th>Actie</th><th>Details</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(new Date(r.at).toLocaleString('nl-NL'))}</td><td>${esc(r.user)}</td><td>${esc(r.role)}</td><td>${esc(r.action)}</td><td><code>${esc(JSON.stringify(r.detail))}</code></td></tr>`).join('') || '<tr><td colspan="5">Nog geen mutaties.</td></tr>'}</tbody></table></section>`;
}

start();
