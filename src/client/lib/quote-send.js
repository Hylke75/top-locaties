// Offerteaanvragen in één keer naar meerdere aangesloten partnerlocaties (via /api/contact/ → Greenbookings).
// Makers hebben (nog) geen contactroute: voor hen kopiëren we de aanvraag en linken we naar het profiel.
export const slugFromProfile = (url) => (/\/locaties\/([a-z0-9-]+)\/?$/.exec(url || '') || [])[1] || '';

/**
 * @param {string} endpoint  bv. '/api/contact/'
 * @param {{slug:string, name:string, subject:string, body:string}[]} items
 * @param {{name:string, email:string}} sender
 * @param {{datum?:string, guests?:number, opened:number}} meta
 */
export async function sendQuotes(endpoint, items, sender, meta) {
  const out = [];
  for (const it of items) {
    let res = null;
    try {
      res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        locatie_slug: it.slug, bezoeker_naam: sender.name, bezoeker_email: sender.email, bericht: it.body, onderwerp: it.subject,
        event_datum: meta.datum || null, aantal_personen: meta.guests || null, bron: 'top-locaties', website: '', t: Date.now() - meta.opened,
      }) });
    } catch {}
    out.push({ ...it, ok: Boolean(res?.ok), status: res?.status || 0 });
  }
  return out;
}

/** Uitleg per resultaat, eerlijk over wat er wel en niet is verstuurd. */
export function quoteResultText(r) {
  if (r.ok) return `${r.name}: verstuurd ✓`;
  if (r.status === 503 || r.status === 404 || r.status === 0) return `${r.name}: nog niet automatisch te versturen — kopieer de aanvraag en gebruik het profiel`;
  if (r.status === 429) return `${r.name}: even te veel berichten; probeer het over een paar minuten opnieuw`;
  return `${r.name}: niet verstuurd (fout ${r.status})`;
}
