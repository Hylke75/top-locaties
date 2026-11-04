// Exports van een (eigen of standaard) concept: Word (.docx), tekst (.txt).
// Pure functies; geen externe bibliotheken. De .docx is een echte Office Open XML-file
// (ZIP zonder compressie) met koppen, lijsten en tabellen.

const plain = (s) => String(s ?? '').replace(/\*/g, '').replace(/︎/g, '').trim();
const has = (x) => (Array.isArray(x) ? x.length > 0 : Boolean(x));

/** Concept → blokken (h1/h2/h3/p/list/table/kv). Eén bron voor Word, tekst en presentatie-notities. */
export function conceptBlocks(c, ctx = {}) {
  const feel = (f) => ctx.feelings?.[f] || f;
  const B = [];
  const h1 = (t) => B.push({ t: 'h1', text: plain(t) });
  const h2 = (t) => B.push({ t: 'h2', text: plain(t) });
  const h3 = (t) => B.push({ t: 'h3', text: plain(t) });
  const p = (t) => has(t) && B.push({ t: 'p', text: plain(t) });
  const list = (xs) => has(xs) && B.push({ t: 'list', items: xs.map(plain).filter(Boolean) });
  const kv = (pairs) => { const rows = pairs.filter(([, v]) => has(v)).map(([k, v]) => [plain(k), plain(Array.isArray(v) ? v.join(', ') : v)]); if (rows.length) B.push({ t: 'kv', rows }); };
  const table = (head, rows) => rows.length && B.push({ t: 'table', head, rows: rows.map((r) => r.map(plain)) });

  h1(c.title);
  p(c.proposition);
  kv([['Organisatie', c.organisatie], ['Datum', c.datum], ['Gasten', c.guests ? `${c.guests}` : `${c.guestCountMin || ''}–${c.guestCountMax || ''} (indicatief)`], ['Duur', c.duration], ['Gevoel', (c.feelings || []).map(feel)], ['Format', c.format]]);

  h2('01 Aanleiding en doel');
  p(c.occasionText); p(c.objective && `Hoofddoel: ${c.objective}`);
  if (c.goals) kv([['Organisatie', c.goals.business], ['Deelnemer', c.goals.participant], ['Gedrag erna', c.goals.behaviour]]);

  h2('02 Doelgroep');
  list(c.audiences);
  if (c.audienceInsight) kv([['Waarom komen ze', c.audienceInsight.why], ['Wat boeit ze', c.audienceInsight.interests], ['Wat vermijden we', c.audienceInsight.avoid], ['Zo spreken we ze aan', c.audienceInsight.approach]]);

  h2('03 Het idee');
  p(c.idea?.label); p(c.idea?.body); p(c.mood);
  if (has(c.connectionDesign)) { h3('Zo ontstaat verbinding'); list(c.connectionDesign); }
  if (has(c.journey)) { h3('Bezoekersreis'); table(['Fase', 'Gevoel', 'Moment of actie'], c.journey.map((j) => [j.phase, j.title, j.text])); }

  h2('04 Programma');
  for (const it of c.program || []) {
    h3(`${it.time || ''} ${it.title || ''}`.trim());
    p(it.description);
    const d = it.details || {};
    p(d.intro);
    kv([['Waarom', d.why], ['Resultaat', d.result], ['Wie', d.roles], ['Nodig', d.needs], ['Tip', d.tip]]);
    if (has(d.steps)) list(d.steps);
  }

  if (has(c.runbook)) { h2('05 Draaiboek'); table(['Tijd', 'Duur', 'Onderdeel', 'Wie', 'Waar'], c.runbook.map((r) => [r.time, r.duration, [r.title, r.description].filter(Boolean).join(' — '), r.owner, r.space])); }
  if (has(c.planning)) { h2('06 Aftelplanning'); for (const ph of c.planning) { h3(`${ph.when} — ${ph.title}`); list(ph.tasks); } }

  if (c.catering) {
    h2('07 Catering');
    p(c.catering.concept);
    table(['Moment', 'Tijd', 'Voorstel', 'Vorm'], (c.catering.moments || []).map((m) => [m.moment, m.time, m.proposal, m.format]));
    kv([['Dranken', c.catering.drinks], ['Notities', c.catering.notes]]);
  }
  if (has(c.entertainment)) { h2('08 Entertainment'); table(['Moment', 'Wat', 'Vorm', 'Waarom'], c.entertainment.map((e) => [e.moment, e.option, e.format, e.why])); }
  if (has(c.crew) || has(c.spaces)) {
    h2('09 Bezetting en ruimtes');
    table(['Rol', 'Aantal', 'Taak'], (c.crew || []).map((r) => [r.role, r.count, r.task]));
    table(['Ruimte', 'Gebruik', 'Eisen'], (c.spaces || []).map((s) => [s.space, s.use, s.requirements]));
  }

  h2('10 Locatie en makers');
  const venues = (c.venueIds || (c.venueMatches || []).map((m) => m.venueId)).map((id) => ctx.venues?.[id]).filter(Boolean);
  list(venues.map((v) => `${v.name}, ${v.city}${v.capacityMax ? ` — tot ${v.capacityMax} gasten (bron: Greenbookings)` : ''}${v.url ? ` — ${v.url}` : ''}`));
  const sups = (c.supplierIds || (c.supplierMatches || []).map((m) => m.supplierId)).map((id) => ctx.suppliers?.[id]).filter(Boolean);
  list(sups.map((s) => `${s.name} (${s.role})${s.url ? ` — ${s.url}` : ''}`));
  p('Uitsluitend aangesloten Greenbookings-partners. Beschikbaarheid en prijs vraag je op bij de partner.');

  if (has(c.communication)) { h2('11 Communicatie'); table(['Wanneer', 'Kanaal', 'Boodschap'], c.communication.map((x) => [x.when, x.channel, x.message])); }
  if (c.invitation?.text) { h3('Uitnodiging'); p(c.invitation.subject); p(c.invitation.text); }

  h2('12 Haalbaarheid, kosten en impact');
  const filled = (c.costs?.items || []).filter((it) => Number(it.amount) > 0);
  if (filled.length) {
    const fmt = (n) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
    const sub = c.costs.items.reduce((n, it) => n + (Number(it.amount) || 0), 0); const extra = Math.round(sub * (Number(c.costs.contingency) || 0)) / 100;
    const ST = { indicatief: 'eigen inschatting', offerte: 'offerte ontvangen', bevestigd: 'bevestigd' };
    h3('Kostenraming (eigen bedragen, excl. btw)');
    table(['Kostenpost', 'Bedrag', 'Status'], [...c.costs.items.map((it) => [it.label, Number(it.amount) > 0 ? fmt(Number(it.amount)) : 'nog in te vullen', ST[it.status] || '']), [`Onvoorzien (${c.costs.contingency || 0}%)`, fmt(extra), ''], ['Totaal', fmt(sub + extra), 'excl. btw']]);
  } else if (has(c.budgetItems)) { h3('Kostenposten (offertes opvragen)'); list(c.budgetItems); }
  if (c.status?.stage) p(`Status: ${{ idee: 'idee', offerte: 'offertes opgevraagd', bevestigd: 'bevestigd', afgerond: 'afgerond' }[c.status.stage] || c.status.stage}.`);
  if (has(c.risks)) { h3("Risico's en plan B"); table(['Risico', 'Plan B'], c.risks.map((r) => [r.risk, r.mitigation])); }
  if (has(c.checklist)) { h3('Checklist'); for (const g of c.checklist) { p(g.group); list(g.items); } }
  if (has(c.kpis)) { h3('KPI’s'); table(['Doel', 'KPI', 'Wanneer', 'Meten'], c.kpis.map((k) => [k.goal, k.kpi, k.when, k.how])); }
  if (has(c.sustainability)) { h3('Duurzaamheid'); list(c.sustainability); }
  if (has(c.evaluation)) { h3('Evaluatie'); list(c.evaluation); }
  if (c.notes) { h2('Notities'); p(c.notes); }
  p(`Gemaakt met Top Locaties — ${ctx.date || ''}. Programma en draaiboek zijn geen boekbaar arrangement; sfeerbeelden zijn illustratief.`.replace(' — .', '.'));
  return B;
}

