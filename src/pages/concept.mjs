import { html, lines, pad, raw } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline, venueCard, supplierCard, timeline, imageFrame, ext, SITE } from '../templates/components.mjs';
import { questionnaire, programTimeline, composerChoices, playbookSection, runbookSection, cateringSection, practicalSection, communicationSection, goalsSection, experienceSection, impactSection } from '../templates/runbook.mjs';

export function renderConcept(data, concept, index) {
  const { concepts, venueById, supplierById, feelingLabels } = data;
  const total = concepts.length;
  const venueMatches = concept.venueMatches.sort((a, b) => a.priority - b.priority).filter((m) => venueById[m.venueId]);
  const supplierMatches = concept.supplierMatches.filter((m) => supplierById[m.supplierId]);
  const coveredRoles = new Set(supplierMatches.map((m) => m.role));
  const others = concepts.filter((c) => c.slug !== concept.slug);
  const plain = concept.title;

  const body = html`
${header({ current: 'concepten', cta: { href: '#samenstellen', label: 'MAAK JOUW PLAN ↗' } })}
<nav class="tl-crumb" aria-label="Kruimelpad"><span><a href="/">HOME</a> / <a href="/#concepten">EVENTCONCEPTEN</a> / <span aria-current="page">${plain.toUpperCase()}</span></span><span>CONCEPTENLAB / EDITIE ${concept.number}</span></nav>
<main id="main">
<section class="tl-hero" aria-labelledby="conceptTitle">
  <div class="tl-hero__copy">
    <div class="tl-hero__meta"><span>${concept.categoryLabel}</span><span>${pad(index + 1)} / ${pad(total)}</span></div>
    <h1 class="tl-display tl-display--md" id="conceptTitle">${lines(concept.headline)}</h1>
    <div>
      <p class="tl-hero__intro">${concept.proposition}</p>
      <div class="tl-hero__footer">
        <a class="tl-round-link" href="#het-idee">ONTDEK HET IDEE <span class="tl-round-link__circle" aria-hidden="true">↓</span></a>
        <span class="tl-mono">${concept.guestCountMin}–${concept.guestCountMax} GASTEN / INDICATIEF<br>${concept.format}</span>
      </div>
    </div>
  </div>
  <figure class="tl-hero__image"><img src="${concept.hero.src}" alt="${concept.hero.alt}" fetchpriority="high"><figcaption>SFEERBEELD TER ILLUSTRATIE / CONCEPTVERKENNING — TOP LOCATIES × GREENBOOKINGS</figcaption></figure>
</section>

<div class="tl-signature" data-signature>
  <span class="tl-signature__intro">DIT CONCEPT GEEFT JE GASTEN</span>
  <span class="tl-signature__tags">${concept.feelings.map((f) => html`<span data-signature-feel="${f}">${feelingLabels[f].toUpperCase()}</span>`)}</span>
  <span class="tl-signature__intro" data-signature-chosen hidden></span>
  <a href="/#gevoel">KIES OPNIEUW OP GEVOEL ↗</a>
</div>

<div class="tl-concept-tools" data-concept-tools data-slug="${concept.slug}">
  <span class="tl-mono">GEBRUIK DIT CONCEPT</span>
  <span class="tl-chip-set">
    ${data.site.accounts?.enabled ? html`<a class="tl-button tl-button--accent" href="/maker/?basis=${concept.slug}">PAS AAN IN DE CONCEPTMAKER ↗</a>` : ''}
    <a class="tl-button tl-button--outline" href="/presentatie/?basis=${concept.slug}">PRESENTATIE (PDF) ↗</a>
    <button class="tl-button tl-button--outline" type="button" data-download="docx">DOWNLOAD WORD</button>
    <button class="tl-button tl-button--outline" type="button" data-download="txt">DOWNLOAD TEKST</button>
  </span>
  <span class="tl-mono tl-note" role="status" aria-live="polite" data-tools-status>${data.site.accounts?.enabled ? 'Aanpassen en bewaren met een gratis account.' : 'Presentatie, Word en tekst zijn direct te downloaden.'}</span>
</div>

<nav class="tl-section-nav" aria-label="Onderdelen van dit concept">
  <span class="tl-mono">HET CONCEPT / ${concept.number}</span>
  <div class="tl-section-nav__tabs"><a href="#het-idee">IDEE</a><a href="#doelen">DOELEN</a><a href="#beleving">BELEVING</a><a href="#programma">PROGRAMMA</a><a href="#draaiboek">DRAAIBOEK</a><a href="#catering">CATERING</a><a href="#locaties">LOCATIES</a><a href="#leveranciers">MAKERS</a><a href="#uitnodiging">COMMUNICATIE</a><a href="#praktisch">HAALBAARHEID</a><a href="#impact">IMPACT</a><a href="#samenstellen">OP MAAT</a></div>
  <a class="tl-button tl-button--accent" href="#samenstellen">SAMENSTELLEN ↗</a>
</nav>

<section class="tl-section" id="het-idee" aria-labelledby="ideaTitle">
  ${overline('01 / HET VERHAAL ACHTER HET CONCEPT', 'WAT MAAKT DIT BIJZONDER?')}
  <div class="tl-columns">
    <p class="tl-intro-label">${concept.idea.label}</p>
    <div>
      <h2 class="tl-display tl-display--md" id="ideaTitle">${lines(concept.idea.headline)}</h2>
      <p class="tl-body tl-body--gap">${concept.idea.body}</p>
      <dl class="tl-facts">
        <div><dt>VOOR WIE</dt><dd>${concept.audiences.join(', ')}</dd></div>
        <div><dt>BEDOELING</dt><dd>${concept.objective}</dd></div>
        <div><dt>GROEPSGROOTTE</dt><dd>${concept.guestCountMin}–${concept.guestCountMax} gasten (indicatief, geen capaciteitsclaim)</dd></div>
      </dl>
      <div class="tl-values">${concept.idea.values.map(([t, x], i) => html`<div><strong>${pad(i + 1)} / ${t}</strong><p>${x}</p></div>`)}</div>
    </div>
  </div>
</section>

${goalsSection(concept, '02', data)}
${experienceSection(concept, '03', data)}
<section class="tl-section tl-section--taupe" id="programma" aria-labelledby="programTitle">
  ${overline('04 / HET PROGRAMMA', 'KLIK OP EEN ONDERDEEL VOOR ALLE DETAILS')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="programTitle">VAN EERSTE<br>ONTMOETING<br>TOT <span class="tl-accent">WOW.</span></h2>
    <p>Het programma op hoofdlijnen. Open een onderdeel voor wat er gebeurt, hoe je het aanpakt, wie wat doet en wat je nodig hebt. Tijden schuiven mee met jouw starttijd in de vragenlijst.</p>
  </div>
  <div class="tl-program">
    ${imageFrame(concept.programImage, { cls: '', caption: 'SFEERBEELD TER ILLUSTRATIE / PROGRAMMA IN BEELD' })}
    <div>
      ${programTimeline(concept)}
      <p class="tl-note tl-note--gap">Het minuut-tot-minuutdraaiboek staat hieronder. Het programma is geen boekbaar arrangement: locatie en makers boek je zelf, via hun profiel.</p>
    </div>
  </div>
</section>
${runbookSection(concept, '05')}
${cateringSection(concept, '06')}

<section class="tl-section" id="locaties" aria-labelledby="venueTitle">
  ${overline('07 / DE PLEKKEN DIE HET WAAR KUNNEN MAKEN', 'UIT HET GREENBOOKINGS-NETWERK')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="venueTitle">DE JUISTE<br>PLEK VERANDERT<br><span class="tl-accent">ALLES.</span></h2>
    <p>Geen willekeurige locaties: redactionele suggesties op basis van sfeer en gebruik. Kies er één voor jouw plan, of klik door naar het profiel.</p>
  </div>
  <div class="tl-venue-grid">${venueMatches.map((m, i) => venueCard(venueById[m.venueId], m, i))}</div>
  <p class="tl-note tl-note--gap">* Locaties en capaciteit volgen het Greenbookings-profiel (bronstand ${data.syncedDate}). Geschiktheid en beschikbaarheid moeten per aanvraag worden bevestigd. Een sfeerbeeld is nooit een foto van de locatie zelf.</p>
  <p class="tl-note"><a href="/locaties/?concept=${concept.slug}">BEKIJK ALLE LOCATIES BIJ DIT CONCEPT ↗</a></p>
</section>

<section class="tl-section tl-section--mist" id="leveranciers" aria-labelledby="supplierTitle">
  ${overline('08 / DE MENSEN DIE HET WAARMAKEN', 'PROFESSIONELE LEVERANCIERS')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="supplierTitle">EEN IDEE KOMT<br>TOT LEVEN MET<br><span class="tl-accent">DE JUISTE MAKERS.</span></h2>
    <p>Eerst de rol, dan de partij. Deze leveranciers staan in het Greenbookings-netwerk; voeg toe wie je wilt meenemen in je plan.</p>
  </div>
  <div class="tl-roles"><span class="tl-roles__label">BENODIGDE ROLLEN:</span>${concept.supplierRoles.map((r) => html`<span class="tl-chip${coveredRoles.has(r) ? ' tl-chip--dark' : ''}">${r}${coveredRoles.has(r) ? ' ✓' : ' / NOG OPEN'}</span>`)}</div>
  <div class="tl-supplier-grid">${supplierMatches.map((m, i) => supplierCard(supplierById[m.supplierId], m, i))}</div>
  <p class="tl-note tl-note--gap">* Inspiratiesuggesties, geen bevestigde samenwerkingsverbanden of beschikbaarheidsclaims. Rollen met ‘nog open’ hebben nog geen gekoppelde partner.</p>
</section>
${communicationSection(concept, '09')}
${practicalSection(concept, '10')}
${impactSection(concept, '11')}
${playbookSection(data.playbook, '12')}

<section class="tl-section tl-section--dark" id="samenstellen" aria-labelledby="planTitle" data-composer data-concept="${concept.slug}">
  ${overline('13 / JOUW CONCEPT OP MAAT', 'KIES, BEANTWOORD, NEEM MEE')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="planTitle">MAAK HET<br><span class="tl-accent">VAN JOU.</span></h2>
    <p>Kies hierboven één locatie en je makers, beantwoord de vragen en je krijgt het complete draaiboek op maat: tijden, planning met data, catering, bezetting, checklist en uitnodiging. Het is geen boeking of reservering. Daarna maak je het <a href="/eventconcepten/${concept.slug}/conceptplan/">conceptplan in twaalf hoofdstukken ↗</a> voor je opdrachtgever.</p>
  </div>
  <div class="tl-composer tl-composer--bare">
    ${composerChoices(concept, data)}
    <div class="tl-composer__actions">
      <span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-plan-status>Kies wat bij jouw evenement past. Je keuzes worden alleen in deze browser bewaard.</span>
      <span class="tl-chip-set"><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-plan-reset>WIS KEUZES</button><button class="tl-button tl-button--accent" type="button" data-plan-copy>KOPIEER MIJN CONCEPTPLAN ↗</button></span>
    </div>
    <label class="tl-visually-hidden" for="planFallback">Je conceptplan als tekst</label>
    <textarea class="tl-composer__fallback" id="planFallback" readonly hidden data-plan-fallback></textarea>
    ${questionnaire(concept)}
  </div>
</section>
</main>
<div class="tl-selection-bar" data-selection-bar hidden><span data-selection-count>0 ONDERDELEN GEKOZEN</span><a href="#samenstellen">BEKIJK JOUW PLAN ↗</a></div>
${footer({
  left: 'GOEDE IDEEËN WERKEN AANSTEKELIJK.',
  right: 'ONTDEK MEER / TOP LOCATIES',
  title: ['WAT WORDT', 'JOUW VOLGENDE', 'VERHAAL?'],
  links: [
    ...others.slice(0, 2).map((c) => ({ href: `/eventconcepten/${c.slug}/`, label: `${c.title.toUpperCase()} ↗` })),
    { href: '/locaties/', label: 'ONTDEK ALLE LOCATIES ↗' },
    { href: '/#gevoel', label: 'KIES OPNIEUW OP GEVOEL ↗' },
  ],
})}`;

  return layout({
    title: concept.seo.title,
    description: concept.seo.description,
    path: `/eventconcepten/${concept.slug}/`,
    preload: concept.hero.src,
    body,
    scripts: ['concept.js', 'concept-tools.js'],
    data: {
      concept: (({ slug, title, proposition, feelings, objective, audiences, guestCountMin, guestCountMax, runbook, planning, catering, entertainment, crew, spaces, checklist, variations, risks, budgetItems, sustainability, evaluation, invitation, duration }) => ({ slug, title, proposition, feelings, objective, audiences, guestCountMin, guestCountMax, runbook, planning, catering, entertainment, crew, spaces, checklist, variations, risks, budgetItems, sustainability, evaluation, invitation, duration }))(concept),
      feelings: Object.entries(feelingLabels).map(([id, label]) => ({ id, label })),
      venues: Object.fromEntries(data.venues.map((v) => [v.id, { name: v.name, city: v.city, url: v.profileUrl, page: `/locaties/${v.slug}/`, capacityMin: v.capacityMin, capacityMax: v.capacityMax }])),
      suppliers: Object.fromEntries(data.suppliers.map((s) => { const m = supplierMatches.find((x) => x.supplierId === s.id); return [s.id, { name: s.name, role: m ? m.role : s.category, url: s.profileUrl }]; })),
      quoteQuestions: data.playbook?.quoteQuestions || {},
      origin: SITE.origin,
    },
  });
}
