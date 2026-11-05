// Afhankelijkheidsvrije omzetting van een gebouwde pagina naar Markdown (voor agents: Accept: text/markdown).
// Neemt alleen de inhoud van <main>, laat scripts, formulieren en decoratie weg, en houdt koppen, alinea's,
// lijsten, definitielijsten, tabellen en links over. Links worden absoluut gemaakt.

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", hellip: '…', mdash: '—', ndash: '–', euml: 'ë', eacute: 'é' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
  return ENT[e.toLowerCase()] ?? m;
});
const clean = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/[︎️]/g, '').replace(/[ \t\r\n]+/g, ' ').trim();

export function htmlToMarkdown(html, { origin = 'https://top-locaties.nl', path: pagePath = '/' } = {}) {
  const title = clean((/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1] || '');
  const desc = decode((/<meta name="description" content="([^"]*)"/i.exec(html) || [])[1] || '');
  let m = (/<main\b[^>]*>([\s\S]*)<\/main>/i.exec(html) || [])[1] || '';
  const abs = (href) => { try { return new URL(decode(href), origin + pagePath).href; } catch { return href; } };

  m = m
    // Weg: niet-inhoudelijke of interactieve delen.
    .replace(/<(script|style|template|svg|noscript|textarea|select|button|form|dialog|nav)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(span|strong|b|em|dt|dd|td|th)>/gi, '</$1> ')
    .replace(/<(input|img|source|br\s*\/?)\b[^>]*>/gi, (t) => (/^<br/i.test(t) ? ' ' : ''))
    .replace(/<[^>]+\b(hidden|aria-hidden="true")[^>]*>[\s\S]*?<\/(div|span|p|li)>/gi, ' ')
    .replace(/<span class="tl-visually-hidden">[\s\S]*?<\/span>/gi, '')
    // Koppen en blokken.
    .replace(/<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(Number(n))} ${clean(t)}\n\n`)
    .replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi, (_, t) => `\n\n**${clean(t)}**\n\n`)
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, h, t) => { const x = clean(t); return x ? `[${x}](${abs(h)})` : ''; })
    .replace(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi, (_, a, b) => `\n- **${clean(a)}**: ${clean(b)}\n`)
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_, t) => `\n- ${clean(t)}\n`)
    .replace(/<div class="tl-runbook__row[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, (_, t) => `\n- ${clean(t.replace(/<\/span>/g, '</span> · ')).replace(/( · )+$/, '').replace(/ · ( · )+/g, ' · ')}\n`)
    .replace(/<\/(p|div|section|article|figure|blockquote|dl|ul|ol|details|header|footer|nav)>/gi, '\n\n')
    .replace(/<(p|div|section|article|figure|blockquote)\b[^>]*>/gi, '\n\n');

  const body = m.split(/\n{2,}/).map((block) => {
    const b = block.trim();
    if (!b) return '';
    if (/^(#|- |\*\*)/.test(b) || b.split('\n').every((l) => /^- /.test(l.trim()) || !l.trim())) return b.split('\n').map((l) => (l.trim().startsWith('- ') || l.trim().startsWith('#') ? l.trim() : clean(l))).filter(Boolean).join('\n');
    return clean(b);
  }).filter(Boolean)
    .filter((b, i, a) => b !== a[i - 1]) // dubbele regels (bv. kop + label) één keer
    .join('\n\n');

  const md = `# ${title}\n\n> ${desc}\n\nBron: ${origin}${pagePath}\n\n${body}\n`;
  return md.replace(/\n{3,}/g, '\n\n');
}

/** Ruwe schatting van het aantal tokens (≈ 4 tekens per token). */
export const estimateTokens = (s) => Math.ceil(s.length / 4);
