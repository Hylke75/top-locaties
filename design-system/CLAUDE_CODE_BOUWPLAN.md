# TOP LOCATIES — UITVOERBAAR BOUWPLAN VOOR CLAUDE CODE

**Versie:** 1.0 — 3 november 2026  
**Hoofddocument:** `FUNCTIONEEL-ONTWERP.md`  
**Status:** te implementeren; niet verwarren met de bestaande statische ontwerpstudie

## 1. Volledige startprompt — plak dit in Claude Code

> Je bent lead product engineer, UX engineer en integratiearchitect voor **top-locaties.nl**. Bouw de bestaande goedgekeurde, eigenzinnige editorial ontwerpstudie door tot een betrouwbaar inspiratieplatform met eventconcepten, kiezen-op-gevoel, **uitsluitend aangesloten Greenbookings-locaties**, geverifieerde leveranciers en een persoonlijke eventplan-compositor.
>
> **Begin verplicht met het volledig lezen van:**
> - `CLAUDE.md` en `.claude/rules/top-locaties-ui.md`;
> - `design-system/FUNCTIONEEL-ONTWERP.md` (hele document, inclusief acceptatietests);
> - `design-system/CLAUDE_CODE_BOUWPLAN.md`;
> - `design-system/STYLE-GUIDE.md`, `COMPONENT-CONTRACTS.md`, `CONTENT-AND-PAGES.md`, `QA-CHECKLIST.md`;
> - `design-system/tokens.css`, `tokens.json`, `components.css`, `models.ts`, `styleguide.html`;
> - `dist/hupr.html`, `concept.html`, `locaties.html`, `feelings.css`, `feelings.js` en relevante assets.
>
> **Harde productregel:** publiceer, indexeer, adviseer en retourneer alleen partnerlocaties van Greenbookings. Raadpleeg de echte OpenAPI op `https://greenbookings.nl/openapi.json` en gebruik de gedocumenteerde zoekparameter `alleen_partners=true`. Verifieer de betekenis van `aangesloten` en sla een positief geverifieerde partnerstatus op. Onbekende status betekent **niet tonen**. Geef nooit fallback naar een ongefilterde bron. Dit geldt ook voor sitemap, zoekresultaten, rechtstreeks toegankelijke detailroutes en aanbevelingen.
>
> **Harde stijlnorm:** de bestaande prototypepagina's zijn geaccepteerd. Maak geen nieuwe visuele identiteit. Hergebruik exact de tokens, typografie en `tl-`-componenten; toon een screenshotvergelijking op desktop en mobiel vóór uitbreiding. Nieuwe componenten worden aan `styleguide.html` toegevoegd.
>
> **Harde waarheidsnorm:** geen fictieve actuele locatie-, leveranciers-, prijs-, capaciteit-, beschikbaarheids- of partnergegevens. Voor de productie-levende leveranciersgids eerst een rechtmatige Greenbookings-export of read-only feed laten bevestigen; onbekende endpoints niet verzinnen.
>
> **Werk in kleine, verifieerbare stappen:**
> 1. Audit codebase, huidige routes, framework, deployment, datatoegang, broncontract en documenteer in `docs/TECH-AUDIT.md`.
> 2. Leg uit wat statisch prototype is en wat productiefunctionaliteit wordt.
> 3. Maak `docs/TRACEABILITY.md` met eisen → code → test.
> 4. Voer fase 1 uit, inclusief design-system en screenshots; laat de reviewpunten zien.
> 5. Bouw fase 2–7 volgens dit bouwplan; stel alleen echt blokkerende vragen.
> 6. Bij elke fase: tests draaien, screenshotreview, data-echtheid en bereikbaarheid controleren, documentatie bijwerken.
> 7. Na elke fase rapporteren: wijzigingen, tests, screenshots, open blokkades en voorstel voor de volgende fase.
>
> **Stopmomenten:** bij niet-verifieerbare partnerfilter, ontbrekende supplier-bron voor live publicatie, ontbreken van rechten op foto's, destructieve vervanging van bestaande productie, prijs-/boekingsclaims, nieuw betaalde externe diensten of verandering van goedgekeurd ontwerp. Stel één concrete beslisvraag.
>
> Start **nu alleen met fase 0** en maak de eerste audit; ga daarna door met veilige werkzaamheden binnen het goedgekeurde kader.

