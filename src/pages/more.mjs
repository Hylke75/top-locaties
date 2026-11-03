// Fase D: conceptoverzicht, op-gevoel, locatiedetail, leveranciers, mijn plan, over.
// Uitsluitend gedeelde tl-componenten; geen pagina-eigen styling.
import { html, lines, pad, raw } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline, ext, feelingCompass, compassData, conceptCard, matchCard, catalogCard, venueImage, state, SITE } from '../templates/components.mjs';

const CATEGORIES = { inspiratie: 'KENNIS & INSPIRATIE', verbinden: 'SAMEN & VERBINDEN', beleven: 'BELEVEN & VERRASSEN' };
const crumb = (items, right) => html`<nav class="tl-crumb" aria-label="Kruimelpad"><span>${items.map((it, i) => html`${i ? ' / ' : ''}${it.href ? html`<a href="${it.href}">${it.label}</a>` : html`<span aria-current="page">${it.label}</span>`}`)}</span><span>${right}</span></nav>`;

/* ---------------- /eventconcepten/ ---------------- */
export function renderConceptsOverview(data) {
  const { concepts, feelings, feelingLabels } = data;
  const body = html`${header({ current: 'concepten' })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'EVENTCONCEPTEN' }], `COLLECTIE / ${pad(concepts.length)} CONCEPTEN`)}
<main id="main">
<section class="tl-section tl-section--taupe tl-section--ring" aria-labelledby="ovTitle" data-concept-overview>
  ${overline('01 / ALLE EVENTCONCEPTEN', 'IDEEËN WAAR BIJZONDERE BIJEENKOMSTEN MEE BEGINNEN')}
  <div class="tl-section-head tl-section-head--top">
    <h1 class="tl-display" id="ovTitle">ER IS ZÓVEEL<br><span class="tl-accent">MOGELIJK.</span></h1>
    <p>Blader op type bijeenkomst of op het gevoel dat je wilt achterlaten. Elk concept heeft een verhaal, een voorbeeldprogramma, aangesloten partnerlocaties en de makers die het waarmaken.</p>
  </div>
  <div class="tl-chip-row" role="group" aria-label="Filter op type">
    <button class="tl-chip-button" type="button" data-ov-category="" aria-pressed="true">ALLE TYPES / ${pad(concepts.length)}</button>
    ${Object.entries(CATEGORIES).map(([k, l]) => html`<button class="tl-chip-button" type="button" data-ov-category="${k}" aria-pressed="false">${l} / ${pad(concepts.filter((c) => c.category === k).length)}</button>`)}
  </div>
  <div class="tl-chip-row" role="group" aria-label="Filter op gewenst gevoel (maximaal twee)">
    ${feelings.map((f) => html`<button class="tl-chip-button" type="button" data-ov-feeling="${f.id}" aria-pressed="false">${f.label.toUpperCase()} +</button>`)}
  </div>
  <p class="tl-visually-hidden" role="status" aria-live="polite" data-ov-status></p>
  <div class="tl-catalog" data-ov-grid>${concepts.map((c, i) => conceptCard(c, i, feelingLabels))}</div>
  <div data-ov-empty hidden>${state('empty', 'GEEN CONCEPT.', 'Er is (nog) geen concept met deze combinatie. Haal een filter weg of probeer het gevoelskompas: daar zie je altijd alternatieven.', html`<a class="tl-button" href="/eventconcepten/op-gevoel/">NAAR HET GEVOELSKOMPAS ↗</a>`)}</div>
  <p class="tl-note tl-note--gap">Programma's en groepsgroottes zijn redactionele voorbeelden. Locaties zijn uitsluitend aangesloten Greenbookings-partners.</p>
</section>
${feelingCompass(data, { number: '02', id: 'gevoel' })}
</main>
${footer({ links: [{ href: '/eventconcepten/op-gevoel/', label: 'KIES OP GEVOEL ↗' }, { href: '/locaties/', label: 'ZOEK LOCATIES ↗' }, { href: '/leveranciers/', label: 'LEVERANCIERS ↗' }, { href: '/mijn-plan/', label: 'MIJN PLAN ↗' }] })}`;
  return layout({
    title: 'Eventconcepten — originele ideeën voor zakelijke events | Top Locaties',
    description: 'Alle eventconcepten van Top Locaties: van kennisfestival tot verbindend diner. Filter op type of op het gevoel dat je gasten mee naar huis nemen.',
    path: '/eventconcepten/', body, scripts: ['compass.js', 'overview.js'], data: compassData(data),
  });
}

