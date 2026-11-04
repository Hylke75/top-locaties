# Componentcontracten — exacte hergebruikregels

Component-CSS heeft het prefix `tl-` zodat deze naast de oudere prototypeklassen kan bestaan. Bij migratie mag een ontwikkelaar de structuur naar React, Vue of een andere stack vertalen; **de output, states, afmetingen en stijl blijven gelijk**.

## A. Basis

| Component | Klasse / element | Visuele regel | Functionele states |
|---|---|---|---|
| Merkwoord | `.tl-wordmark` | 2 regels Archivo Black + roze `✳` | Link naar homepage, zichtbare focus. |
| Topnavigatie | `.tl-header` | Dunne onderlijn, horizontale links, zwarte CTA | Actief, hover, focus, mobiel menu indien nodig. |
| Overline | `.tl-overline` | DM Mono, 11 px, gespreide nummering, lijn onder | Geen interactieve state. |
| Grote kop | `.tl-display`, `--xl` etc | Archivo Black, uppercase, `-.075em` | Mobiele afbreking handmatig verifiëren. |
| Lopende tekst | `.tl-body` | DM Sans, smalle kolom | Normale tekstselectie en zoom. |
| Body-meta | `.tl-mono` | DM Mono, uppercase | Langere labels niet afbreken midden in woord. |
| CTA primair | `.tl-button` | Inktvlak, witte tekst, scherpe hoeken | Hover koraal; focus blauw; disabled zichtbaar. |
| CTA accent | `.tl-button--accent` | Koraalvlak + inkttekst | Hover inkt/wit; focus. |
| Cirkelpijl | `.tl-round-link` | Grote ronde enkelvoudige pijl | Hover draaien/omgekeerd; reduced motion. |
| Chip | `.tl-chip` | Vierkante 1-px omlijning | Niet interactief tenzij button. |

## B. Emotionele inspiratie

### `FeelingChoice`

- `button` met `aria-pressed="true/false"` en naam + toelichting.
- `1–2` gevoelens selecteren; een derde keuze vervangt de oudste óf krijgt een expliciete fout (op huidige site vervangt deze de oudste). Gebruik één consistent model.
- Elk gevoel heeft een vastgesteld kleuraccent, maar de basiscomponent behoudt papier/inkt/roze-karakter.
- Bij geselecteerde staat: donkere achtergrond, witte kop, prominente vorm; focusring blijft afzonderlijk zichtbaar.
- Toetsenbord: Tab, Space, Enter; de selectie is volledig gelijkwaardig aan muis/touch.
- Voelbare keuzes: **Energie, Verbinding, Verwondering, Rust, Focus, Trots**. Geen nieuwe zonder redactiekeuze.

### `FeelingMatch`

- Toont rangnummer, conceptnaam, **waarom deze gevoelens matchen**, link naar volledig concept.
- Beste match: kobaltblauw met witte tekst; volgende matches op papier.
- Rangschikking gebruikt expliciete concept→gevoel-mapping; gebruikers zien de grond van de match. Als niets matcht, toon alternatieven, niet een lege pagina.
- Geen misleidende percentages (`98% match`) zonder gevalideerde berekening.

## C. Eventconcepten

### `ConceptFeatured`

- Groot sfeerbeeld naast editorial typografie; categorie, nummer, beschrijving, tags.
- Klik op afbeelding of expliciete `BEKIJK HET CONCEPT ↗` naar volwaardige detailpagina.
- Carrousel `← →`, zichtbare positie `01 / 04`, filter op typologie.
- Geen extra modal voor het hele concept. Een concept heeft meerdere secties.

### `ConceptDetail`

Volgorde is vast:

1. Hero met naam, één-zinsbelofte, categorie, indicatie groepsgrootte en sfeerfoto.
2. Vaste compacte gevoelsignatuur van 2–3 woorden en link terug naar gevoelskompas.
3. Het idee: waarom en voor wie, kernwaarden en ervaren resultaat.
4. Voorbeeldprogramma/tijdlijn met minstens vier betekenisvolle onderdelen.
5. Aanbevolen **Greenbookings-locaties**: 2–4, redactionele match per locatie.
6. Benodigde **leveranciers**: rollen én concrete partnervermeldingen waar bekend.
7. 'Maak jouw plan': gekozen locatie + leveranciers + kopieer-/bewaaractie.
8. Volgende concepten of back link.

Elk fictief programma draagt `VOORBEELD`-label; beschikbaarheid en pakkettarieven zonder bron nooit invullen.

## D. Locaties en leveranciers

### `VenueCard`

