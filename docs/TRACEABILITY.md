# Traceability — eis → implementatie → test

Status: DONE · REVIEW (werkt, wacht op extern besluit) · BLOCKED (extern nodig)

| Eis | Implementatie | Test | Status | Risico / aanname |
|---|---|---|---|---|
| FO §0.4 / L-02/L-03 — alleen aangesloten partners, fail-closed | `src/lib/data.mjs` `isPublishablePartner()`; alle pagina's gebruiken `data.venues` | `tests/rules.test.mjs` (poort, sitemap, routes, matches); flows: 61 resultaten, Graanfabriek afwezig, 404 | DONE | Partnerdefinitie = DB-kolom `aangesloten`; API-semantiek nog te bevestigen |
| L-04 — idempotente sync, geen massale depublicatie | `scripts/sync/greenbookings.mjs` (upsert op slug, hash, 70%-drempel, quarantaine, checkpoint-detectie) | `tests/sync.test.mjs`; dry-run faalt veilig op 429 | REVIEW | Bron nu onbereikbaar (Vercel-checkpoint) |
| L-08 — sitemap en index alleen partners | `scripts/build.mjs` sitemap uit `data.venues` | `tests/rules.test.mjs` | DONE | — |
| P-UI-05 — vervallen partner in plan | `src/client/plan.js`, `concept.js` filteren onbekende venue-id's | flows: waarschuwing in Mijn plan | DONE | — |
| FO §7.2 — max 2 gevoelens, derde vervangt oudste, melding, URL-state | `src/client/lib/rank.js` `toggleFeeling`, `compass.js` | unit + flows (notice, `?gevoel=`) | DONE | — |
| FO §7.3 — gewogen match, uitleg, geen score, altijd 3 | `rankConcepts`, `explainMatch`, `feelingWeights` in `concepts.json` | unit + flows (Verbinding+Rust → diner; Verwondering+Trots → nacht) | DONE | — |
| C-03/C-05 — overzicht en conceptdetail | `src/pages/more.mjs`, `concept.mjs` | flows, screenshots | DONE | Programma's zijn voorbeeld |
| L-06/L-07 — zoeker en detail | `locaties.mjs`, `finder.js`, `renderVenueDetail` | flows (filters, URL, leeg, sort, regio, deeplink), screenshots | DONE | — |
| S-03 — leveranciers | `renderSuppliers`, `renderSupplierDetail` | flows | REVIEW | Volledige gids BLOCKED tot er een bevestigde feed is |
| P-UI-01..03 — plan | `concept.js`, `plan.js` (localStorage, kopiëren, fallback-tekst) | flows (kies, kopieer, herlaad, verwijder) | DONE | PDF (P-UI-04) niet gebouwd |
| C-06/B-01/B-04 — beheer: draft/review/publish, RBAC, audit, revisies | `scripts/admin.mjs`, `admin/` | `scripts/admin-e2e.mjs` 18/18 | DONE | Draait lokaal/intern; geen publieke admin |
| B-02 — SEO: unieke titel/description/canonical, redirects | `layout.mjs`, `validate-content.mjs` (uniciteit), `vercel.json` | validatie + build | DONE | Productiedomein nog niet gekoppeld |
| B-03 — bronstatus in beheer | admin "Data & publicatie" (snapshot-meta, synclog) | admin-e2e | DONE | — |
| B-05 — geen trackers zonder toestemming | Geen analytics of trackers opgenomen | code-inspectie | DONE | Funnelmeting (P-UI-06) bewust nog niet ingebouwd |
| V-01..V-06 — design system en visuele regressie | `design-system/` v1.1, `styleguide.html` §10–12 | `scripts/screenshots.mjs` (16 routes × 5 breedtes), `check-design.mjs` | DONE | Visuele vergelijking door mij beoordeeld, geen pixeldiff-tool |
| Toegankelijkheid | Native knoppen, `aria-pressed`/`expanded`, live regions, skip-link, focusringen, 44px-targets | flows (toetsenbord, touch targets) | REVIEW | Test met een echte screenreader staat open |
| R-05 — productiepublicatie | — | — | BLOCKED | Wacht op de beslispunten in TECH-AUDIT §6 |
