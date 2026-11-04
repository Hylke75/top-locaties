// /eventconcepten/: filter op type en (max. twee) gevoelens; lege staat met alternatief.
const root = document.querySelector('[data-concept-overview]');
const cards = [...root.querySelectorAll('[data-concept-card]')];
const status = root.querySelector('[data-ov-status]');
let category = new URLSearchParams(location.search).get('type') || '';
let daypart = new URLSearchParams(location.search).get('dagdeel') || '';
let feelings = [];

function paint() {
  let n = 0;
  cards.forEach((c) => {
    const f = c.dataset.feelings.split(' ');
    const ok = (!category || c.dataset.category === category) && (!daypart || c.dataset.daypart === daypart) && feelings.every((x) => f.includes(x));
    c.hidden = !ok; if (ok) n++;
  });
  root.querySelectorAll('[data-ov-category]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ovCategory === category)));
  root.querySelectorAll('[data-ov-daypart]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ovDaypart === daypart)));
  root.querySelectorAll('[data-ov-feeling]').forEach((b) => {
    const on = feelings.includes(b.dataset.ovFeeling);
    b.setAttribute('aria-pressed', String(on));
    b.textContent = b.textContent.replace(/[+✓]$/, on ? '✓' : '+');
  });
  root.querySelector('[data-ov-empty]').hidden = n > 0;
  root.querySelector('[data-ov-grid]').hidden = n === 0;
  status.textContent = `${n} ${n === 1 ? 'concept' : 'concepten'} zichtbaar.`;
}
root.addEventListener('click', (e) => {
  const cb = e.target.closest('[data-ov-category]');
  const fb = e.target.closest('[data-ov-feeling]');
  const db = e.target.closest('[data-ov-daypart]');
  if (cb) category = cb.dataset.ovCategory;
  else if (db) daypart = db.dataset.ovDaypart;
  else if (fb) {
    const id = fb.dataset.ovFeeling;
    feelings = feelings.includes(id) ? feelings.filter((x) => x !== id) : [...feelings, id].slice(-2);
  } else return;
  paint();
});
if (daypart || category) paint();
