# TOP LOCATIES / THE DESIGN MANUAL

**Versie 1.0 — 3 november 2026**  
**Designrichting:** *editorial brutalism meets the cultural event scene*.  
**Merkbelofte:** *Een idee. Een plek. De mensen die het waarmaken.*

## 1. Het karakter

Top Locaties is niet de vierde traditionele locatiezoeker. Het is een **inspiratiepublicatie die je kunt gebruiken om een evenement te bouwen**. De sfeer ontlenen we aan experimentele cultuurposters, grafisch ontworpen programmafolders en onafhankelijke magazines. Het voelt zelfverzekerd, verrassend, intelligent en menselijk.

De eerdere ontwerpstudie is geïnspireerd op de typografische lef en redactionele ritmiek van `hupr.ca/en/`. We nemen geen individuele HUPR-layouts of handelsmerk over. De beeldtaal van **Top Locaties** blijft zelfstandig: de eigen naam, roze ster `✳`, Nederlandse taal, eventfotografie en het gevoelskompas.

### Vijf visuele principes

1. **Typografie is de hoofdpersoon.** De kop mag bijna een poster worden.
2. **Redactioneel, niet generiek.** Elke sectie heeft een begin, een idee en een visueel tempo.
3. **Ruimte en spanning.** Grote tussenruimten tegenover extreem compacte koppen.
4. **Verrassende compositie, voorspelbare bediening.** Artistieke layout, begrijpelijke interactie.
5. **Van emotie naar bewijs.** Bij het beeld volgen een bruikbaar programma, echte venues, echte makers en een werkende volgende stap.

## 2. Het logo en de vaste merkuitingen

- Primair woordmerk: `TOP` op regel 1, `LOCATIES` op regel 2, compact gezet in **Archivo Black**, `letter-spacing: -0.075em`, `line-height: 0.86`.
- Signatuur: `✳` in helder koraal, rechts tegen `LOCATIES`, ongeveer 1,4× de regelhoogte. Gebruik een typografische asterisk; geen gestroomlijnde AI-sparkle.
- Ruimte rondom woordmerk: minimaal 0,6× hoogte van het woord `TOP`.
- Minimaal formaat desktop: 28 px; mobiel: 23 px.
- Op een foto: wit woordmerk met de witte of roze ster, mits de achtergrond voldoende contrast biedt. Gebruik anders een donker vlak.
- Voorkeurscombinatie: `TOP LOCATIES ✳` naast kleine tekst `EEN IDEE / EEN PLEK / EEN ERVARING`.

## 3. Kleuren — canoniek

| Token | HEX | Gebruik |
|---|---|---|
| `--tl-ink` | `#292A2C` | Primair tekst, donkere secties, primaire zwarte CTA. |
| `--tl-coral` | `#F45269` | Merkster, emotioneel accent, grote kleurvelden, geselecteerde interacties. |
| `--tl-cobalt` | `#2546BB` | Secundair opvallend accent, focus ring, uitgelichte eerste gevoelsmatch. |
| `--tl-paper` | `#F6F5F2` | Warm, gebroken wit voor rustige content. |
| `--tl-taupe` | `#D9C9BF` | Concepten, programma, warme editorial secties. |
| `--tl-mist` | `#E9E3DF` | Gevoelensk ompas, zachte achtergronden, detailverschil. |
| `--tl-white` | `#FFFFFF` | Kaarten, contrastvlakken en tekst op donker. |
| `--tl-muted` | `#656766` | Ondersteunende teksten op lichte achtergrond. |
| `--tl-line` | `#A5A19D` | Dunne regels, tabs, borders. |

**Kleurverhouding:** circa 55% papier/wit, 25% taupe/mist, 15% inkt, 5% koraal/kobalt. Dit is een richting, geen pixelquota. Een volledige roze afsluiter mag het ritme juist doorbreken.

**Belangrijk:** op koraal geen kleine witte tekst als het contrast onvoldoende is. Gebruik ink voor kleine labels. Kobalt met wit heeft veel sterker contrast. Focusring altijd duidelijk zichtbaar.

Verboden: anonieme paarse gradients, teal, arbitraire pastels, neon-glows, glassmorphism, skeuomorphism en kleur als willekeurige decoratie.

## 4. Typografie — exact

```css
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');

/* Display */
font-family: 'Archivo Black', Arial, sans-serif;
font-weight: 400;
text-transform: uppercase;
letter-spacing: -0.075em;
line-height: .91;

/* Redactionele labels / bediening */
font-family: 'DM Mono', monospace;
font-size: 11px;
line-height: 1.55;
text-transform: uppercase;

/* Lange uitleg */
font-family: 'DM Sans', Arial, sans-serif;
font-size: 15px;
line-height: 1.65;
```

