// Homepage: conceptcarrousel met typefilter.
const pad = (n) => String(n).padStart(2, '0');

/* ---- Conceptcarrousel ---- */
const slides = [...document.querySelectorAll('[data-slide]')];
const info = document.querySelector('[data-carousel-info]');
const filters = [...document.querySelectorAll('[data-category-filter]')];
let filter = 'all';
let current = 0;
const available = () => slides.map((s, i) => i).filter((i) => filter === 'all' || slides[i].dataset.category === filter);

function show(index) {
  current = index;
  slides.forEach((s, i) => { s.hidden = i !== index; });
  const list = available();
  info.textContent = `${pad(list.indexOf(index) + 1)} — ${pad(list.length)} / ${filter === 'all' ? 'EVENTCONCEPTEN' : 'IN DEZE SELECTIE'}`;
}
function step(dir) { const a = available(); show(a[(a.indexOf(current) + dir + a.length) % a.length]); }
document.querySelector('[data-carousel-prev]').addEventListener('click', () => step(-1));
document.querySelector('[data-carousel-next]').addEventListener('click', () => step(1));
document.querySelector('[data-carousel]').addEventListener('keydown', (e) => {
  if (e.target.closest('input,select,textarea')) return;
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
filters.forEach((b) => b.addEventListener('click', () => {
  filter = b.dataset.categoryFilter;
  filters.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  show(available()[0]);
}));
show(0);
