import { html, pad, raw } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline, catalogCard, ext, SITE } from '../templates/components.mjs';

// Gastenfilter: "minimaal plek voor N gasten" = capaciteit_max ≥ N (en capaciteit_min ≤ N als die bekend is).
export const GUEST_OPTIONS = [25, 50, 100, 250, 500, 1000];

export function renderLocaties(data) {
  const { venues, taxonomy, concepts, syncedDate } = data;
  const provinces = [...new Set(venues.map((v) => v.province))].sort((a, b) => a.localeCompare(b, 'nl'));

  const checks = (name, map, n) => html`<fieldset class="tl-filter-group"><legend>${name === 'type' ? 'SOORT BIJEENKOMST' : 'KARAKTER VAN DE PLEK'} <span>${pad(n)}</span></legend>
    <div class="tl-checks">${Object.entries(map).map(([value, label]) => html`<label class="tl-check"><input type="checkbox" name="${name}" value="${value}"> ${label}</label>`)}</div></fieldset>`;

  const body = html`
${header({ current: 'locaties', cta: { href: '/#gevoel', label: 'DE INSPIRATIEWERELD ↗' } })}
<main id="main">
<section class="tl-finder-top" aria-labelledby="finderTitle">
  <div class="tl-finder-top__coord" aria-hidden="true">52° 05′ 22.1″ N<br>HET BEGINT BIJ DE JUISTE PLEK<br>COLLECTIE / NL 2026</div>
  ${overline('01 / ONTDEK DE LOCATIES', 'VAN CONCEPT NAAR CONCREET')}
  <div class="tl-finder-top__title">
    <h1 class="tl-display" id="finderTitle">VIND EEN PLEK<br>DIE <span class="tl-accent">IETS</span><br>LOSMAAKT.</h1>
    <p>Geen gewone zoekmachine. Wel bijzondere plekken uit het Greenbookings-netwerk die het decor worden van jouw volgende verhaal.</p>
  </div>
  <form class="tl-search" role="search" data-finder-search action="/locaties/" method="get">
    <div class="tl-field"><label for="q">WAAR BEN JE NAAR OP ZOEK?</label><input id="q" name="q" type="search" autocomplete="off" placeholder="Stad, naam of een bijzonder idee…"></div>
    <div class="tl-field"><label for="regio">WAAR?</label><select id="regio" name="regio"><option value="">Heel Nederland</option>${provinces.map((p) => html`<option value="${p}">${p}</option>`)}</select></div>
    <div class="tl-field"><label for="gasten">MET HOEVEEL GASTEN?</label><select id="gasten" name="gasten"><option value="">Aantal gasten</option>${GUEST_OPTIONS.map((n) => html`<option value="${n}">Plek voor ${n} gasten</option>`)}</select></div>
    <button class="tl-button" type="submit">ZOEK LOCATIES ↗</button>
  </form>
  <div class="tl-finder-top__teaser"><span>↳ ${pad(venues.length)} AANGESLOTEN GREENBOOKINGS-PARTNERS / BRONSTAND ${syncedDate}</span><span>✳ ZONDER EIGEN FOTO TONEN WE EEN GEMARKEERD SFEERBEELD</span></div>
</section>
<div class="tl-redline" aria-hidden="true"></div>

<div class="tl-finder" data-finder>
  <button class="tl-filter-toggle" type="button" aria-expanded="false" aria-controls="filterPanel" data-filter-toggle>FILTER DE LOCATIES <span data-filter-count></span> ↓</button>
  <aside class="tl-filters" id="filterPanel" aria-label="Filters" data-open="false">
    <div class="tl-filters__top"><span class="tl-filters__title">DE SELECTIE ✳</span><button class="tl-text-button" type="button" data-reset>RESET ALLES ↺</button></div>
    ${checks('type', taxonomy.eventTypes, 1)}
    ${checks('karakter', taxonomy.character, 2)}
    <div class="tl-filter-group"><label class="tl-filter-group__title" for="concept">OP BASIS VAN JE EVENTCONCEPT <span>03</span></label>
      <select id="concept" name="concept"><option value="">Alle concepten</option>${concepts.map((c) => html`<option value="${c.slug}">${c.title}</option>`)}</select></div>
    <button class="tl-button tl-filters__apply" type="button" data-apply>BEKIJK <span data-apply-count>${venues.length}</span> RESULTATEN ↓</button>
    <p class="tl-note tl-note--gap">Gastenfilter: toont locaties waarvan het Greenbookings-profiel minstens zoveel plek opgeeft. Onbekende capaciteit tonen we apart, niet als ‘geschikt’. Actuele beschikbaarheid loopt altijd via de locatie.</p>
  </aside>

  <section class="tl-results" aria-labelledby="resultTitle">
    <div class="tl-results-head">
      <div>
        <span class="tl-results-head__label" data-result-label>DE COLLECTIE / NEDERLAND</span>
        <h2 class="tl-results-head__title" id="resultTitle"><span class="tl-results-head__count" data-result-count>${pad(venues.length)}</span> PLEKKEN.<br>VEEL IDEEËN.</h2>
        <span class="tl-mono">MET AANDACHT GESELECTEERD • <span class="tl-accent" data-saved-count>0 BEWAARD</span></span>
      </div>
      <div class="tl-toolbar">
        <label class="tl-visually-hidden" for="sort">Sorteer locaties</label>
        <select id="sort" name="sort"><option value="">UITGELICHT</option><option value="naam">NAAM A—Z</option><option value="plaats">PLAATS A—Z</option><option value="capaciteit">MEESTE PLEK</option></select>
        <div class="tl-segmented" role="group" aria-label="Weergave"><button type="button" data-view="beeld" aria-pressed="true">BEELD</button><button type="button" data-view="regio" aria-pressed="false">REGIO</button></div>
      </div>
    </div>
    <div class="tl-active-filters" aria-label="Actieve filters" data-active-filters></div>
    <p class="tl-visually-hidden" role="status" aria-live="polite" data-result-status></p>

    <div class="tl-catalog" data-catalog>
      ${venues.map((v, i) => catalogCard(v, i, data))}
      <p class="tl-results-subhead" data-unknown-head hidden>CAPACITEIT ONBEKEND IN DE BRON — VRAAG NA BIJ DE LOCATIE OF DEZE PLEK BIEDT VOOR JE GROEP</p>
    </div>
    <div data-region-view hidden>
      ${provinces.map((p) => html`<div class="tl-region-group" data-region="${p}"><h3>${p}</h3><div class="tl-region-list">${venues.filter((v) => v.province === p).map((v) => html`<a href="${v.profileUrl}" target="_blank" rel="noopener noreferrer" data-region-item="${v.id}">${v.name} <span>${v.city} &nbsp;↗</span></a>`)}</div></div>`)}
    </div>
    <div class="tl-state tl-state--empty" data-empty hidden>
      <h3 class="tl-state__title">GEEN MATCH.</h3>
      <p>Geen locatie past bij deze combinatie. Haal een filter weg of probeer een andere plaats.</p>
      <button class="tl-button" type="button" data-reset>RESET DE ZOEKOPDRACHT ↺</button>
    </div>
    <div class="tl-state tl-state--error" data-error hidden>
      <h3 class="tl-state__title">DAT GING MIS.</h3>
      <p>De filters konden niet worden geladen. Alle locaties blijven hieronder zichtbaar, of probeer het opnieuw.</p>
      <button class="tl-button tl-button--accent" type="button" data-reload>OPNIEUW PROBEREN ↺</button>
    </div>
  </section>
</div>

<section class="tl-section tl-section--dark" aria-labelledby="helpTitle">
  ${overline('02 / NIET GEVONDEN WAT JE ZOEKT?', 'WE DENKEN VERDER')}
  <h2 class="tl-display tl-display--gap" id="helpTitle">DE PERFECTE<br>PLEK BESTAAT.<br><span class="tl-accent">SOMS EVEN ZOEKEN.</span></h2>
  <div class="tl-callout"><span>Hulp nodig bij het vinden van een passende locatie? Het hele aanbod staat op Greenbookings; locatie-zoeker.nl helpt gericht zoeken.</span><span class="tl-chip-set">${ext(SITE.locatieZoeker + '/', 'ONTDEK DE LOCATIE-ZOEKER ↗')}${ext(SITE.greenbookings + '/', 'ALLE LOCATIES OP GREENBOOKINGS ↗')}</span></div>
</section>
</main>
${footer({ left: 'EEN BIJZONDERE PLEK IS PAS HET BEGIN.', right: 'TOP LOCATIES / 2026', links: concepts.map((c) => ({ href: `/eventconcepten/${c.slug}/`, label: `${c.title.toUpperCase()} ↗` })) })}
<div class="tl-toast" data-toast role="status" hidden></div>`;

  return layout({
    title: 'Locaties ontdekken — bijzondere eventlocaties | Top Locaties',
    description: 'Zoek en filter bijzondere locaties uit het Greenbookings-netwerk op regio, groepsgrootte, soort bijeenkomst en eventconcept.',
    path: '/locaties/',
    body,
    scripts: ['finder.js'],
    data: { labels: { type: taxonomy.eventTypes, karakter: taxonomy.character, concept: Object.fromEntries(concepts.map((c) => [c.slug, c.title])) } },
  });
}