/* ---------------- /eventconcepten/op-gevoel/ ---------------- */
export function renderOpGevoel(data) {
  const body = html`${header({ current: 'concepten', cta: { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' } })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/eventconcepten/', label: 'EVENTCONCEPTEN' }, { label: 'OP GEVOEL' }], 'DE PRIMAIRE ONTDEKROUTE')}
<main id="main">
${feelingCompass(data, { number: '01', id: 'gevoel', headingLevel: 'h1' })}
<section class="tl-section" aria-labelledby="howTitle">
  ${overline('02 / ZO WERKT HET KOMPAS', 'REDACTIONEEL, NIET ALGORITMISCH')}
  <div class="tl-columns">
    <p class="tl-intro-label">Gevoel is iets anders dan de sfeer van een zaal. Een monument kan rust geven, maar ook trots.</p>
    <div>
      <h2 class="tl-display tl-display--md">ZES GEVOELENS.<br><span class="tl-accent">ÉÉN KEUZE.</span></h2>
      <p class="tl-body tl-body--gap">De redactie koppelt elk concept aan twee of drie gevoelens, met een gewicht en een concrete uitleg. Kies je er twee, dan tellen we per concept de gewichten van jouw gevoelens op. De drie hoogste verschijnen, met de reden erbij. Een score tonen we bewust niet: het is een redactioneel oordeel, geen voorspelling.</p>
      <dl class="tl-facts">${data.feelings.map((f) => html`<div><dt>${f.label.toUpperCase()}</dt><dd>${f.explanation}</dd></div>`)}</dl>
    </div>
  </div>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/locaties/', label: 'ZOEK LOCATIES ↗' }, { href: '/over/', label: 'OVER TOP LOCATIES ↗' }] })}`;
  return layout({
    title: 'Kies op gevoel — welk eventconcept past bij jouw gasten? | Top Locaties',
    description: 'Je gasten gaan naar huis. Wat wil je dat ze voelen? Kies twee van zes gevoelens en ontdek welke eventconcepten daarbij passen — met uitleg waarom.',
    path: '/eventconcepten/op-gevoel/', body, scripts: ['compass.js'], data: compassData(data),
  });
}

