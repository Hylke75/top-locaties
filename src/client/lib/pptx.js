// Bewerkbare PowerPoint (.pptx, 16:9) van een concept, zonder bibliotheken.
// Elke dia bestaat uit tekstvakken in de huisstijl; teksten blijven in PowerPoint/Keynote/Google Slides bewerkbaar.
import { zip } from './exporters.js';

const W = 12192000, H = 6858000, IN = 914400;
const C = { ink: '292A2C', coral: 'F45269', paper: 'F6F5F2', white: 'FFFFFF', muted: '656766', line: 'A5A19D', taupe: 'D9C9BF' };
const F = { display: 'Archivo Black', body: 'DM Sans', mono: 'DM Mono' };
const x = (s) => String(s ?? '').replace(/︎/g, '').replace(/\*/g, '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

/* ---------- XML-bouwstenen ---------- */
const run = ({ t, size = 14, color = C.ink, font = F.body, bold = false, caps = false }) =>
  `<a:r><a:rPr lang="nl-NL" sz="${Math.round(size * 100)}" b="${bold ? 1 : 0}"${caps ? ' cap="all"' : ''} dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${font}"/><a:cs typeface="${font}"/></a:rPr><a:t>${x(t)}</a:t></a:r>`;
const para = (p) => {
  const runs = (p.runs || [p]).map(run).join('');
  const bullet = p.bullet ? `<a:buClr><a:srgbClr val="${C.coral}"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="–"/>` : '<a:buNone/>';
  return `<a:p><a:pPr marL="${p.bullet ? 228600 : 0}" indent="${p.bullet ? -228600 : 0}"><a:spcBef><a:spcPts val="${p.before ?? 300}"/></a:spcBef><a:lnSpc><a:spcPct val="${p.line ?? 100000}"/></a:lnSpc>${bullet}</a:pPr>${runs}</a:p>`;
};
let sid = 1;
const box = ({ x: X, y: Y, w, h, paras, fill, anchor = 't' }) => `<p:sp><p:nvSpPr><p:cNvPr id="${++sid}" name="Tekst ${sid}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${Math.round(X)}" y="${Math.round(Y)}"/><a:ext cx="${Math.round(w)}" cy="${Math.round(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill ? `<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>` : '<a:noFill/>'}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="${fill ? 91440 : 0}" tIns="${fill ? 91440 : 0}" rIns="${fill ? 91440 : 0}" bIns="${fill ? 91440 : 0}" anchor="${anchor}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paras.map(para).join('')}</p:txBody></p:sp>`;
const rule = (X, Y, w, color = C.ink, thick = 19050) => `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="${++sid}" name="Lijn ${sid}"/><p:cNvCxnSpPr/><p:nvPr/></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="${Math.round(X)}" y="${Math.round(Y)}"/><a:ext cx="${Math.round(w)}" cy="0"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="${thick}"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:ln></p:spPr></p:cxnSp>`;
const pic = (X, Y, w, h) => `<p:pic><p:nvPicPr><p:cNvPr id="${++sid}" name="Sfeerbeeld" descr="Sfeerbeeld ter illustratie"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${Math.round(X)}" y="${Math.round(Y)}"/><a:ext cx="${Math.round(w)}" cy="${Math.round(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;

const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const slideXml = (bg, shapes) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld ${NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${bg}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes.join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

/* ---------- Dia-indeling ---------- */
const M = 0.55 * IN; // marge
const mono = (t, color = C.ink, size = 10) => ({ t, size, color, font: F.mono, caps: true });
const disp = (t, size, color = C.ink) => ({ t, size, color, font: F.display, caps: true, bold: true }); // vet als terugval wanneer Archivo Black niet is geïnstalleerd
const body = (t, size = 14, color = C.ink, bold = false) => ({ t, size, color, font: F.body, bold });

function frame(c, n, title, inner, total, idx, dark = false) {
  const fg = dark ? C.white : C.ink;
  const shapes = [];
  if (title) {
    shapes.push(box({ x: M, y: M, w: W / 2 - M, h: 0.4 * IN, paras: [mono(`${n} / ${c.title}`, fg)], anchor: 'b' }));
    shapes.push(box({ x: W / 2, y: M - 0.15 * IN, w: W / 2 - M, h: 0.6 * IN, paras: [{ ...disp(title, 28, fg), runs: undefined }].map((p) => ({ runs: [p] })), anchor: 'b' }).replace('<a:pPr ', '<a:pPr algn="r" '));
    shapes.push(rule(M, M + 0.55 * IN, W - 2 * M, fg, 19050));
  }
  shapes.push(...inner);
  shapes.push(rule(M, H - M - 0.05 * IN, W - 2 * M, dark ? '5A5B5D' : C.line, 9525));
  shapes.push(box({ x: M, y: H - M, w: W / 2 - M, h: 0.3 * IN, paras: [mono('Top Locaties', fg, 9)] }));
  shapes.push(box({ x: W / 2, y: H - M, w: W / 2 - M, h: 0.3 * IN, paras: [mono(`${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, fg, 9)] }).replace('<a:pPr ', '<a:pPr algn="r" '));
  return shapes;
}
const TOP = M + 0.85 * IN, BODYH = H - TOP - M - 0.25 * IN, FULLW = W - 2 * M, HALF = (W - 2 * M - 0.5 * IN) / 2;
const bullets = (xs, size = 14) => (xs || []).filter(Boolean).map((t) => ({ runs: [body(t, size)], bullet: true, before: 500 }));
const rows = (items, fmt) => items.map((it) => ({ runs: fmt(it), before: 700 }));
const chunk = (xs, n) => { const o = []; for (let i = 0; i < (xs || []).length; i += n) o.push(xs.slice(i, i + n)); return o.length ? o : [[]]; };

