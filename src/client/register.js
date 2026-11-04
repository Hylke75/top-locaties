// /aanmelden/?t=…: gasten melden zich aan; alleen via de geheime aanmeldlink van de organisator.
import * as A from './lib/account.js';
import { readData } from './lib/store.js';
import { track } from './lib/track.js';

A.configure(readData().accounts);
const $ = (s) => document.querySelector(s);
const t = new URLSearchParams(location.search).get('t') || '';
const form = $('[data-reg-form]'); const status = $('[data-reg-status]'); const meta = $('[data-reg-meta]');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

(async () => {
  try {
    const info = await A.registrationInfo(t);
    $('[data-reg-title]').innerHTML = `${esc(info.title).toUpperCase()} <br><span class="tl-accent">MELD JE AAN.</span>`;
    meta.textContent = [info.organisatie, info.datum && new Date(`${info.datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })].filter(Boolean).join(' / ').toUpperCase();
    if (!info.open) { meta.textContent += ' — AANMELDEN IS GESLOTEN'; return; }
    if (info.full_) { meta.textContent += ' — DIT EVENT IS VOL'; return; }
    form.hidden = false;
  } catch (e) { meta.textContent = A.message(e); }
})();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = form.elements;
  const v = { name: f.name.value.trim(), email: f.email.value.trim(), organisation: f.organisation.value.trim(), remarks: f.remarks.value.trim(), diet: [...form.querySelectorAll('[name=diet]:checked')].map((x) => x.value) };
  if (v.name.length < 2) { status.textContent = 'Vul je naam in.'; f.name.focus(); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { status.textContent = 'Vul een geldig e-mailadres in.'; f.email.focus(); return; }
  if (!f.consent.checked) { status.textContent = 'Geef toestemming om je aanmelding te kunnen verwerken.'; return; }
  status.textContent = 'EEN MOMENT…';
  try {
    await A.register(t, v);
    track('register', '');
    form.hidden = true;
    const done = $('[data-reg-done]');
    done.innerHTML = `<h2 class="tl-display tl-display--md">JE BENT <br><span class="tl-accent">AANGEMELD ✓</span></h2><p class="tl-body">Bedankt, ${esc(v.name)}. De organisator heeft je aanmelding ontvangen. Wil je iets wijzigen? Vul het formulier opnieuw in met hetzelfde e-mailadres.</p>`;
    done.hidden = false; done.focus();
  } catch (err) { status.textContent = A.message(err); }
});