/* ---------------- /locaties/[slug]/ ---------------- */
export function renderVenueDetail(data, v) {
  const { venues, feelingLabels, syncedDate } = data;
  const nearby = venues.filter((x) => x.id !== v.id && x.province === v.province).slice(0, 2);
  const types = v.bijeenkomstTypes.length ? v.bijeenkomstTypes.slice(0, 10).join(', ') : 'Onbekend in de bron';
  const body = html`${header({ current: 'locaties', cta: { href: v.profileUrl, label: 'PROFIEL OP GREENBOOKINGS ↗' } })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/locaties/', label: 'LOCATIES' }, { label: v.name.toUpperCase() }], `${v.province.toUpperCase()} / ${v.city.toUpperCase()}`)}
<main id="main">
<section class="tl-hero" aria-labelledby="venueTitle">
  <div class="tl-hero__copy">
    <div class="tl-hero__meta"><span>${v.label}</span><span>AANGESLOTEN PARTNER</span></div>
    <h1 class="tl-display tl-display--md" id="venueTitle">${v.name}</h1>
    <div>
      <p class="tl-hero__intro">${v.line}${v.tagline ? html` <span class="tl-visually-hidden">—</span>` : ''}</p>
      <div class="tl-hero__footer">
        <a class="tl-round-link" href="#concepten">PAST BIJ DEZE IDEEËN <span class="tl-round-link__circle" aria-hidden="true">↓</span></a>
        <span class="tl-mono">${v.capacity}<br>${v.type || 'TYPE ONBEKEND'}</span>
      </div>
    </div>
  </div>
  <figure class="tl-hero__image">${v.image.kind === 'source' ? html`<img src="${v.image.src}" alt="${v.image.alt}" fetchpriority="high"><figcaption>${v.image.label} / BIJGEWERKT ${v.sourceDate}</figcaption>` : html`<div class="tl-placeholder" role="img" aria-label="Nog geen foto van ${v.name} beschikbaar"><span class="tl-placeholder__mark" aria-hidden="true">✳</span><span class="tl-placeholder__text">${v.image.label}</span></div>`}</figure>
</section>
<div class="tl-signature"><span class="tl-signature__intro">AANGESLOTEN BIJ GREENBOOKINGS</span><span class="tl-signature__tags">${v.character.map((c) => html`<span>${data.taxonomy.character[c]}</span>`)}</span>${ext(v.profileUrl, 'BEKIJK HET VOLLEDIGE PROFIEL ↗')}</div>

<section class="tl-section" aria-labelledby="factsTitle">
  ${overline('01 / DE PLEK IN FEITEN', `BRON: GREENBOOKINGS / ${v.sourceDate}`)}
  <div class="tl-columns">
    <p class="tl-intro-label">${v.tagline || 'Praktische gegevens komen rechtstreeks uit het Greenbookings-profiel. Wat daar niet staat, noemen we onbekend.'}</p>
    <div>
      <h2 class="tl-display tl-display--md" id="factsTitle">WAT WE<br><span class="tl-accent">ZEKER WETEN.</span></h2>
      <dl class="tl-facts">
        <div><dt>PLAATS</dt><dd>${v.city}, ${v.province}</dd></div>
        <div><dt>TYPE</dt><dd>${v.type || 'Onbekend'}</dd></div>
        <div><dt>CAPACITEIT (BRON)</dt><dd>${v.capacityMax ? `${v.capacityMin ? v.capacityMin + '–' : 'tot '}${v.capacityMax} personen` : 'Op aanvraag'}</dd></div>
        <div><dt>SFEER (BRON)</dt><dd>${v.sfeer || 'Onbekend'}</dd></div>
        <div><dt>BIJEENKOMSTEN (BRON)</dt><dd>${types}</dd></div>
        <div><dt>BESCHIKBAARHEID &amp; PRIJS</dt><dd>Niet getoond — vraag dit aan bij de locatie via Greenbookings.</dd></div>
      </dl>
      <p class="tl-note tl-note--gap">Capaciteit is het maximum volgens de bron; per opstelling kan dat anders zijn. Top Locaties bevestigt geen beschikbaarheid of reservering.</p>
    </div>
  </div>
</section>

<section class="tl-section tl-section--mist" id="concepten" aria-labelledby="fitTitle">
  ${overline('02 / WAT HIER KAN', 'REDACTIONELE KOPPELING')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="fitTitle">DE JUISTE PLEK<br>VERANDERT<br><span class="tl-accent">ALLES.</span></h2>
    <p>Waarom de redactie deze plek bij een eventconcept vindt passen.</p>
  </div>
  ${v.concepts.length
    ? html`<div class="tl-match-grid">${v.concepts.map((c, i) => html`<a class="tl-match${i === 0 ? ' tl-match--first' : ''}" href="/eventconcepten/${c.slug}/#locaties"><span class="tl-mono">${pad(i + 1)} / ${c.feelings.map((f) => feelingLabels[f].toUpperCase()).join(' + ')}</span><strong class="tl-match__name">${c.title}</strong><span class="tl-match__reason">${c.reason}</span><span class="tl-match__footer"><span>BEKIJK HET CONCEPT</span><span aria-hidden="true">↗</span></span></a>`)}</div>`
    : state('empty', 'NOG GEEN CONCEPT.', 'Deze partnerlocatie is nog niet aan een eventconcept gekoppeld. Bekijk alle concepten of kies op gevoel.', html`<a class="tl-button" href="/eventconcepten/op-gevoel/">KIES OP GEVOEL ↗</a>`)}
</section>

${nearby.length ? html`<section class="tl-section" aria-labelledby="nearTitle">
  ${overline(`03 / OOK IN ${v.province.toUpperCase()}`, 'AANGESLOTEN PARTNERS')}
  <h2 class="tl-display tl-display--md tl-section-head" id="nearTitle">IN DE BUURT.</h2>
  <div class="tl-catalog">${nearby.map((x, i) => catalogCard(x, i, data))}</div>
</section>` : ''}

<section class="tl-section tl-section--dark" aria-labelledby="nextTitle">
  ${overline('VOLGENDE STAP', 'VIA DE BRON')}
  <h2 class="tl-display tl-display--gap" id="nextTitle">BENIEUWD WAT<br><span class="tl-accent">HIER KAN?</span></h2>
  <div class="tl-callout"><span>Ruimtes, opstellingen, foto's en de aanvraagroute staan op het Greenbookings-profiel van ${v.name}.</span>${ext(v.profileUrl, 'NAAR HET PROFIEL ↗')}</div>
</section>
</main>
${footer({ left: 'EEN BIJZONDERE PLEK IS PAS HET BEGIN.', right: 'TOP LOCATIES / 2026', links: [{ href: '/locaties/', label: 'ALLE LOCATIES ↗' }, { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/mijn-plan/', label: 'MIJN PLAN ↗' }] })}`;
  const desc = `${v.name} in ${v.city}: ${v.line} Ontdek bij welke eventconcepten deze aangesloten Greenbookings-locatie past.`.slice(0, 300);
  return layout({ title: `${v.name} (${v.city}) — eventlocatie | Top Locaties`, description: desc, path: `/locaties/${v.slug}/`, body, preload: v.image.kind === 'source' ? v.image.src : null });
}