---

## 2. Projectstructuur (richtinggevend; pas aan op bestaande stack)

```text
app/
  (public)/
    page                       Home / inspiratie
    eventconcepten/           Overzicht
    eventconcepten/[slug]/    Conceptdetail
    eventconcepten/op-gevoel/ Gevoelskeuze en matches
    locaties/                 Zoeken aangesloten locaties
    locaties/[slug]/          Aangesloten locatiedetail
    leveranciers/             Gecontroleerde supplier-gids
    leveranciers/[slug]/      Supplierdetail
    mijn-plan/                Persoonlijk plan
  admin/
    page, concepten, matches, locaties, leveranciers, media, data, seo, gebruikers
  api/
    concepts, venues, suppliers, admin
components/
  design/                     Header, heading, image, button, divider, label
  feelings/                   FeelingPicker, FeelingShape, FeelingMatch
  concepts/                   ConceptHero, ProgramTimeline, RoleStack
  venues/                     VenueGrid, VenueCard, VenueFilter, VenueDetail
  suppliers/                  SupplierCard, SupplierRole, SupplierDetail
  plan/                       PlanComposer, PlanSummary, ExportAction
lib/
  data/                       Source adapters, validators, partner filter
  search/                     Index, facets, ranking
  editorial/                  Content queries, publication state, matches
  auth/                       RBAC, sessions
  analytics/                  Consent-aware events
  seo/                        Metadata, sitemap, canonicals
jobs/                         Venue sync and optional supplier sync
design-system/                Source of truth for visuals and functional design
tests/                        Unit, integration, E2E, accessibility, visual
docs/                         Audits, source mapping, decisions, traceability
```

Niet noodzakelijk om bestaande file-structuur exact te vervangen. Behoud projectconventies zolang verantwoordelijkheden helder gescheiden blijven.

## 3. Taken per bouwfase

### Fase 0 — Audit en harde integratiecontracten

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| A-01 | Inspecteer aanwezige repo, routes, bouwproces, configuratie | `docs/TECH-AUDIT.md`: wat bestaat, wat werkt, wat nog mock is |
| A-02 | Open Greenbookings OpenAPI en test `alleen_partners=true` veilig | Werkelijk schema, voorbeeldrecord en bronstatus-mapping gedocumenteerd |
| A-03 | Bepaal hoe `aangesloten` verifieerbaar is | Positieve condition; fail-closed test; geen aanname over ID/velden |
| A-04 | Onderzoek supplier-feed / exportmogelijkheid | Schriftelijke blocker of daadwerkelijk broncontract; geen scrapingfallback |
| A-05 | Screenshots bestaande goedgekeurde voorbeeldpagina's | Referenties voor 1440, 390 en minstens één tweede breedte |
| A-06 | Plan architectuur rekening houdend met bestaande code | ADR met stackkeuze, syncstrategie, bronrechten en migratieplan |

### Fase 1 — Design system en gedeelde UI

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| V-01 | Importeer exact tokens en drie fontrollen | Geen nieuwe kleuren/typografiefamilies, visueel consistent |
| V-02 | Bouw Header, Footer, display-headings en buttons | Desktop en mobiel, actieve nav, keyboardfocus |
| V-03 | Maak gedeelde kaarten voor concept, venue en maker | Placeholder, hover, focus, selected en empty states |
| V-04 | Bouw FeelingPicker op basis van bestaande interactie | Max 2 gevoelens, geen doodlopende flow, 6 vaste labels |
| V-05 | Maak styleguide-blokken voor alle nieuwe componenten | `styleguide.html` toont daadwerkelijke CSS en states |
| V-06 | Visuele regressietest | Referentie-screenshots op vijf breedtes en herstel van afwijkingen |

