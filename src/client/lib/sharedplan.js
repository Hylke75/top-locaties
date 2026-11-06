// Plannen bewaren en delen.
// - Zonder account: plannen staan in deze browser (localStorage 'tl-plans-v1', met try/catch in store.js).
// - Deellink: alleen de keuzes (gevoel, locatie, makers, eventgegevens zonder naam/e-mail) gaan naar de server
//   via de RPC create_shared_plan; de URL bevat uitsluitend een willekeurig id.
// - Met account: plannen gaan als eigen concept mee naar 'Mijn concepten' (zie toConceptData).
import { load, save } from './store.js';
import { fromBase, applyAnswers } from './userconcept.js';

export const PLANS_KEY = 'tl-plans-v1';
const cfg = () => {
  const d = document.body?.dataset || {};
  return d.sbUrl && d.sbKey ? { url: d.sbUrl.replace(/\/$/, ''), key: d.sbKey } : null;
};

async function rpc(name, body) {
  const c = cfg();
  if (!c) throw new Error('Delen is op deze site (nog) niet ingesteld.');
  let res;
  try {
    res = await fetch(`${c.url}/rest/v1/rpc/${name}`, { method: 'POST', headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch { throw new Error('Geen verbinding. Controleer je internet en probeer het opnieuw.'); }
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    if (res.status === 404 || /could not find the function/i.test(data?.message || '')) throw new Error('Delen is nog niet beschikbaar: de database wordt ingericht.');
    if (/te druk|te veel/i.test(data?.message || '')) throw new Error('Even te druk. Probeer het over een minuut opnieuw.');
    throw new Error('Delen lukte niet. Probeer het opnieuw.');
  }
  return data;
}

/** Alleen keuzes; naam, organisatie, contact en e-mail gaan nooit mee (de database filtert ook). */
export function shareable(plan = {}) {
  const { contact, organisatie, email, naam, ...answers } = plan.answers || {};
  return { feelings: plan.feelings || [], venueId: plan.venueId || null, supplierIds: plan.supplierIds || [], answers };
}

export async function sharePlan(slug, plan) {
  const id = await rpc('create_shared_plan', { p_slug: slug, p_data: shareable(plan) });
  return { id, url: `${location.origin}/mijn-plan/?p=${encodeURIComponent(id)}` };
}

export async function loadSharedPlan(id) {
  if (!/^[a-f0-9]{32}$/.test(id || '')) return null;
  const rows = await rpc('get_shared_plan', { p_id: id });
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

/** Gedeeld plan overnemen in deze browser. */
export function adoptPlan(slug, data) {
  const plans = load(PLANS_KEY, {});
  plans[slug] = { feelings: data.feelings || [], venueId: data.venueId || null, supplierIds: data.supplierIds || [], ...(data.answers && Object.keys(data.answers).length ? { answers: data.answers } : {}), updatedAt: new Date().toISOString(), adoptedFromShare: true };
  return save(PLANS_KEY, plans);
}

/** Lokaal plan → data voor een eigen concept in het account (standaardconcept als basis). */
export function toConceptData(base, plan = {}) {
  let d = fromBase(base);
  d.title = `${base.title} (mijn plan)`;
  if (plan.venueId) d.venueIds = [plan.venueId, ...(d.venueIds || []).filter((v) => v !== plan.venueId)];
  if ((plan.supplierIds || []).length) d.supplierIds = [...new Set([...plan.supplierIds, ...(d.supplierIds || [])])];
  if ((plan.feelings || []).length) d.feelings = plan.feelings.slice(0, 3);
  if (plan.answers) d = applyAnswers(d, plan.answers, {});
  return d;
}
