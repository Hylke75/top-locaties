# Top Locaties — technische audit, architectuur en datastatus

**Datum:** 3 november 2026 · **Branch:** `claude/new-session-2z5cs1` · Bouwplan-fase 0 t/m 6 (release-akkoord in fase 7 staat open, zie §6).

## 1. Uitgangssituatie (fase 0, A-01)

| Onderwerp | Bevinding |
|---|---|
| Repository `hylke75/top-locaties` | Was leeg. Het ontwerppakket (designkit v1) is het startpunt. |
| Prototype `dist/` | Buildless HTML/JS met hardcoded voorbeelddata en afwijkende kleuren per pagina. Blijft onaangeroerd en staat ter vergelijking op `/prototype/`. |
| Vercel | Project **`top-locaties`** bestaat, leeg (geen deployments). Project **`greenbookings`** = Next.js, live op greenbookings.nl, achter een Vercel Security Checkpoint. |
| Supabase | Project **`greenbookings`** bevat de bron (`locaties`, `locatie_media`, `ruimtes`, `organisaties`, `leverancier_profielen`, …). Project **`top-locaties`** bestaat, zonder tabellen. |

## 2. Broncontract Greenbookings (A-02 t/m A-04)

- **API** (`/api/v1/locaties?alleen_partners=true`, `/openapi.json`, gedocumenteerd in het FO §2.2): vanuit deze omgeving **niet bereikbaar**. Scripts krijgen HTTP 429 van de Vercel-checkpoint. De OpenAPI en de exacte betekenis van `alleen_partners` kon ik daardoor **niet zelf verifiëren**.
- **Database (read-only onderzocht):** `public.locaties.status ∈ {concept, gepubliceerd, verborgen, geblokkeerd}` en de boolean `aangesloten`. Op 03-11-2026: 3.226 gepubliceerd, waarvan **61 gepubliceerd én aangesloten**.
- **Gekozen partnerregel (fail-closed):** een locatie is publiek als, en alleen als, `status = 'gepubliceerd'` **en** `aangesloten === true`. Ontbrekend, `null`, `"true"`, `1` of `false` betekent niet tonen (`isPublishablePartner()` in `src/lib/data.mjs`, getest in `tests/rules.test.mjs`).
- **Leveranciers (bevestigd 03-11-2026):** de leveranciers van Top Locaties zijn de Greenbookings-partners: `organisaties.type = 'leverancier'` **en** `aangesloten = true`, `status = 'actief'`, `is_test = false`. Dat zijn er 16. JB Productions en Flitz-Events uit het prototype zijn geen partner en zijn verwijderd (`isPublishableSupplier()`).
- **Gevoelige kolommen:** in dezelfde tabel staan o.a. `chatbot_api_sleutel`, `mice_api_key`, `contactmail` en `telefoon`. De snapshotquery (`scripts/sync/greenbookings-snapshot.sql`) selecteert alleen publieke velden; de API-sync normaliseert naar een vaste veldenlijst.

## 3. Architectuur (A-06, ADR)

**Besluit:** een afhankelijkheidsvrije statische generator in Node (`npm run build` → `site/`), plus een lokale beheerserver (`npm run admin`).

**Waarom:**
- Er was geen bestaande stack.
- Statische output is snel, veilig en indexeerbaar, en draait op elke host (`vercel.json` staat klaar).
- Partner-only is als build-invariant af te dwingen: wat niet gebouwd wordt, kan ook niet uitlekken via een route, sitemap of API.
- De templates zijn pure functies over JSON. Daardoor zijn ze 1-op-1 over te zetten naar Next.js/Supabase (de Greenbookings-stack) zodra live data nodig is.

**Gevolg:** wijzigingen worden zichtbaar na *valideren → bouwen → deployen*. Een redacteur doet dat vanuit het beheer (de hoofdredacteur bouwt).

```
src/content/   greenbookings-snapshot.json (bron, read-only) · venues/suppliers.editorial.json · concepts.json · feelings.json · audit-log.jsonl
src/lib/       data.mjs (merge + partnerpoort) · html.mjs
src/templates/ components.mjs (gedeelde componenten) · layout.mjs
src/pages/     home · concept · locaties · more (overzicht, op-gevoel, locatiedetail, leveranciers, plan, over) · legacy
src/client/    compass · home · concept · finder · overview · suppliers · plan · nav · lib/{rank,store}
scripts/       build · serve · validate-content · admin · admin-e2e · flows · screenshots · sync/greenbookings(.mjs|.sql)
admin/         beheerinterface (alleen via scripts/admin.mjs)
tests/         rules.test.mjs · sync.test.mjs
```