| Niveau | Desktop | Mobiel | Gedrag |
|---|---|---|---|
| Display XL | `clamp(76px, 11vw, 190px)` | `clamp(54px, 13vw, 94px)` | 1–3 regels, asymmetrisch. |
| Display L | `clamp(52px, 8vw, 124px)` | `clamp(40px, 10vw, 70px)` | Sectiehoofden. |
| Display M | `clamp(30px, 4vw, 60px)` | `clamp(26px, 7vw, 40px)` | Cardtitel. |
| Body lead | 18 px / 1.5 | 16 px / 1.55 | Korte uitnodiging. |
| Body | 15 px / 1.65 | 15 px / 1.65 | Verhaal, toegankelijk. |
| Mono meta | 11–12 px / 1.55 | 10–11 px / 1.55 | Nummering, labels, CTA. |
| Captions | 10 px / 1.5 | 10 px / 1.5 | Bron, beeldverklaring. |

Kopregels worden **bewust** afgebroken, bijvoorbeeld:

> HOE MOET HET  
> VOELEN?

> EEN IDEE KOMT  
> TOT LEVEN MET  
> DE JUISTE MAKERS.

Geen scriptfont, geen derde displayfont, geen middengecentreerde SaaS-hero, geen overbodige vet/italics in lopende tekst.

## 5. Layout en raster

- Buitenmarge desktop: `3.5vw`, met sensible minimum van 24 px; tablet/mobiel `5vw`.
- Maximale tekstbreedte body: 68–72 tekens of circa 660–720 px.
- Standaard inhoudsectie: verticale padding ongeveer 88–115 px; mobiel 60–90 px.
- Twee hoofdprincipes: (a) **asymmetrisch split-screen** voor een verhaal met beeld, (b) **redactioneel raster** voor meerdere locaties of makers.
- Afwisselende beelden: een groot beeld, twee kolommen met afwijkende verticale uitlijning, 3 kaarten alleen waar een vergelijking echt nuttig is.
- Dividers: dunne horizontale lijnen, meestal 1 px; een nadrukkelijke 2-px grens bij belangrijke overgangen.
- Cards: 0–2 px radius, border in plaats van grote schaduw, geen uniforme afgeronde dozen.
- Catalogusoverzicht: 2 kolommen desktop, optisch ritme door o.a. verspringing tweede/derde kaart. Mobiel 1 kolom.
- Locatie-/aanbevolen kaarten: 3 kolommen groot desktop, 2 tablet, 1 mobiel.
- Leveranciers: 4 kolommen groot desktop, 2 tablet, 1 mobiel.
- Conceptdetail: split hero, visueel verhalende timeline, aanbevelingen, composer.

### Verticale cadans

1. Kleine `01 / ...` bovenregel.
2. Grote displaykop (de emotionele claim).
3. Korte redactionele toelichting (de reden).
4. Beeld/kaarten/programma (het bewijs).
5. Eén primaire actie (de volgende stap).

## 6. Vormtaal en grafische details

- `✳` is de enige terugkerende merkster.
- Grotere geometrische vormen mogen *deels buiten beeld* vallen: open cirkel, typografisch kruis of diagonaal vlak. Dit levert spanning op.
- Haardunne kaders ín de fotografie, met hoekinset 15–18 px.
- Ruler/meetlat uit de homehero als incidenteel decoratief element, niet overal kopiëren.
- Numerieke indexen `01 / 04`, `CONCEPT 001`, `NL / 2026`, coördinaten uitsluitend waar ze echt iets zeggen.
- Cobalt alleen als duidelijke tegenstem in een overwegend koraal/inkt palet.
- Pijlen: `↗` voor andere pagina of externe detailkaart, `↓` voor anker/scroll, `←` en `→` voor carrouselnavigatie.

## 7. Fotografie en beeldselectie

**Fotografie is essentieel.** Niet vullen met generieke stockfoto's van lege vergaderruimtes of handenschuddende medewerkers. Toon mensen die beleven: licht in donkere zalen, ontdekking, tafelschikking, natuur, architectuur, interactie, grote contrasten en authentieke details.

- Heroes: 16:9 of verticaal split, stevige contrasten, geen tekst over een drukke zone.
- Conceptbeeld: emotionele sfeer van het idee. Mag illustratief zijn als het duidelijk staat aangegeven.
- Locatiebeeld: **de echte locatie** zodra data is aangesloten. Geen random stock op een specifieke locatiekaart zonder `SFEERBEELD TER ILLUSTRATIE`.
- Leveranciers: authentiek werk, portretten of hun eigen beeld; geen ongeautoriseerde logo's.
- Bewaar bestandsmeta: fotograaf, licentie, alt, credit, verhouding, bron, bijwerkdatum.
- Fotobeweging bij hover: subtiele schaal 1.04–1.06 in 400–800 ms. Geen parallax als dat leesbaarheid raakt.

## 8. Interactie en motion

