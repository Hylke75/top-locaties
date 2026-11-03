# Pagina's, contentmodellen en de Greenbookings-koppeling

## 1. De belangrijkste gebruikersroute

**Ontdekking op gevoel** → **kies concept** → **begrijp de beleving** → **zie een voorbeeldprogramma** → **selecteer passende locatie** → **selecteer makers** → **stel je conceptplan samen** → **bezoek Greenbookings-profiel of vraag informatie aan**.

Andere startpaden zijn nodig: direct locaties zoeken, filteren op type evenement, bladeren door alle concepten, direct zoeken naar een leverancier.

## 2. De pagina's die ontworpen moeten kunnen worden

| Route | Vormgeving en taak | Onmisbare bouwstenen |
|---|---|---|
| `/` | Visueel manifest + ontdekking. | Photographic hero, woordmerk, editorial intro, feeling-first selector, uitgelicht concept, bouwstenen, footer. |
| `/eventconcepten` | Ideeën ontdekken. | Grote redactionele kop, gevoelselectie, categoriechips, editorial kaartoverzicht. |
| `/eventconcepten/[slug]` | Eén concept echt begrijpen. | Split hero, gevoelens, waarom, programma, venues, leveranciers, composer. |
| `/locaties` | Praktisch zoeken in Greenbookings-aanbod. | Zoekstrip, filters, asymmetrische locatiekaarten, leegresultaat, herstelactie. |
| `/locaties/[slug]` | Plaats als conceptdrager. | Authentieke beelden, sfeer, capaciteit indien bevestigd, mogelijkheden, matchende eventconcepten, leveranciers en bron. |
| `/leveranciers` | De makers vinden. | Vakgebied, filters, rol, werkvoorbeelden, leveranciersprofielen. |
| `/leveranciers/[slug]` | Expertise en profiel. | Echte informatie, relevantie voor concepten, referenties indien geverifieerd. |
| `/mijn-plan` | Samenstelling afronden. | Concept, gekozen gevoelens, locatie, makers, bewaar/kopieer/export/aanvraag. |
| `/over` | Filosofie en ecosysteem. | Top Locaties als inspiratieplatform, Greenbookings als netwerk, context van andere domeinen. |

Het bestaande prototype gebruikt nog `hupr.html`, `concept.html?concept=festival` en `locaties.html`. Een nieuwe router mag SEO-vriendelijke paden introduceren, mits oude URLs via redirects of compatibiliteit blijven werken.

## 3. Het inhoudelijke object: Eventconcept

```
id, slug, status, title, shortIntro, proposition,
category, audiences[], objective, guestCountMin?, guestCountMax?,
feelings[] (energie|verbinding|verwondering|rust|focus|trots),
heroAssetId, galleryAssetIds[], narrative, uniqueElements[],
exampleProgram[{time?, title, explanation, phase}],
venueMatches[{venueId, reason, priority, verifiedAt?}],
supplierMatches[{supplierId, role, reason, priority, verifiedAt?}],
requiredSupplierRoles[], seo{title, description}, updatedAt
```

Een eventconcept is een **bewerkt redactioneel object**, geen gegenereerd lijstje met toevallige locatiecards. Elke match heeft een `reason`. Publicatiestatus en actuele contentversies zijn nodig.

## 4. Locatie

```
id, greenbookingsId, slug, name, place, province,
address?, coordinates?, eventTypes[], vibes[],
capacityMin?, capacityMax?, spaces[], accessibility?,
facilities[], sustainability?, description, images[],
greenbookingsUrl, isActive, sourceUpdatedAt, checkedAt
```

- Alle brondata uit **één Greenbookings-registratie** halen.
- Lokale editorial `vibes`, sfeer- en concepttags apart opslaan; bronvelden niet overschrijven.
- Bij `capacityMax === null` niet veronderstellen dat iedere groepsgrootte past.
- Status `onbekend` voor niet-bevestigde prijzen, bereikbaarheid, beschikbaarheid en faciliteiten.
- Wijzigingen op Greenbookings doorsynchroniseren, verwijderde profielen niet blijven tonen.

## 5. Leverancier

```
id, greenbookingsId, slug, name, category, disciplines[],
services[], region?, description, images[],
profileUrl, verifiedAt, isActive
```

Een leverancier kan meerdere rollen vervullen in verschillende concepten. De rol in een `supplierMatch` is **contextueel**: een AV-partner kan bij het ene concept optreden als lichtregisseur en bij het andere als podiumtechniek.