## 4. Routes

| Route | Inhoud | Index |
|---|---|---|
| `/` | Posterhero, intro, gevoelskompas, conceptcarrousel, bouwstenen, ecosysteem | ja |
| `/eventconcepten/` | Overzicht met filters op type en gevoel, plus het kompas | ja |
| `/eventconcepten/op-gevoel/` | Kompas als hoofdpagina, met uitleg van de matching | ja |
| `/eventconcepten/{slug}/` | 4 concepten: verhaal, gevoelsignatuur, voor wie, programma (VOORBEELD), 3 partnerlocaties met reden, rollen + makers, composer | ja |
| `/locaties/` | Alle 61 partners: zoeken, filters (regio, gasten, type, karakter, concept), sorteren, beeld/regio, lege/fout-staat, filters in de URL | ja |
| `/locaties/{slug}/` | 61 detailpagina's, alleen voor partners. Niet-partners geven 404 | ja |
| `/leveranciers/`, `/leveranciers/{slug}/` | Voorlopige selectie met rol per concept | ja |
| `/mijn-plan/` | Plannen uit de browser; waarschuwing als een partner vervalt | noindex |
| `/over/` | Filosofie, ecosysteem, spelregels | ja |
| `/styleguide/`, `/prototype/` | Design-referentie | noindex / disallow |
| `/hupr.html`, `/concept.html?concept=x`, `/locaties.html` | Doorverwijzing naar de nieuwe routes | noindex |

## 5. Wat is echt, wat is redactie, wat is voorbeeld

| Gegeven | Status |
|---|---|
| Locaties (61): naam, plaats, provincie, type, sfeer, capaciteit, hoofdfoto, bijgewerkt-datum | **Echt — volledige partner-snapshot 03-11-2026** uit de Greenbookings-database. Handmatige snapshot, geen live koppeling; vervang die met `npm run sync` zodra de API bereikbaar is. |
| Foto's | Uitsluitend hoofdfoto's uit Greenbookings (`locatie-media`), gelabeld *BEELD: GREENBOOKINGS-PROFIEL*. Placeholderfoto's uit de bron worden niet getoond: dan verschijnt de `tl-placeholder`. De Unsplash-sfeerbeelden uit het prototype zijn verwijderd. *Gebruiksrecht bevestigd door de opdrachtgever (03-11-2026).* Extra, speciaal voor Top Locaties bedoelde informatie op aangesloten profielen volgt later in Greenbookings. |
| Locatieredactie (14 gecureerd) | Eigen label, korte tekst en filtertaxonomie. Alleen controleerbare formuleringen, nog niet nagelezen (`editorialCheckedAt: null`). De andere 47 partners tonen alleen bronfeiten. |
| Concepten, gevoelsgewichten, matchredenen, rollen | Redactioneel. Programma's gelabeld VOORBEELD, groepsgrootte "indicatief". |
| Leveranciers (16 partners) | Naam, categorie, plaats, tagline, website en hoofdfoto echt (bron). Profiellinks `greenbookings.nl/partners/{slug}` volgen het prototypepatroon en zijn niet automatisch te controleren (checkpoint). |
| Prijs, beschikbaarheid, boeking | Worden nergens getoond. |

## 6. Besluiten en open punten

**Bevestigd door de opdrachtgever (03-11-2026):**
1. `aangesloten = true` in de database is de juiste partnerdefinitie.
2. Greenbookings-foto's mogen op top-locaties.nl.
3. Leveranciers zijn de aangesloten Greenbookings-leverancierspartners.
4. Hoofdredacteur: hylke@greenbookings.nl. Het account staat als scrypt-hash in `.admin/users.json` (niet in git); zie README.
5. Deployment naar het Vercel-project `top-locaties` (productie: top-locaties.vercel.app).

