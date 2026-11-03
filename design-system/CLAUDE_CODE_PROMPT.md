# Volledige startopdracht voor Claude Code

Kopieer onderstaande tekst en plak hem in Claude Code **nadat dit pakket in de root van de werkelijke projectrepository is geplaatst**.

---

## START PROMPT

Je bent de lead designer, frontend architect en senior UX engineer voor **top-locaties.nl**, onderdeel van het netwerk van Greenbookings, locatie-zoeker.nl en meetings.nu.

**Doel:** bouw deze bestaande ontwerpstudie volledig door tot een robuust, uitbreidbaar platform, waarbij **elke huidige en toekomstige pagina pixelwaardig in dezelfde uitgesproken stijl** blijft. De creatieve lat ligt hoog: geen standaard AI-website, geen SaaS-dashboard. De bestaande ontwerpstijl is voor deze opdracht goedgekeurd. Verander hem niet vanuit eigen smaak.

### 1. Bestudeer het bestaande ontwerp voordat je iets wijzigt

Lees volledig:

- `CLAUDE.md` en `.claude/rules/top-locaties-ui.md`.
- `design-system/README.md` en `design-system/STYLE-GUIDE.md`.
- `design-system/COMPONENT-CONTRACTS.md`.
- `design-system/CONTENT-AND-PAGES.md`.
- `design-system/QA-CHECKLIST.md`.
- `design-system/tokens.json` en `design-system/tokens.css`.
- `design-system/components.css` en `design-system/styleguide.html`.
- De volledige bron van `dist/hupr.html`, `dist/concept.html`, `dist/locaties.html`, `dist/feelings.css`, `dist/feelings.js`, `dist/site-navigation.js` en de aanwezige beeldassets.

Open de visuele styleguide en bestaande pagina's in een browser. Maak screenshots bij 1440×900 en 390×844 zodat je werkelijk begrijpt wat de typografie, het fotografische ritme, de marges en de kleurvlakken doen. Als een browser niet beschikbaar is, zeg expliciet dat een pixelvergelijking nog openstaat. Claim niet dat je die hebt gedaan.

### 2. Inventariseer eerst de huidige codebase

- Leg uit welk framework en welke routing, dataopslag, afbeeldingsopslag en deployment al bestaan.
- Inventariseer of dit pakket in een nieuw project of een bestaand webproject staat.
- Vind eventuele huidige Greenbookings API's, tabellen en datamodellen. **Geen nieuwe endpointnamen of databasecontracten verzinnen.**
- Breng het verschil in kaart tussen (a) prototypebron, (b) echte productiefunctionaliteit en (c) wat nog onbekend is.
- Stel alleen vragen die werkelijk blokkerend zijn, zoals ontbrekende toegang tot de Greenbookings-databron. Je mag de vormgeving zonder dergelijke toegang alvast volledig bouwen met expliciet gemarkeerde voorbeelddata.

### 3. Werk binnen dit design system

- De canonieke waarden uit `tokens.css` / `tokens.json` gelden overal. Los de kleine kleurafwijkingen van oude prototypes op zonder het ontwerp te veranderen.
- Implementeer een gedeelde componentbibliotheek. In statische HTML: CSS `tl-` componenten. In React/Vue/etc: gebruik hetzelfde CSS-contract via herbruikbare componenten. Niet telkens een nieuwe visuele taal bedenken.
- Houd de drie lettertypen en hun rollen strikt gescheiden: Archivo Black voor display; DM Mono voor microcopy/navigatie; DM Sans voor gewone uitleg.
- Houd de karakteristieke compositie: zware zwarte kapitalen, asymmetrische secties, warm papier, taupe, koraal, spaarzaam kobalt, fotografie, dunne lijnen, hoekige componenten.
- Ontwerp niet opnieuw vanuit Tailwind/Bootstrap/componentgenerator-defaults. Vertaal het bestaande ontwerp naar het gekozen systeem.
- Nieuwe basiscomponenten worden gelijktijdig gedocumenteerd en toegevoegd aan `design-system/styleguide.html`.

### 4. Bouw of consolideer deze pagina's

1. **Homepage:** grote merkhero, redactionele introductie, emotiekompas, uitgelicht concept, routes naar locaties en leveranciers, ecosysteemverhaal.
2. **Alle eventconcepten:** browse/zoek/filter op type en gewenst gevoel, inspirerende kaarten en relevante content.
3. **Conceptdetail:** minimaal verhaal, doelgroep/bedoeling, gevoelens, voorbeeldprogramma, drie passende locaties met redactionele reden, leveranciersrollen en echte profielen, composer en volgende stap.
4. **Locatiezoeker:** volwaardig zoeken/filteren/sorteren, resultaatcount, kaart-/regio-overzicht, lege staat, mobiel filterpaneel, echte profielen.
5. **Locatiedetail:** echte fotografie, sterke editorial beschrijving, voorzieningen/capaciteit voor zover geverifieerd, passende eventconcepten.
6. **Leveranciersoverzicht en -detail:** echte makers, vakdisciplines, waarom relevant voor een concept, brongegevens.
7. **Mijn eventplan:** concept, emoties, gekozen locatie en leveranciers, export/kopie en latere aanvraagroute.