### Fase 2 — Concepten en gevoel

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| C-01 | Datamodel concept, gevoel en programma | Types, validatie, database-migraties binnen eigen app |
| C-02 | Seed 4 redactionele **illustratieve** concepten | Expliciet gemarkeerd, geen fictieve live suppliers/venues |
| C-03 | Bouw homepage en conceptenoverzicht | Navigatie van gevoel én vrije browse, SEO/titels |
| C-04 | Bouw gevoelsmatching met gewichten en uitleg | Duidelijke ranking zonder fake AI-scores |
| C-05 | Bouw uitgebreide conceptdetailpagina | Wat/waarom/voor wie/programma/locaties/leveranciers/plan |
| C-06 | Admin CMS-draft/review/preview/publish | Geen automatische publicatie, auditlog |
| C-07 | Contentkwaliteit en toegankelijkheid | Lange teksten, geen beeld, geen match, mobiel werken |

### Fase 3 — Alleen aangesloten locaties

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| L-01 | Maak GreenbookingsVenueAdapter en schema-validator | Alleen gespecificeerde velden; gestructureerde foutafhandeling |
| L-02 | Implementeer `alleen_partners=true` bij **elke** pagina | Automatische tests op query bij alle requests |
| L-03 | Maak partner-verify / fail-closed gate | Records zonder geverifieerde aansluiting niet publiek |
| L-04 | Bouw idempotente ingest, incrementals, status en logs | Herhalen zonder duplicaten; geen bulkdeactivatie bij gedeeltelijke sync |
| L-05 | Bouw zoekindex/facets en server-side partneronly guard | Ongefilterde API-query onmogelijk; filters deelbaar |
| L-06 | Bouw locatiezoeker met visuele redactionele cards | Kaarten + aantallen uit echte partner-subset; empty/error/loading |
| L-07 | Bouw venue-detail met bronlink en conceptcontext | Alleen voor actief geverifieerde partners; anders 404/410 |
| L-08 | Sitemaps en cache invalidatie partnerstatus | Ontkoppelde locaties verdwijnen ook uit matches en index |
| L-09 | `P-01` t/m `P-10` automatiseren | Alle partner-only beveiligingstests geslaagd |

### Fase 4 — Leveranciers en curatie

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| S-01 | SupplierSourceAdapter ontwerpen zonder nep-endpoint | Interface, testfixtures, documentatie open broncontract |
| S-02 | Na toestemming: supplierfeed en bronmodel | Publieke profielen, categorie en rechten gecontroleerd |
| S-03 | Bouw supplier-overzicht en -detail | Sfeer/fotografie waar toegestaan, rollen en bronlinks |
| S-04 | Koppel concept→supplierrole→supplier met `why` | Geen ongefundeerde locatie-supplier samenwerking |
| S-05 | Bouw concept→venue curatiemodule | Alleen aangesloten locaties, matchreden + verificatie |
| S-06 | Admin kwaliteitsmonitor | Missing matches, aflopende rechten, inactieve bedrijven |

### Fase 5 — Mijn eventplan

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| P-UI-01 | Browserstaat met gegevensversie en reset | Geen login nodig, veilige lokale opslag |
| P-UI-02 | Selecteer max één locatie en meerdere makers | Bewuste vervanging, geen dubbele suppliers |
| P-UI-03 | Render planoverzicht en copy | Leesbare briefing met bronlinks, disclaimer |
| P-UI-04 | PDF optioneel bij akkoord | Net A4-document, geen reserveringsclaim, beeldrechten |
| P-UI-05 | Bewaak contextwissel en verwijderde partner | Waarschuwing in plan wanneer geselecteerde venue niet meer aangesloten is; niet presenteren als geschikte optie |
| P-UI-06 | Meet privacyvriendelijk funnel events | Geen persoonlijke invoer in analytics |

