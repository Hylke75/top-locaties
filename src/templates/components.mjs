import { readFileSync } from 'node:fs';
// Gedeelde Top Locaties-componenten (server-render). Uitsluitend tl- klassen
// uit design-system/components.css. Geen pagina-eigen styling.
import { html, lines, pad, raw } from '../lib/html.mjs';
import { SITE } from '../lib/data.mjs';
import { explainMatch, rankConcepts } from '../client/lib/rank.js';

// Accounts staan site-breed aan/uit via src/content/site.json → accounts.enabled.
const ACCOUNTS_ON = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8')).accounts?.enabled === true;
const NAV = [
  { key: 'concepten', href: '/eventconcepten/', label: 'EVENTCONCEPTEN' },
  { key: 'locaties', href: '/locaties/', label: 'LOCATIES' },
  { key: 'leveranciers', href: '/leveranciers/', label: 'LEVERANCIERS' },
  { key: 'zelf', href: '/zelf-organiseren/', label: 'ZELF ORGANISEREN' },
  { key: 'plan', href: '/mijn-plan/', label: 'MIJN PLANNEN' }, // één begrip: plannen in de browser én in je account
  { key: 'zoeken', href: '/zoeken/', label: 'ZOEKEN' },
];

export const ext = (href, label, cls = '') =>
  html`<a class="${cls}" href="${href}" target="_blank" rel="noopener noreferrer">${label}<span class="tl-visually-hidden"> (opent in nieuw tabblad)</span></a>`;

export function wordmark({ light = false, href = '/' } = {}) {
  return html`<a class="tl-wordmark${light ? ' tl-wordmark--light' : ''}" href="${href}" aria-label="Top Locaties — naar de homepage">TOP<br>LOCATIES<span class="tl-wordmark__star" aria-hidden="true">✳</span></a>`;
}

// Eén vaste hoofdactie op alle pagina's. Op een conceptpagina scrolt hij naar het samenstellen (↓), elders opent hij Mijn plan (↗).
export const PLAN_CTA = 'STEL MIJN PLAN SAMEN';
export const navItems = () => NAV;

// EN-knop alleen op pagina's die een Engelse versie hebben (enPath); hij linkt naar precies die vertaling.
export function header({ current = '', planHref = '/mijn-plan/', enPath = null } = {}) {
  if (current === 'plan') planHref = '/eventconcepten/op-gevoel/'; // op Mijn plan zelf: begin een nieuw plan
  const scroll = planHref.startsWith('#');
  return html`<header class="tl-header">
  ${wordmark()}
  <div class="tl-header__actions">
    <nav class="tl-nav" id="tl-nav" aria-label="Hoofdnavigatie" data-open="false">
      ${navItems().map((n) => html`<a href="${n.href}"${n.key === current || (n.key === 'plan' && current === 'account') ? raw(' aria-current="page"') : ''}>${n.label}</a>`)}
      <a class="tl-button tl-button--accent" href="${planHref}" data-plan-cta>${PLAN_CTA} ${scroll ? '↓' : '↗'}</a>
    </nav>
    ${enPath ? html`<a class="tl-lang" href="${enPath}" hreflang="en" lang="en" aria-label="English version of this page">EN</a>` : ''}
    <button class="tl-menu-toggle" type="button" aria-expanded="false" aria-controls="tl-nav" data-menu-toggle><span data-menu-label>MENU</span><i class="tl-menu-toggle__bars" aria-hidden="true"></i></button>
  </div>
</header>`;
}

export const overline = (left, right) => html`<div class="tl-overline"><span>${left}</span><span>${right}</span></div>`;

export function footer({ left = 'HET BEGINT MET EEN IDEE.', right = 'WAT GA JIJ MAKEN?', title = null, links = [], lang = 'nl' } = {}) {
  return html`<footer class="tl-footer" id="footer">
  ${overline(left, right)}
  <div class="tl-footer__name">${title ? lines(title) : raw('TOP LOCATIES <span aria-hidden="true">✳</span>')}</div>
  ${links.length ? html`<nav class="tl-footer__links" aria-label="Verder ontdekken">${links.map((l) => (l.external ? ext(l.href, l.label) : html`<a href="${l.href}">${l.label}</a>`))}</nav>` : ''}
  <div class="tl-footer__bottom">
    <span class="tl-mono">${lang === 'en' ? '© TOP LOCATIES — PART OF THE GREENBOOKINGS NETWORK' : '© TOP LOCATIES — ONDERDEEL VAN HET GREENBOOKINGS-NETWERK'}</span>
    <span class="tl-mono">${lang === 'en' ? 'CONCEPT × VENUE × MAKER' : 'CONCEPT × LOCATIE × MAKER'}</span>
    <a class="tl-mono" href="#top">${lang === 'en' ? 'BACK TO TOP ↑' : 'TERUG NAAR BOVEN ↑'}</a>
  </div>
</footer>`;
}

