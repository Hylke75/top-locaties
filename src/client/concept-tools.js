// Conceptpagina: download het standaardconcept als Word of tekst (zelfde inhoud als presentatie en maker).
import { partners, baseConcept, exportCtx } from './lib/conceptdata.js';
import { merge } from './lib/userconcept.js';
import { conceptBlocks, blocksToDocx, blocksToText, download, fileSlug, MIME } from './lib/exporters.js';

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
      const blocks = conceptBlocks(c, exportCtx(P));
      if (b.dataset.download === 'docx') download(`${fileSlug(c.title)}.docx`, blocksToDocx(blocks, { title: c.title }), MIME.docx);
      else download(`${fileSlug(c.title)}.txt`, blocksToText(blocks), MIME.txt);
      st.textContent = b.dataset.download === 'docx' ? 'Word-bestand gedownload ✓' : 'Tekstbestand gedownload ✓';
    } catch { st.textContent = 'Downloaden lukte niet. Probeer het opnieuw.'; }
  });
}
