-- TOP LOCATIES — LOGISCH SQL REFERENTIEMODEL v1
-- Doel: technische bouwreferentie bij FUNCTIONEEL-ONTWERP.md.
-- NIET direct uitvoeren op de bestaande Greenbookings-productiedatabase.
-- Alleen toepassen in een bewust gekozen NIEUWE app-database na audit, review,
-- beveiligingsbeleid, migratieplan en keuze van de bestaande stack.
-- Alle gepubliceerde locaties moeten actieve, geverifieerde aangesloten partners zijn.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE feelings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  shape_token text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  eyebrow text NOT NULL DEFAULT '',
  intro text NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  duration_label text,
  category text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'archived')),
  featured_rank integer CHECK (featured_rank >= 0),
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE concept_feelings (
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  feeling_id uuid NOT NULL REFERENCES feelings(id) ON DELETE RESTRICT,
  weight smallint NOT NULL CHECK (weight BETWEEN 0 AND 5),
  editorial_explanation text NOT NULL DEFAULT '',
  PRIMARY KEY (concept_id, feeling_id)
);

CREATE TABLE concept_program_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  duration_label text,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  illustrative boolean NOT NULL DEFAULT true,
  UNIQUE (concept_id, position)
);

CREATE TABLE concept_supplier_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  role_code text NOT NULL,
  label text NOT NULL,
  why_needed text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  UNIQUE (concept_id, role_code),
  UNIQUE (id, concept_id)
);

CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT 'greenbookings',
  source_id text NOT NULL,
  source_slug text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text,
  province text,
  source_url text NOT NULL,
  description_from_source text,
  atmosphere text[] NOT NULL DEFAULT '{}',
  types text[] NOT NULL DEFAULT '{}',
  facilities text[] NOT NULL DEFAULT '{}',
  capacity_min integer CHECK (capacity_min >= 0),
  capacity_max integer CHECK (capacity_max >= 0),
  source_status text NOT NULL DEFAULT 'quarantined'
    CHECK (source_status IN ('active', 'inactive', 'quarantined')),
  -- False by default: fail-closed. Verifiëren op officieel partnerbroncontract.
  partner_verified boolean NOT NULL DEFAULT false,
  partner_verified_at timestamptz,
  partner_evidence text,
  last_seen_at timestamptz,
  last_synced_at timestamptz,
  source_updated_at timestamptz,
  source_hash text,
  source_payload jsonb,
  editorial_intro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_system, source_id),
  UNIQUE (source_system, source_slug),
  CHECK (capacity_min IS NULL OR capacity_max IS NULL OR capacity_max >= capacity_min),
  CHECK (NOT partner_verified OR partner_verified_at IS NOT NULL)
);

CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL DEFAULT 'greenbookings',
  source_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description_from_source text,
  editorial_intro text,
  categories text[] NOT NULL DEFAULT '{}',
  service_regions text[] NOT NULL DEFAULT '{}',
  listing_kind text NOT NULL DEFAULT 'supplier'
    CHECK (listing_kind IN ('supplier', 'sponsor', 'media_partner', 'knowledge_partner', 'other')),
  source_url text NOT NULL,
  publicly_displayable boolean NOT NULL DEFAULT false,
  source_status text NOT NULL DEFAULT 'quarantined'
    CHECK (source_status IN ('active', 'inactive', 'quarantined')),
  last_seen_at timestamptz,
  last_synced_at timestamptz,
  source_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_system, source_id)
);

CREATE TABLE concept_venue_matches (
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
  why text NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  verified_at timestamptz,
  PRIMARY KEY (concept_id, venue_id)
);

CREATE TABLE concept_supplier_matches (
  concept_id uuid NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  role_id uuid NOT NULL,
  why text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  verified_at timestamptz,
  PRIMARY KEY (concept_id, supplier_id, role_id),
  FOREIGN KEY (role_id, concept_id)
    REFERENCES concept_supplier_roles(id, concept_id) ON DELETE CASCADE
);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind text NOT NULL CHECK (owner_kind IN ('concept', 'venue', 'supplier', 'editorial')),
  owner_id uuid,
  source_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  credit text,
  illustrative boolean NOT NULL DEFAULT false,
  rights_status text NOT NULL DEFAULT 'unverified'
    CHECK (rights_status IN ('unverified', 'approved', 'expired', 'rejected')),
  rights_note text,
  rights_verified_at timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_kind = 'editorial' OR owner_id IS NOT NULL)
);