- Hover: direct feedback, achtergrondwissel inkt ↔ koraal, subtiele pijlrotatie of beeldzoom.
- Focus: 3 px kobalt-outline, 3–4 px offset. Focus moet zichtbaar blijven op roze, donker en foto's.
- Klik/selectie: gebruik expliciete states (`aria-pressed`, checkbox of radiobutton). Een actie die een plan wijzigt moet terug te draaien zijn.
- Motion: 160–300 ms voor states, 500–800 ms voor fotografische hover, 27 s marquee alleen als decoratie.
- `@media (prefers-reduced-motion: reduce)` schakelt niet-essentiële motion uit.
- Nooit smooth-scroll forceren bij reduced motion.
- Kies op gevoel: max. twee keuzes. Laat zien *waarom* de aanbeveling past; geef altijd toegang tot alle concepten.

## 9. Stijl van de teksten

**Korte, verrassende Nederlandse zinnen.** Enerzijds groot en expressief, anderzijds duidelijk in functionele instructies. Geen generieke marketingcopy als 'jouw ultieme eventervaring' of holle superlatieven.

Goede voorbeelden:

- `HOE MOET HET VOELEN?`
- `VIND EEN PLEK DIE IETS LOSMAAKT.`
- `GEEN KLASSIEK CONGRES. WEL EEN DAG VOL ONTDEKKINGEN.`
- `DE JUISTE PLEK VERANDERT ALLES.`
- `BEKIJK WAT HIER KAN ↗`

Nuchtere informatie altijd in normaal Nederlands. Herhaal niet overal dezelfde plichtmatige AI-formuleringen.

## 10. De niet-onderhandelbare balans

Een bezoeker moet de **sfeer** direct voelen, maar kan daarna binnen 30 seconden herkennen: wat is het concept, voor wie, welke groepsgrootte, wat gebeurt er, welke locaties passen, welke leveranciers zijn nodig, hoe ga ik verder? Een spectaculair design zonder dit antwoord is geen geslaagd Top Locaties-ontwerp.

Het design is uitgesproken, de informatiearchitectuur is rustig. Laat een nieuw onderdeel niet in een schermvullende modal verdwijnen. Voor complexe inhoud maak je een volwaardige pagina met ankerlinknavigatie.

## 11. Mobile en responsive

| Breedte | Norm |
|---|---|
| 1440+ | Volledig editorial canvas; side-by-side hero en asymmetrisch raster. |
| 1024 | 2–3 kolommen; navigatie en grote displaykop mogen reflowen. |
| 768–1023 | 2 kolommen; hero stapelt waar nodig; subtitel behoudt leesbaarheid. |
| 360–767 | 1 kolom; hoofdbeeld niet verdwenen, primaire CTA zichtbaar, filterdrawer en grotere touch targets. |

De inhoud en functie zijn op mobiel identiek. Geen 'desktop-only' gevoelenselectie. Lettertypes in labels bij voorkeur minimaal 11 px en contrast aantoonbaar sterk; waar 10 px nodig is, uitsluitend voor niet-kritische overlines.

## 12. Consistentie met vier sites

`top-locaties.nl`: **ontdekken en inspiratie** → eventconcept + emotie + geschikte partijen.  
`greenbookings.nl`: **bron en netwerk** → de actuele profielen van venues/leveranciers.  
`locatie-zoeker.nl`: **hulp bij vinden** → zoekvraag en matching.  
`meetings.nu`: **aanvullende zakelijke oriëntatie**, eigen redactionele rol.

De vier sites mogen eigen merkuitingen hebben. Dit design system is specifiek voor **Top Locaties**, niet een verplicht uniform rebrand voor alle vier.

## 13. Design review: wanneer is een pagina goed?

Elke nieuwe pagina wordt beoordeeld op vijf punten, elk 0–2: **herkenbaar karakter, sterke hiërarchie, informatiebruikbaarheid, responsiviteit, toegankelijkheid**. Alleen 8/10 of hoger en géén kritieke toegankelijkheidsfout is opleverbaar. Een hoge score maakt een ongecontroleerde locatieclaim nooit acceptabel.

## 14. Exacte broncode-referenties

De oorspronkelijke prototypes bevatten kleine verschillen zoals `#F34F68` versus `#F45269`. Die verschillen zijn een gevolg van iteraties. Nieuwe componenten gebruiken de canonieke waarden uit dit document; voor **pixelvergelijking met een bestaand scherm** mag Claude tijdelijk de oorspronkelijke pagina-stijl aanhouden, maar hij mag geen derde stijl bedenken.

- `dist/hupr.html` — inspiratie/merk.
- `dist/locaties.html` — zoekpagina/filternavigatie.
- `dist/concept.html` — conceptdetail/aanbevelingen.
- `dist/feelings.css` — de gevoelselectie.
- `dist/hero-event.webp` en `dist/festival-event.webp` — bestaande visuele assets.
- `design-system/styleguide.html` — nieuwe canonieke bouwstenen.