- Vierkante of rechthoekige afbeelding, 1px border, duidelijke plaatsnaam, displaytitel.
- Toont sfeer/type, korte beschrijving, **waarom passend voor dit concept** en feitelijke metadata.
- CTA's: `KIES DEZE PLEK` / `BEKIJK DE LOCATIE ↗`.
- Geselecteerde state: roze contour (niet alleen kleur; ook tekst `GEKOZEN ✓`).
- Niet-geverifieerde capaciteit: `CAPACITEIT OP AANVRAAG` (nooit `null` tonen).
- Bronlink opent juiste Greenbookings-profiel; `rel="noopener noreferrer"` bij `target="_blank"`.
- In catalogusvariant: 2-koloms editorial kaart met subtiel hoogteverschil.

### `SupplierCard`

- Categorielabel, typografisch symbool, naam, *concrete rol in dit concept*, toelichting.
- Acties: `VOEG TOE` / `GEKOZEN ✓` en `BEKIJK LEVERANCIER ↗`.
- Cards kunnen compact zijn: ze dragen een functionele rol, niet nog een volledige fotoposter.
- Alleen echt bestaande profielen koppelen; geen impliciete garantie voor samenwerking.

### `FilterPanel` en `SearchStrip`

- Zoekstrip op lichte achtergrond met scherp offset-schaduwvlak (9px 9px inkt) en koraalzoekknop.
- Desktop catalogus: linkerzijfilter, rechterresultaten; mobiel expliciet open/dicht filterpaneel.
- Filtersoorten: regio, aantal personen, eventtype, karakter, gekoppeld concept.
- Toon aantal resultaten, zichtbare actieve filters, sortering, `RESET ALLES` en lege staat.
- Capaciteitsfilter mag onbekende capaciteit **niet** automatisch als geschikt beschouwen voor een gevraagde omvang; markeer als onbekend of toon apart.
- Voorkom verwarring tussen `t/m 50` en `minimaal 50`. Filterdefinities moeten exact kloppen.
- Kaart-/overzichtsvolgorde stabiel, behoud filterstatus bij terugnavigatie waar mogelijk.

## E. Planbouw

### `ConceptComposer`

- Laat concept, gekozen locatie, geselecteerde leveranciers en gewenste gevoelens zien.
- Eén locatie tegelijk; meerdere leveranciers mogelijk.
- `KOPIEER MIJN PLAN` levert begrijpelijke Nederlandse platte tekst. Optionele export/aanvraag volgt later.
- Behoud keuzes na navigatie indien dat expliciet wordt geïmplementeerd (URL state of client storage, transparant aangegeven).
- Geen bevestiging van reservering of beschikbaarheid zonder echte boekingsworkflow.

## F. States, toegankelijkheid en layout

Elke component met data krijgt: `loading`, `empty`, `error`, `success` of `selected` waar relevant. Een stil lege ruimte is geen state. Respecteer `prefers-reduced-motion`. Alle icon-only buttons hebben een toegankelijke naam. Alle relevante targets minstens 44×44 px op touchscreens. Contrast: bodytekst WCAG AA en bij grote tekst minimaal 3:1, handmatig controleren waar roze op wit wordt gebruikt.

### Stijl-niveaus

1. **Merkniveau:** display, overline, branded geometry.
2. **Contentniveau:** verhalend beeld, data, uitleg, selecties.
3. **Interactie:** CTA en filters in de vaste taal.

Wanneer elke card tegelijk merkniveau 1 probeert te zijn, wordt het onrustig. Laat grote posters op sectieniveau zitten; houd ondersteunende kaartinformatie rustig.

## G. Uitbreidingen v1.1 (3 november 2026)

Alle onderstaande componenten staan in `components.css` (sectie v1.1) en in `styleguide.html` (secties 10–12).

