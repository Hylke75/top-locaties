// /eventconcepten/<slug>/conceptplan/: invulbaar conceptplan (sjabloon in twaalf hoofdstukken).
// Bewaart invulvelden en vinkjes per concept in deze browser; vult vooraf in uit de vragenlijst op maat.
import { load, save, readData } from './lib/store.js';
import { formatDate } from './lib/tailor.js';

const { slug } = readData();
const KEY = 'tl-plandoc-v1';
const all = load(KEY, {});
const doc = all[slug] || { fields: {}, checks: {}, status: null };
const a = load('tl-plans-v1', {})[slug]?.answers || {};
const statusEl = document.querySelector('[data-doc-status]');

// Vooraf invullen (alleen als het veld nog niet door de gebruiker is ingevuld).
const pre = {
  opdrachtgever: [a.organisatie, a.contact].filter(Boolean).join(' — '),
  datumplaats: a.datum ? formatDate(new Date(`${a.datum}T12:00:00`)) : '',
  omvang: [a.doelgroep, Number(a.gasten) ? `${Number(a.gasten)} gasten` : ''].filter(Boolean).join(' · '),
  budgetstatus: a.budget ? `${a.budget} · versie 1 · ${formatDate(new Date())}` : '',
  opdracht: a.doel || '',
  aanleiding: a.aanleiding || '',
  doelgroep: a.doelgroep || '',
  behoeften: [(a.dieet || []).length ? `Dieetwensen: ${a.dieet.join(', ')}` : '', a.toegankelijk ? 'Rolstoeltoegankelijk nodig' : '', a.hybride ? 'Ook online deelnemers' : ''].filter(Boolean).join('. '),
  financieel: a.budget ? `Eigen budgetindicatie: ${a.budget}` : '',
  verantwoordelijke: a.contact || '',
};
function persist(msg) { all[slug] = doc; save(KEY, all); if (msg) statusEl.textContent = msg; }

const fit = (el) => { if (el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; } };
document.querySelectorAll('[data-doc-field]').forEach((el) => {
  const k = el.dataset.docField;
  el.value = doc.fields[k] ?? pre[k] ?? '';
  fit(el);
  el.addEventListener('input', () => { doc.fields[k] = el.value; fit(el); persist(); });
  el.addEventListener('change', () => persist('Opgeslagen in deze browser ✓'));
});
document.querySelectorAll('[data-doc-check]').forEach((el) => {
  const k = el.dataset.docCheck;
  el.checked = k in doc.checks ? doc.checks[k] : el.hasAttribute('data-default-on');
  el.addEventListener('change', () => { doc.checks[k] = el.checked; persist('Opgeslagen in deze browser ✓'); });
});
document.querySelectorAll('[data-doc-status-radio]').forEach((el) => {
  el.checked = doc.status === el.value;
  el.addEventListener('change', () => { doc.status = el.value; persist('Status opgeslagen ✓'); });
});
if (Object.values(pre).some(Boolean)) statusEl.textContent = 'Aangevuld met je antwoorden uit de vragenlijst op maat ✓ Alles blijft in deze browser.';
document.querySelector('[data-doc-print]')?.addEventListener('click', () => window.print());