CREATE TABLE sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_kind text NOT NULL CHECK (source_kind IN ('greenbookings_venues', 'greenbookings_suppliers')),
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'success', 'partial', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  fetched_count integer NOT NULL DEFAULT 0,
  accepted_count integer NOT NULL DEFAULT 0,
  excluded_count integer NOT NULL DEFAULT 0,
  changed_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text
);

CREATE TABLE sync_run_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL REFERENCES sync_runs(id) ON DELETE CASCADE,
  source_record_id text,
  error_code text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_memberships (
  user_id uuid PRIMARY KEY,
  role text NOT NULL
    CHECK (role IN ('editor', 'chief_editor', 'data_manager', 'platform_admin')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE editorial_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_kind text NOT NULL CHECK (entity_kind IN ('concept', 'venue_editorial', 'supplier_editorial', 'match')),
  entity_id uuid NOT NULL,
  author_user_id uuid,
  action text NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Niet aanmaken voor release 1 zonder gebruikersaccounts en privacyontwerp:
-- saved_plans(owner_id, concept_id, selected_venue_id, selected_supplier_ids,
--             notes, share_token_hash, expires_at, created_at, updated_at)

CREATE INDEX idx_concepts_status_published ON concepts (status, published_at DESC);
CREATE INDEX idx_concept_feelings_feeling ON concept_feelings (feeling_id, weight DESC);
CREATE INDEX idx_concept_program_concept ON concept_program_items (concept_id, position);
CREATE INDEX idx_venues_partner_state ON venues (partner_verified, source_status, province, city);
CREATE INDEX idx_venues_source_last_seen ON venues (source_system, last_seen_at);
CREATE INDEX idx_venues_name_search ON venues (lower(name));
CREATE INDEX idx_venues_facilities_gin ON venues USING gin (facilities);
CREATE INDEX idx_venues_atmosphere_gin ON venues USING gin (atmosphere);
CREATE INDEX idx_suppliers_public_state ON suppliers (publicly_displayable, source_status, listing_kind);
CREATE INDEX idx_suppliers_categories_gin ON suppliers USING gin (categories);
CREATE INDEX idx_venue_matches_venue ON concept_venue_matches (venue_id);
CREATE INDEX idx_supplier_matches_supplier ON concept_supplier_matches (supplier_id);
CREATE INDEX idx_sync_runs_started ON sync_runs (source_kind, started_at DESC);

-- Een publieke query mag NOOIT 'SELECT * FROM venues' gebruiken.
-- Deze view is het MINIMALE veilige toegangspunt voor locatiepresentatie.
-- Aanvullend in de applicatie server-side autorisatie en publiceerbaarheid toetsen.
CREATE VIEW public_partner_venues AS
SELECT
  id, slug, name, city, province, source_url,
  description_from_source, editorial_intro,
  atmosphere, types, facilities, capacity_min, capacity_max,
  last_synced_at
FROM venues
WHERE source_status = 'active'
  AND partner_verified = true;

CREATE VIEW public_supplier_profiles AS
SELECT
  id, slug, name, description_from_source, editorial_intro,
  categories, service_regions, listing_kind, source_url
FROM suppliers
WHERE source_status = 'active'
  AND publicly_displayable = true
  AND listing_kind = 'supplier';

-- VEILIGHEIDSOPMERKING:
-- 1. Views volgen standaard de privileges van hun eigenaar; bepaal security_invoker
--    en SELECT-grants expliciet na vaststelling van PostgreSQL-versie / Supabase-setup.
-- 2. Zet RLS aan en schrijf aparte policies voor concepten, redactie, bronrecords
--    en admin, gebaseerd op server-side sessie en admin_memberships.
-- 3. Geef de anonieme rol geen write-rechten op deze tabellen en geen read-rechten
--    op ruwe source_payload, admin_memberships, revisions en sync error logs.
-- 4. Laat public-facing matching en sitemaps uitsluitend via de partner-view lopen.
-- 5. Een wijziging in partnerstatus moet alle caches en zoekindexen invalidateren.
-- 6. Dit SQL-bestand is een REFERENTIE: schrijf echte, versiebeheerste migrations
--    na audit en test de partner-only invariants in de applicatielaag.