/* ---------------- /leveranciers/ ---------------- */
function supplierDirCard(s, i) {
  return html`<article class="tl-supplier" data-supplier-dir="${s.id}" data-category="${s.category}">
  <span class="tl-supplier__meta"><span>${pad(i + 1)} / ${s.label}</span><span>${s.city || 'NL'}</span></span>
  <span class="tl-supplier__mark" aria-hidden="true">${s.symbol}</span>
  <h3 class="tl-supplier__name"><a href="/leveranciers/${s.slug}/">${s.name}</a></h3>
  <p class="tl-supplier__desc">${s.tagline}${s.concepts.length ? html`<span class="tl-supplier__role tl-supplier__role--gap">ROL IN: ${s.concepts.map((c) => c.title).filter((t, n, a) => a.indexOf(t) === n).join(' / ')}</span>` : ''}</p>
  <div class="tl-supplier__actions"><a class="tl-button" href="/leveranciers/${s.slug}/">BEKIJK DE MAKER ↗</a></div>
</article>`;
}

export function renderSuppliers(data) {
  const { suppliers, syncedDate } = data;
  const cats = [...new Set(suppliers.map((s) => s.category))];
  const body = html`${header({ current: 'leveranciers' })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'LEVERANCIERS' }], `${pad(suppliers.length)} MAKERS IN DEZE SELECTIE`)}
<main id="main">
<section class="tl-section tl-section--mist tl-section--ring" aria-labelledby="supTitle" data-supplier-dir-root>
  ${overline('01 / DE MAKERS', 'DE ROL IN HET CONCEPT TELT')}
  <div class="tl-section-head tl-section-head--top">
    <h1 class="tl-display" id="supTitle">HET WORDT PAS<br>ECHT MET<br><span class="tl-accent">MENSEN.</span></h1>
    <p>Van techniek tot catering en entertainment. Per maker zie je bij welke eventconcepten de redactie hem noemt, en in welke rol.</p>
  </div>
  <div class="tl-chip-row" role="group" aria-label="Filter op vakgebied">
    <button class="tl-chip-button" type="button" data-sup-cat="" aria-pressed="true">ALLE VAKGEBIEDEN / ${pad(suppliers.length)}</button>
    ${cats.map((c) => html`<button class="tl-chip-button" type="button" data-sup-cat="${c}" aria-pressed="false">${c.toUpperCase()} / ${pad(suppliers.filter((s) => s.category === c).length)}</button>`)}
  </div>
  <div class="tl-supplier-grid" data-sup-grid>${suppliers.map(supplierDirCard)}</div>
  <p class="tl-note tl-note--gap">Voorlopige, redactionele selectie uit het Greenbookings-leveranciersbestand (bronstand ${syncedDate}). De volledige leveranciersgids verschijnt zodra Greenbookings een bevestigde leveranciersfeed levert. Een vermelding is geen bevestigde samenwerking.</p>
</section>
<section class="tl-section tl-section--dark" aria-labelledby="supMore">
  ${overline('02 / MEER MAKERS', 'IN HET NETWERK')}
  <h2 class="tl-display tl-display--gap" id="supMore">IEMAND ANDERS<br><span class="tl-accent">NODIG?</span></h2>
  <div class="tl-callout"><span>Het complete aanbod van eventleveranciers staat in de gids van Greenbookings.</span>${ext(SITE.greenbookings + '/tips', 'BEKIJK DE LEVERANCIERSGIDS ↗')}</div>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/locaties/', label: 'ZOEK LOCATIES ↗' }, { href: '/mijn-plan/', label: 'MIJN PLAN ↗' }] })}`;
  return layout({ title: 'Leveranciers en makers voor bijzondere events | Top Locaties', description: 'De makers achter de ervaring: AV en techniek, catering, entertainment en eventorganisatie — met hun rol per eventconcept, uit het Greenbookings-netwerk.', path: '/leveranciers/', body, scripts: ['suppliers.js'] });
}

