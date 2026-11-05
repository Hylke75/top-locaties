// Ontdekbestanden voor AI-agents. Alles beschrijft alleen wat echt bestaat:
// openbare, alleen-lezen JSON-data (concepten, partners, zoekindex) en twee formulier-endpoints
// die uitsluitend op uitdrukkelijk verzoek van een mens mogen worden gebruikt.
import crypto from 'node:crypto';

const ORIGIN = 'https://top-locaties.nl';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function openApi(data) {
  const slugs = data.concepts.map((c) => c.slug);
  return {
    openapi: '3.1.0',
    info: {
      title: 'Top Locaties — openbare data en aanvragen',
      version: '1.0.0',
      description: 'Eventconcepten, aangesloten Greenbookings-partnerlocaties en -makers. Alleen-lezen JSON is vrij te gebruiken. Aanvragen (POST) versturen echte berichten aan locaties en makers: alleen op uitdrukkelijk verzoek en met toestemming van de persoon zelf. Top Locaties noemt geen prijzen en bevestigt geen beschikbaarheid.',
      contact: { name: 'Top Locaties', url: `${ORIGIN}/over/` },
    },
    servers: [{ url: ORIGIN }],
    paths: {
      '/data/search.json': { get: { operationId: 'searchIndex', summary: 'Zoekindex van concepten, locaties en makers', description: 'Array met per item: t (concept|locatie|maker), title, url, sub, why, en voor concepten/locaties min/max gasten.', responses: { 200: { description: 'Zoekindex', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SearchItem' } } } } } } } },
      '/data/partners.json': { get: { operationId: 'partners', summary: 'Concepten, aangesloten partnerlocaties en makers (namen, plaats, capaciteit, profiel-URL)', responses: { 200: { description: 'Partnerlijsten', content: { 'application/json': { schema: { type: 'object' } } } } } } },
      '/data/concepts/{slug}.json': { get: { operationId: 'getConcept', summary: 'Compleet eventconcept: programma, draaiboek, catering, entertainment, passende locaties en makers', parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', enum: slugs } }], responses: { 200: { description: 'Concept', content: { 'application/json': { schema: { type: 'object' } } } }, 404: { description: 'Onbekend concept' } } } },
      '/api/aanvraag/': { post: { operationId: 'submitRequest', summary: 'Eén aanvraag naar de gekozen locatie en makers (alleen namens en met toestemming van een mens)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Request' } } } }, responses: { 200: { description: 'Ontvangen' }, 403: { description: 'Herkomst niet toegestaan (alleen vanaf top-locaties.nl)' }, 422: { description: 'Ongeldige velden' }, 429: { description: 'Te veel aanvragen' } } } },
      '/api/health/': { get: { operationId: 'health', summary: 'Status van de site-API', responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', enum: ['ok'] } } } } } } } } },
    },
    components: {
      schemas: {
        SearchItem: { type: 'object', properties: { t: { type: 'string', enum: ['concept', 'locatie', 'maker'] }, title: { type: 'string' }, url: { type: 'string' }, sub: { type: 'string' }, why: { type: 'string' }, min: { type: ['integer', 'null'] }, max: { type: ['integer', 'null'] } } },
        Request: {
          type: 'object', required: ['base_slug', 'name', 'email', 'consent'],
          properties: {
            base_slug: { type: 'string', enum: slugs }, name: { type: 'string' }, email: { type: 'string', format: 'email' }, organisation: { type: 'string' },
            event_date: { type: 'string', format: 'date' }, guests: { type: 'integer', minimum: 1 }, message: { type: 'string', maxLength: 2000 },
            venue: { type: 'object', properties: { slug: { type: 'string' }, name: { type: 'string' } } },
            suppliers: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } },
            consent: { type: 'boolean', const: true, description: 'De persoon zelf geeft toestemming om naam, e-mail en aanvraag te delen.' },
          },
        },
      },
    },
  };
}

export const apiCatalog = () => ({
  linkset: [{
    anchor: `${ORIGIN}/`,
    'service-desc': [{ href: `${ORIGIN}/openapi.json`, type: 'application/vnd.oai.openapi+json' }],
    'service-doc': [{ href: `${ORIGIN}/docs/api/`, type: 'text/html' }],
    status: [{ href: `${ORIGIN}/api/health/`, type: 'application/json' }],
  }],
});

export function skillMd(data) {
  return `---
name: top-locaties
description: Vind een passend zakelijk eventconcept, een aangesloten partnerlocatie en makers in Nederland via Top Locaties (Greenbookings-netwerk), en help een mens één aanvraag te versturen.
---

# Top Locaties gebruiken

Top Locaties is een Nederlandstalig inspiratieplatform met ${data.concepts.length} complete eventconcepten (programma, draaiboek, catering, entertainment), ${data.venues.length} aangesloten Greenbookings-partnerlocaties en ${data.suppliers.length} makers.

## Zo werk je
1. Zoeken: haal \`${ORIGIN}/data/search.json\` op en filter op \`t\` (concept, locatie, maker), titel en \`why\`. Gasten: \`min\`/\`max\`.
2. Concept lezen: \`${ORIGIN}/data/concepts/{slug}.json\` (compleet), of de pagina als Markdown met \`Accept: text/markdown\` op \`${ORIGIN}/eventconcepten/{slug}/\`.
3. Partners: \`${ORIGIN}/data/partners.json\`. Alleen deze locaties en makers zijn aangesloten; noem geen andere als partner.
4. Plan samenstellen doet de mens op de conceptpagina (\`#samenstellen\`); daar staat ook het aanvraagformulier.

## Regels
- Noem nooit prijzen of beschikbaarheid: die staan niet in de bron. Zeg "op aanvraag".
- Sfeerbeelden zijn illustratief, geen foto van de locatie.
- Verstuur een aanvraag (\`POST /api/aanvraag/\`) alleen als de persoon dat uitdrukkelijk vraagt en zelf toestemming geeft; het formulier op de site is de voorkeursroute.
- API-beschrijving: ${ORIGIN}/openapi.json · uitleg: ${ORIGIN}/docs/api/
`;
}

export function skillsIndex(skill) {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [{ name: 'top-locaties', type: 'skill-md', description: 'Eventconcepten, partnerlocaties en makers van Top Locaties vinden en een mens helpen één aanvraag te versturen.', url: `${ORIGIN}/.well-known/agent-skills/top-locaties/SKILL.md`, digest: `sha256:${sha256(skill)}` }],
  };
}

export const aiCatalog = (data) => ({
  specVersion: '1.0',
  host: { displayName: 'Top Locaties', identifier: 'did:web:top-locaties.nl', url: `${ORIGIN}/` },
  entries: [
    { identifier: 'urn:air:top-locaties.nl:api:openbare-data', displayName: 'Top Locaties API (concepten, partnerlocaties, makers, aanvragen)', type: 'application/vnd.oai.openapi+json', url: `${ORIGIN}/openapi.json`,
      representativeQueries: ['eventconcept voor een teamdag met 50 personen', 'vergaderlocatie in Den Haag voor 20 personen', 'cateraar voor een zakelijk diner', 'draaiboek voor een kick-off'] },
    { identifier: 'urn:air:top-locaties.nl:skill:top-locaties', displayName: 'Skill: Top Locaties gebruiken', type: 'text/markdown', url: `${ORIGIN}/.well-known/agent-skills/top-locaties/SKILL.md`,
      representativeQueries: ['hoe vind ik een eventconcept op top-locaties.nl', 'welke partnerlocaties passen bij een heidag', 'hoe vraag ik een offerte aan bij locatie en makers'] },
    { identifier: 'urn:air:top-locaties.nl:catalog:api', displayName: 'API-catalogus (RFC 9727)', type: 'application/linkset+json', url: `${ORIGIN}/.well-known/api-catalog`,
      representativeQueries: ['api catalogus top locaties', 'openapi top-locaties.nl'] },
  ],
  metadata: { concepts: data.concepts.length, partnerVenues: data.venues.length, suppliers: data.suppliers.length, language: 'nl' },
});
