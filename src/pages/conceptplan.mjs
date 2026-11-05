// /conceptplan/ (briefing → drie concepten) en /eventconcepten/<slug>/conceptplan/ (het 12-delige conceptplan).
// Methode: belofte · aanleiding · doelen (3 niveaus) · doelgroep · creatief concept · beleving · bezoekersreis ·
// programma · locatie & leveranciers · communicatie · investering & haalbaarheid · impact.
import { html, lines, pad } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline } from '../templates/components.mjs';

const crumb = (items, right) => html`<nav class="tl-crumb" aria-label="Kruimelpad"><span>${items.map((it, i) => html`${i ? ' / ' : ''}${it.href ? html`<a href="${it.href}">${it.label}</a>` : html`<span aria-current="page">${it.label}</span>`}`)}</span><span>${right}</span></nav>`;
const list = (xs, cls = 'tl-list') => html`<ul class="${cls}">${(xs || []).map((x) => html`<li>${x}</li>`)}</ul>`;
const plain = (s) => String(s || '').replace(/\*/g, '');

/* ---------------- /conceptplan/ ---------------- */
export function renderBriefing(data) {
  const { feelings, occasionTypes, moodDirections } = data;
  const q = (n, label) => html`<span>${pad(n)} / ${label}</span>`;
  const body = html`${header({ current: 'concepten' })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/eventconcepten/', label: 'EVENTCONCEPTEN' }, { label: 'CONCEPTPLAN' }], 'BRIEFING IN ACHT VRAGEN')}
<main id="main">
<section class="tl-section tl-section--dark" aria-labelledby="briefTitle" data-briefing>
  ${overline('01 / JOUW BRIEFING', 'DRIE CONCEPTEN, ELK MET EEN ANDERE INVALSHOEK')}
  <div class="tl-columns">
    <p class="tl-intro-label">Een eventbureau begint met een briefing en komt terug met drie richtingen. Dat doen wij ook: beantwoord acht vragen en je krijgt drie wezenlijk verschillende concepten uit onze bibliotheek, met de reden waarom ze passen en waar je op moet letten.</p>
    <h1 class="tl-display" id="briefTitle">ACHT<br>VRAGEN.<br><span class="tl-accent">DRIE</span><br>CONCEPTEN.</h1>
  </div>
  <form class="tl-questionnaire" data-brief-form aria-describedby="briefNote" novalidate toolname="top_locaties_briefing" tooldescription="Beantwoord de briefing (doel, aantal gasten, gevoel, dagdeel, regio) en krijg drie passende eventconcepten uit Top Locaties.">
    <div class="tl-questionnaire__grid">
      <label class="tl-field tl-questionnaire__wide">${q(1, 'AANLEIDING — WAAROM NU?')}<select name="aanleiding"><option value="">Kies een aanleiding</option>${occasionTypes.map((o) => html`<option value="${o.id}">${o.label}</option>`)}</select></label>
      <label class="tl-field tl-questionnaire__wide">${q(2, 'DOEL — WAT MOET HET OPLEVEREN? *')}<input name="doel" toolparamdescription="Wat moet het event opleveren, in één zin" required aria-required="true" aria-describedby="briefErr" placeholder="Bijv. dat iedereen de nieuwe koers kan navertellen"></label>
      <label class="tl-field">${q(3, 'DOELGROEP')}<input name="doelgroep" placeholder="Bijv. alle medewerkers, relaties"></label>
      <label class="tl-field">${q(4, 'AANTAL GASTEN *')}<input name="gasten" type="number" min="5" max="5000" inputmode="numeric" toolparamdescription="Verwacht aantal gasten (5–5000)" required aria-required="true" aria-describedby="briefErr" placeholder="Bijv. 80"></label>
      <fieldset class="tl-field tl-questionnaire__wide"><legend>${pad(5)} / GEVOEL — WAT NEMEN ZE MEE NAAR HUIS? (MAX. TWEE)</legend><div class="tl-chip-set">
        ${feelings.map((f) => html`<button class="tl-chip-button" type="button" data-brief-feel="${f.id}" aria-pressed="false">${f.label.toUpperCase()} +</button>`)}
      </div></fieldset>
      <label class="tl-field">${q(6, 'DAGDEEL')}<select name="dagdeel"><option value="">Maakt niet uit</option><option value="ochtend">Ochtend</option><option value="middag">Middag</option><option value="halve">Halve dag (ochtend of middag)</option><option value="dag">Hele dag</option><option value="avond">Avond</option></select></label>
      <label class="tl-field">${q(7, 'REGIO OF PLAATS')}<input name="regio" placeholder="Bijv. Utrecht of Noord-Holland"></label>
      <label class="tl-field">${q(8, 'BUDGETNIVEAU')}<select name="budgetniveau"><option value="">Gemiddeld</option><option value="bescheiden">Bescheiden / budgetbewust</option><option value="ruim">Ruim / exclusief</option></select></label>
      <label class="tl-field"><span>SFEER (OPTIONEEL)</span><select name="sfeer"><option value="">Geen voorkeur</option>${moodDirections.map((m) => html`<option value="${m.id}">${m.label}</option>`)}</select></label>
      <fieldset class="tl-field tl-questionnaire__wide"><legend>RANDVOORWAARDEN</legend><div class="tl-chip-set">
        <label class="tl-check tl-check--on-dark"><input type="checkbox" name="hybride" value="ja"> Ook online deelnemers</label>
        <label class="tl-check tl-check--on-dark"><input type="checkbox" name="toegankelijk" value="ja"> Rolstoeltoegankelijk</label>
        <label class="tl-check tl-check--on-dark"><input type="checkbox" name="duurzaam" value="ja"> Zo duurzaam mogelijk</label>
        <label class="tl-check tl-check--on-dark"><input type="checkbox" name="interactie" value="ja"> Veel interactie</label>
      </div></fieldset>
      <label class="tl-field"><span>ORGANISATIE (OPTIONEEL)</span><input name="organisatie" autocomplete="organization" placeholder="Komt op je conceptplan"></label>
      <label class="tl-field"><span>DATUM (OPTIONEEL)</span><input name="datum" type="date"></label>
    </div>
    <ul class="tl-request__errors" id="briefErr" data-brief-errors hidden></ul>
    <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" id="briefNote" role="status" aria-live="polite" data-brief-status>* verplicht. Je antwoorden blijven in deze browser; geen account nodig.</span><button class="tl-button tl-button--accent" type="submit">TOON MIJN DRIE CONCEPTEN ↓</button></div>
  </form>
</section>
<section class="tl-section tl-section--taupe" aria-labelledby="recTitle" data-brief-results hidden tabindex="-1">
  ${overline('02 / DRIE RICHTINGEN', 'UITLEGBAAR, NIET OP SCORE')}
  <h2 class="tl-display tl-display--md tl-section-head" id="recTitle">DIT ZIJN<br><span class="tl-accent">JOUW DRIE.</span></h2>
  <div class="tl-catalog" data-brief-grid></div>
  <p class="tl-note tl-note--gap">Elk concept opent met jouw antwoorden al ingevuld in de vragenlijst op maat. Vandaar maak je het draaiboek, de offerteaanvragen en het complete conceptplan. Twijfel je? Laat de drie naast elkaar zien aan je opdrachtgever en kies samen.</p>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/eventconcepten/op-gevoel/', label: 'KIES OP GEVOEL ↗' }, { href: '/zelf-organiseren/', label: 'ZELF ORGANISEREN ↗' }] })}`;
  const pageData = {
    feelings: feelings.map((f) => ({ id: f.id, label: f.label })),
    occasionTypes,
    venues: Object.fromEntries(data.venues.map((v) => [v.id, { city: v.city, province: v.province }])),
    concepts: data.concepts.map((c) => ({
      slug: c.slug, title: c.title, teaser: c.teaser, category: c.category, categoryLabel: c.categoryLabel, priority: c.priority,
      dayPart: c.dayPart, dayPartLabel: c.dayPartLabel, duration: c.duration, format: c.format, hero: c.hero.src,
      guestCountMin: c.guestCountMin, guestCountMax: c.guestCountMax, feelingWeights: c.feelingWeights, occasions: c.occasions,
      moodDirections: c.moodDirections, venueMatches: c.venueMatches.map((m) => ({ venueId: m.venueId })),
    })),
  };
  return layout({
    title: 'Conceptplan op maat — briefing in acht vragen | Top Locaties',
    description: 'Beantwoord acht briefingvragen en krijg drie wezenlijk verschillende eventconcepten, met uitleg waarom ze passen. Compleet uit te werken tot draaiboek en conceptplan.',
    path: '/conceptplan/', body, scripts: ['briefing.js'], data: pageData,
  });
}