export function renderSupplierDetail(data, s) {
  const body = html`${header({ current: 'leveranciers' })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/leveranciers/', label: 'LEVERANCIERS' }, { label: s.name.toUpperCase() }], s.label)}
<main id="main">
<section class="tl-section tl-section--mist tl-section--ring" aria-labelledby="sTitle">
  ${overline(`${s.category.toUpperCase()} / ${(s.city || 'NEDERLAND').toUpperCase()}`, `BRON: GREENBOOKINGS / ${s.sourceDate}`)}
  <div class="tl-columns">
    <p class="tl-intro-label">${s.tagline}</p>
    <div>
      <span class="tl-supplier__mark" aria-hidden="true">${s.symbol}</span>
      <h1 class="tl-display tl-display--md" id="sTitle">${s.name}</h1>
      <dl class="tl-facts">
        <div><dt>VAKGEBIED</dt><dd>${s.category}</dd></div>
        <div><dt>PLAATS</dt><dd>${s.city || 'Onbekend in de bron'}</dd></div>
        <div><dt>PROFIEL</dt><dd>${s.profileLinkStatus === 'bevestigd' ? 'Op Greenbookings' : 'Greenbookings-profiel (link nog niet handmatig gecontroleerd)'}</dd></div>
      </dl>
      <p class="tl-chip-set tl-body--gap">${ext(s.profileUrl, 'PROFIEL OP GREENBOOKINGS ↗', 'tl-button')}${s.website ? ext(s.website, 'WEBSITE VAN DE MAKER ↗', 'tl-button tl-button--outline') : ''}</p>
    </div>
  </div>
</section>
<section class="tl-section" aria-labelledby="rolesTitle">
  ${overline('01 / DE ROL PER CONCEPT', 'CONTEXTUEEL, NIET GENERIEK')}
  <h2 class="tl-display tl-display--md tl-section-head" id="rolesTitle">WAT DEZE MAKER<br><span class="tl-accent">TOEVOEGT.</span></h2>
  ${s.concepts.length
    ? html`<div class="tl-timeline">${s.concepts.map((c) => html`<div class="tl-timeline__item"><span class="tl-timeline__time">${c.role}</span><div><h3 class="tl-timeline__title"><a href="/eventconcepten/${c.slug}/#leveranciers">${c.title} ↗</a></h3><p class="tl-timeline__body">${c.reason}</p></div></div>`)}</div>`
    : state('empty', 'NOG GEEN ROL.', 'Deze maker is nog niet aan een concept gekoppeld.', '')}
  <p class="tl-note tl-note--gap">Inspiratiesuggesties van de redactie — geen bevestigde samenwerking, beschikbaarheid of prijs.</p>
</section>
</main>
${footer({ links: [{ href: '/leveranciers/', label: 'ALLE MAKERS ↗' }, { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/mijn-plan/', label: 'MIJN PLAN ↗' }] })}`;
  return layout({ title: `${s.name} — ${s.category.toLowerCase()} voor events | Top Locaties`, description: `${s.name}: ${s.tagline} Bekijk in welke eventconcepten deze maker een rol speelt.`.slice(0, 300), path: `/leveranciers/${s.slug}/`, body });
}

