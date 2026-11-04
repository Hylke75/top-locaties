// Invulplekken zoals [datum] en [locatie] horen alleen in het plan op maat (daar als invulveld).
// Op de openbare conceptpagina maken we er leesbare, neutrale zinnen van.

const RULES = [
  [/\[Naam\],\s*/g, ''],
  [/^\[Datum\](?:\s+\d{1,2}:\d{2})?:\s*/g, ''],
  [/^\[datum\]:\s*/g, ''],
  [/\s+[—-]\s+\[datum\]/gi, ''],
  [/\bOp \[datum\],?\s+/g, 'Binnenkort '],
  [/\s+op \[datum\]/gi, ''],
  [/\s+\[datum\]:/gi, ':'],
  [/\s*vóór \[datum\]/gi, ' op tijd'],
  [/\s+tot \[datum\]/gi, ''],
  [/\s*\[dag\]/gi, ' binnenkort'],
  [/:\s*\[link\]/gi, ': die volgt per mail'],
  [/\[link\]/gi, 'de aanmeldlink'],
  [/\s+(?:bij|op|in) \[locatie\](?:,| in) \[plaats\]/gi, ' op onze locatie'],
  [/\[locatie\],? \[plaats\]/gi, 'onze locatie'],
  [/\s+bij \[locatie\]/gi, ' op de locatie'],
  [/\[locatie\]/gi, 'de locatie'],
  [/\s+in \[plaats\]/gi, ''],
  [/\[centrale vraag\]/gi, 'onze centrale vraag'],
  [/\[Naam congres\]/g, 'Ons congres'], [/\[naam congres\]/g, 'ons congres'],
  [/\[Naam awards\](?:\s*\[jaar\])?/g, 'Onze awards'], [/\[naam awards\](?:\s*\[jaar\])?/g, 'onze awards'],
  [/\[thema\]/gi, 'nog een verrassing'],
  [/geen \[organisatie\]/gi, 'geen organisatie'],
  [/\[organisatie\]/gi, 'onze organisatie'],
  [/\s*\[[^\]]{1,40}\]/g, ''],
];

/** Maakt een tekst met invulplekken leesbaar voor de standaardweergave. */
export function neutral(text = '') {
  let s = String(text);
  for (const [re, to] of RULES) s = s.replace(re, to);
  s = s.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim().replace(/:$/, '');
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Zichtbare invulplekken die nooit in de standaardweergave mogen staan (voor controles). */
export const PLACEHOLDER_RE = /\[(?:datum|Datum|DATUM|locatie|plaats|link|naam|Naam|centrale vraag|organisatie|thema|jaar|dag|naam congres|Naam congres|naam awards|Naam awards)\]|nog te bepalen|telefoonnummer invullen/;
