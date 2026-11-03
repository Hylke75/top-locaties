import { html } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline } from '../templates/components.mjs';

/** Compatibiliteit met prototype-URL's (hupr.html, concept.html?concept=…, locaties.html). */
export function renderLegacy({ to, title, conceptMap = null }) {
  const script = conceptMap
    ? `var k=new URLSearchParams(location.search).get('concept');var ok=${JSON.stringify(conceptMap)};location.replace(ok.indexOf(k)>-1?'/eventconcepten/'+k+'/':'${to}');`
    : `location.replace('${to}'+location.hash);`;
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="robots" content="noindex"><link rel="canonical" href="https://top-locaties.nl${to}"><meta http-equiv="refresh" content="1;url=${to}"><title>${title}</title><script>${script}</script></head><body><p><a href="${to}">Deze pagina is verhuisd — ga verder ↗</a></p></body></html>`;
}

export function renderNotFound() {
  const body = html`${header()}
<main id="main"><section class="tl-section">
  ${overline('404 / DEZE PLEK BESTAAT NIET', 'NOG NIET, IN ELK GEVAL')}
  <h1 class="tl-display tl-display--xl">NIETS<br><span class="tl-accent">GEVONDEN.</span></h1>
  <p class="tl-lead tl-body--gap">Deze pagina is verplaatst of bestaat niet. Begin opnieuw bij het gevoel dat je wilt achterlaten.</p>
  <p class="tl-chip-set"><a class="tl-button" href="/#gevoel">KIES OP GEVOEL ↗</a><a class="tl-button tl-button--outline" href="/locaties/">ZOEK LOCATIES ↗</a></p>
</section></main>${footer()}`;
  return layout({ title: 'Niet gevonden — Top Locaties', description: 'Deze pagina bestaat niet.', path: '/404', body, noindex: true });
}
