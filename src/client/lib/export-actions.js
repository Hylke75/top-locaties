// Eén plek voor alle downloads van een concept: PowerPoint, Word en tekst.
import { conceptBlocks, blocksToDocx, blocksToText, download, fileSlug, MIME } from './exporters.js';
import { buildPptx, coverJpeg, PPTX_MIME } from './pptx.js';
import { exportCtx } from './conceptdata.js';
import { buildIcs, ICS_MIME } from './ics.js';
import { phaseDate, naturalEnd } from './tailor.js';

/** Agenda: evenement + aftelplanning. c = volledig (eigen of standaard) concept. */
export function conceptIcs(c, P) {
  const start = (c.program || []).map((p) => p.time).filter(Boolean).sort()[0] || '09:00';
  const venue = (c.venueIds || [])[0] && P.venues?.[c.venueIds[0]];
  return buildIcs({
    title: c.title, date: c.datum, start, end: naturalEnd(c.runbook || []),
    location: venue ? `${venue.name}, ${venue.city}` : '',
    description: [c.proposition, '', 'PROGRAMMA', ...(c.program || []).map((p) => `${p.time} ${p.title}`), '', 'Gemaakt met Top Locaties — https://top-locaties.nl'].join('\n'),
    milestones: (c.planning || []).map((ph) => ({ date: phaseDate(ph.when, c.datum), title: ph.title, description: (ph.tasks || []).map((t) => `- ${t}`).join('\n') })),
  });
}

export async function exportConcept(kind, c, P) {
  const name = fileSlug(c.title);
  if (kind === 'ics') {
    if (!c.datum) throw new Error('Vul eerst een datum in, dan zetten we je event en de planning in je agenda.');
    download(`${name}.ics`, conceptIcs(c, P), ICS_MIME);
    return 'Agendabestand gedownload ✓ — open het om het event en de planning toe te voegen';
  }
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
