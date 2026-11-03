// Briefing → drie wezenlijk verschillende concepten uit de bibliotheek.
// Pure functies (browser + node --test). Geen scores tonen, wel uitleg.

const HALF = ['ochtend', 'middag'];

/** Bepaal fit van één concept met de briefing; geeft punten + uitlegbare redenen. */
export function scoreConcept(c, brief, ctx = {}) {
  const reasons = [];
  const watch = [];
  let pts = 0;
  const occLabel = (id) => (ctx.occasionTypes || []).find((o) => o.id === id)?.label || id;
  const feelLabel = (id) => (ctx.feelings || {})[id] || id;

  if (brief.aanleiding) {
    if ((c.occasions || []).includes(brief.aanleiding)) { pts += 6; reasons.push(`Gemaakt voor deze aanleiding: ${occLabel(brief.aanleiding).toLowerCase()}.`); }
    else pts -= 2;
  }
  const feel = (brief.gevoel || []).filter(Boolean).slice(0, 2);
  const w = c.feelingWeights || {};
  const strong = feel.filter((f) => (w[f] || 0) >= 4);
  feel.forEach((f) => { pts += (w[f] || 0) * 1.5; });
  if (strong.length) reasons.push(`Sterk op ${strong.map(feelLabel).join(' en ').toLowerCase()}.`);
  else if (feel.length && feel.some((f) => w[f])) reasons.push(`Raakt ook ${feel.filter((f) => w[f]).map(feelLabel).join(' en ').toLowerCase()}.`);

  if (brief.dagdeel) {
    const ok = brief.dagdeel === c.dayPart || (brief.dagdeel === 'halve' && HALF.includes(c.dayPart));
    if (ok) { pts += 5; reasons.push(`Past in het dagdeel: ${(c.duration || '').toLowerCase()}.`); }
    else { pts -= 4; watch.push(`Ander dagdeel (${(c.duration || '').toLowerCase()}); het draaiboek is te verschuiven, de lengte niet altijd.`); }
  }
  const n = Number(brief.gasten) || 0;
  if (n) {
    if (n >= c.guestCountMin && n <= c.guestCountMax) { pts += 3; reasons.push(`Werkt voor ${n} gasten (${c.guestCountMin}–${c.guestCountMax}).`); }
    else { pts -= 6; watch.push(`Bedoeld voor ${c.guestCountMin}–${c.guestCountMax} gasten; bij ${n} pas je opzet en bezetting aan.`); }
  }
  if (brief.sfeer && (c.moodDirections || []).includes(brief.sfeer)) { pts += 3; reasons.push('Past bij de gekozen sfeerrichting.'); }

  if (brief.regio && ctx.venues) {
    const q = brief.regio.trim().toLowerCase();
    const inRegion = (c.venueMatches || []).map((m) => ctx.venues[m.venueId]).filter(Boolean)
      .filter((v) => [v.city, v.province].some((x) => (x || '').toLowerCase().includes(q)));
    if (inRegion.length) { pts += 2; reasons.push(`${inRegion.length} passende partnerlocatie${inRegion.length > 1 ? 's' : ''} in ${brief.regio}.`); }
    else watch.push(`Nog geen aanbevolen partnerlocatie in ${brief.regio}; zoek in de locatiezoeker.`);
  }
  return { concept: c, pts, reasons, watch };
}

/** Kies drie aanbevelingen met verschillende categorieën (dus echt verschillende concepten). */
export function recommend(concepts, brief, ctx = {}, count = 3) {
  const scored = concepts.map((c) => scoreConcept(c, brief, ctx)).sort((a, b) => b.pts - a.pts || a.concept.priority - b.concept.priority);
  const picked = [];
  const cats = new Set();
  for (const s of scored) {
    if (picked.length >= count) break;
    if (cats.has(s.concept.category)) continue;
    picked.push(s); cats.add(s.concept.category);
  }
  for (const s of scored) { if (picked.length >= count) break; if (!picked.includes(s)) picked.push(s); }
  const roles = ['BESTE MATCH', 'ANDERE INVALSHOEK', 'VERRASSENDE KEUZE'];
  return picked.map((s, i) => ({ ...s, role: roles[i] || 'ALTERNATIEF' }));
}

/** Briefing → antwoorden voor de vragenlijst op de conceptpagina. */
export function briefToAnswers(brief, ctx = {}) {
  const a = {};
  if (brief.organisatie) a.organisatie = brief.organisatie;
  if (Number(brief.gasten)) a.gasten = String(Number(brief.gasten));
  if (brief.doel) a.doel = brief.doel;
  if (brief.doelgroep) a.doelgroep = brief.doelgroep;
  if (brief.datum) a.datum = brief.datum;
  if (brief.aanleiding) a.aanleiding = (ctx.occasionTypes || []).find((o) => o.id === brief.aanleiding)?.label || brief.aanleiding;
  if (brief.budget) a.budget = brief.budget;
  a.bijstelling = { ruim: 'exclusiever', bescheiden: 'budgetbewust' }[brief.budgetniveau] || (brief.interactie ? 'interactiever' : '');
  if (brief.hybride) a.hybride = true;
  if (brief.toegankelijk) a.toegankelijk = true;
  a.duurzaam = brief.duurzaam ? 'hoog' : 'basis';
  return a;
}

/** Deeplink naar een conceptpagina met gevoel + vooringevulde vragenlijst. */
export function conceptLink(slug, brief, ctx = {}) {
  const p = new URLSearchParams();
  const feel = (brief.gevoel || []).filter(Boolean).slice(0, 2);
  if (feel.length) p.set('gevoel', feel.join(','));
  p.set('brief', JSON.stringify(briefToAnswers(brief, ctx)));
  return `/eventconcepten/${slug}/?${p.toString()}#samenstellen`;
}

/** Leest ?brief= veilig terug; alleen bekende velden en simpele waarden. */
export function parseBriefParam(value) {
  const allowed = ['organisatie', 'gasten', 'doel', 'doelgroep', 'datum', 'aanleiding', 'budget', 'bijstelling', 'hybride', 'toegankelijk', 'duurzaam'];
  try {
    const o = JSON.parse(value || 'null');
    if (!o || typeof o !== 'object') return null;
    const out = {};
    for (const k of allowed) {
      const v = o[k];
      if (typeof v === 'boolean') out[k] = v;
      else if (typeof v === 'string' && v.length <= 300) out[k] = v;
    }
    if (out.bijstelling && !['exclusiever', 'interactiever', 'budgetbewust'].includes(out.bijstelling)) out.bijstelling = '';
    if (out.duurzaam && !['basis', 'hoog'].includes(out.duurzaam)) delete out.duurzaam;
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}