**Complete concepten (03-11-2026):** 6 concepten (o.a. *De vergadering die werkt* en *De teamdag buiten*). Elk concept heeft:
- het programma met een pop-up per onderdeel;
- een minuut-tot-minuutdraaiboek en een aftelplanning;
- een cateringvoorstel en entertainment;
- bezetting, ruimtes, checklist, varianten en plan B;
- kostenposten (zonder bedragen), duurzaamheid, evaluatie en een uitnodiging.

Daaronder staat een vragenlijst op maat (12 vragen). Die levert:
- het draaiboek op de eigen starttijd en een planning met echte data;
- catering en bezetting voor de groep, met een capaciteitscheck;
- offerteaanvragen per locatie en maker, een callsheet en een begroting (CSV);
- een print/PDF-versie.

De gids *Zo regel je het zelf* (`/zelf-organiseren/`) dekt de taken van een eventbureau af (bronnen: gemeenten/Ondernemersplein). Alles is bewerkbaar in het beheer; `validate-content.mjs` blokkeert publicatie van een onvolledig concept.

**Contact met locaties:** de contact-pop-up op elke locatiepagina is gemodelleerd naar `public.contactberichten` (naam, e-mail, datum, aantal, bericht, `bron = 'top-locaties'`). Zolang `src/content/site.json → contact.endpoint` leeg is, kopieert de bezoeker het bericht en rondt hij af in het contactformulier op het Greenbookings-profiel. Rechtstreeks versturen vraagt een bevestigde contactroute van Greenbookings.

**API-sleutel:** ontvangen; alleen te gebruiken via de omgevingsvariabele `GREENBOOKINGS_API_KEY`, nooit in de repository. Getest: de Vercel-firewall van greenbookings.nl stuurt een *challenge* (HTTP 429) vóórdat de sleutel de app bereikt.

**Nog open:**
- **Firewall-bypass:** een bypass-regel in het Vercel-project `greenbookings` (Firewall) voor `/api/v1/*` maakt de automatische partnersync én het rechtstreeks versturen van contactberichten mogelijk.
- **Contactroute:** welk endpoint in de Greenbookings-app schrijft naar `contactberichten` (en mailt de locatie)? Dat endpoint vul je in `site.json` in.
- **API-toegang:** de Vercel-checkpoint blokkeert server-side sync van `/api/v1/*`. Een bypass of een read-only Supabase-view is nodig voor automatische verversing. Tot die tijd wordt de snapshot handmatig ververst.
- **Eigen domein:** top-locaties.nl is nog niet aan het Vercel-project gekoppeld.
- **Beheer online:** het beheer draait lokaal of intern (`npm run admin`) en is bewust niet in de publieke deployment opgenomen.

## 7. Bewuste correcties t.o.v. het prototype

- Canonieke tokens op alle pagina's.
- Geen modals.
- Capaciteitsfilter telt onbekend apart.
- Verkeerde of verzonnen profiellinks en capaciteiten zijn vervangen door bronwaarden.
- Bugfix: de CSS-reset gebruikt nu `:where()`, zodat componenten hun eigen font en kleur houden.
- Partner-only: 7 van de 10 prototype-locaties waren géén aangesloten partner en zijn verwijderd. De conceptmatches zijn opnieuw gecureerd uit de partnerset.

## 8. QA-resultaten

Zie `docs/TRACEABILITY.md` voor eis → code → test. Samenvatting van de laatste run:

- `npm test`: 12/12 unit- en integratietests (partnerpoort, sitemap/routes zonder niet-partners, matching, sync-normalisatie).
- `node scripts/flows.mjs`: alle functionele browserflows geslaagd (gevoel → concept → plan, zoeker, nieuwe pagina's, 404 voor niet-partner, vervallen partner in plan, mobiel menu/filter, toetsenbord, oude URL's).
- `node scripts/admin-e2e.mjs`: 18/18 beheercontroles (rollen, CSRF, publicatieblokkade bij onvolledige content, alleen partners in keuzelijsten, build, preview, audit, 390 px).
- `npm run screenshots`: 16 routes × 5 breedtes (1440/1024/768/390/360). 0 px horizontale overflow, geen JS-fouten. Referentieset 1440/390 staat in `docs/screenshots/`.
- Design-audit `check-design.mjs`: 0 signalen.
- **Niet gedaan:** Lighthouse/CWV op echte hosting, test met een echte screenreader, handmatige controle van externe links in een gewone browser (checkpoint).
