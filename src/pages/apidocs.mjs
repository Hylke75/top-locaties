// /docs/api/: uitleg voor ontwikkelaars en AI-agents (service-doc uit de API-catalogus).
import { html } from '../lib/html.mjs';
import { layout } from '../templates/layout.mjs';
import { header, footer, overline } from '../templates/components.mjs';

export function renderApiDocs(data) {
  const ex = data.concepts[0]?.slug || 'festival';
  const body = html`${header({ current: '' })}
<main id="main">
<section class="tl-section tl-section--dark" aria-labelledby="apiTitle">
  ${overline('01 / VOOR ONTWIKKELAARS EN AGENTS', 'OPENBARE DATA, GEEN SLEUTEL NODIG')}
  <div class="tl-columns">
    <p class="tl-intro-label">Alle concepten, aangesloten partnerlocaties en makers zijn als JSON beschikbaar. Elke pagina is ook als Markdown op te vragen met de header Accept: text/markdown.</p>
    <div>
      <h1 class="tl-display" id="apiTitle">DE DATA<br><span class="tl-accent">ACHTER DE SITE.</span></h1>
      <dl class="tl-facts tl-facts--on-dark">
        <div><dt>OPENAPI</dt><dd><a href="/openapi.json">/openapi.json</a></dd></div>
        <div><dt>API-CATALOGUS (RFC 9727)</dt><dd><a href="/.well-known/api-catalog">/.well-known/api-catalog</a></dd></div>
        <div><dt>AI-CATALOGUS</dt><dd><a href="/.well-known/ai-catalog.json">/.well-known/ai-catalog.json</a></dd></div>
        <div><dt>SKILL VOOR AGENTS</dt><dd><a href="/.well-known/agent-skills/index.json">/.well-known/agent-skills/index.json</a></dd></div>
        <div><dt>STATUS</dt><dd><a href="/api/health/">/api/health/</a></dd></div>
      </dl>
    </div>
  </div>
</section>
<section class="tl-section" aria-labelledby="readTitle">
  ${overline('02 / LEZEN', 'VRIJ TE GEBRUIKEN, MET BRONVERMELDING')}
  <h2 class="tl-display tl-display--md" id="readTitle">ALLEEN<br><span class="tl-accent">LEZEN.</span></h2>
  <ul class="tl-list">
    <li><a href="/data/search.json">/data/search.json</a>: zoekindex van ${data.concepts.length} concepten, ${data.venues.length} partnerlocaties en ${data.suppliers.length} makers (titel, link, één regel uitleg, gasten).</li>
    <li><a href="/data/partners.json">/data/partners.json</a>: concepten, aangesloten partnerlocaties en makers met plaats en profiel-URL.</li>
    <li><a href="/data/concepts/${ex}.json">/data/concepts/{slug}.json</a>: een compleet concept (programma, draaiboek, catering, entertainment, locaties en makers).</li>
    <li>Elke pagina als Markdown: <code>curl -H "Accept: text/markdown" https://top-locaties.nl/eventconcepten/${ex}/</code></li>
  </ul>
  <p class="tl-note tl-note--gap">Locatie- en leveranciersgegevens komen uit Greenbookings (alleen aangesloten partners). Prijzen en beschikbaarheid staan er bewust niet in; sfeerbeelden zijn illustratief.</p>
</section>
<section class="tl-section tl-section--taupe" aria-labelledby="writeTitle">
  ${overline('03 / AANVRAGEN', 'ALLEEN NAMENS EN MET TOESTEMMING VAN EEN MENS')}
  <h2 class="tl-display tl-display--md" id="writeTitle">ÉÉN<br><span class="tl-accent">AANVRAAG.</span></h2>
  <p class="tl-body">POST /api/aanvraag/ stuurt een echte aanvraag naar een locatie en makers. Gebruik dit alleen als een persoon dat uitdrukkelijk vraagt en zelf toestemming geeft (veld <code>consent: true</code>); bij voorkeur via het formulier op de conceptpagina. Aanvragen worden alleen van top-locaties.nl geaccepteerd en zijn beperkt in aantal.</p>
</section>
</main>
${footer({ links: [{ href: '/eventconcepten/', label: 'ALLE CONCEPTEN ↗' }, { href: '/locaties/', label: 'LOCATIES ↗' }, { href: '/zoeken/', label: 'ZOEKEN ↗' }] })}`;
  return layout({ title: 'API en data voor agents | Top Locaties', description: 'Openbare JSON-data van Top Locaties: eventconcepten, aangesloten partnerlocaties en makers, plus OpenAPI, API-catalogus en Markdown-versies van elke pagina.', path: '/docs/api/', body });
}
