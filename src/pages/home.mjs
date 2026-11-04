import { html, lines, pad, raw } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { footer, overline, ext, wordmark, feelingCompass, compassData, SITE } from '../templates/components.mjs';


function guests(c) {
  return `${c.guestCountMin}–${c.guestCountMax} GASTEN`;
}

function featured(c, i, total) {
  return html`<article class="tl-featured" data-slide="${c.slug}" data-category="${c.category}" aria-roledescription="dia" aria-label="${pad(i + 1)} van ${pad(total)}: ${c.title}"${i ? raw(' hidden') : ''}>
  <a class="tl-featured__photo" href="/eventconcepten/${c.slug}/" aria-label="Bekijk het concept ${c.title}">
    <img src="${c.hero.src}" alt="${c.hero.alt}" loading="${i ? 'lazy' : 'eager'}" decoding="async">
    <span class="tl-featured__plus" aria-hidden="true">✳</span>
    <span class="tl-image-caption">CONCEPT ${c.number} / SFEERBEELD TER ILLUSTRATIE</span>
  </a>
  <div class="tl-featured__content">
    <div class="tl-featured__top tl-mono"><span>CONCEPTENLAB / ${c.categoryLabel}</span><span>${pad(i + 1)} / ${pad(total)}</span></div>
    <div>
      <h3 class="tl-featured__title">${lines(c.headline.map((l) => l.replace(/\*/g, '')))}</h3>
      <p class="tl-body">${c.teaser}</p>
      <div class="tl-chip-set"><span class="tl-chip">${guests(c)} / INDICATIEF</span>${c.tags.map((t) => html`<span class="tl-chip">${t}</span>`)}</div>
    </div>
    <div class="tl-featured__bottom"><span class="tl-mono">ONTDEK HET IDEE.<br>VIND DE PLEK. MAAK HET WAAR.</span><a class="tl-featured__arrow" href="/eventconcepten/${c.slug}/" aria-label="Bekijk het volledige concept ${c.title}">↗</a></div>
  </div>
</article>`;
}