/* ---------------- /eventconcepten/<slug>/conceptplan/ ----------------
   Volgt het sjabloon 'Eventconceptplan voor zakelijke evenementen': projectgegevens, conceptbelofte en twaalf hoofdstukken.
   Velden die alleen de organisator kent (eigenaar, nulmeting, ramingen, besluiten) zijn invulbaar en blijven in de browser. */
export function renderPlanDocument(data, c) {
  const labels = data.feelingLabels;
  const P = c.plan || {};
  const venues = c.venueMatches.map((m) => ({ m, v: data.venueById[m.venueId] })).filter((x) => x.v).slice(0, 3);
  const sups = (c.supplierMatches || []).map((m) => ({ m, s: data.supplierById[m.supplierId] })).filter((x) => x.s);
  const peak = (c.journey || []).find((j) => /hoogtepunt/i.test(j.phase));
  const field = (key, label, placeholder = 'In te vullen', rows = 2) => html`<label class="tl-doc__field"><span class="tl-visually-hidden">${label}</span><textarea class="tl-doc__input" data-doc-field="${key}" rows="${rows}" placeholder="${placeholder}"></textarea></label>`;
  const item = (label, inner) => html`<div class="tl-doc__item"><h3 class="tl-doc__label">${label}</h3><div>${inner}</div></div>`;
  const table = (head, rows, cls = '') => html`<div class="tl-doc__table${cls}" role="table"><div class="tl-doc__row tl-doc__row--head" role="row">${head.map((h) => html`<span role="columnheader">${h}</span>`)}</div>${rows.map((r) => html`<div class="tl-doc__row" role="row">${r.map((x, i) => html`<span role="cell" data-label="${head[i]}">${x}</span>`)}</div>`)}</div>`;
  const checks = (key, xs, on = []) => html`<div class="tl-doc__checks">${xs.map((x, i) => html`<label class="tl-check"><input type="checkbox" data-doc-check="${key}-${i}" ${on.includes(i) ? 'data-default-on' : ''}> ${x}</label>`)}</div>`;
  const hint = (t) => html`<p class="tl-doc__hint"><strong>RICHTVRAAG</strong>${t}</p>`;
  const part = (n, title, lead, inner, id) => html`<section class="tl-doc__part" id="${id}" aria-labelledby="${id}-t">
  <div class="tl-doc__head"><span class="tl-mono">${pad(n)} / EVENTCONCEPT</span><h2 class="tl-doc__title" id="${id}-t">${title}</h2><p class="tl-doc__lead">${lead}</p></div>
  <div class="tl-doc__body">${inner}</div>
</section>`;
  const moodAll = data.moodDirections.length ? data.moodDirections : [];
  const moodOn = moodAll.map((m, i) => ((c.moodDirections || []).includes(m.id) ? i : -1)).filter((i) => i >= 0);
  const kp = c.kpis || [];

  const body = html`${header({ current: 'concepten', planHref: `/eventconcepten/${c.slug}/#samenstellen` })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/eventconcepten/', label: 'EVENTCONCEPTEN' }, { href: `/eventconcepten/${c.slug}/`, label: c.title.toUpperCase() }, { label: 'CONCEPTPLAN' }], 'TWAALF HOOFDSTUKKEN / PRINTBAAR')}
<main id="main" class="tl-doc" data-plan-doc data-concept="${c.slug}">
<section class="tl-doc__cover" aria-labelledby="docTitle">
  <div class="tl-overline"><span>EVENTCONCEPTPLAN / ZAKELIJK EVENEMENT</span><span>${c.format}</span></div>
  <h1 class="tl-display" id="docTitle">${lines(c.headline)}</h1>
  <p class="tl-lead">${c.proposition}</p>
  <div class="tl-doc__grid">
    <div><h2 class="tl-doc__label">PROJECTGEGEVENS</h2>
      ${item('NAAM EVENEMENT', field('naam', 'Naam evenement', c.title, 1))}
      ${item('OPDRACHTGEVER', field('opdrachtgever', 'Opdrachtgever', 'Organisatie en contactpersoon', 1))}
      ${item('DATUM EN PLAATS', field('datumplaats', 'Datum en plaats', `Voorkeursperiode en regio · ${c.duration}`, 1))}
      ${item('DOELGROEP EN OMVANG', field('omvang', 'Doelgroep en omvang', `${(c.audiences || [])[0] || ''} · ${c.guestCountMin}–${c.guestCountMax} gasten`, 1))}
      ${item('BUDGET EN STATUS', field('budgetstatus', 'Budget en status', 'Budgetbandbreedte, versie en datum', 1))}
    </div>
    <div><h2 class="tl-doc__label">DE KERN IN ÉÉN ZIN</h2><p class="tl-doc__quote">${c.teaser}</p>
      <p class="tl-mono">GEVOEL: ${c.feelings.map((f) => labels[f].toUpperCase()).join(' + ')} / ${c.duration.toUpperCase()}</p></div>
  </div>
  <div class="tl-composer__actions tl-doc__actions"><span class="tl-mono" role="status" aria-live="polite" data-doc-status>Invulvelden en vinkjes blijven in deze browser. Antwoorden uit de vragenlijst op maat zijn al ingevuld.</span><span class="tl-chip-set"><a class="tl-button tl-button--outline" href="/eventconcepten/${c.slug}/#samenstellen">DRAAIBOEK OP MAAT ↗</a><button class="tl-button tl-button--accent" type="button" data-doc-print>PRINT / BEWAAR ALS PDF</button></span></div>
</section>

${part(1, 'DE ZAKELIJKE AANLEIDING', 'Waarom is dit evenement nodig en hoe sluit het aan op de ambities van de organisatie?', html`
  ${item('DE OPDRACHT', field('opdracht', 'De opdracht', 'Welke vraag stelt de opdrachtgever precies?'))}
  ${item('AANLEIDING EN CONTEXT', html`<p>${c.occasionText}</p>${field('aanleiding', 'Jullie aanleiding', 'Jullie eigen aanleiding')}`)}
  ${item('PRIMAIR ZAKELIJK DOEL', html`<p>${c.objective}</p>`)}
  ${item('WAT GEBEURT ER ZONDER DIT EVENEMENT', html`<p>${P.whyLive}</p>`)}
  ${item('AFBAKENING', html`<p>${P.scope}</p>`)}
  ${hint('Omschrijf het probleem concreet. Vermijd doelstellingen als alleen “inspireren” of “een mooie dag organiseren”.')}`, 'aanleiding')}

${part(2, 'DOELSTELLINGEN EN SUCCESCRITERIA', 'Concrete effecten voor de organisatie en de deelnemers. Meet niet alleen opkomst en tevredenheid.', html`
  ${table(['NIVEAU', 'GEWENST RESULTAAT', 'MEETBAAR BEWIJS'], [
    ['Zakelijk', (c.goals?.business || []).join('; '), kp[0] ? `${kp[0].kpi} (${kp[0].when.toLowerCase()})` : 'In te vullen'],
    ['Deelnemer', (c.goals?.participant || []).join('; '), kp[1] ? `${kp[1].kpi} (${kp[1].when.toLowerCase()})` : 'In te vullen'],
    ['Gedrag', (c.goals?.behaviour || []).join('; '), kp[2] ? `${kp[2].kpi} (${kp[2].when.toLowerCase()})` : 'In te vullen'],
  ], ' tl-doc__table--three')}
  ${item('HOOFDDOEL IN ÉÉN ZIN', html`<p>${c.objective}</p>${field('hoofddoel', 'Hoofddoel aangescherpt', 'Aanscherpen met doelgroep en tijdstip')}`)}
  ${item('MINIMAAL SUCCES', field('minimaal', 'Minimaal succes', 'Welke ondergrens maakt het evenement waardevol?'))}
  ${item('AMBITIENIVEAU', field('ambitie', 'Ambitieniveau', 'Wat is het gewenste scenario?'))}
  ${item('WIE IS EIGENAAR VAN HET RESULTAAT', field('eigenaar', 'Eigenaar resultaat', 'Persoon die verantwoordelijk is voor opvolging en rapportage', 1))}
  ${hint('Leg nulmeting, meetmethode en meetmoment vast voordat de creatieve ontwikkeling begint.')}`, 'doelen')}

${part(3, 'DOELGROEP EN STAKEHOLDERS', 'Ontworpen voor de mensen die moeten komen, niet alleen voor wie het betaalt.', html`
  ${item('PRIMAIRE DOELGROEP', html`<p>${(c.audiences || []).join(' · ')}</p>${field('doelgroep', 'Jullie doelgroep', 'Functies, kenmerken, omvang en voorkennis')}`)}
  ${item('WAAROM ZOUDEN ZIJ KOMEN', html`<p>${c.audienceInsight?.why}</p>`)}
  ${item('DREMPELS EN IRRITATIES', html`<p>${c.audienceInsight?.avoid}</p>`)}
  ${item('GEWENSTE VERANDERING', html`<p>${(c.goals?.behaviour || []).join('. ')}.</p>`)}
  <h3 class="tl-doc__label tl-doc__label--gap">STAKEHOLDEROVERZICHT</h3>
  ${table(['GROEP', 'WAT IS VOOR HEN BELANGRIJK', 'WAT VRAGEN WE VAN HEN'], [
    ['Deelnemers', c.audienceInsight?.interests, c.audienceInsight?.mode],
    ['Opdrachtgever', c.objective, 'Eigenaarschap van het doel, tijdige besluiten en opvolging'],
    ['Partners en sponsoren', 'Zichtbaarheid die past bij het concept', 'Een bijdrage aan de beleving, geen verkoopmoment'],
    ['Organisatie en leveranciers', 'Eén briefing, een helder draaiboek en één aanspreekpunt', 'Uitvoering volgens draaiboek en offerte'],
  ], ' tl-doc__table--three')}
  ${item('BIJZONDERE BEHOEFTEN', html`${list(c.accessibility)}${field('behoeften', 'Bijzondere behoeften', 'Taal, dieet, cultuur, sensorische behoeften of mobiliteit')}`)}`, 'doelgroep')}

${part(4, 'DE CREATIEVE KERN', 'Eén idee dat de zakelijke vraag, het merk en de behoeften van de doelgroep verbindt.', html`
  ${item('CONCEPTNAAM', html`<p class="tl-doc__name">${c.title}</p>`)}
  ${item('BELOFTE IN ÉÉN ZIN', html`<p>${c.proposition}</p>`)}
  ${item('HET GROTE IDEE', html`<p><strong>${plain(c.idea?.label)}</strong></p><p>${c.idea?.body}</p>`)}
  ${item('RODE DRAAD', html`<p>${P.redThread}</p>`)}
  ${item('BIJDRAGE AAN HET MERK', field('merk', 'Bijdrage aan het merk', 'Hoe zijn identiteit, waarden en toon herkenbaar?'))}
  ${item('EÉN ONVERVANGBAAR ONDERDEEL', html`<p>${P.irreplaceable}</p>`)}
  ${hint('Kan een concurrent zijn naam erboven zetten zonder dat er iets verandert? Dan is het concept nog niet eigen genoeg.')}`, 'creatief')}

${part(5, 'SFEER EN BELEVING', 'Hoe het evenement moet voelen: emotie, omgeving, vormgeving en programma versterken elkaar.', html`
  ${item('GEWENSTE GEVOELSREGISTERS', checks('sfeer', moodAll.map((m) => m.label), moodOn))}
  ${item('DRIE SFEERWOORDEN', html`<p class="tl-doc__name">${(P.moodWords || []).join(' · ')}</p>`)}
  ${item('VISUELE RICHTING', html`<p>${P.visual}</p>`)}
  ${item('GELUID EN ZINTUIGLIJKE ERVARING', html`<p>${P.senses}</p>`)}
  ${item('EMOTIONEEL HOOGTEPUNT', html`<p>${peak ? peak.text : ''}</p>`)}
  ${item('BEWUSTE RUSTMOMENTEN', html`<p>${P.restMoments}</p>`)}
  ${item('VISUELE INSPIRATIE', html`<figure class="tl-doc__mood tl-image-frame"><img src="${c.hero.src}" alt="" loading="lazy" decoding="async"><figcaption class="tl-image-caption">SFEERBEELD TER ILLUSTRATIE — VERVANG DOOR EIGEN BEELD</figcaption></figure>`)}`, 'sfeer')}

${part(6, 'DE BEZOEKERSREIS', 'Van de eerste uitnodiging tot de laatste opvolging; iedere stap voegt iets toe.', html`
  ${table(['FASE', 'GEWENST GEVOEL', 'CONTACTMOMENT OF ACTIE'], (c.journey || []).map((j) => [j.phase, j.title, j.text]), ' tl-doc__table--three')}
  ${item('BELANGRIJKSTE WRIJVINGSPUNTEN', html`<p>${P.frictions}</p>`)}
  ${item('HOE BEGELEIDEN WE ONTMOETINGEN', list(c.connectionDesign))}
  ${hint('Teken de reis vanuit het perspectief van een gast: wat ervaart deze persoon hier?')}`, 'reis')}

${part(7, 'HET PROGRAMMA', 'Hoe inhoud, interactie en ontspanning het doel ondersteunen. Het minuut-tot-minuutdraaiboek staat op de conceptpagina.', html`
  ${table(['MOMENT', 'ACTIVITEIT OF FORMAT', 'FUNCTIE VOOR HET CONCEPT'], (c.program || []).map((p) => [html`<strong data-doc-time="${p.time}">${p.time}</strong> ${p.title}`, p.description, p.details?.why || '']), ' tl-doc__table--three')}
  ${item('BIJZONDERE WERKVORMEN', list((c.entertainment || []).map((e) => html`<strong>${e.moment}</strong> — ${e.option}`)))}
  ${item('SPREKERS EN BEGELEIDERS', list((c.crew || []).map((r) => html`<strong>${r.role}</strong> (${r.count}) — ${r.task}`)))}
  ${item('FLEXIBELE ONDERDELEN', list((c.variations || []).map((v) => html`<strong>${v.title}</strong> — ${v.text}`)))}
  ${hint('Zou het doel ook bereikt worden als dit onderdeel vervalt? Dan kan het eruit.')}`, 'programma')}

${part(8, 'LOCATIE EN LEVERANCIERS', 'Partners die het verhaal versterken en voldoen aan de praktische eisen.', html`
  ${item('TYPE LOCATIE EN GEWENSTE OMGEVING', list((c.spaces || []).map((sp) => html`<strong>${sp.space}</strong> — ${sp.requirements}`)))}
  ${table(['VOORWAARDE', 'EIS OF VOORKEUR', 'STATUS'], [
    ['Capaciteit en ruimtes', `${c.guestCountMin}–${c.guestCountMax} gasten; ${(c.spaces || []).map((sp) => sp.space.toLowerCase()).join(', ')}`, 'Te verifiëren'],
    ['Bereikbaarheid', 'Goed bereikbaar met openbaar vervoer; parkeren in de deelnemersinformatie', 'Te verifiëren'],
    ['Opstelling en techniek', (c.spaces || [])[0]?.requirements || '', 'Te verifiëren'],
    ['Toegankelijkheid', (c.accessibility || [])[0] || '', 'Te verifiëren'],
    ['Duurzaamheid', (c.sustainability || [])[0] || '', 'Te verifiëren'],
  ], ' tl-doc__table--three')}
  ${venues.map(({ m, v }, i) => item(i === 0 ? 'VOORKEURSLOCATIE' : `ALTERNATIEF ${i}`, html`<p><strong>${v.name}, ${v.city}</strong> — ${m.reason}</p><p><strong>Pluspunt:</strong> ${m.pro || ''} <strong>Let op:</strong> ${m.watch || ''}</p><p class="tl-mono">CAPACITEIT: ${v.capacityMax ? `TOT ${v.capacityMax} GASTEN (BRON: GREENBOOKINGS)` : 'ONBEKEND'} / BESCHIKBAARHEID EN PRIJS: OP TE VRAGEN</p>`))}
  ${item('PASSENDE LEVERANCIERS', list(sups.map(({ m, s }) => html`<strong>${m.role}</strong> — ${s.name}: ${m.reason}`)))}
  ${hint('Uitsluitend aangesloten Greenbookings-partners. Prijzen en beschikbaarheid pas opnemen als de partner ze heeft bevestigd.')}`, 'partners')}

${part(9, 'COMMUNICATIE EN ACTIVATIE', 'Een samenhangende campagne, met kanalen en inhoud op basis van de doelgroep.', html`
  ${item('BELANGRIJKSTE BOODSCHAP', html`<p class="tl-doc__name">${P.keyMessage}</p>`)}
  ${item('UITNODIGINGSSTRATEGIE', html`<p>${c.audienceInsight?.approach}</p>${c.invitation?.subject ? html`<p class="tl-mono">ONDERWERP: ${c.invitation.subject.toUpperCase()}</p>` : ''}${field('uitnodiger', 'Wie nodigt uit', 'Wie nodigt uit, via welk kanaal, met welke persoonlijke invalshoek?')}`)}
  ${table(['MOMENT', 'MIDDEL', 'GEWENSTE ACTIE / BOODSCHAP'], (c.communication || []).map((x) => [x.when, x.channel, x.message]), ' tl-doc__table--three')}
  ${item('REGISTRATIE EN GASTDATA', html`<p>Vraag alleen wat nodig is: naam, organisatie, dieetwensen en eventueel programmakeuzes. Vertel waarvoor je de gegevens gebruikt en hoe lang je ze bewaart, en vraag toestemming voor foto's en video.</p>`)}
  ${item('PERSOONLIJKE OPVOLGING', field('opvolging', 'Persoonlijke opvolging', 'Wie neemt contact op met wie, binnen welke termijn?'))}
  ${hint('Gebruik niet méér persoonsgegevens dan nodig en zorg voor een passende privacygrondslag.')}`, 'communicatie')}

${part(10, 'INVESTERING EN SCENARIO’S', 'Een concept is pas besluitbaar als kosten, aannames en varianten helder zijn. Wij noemen geen bedragen: die komen uit jouw offertes.', html`
  ${table(['KOSTENPOST', 'RAMING EXCL. BTW', 'AANNAMES OF OFFERTE'], [...(c.budgetItems || []), 'Onvoorzien', 'Totaal'].map((b, i) => [b, field(`raming-${i}`, `Raming ${b}`, '€', 1), field(`bron-${i}`, `Status ${b}`, b === 'Onvoorzien' ? 'Aannames' : b === 'Totaal' ? 'Exclusief btw' : 'Op te vragen / indicatief / bevestigd', 1)]), ' tl-doc__table--three')}
  <h3 class="tl-doc__label tl-doc__label--gap">SCENARIOVERGELIJKING</h3>
  ${table(['VARIANT', 'WAT IS ANDERS', 'INDICATIEVE INVESTERING'], [
    ['Essentieel', c.adjustments?.budgetbewust, field('sc-essentieel', 'Investering essentieel', '€', 1)],
    ['Voorkeur', `${c.title} zoals beschreven, met ${(c.program || []).length} programmaonderdelen.`, field('sc-voorkeur', 'Investering voorkeur', '€', 1)],
    ['Uitgebreid', c.adjustments?.exclusiever, field('sc-uitgebreid', 'Investering uitgebreid', '€', 1)],
  ], ' tl-doc__table--three')}
  ${item('FINANCIËLE RANDVOORWAARDEN', field('financieel', 'Financiële randvoorwaarden', 'Maximumbudget, sponsorbijdragen, afhankelijkheden en beslismomenten'))}`, 'investering')}

${part(11, 'HAALBAARHEID EN VERANTWOORD ORGANISEREN', 'De praktische uitvoerbaarheid, gecontroleerd vóór het concept definitief wordt.', html`
  ${item('VERPLICHTE CONTROLES', checks('controle', ['Beschikbaarheid, capaciteit en ruimtelijke indeling zijn geverifieerd', 'Technische productie, geluid en stroomvoorzieningen zijn haalbaar', 'Bereikbaarheid, toegankelijkheid en bezoekerscomfort zijn beoordeeld', 'Vergunningen, veiligheid en noodprocedures zijn onderzocht waar relevant', 'Duurzame keuzes voor vervoer, catering, materialen en afval zijn vastgelegd', 'Privacy, beeldgebruik en registratie zijn beoordeeld']))}
  <h3 class="tl-doc__label tl-doc__label--gap">BELANGRIJKSTE RISICO’S</h3>
  ${table(['RISICO', 'KANS EN IMPACT', 'MAATREGEL OF EIGENAAR'], (c.risks || []).map((r, i) => [r.risk, html`<label><span class="tl-visually-hidden">Kans en impact: ${r.risk}</span><select class="tl-doc__input" data-doc-field="risico-${i}"><option value="">Inschatten</option><option>Laag</option><option>Midden</option><option>Hoog</option></select></label>`, r.mitigation]), ' tl-doc__table--three')}
  ${item('VOORWAARDEN', list(c.conditions))}
  ${item('OPENSTAANDE BESLISSINGEN', field('beslissingen', 'Openstaande beslissingen', 'Welke informatie of goedkeuring ontbreekt nog?'))}
  ${item('PROJECTVERANTWOORDELIJKE', field('verantwoordelijke', 'Projectverantwoordelijke', 'Wie beslist, coördineert en levert op?', 1))}`, 'haalbaarheid')}

${part(12, 'IMPACT EN BESLUITVORMING', 'Wat de investering oplevert, hoe het gevolgd wordt en welk besluit nu nodig is.', html`
  ${table(['KPI', 'NULWAARDE EN DOEL', 'MEETMETHODE EN MOMENT'], kp.map((k, i) => [html`<strong>${k.goal}</strong> — ${k.kpi}`, field(`kpi-${i}`, `Nulwaarde en doel ${k.goal}`, 'Nu … / doel …', 1), `${k.how} · ${k.when}`]), ' tl-doc__table--three')}
  ${item('OPVOLGING NA 30 EN 90 DAGEN', html`${list(kp.filter((k) => /\d/.test(k.when)).map((k) => html`${k.when}: ${k.kpi.toLowerCase()} (${k.how.toLowerCase()})`))}${field('opvolging3090', 'Opvolging 30 en 90 dagen', 'Concrete actie, eigenaar en moment')}`)}
  ${item('BESLUIT DAT NU NODIG IS', field('besluit', 'Besluit dat nu nodig is', 'Keuze voor concept, budget, planning en vervolgstap'))}
  ${item('INTERNE KWALITEITSTOETS', checks('kwaliteit', ['Het zakelijke doel is helder en meetbaar', 'De behoefte van de doelgroep is aantoonbaar verwerkt', 'Het concept heeft een eigen, herkenbare creatieve kern', 'Gasten zijn actief betrokken en ervaren relevante waarde', 'Locatie, leveranciers en begroting zijn realistisch', 'Duurzaamheid, inclusie, privacy en veiligheid zijn meegenomen', 'Nazorg en impactmeting hebben een eigenaar']))}
  <fieldset class="tl-doc__status"><legend class="tl-doc__label">STATUS</legend>
    ${['Concept gereed voor bespreking', 'Aanpassingen nodig', 'Akkoord voor uitwerking'].map((x, i) => html`<label class="tl-check"><input type="radio" name="docstatus" value="${i}" data-doc-status-radio> ${x}</label>`)}
  </fieldset>`, 'impact')}
</main>
${footer({ links: [{ href: `/eventconcepten/${c.slug}/`, label: 'NAAR HET CONCEPT ↗' }, { href: '/conceptplan/', label: 'NIEUWE BRIEFING ↗' }, { href: '/zelf-organiseren/', label: 'ZELF ORGANISEREN ↗' }] })}`;
  return layout({
    title: `Conceptplan ${c.title} — twaalf hoofdstukken | Top Locaties`,
    description: `Het complete eventconceptplan voor ${c.title}: aanleiding, doelen, doelgroep, creatieve kern, sfeer, bezoekersreis, programma, partners, communicatie, investering, haalbaarheid en impact.`,
    path: `/eventconcepten/${c.slug}/conceptplan/`, body, scripts: ['plandoc.js'], noindex: true,
    data: { slug: c.slug, title: c.title },
  });
}