| Component | Klasse | Regel | States |
|---|---|---|---|
| Posterhero (home) | `.tl-poster`, `__img`, `__brand`, `__ruler`, `__copy`, `__title`, `__vertical` | Foto full-bleed, functionele leesbaarheidsschaduw (tokens `--tl-photo-shade-*`), koraal diagonaal | Mobiel: titel 10.6vw, meetlat geschaald |
| Zwevend menu | `.tl-floatpanel`, `__toggle`, `__intro`, `__nav` | Wit paneel op foto, menu als knop met `aria-expanded` | Open/dicht, Escape sluit |
| Mobiel menu | `.tl-menu-toggle` + `.tl-nav[data-open]` | Onder 800 px klapt de nav uit tot grote displaylinks | `aria-expanded`, Escape |
| Marquee | `.tl-marquee__track` | Decoratief, `aria-hidden` | Stopt bij reduced motion |
| Sectiekop | `.tl-section-head` | Display links, mono-toelichting rechts | Mobiel gestapeld |
| Tussenmaat display | `.tl-display--md` | `clamp(38px,5.6vw,88px)` voor koppen die in hun ontworpen regels moeten blijven | — |
| Kruimelpad / ankernav | `.tl-crumb`, `.tl-section-nav` | Mono, sticky ankernav op conceptpagina | `aria-current` |
| Gevoelsignatuur | `.tl-signature` | Koraal band; wit label = door bezoeker gekozen gevoel | `data-chosen` |
| Gevoelsvorm | `.tl-feeling[data-shape]` | Vaste vorm per gevoel: ring (energie), square (verbinding), diamond (verwondering), arc (rust), target (focus), triangle (trots) | pressed, hover |
| Feiten | `.tl-facts` | `dl` met nuchtere, brongebonden feiten onder een editorial kop | — |
| Waarden | `.tl-values` | Drie kernwaarden | — |
| Programma | `.tl-program` + `.tl-label` | Beeld + tijdlijn, label `VOORBEELD` verplicht | — |
| Beeldplaceholder | `.tl-placeholder` | Eerlijk alternatief als er geen eigen foto is; nooit een willekeurige stockfoto | — |
| Rollen | `.tl-roles` | Benodigde rollen; donker = gekoppelde partner, licht = `NOG OPEN` | — |
| Composer 3-koloms | `.tl-composer__grid--three`, `__fallback` | Gevoel / locatie / makers; tekstveld als kopiëren faalt | — |
| Carrousel | `.tl-carousel__bar`, `.tl-square-button`, `.tl-chip-button` | ← → met positie `01 / 04`; filterchips met `aria-pressed` | pressed, hover, focus |
| Bouwstenen / stappen | `.tl-pieces`, `.tl-steps`, `.tl-ecosystem`, `.tl-callout` | Homepage-ritme | hover |
| Zoekkop | `.tl-finder-top`, `.tl-redline` | Mist, koraal ring + kobalt vierkant, zoekstrip | — |
| Filters | `.tl-filters`, `.tl-filter-group`, `.tl-check`, `.tl-filter-toggle`, `.tl-active-filters` | Links op desktop, uitklapbaar op mobiel; actieve filters als verwijderbare knoppen | open/dicht, checked |
| Catalogus | `.tl-catalog`, `.tl-catalog-card`, `.tl-arrow-box` | 2 kolommen met verspringing; beeldstatus-badge; bron + datum | hidden, bewaard |
| Conceptkaart | `.tl-concept-card` | Catalogusvariant voor concepten met gevoelschips | gefilterd |
| Regio | `.tl-region-group` | Provincie + lijst | — |
| States | `.tl-state--empty/--error/--loading`, `.tl-skeleton` | Nooit een stille lege ruimte; altijd een herstelactie | — |
| Selectiebalk / toast | `.tl-selection-bar`, `.tl-toast` | Zwevend, inkt | verborgen bij 0 |
| Plan | `.tl-plan-item`, `.tl-warning` | Per concept; waarschuwing als een locatie geen partner meer is | — |

**Partnerregel in componenten:** `VenueCard`, `catalogCard`, locatiedetail, sitemap en concept-matches krijgen uitsluitend records waarvoor `isPublishablePartner()` (status `gepubliceerd` én `aangesloten === true`) waar is. Er bestaat geen component-variant voor niet-aangesloten locaties.

## H. Uitbreidingen v1.2 — complete concepten (3 november 2026)

| Component | Klasse | Regel |
|---|---|---|
| Dagdraaiboek | `.tl-runbook`, `--four`, `--on-dark` | Tijd / duur / onderdeel / wie / waar; op mobiel gestapeld met labels (`data-label`). |
| Aftelplanning | `.tl-timeline__item--wide` + `.tl-list` | Fase met taken; in het plan op maat met echte data. |
| Cateringvoorstel | `.tl-menu` | Per moment: tijd, gerechten, serveervorm, dieet. Geen prijzen. |
| Checklist | `.tl-checklist`, `.tl-check--on-dark` | Groepen per vakgebied; afvinkbaar in het plan op maat (bewaard in de browser). |
| Dialoog | `.tl-dialog` (native `<dialog>`) | Alleen voor een programma-onderdeel of contact met een locatie; nooit voor een heel concept. Escape/achtergrond sluit, focus terug. |
| Vragenlijst op maat | `.tl-questionnaire`, `.tl-tailored` | 12 vragen → draaiboek op starttijd, planning met data, catering/bezetting voor de groep, variant, capaciteitscheck, uitnodiging, offerteaanvragen, callsheet, begroting (CSV), print/PDF. |
| Composerkeuzes | `.tl-composer__select`, `.tl-composer__checks`, `.tl-chip-button--on-dark` | Gevoel, locatie (alle aangesloten partners) en makers (alle leverancierspartners) kiezen in de composer; synchroon met de kaarten. |
| Contact | `.tl-contact`, `.tl-contact-cta` | Contactpersoon uit het Greenbookings-profiel; versturen via de bevestigde contactroute (`site.json → contact.endpoint`), anders eerlijk afronden op het profiel. Nooit een schijnbevestiging. |

