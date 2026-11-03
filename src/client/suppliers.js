// /leveranciers/: filter op vakgebied.
const root = document.querySelector('[data-supplier-dir-root]');
root.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sup-cat]');
  if (!b) return;
  const cat = b.dataset.supCat;
  root.querySelectorAll('[data-sup-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  root.querySelectorAll('[data-supplier-dir]').forEach((c) => { c.hidden = Boolean(cat) && c.dataset.category !== cat; });
});