/* ---------- Gevoelskompas ---------- */

export function feelingButton(f, i, pressed = false) {
  return html`<button class="tl-feeling" type="button" data-feel="${f.id}" data-shape="${f.shape}" style="--tl-feeling-color:${f.color}" aria-pressed="${pressed ? 'true' : 'false'}">
  <span class="tl-feeling__meta">${pad(i + 1)} / GEVOEL <span class="tl-feeling__check" aria-hidden="true">${pressed ? '✓' : '+'}</span></span>
  <span><strong class="tl-feeling__name">${f.label}</strong><span class="tl-feeling__desc">${f.sub}</span></span>
</button>`;
}

export function matchCard(entry, i, labels, selected = []) {
  const { concept, kind } = entry;
  const q = selected.length ? `?gevoel=${selected.join(',')}` : '';
  const rank = kind === 'match' ? (i === 0 ? 'ONZE MATCH' : 'OOK EEN MATCH') : kind === 'alternative' ? 'ANDERE RICHTING' : i === 0 ? 'UITGELICHT' : 'NOG EEN IDEE';
  const first = i === 0 && kind !== 'alternative';
  return html`<a class="tl-match${first ? ' tl-match--first' : ''}${kind === 'alternative' ? ' tl-match--alt' : ''}" href="/eventconcepten/${concept.slug}/${q}">
  <span class="tl-mono">${pad(i + 1)} / ${rank}</span>
  <strong class="tl-match__name">${concept.title}</strong>
  <span class="tl-match__reason">${explainMatch(entry, labels)}</span>
  <span class="tl-match__footer"><span>BEKIJK HET VOLLEDIGE CONCEPT</span><span aria-hidden="true">↗</span></span>
</a>`;
}

/* ---------- Beeld ---------- */

export function venueImage(v, { cls = 'tl-venue__photo', lazy = true } = {}) {
  // Terugval staat altijd onder de foto: tijdens het laden of als de foto ontbreekt zie je de plaats, nooit een leeg vlak.
  const fallback = html`<div class="tl-placeholder"${v.image.kind === 'none' ? raw(` role="img" aria-label="Nog geen foto van ${v.name.replace(/"/g, '&quot;')} beschikbaar"`) : raw(' aria-hidden="true"')}><span class="tl-placeholder__mark" aria-hidden="true">✳</span><span class="tl-placeholder__place">${v.city}</span><span class="tl-placeholder__text">${v.image.kind === 'none' ? 'Nog geen foto in het Greenbookings-profiel' : v.name}</span></div>`;
  if (v.image.kind === 'none') return html`<div class="${cls}">${fallback}</div>`;
  return html`<div class="${cls}">${fallback}<img src="${v.image.src}" alt="${v.image.alt}"${lazy ? raw(' loading="lazy"') : ''} decoding="async" width="900" height="675" onerror="this.nextElementSibling?.remove();this.remove()"><span class="tl-image-caption">${v.image.label}</span></div>`;
}

/* ---------- Locaties en leveranciers ---------- */

// Namen breken nooit midden in een woord: de lettergrootte schaalt mee met het langste woord (--tl-w) binnen de kaartbreedte.
const longest = (name = '') => Math.max(...String(name).split(/\s+/).map((w) => w.length), 1);
export const nameAttrs = (base, name) => raw(` class="${base} tl-fit" style="--tl-w:${longest(name)}"`);

/** Kerngegevens van een locatie uit de bron: regio, capaciteit (per opstelling als bekend) en prijs. Nooit verzonnen. */
export function venueFacts(v, { setups = 3 } = {}) {
  const per = v.setups?.length ? v.setups.slice(0, setups).map((x) => `${x.label} ${x.max}`).join(' · ') : '';
  return html`<dl class="tl-venue-facts">
    <div><dt>REGIO</dt><dd>${v.regio || v.province}</dd></div>
    <div><dt>CAPACITEIT</dt><dd>${v.capacity.toLowerCase()}${per ? html`<span class="tl-venue-facts__sub">${per}</span>` : ''}</dd></div>
    <div><dt>PRIJS</dt><dd>${v.priceIndication || 'Op aanvraag'}</dd></div>
  </dl>`;
}

