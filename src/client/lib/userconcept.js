import { fitTimes, naturalEnd } from './tailor.js';
// Eigen concept = standaardconcept als basis + de bewerkingen van de gebruiker.
// Alleen de velden hieronder zijn bewerkbaar en worden opgeslagen; de rest komt altijd uit de basis.
export const EDITABLE = ['costs', 'status', 'quotes', 'contactName', 'registration', 'title', 'proposition', 'objective', 'organisatie', 'datum', 'guests', 'duration', 'feelings', 'audiences',
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

const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const toTime = (m) => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(((m % 60) + 60) % 60).padStart(2, '0')}`;

/** Eerste programmatijd (het moment dat gasten beginnen). */
export function startTime(data) {
  const ts = (data.program || []).map((p) => toMin(p.time)).filter((m) => m != null);
  return ts.length ? toTime(Math.min(...ts)) : null;
}

/** Verschuif programma, draaiboek en cateringmomenten zodat het programma om `start` begint. */
export function shiftTo(data, start) {
  const from = toMin(startTime(data)); const to = toMin(start);
  if (from == null || to == null || from === to) return { data, delta: 0 };
  const d = to - from;
  const mv = (it) => (toMin(it.time) == null ? it : { ...it, time: toTime(toMin(it.time) + d) });
  return { delta: d, data: { ...data, program: (data.program || []).map(mv), runbook: (data.runbook || []).map(mv), catering: data.catering ? { ...data.catering, moments: (data.catering.moments || []).map(mv) } : data.catering } };
}

/** Programma laten lopen van `start` tot `end`: eerst verschuiven, dan programma, draaiboek en catering in dat venster passen. */
export function fitTo(data, start, end) {
  const shifted = shiftTo(data, start).data;
  if (!end) return { data: shifted, ratio: 1 };
  const from = startTime(shifted);
  const to = naturalEnd(shifted.runbook || []) || (() => { const ts = (shifted.program || []).map((p) => p.time).filter(Boolean).sort(); return ts[ts.length - 1]; })();
  if (!from || !to) return { data: shifted, ratio: 1 };
  const fit = (xs) => fitTimes(xs || [], from, to, from, end);
  const r = fit(shifted.runbook);
  const out = { ...shifted, runbook: r.items, program: fit(shifted.program).items };
  if (shifted.catering) out.catering = { ...shifted.catering, moments: fit(shifted.catering.moments).items };
  const ending = /^(\d{1,2}):(\d{2})$/.test(end) ? end : null;
  if (ending && from) out.duration = `${from}–${ending}`;
  return { data: out, ratio: r.ratio };
}

/** Antwoorden uit de vragenlijst op maat (conceptpagina) toepassen op een eigen concept. */
export function applyAnswers(data, a = {}, plan = {}) {
  let out = { ...data };
  if (a.organisatie) out.organisatie = a.organisatie;
  if (a.datum) out.datum = a.datum;
  if (Number(a.gasten)) out.guests = Number(a.gasten);
  if (a.doel) out.objective = a.doel;
  if (a.doelgroep) out.audiences = [a.doelgroep, ...(out.audiences || []).filter((x) => x !== a.doelgroep)];
  if ((plan.feelings || []).length) out.feelings = plan.feelings.slice(0, 3);
  if (plan.venueId) out.venueIds = [plan.venueId, ...(out.venueIds || []).filter((v) => v !== plan.venueId)];
  if ((plan.supplierIds || []).length) out.supplierIds = [...new Set([...plan.supplierIds, ...(out.supplierIds || [])])];
  const notes = [a.dieet?.length && `Dieetwensen: ${a.dieet.join(', ')}`, a.toegankelijk && 'Rolstoeltoegankelijk nodig', a.hybride && 'Ook online deelnemers (hybride)', a.budget && `Budgetindicatie: ${a.budget}`].filter(Boolean);
  if (notes.length) out.notes = [out.notes, ...notes].filter(Boolean).join('\n');
  if (a.start) out = fitTo(out, a.start, a.eind).data;
  return out;
}

/* ---------- Eigen kostenraming (bedragen van de gebruiker zelf; wij noemen geen prijzen) ---------- */
export const COST_STATUS = { indicatief: 'Eigen inschatting', offerte: 'Offerte ontvangen', bevestigd: 'Bevestigd' };
export function costsFrom(data) {
  const c = data.costs || {};
  const items = c.items?.length ? c.items : (data.budgetItems || []).map((label) => ({ label, amount: null, status: 'indicatief', note: '' }));
  return { items, contingency: Number.isFinite(c.contingency) ? c.contingency : 10 };
}
export function costTotals(costs) {
  const sub = (costs.items || []).reduce((n, it) => n + (Number(it.amount) || 0), 0);
  const extra = Math.round(sub * (Number(costs.contingency) || 0)) / 100;
  const confirmed = (costs.items || []).filter((it) => it.status === 'bevestigd').reduce((n, it) => n + (Number(it.amount) || 0), 0);
  const filled = (costs.items || []).filter((it) => Number(it.amount) > 0).length;
  return { sub, extra, total: sub + extra, confirmed, filled, count: (costs.items || []).length };
}
export const euro = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);

/* ---------- Status van het event ---------- */
export const STAGES = [['idee', 'Idee'], ['offerte', 'Offertes opgevraagd'], ['bevestigd', 'Bevestigd'], ['afgerond', 'Afgerond']];
export function setStage(data, stage) {
  if (!STAGES.some(([k]) => k === stage)) return data;
  const cur = data.status?.stage || 'idee';
  if (cur === stage) return data;
  return { ...data, status: { stage, log: [...(data.status?.log || []), { stage, at: new Date().toISOString() }].slice(-30) } };
}
