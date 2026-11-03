// Top Locaties — uitlegbare, redactionele gevoelsmatching.
// Gedeeld door de build (server-render) en de browser. Geen scores tonen:
// de rangorde is alleen "aantal gekozen gevoelens dat redactioneel bij het
// concept hoort", daarna redactionele prioriteit.

export const MAX_FEELINGS = 2;

/** Voeg een gevoel toe of haal het weg. Een derde keuze vervangt de oudste. */
export function toggleFeeling(selected, id, max = MAX_FEELINGS) {
  if (selected.includes(id)) return selected.filter((f) => f !== id);
  const next = [...selected, id];
  return next.length > max ? next.slice(next.length - max) : next;
}

/**
 * @param {Array<{id:string, priority:number, feelings:string[], feelingReasons:Record<string,string>}>} concepts
 * @param {string[]} selected
 * @returns {Array<{concept:object, hits:string[], kind:'match'|'alternative'|'inspiration'}>}
 */
export function rankConcepts(concepts, selected, limit = 3) {
  // FO §7.3: score = som van redactionele gewichten (1–5) van gekozen gevoelens; alleen intern.
  const weight = (c, f) => (c.feelingWeights && c.feelingWeights[f]) || (c.feelings.includes(f) ? 1 : 0);
  const ranked = concepts
    .map((concept) => {
      const hits = selected.filter((f) => concept.feelings.includes(f) && weight(concept, f) > 0)
        .sort((a, b) => weight(concept, b) - weight(concept, a));
      return { concept, hits, score: hits.reduce((n, f) => n + weight(concept, f), 0) };
    })
    .sort((a, b) => b.score - a.score || a.concept.priority - b.concept.priority || a.concept.title.localeCompare(b.concept.title, 'nl'))
    .slice(0, limit)
    .map(({ concept, hits }) => ({ concept, hits }));
  return ranked.map((r) => ({
    ...r,
    kind: !selected.length ? 'inspiration' : r.hits.length ? 'match' : 'alternative',
  }));
}

/** Leesbare verklaring, opgebouwd uit redactionele redenen per gevoel. */
export function explainMatch(entry, labels) {
  const { concept, hits, kind } = entry;
  if (kind === 'inspiration') return concept.teaser;
  if (kind === 'alternative') return `Geen directe match met je keuze, wel een andere richting: ${concept.teaser}`;
  const names = hits.map((f) => (labels[f] || f).toLowerCase());
  const lead = `Past bij ${names.join(' en ')}.`;
  return [lead, ...hits.map((f) => concept.feelingReasons[f]).filter(Boolean)].join(' ');
}

export function parseFeelingParam(value, valid) {
  if (!value) return [];
  const out = [];
  for (const id of value.split(/[ ,+]/)) if (valid.includes(id) && !out.includes(id)) out.push(id);
  return out.slice(0, MAX_FEELINGS);
}
