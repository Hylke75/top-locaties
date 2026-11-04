// Zoeken over concepten, locaties en makers. Pure functies (browser + node --test).
// Begrijpt groepsgrootte ("20 personen"), plaats/provincie en dagdeel; alle overige woorden moeten ergens voorkomen.
export const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = new Set(['de', 'het', 'een', 'en', 'in', 'voor', 'met', 'op', 'van', 'te', 'bij', 'naar', 'ik', 'wil', 'zoek', 'zoeken', 'graag', 'iets', 'om']);
const SIZE = /(\d{1,5})\s*(personen|persoon|pers|gasten|mensen|deelnemers|man|pax)\b/;
const SYN = { vergaderen: 'vergadering', vergaderingen: 'vergadering', meeting: 'vergadering', heidag: 'strategie', teamuitje: 'teamdag', borrel: 'feest', personeelsfeest: 'feest', diner: 'diner', dineren: 'diner', congres: 'congres', ontbijt: 'ontbijt', lunch: 'lunch', buiten: 'buiten', natuur: 'groen' };

/** "vergaderen utrecht 20 personen" → { size: 20, words: ['vergadering','utrecht'] } */
export function parseQuery(q) {
  let s = norm(q);
  let size = null;
  const m = SIZE.exec(s) || /^(\d{1,5})$/.exec(s);
  if (m) { size = Number(m[1]); s = s.replace(m[0], ' '); }
  const words = s.split(' ').filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)).map((w) => SYN[w] || w);
  return { size, words };
}

/** Voert een zoekvraag uit op de index (gegenereerd door de build). */
export function search(index, q, type = '') {
  const { size, words: all } = parseQuery(q);
  if (!all.length && !size) return { size, words: all, results: [] };
  // Plaatsnamen (uit de locaties) gelden als plaatsfilter voor locaties; concepten zijn overal uitvoerbaar.
  const places = new Set(index.filter((i) => i.t === 'locatie').flatMap((i) => norm(i.place).split(' ')).filter((w) => w.length > 2));
  const placeWords = all.filter((w) => places.has(w));
  const words = all.filter((w) => !places.has(w));
  const results = [];
  for (const it of index) {
    if (type && it.t !== type) continue;
    if (placeWords.length && it.t === 'locatie' && !placeWords.every((w) => norm(it.place).split(' ').includes(w))) continue;
    if (placeWords.length && it.t === 'maker' && it.place && !placeWords.some((w) => norm(it.place).includes(w))) continue;
    if (!words.length && it.t !== 'locatie' && !size) continue;
    const title = norm(it.title);
    const hay = `${title} ${norm(it.text)} ${norm(it.place)}`;
    let score = 0;
    let ok = true;
    for (const w of words) {
      const stem = w.length > 5 ? w.slice(0, -1) : w; // eenvoudige stam (vergaderingen ~ vergadering)
      if (title.split(' ').some((t) => t.startsWith(stem))) score += 6;
      else if (norm(it.place).split(' ').some((t) => t.startsWith(stem))) score += 4;
      else if (hay.includes(stem)) score += 2;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (size) {
      if (it.t === 'locatie') { if (!it.max) { score -= 1; } else if (it.max < size || (it.min && it.min > size * 4)) continue; else score += 2; }
      else if (it.t === 'concept') { if (it.max && it.min && (size < it.min * 0.5 || size > it.max * 1.5)) continue; score += 2; }
    }
    if (placeWords.length && it.t === 'locatie') score += 4;
    results.push({ ...it, score: score + (it.t === 'concept' ? 0.5 : 0) });
  }
  results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'nl'));
  return { size, words: all, places: placeWords, results };
}
