// Laadt brondata (Greenbookings-snapshot) en redactionele lagen en voegt ze
// samen tot view-models. Bronvelden worden nooit overschreven door redactie.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../content');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

export const SITE = {
  name: 'Top Locaties',
  origin: 'https://top-locaties.nl',
  greenbookings: 'https://greenbookings.nl',
  locatieZoeker: 'https://locatie-zoeker.nl',
  meetings: 'https://meetings.nu',
};

export function formatDate(iso) {
  if (!iso) return 'onbekend';
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`;
}

export function capacityText(min, max) {
  if (max == null) return 'CAPACITEIT OP AANVRAAG';
  if (!min) return `TOT ${max} PERSONEN`;
  return `${min}–${max} PERSONEN`;
}

/**
 * Harde productregel (FO §0.4, bouwplan L-03): alleen gepubliceerde, POSITIEF aangesloten
 * Greenbookings-partners. Ontbrekend, null of iets anders dan `true` = niet publiceren.
 */
export function isPublishablePartner(src) {
  return Boolean(src) && src.status === 'gepubliceerd' && src.aangesloten === true;
}

/** Leveranciers: alleen actieve, aangesloten Greenbookings-partners (bevestigd 03-11-2026). */
export function isPublishableSupplier(src) {
  return Boolean(src) && src.status === 'actief' && src.aangesloten === true;
}

export const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' en ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function loadData() {
  const snapshot = read('greenbookings-snapshot.json');
  const feelingsDoc = read('feelings.json');
  const venueDoc = read('venues.editorial.json');
  const supplierDoc = read('suppliers.editorial.json');
  const conceptDoc = read('concepts.json');
  const placeholders = snapshot._meta.placeholderImages;
  const isPlaceholder = (url) => !url || placeholders.some((p) => url.includes(p));

  const feelings = feelingsDoc.feelings;
  const feelingLabels = Object.fromEntries(feelings.map((f) => [f.id, f.label]));
  const concepts = conceptDoc.concepts
    .filter((c) => c.status === 'published')
    .sort((a, b) => a.priority - b.priority);

  // Bron leidend: elke gepubliceerde, aangesloten partner is doorzoekbaar (FO §0.4).
  // De redactionele laag is optioneel; zonder redactie tonen we alleen bronfeiten.
  const SFEER_TO_CHARACTER = { 'Industrieel': ['industrieel'], 'Landelijk & natuur': ['groen'], 'Klassiek & historisch': ['historisch'], 'Creatief & artistiek': ['creatief'] };
  const venues = snapshot.venues
    .map((src, index) => {
      if (!isPublishablePartner(src)) return null; // partner-only, fail-closed
      const curated = venueDoc.venues.find((v) => v.greenbookingsSlug === src.greenbookingsSlug);
      const ed = curated || {
        id: src.greenbookingsSlug,
        order: 1000 + index,
        label: [src.type, src.sfeer].filter(Boolean).join(' / ').toUpperCase() || 'LOCATIE',
        eventTypes: [],
        character: SFEER_TO_CHARACTER[src.sfeer] || [],
        line: src.tagline ? `${src.tagline}.`.replace(/\.\.$/, '.') : `${src.type || 'Locatie'} in ${src.city}.`,
        illustrativeImage: null,
      };
      let image;
      if (src.heroImage && !isPlaceholder(src.heroImage.url)) {
        image = { src: src.heroImage.url, alt: src.heroImage.alt || src.name, kind: 'source', label: 'BEELD: GREENBOOKINGS-PROFIEL' };
      } else if (ed.illustrativeImage) {
        image = { src: ed.illustrativeImage.url, alt: `Sfeerbeeld ter illustratie — niet de werkelijke ${src.name}`, kind: 'illustrative', label: 'SFEERBEELD TER ILLUSTRATIE', credit: ed.illustrativeImage.credit };
      } else {
        image = { src: null, alt: '', kind: 'none', label: 'FOTO VOLGT VIA GREENBOOKINGS' };
      }
      const conceptLinks = concepts
        .map((c) => ({ c, m: c.venueMatches.find((m) => m.venueId === ed.id) }))
        .filter((x) => x.m)
        .map(({ c, m }) => ({ slug: c.slug, title: c.title, reason: m.reason, feelings: c.feelings }));
      return {
        id: ed.id,
        order: ed.order ?? index,
        greenbookingsSlug: src.greenbookingsSlug,
        slug: src.greenbookingsSlug,
        name: src.name,
        tagline: src.tagline,
        sfeer: src.sfeer,
        sfeerTags: src.sfeerTags || [],
        bijeenkomstTypes: src.bijeenkomstTypes || [],
        mediaCount: src.mediaCount || 0,
        city: src.city,
        province: src.province,
        type: src.type,
        label: ed.label,
        line: ed.line || (src.tagline ? `${src.tagline}.` : `${src.type || 'Locatie'} in ${src.city}.`),
        eventTypes: ed.eventTypes,
        character: ed.character,
        capacityMin: src.capacityMin,
        capacityMax: src.capacityMax,
        capacity: capacityText(src.capacityMin, src.capacityMax),
        image,
        profileUrl: snapshot._meta.profileUrlPattern.venue.replace('{slug}', src.greenbookingsSlug),
        sourceUpdatedAt: src.sourceUpdatedAt,
        sourceDate: formatDate(src.sourceUpdatedAt),
        concepts: conceptLinks,
        curated: Boolean(curated),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const suppliers = supplierDoc.suppliers
    .map((ed) => {
      const src = snapshot.suppliers.find((s) => s.greenbookingsSlug === ed.greenbookingsSlug);
      if (!isPublishableSupplier(src)) return null; // alleen aangesloten leverancierspartners
      return {
        id: ed.id,
        slug: slugify(src.name),
        name: src.name,
        category: src.category,
        website: src.website,
        image: src.heroImage ? { src: src.heroImage.url, alt: src.heroImage.alt } : null,
        concepts: concepts.flatMap((c) => c.supplierMatches.filter((m) => m.supplierId === ed.id).map((m) => ({ slug: c.slug, title: c.title, role: m.role, reason: m.reason }))),
        label: ed.label,
        symbol: ed.symbol,
        city: src.city,
        tagline: src.tagline,
        profileUrl: snapshot._meta.profileUrlPattern.supplier.replace('{slug}', src.greenbookingsSlug),
        profileLinkStatus: ed.profileLinkStatus,
        sourceDate: formatDate(src.sourceUpdatedAt),
      };
    })
    .filter(Boolean);

  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  return {
    snapshotMeta: snapshot._meta,
    syncedDate: formatDate(snapshot._meta.syncedAt),
    question: feelingsDoc.question,
    feelings,
    feelingLabels,
    concepts,
    venues,
    venueById: byId(venues),
    suppliers,
    supplierById: byId(suppliers),
    taxonomy: venueDoc.taxonomy,
  };
}