/* ---------------- /mijn-plan/ ---------------- */
export function renderPlan(data) {
  const body = html`${header({ current: 'plan', cta: { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' } })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'MIJN PLAN' }], 'ALLEEN IN DEZE BROWSER BEWAARD')}
<main id="main">
<section class="tl-section tl-section--dark" aria-labelledby="planTitle" data-plan-page>
  ${overline('01 / MIJN EVENTPLAN', 'VAN INSPIRATIE NAAR ACTIE')}
  <div class="tl-section-head tl-section-head--top">
    <h1 class="tl-display" id="planTitle">MAAK HET<br><span class="tl-accent">VAN JOU.</span></h1>
    <p>Je plannen per concept: gevoel, één locatie en je makers. Kopieer een plan als briefing of ga verder bij de bron. Geen account nodig; we bewaren niets op een server.</p>
  </div>
  <div data-plan-list></div>
  <div data-plan-empty hidden>${state('empty', 'NOG GEEN PLAN.', 'Kies een concept en selecteer een locatie of makers. Je plan verschijnt dan hier.', html`<span class="tl-chip-set tl-chip-set--center"><a class="tl-button" href="/eventconcepten/op-gevoel/">KIES OP GEVOEL ↗</a><a class="tl-button tl-button--outline" href="/eventconcepten/">ALLE CONCEPTEN ↗</a></span>`)}</div>
  <div data-plan-error hidden>${state('error', 'NIET BESCHIKBAAR.', 'Deze browser staat lokale opslag niet toe. Je kunt een plan op een conceptpagina wel kopiëren.', '')}</div>
  <p class="tl-mono tl-on-dark-note tl-note--gap" role="status" aria-live="polite" data-plan-page-status></p>
  <label class="tl-visually-hidden" for="planPageFallback">Plantekst</label>
  <textarea class="tl-composer__fallback" id="planPageFallback" readonly hidden data-plan-page-fallback></textarea>
</section>
<section class="tl-section" aria-labelledby="nextT">
  ${overline('02 / EN DAN?', 'DE AANVRAAG LOOPT VIA DE BRON')}
  <div class="tl-steps tl-steps--light"><div><b>01.</b><p>Kopieer je plan als briefing.</p></div><div><b>02.</b><p>Open de locatie op Greenbookings en vraag beschikbaarheid aan.</p></div><div><b>03.</b><p>Neem contact op met de makers via hun profiel.</p></div></div>
  <p class="tl-note tl-note--gap" id="nextT">Top Locaties is een inspiratieplatform: we bevestigen geen beschikbaarheid, prijs of reservering.</p>
</section>
</main>
${footer()}`;
  return layout({
    title: 'Mijn eventplan | Top Locaties', description: 'Je persoonlijke eventplan: concept, gevoel, locatie en makers — om te kopiëren en mee te nemen.', path: '/mijn-plan/', body, scripts: ['plan.js'], noindex: true,
    data: {
      origin: SITE.origin,
      feelings: data.feelings.map(({ id, label }) => ({ id, label })),
      concepts: Object.fromEntries(data.concepts.map((c) => [c.slug, { title: c.title, proposition: c.proposition, feelings: c.feelings }])),
      venues: Object.fromEntries(data.venues.map((v) => [v.id, { name: v.name, city: v.city, url: v.profileUrl, page: `/locaties/${v.slug}/` }])),
      suppliers: Object.fromEntries(data.suppliers.map((s) => [s.id, { name: s.name, url: s.profileUrl, page: `/leveranciers/${s.slug}/` }])),
      roles: Object.fromEntries(data.concepts.map((c) => [c.slug, Object.fromEntries(c.supplierMatches.map((m) => [m.supplierId, m.role]))])),
    },
  });
}

