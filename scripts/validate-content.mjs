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
  const { concepts } = read('concepts.json');
  const FEELINGS = ['energie', 'verbinding', 'verwondering', 'rust', 'focus', 'trots'];

  const fIds = feelings.feelings.map((f) => f.id);
  if (JSON.stringify(fIds) !== JSON.stringify(FEELINGS)) errors.push('feelings.json: de zes gevoelens zijn redactioneel vastgesteld (contract B). Wijzig alleen na redactiebesluit.');
  if (feelings.maxSelected !== 2) errors.push('feelings.json: maxSelected moet 2 zijn.');

  const vIds = new Set(venues.venues.map((v) => v.id));
  const nonPartner = new Set();
  const sIds = new Set(suppliers.suppliers.map((s) => s.id));
  for (const v of venues.venues) {
    const src = snapshot.venues.find((x) => x.greenbookingsSlug === v.greenbookingsSlug);
    if (!src) errors.push(`venue ${v.id}: geen bronrecord voor slug ${v.greenbookingsSlug} in de snapshot.`);
    else if (!(src.status === 'gepubliceerd' && src.aangesloten === true)) { warnings.push(`venue ${v.id}: geen gepubliceerde, aangesloten partner — wordt niet getoond (fail-closed).`); nonPartner.add(v.id); }
    for (const t of v.eventTypes) if (!venues.taxonomy.eventTypes[t]) errors.push(`venue ${v.id}: onbekend eventType '${t}'.`);
    for (const t of v.character) if (!venues.taxonomy.character[t]) errors.push(`venue ${v.id}: onbekend karakter '${t}'.`);
    if (v.illustrativeImage && !v.illustrativeImage.credit) errors.push(`venue ${v.id}: illustratief beeld zonder credit.`);
    if (!v.editorialCheckedAt) warnings.push(`venue ${v.id}: redactionele tekst nog niet gecontroleerd (editorialCheckedAt leeg).`);
  }
  for (const s of suppliers.suppliers) {
    if (!snapshot.suppliers.find((x) => x.greenbookingsSlug === s.greenbookingsSlug)) errors.push(`supplier ${s.id}: geen bronrecord in de snapshot.`);
    if (s.profileLinkStatus !== 'bevestigd') warnings.push(`supplier ${s.id}: profiellink nog niet handmatig bevestigd.`);
  }

  const titles = new Set();
  const slugs = new Set();
  for (const c of concepts.filter((x) => x.status !== 'archived')) {
    const where = `concept ${c.slug}`;
    const outer = errors.length;
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
    if (c.venueMatches.length < 2 || c.venueMatches.length > 4) errors.push(`${where}: 2–4 aanbevolen locaties vereist.`);
    for (const m of c.venueMatches) {
      if (!vIds.has(m.venueId)) errors.push(`${where}: venueMatch '${m.venueId}' bestaat niet.`);
      if (nonPartner.has(m.venueId)) errors.push(`${where}: venueMatch '${m.venueId}' is geen aangesloten partner — niet toegestaan.`);
      if (!m.reason || m.reason.length < 20) errors.push(`${where}: venueMatch '${m.venueId}' mist een redactionele reden.`);
    }
    for (const m of c.supplierMatches) {
      if (!sIds.has(m.supplierId)) errors.push(`${where}: supplierMatch '${m.supplierId}' bestaat niet.`);
      if (!m.role || !m.reason) errors.push(`${where}: supplierMatch '${m.supplierId}' mist rol of reden.`);
      if (!c.supplierRoles.includes(m.role)) errors.push(`${where}: rol '${m.role}' staat niet in supplierRoles.`);
    }
    for (const img of [c.hero, c.programImage]) if (!img || (img.illustrative !== true && !img.credit)) errors.push(`${where}: beeld zonder status of credit.`);
    // Concepten in draft blokkeren de build niet (ze worden niet gepubliceerd): fouten worden aandachtspunten.
    if (c.status === 'draft') warnings.push(...errors.splice(outer).map((e) => `[draft] ${e}`));
  }
  return { errors, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { errors, warnings } = validate();
  warnings.forEach((w) => console.warn(`LET OP ${w}`));
  errors.forEach((e) => console.error(`FOUT  ${e}`));
  console.log(`CONTENTCONTROLE / ${errors.length} fouten, ${warnings.length} aandachtspunten`);
  if (errors.length) process.exitCode = 1;
}
