/** Top Locaties: framework-onafhankelijke referentie voor de productie-datalaag.
 * Deze types verbinden de editorial ervaring aan brongebonden Greenbookings-profielen.
 */

export type Feeling =
  | 'energie'
  | 'verbinding'
  | 'verwondering'
  | 'rust'
  | 'focus'
  | 'trots';

export type PublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export interface MediaAsset {
  id: string;
  url: string;
  alt: string;
  credit?: string;
  license?: string;
  /** Een sfeerbeeld zonder relatie tot de geprofileerde fysieke locatie. */
  illustrative: boolean;
  aspectRatio?: number;
}

export interface Venue {
  id: string;
  greenbookingsId: string;
  slug: string;
  name: string;
  city: string;
  province: string;
  type: string[];
  atmosphere: string[];
  eventTypes: string[];
  capacityMin: number | null;
  capacityMax: number | null;
  description: string;
  photos: MediaAsset[];
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  verifiedAt: string | null;
  active: boolean;
}

export interface Supplier {
  id: string;
  greenbookingsId: string;
  slug: string;
  name: string;
  categories: string[];
  disciplines: string[];
  description: string;
  photos: MediaAsset[];
  sourceUrl: string;
  verifiedAt: string | null;
  active: boolean;
}

export interface EventProgramItem {
  id: string;
  time?: string;
  title: string;
  description: string;
  /** Een voorbeeldprogramma is niet automatisch als pakket boekbaar. */
  illustrative: boolean;
}

export interface RecommendedVenue {
  venueId: Venue['id'];
  rank: number;
  /** Redactionele reden waarom dit concept hier tot zijn recht komt. */
  reason: string;
  lastReviewedAt: string | null;
}

export interface RecommendedSupplier {
  supplierId: Supplier['id'];
  rank: number;
  role: string;
  reason: string;
  lastReviewedAt: string | null;
}

export interface EventConcept {
  id: string;
  slug: string;
  status: PublicationStatus;
  title: string;
  teaser: string;
  proposition: string;
  category: string;
  objectives: string[];
  audiences: string[];
  feelings: Feeling[];
  guestCountMin: number | null;
  guestCountMax: number | null;
  hero: MediaAsset;
  story: string;
  uniqueElements: string[];
  exampleProgram: EventProgramItem[];
  recommendedVenues: RecommendedVenue[];
  recommendedSuppliers: RecommendedSupplier[];
  supplierRoles: string[];
  seo: { title: string; description: string; canonical?: string };
  updatedAt: string;
}

export interface ConceptPlan {
  conceptId: EventConcept['id'];
  selectedFeelings: Feeling[];
  venueId: Venue['id'] | null;
  supplierIds: Supplier['id'][];
  notes: string;
  /** Pas 'submitted' na een echte backend-aanvraag die bevestigd is. */
  status: 'draft' | 'submitted';
}

export const FEELING_LABELS: Record<Feeling, string> = {
  energie: 'Energie',
  verbinding: 'Verbinding',
  verwondering: 'Verwondering',
  rust: 'Rust',
  focus: 'Focus',
  trots: 'Trots',
};

export function editorialFeelingMatches(
  concepts: EventConcept[],
  selected: Feeling[],
  limit = 3,
): EventConcept[] {
  if (selected.length > 2) throw new Error('Selecteer maximaal twee gevoelens');
  return concepts
    .filter((concept) => concept.status === 'published')
    .map((concept, index) => ({
      concept,
      index,
      score: selected.reduce((sum, feeling) => sum + Number(concept.feelings.includes(feeling)), 0),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ concept }) => concept);
}
