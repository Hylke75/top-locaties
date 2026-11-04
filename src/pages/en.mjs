// English entry pages: /en/ and /en/concepts/. Full concept pages are in Dutch for now (linked, clearly labelled).
import { readFileSync } from 'node:fs';
import { html, lines, pad } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { footer, overline } from '../templates/components.mjs';

const EN = JSON.parse(readFileSync(new URL('../content/concepts.en.json', import.meta.url), 'utf8')).concepts;
const FEEL = { energie: 'Energy', verbinding: 'Connection', verwondering: 'Wonder', rust: 'Calm', focus: 'Focus', trots: 'Pride' };
const DAY = { ochtend: 'MORNING / HALF DAY', middag: 'AFTERNOON / HALF DAY', dag: 'FULL DAY', avond: 'EVENING' };

function enHeader(current) {
  return html`<header class="tl-header">
  <a class="tl-wordmark" href="/en/" aria-label="Top Locaties — English home">TOP<br>LOCATIES<span class="tl-wordmark__star" aria-hidden="true">✳</span></a>
  <div class="tl-header__actions">
    <nav class="tl-nav" id="tl-nav" aria-label="Main navigation" data-open="false">
      <a href="/en/concepts/"${current === 'concepts' ? ' aria-current="page"' : ''}>EVENT CONCEPTS</a>
      <a href="/locaties/" hreflang="nl">VENUES (NL)</a>
      <a href="/leveranciers/" hreflang="nl">SUPPLIERS (NL)</a>
      <a class="tl-button" href="/conceptplan/" hreflang="nl">BRIEFING (NL) ↗</a>
    </nav>
    <a class="tl-lang" href="/" hreflang="nl" lang="nl" aria-label="Nederlandse versie">NL</a>
    <button class="tl-menu-toggle" type="button" aria-expanded="false" aria-controls="tl-nav" data-menu-toggle><span data-menu-label>MENU</span><i class="tl-menu-toggle__bars" aria-hidden="true"></i></button>
  </div>
</header>`;
}
const card = (c, i) => {
  const e = EN[c.slug];
  return html`<article class="tl-concept-card" data-concept-card="${c.slug}">
  <a class="tl-concept-card__photo tl-image-frame" href="/eventconcepten/${c.slug}/" tabindex="-1" aria-hidden="true" hreflang="nl"><img src="${c.hero.src}" alt="" loading="lazy" decoding="async"><span class="tl-image-caption">CONCEPT ${c.number} / ILLUSTRATIVE IMAGE</span></a>
  <div class="tl-catalog-card__kicker"><span>${pad(i + 1)} / ${DAY[c.dayPart] || ''}</span><span>${c.guestCountMin}–${c.guestCountMax} GUESTS</span></div>
  <h3 class="tl-catalog-card__title"><a href="/eventconcepten/${c.slug}/" hreflang="nl">${e.title}</a></h3>
  <p class="tl-catalog-card__desc">${e.teaser}</p>
  <div class="tl-chip-set tl-concept-card__feelings">${c.feelings.map((f) => html`<span class="tl-chip">${FEEL[f] || f}</span>`)}</div>
  <div class="tl-catalog-card__foot"><span>${e.format}<br>FULL CONCEPT IN DUTCH</span><a class="tl-arrow-box" href="/eventconcepten/${c.slug}/" hreflang="nl" aria-label="Open the concept ${e.title} (in Dutch)">↗</a></div>
</article>`;
};