/** Concept + partnerdata → dia-specificaties. */
export function pptxSlides(c, P) {
  const S = [];
  const feel = (c.feelings || []).map((f) => P.feelings?.[f] || f).join(' + ');
  const meta = [c.organisatie, c.datum && new Date(`${c.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }), c.guests ? `${c.guests} gasten` : ''].filter(Boolean).join(' / ');
  S.push({ dark: true, image: true, inner: () => [
    box({ x: M, y: M, w: W * 0.55, h: 0.4 * IN, paras: [mono(`Eventconcept${meta ? ` / ${meta}` : ''}`, C.white)] }),
    box({ x: M, y: 1.3 * IN, w: W * 0.52, h: 2.6 * IN, paras: (c.headline || [c.title]).map((l, i) => ({ runs: [disp(l, 54, /^\*.*\*$/.test(l) || i > 0 ? C.coral : C.white)], line: 85000, before: 0 })), anchor: 'b' }),
    box({ x: M, y: 4.1 * IN, w: W * 0.5, h: 1.4 * IN, paras: [{ runs: [body(c.proposition, 16, C.white)] }] }),
    box({ x: M, y: 5.75 * IN, w: W * 0.5, h: 0.4 * IN, paras: [mono(`${feel}${c.duration ? ` / ${c.duration}` : ''}`, C.white)] }),
    ...(P.__image ? [pic(W * 0.6, M, W * 0.4 - M, H - 2 * M - 0.35 * IN), box({ x: W * 0.6 + 0.15 * IN, y: H - M - 0.8 * IN, w: 2.6 * IN, h: 0.32 * IN, fill: C.white, paras: [mono('Sfeerbeeld ter illustratie', C.ink, 8)] })] : []),
  ] });
  S.push({ n: '01', title: 'Waarom dit event', inner: () => [
    box({ x: M, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [disp(c.objective, 22)], line: 90000 }, { runs: [body(c.occasionText, 13)], before: 1200 }] }),
    ...[['Organisatie', c.goals?.business], ['Deelnemer', c.goals?.participant], ['Gedrag erna', c.goals?.behaviour]].map(([h, xs], i) => box({ x: M + HALF + 0.5 * IN + i * (HALF / 3), y: TOP, w: HALF / 3 - 0.15 * IN, h: BODYH, paras: [{ runs: [mono(h, C.coral)] }, ...bullets(xs, 12)] })),
  ] });
  if (c.audienceInsight || c.audiences) S.push({ n: '02', title: 'Voor wie', inner: () => [
    box({ x: M, y: TOP, w: HALF, h: BODYH, paras: bullets(c.audiences, 16) }),
    box({ x: M + HALF + 0.5 * IN, y: TOP, w: HALF, h: BODYH, paras: [['Waarom ze komen', c.audienceInsight?.why], ['Wat ze boeit', c.audienceInsight?.interests], ['Wat we vermijden', c.audienceInsight?.avoid], ['Zo spreken we ze aan', c.audienceInsight?.approach]].filter(([, v]) => v).flatMap(([k, v]) => [{ runs: [mono(k, C.muted, 9)], before: 900 }, { runs: [body(v, 13)], before: 100 }]) }),
  ] });
  S.push({ n: '03', title: 'Het idee', inner: () => [
    box({ x: M, y: TOP, w: FULLW * 0.6, h: 1.4 * IN, paras: (c.idea?.headline || [c.title]).map((l) => ({ runs: [disp(l, 30, /^\*/.test(l) ? C.coral : C.ink)], line: 90000, before: 0 })) }),
    box({ x: M, y: TOP + 1.6 * IN, w: FULLW * 0.6, h: BODYH - 1.6 * IN, paras: [{ runs: [body(c.idea?.body, 14)], line: 115000 }] }),
    box({ x: M + FULLW * 0.65, y: TOP, w: FULLW * 0.35, h: BODYH, fill: C.taupe, paras: [{ runs: [mono('Sfeer', C.ink)] }, { runs: [body(c.mood, 15)], before: 600 }, ...(c.connectionDesign || []).slice(0, 4).map((t) => ({ runs: [body(t, 12)], bullet: true, before: 500 }))] }),
  ] });
  if ((c.journey || []).length) S.push({ n: '04', title: 'Zo gaat het voelen', inner: () => (c.journey || []).slice(0, 6).map((j, i) => box({ x: M + i * (FULLW / 6), y: TOP + 0.2 * IN, w: FULLW / 6 - 0.1 * IN, h: BODYH - 0.2 * IN, fill: i === 3 ? C.coral : null,
    paras: [{ runs: [mono(`${String(i + 1).padStart(2, '0')} / ${j.phase}`, C.ink, 9)] }, { runs: [disp(j.title, 14)], before: 700, line: 90000 }, { runs: [body(j.text, 11)], before: 500 }] })) });
  chunk(c.program, 5).forEach((part, k, all) => S.push({ n: '05', title: `Het programma${all.length > 1 ? ` (${k + 1}/${all.length})` : ''}`, inner: () => [box({ x: M, y: TOP, w: FULLW, h: BODYH,
    paras: rows(part, (p) => [mono(`${p.time || ''}   `, C.ink, 12), disp(p.title, 18), body(`   ${p.description || ''}`, 13), ...(p.details?.result ? [body(`   → ${p.details.result}`, 12, C.coral)] : [])]) })] }));
  chunk(c.runbook, 10).forEach((part, k, all) => S.push({ n: '06', title: `Het draaiboek${all.length > 1 ? ` (${k + 1}/${all.length})` : ''}`, inner: () => [box({ x: M, y: TOP, w: FULLW, h: BODYH,
    paras: rows(part, (r) => [mono(`${r.time || ''}  ${r.duration ? `(${r.duration})` : ''}   `, C.ink, 11), body(r.title, 13, C.ink, true), body(`${r.owner ? `  — ${r.owner}` : ''}${r.space ? ` / ${r.space}` : ''}`, 12, C.muted)]).map((p) => ({ ...p, before: 450 })) })] }));
  if (c.catering) S.push({ n: '07', title: 'Catering', inner: () => [
    box({ x: M, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [body(c.catering.concept, 16)], line: 110000 }, ...(c.catering.drinks ? [{ runs: [body('Dranken. ', 13, C.ink, true), body(c.catering.drinks, 13)], before: 1200 }] : [])] }),
    box({ x: M + HALF + 0.5 * IN, y: TOP, w: HALF, h: BODYH, paras: rows((c.catering.moments || []).slice(0, 6), (m) => [mono(`${m.time || ''}  `, C.ink, 11), body(m.moment, 13, C.ink, true), body(` — ${m.proposal || ''}`, 12)]) }),
  ] });
  if ((c.entertainment || []).length) S.push({ n: '08', title: 'Entertainment', inner: () => c.entertainment.slice(0, 6).map((e, i) => box({ x: M + (i % 3) * (FULLW / 3), y: TOP + Math.floor(i / 3) * (BODYH / 2), w: FULLW / 3 - 0.25 * IN, h: BODYH / 2 - 0.15 * IN,
    paras: [{ runs: [mono(e.moment, C.coral)] }, { runs: [disp(e.option, 15)], before: 500, line: 90000 }, { runs: [body(e.why, 12)], before: 500 }] })) });
  const venues = (c.venueIds || []).map((v) => P.venues?.[v]).filter(Boolean);
  const sups = (c.supplierIds || []).map((s) => P.suppliers?.[s]).filter(Boolean);
  S.push({ n: '09', title: 'Locatie en makers', inner: () => [
    box({ x: M, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [mono('Locaties', C.coral)] }, ...(venues.length ? venues.map((v) => ({ runs: [body(v.name, 14, C.ink, true), body(`, ${v.city}${v.capacityMax ? ` — tot ${v.capacityMax} gasten` : ''}`, 13)], bullet: true, before: 600 })) : [{ runs: [body('Nog te kiezen.', 13)] }]), { runs: [body('Aangesloten Greenbookings-partners. Capaciteit volgens de bron; beschikbaarheid en prijs op te vragen.', 10, C.muted)], before: 1400 }] }),
    box({ x: M + HALF + 0.5 * IN, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [mono('Makers', C.coral)] }, ...(sups.length ? sups.map((s) => ({ runs: [body(s.name, 14, C.ink, true), body(` — ${String(s.role || '').toLowerCase()}`, 13)], bullet: true, before: 600 })) : [{ runs: [body('Nog te kiezen.', 13)] }])] }),
  ] });
  if ((c.communication || []).length) S.push({ n: '10', title: 'Communicatie', inner: () => [box({ x: M, y: TOP, w: FULLW, h: BODYH, paras: rows(c.communication.slice(0, 8), (m) => [mono(`${m.when}   `, C.ink, 11), body(m.channel, 13, C.ink, true), body(` — ${m.message || ''}`, 13)]) })] });
  S.push({ n: '11', title: 'Kosten en risico’s', inner: () => [
    box({ x: M, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [mono('Kostenposten', C.coral)] }, ...bullets(c.budgetItems, 13), { runs: [body('Bedragen uit de offertes van locatie en makers.', 10, C.muted)], before: 1200 }] }),
    box({ x: M + HALF + 0.5 * IN, y: TOP, w: HALF, h: BODYH, paras: [{ runs: [mono('Risico’s en plan B', C.coral)] }, ...(c.risks || []).slice(0, 5).map((r) => ({ runs: [body(r.risk, 13, C.ink, true), body(` — ${r.mitigation || ''}`, 12)], bullet: true, before: 600 }))] }),
  ] });
  if ((c.kpis || []).length) S.push({ n: '12', title: 'Wat het oplevert', inner: () => [box({ x: M, y: TOP, w: FULLW, h: BODYH, paras: rows(c.kpis, (k) => [body(k.goal, 14, C.ink, true), body(` — ${k.kpi}`, 13), mono(`   ${k.when || ''} / ${k.how || ''}`, C.muted, 10)]) })] });
  S.push({ dark: true, inner: () => [
    box({ x: M, y: 1.4 * IN, w: FULLW, h: 0.4 * IN, paras: [mono('Volgende stap', C.white)] }),
    box({ x: M, y: 1.9 * IN, w: FULLW, h: 2 * IN, paras: [{ runs: [disp('Laten we het', 54, C.white)], line: 85000, before: 0 }, { runs: [disp('waarmaken.', 54, C.coral)], line: 85000, before: 0 }] }),
    ...['Datum en aantallen bevestigen', 'Offertes bij locatie en makers', 'Draaiboek en callsheet delen'].map((t, i) => box({ x: M + i * (FULLW / 3), y: 4.4 * IN, w: FULLW / 3 - 0.3 * IN, h: 1.4 * IN, paras: [{ runs: [disp(`0${i + 1}.`, 34, C.coral)] }, { runs: [mono(t, C.white, 11)], before: 500 }] })),
  ] });
  return S;
}

const THEME = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Top Locaties"><a:themeElements>
<a:clrScheme name="Top Locaties"><a:dk1><a:srgbClr val="${C.ink}"/></a:dk1><a:lt1><a:srgbClr val="${C.white}"/></a:lt1><a:dk2><a:srgbClr val="${C.ink}"/></a:dk2><a:lt2><a:srgbClr val="${C.paper}"/></a:lt2><a:accent1><a:srgbClr val="${C.coral}"/></a:accent1><a:accent2><a:srgbClr val="2546BB"/></a:accent2><a:accent3><a:srgbClr val="${C.taupe}"/></a:accent3><a:accent4><a:srgbClr val="94AC9E"/></a:accent4><a:accent5><a:srgbClr val="D49E50"/></a:accent5><a:accent6><a:srgbClr val="4C6B85"/></a:accent6><a:hlink><a:srgbClr val="2546BB"/></a:hlink><a:folHlink><a:srgbClr val="${C.coral}"/></a:folHlink></a:clrScheme>
<a:fontScheme name="Top Locaties"><a:majorFont><a:latin typeface="${F.display}"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="${F.body}"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Top Locaties"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="28575"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
const MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="lt2"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="3200"><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr><a:defRPr sz="1400"><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle><a:lvl1pPr><a:defRPr sz="1400"/></a:lvl1pPr></p:otherStyle></p:txStyles></p:sldMaster>`;
const LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Leeg"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
const REL = (items) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map(([id, type, target]) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`).join('')}</Relationships>`;

/** Bouwt de .pptx. image: optioneel JPEG-bytes voor de coverdia. */
export function buildPptx(c, P, { image = null } = {}) {
  sid = 1;
  const ctx = { ...P, __image: Boolean(image) };
  const spec = pptxSlides(c, ctx);
  const slides = spec.map((s, i) => slideXml(s.dark ? C.ink : C.paper, frame(c, s.n, s.title, s.inner(), spec.length, i, s.dark)));
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>',
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${x(c.title)}</dc:title><dc:creator>Top Locaties</dc:creator></cp:coreProperties>`,
    'ppt/presentation.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdM"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rIdS${i + 1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${W}" cy="${H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`,
    'ppt/_rels/presentation.xml.rels': REL([['rIdM', 'slideMaster', 'slideMasters/slideMaster1.xml'], ['rIdT', 'theme', 'theme/theme1.xml'], ...slides.map((_, i) => [`rIdS${i + 1}`, 'slide', `slides/slide${i + 1}.xml`])]),
    'ppt/slideMasters/slideMaster1.xml': MASTER,
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ['rId2', 'theme', '../theme/theme1.xml']]),
    'ppt/slideLayouts/slideLayout1.xml': LAYOUT,
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': REL([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]),
    'ppt/theme/theme1.xml': THEME,
  };
  slides.forEach((s, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] = s;
    files[`ppt/slides/_rels/slide${i + 1}.xml.rels`] = REL([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'], ...(i === 0 && image ? [['rIdImg', 'image', '../media/cover.jpeg']] : [])]);
  });
  if (image) files['ppt/media/cover.jpeg'] = image;
  return zip(files);
}

/** Browser: sfeerbeeld bijsnijden naar het beeldvlak van de coverdia en als JPEG teruggeven. */
export async function coverJpeg(src) {
  if (!src || typeof document === 'undefined') return null;
  try {
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = src; await img.decode();
    const tw = 1000, th = Math.round(tw * ((H - 2 * M - 0.35 * IN) / (W * 0.4 - M)));
    const cv = document.createElement('canvas'); cv.width = tw; cv.height = th;
    const s = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
    const g = cv.getContext('2d'); g.drawImage(img, (tw - img.naturalWidth * s) / 2, (th - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch { return null; }
}
export const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
