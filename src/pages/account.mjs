// /account/ (registreren, inloggen, mijn concepten), /maker/ (eventconceptmaker), /presentatie/ (liggende presentatie, PDF).
// Schermen worden in de browser gevuld; accounts en opslag via Supabase (RLS: alleen eigen concepten).
import { html } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline } from '../templates/components.mjs';

const crumb = (items, right) => html`<nav class="tl-crumb" aria-label="Kruimelpad"><span>${items.map((it, i) => html`${i ? ' / ' : ''}${it.href ? html`<a href="${it.href}">${it.label}</a>` : html`<span aria-current="page">${it.label}</span>`}`)}</span><span>${right}</span></nav>`;
const accountData = (data) => ({ accounts: data.site.accounts || null, privacyUrl: data.site.contact?.privacyUrl });

export function renderAccount(data) {
  const body = html`${header({ current: 'account', cta: { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' } })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'ACCOUNT' }], 'JOUW EIGEN CONCEPTEN')}
<main id="main" data-account>
<section class="tl-section tl-section--dark" aria-labelledby="accTitle">
  ${overline('01 / JOUW ACCOUNT', 'GRATIS / ALLEEN E-MAIL EN WACHTWOORD')}
  <div class="tl-columns">
    <p class="tl-intro-label">Met een account bewaar je eigen concepten. Je kiest een standaardconcept als basis en past alles aan: programma, draaiboek, catering, entertainment, locatie en makers. Daarna download je het als presentatie (PDF), Word of tekst.</p>
    <div>
      <h1 class="tl-display" id="accTitle">JOUW<br>CONCEPTEN.<br><span class="tl-accent">BEWAARD.</span></h1>
      <div data-auth-out>
        <div class="tl-chip-set tl-account__tabs" role="tablist" aria-label="Kies">
          <button class="tl-chip-button tl-chip-button--on-dark" type="button" role="tab" aria-selected="true" aria-pressed="true" data-auth-tab="login">INLOGGEN</button>
          <button class="tl-chip-button tl-chip-button--on-dark" type="button" role="tab" aria-selected="false" aria-pressed="false" data-auth-tab="register">REGISTREREN</button>
          <button class="tl-chip-button tl-chip-button--on-dark" type="button" role="tab" aria-selected="false" aria-pressed="false" data-auth-tab="recover">WACHTWOORD VERGETEN</button>
        </div>
        <form class="tl-questionnaire tl-account__form" data-auth-form novalidate>
          <div class="tl-questionnaire__grid tl-questionnaire__grid--two">
            <label class="tl-field"><span>E-MAILADRES</span><input name="email" type="email" autocomplete="email" required></label>
            <label class="tl-field" data-auth-password><span>WACHTWOORD (MIN. 8 TEKENS)</span><input name="password" type="password" autocomplete="current-password" minlength="8" required></label>
          </div>
          <label class="tl-check tl-check--on-dark" data-auth-consent hidden><input type="checkbox" name="consent"> Ik ga akkoord dat Top Locaties mijn e-mailadres en concepten bewaart om mijn account te laten werken. Ik kan mijn account altijd verwijderen.</label>
          <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-auth-status></span><button class="tl-button tl-button--accent" type="submit" data-auth-submit>INLOGGEN ↗</button></div>
        </form>
      </div>
      <form class="tl-questionnaire tl-account__form" data-new-password hidden>
        <div class="tl-questionnaire__grid tl-questionnaire__grid--two"><label class="tl-field"><span>NIEUW WACHTWOORD (MIN. 8 TEKENS)</span><input name="password" type="password" autocomplete="new-password" minlength="8" required></label></div>
        <div class="tl-composer__actions"><span class="tl-mono tl-on-dark-note" role="status" aria-live="polite" data-newpw-status></span><button class="tl-button tl-button--accent" type="submit">WACHTWOORD OPSLAAN ✓</button></div>
      </form>
      <div class="tl-account__me" data-auth-in hidden>
        <p class="tl-mono">INGELOGD ALS <strong data-auth-email></strong></p>
        <span class="tl-chip-set"><button class="tl-button tl-button--outline tl-button--on-dark" type="button" data-sign-out>UITLOGGEN</button><button class="tl-text-button tl-on-dark-note" type="button" data-delete-account>ACCOUNT VERWIJDEREN</button></span>
      </div>
    </div>
  </div>
</section>
<section class="tl-section tl-section--taupe" aria-labelledby="myTitle" data-my hidden>
  ${overline('02 / MIJN CONCEPTEN', 'BEWERK, PRESENTEER, DOWNLOAD')}
  <div class="tl-section-head tl-section-head--top">
    <h2 class="tl-display tl-display--md" id="myTitle">MAAK HET<br><span class="tl-accent">VAN JOU.</span></h2>
    <form class="tl-account__new" data-new-concept>
      <label class="tl-field"><span class="tl-mono">START MET EEN STANDAARDCONCEPT</span><select name="basis" data-basis-select required></select></label>
      <button class="tl-button tl-button--accent" type="submit">NIEUW CONCEPT IN DE MAKER ↗</button>
    </form>
  </div>
  <p class="tl-visually-hidden" role="status" aria-live="polite" data-my-status></p>
  <div class="tl-account__list" data-my-list></div>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/conceptplan/', label: 'BRIEFING ↗' }, { href: '/zelf-organiseren/', label: 'ZELF ORGANISEREN ↗' }] })}`;
  return layout({ title: 'Account — eigen eventconcepten bewaren | Top Locaties', description: 'Registreer gratis en bewaar je eigen eventconcepten: pas programma, draaiboek en catering aan en download als presentatie, Word of tekst.', path: '/account/', body, scripts: ['account-page.js'], data: accountData(data), noindex: true });
}

