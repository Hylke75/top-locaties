// /conceptplan/: briefing in acht vragen → drie wezenlijk verschillende concepten met uitleg.
import { recommend, conceptLink } from './lib/brief.js';
import { readData } from './lib/store.js';
import { track } from './lib/track.js';

const data = readData();
const form = document.querySelector('[data-brief-form]');
const results = document.querySelector('[data-brief-results]');
const grid = document.querySelector('[data-brief-grid]');
const status = document.querySelector('[data-brief-status]');
const feelLabels = Object.fromEntries(data.feelings.map((f) => [f.id, f.label]));
const ctx = { occasionTypes: data.occasionTypes, feelings: feelLabels, venues: data.venues };
const KEY = 'tl-brief-v1';
let gevoel = [];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function paintFeel() {
  form.querySelectorAll('[data-brief-feel]').forEach((b) => {
    const on = gevoel.includes(b.dataset.briefFeel);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = `${feelLabels[b.dataset.briefFeel].toUpperCase()} ${on ? '✓' : '+'}`;
  });
}
function read() {
  const f = new FormData(form);
  const b = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v).trim()]));
  ['hybride', 'toegankelijk', 'duurzaam', 'interactie'].forEach((k) => { b[k] = f.get(k) === 'ja'; });
  b.gevoel = [...gevoel];
  return b;
}
function fill(b) {
  if (!b) return;
  for (const [k, v] of Object.entries(b)) {
    const el = form.elements[k];
    if (!el || k === 'gevoel') continue;
    if (el.type === 'checkbox') el.checked = Boolean(v); else el.value = v;
  }
  gevoel = (b.gevoel || []).filter((x) => feelLabels[x]).slice(0, 2);
}
function render(brief) {
  const recs = recommend(data.concepts, brief, ctx);
  grid.innerHTML = recs.map((r, i) => {
    const c = r.concept;
    const href = esc(conceptLink(c.slug, brief, ctx));
    return `<article class="tl-concept-card" data-brief-card="${esc(c.slug)}">
  <a class="tl-concept-card__photo tl-image-frame" href="${href}" tabindex="-1" aria-hidden="true"><img src="${esc(c.hero)}" alt="" loading="lazy" decoding="async"><span class="tl-image-caption">SFEERBEELD TER ILLUSTRATIE</span></a>
  <div class="tl-catalog-card__kicker"><span>0${i + 1} / ${esc(c.categoryLabel)}</span><span>${c.guestCountMin}–${c.guestCountMax} GASTEN</span></div>
  <span class="tl-concept-card__role">${esc(r.role)}</span>
  <h3 class="tl-catalog-card__title"><a href="${href}">${esc(c.title)}</a></h3>
  <p class="tl-catalog-card__desc">${esc(c.teaser)}</p>
  ${r.reasons.length ? `<ul class="tl-brief-reasons">${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  ${r.watch.length ? `<ul class="tl-brief-reasons tl-brief-reasons--watch">${r.watch.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  <div class="tl-catalog-card__foot"><span>${esc(c.dayPartLabel)} · ${esc(c.duration)}</span><a class="tl-arrow-box" href="${href}" aria-label="Werk ${esc(c.title)} uit met mijn briefing">↗</a></div>
</article>`;
  }).join('');
  results.hidden = false;
}

form.addEventListener('click', (e) => {
  const b = e.target.closest('[data-brief-feel]');
  if (!b) return;
  const id = b.dataset.briefFeel;
  gevoel = gevoel.includes(id) ? gevoel.filter((x) => x !== id) : [...gevoel, id].slice(-2);
  paintFeel();
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const brief = read();
  try { localStorage.setItem(KEY, JSON.stringify(brief)); } catch {}
  try { if (brief.gevoel.length) sessionStorage.setItem('tl-feelings', JSON.stringify(brief.gevoel)); } catch {}
  render(brief);
  track('briefing', '');
  status.textContent = 'Je drie concepten staan hieronder ✓';
  results.focus();
  results.scrollIntoView({ block: 'start' });
});

let saved = null;
try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch {}
fill(saved);
paintFeel();
if (saved) render(saved);