export function renderEnHome(data) {
  const top = data.concepts.slice(0, 6);
  const body = html`${enHeader('')}
<main id="main">
<section class="tl-section tl-section--dark tl-section--ring" aria-labelledby="enTitle">
  ${overline('01 / TOP LOCATIES', 'EVENT CONCEPTS × VENUES × MAKERS')}
  <div class="tl-columns">
    <p class="tl-intro-label">Why start with a room when you can start with the feeling you want to leave behind? Top Locaties is an editorial platform for business events in the Netherlands: complete event concepts, connected Greenbookings partner venues and the makers who bring them to life.</p>
    <div>
      <h1 class="tl-display" id="enTitle">NOT JUST<br>AN EVENT.<br><span class="tl-accent">AN EXPERIENCE.</span></h1>
      <p class="tl-body tl-body--gap">Every concept is complete: the idea, goals, programme, minute-by-minute run sheet, catering, entertainment, matching venues and suppliers. You tailor it yourself and download it as a presentation, Word or PowerPoint file.</p>
      <a class="tl-round-link" href="/en/concepts/">EXPLORE THE CONCEPTS <span class="tl-round-link__circle" aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>
<nav class="tl-quickstart" aria-labelledby="qsTitle">
  <h2 class="tl-mono" id="qsTitle">WHAT ARE YOU ORGANISING?</h2>
  <a class="tl-quickstart__item" href="/en/concepts/#meetings"><span class="tl-mono">01 / MORNING OR HALF DAY</span><strong>A MEETING</strong><span class="tl-quickstart__arrow" aria-hidden="true">↗</span></a>
  <a class="tl-quickstart__item" href="/en/concepts/#day"><span class="tl-mono">02 / FULL DAY</span><strong>A DAY EVENT</strong><span class="tl-quickstart__arrow" aria-hidden="true">↗</span></a>
  <a class="tl-quickstart__item" href="/en/concepts/#evening"><span class="tl-mono">03 / EVENING</span><strong>AN EVENING</strong><span class="tl-quickstart__arrow" aria-hidden="true">↗</span></a>
  <a class="tl-quickstart__item tl-quickstart__item--accent" href="/conceptplan/" hreflang="nl"><span class="tl-mono">04 / NOT SURE YET? (DUTCH)</span><strong>EIGHT QUESTIONS</strong><span class="tl-quickstart__arrow" aria-hidden="true">↗</span></a>
</nav>
<section class="tl-section tl-section--taupe" aria-labelledby="selTitle">
  ${overline('02 / A SELECTION', `${data.concepts.length} CONCEPTS IN TOTAL`)}
  <h2 class="tl-display tl-display--md tl-section-head" id="selTitle">SO MUCH<br><span class="tl-accent">IS POSSIBLE.</span></h2>
  <div class="tl-catalog">${top.map(card)}</div>
  <p class="tl-note tl-note--gap">The full concept pages, the venue finder and the concept maker are currently in Dutch. Venues are exclusively connected Greenbookings partners; availability and prices are requested from the venue.</p>
</section>
</main>
${footer({ lang: 'en', left: 'IT STARTS WITH AN IDEA.', right: 'WHAT WILL YOU MAKE?', links: [{ href: '/en/concepts/', label: 'ALL CONCEPTS ↗' }, { href: '/', label: 'NEDERLANDS ↗' }] })}`;
  return layout({ lang: 'en', title: 'Top Locaties — event concepts, venues and makers in the Netherlands', description: 'Complete business event concepts with programme, run sheet, catering and connected Greenbookings partner venues in the Netherlands. Start with the feeling you want to leave behind.', path: '/en/', body, alternates: [{ lang: 'nl', path: '/' }, { lang: 'en', path: '/en/' }] });
}

export function renderEnConcepts(data) {
  const group = (id, title, list) => html`<section class="tl-section${id === 'day' ? ' tl-section--taupe' : ''}" id="${id}" aria-labelledby="${id}Title">
  ${overline(title, `${pad(list.length)} CONCEPTS`)}
  <h2 class="tl-display tl-display--md tl-section-head" id="${id}Title">${title.split(' / ')[1]}</h2>
  <div class="tl-catalog">${list.map(card)}</div>
</section>`;
  const meetings = data.concepts.filter((c) => c.category === 'vergaderen' || c.dayPart === 'ochtend');
  const day = data.concepts.filter((c) => !meetings.includes(c) && (c.dayPart === 'dag' || c.dayPart === 'middag'));
  const evening = data.concepts.filter((c) => !meetings.includes(c) && c.dayPart === 'avond');
  const body = html`${enHeader('concepts')}
<main id="main">
<section class="tl-section tl-section--mist" aria-labelledby="ecTitle">
  ${overline('EVENT CONCEPTS', `${data.concepts.length} COMPLETE CONCEPTS`)}
  <h1 class="tl-display" id="ecTitle">COMPLETE<br>CONCEPTS.<br><span class="tl-accent">READY TO USE.</span></h1>
  <p class="tl-body tl-body--gap">Each concept includes the why, the experience, a full programme, run sheet, catering proposal, entertainment, matching partner venues and suppliers, and a guide to organise it yourself. Concept pages are in Dutch; your browser can translate them.</p>
</section>
${group('meetings', '01 / MEETINGS AND MORNINGS', meetings)}
${group('day', '02 / DAY AND AFTERNOON EVENTS', day)}
${group('evening', '03 / EVENINGS', evening)}
</main>
${footer({ lang: 'en', left: 'IT STARTS WITH AN IDEA.', right: 'WHAT WILL YOU MAKE?', links: [{ href: '/en/', label: 'HOME ↗' }, { href: '/eventconcepten/', label: 'NEDERLANDS ↗' }] })}`;
  return layout({ lang: 'en', title: 'Event concepts — complete business event concepts | Top Locaties', description: 'Complete event concepts for meetings, day events and evenings: programme, run sheet, catering, entertainment and connected partner venues in the Netherlands.', path: '/en/concepts/', body, alternates: [{ lang: 'nl', path: '/eventconcepten/' }, { lang: 'en', path: '/en/concepts/' }] });
}
