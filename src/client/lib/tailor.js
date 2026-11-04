// Top Locaties — maakt een concept op maat op basis van de vragenlijst.
// Pure functies: gedeeld door de browser (concept.js) en de tests. Geen prijzen, geen claims:
// we rekenen alleen tijden, data, aantallen en teksten door.

const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const toTime = (min) => { const v = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
const isPrep = (r) => /crew|opbouw|briefing|inrichten|generale/i.test(r.title);

/** Eerste gastenmoment in het draaiboek (crew/opbouw tellen niet mee). */
export function firstGuestTime(runbook) {
  const r = runbook.find((x) => !isPrep(x));
  return r ? r.time : runbook[0]?.time;
}

/** Verschuift alle tijden zodat het eerste gastenmoment op `start` valt. */
export function shiftRunbook(runbook, start) {
  const base = toMin(firstGuestTime(runbook));
  const target = toMin(start);
  if (base == null || target == null) return runbook.map((r) => ({ ...r }));
  const d = target - base;
  return runbook.map((r) => ({ ...r, time: toMin(r.time) == null ? r.time : toTime(toMin(r.time) + d) }));
}

const isTeardown = (r) => /afbouw|opruimen|retour/i.test(r.title || '');
const durMin = (d) => { const m = /(\d+)\s*min/i.exec(d || ''); return m ? Number(m[1]) : null; };
const round5 = (m) => Math.round(m / 5) * 5;

/** Natuurlijke eindtijd van het gastenprogramma: einde van het laatste onderdeel vóór de afbouw. */
export function naturalEnd(runbook) {
  const guest = (runbook || []).filter((r) => !isPrep(r) && !isTeardown(r) && toMin(r.time) != null);
  const last = guest[guest.length - 1];
  if (!last) return null;
  return toTime(toMin(last.time) + (durMin(last.duration) || 0));
}

/**
 * Past tijden in een nieuw venster: alles tussen `from` en `to` wordt lineair naar `newFrom`–`newTo` geschaald
 * (afgerond op 5 minuten, duur schaalt mee); daarvóór schuift mee met de start, daarna met het einde.
 */
export function fitTimes(items, from, to, newFrom, newTo) {
  const a = toMin(from), b = toMin(to), A = toMin(newFrom), B = toMin(newTo);
  if ([a, b, A, B].some((x) => x == null) || b <= a || B <= A) return { items: items.map((x) => ({ ...x })), ratio: 1 };
  const ratio = (B - A) / (b - a);
  const out = items.map((it) => {
    const t = toMin(it.time);
    if (t == null) return { ...it };
    let nt; let dur = it.duration;
    if (t < a) nt = t + (A - a);
    else if (t >= b) nt = t + (B - b);
    else { nt = round5(A + (t - a) * ratio); const dm = durMin(it.duration); if (dm != null) dur = `${Math.max(5, round5(dm * ratio))} min`; }
    return { ...it, time: toTime(nt), ...(it.duration !== undefined ? { duration: dur } : {}) };
  });
  return { items: out, ratio };
}

/** Draaiboek op start- én eindtijd. Geeft ook een eerlijke opmerking als het venster veel korter of langer is. */
export function fitRunbook(runbook, start, end) {
  const shifted = shiftRunbook(runbook || [], start);
  if (!toMin(end)) return { runbook: shifted, timing: null };
  const from = firstGuestTime(shifted); const to = naturalEnd(shifted);
  const { items, ratio } = fitTimes(shifted, from, to, from, end);
  let note = '';
  if (ratio < 0.75) note = 'Je hebt flink minder tijd dan dit concept vraagt. De onderdelen zijn ingekort; overweeg één onderdeel te schrappen of kies de compacte variant.';
  else if (ratio > 1.35) note = 'Je hebt meer tijd dan dit concept vraagt. De onderdelen zijn verlengd; gebruik de ruimte voor langere pauzes, netwerken of een extra onderdeel.';
  return { runbook: items, timing: { start: from, end, naturalEnd: to, ratio, note } };
}

/** "12–10 WEKEN VOORAF" → datum van het begin van die fase; "DAG ERVOOR"/"DAG ZELF"/"NA AFLOOP" ook. */
export function phaseDate(when, eventDate) {
  if (!eventDate) return null;
  const d = new Date(`${eventDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const w = /(\d+)\s*[–-]?\s*\d*\s*WEKEN/i.exec(when);
  if (w) { d.setDate(d.getDate() - Number(w[1]) * 7); return d; }
  if (/DAG ERVOOR/i.test(when)) { d.setDate(d.getDate() - 1); return d; }
  if (/DAG ZELF/i.test(when)) return d;
  if (/NA AFLOOP/i.test(when)) { d.setDate(d.getDate() + 1); return d; }
  return null;
}
export const formatDate = (d) => (d ? d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** "1 per 10–12 gasten" of "1 per 20 deelnemers" → concreet aantal voor de groep. */
export function crewCount(count, guests) {
  const m = /(\d+)\s*per\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(gasten|deelnemers)/i.exec(count);
  if (!m || !guests) return count;
  const per = m[3] ? (Number(m[2]) + Number(m[3])) / 2 : Number(m[2]);
  return `${Math.max(1, Math.ceil((guests / per) * Number(m[1])))} (${count})`;
}

/** Kies de passende variant op basis van groep en format. */
export function pickVariation(concept, answers) {
  const v = concept.variations || [];
  const g = Number(answers.gasten) || 0;
  const find = (re) => v.find((x) => re.test(x.title));
  const out = [];
  if (answers.hybride) { const h = find(/hybride/i); if (h) out.push(h); }
  if (g && concept.guestCountMin && g < concept.guestCountMin) { const s = find(/klein|intiem|compact|halve/i); if (s) out.push(s); }
  if (g && concept.guestCountMax && g > concept.guestCountMax) { const l = find(/groot|groter/i); if (l) out.push(l); }
  return out;
}

/** Locatiecheck tegen de bron-capaciteit (geen claim over beschikbaarheid). */
export function venueFit(venue, guests) {
  if (!venue) return { status: 'none', text: 'Nog geen locatie gekozen.' };
  if (!guests) return { status: 'unknown', text: `${venue.name}: vul het aantal gasten in voor een capaciteitscheck.` };
  if (venue.capacityMax == null) return { status: 'unknown', text: `${venue.name}: capaciteit onbekend in de bron — vraag dit na bij de locatie.` };
  if (guests > venue.capacityMax) return { status: 'warn', text: `${venue.name} meldt maximaal ${venue.capacityMax} personen; jouw groep is ${guests}. Kies een grotere locatie of vraag de mogelijkheden na.` };
  if (venue.capacityMin && guests < venue.capacityMin) return { status: 'warn', text: `${venue.name} meldt minimaal ${venue.capacityMin} personen; jouw groep is ${guests}.` };
  return { status: 'ok', text: `${venue.name} meldt ruimte tot ${venue.capacityMax} personen — past bij ${guests} gasten (volgens de bron; bevestig bij de locatie).` };
}

/** Vult de uitnodiging in met de antwoorden. */
export function fillInvitation(inv, answers, venue) {
  const date = answers.datum ? new Date(`${answers.datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '[datum]';
  const rep = (s) => String(s || '')
    .replace(/\[datum\]/g, date)
    .replace(/\[dag\]/g, answers.datum ? new Date(`${answers.datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long' }) : '[dag]')
    .replace(/\[locatie\]/g, venue ? venue.name : '[locatie]')
    .replace(/\[plaats\]/g, venue ? venue.city : '[plaats]')
    .replace(/\[centrale vraag\]/g, answers.doel || '[centrale vraag]');
  return { subject: rep(inv.subject), text: rep(inv.text), reminder: rep(inv.reminder) };
}

/** Bouwt het volledige plan op maat. */
export function tailor(concept, answers, { venue = null, suppliers = [] } = {}) {
  const guests = Number(answers.gasten) || null;
  const { runbook, timing } = fitRunbook(concept.runbook || [], answers.start, answers.eind);
  const planning = (concept.planning || []).map((p) => ({ ...p, date: phaseDate(p.when, answers.datum) }));
  const crew = (concept.crew || []).map((c) => ({ ...c, count: crewCount(c.count, guests) }));
  const diets = [].concat(answers.dieet || []);
  const extraChecks = [];
  if (answers.hybride) extraChecks.push('Livestream, online moderator en stabiele verbinding regelen');
  if (answers.toegankelijk) extraChecks.push('Rolstoeltoegankelijke route, lift en toilet bevestigen bij de locatie');
  if (answers.duurzaam === 'hoog') extraChecks.push('Duurzaamheidsafspraken vastleggen met locatie en leveranciers (zie DUURZAAM)');
  if (diets.length) extraChecks.push(`Dieetwensen doorgeven aan catering: ${diets.join(', ')}`);
  const adjustment = answers.bijstelling && concept.adjustments?.[answers.bijstelling] ? { key: answers.bijstelling, label: { exclusiever: 'Exclusiever', interactiever: 'Meer interactie', budgetbewust: 'Budgetbewust' }[answers.bijstelling], text: concept.adjustments[answers.bijstelling] } : null;
  return {
    adjustment,
    answers, guests, venue, suppliers, runbook, timing, planning, crew, diets, extraChecks,
    variations: pickVariation(concept, answers),
    fit: venueFit(venue, guests),
    invitation: fillInvitation(concept.invitation || {}, answers, venue),
  };
}

/** Platte tekst van het complete draaiboek (kopiëren / mailen). */
export function toText(concept, t, labels = {}) {
  const L = [];
  const a = t.answers;
  L.push('TOP LOCATIES — DRAAIBOEK OP MAAT', concept.title.toUpperCase(), concept.proposition, '');
  L.push(`Organisatie: ${a.organisatie || '—'}`, `Datum: ${a.datum ? formatDate(new Date(`${a.datum}T12:00:00`)) : 'nog te bepalen'}`, `Tijden: ${a.start || '—'}${a.eind ? ` – ${a.eind}` : ''}`, `Gasten: ${t.guests || 'nog te bepalen'}`, `Doel: ${a.doel || concept.objective}`, `Doelgroep: ${a.doelgroep || (concept.audiences || []).join(', ')}`, `Contactpersoon: ${a.contact || '—'}`, `Gewenst gevoel: ${(a.feelings?.length ? a.feelings : concept.feelings).map((f) => labels[f] || f).join(', ')}`);
  if (a.budget) L.push(`Eigen budgetindicatie: ${a.budget} (indicatie van de organisator; geen prijsopgave)`);
  L.push('', `LOCATIE: ${t.venue ? `${t.venue.name}, ${t.venue.city} — ${t.venue.url}` : 'nog te kiezen'}`, t.fit.text);
  if (t.suppliers.length) { L.push('', 'MAKERS:'); t.suppliers.forEach((s) => L.push(`- ${s.name} (${s.role}) — ${s.url}`)); }
  if (t.adjustment) L.push('', `BIJGESTELD — ${t.adjustment.label.toUpperCase()}: ${t.adjustment.text}`);
  if (a.aanleiding || concept.occasionText) L.push('', `AANLEIDING: ${a.aanleiding || concept.occasionText}`);
  if (concept.goals) { L.push('', 'DOELEN:'); L.push(`- Zakelijk: ${concept.goals.business.join('; ')}`, `- Deelnemer: ${concept.goals.participant.join('; ')}`, `- Gewenst gedrag: ${concept.goals.behaviour.join('; ')}`); }
  if (concept.journey) { L.push('', 'BEZOEKERSREIS:'); concept.journey.forEach((j) => L.push(`- ${j.phase} — ${j.title}: ${j.text}`)); }
  if (t.variations.length) { L.push('', 'AANBEVOLEN VARIANT:'); t.variations.forEach((v) => L.push(`- ${v.title}: ${v.text}`)); }
  L.push('', 'DAGDRAAIBOEK:');
  t.runbook.forEach((r) => L.push(`${r.time} (${r.duration})  ${r.title} — ${r.description} [wie: ${r.owner} · waar: ${r.space}${r.needs?.length ? ` · nodig: ${r.needs.join(', ')}` : ''}]`));
  L.push('', 'AFTELPLANNING:');
  t.planning.forEach((p) => { L.push(`${p.when}${p.date ? ` (vanaf ${formatDate(p.date)})` : ''} — ${p.title}`); p.tasks.forEach((x) => L.push(`  [ ] ${x}`)); });
  const cat = concept.catering || {};
  L.push('', `CATERINGVOORSTEL${t.guests ? ` (voor ${t.guests} gasten)` : ''}:`, cat.concept || '');
  (cat.moments || []).forEach((m) => L.push(`- ${m.time} ${m.moment}: ${m.proposal} [${m.format}${m.dietary && m.dietary !== '—' ? ` · ${m.dietary}` : ''}]`));
  if (t.diets.length) L.push(`Dieetwensen in de groep: ${t.diets.join(', ')}`);
  L.push(`Dranken: ${cat.drinks || ''}`);
  L.push('', 'ENTERTAINMENT:');
  (concept.entertainment || []).forEach((e) => L.push(`- ${e.moment}: ${e.option} (${e.format}) — ${e.why}`));
  L.push('', 'BEZETTING:');
  t.crew.forEach((c) => L.push(`- ${c.role}: ${c.count} — ${c.task}`));
  L.push('', 'RUIMTES:');
  (concept.spaces || []).forEach((s) => L.push(`- ${s.space}: ${s.use}. ${s.requirements}.`));
  L.push('', 'CHECKLIST:');
  (concept.checklist || []).forEach((g) => { L.push(g.group.toUpperCase()); g.items.forEach((x) => L.push(`  [ ] ${x}`)); });
  if (t.extraChecks.length) { L.push('OP MAAT'); t.extraChecks.forEach((x) => L.push(`  [ ] ${x}`)); }
  L.push('', "RISICO'S EN PLAN B:");
  (concept.risks || []).forEach((r) => L.push(`- ${r.risk} → ${r.mitigation}`));
  L.push('', 'KOSTENPOSTEN (offertes opvragen):');
  (concept.budgetItems || []).forEach((x) => L.push(`- ${x}`));
  L.push('', 'DUURZAAM:');
  (concept.sustainability || []).forEach((x) => L.push(`- ${x}`));
  if (concept.kpis) { L.push('', 'MEETPLAN (KPI):'); concept.kpis.forEach((k) => L.push(`- ${k.goal}: ${k.kpi} — ${k.when} — ${k.how}`)); }
  if (concept.communication) { L.push('', 'COMMUNICATIEPLAN:'); concept.communication.forEach((x) => L.push(`- ${x.when} · ${x.channel}: ${x.message}`)); }
  L.push('', 'EVALUATIE:');
  (concept.evaluation || []).forEach((x) => L.push(`- ${x}`));
  L.push('', 'UITNODIGING', `Onderwerp: ${t.invitation.subject}`, t.invitation.text, '', `Herinnering: ${t.invitation.reminder}`);
  L.push('', 'CALLSHEET (vul namen en telefoonnummers aan):');
  callsheet(concept, t).forEach((r) => L.push(`- ${r.role}: ${r.name || '[naam]'}${r.party ? ` — ${r.party}` : ''} — tel: [ ] — aanwezig vanaf ${r.arrive || '[tijd]'}`));
  const qs = quoteRequests(concept, t, concept.quoteQuestions || {});
  if (qs.length) { L.push('', 'OFFERTEAANVRAGEN:'); qs.forEach((q) => L.push('', `AAN: ${q.to}`, `ONDERWERP: ${q.subject}`, q.body)); }
  L.push('', `Concept: https://top-locaties.nl/eventconcepten/${concept.slug}/`, 'Let op: dit is een inspiratie- en werkdocument, geen boeking. Beschikbaarheid, capaciteit en prijzen bevestig je bij de locatie en leveranciers.');
  return L.join('\n');
}

/* ---------- Zelf regelen: callsheet, offerteaanvragen, begroting ---------- */

const quoteKind = (role) => (/catering|bediening|gastvrijheid/i.test(role) ? 'catering' : /av|techniek|licht|geluid|livestream/i.test(role) ? 'techniek' : 'overig');
const dateText = (a) => (a.datum ? new Date(`${a.datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '[datum nog te bepalen]');

/** Callsheet: wie is wie op de dag zelf. Telefoonnummers vult de organisator zelf in. */
export function callsheet(concept, t) {
  const rows = [{ role: 'Eindverantwoordelijke (organisator)', name: t.answers.contact || '', party: t.answers.organisatie || '', arrive: t.runbook[0]?.time || '' }];
  if (t.venue) rows.push({ role: 'Aanspreekpunt locatie', name: '', party: t.venue.name, arrive: t.runbook[0]?.time || '' });
  for (const s of t.suppliers) {
    const first = t.runbook.find((r) => r.owner === s.role);
    rows.push({ role: s.role, name: '', party: s.name, arrive: first ? first.time : '' });
  }
  for (const c of t.crew) if (!rows.some((r) => r.role === c.role)) rows.push({ role: c.role, name: '', party: '', arrive: '' });
  return rows;
}

/** Offerteaanvragen per locatie en per gekozen maker, op basis van het draaiboek op maat. */
export function quoteRequests(concept, t, questions = {}) {
  const a = t.answers;
  const head = (to) => `Beste ${to},\n\nWe organiseren ${concept.title.toLowerCase()}${a.organisatie ? ` voor ${a.organisatie}` : ''} op ${dateText(a)} voor ${t.guests || '[aantal]'} gasten, en vragen graag een offerte aan.`;
  const sign = `\n\nAlvast bedankt. Ik hoor graag of dit mogelijk is.\n\nMet vriendelijke groet,\n${a.contact || '[naam]'}${a.organisatie ? `\n${a.organisatie}` : ''}`;
  const out = [];
  const firstT = t.runbook[0]?.time; const lastR = t.runbook[t.runbook.length - 1];
  if (t.venue) {
    const spaces = (concept.spaces || []).map((s) => `- ${s.space}: ${s.use} (${s.requirements})`).join('\n');
    const q = (questions.locatie || []).map((x) => `- ${x}`).join('\n');
    out.push({ to: t.venue.name, kind: 'locatie', url: t.venue.url, subject: `Offerteaanvraag ${dateText(a)} — ${t.guests || ''} gasten`.trim(),
      body: `${head(t.venue.name)}\n\nTijden: van ${firstT || '[start]'} (inclusief opbouw) tot ongeveer ${lastR ? `${lastR.time} + ${lastR.duration}` : '[einde]'}.\n\nRuimtes die we nodig hebben:\n${spaces}${a.toegankelijk ? '\n\nToegankelijkheid: we hebben een rolstoeltoegankelijke route, lift en toilet nodig.' : ''}${a.hybride ? '\n\nEen deel van de deelnemers is online: we hebben een stabiele internetverbinding nodig.' : ''}\n\nOnze vragen:\n${q}${sign}` });
  }
  for (const s of t.suppliers) {
    const kind = quoteKind(s.role);
    const parts = t.runbook.filter((r) => r.owner === s.role);
    const cat = kind === 'catering' ? `\n\nOns cateringvoorstel als vertrekpunt:\n${(concept.catering?.moments || []).map((m) => `- ${m.time} ${m.moment}: ${m.proposal} (${m.format})`).join('\n')}${t.diets.length ? `\n\nDieetwensen in de groep: ${t.diets.join(', ')}.` : ''}` : '';
    const q = (questions[kind] || questions.overig || []).map((x) => `- ${x}`).join('\n');
    out.push({ to: s.name, kind, url: s.url, subject: `Offerteaanvraag ${s.role.toLowerCase()} — ${dateText(a)}`,
      body: `${head(s.name)}\n\nJullie rol: ${s.role}.${parts.length ? `\n\nOnderdelen in ons draaiboek:\n${parts.map((r) => `- ${r.time} (${r.duration}) ${r.title}: ${r.description}${r.needs?.length ? ` — nodig: ${r.needs.join(', ')}` : ''}`).join('\n')}` : ''}${cat}${t.venue ? `\n\nLocatie: ${t.venue.name}, ${t.venue.city}.` : ''}\n\nOnze vragen:\n${q}${sign}` });
  }
  return out;
}

/** Begrotingsblad (CSV, puntkomma voor Nederlandse Excel). Bedragen vult de organisator in uit de offertes. */
export function budgetCsv(concept, t) {
  const rows = [['Kostenpost', 'Partij', 'Status (bevestigd / raming / op te vragen)', 'Bedrag excl. btw', 'Btw', 'Opmerking']];
  const partyFor = (item) => {
    if (/locatie/i.test(item) && t.venue) return t.venue.name;
    const s = t.suppliers.find((x) => item.toLowerCase().includes(x.role.toLowerCase().split(' ')[0]));
    return s ? s.name : '';
  };
  for (const item of concept.budgetItems || []) rows.push([item, partyFor(item), 'op te vragen', '', '', '']);
  rows.push(['Onvoorzien', '', '', '', '', 'Reserveer een deel van je budget voor het onverwachte']);
  rows.push(['TOTAAL', '', '', '', '', t.answers.budget ? `Eigen budgetindicatie: ${t.answers.budget}` : '']);
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
}
