// Conceptpagina: download het standaardconcept als Word of tekst (zelfde inhoud als presentatie en maker).
import { partners, baseConcept } from './lib/conceptdata.js';
import { merge } from './lib/userconcept.js';
import { exportConcept } from './lib/export-actions.js';

const root = document.querySelector('[data-concept-tools]');
if (root) {
  const st = root.querySelector('[data-tools-status]');
  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-download]');
    if (!b) return;
    st.textContent = 'BESTAND WORDT GEMAAKT…';
    try {
      const [P, base] = await Promise.all([partners(), baseConcept(root.dataset.slug)]);
      const c = merge(base, { venueIds: base.venueMatches.map((m) => m.venueId), supplierIds: base.supplierMatches.map((m) => m.supplierId) });
      st.textContent = await exportConcept(b.dataset.download, c, P);
    } catch (err) { st.textContent = err?.message || 'Downloaden lukte niet. Probeer het opnieuw.'; }
  });
}