### Fase 6 — Beheer, vindbaarheid en kwaliteit

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| B-01 | Complete adminrollen en autorisatie | RBAC server-side, audit; hoofdredacteur publiceert |
| B-02 | SEO, canonicals, sitemap en redirects | Uniek per domein, alleen partners in venue-URL's |
| B-03 | Bronnenstatusdashboard en waarschuwingen | Laatste sync, aantal partnerlocaties, fouten, quarantines |
| B-04 | Copy/media-review en revision history | Redactie kan zonder code inzet en uitleg wijzigen |
| B-05 | Privacy- en cookiegedrag | Geen optionele trackers vóór toestemming |
| B-06 | Staging release review | SEO-kannibalisatie, captions, visuele samenhang |

### Fase 7 — Release en overdracht

| ID | Taak | Oplevering / Definition of Done |
|---|---|---|
| R-01 | Unit/integratie/E2E en WCAG-tests | Geen P- of F-kritieke fouten |
| R-02 | Visuele QA op alle templates en vijf viewportgroottes | Geen ongoedgekeurde stijlafwijkingen |
| R-03 | Prestaties en veilige fallback bronstoring | Doelmetingen vastgelegd, geen ongefilterde bronfallback |
| R-04 | Operationeel draaiboek en adminhandleiding | Sync, content, foutoplossing, rights, rollback |
| R-05 | Productiepublicatie na akkoord | Alleen aangesloten partners, echte leveranciers indien feed bevestigd |

## 4. Minimale end-to-end journeys als browsertests

```gherkin
Scenario: Kies op gevoel en bouw plan
  Given de bezoeker staat op de homepage
  When de bezoeker "Verbinding" selecteert
  Then de website toont inhoudelijk relevante concepten met uitleg
  When de bezoeker een concept opent
  Then ziet hij het volledige verhaal, programma, aangesloten locaties en makersrollen
  When hij een aangesloten locatie en een maker toevoegt
  Then toont Mijn plan beide met een bronlink
  When hij op "Kopieer plan" klikt
  Then bevat de kopie een bruikbare briefing zonder reserveringsbelofte

Scenario: Niet-aangesloten locatie blijft onzichtbaar
  Given een Greenbookings-venue is geen aangesloten partner
  When een bezoeker zoekt, rechtstreeks naar de slug gaat of een sitemap opent
  Then mag de venue niet in een publiek antwoord voorkomen

Scenario: Partnerstatus vervalt
  Given een venue is eerder getoond als aangesloten
  When een volledige betrouwbare sync aantoont dat de partnerstatus weg is
  Then wordt de venue gedeactiveerd in zoekindex, detailroute, conceptmatches en sitemap
  And toont een reeds gemaakt lokaal plan de venue niet langer als actief aangesloten

Scenario: Bronstoring
  Given de Greenbookings-API reageert niet
  When een sync faalt
  Then worden geen niet-partners ingeladen
  And blijven gecontroleerde bestaande partners zichtbaar volgens stale-beleid
  And krijgt de beheerder een concrete waarschuwing
```

## 5. Traceability en rapportagevorm

Voor elk ticket documenteert Claude Code:

```text
Eis-ID: P-03 / F-06 / etc.
Implementatie: pad + component/service
Bron: Greenbookings OpenAPI / eigen redactie / designkit
Tests: naam en resultaat
Screenshots: viewport + bestandsnaam
Status: TODO | IN PROGRESS | REVIEW | DONE | BLOCKED
Risico/aanname: in één zin
```

Voor elke fase een korte aftekenlijst: `gebouwd`, `visueel gecontroleerd`, `toegankelijk`, `bron correct`, `partner-only geslaagd`, `tests`, `nog open`. Bewijs gaat vóór een claim dat het gereed is.

## 6. Formeel besluitmoment voor productie

Vóór de definitieve livegang moeten minimaal drie zaken bevestigd zijn:

1. Betekenis van `alleen_partners=true` en welke bronrecords echt **aangesloten** zijn.
2. Juridisch/technisch toegestane bron voor leveranciersgegevens en te gebruiken media.
3. Wie hoofdredacteur is en wie publicatie/deployment autoriseert.

Tot dat moment mag Claude Code het ontwerp, de componenten, de editor, filters en testadapter doorbouwen. Publicatie met ongetoetste Greenbookings-data is niet toegestaan.
