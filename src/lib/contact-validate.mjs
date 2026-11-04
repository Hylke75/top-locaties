// Validatie van een contactbericht (gedeeld door de Vercel-functie en de tests).
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

export function validateContact(b = {}) {
  // Honeypot (verborgen veld) of verdacht snel verstuurd (< 3 s na openen) → spam.
  if (str(b.website, 200) || (Number.isFinite(b.t) && b.t < 3000)) return { spam: true, errors: [], data: null };
  const data = {
    locatie_slug: str(b.locatie_slug, 120),
    bezoeker_naam: str(b.bezoeker_naam, 120),
    bezoeker_email: str(b.bezoeker_email, 254).toLowerCase(),
    bericht: str(b.bericht, 4000),
    onderwerp: str(b.onderwerp, 200) || 'Aanvraag via Top Locaties',
    event_datum: /^\d{4}-\d{2}-\d{2}$/.test(b.event_datum || '') ? b.event_datum : null,
    aantal_personen: Number.isInteger(Number(b.aantal_personen)) && Number(b.aantal_personen) > 0 && Number(b.aantal_personen) <= 100000 ? Number(b.aantal_personen) : null,
  };
  const errors = [];
  if (!/^[a-z0-9-]{1,120}$/.test(data.locatie_slug)) errors.push('locatie');
  if (data.bezoeker_naam.length < 2) errors.push('naam');
  if (!EMAIL.test(data.bezoeker_email)) errors.push('email');
  if (data.bericht.length < 10) errors.push('bericht');
  return { spam: false, errors, data };
}