**Programma's zijn het programma van het concept** (besluit opdrachtgever 03-11-2026) en worden niet meer als `VOORBEELD` gelabeld. Sfeerbeelden blijven altijd gelabeld; een programma is geen boekbaar arrangement.

## I. Uitbreidingen v1.3–v1.4 — conceptmethode, briefing en conceptplan (3 november 2026)

| Component | Klasse | Regel |
|---|---|---|
| Bezoekersreis | `.tl-journey`, `.tl-journey__step`, `.tl-journey__title` | Zes fasen (vooraf → nazorg); het hoogtepunt (4e) altijd koraal. Titels klein genoeg om nooit af te breken (geen automatische woordafbreking). |
| Locatierol | `.tl-venue__pro`, `.tl-venue__watch` | Per aanbevolen locatie: VOORKEUR of ALTERNATIEF (max. twee), met pluspunt én aandachtspunt. |
| Dagdeelfilter | `.tl-chip-button[data-ov-daypart]` | Ochtend / middag / hele dag / avond; deeplink `?dagdeel=`. |
| Briefing | `.tl-questionnaire` (donker) + `.tl-concept-card__role`, `.tl-brief-reasons(--watch)` | Acht vragen → drie concepten uit **verschillende** categorieën (BESTE MATCH, ANDERE INVALSHOEK, VERRASSENDE KEUZE). Uitleg met ✓, aandachtspunten met !, nooit een score. Doorklik vult de vragenlijst op maat vooraf in (`?brief=`, gefilterd op bekende velden). |
| Conceptplan | `.tl-doc`, `.tl-doc__cover`, `.tl-doc__part`, `.tl-doc__item`, `.tl-doc__table--three`, `.tl-doc__input`, `.tl-doc__hint`, `.tl-doc__status` | Volgt het sjabloon *Eventconceptplan voor zakelijke evenementen*: projectgegevens, conceptbelofte en twaalf hoofdstukken. Inhoud uit het concept; wat alleen de organisator weet (eigenaar, nulmeting, ramingen, besluiten, status) is invulbaar en blijft in de browser. Geen bedragen van ons; prijs en beschikbaarheid altijd "op te vragen". Printbaar (richtvragen en knoppen verdwijnen in print). `noindex`. |
| Kwaliteitstoets | beheer §19 | 100 punten (doelen 25, doelgroep 20, originaliteit 15, betrokkenheid 15, haalbaarheid 15, duurzaamheid/inclusie 10). Alleen de hoofdredacteur; naam en datum worden vastgelegd. Ingevuld en < 70 blokkeert publicatie. |

## J. Uitbreidingen v1.5 — programma-agenda en tekstpijlen (4 november 2026)

| Component | Klasse | Regel |
|---|---|---|
| Programma-agenda | `.tl-agenda`, `.tl-agenda__item` (native `<details name>`), `__summary`, `__time`, `__title`, `__toggle`, `__panel` | Compacte regel per onderdeel (tijd + titel + plus/min in een vierkant). Klik of Enter opent het onderdeel ter plekke met wat/waarom/resultaat, aanpak, wie, benodigdheden, draaiboekregels en tip; één tegelijk open. Deeplink `#prog-<slug>-<n>`; bij printen staan alle onderdelen open. Vervangt de programma-dialoog. |
| Pijlen | `.tl-intro-label::before` (`--tl-arrow-se`, SVG-masker in koraal) | De grote pijl is een vector, geen teken. Inline pijlen (`↗ ↘` e.d.) en `✳` krijgen in de build U+FE0E (tekstpresentatie), zodat iOS ze nooit als emoji toont. |

## K. Uitbreidingen v1.6 — account, conceptmaker, presentatie en downloads (4 november 2026)