export function renderMaker(data) {
  const body = html`${header({ current: 'account', cta: { href: '/account/', label: 'MIJN CONCEPTEN ↗' } })}
${crumb([{ href: '/', label: 'HOME' }, { href: '/account/', label: 'ACCOUNT' }, { label: 'CONCEPTMAKER' }], 'JE EIGEN CONCEPT, OP BASIS VAN EEN STANDAARD')}
<main id="main" data-maker>
<section class="tl-section" aria-labelledby="makerTitle">
  ${overline('CONCEPTMAKER', 'ALLES AAN TE PASSEN')}
  <div class="tl-section-head tl-section-head--top">
    <h1 class="tl-display tl-display--md" id="makerTitle" data-maker-heading>CONCEPT<br><span class="tl-accent">MAKER.</span></h1>
    <p data-maker-base>Kies een standaardconcept als basis en maak het helemaal van jou.</p>
  </div>
  <div data-maker-gate hidden></div>
  <div class="tl-maker__bar" data-maker-bar hidden>
    <span class="tl-maker__barleft"><label class="tl-maker__stage"><span class="tl-mono">STATUS</span><select data-maker-stage aria-label="Status van het event"></select></label>
    <span class="tl-mono" role="status" aria-live="polite" data-maker-status>NOG NIET OPGESLAGEN</span></span>
    <span class="tl-chip-set">
      <button class="tl-button tl-button--accent" type="button" data-maker-save>OPSLAAN ✓</button>
      <a class="tl-button tl-button--outline" href="/presentatie/" data-maker-deck>PRESENTATIE (PDF) ↗</a>
      <button class="tl-button tl-button--outline" type="button" data-export="pptx">POWERPOINT</button>
      <button class="tl-button tl-button--outline" type="button" data-export="docx">WORD</button>
      <button class="tl-button tl-button--outline" type="button" data-export="txt">TEKST</button>
      <button class="tl-button tl-button--outline" type="button" data-export="ics">AGENDA</button>
    </span>
  </div>
  <ul class="tl-maker__issues" data-maker-errors></ul>
  <form class="tl-maker" data-maker-form hidden novalidate></form>
  <section class="tl-maker tl-maker__part" aria-label="Delen, samenwerken en versies" data-maker-collab hidden></section>
</section>
</main>
${footer({ links: [{ href: '/account/', label: 'MIJN CONCEPTEN ↗' }, { href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/zelf-organiseren/', label: 'ZELF ORGANISEREN ↗' }] })}`;
  return layout({ title: 'Conceptmaker — maak je eigen eventconcept | Top Locaties', description: 'Pas een standaardconcept helemaal aan: programma, draaiboek, catering, entertainment, locatie en makers. Bewaar het in je account.', path: '/maker/', body, scripts: ['maker.js'], data: accountData(data), noindex: true });
}

