// WebMCP: hulpmiddelen voor AI-agents in de browser (alleen-lezen). Doet niets als de browser WebMCP niet kent.
// Zie https://webmachinelearning.github.io/webmcp/ — document.modelContext (oudere builds: navigator.modelContext).
import { search } from './lib/search.js';

const mc = document.modelContext || navigator.modelContext;
const text = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
let index = null;
const loadIndex = async () => (index = index || await fetch('/data/search.json').then((r) => r.json()));

const TOOLS = [
  {
    name: 'top_locaties_zoeken',
    description: 'Zoek in Top Locaties naar eventconcepten, aangesloten Greenbookings-partnerlocaties en makers (Nederland). Begrijpt plaats, soort bijeenkomst en aantal personen, bijv. "vergaderen utrecht 20 personen". Geeft titel, type, link en één regel uitleg; geen prijzen of beschikbaarheid.',
    inputSchema: { type: 'object', properties: { zoekvraag: { type: 'string', description: 'Vrije zoekvraag in het Nederlands' }, type: { type: 'string', enum: ['', 'concept', 'locatie', 'maker'], description: 'Optioneel: alleen concepten, locaties of makers' } }, required: ['zoekvraag'] },
    async execute({ zoekvraag, type = '' } = {}) {
      const { results, size } = search(await loadIndex(), String(zoekvraag || ''), type || '');
      return text({ aantal: results.length, personen: size || null, resultaten: results.slice(0, 10).map((r) => ({ type: r.t, titel: r.title, url: new URL(r.url, location.origin).href, uitleg: r.why || r.sub || '' })) });
    },
  },
  {
    name: 'top_locaties_concept',
    description: 'Haal een compleet eventconcept op (doel, programma, draaiboek, catering, passende partnerlocaties en makers) aan de hand van de slug uit de URL, bijv. "teamdag" voor /eventconcepten/teamdag/.',
    inputSchema: { type: 'object', properties: { slug: { type: 'string', pattern: '^[a-z0-9-]+$' } }, required: ['slug'] },
    async execute({ slug } = {}) {
      if (!/^[a-z0-9-]+$/.test(slug || '')) return text({ fout: 'Ongeldige slug' });
      const r = await fetch(`/data/concepts/${slug}.json`);
      if (!r.ok) return text({ fout: 'Onbekend concept' });
      const c = await r.json();
      return text({ titel: c.title, propositie: c.proposition, doel: c.objective, gasten: `${c.guestCountMin}–${c.guestCountMax}`, duur: c.duration, programma: (c.program || []).map((p) => `${p.time} ${p.title}`), locaties: (c.venueMatches || []).map((m) => m.venueId), url: `${location.origin}/eventconcepten/${slug}/`, let_op: 'Geen prijzen of beschikbaarheid; sfeerbeelden zijn illustratief. Een aanvraag verstuurt de persoon zelf via het formulier op de conceptpagina.' });
    },
  },
];

if (mc?.registerTool) {
  const controller = new AbortController();
  for (const tool of TOOLS) {
    try { Promise.resolve(mc.registerTool(tool, { signal: controller.signal })).catch(() => {}); } catch {}
  }
  addEventListener('pagehide', () => controller.abort(), { once: true });
}
