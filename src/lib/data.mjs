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

/** Extra partnerprofiel (redactie): alleen https-links en beelden met expliciet gebruiksrecht. */
export function sanitizeProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const https = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : null);
  const out = {
    intro: typeof p.intro === 'string' ? p.intro.slice(0, 600) : '',
    spaces: (Array.isArray(p.spaces) ? p.spaces : []).filter((x) => x && x.name).slice(0, 12).map((x) => ({ name: String(x.name).slice(0, 80), capacity: Number(x.capacity) || null, setup: String(x.setup || '').slice(0, 120), note: String(x.note || '').slice(0, 200) })),
    photos: (Array.isArray(p.photos) ? p.photos : []).filter((x) => https(x?.url) && ['greenbookings', 'locatie', 'eigen'].includes(x.rights)).slice(0, 8).map((x) => ({ url: x.url, alt: String(x.alt || '').slice(0, 160), credit: String(x.credit || '').slice(0, 80), rights: x.rights })),
    video: https(p.video?.url) && /^(https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/)/.test(p.video.url) ? { url: p.video.url, title: String(p.video.title || 'Video').slice(0, 120) } : null,
    source: String(p.source || '').slice(0, 160),
    updatedAt: String(p.updatedAt || '').slice(0, 10),
  };
  return out.intro || out.spaces.length || out.photos.length || out.video ? out : null;
}

export function loadData() {
  const snapshot = read('greenbookings-snapshot.json');
  const feelingsDoc = read('feelings.json');
  const venueDoc = read('venues.editorial.json');
  const supplierDoc = read('suppliers.editorial.json');
  const conceptDoc = read('concepts.json');
  const playbook = read('playbook.json');
  const site = read('site.json');
  const placeholders = snapshot._meta.placeholderImages;
  const isPlaceholder = (url) => !url || placeholders.some((p) => url.includes(p));

  const feelings = feelingsDoc.feelings;
  const feelingLabels = Object.fromEntries(feelings.map((f) => [f.id, f.label]));
  // Eigen hero-beeld per concept als het bestand bestaat (src/assets/img/concepten/<slug>.webp|.jpg); anders het algemene sfeerbeeld.
  const imageDoc = fs.existsSync(path.join(root, 'concept-images.json')) ? read('concept-images.json') : { concepts: {} };
  const ownHero = (c) => {
    const file = ['webp', 'jpg'].map((ext) => `${c.slug}.${ext}`).find((f) => fs.existsSync(path.join(root, '../assets/img/concepten', f)));
    const meta = imageDoc.concepts?.[c.slug] || {};
    return file ? { src: `/assets/img/concepten/${file}`, alt: meta.alt || c.hero.alt, illustrative: true, credit: meta.credit || 'Top Locaties', own: true } : { ...c.hero, own: false };
  };
  const concepts = conceptDoc.concepts
    .filter((c) => c.status === 'published')
    .sort((a, b) => a.priority - b.priority)
    .map((c) => ({ ...c, hero: ownHero(c), dayPartLabel: (conceptDoc.dayParts || []).find((d) => d.id === c.dayPart)?.label || '' }));

  // Bron leidend: elke gepubliceerde, aangesloten partner is doorzoekbaar (FO §0.4).
  // De redactionele laag is optioneel; zonder redactie tonen we alleen bronfeiten.
  const SETUP_ORDER = ['theater', 'cabaret', 'school', 'u_vorm', 'carre', 'diner', 'receptie'];
  const SETUP_LABELS = { theater: 'Theater', cabaret: 'Cabaret', school: 'School', u_vorm: 'U-vorm', carre: 'Carré', diner: 'Diner', receptie: 'Receptie' };
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
        // Uit de bron (read-only): regio, aantal ruimtes en capaciteit per opstelling. Prijs staat niet in de bron → op aanvraag.
        regio: src.regio || null,
        roomCount: Number.isFinite(src.roomCount) ? src.roomCount : null,
        setups: src.setups ? SETUP_ORDER.filter((k) => src.setups[k]).map((k) => ({ key: k, label: SETUP_LABELS[k], max: src.setups[k] })) : [],
        priceIndication: src.priceIndication || null,
        image,
        profileUrl: snapshot._meta.profileUrlPattern.venue.replace('{slug}', src.greenbookingsSlug),
        sourceUpdatedAt: src.sourceUpdatedAt,
        sourceDate: formatDate(src.sourceUpdatedAt),
        concepts: conceptLinks,
        curated: Boolean(curated),
        contactPerson: src.contactPerson || null,
        profile: sanitizeProfile(ed.profile),
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
    categories: (conceptDoc.categories || []).filter((cat) => concepts.some((c) => c.category === cat.id)),
    allCategories: conceptDoc.categories || [],
    occasionTypes: conceptDoc.occasionTypes || [],
    moodDirections: conceptDoc.moodDirections || [],
    dayParts: (conceptDoc.dayParts || []).filter((d) => concepts.some((c) => c.dayPart === d.id)),
    venues,
    venueById: byId(venues),
    suppliers,
    supplierById: byId(suppliers),
    taxonomy: venueDoc.taxonomy,
    playbook,
    site,
  };
}