export function renderPresentation(data) {
  const body = html`<div class="tl-deck__bar" data-deck-bar>
  <a class="tl-text-button" href="/" data-deck-back>← TERUG</a>
  <span class="tl-mono" role="status" aria-live="polite" data-deck-status>PRESENTATIE WORDT GEMAAKT…</span>
  <span class="tl-chip-set">
    <button class="tl-button tl-button--accent" type="button" data-deck-pdf>DOWNLOAD ALS PDF</button>
    <button class="tl-button tl-button--outline" type="button" data-export="pptx">POWERPOINT</button>
    <button class="tl-button tl-button--outline" type="button" data-export="docx">WORD</button>
    <button class="tl-button tl-button--outline" type="button" data-export="txt">TEKST</button>
  </span>
</div>
<main id="main" class="tl-deck" data-deck aria-label="Presentatie"></main>`;
  return layout({ title: 'Presentatie — eventconcept | Top Locaties', description: 'Liggende presentatie van een eventconcept, te downloaden als PDF.', path: '/presentatie/', body, scripts: ['presentation.js'], styles: ['deck-print.css'], data: accountData(data), noindex: true });
}

/* ---------------- /zoeken/ ---------------- */
export function renderSearch(data) {
  const body = html`${header({ current: 'zoeken' })}
${crumb([{ href: '/', label: 'HOME' }, { label: 'ZOEKEN' }], 'CONCEPTEN, LOCATIES EN MAKERS')}
<main id="main" data-search>
<section class="tl-section tl-section--mist tl-section--ring" aria-labelledby="searchTitle">
  ${overline('01 / ZOEKEN', `${data.concepts.length} CONCEPTEN / ${data.venues.length} LOCATIES / ${data.suppliers.length} MAKERS`)}
  <h1 class="tl-display" id="searchTitle">WAT ZOEK<br><span class="tl-accent">JE?</span></h1>
  <form class="tl-search" role="search" data-search-form action="/zoeken/">
    <label class="tl-visually-hidden" for="q">Zoek op concept, plaats, soort bijeenkomst of aantal personen</label>
    <input class="tl-search__input" id="q" name="q" type="search" autocomplete="off" placeholder="Bijv. vergaderen utrecht 20 personen" data-search-input>
    <button class="tl-button tl-button--accent" type="submit">ZOEK ↓</button>
  </form>
  <div class="tl-chip-row" role="group" aria-label="Soort resultaat">
    ${[['', 'ALLES'], ['concept', 'CONCEPTEN'], ['locatie', 'LOCATIES'], ['maker', 'MAKERS']].map(([k, l]) => html`<button class="tl-chip-button" type="button" data-search-type="${k}" aria-pressed="${k === '' ? 'true' : 'false'}">${l}</button>`)}
  </div>
  <p class="tl-mono tl-search__hint">PROBEER: ${['vergaderen utrecht 20 personen', 'diner avond', 'teamdag buiten', 'congres 300 gasten', 'catering'].map((x, i) => html`${i ? ' / ' : ''}<a href="/zoeken/?q=${encodeURIComponent(x)}" data-search-example>${x}</a>`)}</p>
</section>
<section class="tl-section" aria-labelledby="resTitle">
  <h2 class="tl-visually-hidden" id="resTitle">Resultaten</h2>
  <p class="tl-mono" role="status" aria-live="polite" data-search-status>Typ een zoekvraag.</p>
  <ol class="tl-search__results" data-search-results></ol>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/locaties/', label: 'LOCATIEZOEKER ↗' }, { href: '/leveranciers/', label: 'LEVERANCIERS ↗' }] })}`;
  return layout({ title: 'Zoeken — concepten, locaties en makers | Top Locaties', description: 'Zoek in alle eventconcepten, aangesloten partnerlocaties en makers van Top Locaties, op plaats, soort bijeenkomst of aantal personen.', path: '/zoeken/', body, scripts: ['search.js'], noindex: true });
}
