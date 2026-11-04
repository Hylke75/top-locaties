#!/usr/bin/env node
// Redactionele poort: elke build valideert de content. Fouten blokkeren de build.
// Dit is de eerste beheerflow: redacteur bewerkt src/content/*.json → npm run validate → build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content');
const read = (n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8'));

export function validate() {
  const errors = [];
  const warnings = [];
  const snapshot = read('greenbookings-snapshot.json');
  const feelings = read('feelings.json');
  const venues = read('venues.editorial.json');
  const suppliers = read('suppliers.editorial.json');
  const conceptDoc = read('concepts.json');
  const { concepts } = conceptDoc;
  const catIds = new Set((conceptDoc.categories || []).map((x) => x.id));
  const FEELINGS = ['energie', 'verbinding', 'verwondering', 'rust', 'focus', 'trots'];

  const fIds = feelings.feelings.map((f) => f.id);
  if (JSON.stringify(fIds) !== JSON.stringify(FEELINGS)) errors.push('feelings.json: de zes gevoelens zijn redactioneel vastgesteld (contract B). Wijzig alleen na redactiebesluit.');
  if (feelings.maxSelected !== 2) errors.push('feelings.json: maxSelected moet 2 zijn.');

  const vIds = new Set(venues.venues.map((v) => v.id));
  const nonPartner = new Set();
  const nonPartnerSup = new Set();
  const sIds = new Set(suppliers.suppliers.map((s) => s.id));
  for (const v of venues.venues) {
    const src = snapshot.venues.find((x) => x.greenbookingsSlug === v.greenbookingsSlug);
    if (!src) errors.push(`venue ${v.id}: geen bronrecord voor slug ${v.greenbookingsSlug} in de snapshot.`);
    else if (!(src.status === 'gepubliceerd' && src.aangesloten === true)) { warnings.push(`venue ${v.id}: geen gepubliceerde, aangesloten partner — wordt niet getoond (fail-closed).`); nonPartner.add(v.id); }
    for (const t of v.eventTypes) if (!venues.taxonomy.eventTypes[t]) errors.push(`venue ${v.id}: onbekend eventType '${t}'.`);
    for (const t of v.character) if (!venues.taxonomy.character[t]) errors.push(`venue ${v.id}: onbekend karakter '${t}'.`);
    if (v.illustrativeImage && !v.illustrativeImage.credit) errors.push(`venue ${v.id}: illustratief beeld zonder credit.`);
  }
  const unchecked = venues.venues.filter((v) => !v.editorialCheckedAt).length;
  if (unchecked) warnings.push(`${unchecked} locatieteksten nog niet nagelezen (editorialCheckedAt leeg) — markeer ze in het beheer als gecontroleerd.`);
  for (const s of suppliers.suppliers) {
    const ss = snapshot.suppliers.find((x) => x.greenbookingsSlug === s.greenbookingsSlug);
    if (!ss) errors.push(`supplier ${s.id}: geen bronrecord in de snapshot.`);
    else if (!(ss.status === 'actief' && ss.aangesloten === true)) { warnings.push(`supplier ${s.id}: geen aangesloten partner — wordt niet getoond.`); nonPartnerSup.add(s.id); }
  }

  const unscored = [];
  const titles = new Set();
  const slugs = new Set();
  for (const c of concepts.filter((x) => x.status !== 'archived')) {
    const where = `concept ${c.slug}`;
    const outer = errors.length;
    if (!catIds.has(c.category)) errors.push(`${where}: onbekend type '${c.category}' (zie categories in concepts.json).`);
    if (slugs.has(c.slug)) errors.push(`${where}: dubbele slug.`); slugs.add(c.slug);
    if (titles.has(c.seo.title)) errors.push(`${where}: SEO-titel niet uniek.`); titles.add(c.seo.title);
    if (!c.seo.description || c.seo.description.length < 70) errors.push(`${where}: SEO-beschrijving ontbreekt of is te kort.`);
    if (c.feelings.length < 2 || c.feelings.length > 3) errors.push(`${where}: gevoelsignatuur moet 2–3 gevoelens hebben.`);
    for (const f of c.feelings) {
      if (!FEELINGS.includes(f)) errors.push(`${where}: onbekend gevoel '${f}'.`);
      if (!c.feelingReasons?.[f]) errors.push(`${where}: geen uitleg (feelingReasons) voor '${f}' — matches moeten uitlegbaar zijn.`);
    }
    for (const [f, w] of Object.entries(c.feelingWeights || {})) {
      if (!c.feelings.includes(f)) errors.push(`${where}: gewicht voor '${f}' zonder gevoel in de signatuur.`);
      if (!(Number.isInteger(w) && w >= 0 && w <= 5)) errors.push(`${where}: gewicht voor '${f}' moet 0–5 zijn.`);
    }
    if (!['draft', 'review', 'published', 'archived'].includes(c.status)) errors.push(`${where}: ongeldige status '${c.status}'.`);
    if (!c.program || c.program.length < 4) errors.push(`${where}: voorbeeldprogramma heeft minstens vier onderdelen nodig.`);
    // Compleetheid: een concept moet direct inzetbaar zijn (opdrachtgever 03-11-2026).
    const need = (cond, what) => { if (!cond) errors.push(`${where}: onvolledig — ${what}.`); };
    need((c.runbook || []).length >= 8, 'dagdraaiboek heeft minstens 8 onderdelen nodig');
    need((c.runbook || []).every((r) => /^\d{2}:\d{2}$/.test(r.time) && r.title && r.owner), 'elk draaiboekonderdeel heeft een tijd (UU:MM), titel en verantwoordelijke rol');
    need((c.planning || []).length >= 4, 'aftelplanning heeft minstens 4 fasen nodig');
    need((c.catering?.moments || []).length >= 3 && c.catering?.concept && c.catering?.drinks, 'cateringvoorstel (concept, minstens 3 momenten, dranken)');
    need((c.entertainment || []).length >= 2, 'entertainment (minstens 2 onderdelen)');
    need((c.crew || []).length >= 3, 'bezetting (minstens 3 rollen)');
    need((c.spaces || []).length >= 2, 'ruimte-eisen (minstens 2 ruimtes)');
    need((c.checklist || []).length >= 3, 'checklist (minstens 3 groepen)');
    need((c.variations || []).length >= 2, 'varianten (minstens 2)');
    need((c.risks || []).length >= 2, "risico's met plan B (minstens 2)");
    need((c.budgetItems || []).length >= 4, 'kostenposten (minstens 4, zonder bedragen)');
    need((c.budgetItems || []).every((x) => !/€|\d+\s*euro/i.test(x)), 'kostenposten mogen geen bedragen bevatten');
    need((c.sustainability || []).length >= 2 && (c.evaluation || []).length >= 2, 'duurzaamheid en evaluatie');
    need(c.invitation?.subject && c.invitation?.text, 'uitnodigingstekst');
    // Conceptmethodiek (onderzoek 03-11-2026): 12 onderdelen van het ideale conceptplan.
    need((c.occasions || []).length && c.occasionText, 'aanleiding (type en tekst)');
    need(['business', 'participant', 'behaviour'].every((k) => (c.goals?.[k] || []).length >= 2), 'doelen op drie niveaus (zakelijk, deelnemer, gedrag; elk minstens 2)');
    need(['why', 'interests', 'avoid', 'approach', 'mode'].every((k) => c.audienceInsight?.[k]), 'doelgroepinzicht (waarom, interesses, wat niet, benadering, vorm)');
    need(c.mood && (c.moodDirections || []).length, 'sfeer en gevoelsrichting');
    need((c.journey || []).length === 6, 'bezoekersreis in zes fasen');
    need((c.connectionDesign || []).length >= 2, 'georganiseerde verbinding (minstens 2 werkvormen)');
    need((c.program || []).every((it) => it.details?.why && it.details?.result), 'per programmaonderdeel: waarom en resultaat');
    need((c.venueMatches || []).every((m) => m.pro && m.watch), 'per locatie: sterk punt en aandachtspunt');
    need((c.communication || []).length >= 3, 'communicatieplan (minstens 3 momenten)');
    need((c.conditions || []).length >= 2 && (c.accessibility || []).length >= 2, 'randvoorwaarden en toegankelijkheid');
    need((c.kpis || []).length >= 3, 'meetplan (minstens 3 KPI\'s)');
    need(['exclusiever', 'interactiever', 'budgetbewust'].every((k) => c.adjustments?.[k]), 'bijstellingen (exclusiever, interactiever, budgetbewust)');
    need((c.program || []).every((it) => it.details?.intro && (it.details?.steps || []).length >= 3), 'elk programmaonderdeel heeft pop-upinhoud (intro en minstens 3 stappen)');
    // Sjabloon eventconceptplan (twaalf hoofdstukken).
    need(['whyLive', 'scope', 'redThread', 'irreplaceable', 'keyMessage', 'restMoments', 'visual', 'senses', 'frictions'].every((k) => c.plan?.[k]), 'conceptplan (zonder-dit-event, afbakening, rode draad, onvervangbaar, boodschap, rust, visueel, zintuigen, wrijving)');
    need((c.plan?.moodWords || []).length === 3, 'conceptplan: precies drie sfeerwoorden');
    need(['ochtend', 'middag', 'dag', 'avond'].includes(c.dayPart), 'dagdeel (ochtend, middag, dag of avond)');
    // Kwaliteitsmodel (100 punten): menselijk oordeel van de hoofdredacteur.
    if (c.quality) {
      const Q = { doelen: 25, doelgroep: 20, originaliteit: 15, betrokkenheid: 15, haalbaarheid: 15, duurzaamheid: 10 };
      const total = Object.keys(Q).reduce((n, k) => n + (Number(c.quality[k]) || 0), 0);
      if (Object.entries(Q).some(([k, max]) => Number(c.quality[k]) > max)) errors.push(`${where}: kwaliteitstoets — score boven het maximum.`);
      if (total < 70) errors.push(`${where}: kwaliteitstoets ${total}/100 — minimaal 70 voor publicatie.`);
    } else if (c.status === 'published') unscored.push(c.slug);
    if (c.venueMatches.length < 2 || c.venueMatches.length > 4) errors.push(`${where}: 2–4 aanbevolen locaties vereist.`);
    for (const m of c.venueMatches) {
      if (!vIds.has(m.venueId)) errors.push(`${where}: venueMatch '${m.venueId}' bestaat niet.`);
      if (nonPartner.has(m.venueId)) errors.push(`${where}: venueMatch '${m.venueId}' is geen aangesloten partner — niet toegestaan.`);
      if (!m.reason || m.reason.length < 20) errors.push(`${where}: venueMatch '${m.venueId}' mist een redactionele reden.`);
    }
    for (const m of c.supplierMatches) {
      if (!sIds.has(m.supplierId)) errors.push(`${where}: supplierMatch '${m.supplierId}' bestaat niet.`);
      if (nonPartnerSup.has(m.supplierId)) errors.push(`${where}: supplierMatch '${m.supplierId}' is geen leverancierspartner.`);
      if (!m.role || !m.reason) errors.push(`${where}: supplierMatch '${m.supplierId}' mist rol of reden.`);
      if (!c.supplierRoles.includes(m.role)) errors.push(`${where}: rol '${m.role}' staat niet in supplierRoles.`);
    }
    for (const img of [c.hero, c.programImage]) if (!img || (img.illustrative !== true && !img.credit)) errors.push(`${where}: beeld zonder status of credit.`);
    // Concepten in draft blokkeren de build niet (ze worden niet gepubliceerd): fouten worden aandachtspunten.
    if (c.status === 'draft') warnings.push(...errors.splice(outer).map((e) => `[draft] ${e}`));
  }
  for (const c of concepts.filter((x) => x.status === 'published')) if (!fs.existsSync(new URL(`../src/assets/og/${c.slug}.jpg`, import.meta.url))) warnings.push(`concept ${c.slug}: geen og-afbeelding — draai node scripts/og-images.mjs.`);
  if (unscored.length) warnings.push(`kwaliteitstoets (100 punten) nog niet ingevuld voor ${unscored.length} gepubliceerde concepten (${unscored.join(", ")}) — hoofdredacteur, beheer → concept → 19.`);
  return { errors, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings } = validate();
  warnings.forEach((w) => console.warn(`LET OP ${w}`));
  errors.forEach((e) => console.error(`FOUT  ${e}`));
  console.log(`CONTENTCONTROLE / ${errors.length} fouten, ${warnings.length} aandachtspunten`);
  if (errors.length) process.exitCode = 1;
}