/* ---------------- /over/ ---------------- */
export function renderAbout(data) {
  const body = html`${header({ current: '' })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'OVER' }], 'FILOSOFIE / ECOSYSTEEM')}
<main id="main">
<section class="tl-section" aria-labelledby="aboutTitle">
  ${overline('01 / WAAROM TOP LOCATIES', 'EEN IDEE. EEN PLEK. DE MENSEN DIE HET WAARMAKEN.')}
  <div class="tl-columns">
    <p class="tl-intro-label">Waarom beginnen bij een zaal, als je ook kunt beginnen bij het gevoel dat je wilt achterlaten?</p>
    <div>
      <h1 class="tl-display" id="aboutTitle">GEEN<br>LOCATIEGIDS.<br><span class="tl-accent">EEN IDEEËNBOEK.</span></h1>
      <p class="tl-body tl-body--gap">Top Locaties is een redactioneel inspiratieplatform voor zakelijke evenementen. We beginnen bij de beleving: wat moeten gasten voelen als ze naar huis gaan? Daaruit volgt een eventconcept met een verhaal en een voorbeeldprogramma. Pas dan kijken we naar de plek en de makers.</p>
      <p class="tl-body">Alle locaties op deze site zijn aangesloten partners van Greenbookings. Praktische gegevens komen uit hun profiel; wat we niet zeker weten, noemen we onbekend. Sfeerbeelden en voorbeeldprogramma's zijn altijd zo gemarkeerd.</p>
    </div>
  </div>
</section>
<section class="tl-section tl-section--dark" aria-labelledby="ecoTitle">
  ${overline('02 / ÉÉN ECOSYSTEEM', 'VIER WEBSITES, ELK MET EEN EIGEN ROL')}
  <h2 class="tl-display tl-display--gap" id="ecoTitle">ALLE RUIMTE<br>VOOR <span class="tl-accent">GOEDE IDEEËN.</span></h2>
  <div class="tl-ecosystem">
    <div><strong>TOP-LOCATIES.NL</strong>Ontdekken en inspiratie: van gevoel naar concept, plek en makers.</div>
    <div><strong>GREENBOOKINGS.NL</strong>De bron: profielen van locaties en leveranciers, duurzaamheid en de aanvraagroute.</div>
    <div><strong>LOCATIE-ZOEKER.NL / MEETINGS.NU</strong>Gericht zoeken op regio en groepsgrootte, en zakelijke meetingoriëntatie.</div>
  </div>
  <div class="tl-callout"><span>Gegevens, aanvragen en correcties lopen via Greenbookings.</span><span class="tl-chip-set">${ext(SITE.greenbookings + '/', 'GREENBOOKINGS ↗')}${ext(SITE.locatieZoeker + '/', 'LOCATIE-ZOEKER ↗')}${ext(SITE.meetings + '/', 'MEETINGS.NU ↗')}</span></div>
</section>
<section class="tl-section tl-section--mist" aria-labelledby="rulesTitle">
  ${overline('03 / ONZE SPELREGELS', 'EERLIJK OVER WAT WE WETEN')}
  <h2 class="tl-display tl-display--md tl-section-head" id="rulesTitle">WAT JE HIER<br><span class="tl-accent">WEL EN NIET</span> ZIET.</h2>
  <dl class="tl-facts">
    <div><dt>LOCATIES</dt><dd>Uitsluitend aangesloten Greenbookings-partners (${data.venues.length} in deze editie).</dd></div>
    <div><dt>MATCHES</dt><dd>Redactioneel gekozen, altijd met reden. Geen scores of percentages.</dd></div>
    <div><dt>BEELD</dt><dd>Profielfoto's van Greenbookings of gemarkeerde sfeerbeelden.</dd></div>
    <div><dt>PROGRAMMA'S</dt><dd>Voorbeelden ter inspiratie, geen boekbare arrangementen.</dd></div>
    <div><dt>PRIJS &amp; BESCHIKBAARHEID</dt><dd>Tonen we niet. Vraag die aan bij de locatie.</dd></div>
    <div><dt>JOUW PLAN</dt><dd>Alleen in je eigen browser bewaard; geen account, geen tracking van je keuzes.</dd></div>
  </dl>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/op-gevoel/', label: 'KIES OP GEVOEL ↗' }, { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/locaties/', label: 'ZOEK LOCATIES ↗' }] })}`;
  return layout({ title: 'Over Top Locaties — inspiratie voor bijzondere bijeenkomsten', description: 'Top Locaties begint bij het gevoel dat je wilt achterlaten. Een redactioneel platform met eventconcepten, aangesloten Greenbookings-locaties en makers.', path: '/over/', body });
}
