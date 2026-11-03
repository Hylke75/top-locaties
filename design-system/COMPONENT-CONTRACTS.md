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