export function renderHome(data) {
  const { concepts, feelings, feelingLabels, question } = data;
  const body = html`
<main id="main">
<section class="tl-poster" aria-labelledby="homeTitle">
  <img class="tl-poster__img" src="/assets/img/hero-event.webp" alt="" fetchpriority="high">
  <div class="tl-poster__brand">${wordmark({ light: true, href: '/' })}<small>Het platform voor<br>buitengewone<br>bijeenkomsten</small></div>
  <aside class="tl-floatpanel" aria-label="Menu">
    <button class="tl-floatpanel__toggle" type="button" aria-expanded="false" aria-controls="panelNav" data-panel-toggle><span data-panel-label>MENU</span><i class="tl-menu-toggle__bars" aria-hidden="true"></i></button>
    <div class="tl-floatpanel__intro" data-panel-intro>
      <div class="tl-floatpanel__label">STEL JE VOOR...</div>
      <p>Een evenement dat precies raakt. Een plek die verrast. Mensen die het waarmaken.</p>
      <a class="tl-button" href="#gevoel">KIES OP GEVOEL ↗</a>
    </div>
    <nav class="tl-floatpanel__nav" id="panelNav" aria-label="Hoofdnavigatie" hidden>
      <a href="#gevoel">Kies op gevoel ↗</a>
      <a href="/eventconcepten/">Eventconcepten ↗</a>
      <a href="/conceptplan/">Briefing: drie concepten ↗</a>
      <a href="/locaties/">Zoek locaties ↗</a>
      <a href="/leveranciers/">Leveranciers ↗</a>
      <a href="/mijn-plan/">Mijn plan ↗</a>
      <a href="#verhaal">Het verhaal ↗</a>
    </nav>
  </aside>
  <div class="tl-poster__ruler" aria-hidden="true"><div class="tl-poster__scale"><span>1000</span><span>900</span><span>800</span><span>700</span><span>600</span><span>500</span><span>400</span></div><div class="tl-poster__rule"></div></div>
  <div class="tl-poster__copy">
    <div class="tl-poster__meta"><span>DE KUNST VAN HET SAMENKOMEN / NL 2026</span><a href="#intro">SCROLL OM TE ONTDEKKEN ↓</a></div>
    <h1 class="tl-poster__title" id="homeTitle"><span>BUITENGEWOON</span><span>SAMEN.</span></h1>
  </div>
  <div class="tl-poster__vertical">CONCEPTEN × LOCATIES × LEVERANCIERS / SFEERBEELD</div>
</section>

<div class="tl-marquee" aria-hidden="true"><div class="tl-marquee__track">${[0, 1].map(() => raw('MEER DAN EEN LOCATIE <b>✳</b> MEER DAN EEN IDEE <b>✳</b> MEER DAN EEN EVENEMENT <b>✳</b> '))}</div></div>

<section class="tl-section" id="intro" aria-labelledby="introTitle">
  ${overline('01 / HET BEGIN', 'WE DENKEN GRAAG VERDER')}
  <div class="tl-columns">
    <p class="tl-intro-label">Waarom beginnen bij een zaal, als je ook kunt beginnen bij het gevoel dat je wilt achterlaten?</p>
    <div>
      <h2 class="tl-display" id="introTitle">NIET GEWOON<br>EEN EVENT.<br><span class="tl-accent">EEN ERVARING.</span></h2>
      <p class="tl-body tl-body--gap">Top Locaties is er voor iedereen die iets wil organiseren dat blijft hangen. Start met een idee. Ontdek welke plekken erbij passen. Vind de mensen die het tot leven brengen.</p>
      <a class="tl-round-link" href="#gevoel">BEGIN BIJ HET GEVOEL <span class="tl-round-link__circle" aria-hidden="true">↓</span></a>
    </div>
  </div>
</section>

${feelingCompass(data, { number: '02' })}

<section class="tl-section tl-section--taupe" id="concepten" aria-labelledby="conceptTitle" data-carousel>
  ${overline('03 / DE CONCEPTEN', `COLLECTIE / 01—${pad(concepts.length)}`)}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display" id="conceptTitle">ER IS ZÓVEEL<br>MOGELIJK.</h2>
    <p>Een selectie van ideeën waar bijzondere bijeenkomsten mee beginnen. Kies wat je raakt, wij laten zien hoe het kan.</p>
  </div>
  <div class="tl-chip-row" role="group" aria-label="Filter concepten op type">
    ${[{ id: 'all', label: 'ALLE IDEEËN' }, ...data.categories].map((c) => {
      const n = c.id === 'all' ? concepts.length : concepts.filter((x) => x.category === c.id).length;
      return html`<button class="tl-chip-button" type="button" data-category-filter="${c.id}" aria-pressed="${c.id === 'all' ? 'true' : 'false'}">${c.label} / ${pad(n)}</button>`;
    })}
  </div>
  <div aria-roledescription="carrousel" aria-label="Uitgelichte eventconcepten" aria-live="polite">
    ${concepts.map((c, i) => featured(c, i, concepts.length))}
  </div>
  <div class="tl-carousel__bar tl-mono">
    <span data-carousel-info>01 — ${pad(concepts.length)} / EVENTCONCEPTEN</span>
    <div class="tl-carousel__controls"><button class="tl-square-button" type="button" data-carousel-prev aria-label="Vorig concept">←</button><button class="tl-square-button" type="button" data-carousel-next aria-label="Volgend concept">→</button></div>
  </div>
</section>

<section class="tl-section" id="bouwstenen" aria-labelledby="piecesTitle">
  ${overline('04 / VAN IDEE NAAR REALITEIT', 'ALLE ONDERDELEN OP ÉÉN PLEK')}
  <h2 class="tl-display tl-display--gap" id="piecesTitle">HET JUISTE IDEE.<br>DE JUISTE PLEK.<br>DE JUISTE MENSEN.</h2>
  <div class="tl-pieces">
    <a class="tl-piece" href="/eventconcepten/"><span class="tl-mono">01 / HET BEGIN</span><strong class="tl-piece__title">EVENT<br>CONCEPTEN.</strong><span class="tl-piece__text">Laat je inspireren door ideeën die je zelf misschien nog niet had bedacht.</span><br><span class="tl-piece__go">ALLE CONCEPTEN ↗</span></a>
    <a class="tl-piece" href="/locaties/"><span class="tl-mono">02 / DE RUIMTE</span><strong class="tl-piece__title">BIJZONDERE<br>LOCATIES.</strong><span class="tl-piece__text">Van industriële hallen tot plekken midden in het groen, uit het Greenbookings-netwerk.</span><br><span class="tl-piece__go">ZOEK LOCATIES ↗</span></a>
    <a class="tl-piece" href="/leveranciers/"><span class="tl-mono">03 / DE MAKERS</span><strong class="tl-piece__title">CREATIEVE<br>LEVERANCIERS.</strong><span class="tl-piece__text">Van licht en geluid tot catering en creatie. Per concept zie je welke rol ze spelen.</span><br><span class="tl-piece__go">BEKIJK DE MAKERS ↗</span></a>
  </div>
</section>

<section class="tl-section tl-section--dark" id="verhaal" aria-labelledby="storyTitle">
  ${overline('05 / ACHTER HET IDEE', 'ÉÉN ECOSYSTEEM / VIER WEBSITES')}
  <h2 class="tl-display tl-display--gap" id="storyTitle">ALLE RUIMTE<br>VOOR <span class="tl-accent">GOEDE<br>IDEEËN.</span></h2>
  <div class="tl-steps">
    <div><b>01.</b><p>Ontdek een eventconcept dat bij je past.</p></div>
    <div><b>02.</b><p>Vind locaties die het verhaal versterken.</p></div>
    <div><b>03.</b><p>Betrek leveranciers die het waarmaken.</p></div>
  </div>
  <div class="tl-ecosystem">
    <div><strong>TOP-LOCATIES.NL</strong>Ontdekken en inspiratie: van gevoel naar concept, plek en makers.</div>
    <div><strong>GREENBOOKINGS.NL</strong>De bron: actuele profielen van locaties en leveranciers in het netwerk.</div>
    <div><strong>LOCATIE-ZOEKER.NL / MEETINGS.NU</strong>Gericht zoeken en zakelijke oriëntatie, elk met een eigen redactionele rol.</div>
  </div>
  <div class="tl-callout"><span>Een inspiratieplatform, gevoed door het netwerk van Greenbookings.</span>${ext(SITE.greenbookings + '/', 'BEKIJK GREENBOOKINGS ↗')}</div>
</section>
</main>
${footer({ links: [{ href: '#gevoel', label: 'KIES OP GEVOEL ↗' }, { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/leveranciers/', label: 'LEVERANCIERS ↗' }, { href: '/over/', label: 'OVER TOP LOCATIES ↗' }, { href: '/locaties/', label: 'ZOEK LOCATIES ↗' }, { href: SITE.greenbookings + '/', label: 'GREENBOOKINGS ↗', external: true }] })}`;

  return layout({
    title: 'Top Locaties — Buitengewoon samenkomen',
    description: 'Begin bij het gevoel dat je wilt achterlaten. Ontdek eventconcepten, de locaties en de makers om ze waar te maken — uit het Greenbookings-netwerk.',
    path: '/',
    preload: '/assets/img/hero-event.webp',
    body,
    scripts: ['compass.js', 'home.js'],
    data: compassData(data),
    jsonld: [
      { '@type': 'WebSite', '@id': `${SITE.origin}/#website`, name: 'Top Locaties', url: `${SITE.origin}/`, inLanguage: 'nl-NL', publisher: { '@id': `${SITE.origin}/#org` },
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE.origin}/zoeken/?q={search_term_string}` }, 'query-input': 'required name=search_term_string' } },
      { '@type': 'Organization', '@id': `${SITE.origin}/#org`, name: 'Top Locaties', url: `${SITE.origin}/`, logo: `${SITE.origin}/assets/img/favicon.svg`, parentOrganization: { '@type': 'Organization', name: 'Greenbookings', url: SITE.greenbookings } },
    ],
  });
}
