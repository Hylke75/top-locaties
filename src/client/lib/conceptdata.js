// Laadt de gepubliceerde conceptdata en partnerlijsten (gegenereerd door de build).
const cache = new Map();
async function get(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(`Niet gevonden (${r.status})`); return r.json(); }));
  return cache.get(url);
}
export const partners = () => get('/data/partners.json');
export const baseConcept = (slug) => (/^[a-z0-9-]+$/.test(slug || '') ? get(`/data/concepts/${slug}.json`) : Promise.reject(new Error('Onbekend concept')));
export const exportCtx = (p) => ({ feelings: p.feelings, venues: p.venues, suppliers: p.suppliers, date: new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) });
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
