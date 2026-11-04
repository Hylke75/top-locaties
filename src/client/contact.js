// Contact-pop-up voor een partnerlocatie.
// Met een geconfigureerde endpoint (src/content/site.json → contact.endpoint) gaat het bericht
// rechtstreeks naar de Greenbookings-contactroute (bron: top-locaties). Zonder endpoint kopiëren we
// het bericht en ronden we af via het contactformulier op het Greenbookings-profiel — nooit een
// schijnbevestiging.
import { load } from './lib/store.js';

const dlg = document.querySelector('[data-contact-dialog]');
if (dlg) {
  const form = dlg.querySelector('[data-contact-form]');
  const done = dlg.querySelector('[data-contact-done]');
  const err = dlg.querySelector('[data-contact-error]');
  const { venueId, venueSlug, venueName, profile, endpoint, source } = dlg.dataset;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Voorinvullen vanuit een bewaard plan met deze locatie.
  const plans = load('tl-plans-v1', {});
  const entry = Object.entries(plans).find(([, p]) => p && p.venueId === venueId);
  if (entry) {
    const [, p] = entry;
    const a = p.answers || {};
    if (a.contact) form.elements.naam.value = a.contact;
    if (a.datum) form.elements.datum.value = a.datum;
    if (a.gasten) form.elements.aantal.value = a.gasten;
    form.elements.bericht.value = `Beste ${venueName},\n\nWe organiseren een evenement${a.organisatie ? ` voor ${a.organisatie}` : ''}${a.datum ? ` op ${new Date(`${a.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}${a.gasten ? ` voor ongeveer ${a.gasten} gasten` : ''}. Is jullie locatie dan beschikbaar, en welke ruimtes passen erbij?\n\nIk ontvang graag een voorstel.`;
  }

  const opened = Date.now();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const f = form.elements;
    const missing = [!f.naam.value.trim() && 'naam', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim()) && 'een geldig e-mailadres', !f.bericht.value.trim() && 'je bericht'].filter(Boolean);
    if (missing.length) { err.textContent = `Vul nog in: ${missing.join(', ')}.`; err.hidden = false; return; }
    const payload = { locatie_slug: venueSlug, bezoeker_naam: f.naam.value.trim(), bezoeker_email: f.email.value.trim(), event_datum: f.datum.value || null, aantal_personen: f.aantal.value ? Number(f.aantal.value) : null, bericht: f.bericht.value.trim(), onderwerp: `Aanvraag via Top Locaties — ${venueName}`, bron: source || 'top-locaties', website: f.website?.value || '', t: Date.now() - opened };
    const btn = dlg.querySelector('[data-contact-submit]');
    if (endpoint) {
      btn.disabled = true; btn.textContent = 'VERSTUREN…';
      let res = null;
      try { res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
      btn.disabled = false; btn.textContent = 'VERSTUUR BERICHT ↗';
      if (res?.ok) {
        form.hidden = true;
        done.innerHTML = `<h3 class="tl-display tl-display--sm">BERICHT<br><span class="tl-accent">VERSTUURD ✓</span></h3><p class="tl-body">${esc(venueName)} heeft je vraag ontvangen en neemt contact met je op via ${esc(payload.bezoeker_email)}.</p>`;
        done.hidden = false; done.focus();
        return;
      }
      if (res?.status === 422) { err.textContent = 'Controleer je naam, e-mailadres en bericht (minstens 10 tekens).'; err.hidden = false; return; }
      if (res?.status === 429) { err.textContent = 'Je hebt net al een paar berichten verstuurd. Probeer het over een paar minuten opnieuw.'; err.hidden = false; return; }
      // Niet geconfigureerd, locatie onbekend of storing: eerlijk terugvallen op het Greenbookings-profiel.
    }
    // Zonder bevestigde endpoint: eerlijk doorsturen naar het profiel, met het bericht op het klembord.
    const text = `${payload.bericht}\n\n${payload.bezoeker_naam} — ${payload.bezoeker_email}${payload.event_datum ? `\nDatum: ${payload.event_datum}` : ''}${payload.aantal_personen ? `\nAantal personen: ${payload.aantal_personen}` : ''}`;
    let copied = false;
    try { await navigator.clipboard.writeText(text); copied = true; } catch {}
    form.hidden = true;
    done.innerHTML = `<h3 class="tl-display tl-display--sm">NOG ÉÉN<br><span class="tl-accent">STAP.</span></h3><p class="tl-body">${copied ? 'Je bericht staat op je klembord.' : 'Kopieer je bericht hieronder.'} Rond je aanvraag af in het contactformulier op het Greenbookings-profiel van ${esc(venueName)}: plak je bericht en verstuur.</p>${copied ? '' : `<textarea class="tl-composer__fallback tl-contact__copy" readonly>${esc(text)}</textarea>`}<p><a class="tl-button tl-button--accent" href="${esc(profile)}" target="_blank" rel="noopener noreferrer">OPEN HET CONTACTFORMULIER ↗</a></p><button class="tl-text-button" type="button" data-contact-back>← BERICHT AANPASSEN</button>`;
    done.hidden = false; done.focus();
  });
  done.addEventListener('click', (e) => { if (e.target.closest('[data-contact-back]')) { done.hidden = true; form.hidden = false; } });
}