## 6. Emoties, gewichten en uitlegbare matches

Bij de eerste versie is een eenvoudige, redactionele koppeling voldoende:

| Gevoel | Korte verklaring | Voorbeeldmatch |
|---|---|---|
| Energie | Gasten gaan met nieuwe zin naar huis. | Het festival van morgen. |
| Verbinding | Gasten voelen zich werkelijk verbonden. | Het diner dat verbindt. |
| Verwondering | Iets onverwachts maakt indruk. | Nacht van verwondering. |
| Rust | Er ontstaat ruimte voor aandacht. | Het diner dat verbindt. |
| Focus | Er komt een richting of beslissing uit. | De dag vol nieuwe ideeën. |
| Trots | Samen vieren en erkennen. | Nacht van verwondering. |

De gebruiker kiest maximaal twee gevoelens. Ranking: primair aantal gekozen gevoelens dat bij het concept past; secundair redactionele prioriteit en diversiteit. Toon uitleg: `Past bij verbinding en rust omdat...` en maak de match **geen schijnbaar exacte AI-score**. Later kan het algoritme door gebruikersfeedback worden gekalibreerd.

## 7. Redactionele kwaliteit en SEO

- Een landingspagina voor elke betekenisvolle combinatie (`eventconcept + doel`, `eventconcept + stad`) alleen publiceren als deze uniek nuttige content biedt. Geen programmatic SEO met vrijwel identieke tekst over vier domeinen.
- Een canonieke URL per locatieprofiel of duidelijke onderscheidende context; Top Locaties vertelt het **waarom bij een concept**, Greenbookings beheert de bronvermelding.
- Structured data alleen waar toepasselijk en waar feiten kloppen. Claim geen reviews, prijzen of aanbiedingen die niet verifieerbaar zijn.
- Bij foto's: rights, alternatieve tekst, credit, echte/illustratieve status.
- Filters via URL als navigatie/terugtoets dat verbetert; zorg dat crawlers een bruikbare basispagina zien.
- Titels en metaomschrijvingen uniek per concept en per unieke editorial landingspagina.

## 8. API en synchronisatie

Aanbevolen route bij een gekoppelde Greenbookings database:

1. Lees locaties en leveranciers via een geauthenticeerde, read-only API / gecontroleerde databaseview. Vraag Claude vooraf welke omgeving hiervoor beschikbaar is.
2. Sla brondata, `sourceUpdatedAt`, interne IDs en externe profiel-URL's op in een read-optimized laag.
3. Voeg in een aparte editorial collectie gevoelentags, sfeer, matchredenen en gepubliceerde concepten toe.
4. Verwerk wijzigingen idempotent; markeer verdwenen locaties als inactief en verwijder ze uit publieke aanbevelingen.
5. Maak een beheerscherm voor concepten en matches met preview en publicatiestatus.
6. Vang API-fouten zichtbaar op, met een nette terugval die geen onjuiste 'beschikbaar'-claims doet.

Eerst **beschikbare Greenbookings API/schema controleren**; geen endpoint, token, tabelnaam of koppeling verzinnen. De referentie-HTML bevat handmatige voorbeelddata en is geen bewijs van een werkende koppeling.

## 9. Functionele states per flow

| Flow | Succes | Nulresultaat | Fout |
|---|---|---|---|
| Gevoelkeuze | 3 verklaarde conceptmatches | Toon alternatieven en 'bekijk alles' | Geen crash; basiscatalogus. |
| Locatiezoeker | Aantal + kaarten + filters | Heldere melding + resetknop | Storing benoemen, opnieuw proberen. |
| Leveranciers | Rolvermeldingen + bronprofiel | Andere categorieën voorstellen | Foutstatus + contactmogelijkheid. |
| Conceptcomposer | Geselecteerde combinaties en kopieeractie | Verzoek om locatie/maker te kiezen | Kopiëren mislukt? Selecteerbare tekst als fallback. |

## 10. Schrijfregels per type pagina

Homepage = 80% verlangen, 20% bewijs.  
Conceptdetail = 40% inspiratie, 60% toepasbaarheid.  
Locatiezoeker = 20% sfeer, 80% efficiënt zoeken.  
Leveranciers = 30% verhalen, 70% vakinhoud en vertrouwen.  
Composer = 10% sfeer, 90% duidelijkheid en voortgang.

Dit zijn ontwerpverhoudingen, geen meetdata.