### 5. De kerninnovatie: 'Hoe moet het voelen?'

Dit is de primaire inspiratie-ingang. Maak hem aantrekkelijk én serieus bruikbaar:

- De bezoeker ziet de vraag: **'Je gasten gaan naar huis. Wat wil je dat ze voelen?'**
- Keuze uit zes gevoelens: Energie, Verbinding, Verwondering, Rust, Focus, Trots.
- Maximaal twee keuzes tegelijk; elke keuze heeft een karakteristieke geometrische accentvorm.
- Na keuze verschijnen maximaal drie conceptmatches met uitleg waarom ze bij de emoties passen.
- Volledige conceptpagina bevat de gevoelsignatuur en link naar nieuwe keuze.
- Emotie is niet hetzelfde als de fysieke sfeer van een venue; modelleer deze apart.
- Geen valse AI-percentages, geen black-box aanbevelingen; begin met redactionele tagging.

### 6. Data en Greenbookings

- Alle locaties en leveranciers moeten uiteindelijk uit het Greenbookings-netwerk komen. Het platform toont op meerdere plekken dezelfde bronpartijen, maar steeds met **eigen redactionele context**.
- Kies één idempotente synchronisatiestrategie met `sourceUpdatedAt`, status en bronlinks.
- Sla uitleg van `concept→venue` en `concept→supplier` apart op; de match is niet alleen een lijstje IDs.
- De bijgeleverde lokale prototype-data is **geen definitieve productiebron**.
- Markeer onbekende prijs, capaciteit en beschikbaarheid als onbekend; toon geen harde claims zonder verificatie.
- Gebruik geen willekeurige stockfoto als werkelijk beeld van een locatie of leverancier. Bij illustratieve foto's: expliciet label.
- Behoud onderscheidende SEO-inhoud om dubbele pagina's in het netwerk te voorkomen.

### 7. Wat je concreet moet opleveren

- Een werkende site met de overeengekomen pagina's en nette gebruikersstromen.
- Een centrale tokenslaag én gedeelde componenten.
- Een uitbreidbaar contentmodel en een beheerflow voor concepten, gevoelens, matches, programma's en assets.
- Geïmplementeerde desktop-, tablet- en mobielontwerpen.
- Dezelfde typografische, fotografische en grafische signatuur op nieuwe pagina's.
- Duidelijke loading/empty/error/selected states.
- Screenshotvergelijking bij 1440, 1024, 768, 390 en 360 px.
- Een beknopt overzicht van wat uit echte Greenbookings-data komt en wat nog een placeholder is.
- Een bijgewerkte styleguide met elk nieuw onderdeel.

### 8. Volgorde van uitvoering

**Fase A — audit en architectuur:** maak een korte, toetsbare inventarisatie en een mapping van prototype → componenten → paginatemplates. Stel blokkerende vragen.

**Fase B — visuele basis:** implementeer tokens, globale typografie, navigatie, sectieraster, knoppen, gevoelkaarten, venue- en suppliercards. Visuele review vóór volgende fase.

**Fase C — bestaande routes:** implementeer of migreer homepage, gevoelenselectie, conceptdetail en locatiezoeker met volledig behoud van stijl en functies.

**Fase D — uitbreiding:** bouw conceptoverzicht, leveranciers, detailpagina's en planbuilder uitsluitend uit gedeelde componenten.

**Fase E — data en beheer:** sluit de echte Greenbookings-bron aan zodra het werkelijke API/schema en bevoegdheden bekend zijn. Ontwikkel redactioneel beheer voor concepten en matchredenen.

**Fase F — acceptatie:** doorloop de complete checklist en herstel visuele of functionele afwijkingen. Rond af met bestandslijst, testresultaten, resterende data-aannames en deploymentstatus.

### 9. Harde stopmomenten

Stop en vraag mij om richting voordat je:

- de kleuren, fonts, het logo of de editorial stijl fundamenteel wijzigt;
- echte Greenbookings-data overschrijft of een niet-geverifieerde koppeling live zet;
- de bestaande website onomkeerbaar vervangt;
- een nieuwe AI-tool, externe account, betaalde dienst of API-credential nodig hebt;
- hard beweert dat een locatie of leverancier een reservering, prijs of capaciteit bevestigt.

### 10. Mijn criterium voor succes

Als ik een willekeurige nieuwe pagina open, zie ik **onmiddellijk** dat het Top Locaties is — zonder het logo nodig te hebben. Op elke pagina kan een bezoeker vervolgens ook echt verder: kiezen, begrijpen, combineren en doorklikken naar de relevante partij.

**Begin nu met een analyse van de aanwezige broncode en laat daarna de eerste visuele implementatie zien.**

## EINDE PROMPT