export function venueCard(v, match, i) {
  return html`<article class="tl-venue" data-venue-card="${v.id}" data-selected="false">
  ${venueImage(v)}
  <div class="tl-venue__body">
    <span class="tl-mono">${pad(i + 1)} / ${v.city} — ${v.label}</span>
    <h3${nameAttrs('tl-venue__name', v.name)}>${v.name}</h3>
    <p class="tl-venue__copy">${v.line}</p>
    <div class="tl-venue__why"><b>${match.role ? `${match.role} — ` : ''}WAAROM DEZE PLEK?</b>${match.reason}${match.pro ? html`<span class="tl-venue__pro">+ ${match.pro}</span>` : ''}${match.watch ? html`<span class="tl-venue__watch">! ${match.watch}</span>` : ''}</div>
    ${venueFacts(v)}
    <p class="tl-venue__facts"><span>BRON: GREENBOOKINGS ${v.sourceDate}</span></p>
    <div class="tl-venue__actions">
      <button class="tl-button tl-venue__choose" type="button" data-choose-venue="${v.id}" aria-pressed="false">KIES DEZE PLEK +</button>
      <a class="tl-button tl-button--outline" href="/locaties/${v.slug}/">BEKIJK ↗</a>
    </div>
  </div>
</article>`;
}

export function supplierCard(s, match, i) {
  return html`<article class="tl-supplier" data-supplier-card="${s.id}" data-selected="false">
  <span class="tl-supplier__meta"><span>${pad(i + 1)} / ${s.label}</span><span>${s.city || 'NL'}</span></span>
  <span class="tl-supplier__mark" aria-hidden="true">${s.symbol}</span>
  <h3${nameAttrs('tl-supplier__name', s.name)}>${s.name}</h3>
  <p class="tl-supplier__desc"><span class="tl-supplier__role">ROL: ${match.role}</span>${match.reason} ${s.tagline}</p>
  <div class="tl-supplier__actions">
    <button class="tl-button tl-supplier__choose" type="button" data-choose-supplier="${s.id}" aria-pressed="false">VOEG TOE <span aria-hidden="true">+</span></button>
    <a class="tl-button tl-button--outline" href="/leveranciers/${s.slug}/">BEKIJK ↗</a>
  </div>
</article>`;
}

export function catalogCard(v, i, data) {
  const types = v.eventTypes.join(' ');
  return html`<article class="tl-catalog-card" data-venue="${v.id}" data-name="${v.name}" data-city="${v.city}" data-province="${v.province}" data-order="${v.order}" data-cap-min="${v.capacityMin ?? ''}" data-cap-max="${v.capacityMax ?? ''}" data-events="${types}" data-character="${v.character.join(' ')}" data-concepts="${v.concepts.map((c) => c.slug).join(' ')}" data-search="${[v.name, v.city, v.province, v.type, v.label, v.line].join(' ').toLowerCase()}">
  <div class="tl-catalog-card__image">
    ${v.image.kind === 'none'
      ? html`<div class="tl-placeholder" role="img" aria-label="Nog geen foto van ${v.name} beschikbaar"><span class="tl-placeholder__mark" aria-hidden="true">✳</span><span class="tl-placeholder__text">${v.image.label}</span></div>`
      : html`<div class="tl-placeholder" aria-hidden="true"><span class="tl-placeholder__mark">✳</span><span class="tl-placeholder__place">${v.city}</span></div><img src="${v.image.src}" alt="${v.image.alt}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async" width="900" height="600" onerror="this.nextElementSibling?.remove();this.remove()"><span class="tl-catalog-card__badge">${v.image.kind === 'source' ? 'BEELD: GREENBOOKINGS' : 'SFEERBEELD'} • ${v.label}</span>`}
    <button class="tl-catalog-card__save" type="button" data-save="${v.id}" aria-pressed="false" aria-label="Bewaar ${v.name}">+</button>
  </div>
  <div class="tl-catalog-card__kicker"><span><span data-index>${pad(i + 1)}</span> / ${v.province}</span><span>${v.city}</span></div>
  <h3${nameAttrs('tl-catalog-card__title', v.name)}><a href="/locaties/${v.slug}/">${v.name}</a></h3>
  <p class="tl-catalog-card__desc">${v.line}</p>
  ${v.concepts.length ? html`<p class="tl-catalog-card__concepts">PAST BIJ: ${v.concepts.map((c, n) => html`${n ? ' / ' : ''}<a href="/eventconcepten/${c.slug}/#locaties">${c.title}</a>`)}</p>` : ''}
  ${venueFacts(v)}
  <div class="tl-catalog-card__foot">
    <span>AANGESLOTEN PARTNER / BRON ${v.sourceDate}</span>
    <a class="tl-arrow-box" href="/locaties/${v.slug}/" aria-label="Bekijk ${v.name}">↗</a>
  </div>
</article>`;
}