| Component | Klasse | Regel |
|---|---|---|
| Account | `.tl-account__tabs`, `.tl-account__form`, `.tl-account__me`, `.tl-account__list`, `.tl-account__item` | Inloggen / registreren / wachtwoord vergeten op donker; registreren vraagt expliciete toestemming; account (en alle concepten) zelf te verwijderen. |
| Conceptmaker | `.tl-maker`, `.tl-maker__bar` (sticky), `__part`, `__legend`, `__fields(--two/--three)`, `__list`, `__row`, `__icon`, `__more`, `__chosen`, `__checks`, `__issues` | Basis = standaardconcept; alles bewerkbaar (kern, programma met details, draaiboek, catering, entertainment, partners, communicatie, kosten/risico's/KPI's). Lijsten: toevoegen, verwijderen (met bevestiging), omhoog/omlaag, sorteren op tijd. Eerste keer opslaan expliciet, daarna automatisch. Alleen na inloggen. Alleen aangesloten partners kiesbaar. |
| Presentatie | `.tl-deck`, `.tl-deck__bar`, `.tl-slide(--cover/--idea/--end)` + `__head`, `__title`, `__display`, `__agenda`, `__journey`, `__table`, `__grid`, `__steps` | 16:9, schaalt met container-eenheden; printen = één dia per liggende pagina van 13,33 × 7,5 inch (`deck-print.css`, alleen op /presentatie/). Sfeerbeelden gelabeld. |
| Downloads | `.tl-concept-tools` | Word (.docx, echte Office Open XML, in de browser gemaakt) en tekst (.txt) uit dezelfde blokken (`exporters.js`); PDF via de presentatie. |

## L. Uitbreidingen v1.7 — zoeken, samenwerken en exports (4 november 2026)

| Component | Klasse | Regel |
|---|---|---|
| Zoeken | `.tl-search`, `.tl-search__input`, `.tl-search__results`, `.tl-search__item` | Eén veld over concepten, locaties en makers; begrijpt "20 personen" en plaatsnamen (plaats filtert alleen locaties). Uitleg in de statusregel; capaciteit altijd "volgens Greenbookings". |
| Samenwerken | `.tl-maker__collab`, `.tl-maker__share`, `.tl-maker__invite` | Deellink (alleen lezen, ook zonder account) en leden met rol redacteur/lezer beheert alleen de eigenaar. Gelijktijdig opslaan geeft een conflictmelding, nooit stil overschrijven. Versies: automatisch, herstellen met bevestiging. |
| Op maat in de maker | `.tl-maker__tailor` | Starttijd schuift programma, draaiboek en cateringmomenten samen; antwoorden uit de vragenlijst op maat overnemen. |
| Exports | knoppen `data-export` / `data-download` | PDF (presentatie), PowerPoint (.pptx, bewerkbaar, sfeerbeeld gelabeld), Word (.docx) en tekst; één bron (`export-actions.js`). |

## M. Uitbreidingen v1.8–v1.9 (4 november 2026)

| Onderdeel | Klasse | Regel |
|---|---|---|
| Snelle start | `.tl-quickstart`, `__item(--accent)` | Vier directe routes op de homepage (vergadering, dagevent, avond, briefing). |
| Kostenraming | `.tl-maker__costs`, `.tl-maker__cost`, `.tl-maker__contingency` | Bedragen zijn van de gebruiker zelf (eigen inschatting / offerte / bevestigd) met onvoorzien en totaal; Top Locaties noemt geen prijzen. |
| Status | `.tl-maker__stage`, `.tl-account__stage[data-stage]` | Idee → offertes → bevestigd → afgerond; zichtbaar in Mijn concepten. |
| Offertes in één keer | `.tl-maker__quotes`, `.tl-quote-send` | Naar alle gekozen partnerlocaties via de contactroute, met toestemming; eerlijke melding per locatie als de route niet beschikbaar is. |
| Aanmelden | `/aanmelden/`, maker-paneel AANMELDEN | Geheime aanmeldlink, toestemming, maximum, lijst, dieet en aantal overnemen, CSV. |
| Partnerprofiel | `.tl-venue-photos` + ruimtetabel | Alleen https en beelden met gebruiksrecht (greenbookings, locatie, eigen); bron vermeld. |
| Taal | `.tl-lang` | NL/EN-wissel; `/en/` en `/en/concepts/` met hreflang. Volledige conceptpagina's nog in het Nederlands, duidelijk gelabeld. |
| Toegankelijkheid | v1.9 | Kleine tekst op taupe/mist in inkt; actieve navigatie met onderstreping in koraal; invoervelden op mobiel ≥ 16px; tabs met `aria-selected`. Open ontwerpbesluit: kleine inkt-tekst op koraal (4,28:1) en koraal accentwoorden op taupe/mist. |
