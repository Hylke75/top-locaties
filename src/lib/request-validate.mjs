// Validatie van één aanvraag naar locatie en makers (gedeeld door /api/aanvraag/ en de tests).
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const SLUG = /^[a-z0-9-]{1,120}$/;
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

export function validateRequest(b = {}) {
  // Honeypot (verborgen veld 'website') of verdacht snel verstuurd (< 4 s na openen) → spam: stil accepteren, niets doen.
  if (str(b.website, 200) || (Number.isFinite(b.t) && b.t < 4000)) return { spam: true, errors: [], data: null };
  const guests = Number(b.guests);
  const data = {
    base_slug: str(b.base_slug, 60),
    name: str(b.name, 120),
    email: str(b.email, 254).toLowerCase(),
    organisation: str(b.organisation, 160),
    event_date: /^\d{4}-\d{2}-\d{2}$/.test(b.event_date || '') ? b.event_date : null,
    guests: Number.isInteger(guests) && guests > 0 && guests <= 100000 ? guests : null,
    message: str(b.message, 2000),
    venue: b.venue && SLUG.test(b.venue.slug || '') ? { slug: b.venue.slug, name: str(b.venue.name, 160) } : null,
    suppliers: (Array.isArray(b.suppliers) ? b.suppliers : []).slice(0, 12)
      .filter((s) => s && SLUG.test(s.slug || ''))
      .map((s) => ({ slug: s.slug, name: str(s.name, 160), role: str(s.role, 80) })),
    // Per partij de uitgewerkte aanvraagtekst (uit het draaiboek op maat); de redactie stuurt hem door.
    quotes: (Array.isArray(b.quotes) ? b.quotes : []).slice(0, 13).map((q) => ({ to: str(q?.to, 160), kind: str(q?.kind, 20), subject: str(q?.subject, 200), body: str(q?.body, 6000) })).filter((q) => q.to && q.body),
    plan: b.plan && typeof b.plan === 'object' ? {
      feelings: (Array.isArray(b.plan.feelings) ? b.plan.feelings : []).slice(0, 3).map((f) => str(f, 30)),
      start: str(b.plan.start, 5), end: str(b.plan.end, 5), doel: str(b.plan.doel, 300),
    } : null,
    consent: b.consent === true,
  };
  const errors = [];
  if (!SLUG.test(data.base_slug)) errors.push('concept');
  if (data.name.length < 2) errors.push('naam');
  if (!EMAIL.test(data.email)) errors.push('email');
  if (!data.venue && !data.suppliers.length) errors.push('ontvangers');
  if (!data.consent) errors.push('toestemming');
  if (b.guests && !data.guests) errors.push('gasten');
  if (b.event_date && !data.event_date) errors.push('datum');
  return { spam: false, errors, data };
}

/** Eén tekst met alles wat de ontvangers moeten weten. */
export function requestText(d, conceptTitle = '') {
  return [
    `Aanvraag via Top Locaties${conceptTitle ? ` — ${conceptTitle}` : ''}`,
    `Van: ${d.name}${d.organisation ? ` (${d.organisation})` : ''} — ${d.email}`,
    `Datum: ${d.event_date || 'nog niet bekend'} · Gasten: ${d.guests || 'nog niet bekend'}`,
    d.plan?.start ? `Tijden: ${d.plan.start}${d.plan.end ? `–${d.plan.end}` : ''}` : '',
    d.venue ? `Locatie: ${d.venue.name}` : '',
    d.suppliers.length ? `Makers: ${d.suppliers.map((s) => `${s.name}${s.role ? ` (${s.role})` : ''}`).join(', ')}` : '',
    d.message ? `\nOpmerking:\n${d.message}` : '',
  ].filter(Boolean).join('\n');
}
