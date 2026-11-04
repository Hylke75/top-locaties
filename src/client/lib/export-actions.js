// Eén plek voor alle downloads van een concept: PowerPoint, Word en tekst.
import { conceptBlocks, blocksToDocx, blocksToText, download, fileSlug, MIME } from './exporters.js';
import { buildPptx, coverJpeg, PPTX_MIME } from './pptx.js';
import { exportCtx } from './conceptdata.js';

export async function exportConcept(kind, c, P) {
  const name = fileSlug(c.title);
  if (kind === 'pptx') {
    const image = await coverJpeg(c.hero?.src);
    download(`${name}.pptx`, buildPptx(c, P, { image }), PPTX_MIME);
    return 'PowerPoint gedownload ✓';
  }
  const blocks = conceptBlocks(c, exportCtx(P));
  if (kind === 'docx') { download(`${name}.docx`, blocksToDocx(blocks, { title: c.title }), MIME.docx); return 'Word-bestand gedownload ✓'; }
  download(`${name}.txt`, blocksToText(blocks), MIME.txt);
  return 'Tekstbestand gedownload ✓';
}
