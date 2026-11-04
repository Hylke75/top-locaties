// Eigen concept = standaardconcept als basis + de bewerkingen van de gebruiker.
// Alleen de velden hieronder zijn bewerkbaar en worden opgeslagen; de rest komt altijd uit de basis.
export const EDITABLE = ['title', 'proposition', 'objective', 'organisatie', 'datum', 'guests', 'duration', 'feelings', 'audiences',
  'program', 'runbook', 'catering', 'entertainment', 'communication', 'budgetItems', 'risks', 'kpis', 'venueIds', 'supplierIds', 'notes'];

const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));

/** Startpunt voor een nieuw eigen concept op basis van een standaardconcept. */
export function fromBase(base) {
  const d = {};
  for (const k of EDITABLE) if (base[k] !== undefined) d[k] = clone(base[k]);
  d.title = `${base.title} (mijn versie)`;
  d.venueIds = (base.venueMatches || []).map((m) => m.venueId);
  d.supplierIds = (base.supplierMatches || []).map((m) => m.supplierId);
  d.program = (d.program || []).map((p) => ({ ...p, details: { ...(p.details || {}) } }));
  return d;
}

/** Basis + eigen bewerkingen → volledig concept voor presentatie en downloads. */
export function merge(base, data = {}) {
  const out = clone(base) || {};
  for (const k of EDITABLE) if (data[k] !== undefined) out[k] = clone(data[k]);
  out.headline = data.title && data.title !== base.title ? [data.title] : base.headline;
  return out;
}

/** Controle vóór opslaan: kort, en zonder bedragen die op prijzen lijken in kostenposten. */
export function check(data) {
  const errors = [];
  if (!String(data.title || '').trim()) errors.push('Geef je concept een titel.');
  if (String(data.title || '').length > 160) errors.push('De titel is te lang (max. 160 tekens).');
  if (!(data.program || []).some((p) => String(p.title || '').trim())) errors.push('Het programma heeft minstens één onderdeel nodig.');
  (data.program || []).forEach((p, i) => { if (p.time && !/^\d{1,2}:\d{2}$/.test(p.time)) errors.push(`Programma ${i + 1}: schrijf de tijd als UU:MM.`); });
  (data.runbook || []).forEach((r, i) => { if (r.time && !/^\d{1,2}:\d{2}$/.test(r.time)) errors.push(`Draaiboek ${i + 1}: schrijf de tijd als UU:MM.`); });
  return errors;
}

/** Sorteer programma en draaiboek op tijd (lege tijden achteraan). */
export const byTime = (a, b) => (a.time || '99:99').padStart(5, '0').localeCompare((b.time || '99:99').padStart(5, '0'));