/** Blokken → platte tekst. */
export function blocksToText(blocks) {
  const L = [];
  for (const b of blocks) {
    if (b.t === 'h1') L.push(b.text.toUpperCase(), '='.repeat(Math.min(60, b.text.length)), '');
    else if (b.t === 'h2') L.push('', b.text.toUpperCase(), '-'.repeat(Math.min(60, b.text.length)));
    else if (b.t === 'h3') L.push('', b.text);
    else if (b.t === 'p') L.push(b.text);
    else if (b.t === 'list') b.items.forEach((x) => L.push(`- ${x}`));
    else if (b.t === 'kv') b.rows.forEach(([k, v]) => L.push(`${k}: ${v}`));
    else if (b.t === 'table') { L.push(b.head.join(' | ')); b.rows.forEach((r) => L.push(r.join(' | '))); }
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}

/* ---------- Word (.docx) ---------- */
const x = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const run = (t, bold = false) => `<w:r>${bold ? '<w:rPr><w:b/></w:rPr>' : ''}<w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
const para = (t, style, rawRuns = false) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${rawRuns ? t : run(t)}</w:p>`;
const cell = (t, w, head) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${head ? '<w:shd w:val="clear" w:color="auto" w:fill="292A2C"/>' : ''}</w:tcPr><w:p>${head ? `<w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>` : run(t)}</w:p></w:tc>`;
function tableXml(head, rows) {
  const w = Math.floor(9000 / head.length);
  const border = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="A5A19D"/><w:bottom w:val="single" w:sz="4" w:color="A5A19D"/><w:insideH w:val="single" w:sz="4" w:color="A5A19D"/></w:tblBorders>';
  return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/>${border}<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${head.map(() => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`
    + `<w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h) => cell(h, w, true)).join('')}</w:tr>`
    + rows.map((r) => `<w:tr>${head.map((_, i) => cell(r[i] ?? '', w, false)).join('')}</w:tr>`).join('') + '</w:tbl><w:p/>';
}
export function blocksToDocxXml(blocks) {
  const body = blocks.map((b) => {
    if (b.t === 'h1') return para(b.text, 'Title');
    if (b.t === 'h2') return para(b.text, 'Heading1');
    if (b.t === 'h3') return para(b.text, 'Heading2');
    if (b.t === 'p') return para(b.text);
    if (b.t === 'list') return b.items.map((i) => para(i, 'ListBullet')).join('');
    if (b.t === 'kv') return b.rows.map(([k, v]) => para(`${run(`${k}: `, true)}${run(v)}`, '', true)).join('');
    if (b.t === 'table') return tableXml(b.head, b.rows);
    return '';
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="DM Sans" w:hAnsi="DM Sans" w:cs="Arial"/><w:color w:val="292A2C"/><w:sz w:val="21"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Archivo Black" w:hAnsi="Archivo Black"/><w:caps/><w:sz w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:pBdr><w:top w:val="single" w:sz="12" w:space="6" w:color="F45269"/></w:pBdr><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Archivo Black" w:hAnsi="Archivo Black"/><w:caps/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="DM Mono" w:hAnsi="DM Mono"/><w:caps/><w:color w:val="F45269"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360" w:hanging="240"/></w:pPr></w:style>
</w:styles>`;

/** Bullets als tekenreeks (geen numbering.xml nodig): "– " vóór elk lijstitem. */
function withDashes(xml) { return xml.replace(/<w:pStyle w:val="ListBullet"\/><\/w:pPr><w:r><w:t xml:space="preserve">/g, '<w:pStyle w:val="ListBullet"/></w:pPr><w:r><w:t xml:space="preserve">– '); }

export function blocksToDocx(blocks, meta = {}) {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${x(meta.title || 'Eventconcept')}</dc:title><dc:creator>Top Locaties</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`,
    'word/_rels/document.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'word/styles.xml': STYLES,
    'word/document.xml': withDashes(blocksToDocxXml(blocks)),
  };
  return zip(files);
}

/* ---------- Minimale ZIP-schrijver (opslaan zonder compressie, UTF-8-namen) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(bytes) { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
export function zip(files) {
  const enc = new TextEncoder();
  const parts = []; const central = []; let offset = 0;
  const u16 = (v) => [v & 0xFF, (v >>> 8) & 0xFF];
  const u32 = (v) => [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF];
  const dosTime = u16(0), dosDate = u16(((2026 - 1980) << 9) | (1 << 5) | 1);
  for (const [name, content] of Object.entries(files)) {
    const nameB = enc.encode(name);
    const data = typeof content === 'string' ? enc.encode(content) : content;
    const crc = crc32(data);
    const local = [...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...dosTime, ...dosDate, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0)];
    parts.push(new Uint8Array(local), nameB, data);
    central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...dosTime, ...dosDate, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nameB);
    offset += local.length + nameB.length + data.length;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(Object.keys(files).length), ...u16(Object.keys(files).length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let o = 0; for (const p of all) { out.set(p, o); o += p.length; }
  return out;
}

export const fileSlug = (s) => plain(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'eventconcept';

/** Browserdownload (Blob). */
export function download(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const MIME = { docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', txt: 'text/plain;charset=utf-8' };