/* ---------- Programma ---------- */

export function timeline(items) {
  return html`<div class="tl-timeline">${items.map((it) => html`<div class="tl-timeline__item"><span class="tl-timeline__time">${it.time}</span><div><h3 class="tl-timeline__title">${it.title}</h3><p class="tl-timeline__body">${it.description}</p></div></div>`)}</div>`;
}

export function imageFrame(img, { cls = 'tl-image-frame--landscape', caption } = {}) {
  return html`<figure class="tl-image-frame ${cls}"><img src="${img.src}" alt="${img.alt}" loading="lazy" decoding="async"><figcaption class="tl-image-caption">${caption || (img.illustrative ? 'SFEERBEELD TER ILLUSTRATIE' : img.credit)}</figcaption></figure>`;
}

/* ---------- Gevoelskompas (home, overzicht, op-gevoel) ---------- */

export function compassData(data) {
  return {
    feelings: data.feelings.map(({ id, label }) => ({ id, label })),
    concepts: data.concepts.map(({ id, slug, title, teaser, priority, feelings, feelingReasons, feelingWeights, category }) => ({ id, slug, title, teaser, priority, feelings, feelingReasons, feelingWeights, category })),
  };
}

export function feelingCompass(data, { number = '02', id = 'gevoel', headingLevel = 'h2' } = {}) {
  const initial = rankConcepts(data.concepts, []);
  const H = headingLevel;
  return html`<section class="tl-section tl-section--mist tl-section--ring" id="${id}" aria-labelledby="feelTitle" data-compass>
  ${overline(`${number} / HET GEVOELENSKOMPAS`, 'GEEN BRANCHE. GEEN LOCATIE. EERST GEVOEL.')}
  <div class="tl-feeling-head">
    ${raw(`<${H} class="tl-display" id="feelTitle">HOE MOET HET<br><span class="tl-accent">VOELEN?</span></${H}>`)}
    <p class="tl-feeling-head__question"><strong>${data.question}</strong>Kies maximaal twee gevoelens. Wij laten zien welke eventconcepten daarbij passen — en waarom.</p>
  </div>
  <p class="tl-mono" id="feelHint">KIES ÉÉN OF TWEE GEVOELENS ↓</p>
  <div class="tl-feeling-grid" role="group" aria-labelledby="feelHint" data-feeling-grid>
    ${data.feelings.map((f, i) => feelingButton(f, i))}
  </div>
  <p class="tl-note tl-note--gap" role="status" aria-live="polite" data-feel-notice></p>
  <div class="tl-results-rule">
    <div class="tl-results-rule__top">
      <h3 class="tl-display tl-display--sm" data-match-heading>VERRASSENDE IDEEËN.</h3>
      <button class="tl-text-button" type="button" data-feel-reset hidden>OPNIEUW KIEZEN ↺</button>
    </div>
    <p class="tl-visually-hidden" role="status" aria-live="polite" data-match-status></p>
    <div class="tl-match-grid" data-match-grid>${initial.map((e, i) => matchCard(e, i, data.feelingLabels))}</div>
    <p class="tl-note tl-note--gap">Deze suggesties zijn redactioneel gekoppeld aan de gewenste beleving — geen berekende score. Op de conceptpagina vind je het programma, passende locaties en leveranciers.</p>
  </div>
</section>`;
}

export function conceptCard(c, i, labels) {
  return html`<article class="tl-concept-card" data-concept-card="${c.slug}" data-category="${c.category}" data-daypart="${c.dayPart || ''}" data-feelings="${c.feelings.join(' ')}">
  <a class="tl-concept-card__photo tl-image-frame" href="/eventconcepten/${c.slug}/" tabindex="-1" aria-hidden="true"><img src="${c.hero.src}" alt="" loading="lazy" decoding="async"><span class="tl-image-caption">CONCEPT ${c.number} / SFEERBEELD</span></a>
  <div class="tl-catalog-card__kicker"><span>${pad(i + 1)} / ${c.categoryLabel}</span><span>${c.guestCountMin}–${c.guestCountMax} GASTEN</span></div>
  <h3 class="tl-catalog-card__title"><a href="/eventconcepten/${c.slug}/">${c.title}</a></h3>
  <p class="tl-catalog-card__desc">${c.teaser}</p>
  <div class="tl-chip-set tl-concept-card__feelings">${c.feelings.map((f) => html`<span class="tl-chip">${labels[f]}</span>`)}</div>
  <div class="tl-catalog-card__foot"><span>${c.dayPartLabel ? html`${c.dayPartLabel} · ` : ''}${c.format}<br>${c.venueMatches.length} PARTNERLOCATIES / ${c.supplierRoles.length} ROLLEN</span><a class="tl-arrow-box" href="/eventconcepten/${c.slug}/" aria-label="Bekijk het concept ${c.title}">↗</a></div>
</article>`;
}

export function state(kind, title, text, action = '') {
  return html`<div class="tl-state tl-state--${kind}"><h3 class="tl-state__title">${title}</h3><p>${text}</p>${action}</div>`;
}

export { SITE };

/* ---------- Contact-pop-up voor een partnerlocatie ---------- */
export function contactButton(v, cls = 'tl-button tl-button--accent') {
  return html`<button class="${cls}" type="button" data-open-dialog="contact-${v.slug}" aria-haspopup="dialog">NEEM CONTACT OP ↗</button>`;
}

export function contactDialog(v, site) {
  const p = v.contactPerson;
  const id = `contact-${v.slug}`;
  return html`<dialog class="tl-dialog tl-contact" id="${id}" aria-labelledby="${id}-t" data-contact-dialog data-venue-id="${v.id}" data-venue-slug="${v.greenbookingsSlug}" data-venue-name="${v.name}" data-profile="${v.profileUrl}" data-endpoint="${site.contact.endpoint || ''}" data-source="${site.contact.source}">
  <div class="tl-dialog__head"><span class="tl-mono">CONTACT / ${v.name.toUpperCase()}</span><button class="tl-dialog__close" type="button" data-close-dialog aria-label="Sluiten">SLUITEN ×</button></div>
  <div class="tl-contact__person">
    ${p?.photo ? html`<img class="tl-contact__photo" src="${p.photo}" alt="${p.name}" width="72" height="72" loading="lazy">` : html`<span class="tl-contact__photo tl-contact__photo--mark" aria-hidden="true">✳</span>`}
    <div><strong class="tl-contact__name">${p?.name || v.name}</strong><span class="tl-mono">${p?.name ? `CONTACTPERSOON · ${v.name}` : 'AANGESLOTEN PARTNER VAN GREENBOOKINGS'}</span></div>
  </div>
  <h2 class="tl-display tl-display--sm" id="${id}-t">NEEM<br><span class="tl-accent">CONTACT OP.</span></h2>
  <p class="tl-body">Stel je vraag rechtstreeks aan ${v.name}. Beschikbaarheid, mogelijkheden en prijs hoor je van de locatie zelf.</p>
  <form class="tl-contact__form" data-contact-form novalidate>
    <label class="tl-contact__field"><span>NAAM *</span><input name="naam" autocomplete="name" required></label>
    <label class="tl-contact__field"><span>E-MAILADRES *</span><input name="email" type="email" autocomplete="email" required></label>
    <div class="tl-contact__two">
      <label class="tl-contact__field"><span>DATUM VAN JE EVENT (OPTIONEEL)</span><input name="datum" type="date"></label>
      <label class="tl-contact__field"><span>AANTAL PERSONEN (OPTIONEEL)</span><input name="aantal" type="number" min="1" inputmode="numeric"></label>
    </div>
    <label class="tl-contact__field"><span>BERICHT *</span><textarea name="bericht" rows="5" required placeholder="Waarmee kan ${v.name} je helpen?"></textarea></label>
    <label class="tl-contact__hp" aria-hidden="true">Laat dit veld leeg<input name="website" tabindex="-1" autocomplete="off"></label>
    <p class="tl-note">Je gegevens worden gedeeld met ${v.name} om je aanvraag te behandelen. Zie het ${ext(site.contact.privacyUrl, 'privacybeleid')}.</p>
    <p class="tl-warning" data-contact-error hidden></p>
    <div class="tl-contact__actions"><button class="tl-button tl-button--accent" type="submit" data-contact-submit>VERSTUUR BERICHT ↗</button>${ext(v.profileUrl, 'OF BEKIJK HET PROFIEL OP GREENBOOKINGS ↗', 'tl-text-button')}</div>
  </form>
  <div class="tl-contact__done" data-contact-done hidden tabindex="-1"></div>
  <p class="tl-mono tl-contact__check">✓ RECHTSTREEKS CONTACT MET DE LOCATIE</p>
</dialog>`;
}
