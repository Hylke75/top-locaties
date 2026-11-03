# FUNCTIONEEL ONTWERP — TOP-LOCATIES.NL

**Versie:** 1.0 (3 november 2026)  
**Status:** gereed als bouwspecificatie, met expliciete aannames en open integratievragen  
**Opdrachtgever:** Top Locaties / Greenbookings  
**Te gebruiken met:** `CLAUDE.md`, `STYLE-GUIDE.md`, `COMPONENT-CONTRACTS.md`, `tokens.css`, `components.css` en de bestaande `dist/`-prototypes.

> **Het product in één zin:** Top Locaties is een visueel en redactioneel inspiratieplatform waarop organisatoren **vanuit het gewenste gevoel van een evenement** passende eventconcepten, Greenbookings-locaties en leveranciers ontdekken, combineren en meenemen in een uitvoerbaar eerste plan.

## 0. Leeswijzer, definities en harde keuzes

Dit document is de functionele basis voor Claude Code. `MUST` betekent verplicht voor de beschreven release; `SHOULD` is sterk aanbevolen; `LATER` is expliciet niet onderdeel van de eerste release. De specificatie beschrijft gedrag en verwachte uitkomsten. Het exacte technische contract met de **bestaande Greenbookings-infrastructuur moet eerst worden gecontroleerd**; voorgestelde tabellen, routes en services zijn geen claim dat ze al bestaan.

**Direct vastgelegd:**

1. De primaire discovery-route is **gevoel → concept → locatie + makers → persoonlijk plan**. De gewone locatiezoeker blijft een tweede, volwaardige ingang.
2. Op Top Locaties staat **inspiratie en context**, op Greenbookings de gezaghebbende bron van locatie- en leverancierprofielen. Beschikbaarheid, boeking en actuele commerciële gegevens worden niet gesimuleerd.
3. Een eventconcept is een redactioneel product met eigen verhaal, doelgroep, doel, programma, gevoelsprofiel, aanbevolen plekken en benoemde leveranciersrollen.
4. **Uitsluitend actieve, publiek presenteerbare én bij Greenbookings aangesloten partnerlocaties zijn doorzoekbaar**, niet alle vermeldingen in de algemene Greenbookings-gids. Op een conceptdetail tonen we een redactionele selectie van deze aangesloten locaties. Dit is een harde toegangseis voor elke publieke route, sitemap, aanbeveling en API-respons.
5. **Alle publiek presenteerbare leveranciers** worden in een aparte leveranciersgids vindbaar zodra een gecontroleerde gegevensbron beschikbaar is. Alleen echte leveranciers krijgen de status 'leverancier'; sponsors en mediapartners blijven als aparte entiteiten/categorieën onderscheiden.
6. De bestaande HUPR-geïnspireerde, zelfstandig uitgewerkte **Top Locaties-designstijl** is goedgekeurd en mag niet per pagina worden herontworpen.
7. Het platform hoeft geen eigen omzet te genereren. Het doel is bereik, organische vindbaarheid, zichtbaarheid van partijen en doorverwijzingen naar het ecosysteem.
8. De eerste versie is Nederlandstalig en gericht op zakelijke evenementen in Nederland. Internationalisering is een uitbreidingsmogelijkheid, geen launch-eis.
9. Zonder account kan iedere bezoeker inspiratie ontdekken, filteren, een concept samenstellen en een plan kopiëren.
10. Wat niet geverifieerd is, wordt als onbekend of illustratief aangeduid; géén verzonnen aantallen, prijzen, capaciteiten of partnerrelaties.

## 1. Productdoelen en KPI's

### 1.1 Primaire doelen

| Code | Doel | Hoe meten we het? |
|---|---|---|
| G-01 | Organisatoren vinden nieuwe ideeën | Conceptdetailweergaven, scrolldiepte, feeling-first interacties |
| G-02 | Meer bereik voor aangesloten Greenbookings-locaties | Indexeerbare partnerlocatiepagina's, profielvertoningen en uitgaande klikken |
| G-03 | Meer bereik voor leveranciers | Vindbare leveranciersprofielen, impressies, conceptvermeldingen, uitgaande klikken |
| G-04 | Verandering van inspiratie naar actie | Gestarte/compleet gemaakte plannen, contact- of profielklikken |
| G-05 | Vier complementaire sites laten groeien | Organisch zoekverkeer per intentiecluster, kwalitatieve doorverwijzingen, overlaprapport |
| G-06 | Weinig redactionele onderhoudslast | Aantal automatisch ververste profielen, syncfouten en gemiddelde tijd per concept |

**Geen fictieve KPI-doelen:** voor publicatie een nulmeting van Search Console, analytische gebeurtenissen en Greenbookings-uitgaande klikken uitvoeren. Daarna realistische doelen voor 3, 6 en 12 maanden vastleggen.

### 1.2 Niet-doelen voor release 1

- Geen transacties, betaalmodule, ticketing, echt prijsaanbod of automatische beschikbaarheidscontrole.
- Geen onbeperkt genererende AI-agent die direct honderdduizenden SEO-pagina's publiceert.
- Geen gebruikeraccount als voorwaarde om te kijken of selecteren.
- Geen zelfstandige mailbox of CRM-leadverdeling zonder afstemming met de Greenbookings-aanvraagflow.
- Geen onbevestigde CO₂- of bomenclaim op basis van een willekeurig evenement.

## 2. Huidige uitgangssituatie en bronstatus

### 2.1 Bestaand Top Locaties-prototype

| Bron | Aanwezig | Status |
|---|---|---|
| `dist/hupr.html` | Homehero, editorial secties, conceptcarousel | Werkend ontwerpvoorbeeld, deels statisch |
| `dist/feelings.js` + `.css` | Zes gevoelens, maximaal twee kiezen, redactionele matches | Werkend lokaal prototype |
| `dist/concept.html` | Conceptdetail met verhaal, voorbeeldprogramma, aanbevolen partijen, planselectie | Vier demo-concepten; gegevens deels handmatig |
| `dist/locaties.html` | Zoekstrip, filters, kaarten, regio-overzicht | Acht handmatige voorbeeldlocaties, géén volledige bronkoppeling |
| `design-system/` | Canonieke tokens, componenten, gedrag, UX | Designreferentie voor alle volgende pagina's |

### 2.2 Greenbookings: geverifieerde openbare technische toegang

De pagina `https://greenbookings.nl/ontwikkelaars` documenteert:

- Open, alleen-lezen API: `GET /api/v1/locaties`.
- Detailendpoint: `GET /api/v1/locaties/{slug}`.
- Zoekparameters: `zoekterm`, `provincie`, `personen`, `opstelling`, `duurzaam`, `faciliteit`, `sfeer`, `overnachten`, `alleen_partners`, `limiet`, `start`.
- `limiet` maximaal 50; `start` voor paginering.
- Maximaal 600 aanvragen per uur per IP; geen API-sleutel nodig.
- OpenAPI-document: `https://greenbookings.nl/openapi.json`.
- MCP-server: `https://greenbookings.nl/mcp`.
- De API geeft profiel-URL's en volgens de documentatie bij aangesloten partners extra zaalinformatie.
- **Geen publiek gedocumenteerd leveranciersendpoint** bij de momenteel getoonde lijst API-endpoints.

De algemene openbare locatiegids toont op de onderzoeksdatum **3.225 vermeldingen**, maar **dat is nadrukkelijk niet het aantal voor Top Locaties**. De site importeert en toont alleen de subset die via de gedocumenteerde filter `alleen_partners=true` als aangesloten is aangemerkt. Het actuele **aantal aangesloten en publiceerbare locaties** komt uit de gevalideerde gesynchroniseerde partnerindex; nooit een teller uit het algemene bestand hardcoden.

De leveranciersgids bevat zowel aangesloten bedrijven als gratis vermeldingen, en onderscheidt leveranciers van sponsors en andere partners. Een toekomstige koppeling moet die categorieën en zichtbaarheid respecteren.

**Technisch gevolg:** locaties kunnen al op een gedocumenteerde bronkoppeling worden gebouwd. Voor leveranciers is er een beslispunt: (a) een door Greenbookings beheerde export/feed of (b) een afgesproken, read-only interne API. Niet zelfstandig een onbevestigd endpoint gebruiken.

### 2.3 Netwerk van vier domeinen

| Domein | Eigen primaire zoekintentie | Rol |
|---|---|---|
| `top-locaties.nl` | "idee bedrijfsevent", "origineel eventconcept", "kennisfestival organiseren" | Inspiratie, emotie, concepten, context bij partijen |
| `greenbookings.nl` | "duurzame vergaderlocatie", "groene locatie", "duurzame eventleverancier" | Data, duurzaamheid, profielen, aanvraagroute, kennis |
| `locatie-zoeker.nl` | "ik zoek een locatie in regio X voor Y personen" | Directe zoek-/advieshulp, vraaggericht |
| `meetings.nu` | Zakelijke meetingoriëntatie en content | Zakelijke informatie en aanvullend bereik |

Geen vier gekopieerde gidsen. De **data kan dezelfde zijn, maar de reden van het bezoek, navigatie en unieke pagina-inhoud moeten verschillen**.

## 3. Gebruikers, rollen en rechten

| Rol | Doel | Toegang |
|---|---|---|
| Bezoeker/organisator | Inspiratie, zoeken, opslaan, vergelijken, contactdoorklikken | Publiek; zonder account |
| Ingelogde organisator (LATER) | Plan bewaren, delen, revisies | Eigen plannen, geen toegang tot andere gebruikers |
| Redacteur | Concepten schrijven en locaties/leveranciers koppelen | Beheer van editorial content |
| Hoofdredacteur | Inhoud beoordelen en publiceren | Alle redactionele rechten, publiceren/terugzetten |
| Data-/integratiebeheerder | Bronnen koppelen, importstatus zien, veldmapping, bronconflicten | Geen publicatierechten tenzij extra rol |
| Platformbeheerder | Rollen, instellingen, logs, redirects, SEO en kwaliteit | Volledig platformbeheer |
| Locatie-/leverancierbeheerder (LATER) | Onjuiste gegevens signaleren | Wijzigen alleen via Greenbookings of gecontroleerde correctiestroom |

**Rechtenmatrix:** redacteur mag concepten als draft/review opslaan, niet live publiceren; hoofdredacteur mag publiceren; integratiebeheerder mag sync starten, niet zomaar redactionele matchredenen overschrijven; platformbeheerder mag rollen toewijzen. Elke mutatie in admin krijgt een auditrecord.

## 4. Centrale gebruikersstromen

### U-01 — Inspiratie op gevoel

1. Bezoeker ziet `Hoe moet het voelen?` op de homepage of conceptoverzicht.
2. Kiest één gevoel, daarna optioneel een tweede. `aria-pressed` verandert direct.
3. Systeem toont maximaal drie redactioneel gemotiveerde conceptmatches; nr. 1 mag visueel worden uitgelicht.
4. Bezoeker opent de volledige conceptpagina.
5. Bezoeker ziet expliciet welke gevoelens dit concept kan oproepen, plus een inhoudelijke onderbouwing.
6. Via `Kies een ander gevoel` kan men zonder verlies van context terug.

**Resultaat:** van een emotioneel doel naar één concreet idee.

### U-02 — Concept uitwerken

1. Bezoeker opent concept via kaart, zoekmachine of gevoelskompas.
2. Leest doel, doelgroep, sfeer, verwachte beleving, opzet en voorbeeldprogramma.
3. Bekijkt 3–6 redactioneel aanbevolen locaties en waarom ze bij dit concept passen.
4. Verfijnt op plaats/regio, groepsgrootte en enkele harde voorwaarden.
5. Kiest één locatie en meerdere relevante leveranciers.
6. Ziet in `Mijn plan` overzicht van de gekozen onderdelen.
7. Kopieert, deelt of downloadt een conceptvoorstel; verdere informatie via Greenbookings-profiel/aanvraag.

**Resultaat:** een begrijpelijke eerste briefing, geen boekingsbevestiging.

### U-03 — Ik weet al welke locatie ik zoek

1. Bezoeker opent `/locaties` en vult zoekterm/regio/personen in.
2. Past facetten aan (sfeer, opstelling, duurzaamheidswensen, faciliteiten).
3. Ziet aantal resultaten, kaarten en lijst-/regioweergave.
4. Opent een locatiepagina of link naar Greenbookings.
5. Kan vanaf locatie doorklikken naar passende **eventconcepten**: inspiratie terug de funnel in.

**Resultaat:** een functionele locatiezoeker zonder gedwongen inspiratiewizard.

### U-04 — Ik zoek een leverancier

1. Bezoeker opent `/leveranciers` of klikt op een maker binnen een concept.
2. Selecteert vakgebied, bijvoorbeeld techniek, catering, eventorganisatie of entertainment.
3. Ziet alleen partijen uit de gecontroleerde Greenbookings-bron die in die categorie horen.
4. Opent toelichting en officiële bronprofiel-URL, of voegt een leverancier toe aan het plan.

**Resultaat:** leveranciers worden ook onafhankelijk van de locaties gevonden.

### U-05 — Zoekt via Google / AI-zoekmachine

1. Een inhoudelijke, indexeerbare landingspagina beantwoordt een concrete vraag, bijvoorbeeld `Een kennisfestival organiseren`.
2. Er staat **werkelijke unieke informatie**: voorbeelden, programma, geschikte omstandigheden, rollen en passende partijen.
3. Er zijn relevante interne links naar concepten, locaties en makers plus bronverwijzingen.
4. De gebruiker krijgt dezelfde functionele acties als bij intern navigeren.

**Resultaat:** organische ontdekking op meerdere intenties, zonder kopiepagina's.

## 5. Informatiearchitectuur en routes

**Voorstel voor productie; oude demo-URLs blijven via 301/compatibiliteit werken.**

```
/
├── /eventconcepten
│   ├── /op-gevoel
│   ├── /[concept-slug]
│   └── /categorie/[categorie-slug]           (alleen als inhoudelijk zinvol)
├── /locaties
│   └── /[locatie-slug]
├── /leveranciers
│   ├── /categorie/[categorie-slug]
│   └── /[leverancier-slug]
├── /mijn-plan
├── /inspiratie                           (redactionele verdiepingen)
│   └── /[artikel-slug]
├── /over-top-locaties
├── /contact
├── /privacy
└── /admin                                (afgeschermd)
    ├── /dashboard
    ├── /concepten
    ├── /concepten/[id]
    ├── /locaties
    ├── /leveranciers
    ├── /matches
    ├── /media
    ├── /seo
    ├── /data
    ├── /instellingen
    └── /gebruikers
```

**Basisnavigatie:** `Eventconcepten` · `Kies op gevoel` · `Locaties` · `Leveranciers` · `Over`. CTA `Maak jouw plan`, alleen prominent tonen als gebruiker een concept of selectie heeft; anders `Ontdek de ideeën`.

**Globale UX:** één rustige, herkenbare header en footer, duidelijke breadcrumbs op detailpagina's, geen zware modals voor volledig conceptverhaal, sticky conceptsectienavigatie, mobiele navigatie met focusmanagement, Nederlandse foutmeldingen.

## 6. Homepage — schermspecificatie

| Sectie | Elementen | Interactie | Contentbron |
|---|---|---|---|
| H-01 Hero | Groot beeld, typografische merkclaim, menu | Scroll naar gevoel / concept | Redactioneel |
| H-02 Intro | Waarom beginnen bij een gevoel | Link naar werkwijze | Redactioneel |
| H-03 Gevoelskompas | 6 sterke, grafische keuzes | 1–2 gevoelens + matches | Gevoelentaxonomie + conceptmappings |
| H-04 Uitgelicht concept | Beeld, verhaal, tags, nummering | Open volledig concept | Gepubliceerd concept |
| H-05 Andere concepten | Artistieke kaartselectie | Categorie-/gevoelverkenning | Gepubliceerde concepten |
| H-06 Van idee naar uitvoering | 3 bouwstenen: concept/locatie/maker | Open de betreffende collectie | Canoniek netwerk |
| H-07 Inspiratie | 3 redactionele verhalen | Open artikel | Eigen redactie; optioneel Greenbookings-verwijzing |
| H-08 Impact/verbinding | Korte uitleg samenwerking | Bronlink naar Greenbookings | Bron- en merkcopy |
| H-09 Footer | Merk, domeinen, contact, juridisch | Navigatie | Siteconfig |

**Acceptatie H-01:** maximaal één primaire CTA per grote sectie, geen zoekformulier dat de editorial hero overheerst, exact volgens design system. Home mag niet volledig afhankelijk zijn van dynamische JavaScript om basisinhoud te tonen.

## 7. Gevoelskompas — volledig gedrag

### 7.1 Taxonomie (MUST)

| Slug | Label | Korte vraag/verklaring |
|---|---|---|
| `energie` | Energie | Moeten gasten met nieuwe energie naar huis gaan? |
| `verbinding` | Verbinding | Wil je dat mensen elkaar echt ontmoeten? |
| `verwondering` | Verwondering | Moet de bijeenkomst onverwacht en bijzonder zijn? |
| `rust` | Rust | Is aandacht en ruimte voor gesprek belangrijk? |
| `focus` | Focus | Moet er een helder resultaat uitkomen? |
| `trots` | Trots | Wil je samen een prestatie of mijlpaal vieren? |

### 7.2 Frontend-state

```
selectedFeelings: Feeling[] // 0, 1 of 2; max = 2
matches: Array<{conceptId, matchedFeelings[], reason, rank}>
loading: boolean
error: string | null
```

- Klik op een niet-geselecteerd gevoel als 0/1 geselecteerd: toevoegen.
- Klik op reeds geselecteerd: verwijderen.
- Bij derde klik: het **oudst geselecteerde gevoel vervangen**; toon een subtiele statusmelding `Je kunt twee gevoelens kiezen` (de huidige prototype-interactie werkt zo).
- Resultaten herberekenen zonder paginareload.
- `Reset` verwijdert beide gevoelens; basisredactionele suggesties blijven zichtbaar.
- Selecties voor gebruiker transparant in URL-query (`?gevoel=verbinding,rust`) of tijdelijke clientstate; navigatie terug moet toestand herstellen.
- Gevoelskleuren zijn decoratief, nooit de enige betekenisdrager.
- Resultaten hebben titel, rationale, gevoelslabels, categorie en actie `Bekijk het concept`.
- Geen procentuele matchzekerheid bij redactionele tags.
- Toegankelijkheid: native buttons, `aria-pressed`, live region met rustige aankondiging van nieuwe resultaten.

### 7.3 Matchlogica versie 1

De redactie koppelt per concept 1–4 gevoelens met `weight` tussen 1 en 5 en een concrete toelichting (het datamodel staat ook 0 toe om een gevoel te deactiveren). Een eenvoudige formule is voldoende:

```
matchScore = SUM(weight van iedere geselecteerde emotie die het concept heeft)
           + editorialPriority * 0.1
```

Daarna: 1) niet-gepubliceerde concepten weg; 2) sorteren op score; 3) ties stabiel op prioriteit en titel; 4) maximaal 3 verschillende concepten; 5) tekstueel toelichten waarom. De score is **alleen intern**.

Bij 0 gevoelens: 3 uitgelichte concepten volgens redactionele volgorde. Bij geen passende gevoelsmatch: toon 3 goede alternatieven, geen nulresultaat. Elk concept mag tags hebben, maar geen gevoel mag verplicht 1-op-1 aan een categorie hangen.

### 7.4 LATER

- Visuele moodboardmodus: bezoekers kiezen uit originele fotografie in plaats van woorden.
- Korte intakevraag `Wat moeten gasten na afloop denken of doen?`.
- Anonieme feedback `Past dit bij wat je zoekt?` om redactionele matches te verbeteren.
- Eventconcepten aanbevelen uit combinatie van gevoel + doel + groepsgrootte, maar altijd uitlegbaar.

## 8. Eventconceptenoverzicht

**Filters:** categorie (kennis, relatie, vieren, team, netwerken, lancering, cultuur), gevoelens, groepsgrootte (alleen waar conceptredactie een indicatie geeft), duur (halve dag, dag, avond, meerdaags), binnen/buiten, eventueel seizoen.

**Sorteer:** redactioneel uitgelicht (default), nieuw, alfabetisch. Geen fictieve populariteit.

**Kaart:** grote titel, één zin, foto, conceptlabel, 2–3 gevoelens, duur/groepsindicatie en duidelijke link. Variatie in beeldformaat mag; kaartfunctionaliteit blijft consistent.

**Zoeken:** zoekterm in conceptnaam, categorie, verhaal en tags. Debounce 250–400 ms, URL-update na expliciete query of gecontroleerde routerstate, resetknop, zichtbaar aantal resultaten.

**SEO:** indexeer overzicht en unieke categoriepagina's; ad-hoc filtercombinaties bij voorkeur niet als zelfstandige indexeerbare pagina's.

## 9. Eventconceptdetail — belangrijkste contentpagina

De huidige enorme popup is uitdrukkelijk **niet** het te herhalen patroon. Alles is één volwaardige, semantische en crawlbare detailpagina.

| Volgorde | Functionele sectie | Verplichte data / actie |
|---|---|---|
| C-01 | Hero | Titel, propositie, sfeerbeeld, doelgroep, indicatie groepsgrootte en duur |
| C-02 | Gevoelsignatuur | 2–3 waarden en link `Kies opnieuw op gevoel` |
| C-03 | Het idee | Narratief: waarom, wat beleven gasten, voor wie, concrete opbrengst |
| C-04 | Waarom anders | 3 onderscheidende elementen, liever concreet dan slogans |
| C-05 | Zo ziet het eruit | Minimaal 4 programmafases, tijden indien voorbeeld, beeld |
| C-06 | Wat heb je nodig? | Benodigde rollen (techniek, catering, hosts, productie, etc.) |
| C-07 | Aanbevolen locaties | 3–6 matches met reden en echte bronlinks; optie alle passende locaties |
| C-08 | Aanbevolen makers | 3–8 leveranciers met rol en matchreden; alternatief per vakgebied |
| C-09 | Variaties | Compacte uitvoering, bijzondere uitvoering, alternatief bij nat weer (waar relevant) |
| C-10 | Maak jouw plan | Selectie bewaren/kopiëren/downloaden en later vervolgactie |
| C-11 | Verder ontdekken | Gerelateerde concepten en categorieën |

### Redactioneel verplicht per concept

- Eén eigen, overtuigende propositie in maximaal 200 tekens.
- Verhaal van circa 200–500 woorden (richtlijn), door mensen gecontroleerd.
- Unieke koppen en concrete voorbeelden; geen tekst die eenvoudig voor elk ander concept kan worden hergebruikt.
- 3–5 doelstellingen / resultaten, géén resultaatgarantie.
- Geschikt/ongeschikt: wanneer werkt het concept wel of juist niet?
- Beeldrechten, credits, alt, eventuele vermelding `SFEERBEELD TER INSPIRATIE`.
- Programma is een voorbeeld en geen vast arrangement of automatische offerte.

### Matchgedrag binnen concept

- Default 3 redactionele matches; knop `Meer locaties die passen` opent gefilterde locatiezoeker, behoudt conceptcontext.
- Iedere locatiekaart heeft onderbouwing: `Waarom past deze locatie bij dit concept?`.
- Hard filters (personen/regio/toegankelijkheid) vervangen de redactionele voorkeur waar nodig. Een mooie match die feitelijk te klein is, wordt niet als geschikt gemarkeerd.
- Niet-bevestigde voorwaarden worden met `Op aanvraag / te verifiëren` gemarkeerd.
- Leveranciers zijn gekoppeld aan rollen, niet willekeurig naast locatiecards gezet.
- Als geen leveranciers in een rol bekend zijn: rol tonen met `Nog geen geverifieerde partner in deze categorie`, plus link naar de Greenbookings-zoeker.

## 10. Locaties ontdekken — volledige zoekpagina

### 10.1 Zoekbalk en facetten

| Filter | Type | Logica |
|---|---|---|
| Zoekterm | Tekst | Naam, plaats, regio, kenmerken; normaliseer accenten/hoofdletters |
| Provincie | Select/multiselect | Match op 12 Nederlandse provincies |
| Plaats | Zoekveld/autocomplete | Geverifieerde plaatsnaam |
| Personen | Positief geheel getal | **Minimale benodigde capaciteit**; niet "max 100" verwarren met "vanaf 100" |
| Opstelling | Select | Theater, school, U-vorm, carré, diner, receptie, cabaret |
| Sfeer | Multi, of één volgens bron-API | Industrieel, modern, klassiek, landelijk, luxe, creatief, huiselijk |
| Duurzaamheid | Multiselect | Alleen bron-geverifieerde kenmerken |
| Faciliteiten | Multiselect | Parkeren, laadpalen, OV, rolstoel, wifi, buiten, etc. |
| Overnachten | Boolean | Uitsluitend als bron dit ondersteunt |
| Concept | Optionele context | Gerangschikt op inhoudelijke match plus harde filtercriteria |
| Alleen aangesloten partners | Geen publieke toggle | **Altijd aan en server-side afgedwongen**; bezoekers kunnen dit niet uitschakelen |

De publiek gedocumenteerde Greenbookings-API ondersteunt de meeste bronfilters; concepttags en emotie komen uit de eigen redactionele laag. Sommige bronvelden kunnen bij gratis profielen ontbreken.

### 10.2 Gedrag en resultaten

- Server-render eerste pagina inclusief naam, plaats, beschrijving, gecontroleerd beeld en bronlink.
- Toon werkelijk aantal matches vanuit API/index, niet slechts het aantal zichtbare kaarten.
- Paginering via `start/limiet` of cursor in lokale index; geen gefingeerd 'alle locaties geladen'.
- Default 24 kaarten per pagina in eigen index; bij direct bron-API maximaal 50 per request.
- Alle filters als URL-query zodat delen/terugknop werkt.
- `Reset alles`, lijstweergave en editorial beeldenraster; kaartweergave alleen als echte coördinaten bekend en toestemming/kaartdienst passend is.
- Iedere kaart toont: echte naam, plaats, type/sfeer, capaciteit als bron bekend, duurzaamheidstags alleen als bevestigd, bronlink.
- Fallback wanneer afbeelding ontbreekt: ontworpen typografische placeholder met locatiecategorie, géén ongerelateerde stockfoto.
- Bij onbekende capaciteit niet automatisch voldoen aan een expliciete personenfilter. Toon eventueel een afzonderlijke sectie `Capaciteit nog te bevestigen`.
- Bij API-storing: laatste geldige index met `Informatie mogelijk niet actueel`, geen misleidende actuele resultaten.

### 10.3 Detailpagina locatie

- Bovenaan origineel beeld (of benoemde placeholder), naam, plaats, karakter en één zin.
- Informatie: verhaal, eventmogelijkheden, ruimte-/zaalsoorten, capaciteit per opstelling **als bekend**, faciliteiten, duurzaamheid, praktische kenmerken.
- `Past bij deze concepten` met eigen editorial onderbouwing (unieke Top Locaties-waarde).
- `Bijpassende leveranciersrollen` zonder implicatie van een bestaand commercieel arrangement.
- CTA `BEKIJK DE LOCATIE BIJ GREENBOOKINGS ↗` naar de exacte `url` uit de bron.
- Greenbookings is leidend voor actuele aanvraag-, contact- en detailgegevens.
- Bij inactieve/verwijderde bron: geen 'boekbaar'-status; 404/410 of relevante vervangingen volgens SEO-beleid.

## 11. Leveranciers — gids, detail, rollen

### 11.1 Categorieën

Gebruik als start de bestaande Greenbookings-categorieën: eventbureau, techniek/AV, catering, inrichting, styling, entertainment, sprekers, dagvoorzitters, foto/video, registratie/software, hosts, beveiliging, vervoer, toegankelijkheid/vertaling, duurzame oplossingen en overige branchespecifieke diensten. Houd de canonieke categorie als bronattribuut; eigen redactionele thema's staan apart.

### 11.2 Gids

- Alle actieve, publiek presenteerbare leveranciers tonen zodra een gecontroleerde bron beschikbaar is; sponsors/mediapartners alleen tonen als hun rol relevant is en correct is gelabeld.
- Zoek op naam, vakgebied, regio, expertise, relevante concepten en unieke propositie.
- Filters per categorie, regio en eventueel dienstverlening; vaste categorie-URL's krijgen echte unieke introductietekst.
- Gespecialiseerde leveranciers kunnen meerdere categorieën hebben, maar één canoniek profiel.
- Overzichtkaart bevat naam, vakgebied, korte omschrijving, echte afbeelding of ontworpen tekstkaart, bronlink, eventueel gekoppelde concepten.
- Bovenstaande functie is **niet afhankelijk** van een rechtstreekse publieke leveranciers-API. Een gecontroleerde import/feed is toegestaan.

### 11.3 Detail leverancier

- Persoonlijke presentatie van expertise, werkwijze, typerende rol, regio en relevante concepten.
- Vertrouwde bronlink en optionele geverifieerde case(s).
- CTA `BEKIJK BIJ GREENBOOKINGS ↗` of `VOEG TOE AAN PLAN`.
- Geen automatische claim dat leverancier en een locatie al samenwerken.
- Een leverancier kan op tientallen contextuele conceptpagina's voorkomen, mits elke vermelding inhoudelijk relevant is.

### 11.4 Leveranciersmatching

Maak per concept een lijst `supplierRoles`: bij festival bijvoorbeeld `technische productie`, `catering`, `registratie`, `hosts`, `experience design`. Koppel één of meer geverifieerde supplierprofielen per rol, met eigen `why`-tekst. Als één leverancier meerdere rollen kan invullen, mag hij in de composer maar één keer worden geselecteerd.

## 12. Mijn plan — van inspiratie naar actie

### 12.1 Datamodel van een conceptplan

```
conceptId: string
selectedFeelings: string[]
venueId: string | null
supplierIds: string[]
attendeeCount?: number
eventDate?: ISODate
regionPreference?: string
notes: string
status: 'draft' | 'shared' | 'submitted'
createdAt, updatedAt
```

### 12.2 Acties (MUST)

1. **Selecteer locatie:** maximaal één; keuze wordt visueel en tekstueel bevestigd. Een tweede locatie vervangt de vorige na expliciete actie; bij vergelijking meerdere favorieten apart opslaan.
2. **Selecteer leveranciers:** 0–n; togglen en terugdraaien mogelijk.
3. **Maak overzicht:** conceptnaam, gevoelens, gekozen partijen, hun rollen en bronlinks, indicatieve programmaopzet, eventuele open vragen.
4. **Kopieer:** platte Nederlandse tekst, zonder persoonsgegevens. Clipboardfallback via selecteerbare tekst.
5. **Download PDF (SHOULD):** nette merk-PDF met `VOORSTEL / GEEN BEVESTIGDE BOEKING`, bronnen en tijdstip. Server of browsergeneratie na techkeuze.
6. **Delen via link (LATER):** unieke, niet te raden link met alleen gedeelde informatie en duidelijke privacyinstellingen.
7. **Aanvraag (LATER of na afstemming):** een afzonderlijke, expliciete consentflow, géén stille automatische verzending naar leveranciers.

### 12.3 Opslag

MVP zonder login: lokale browseropslag voor conceptkeuzes en favorieten, geen contactgegevens, plus directe kopie/export. De gebruiker moet kunnen wissen. Bij accounts later: server-side opslag per eigenaar met RLS of gelijkwaardige autorisatie.

### 12.4 Aanvraagroute naar Greenbookings

Greenbookings heeft al aanvraagflows waarbij een aanvraag met maximaal drie passende partijen wordt gedeeld. Een toekomstige Top Locaties-integratie mag de gebruiker niet onverwacht in meerdere aanvraagflows laten belanden. Voor release 1 is **doorklikken naar het juiste bronprofiel of de bestaande aanvraagpagina** de veiligste standaard. Voor een geïntegreerde aanvraag is een formele afstemming nodig over toestemming, status, overdracht, deduplicatie en terugkoppeling.

## 13. Zoeken, aanbevelen en redactionele kwaliteit

### 13.1 Twee systemen, duidelijk gescheiden

1. **Harde filters** sluiten daadwerkelijk ongeschikte kandidaten uit: bijvoorbeeld een bekende capaciteit lager dan het gevraagde aantal of een expliciet niet-aangeboden faciliteit. Een ontbrekende bronwaarde is `unknown`, nooit automatisch `true`.
2. **Zachte relevantie** rangschikt de overblijvende kandidaten op een verklaarbare match met het concept, het gevoel en de actuele voorkeuren.

`sfeer` van een locatie (bijvoorbeeld industrieel, klassiek) is **niet** hetzelfde als het **gevoel van het evenement** (bijvoorbeeld verbinding, verwondering). Houd de taxonomieën en databasevelden gescheiden.

### 13.2 Transparante conceptmatching

De hoofdingang gebruikt zes gevoelens: **Energie, Verbinding, Verwondering, Rust, Focus en Trots**. De gebruiker selecteert maximaal twee, zonder verplichte volgorde. Voor elk gepubliceerd concept legt de redactie `feeling_weights` van 0–5 vast, met ten minste één hoofdgevoel. Bereken voor geselecteerde gevoelens de som van de genormaliseerde gewichten. Sorteer met stabiele tie-breakers: `editorial_priority`, dan titel. De interface zegt bijvoorbeeld `Past bij jouw keuze voor verwondering en verbinding`, niet `98% AI-match`.

Bij nul geselecteerde gevoelens toon je redactioneel uitgelichte concepten. Bij één gevoel ontstaat geen straf voor een ontbrekend tweede gevoel. Bij twee gevoelens kunnen concepten voor één gevoel nog worden getoond, maar de uitlegregel zegt expliciet waarop ze passen. De top drie is een **preview**, met link naar alle matches.

### 13.3 Locatieranking per concept

Een aanbevolen locatie krijgt optioneel een **redactioneel vastgelegde match** via `concept_venue_matches` met `why`, `sort_order`, `featured`, en `verified_at`. Aanvullend mag dynamisch sorteren plaatsvinden met de volgende startgewichten (later configureerbaar en op werkelijke resultaten te testen):

| Relevantiecomponent | Gewicht | Bron |
|---|---:|---|
| Expliciete redactionele conceptmatch | 40 | Matchrelatie met toelichting |
| Passende sfeer / ruimtelijke kenmerken | 20 | Gevalideerde locatietags |
| Geschikt voor doel en werkvorm | 15 | Typologie, faciliteiten en curator-tags |
| Regio-afstand tot bezoekervoorkeur | 10 | Regio / coördinaten als beschikbaar |
| Capaciteit of opstelling passend | 10 | Geverifieerde bronwaarden |
| Extra bevestigde wensen | 5 | Overnachten, toegankelijkheid, duurzaamheid |

**Dit is een voorgesteld rangschikkingsmodel, geen feitelijke geschiktheidsscore.** Geen percentage presenteren aan bezoeker. Bij redactioneel aanbevolen locaties is de schriftelijke reden leidend. Een handmatige match mag nooit een hard veiligheids-/capaciteitsfilter overrulen.

### 13.4 Leveranciersrangschikking

Eerst matchen op **benodigde leveranciersrol** van het concept; daarna op vakgebied, bedieningsregio, expliciete redactionele toelichting en verifieerbare expertise. De gebruiker ziet `Waarom deze maker?` met feitelijke reden. Niet automatisch veronderstellen dat een leverancier bij een locatie is inbegrepen of dat beide organisaties samenwerken.

### 13.5 Anti-ruisregels

- Niet in de eerste zes aanbevelingen drie keer hetzelfde type of exact dezelfde provincie tonen als er vergelijkbare alternatieven zijn, behalve wanneer harde filters dat logisch maken.
- Geen willekeurige betaalde plaatsing; eventuele sponsoring strikt labelen en de inhoudelijke match niet vervalsen.
- Gecontroleerde fallback wanneer slechts twee goede kandidaten bestaan: toon twee, niet een opgevulde derde.
- Resultaten altijd uitlegbaar via actieve filters en matchreden.
- Redactie kan featured posities kiezen, maar wijziging is gelogd.
- Zoektermen met typfouten mogen tolerant zijn; behoud exacte naamzoekfunctie.

### 13.6 Zoekgedrag en speciale gevallen

| Situatie | Gedrag |
|---|---|
| Geen zoekterm of filters | Alleen actieve, geverifieerde aangesloten Greenbookings-locaties, redactioneel relevante sortering |
| Geen resultaten | Leg uit welke filters te streng zijn; bied afzonderlijk reset, verwante regio's en concepten aan |
| Lange zoekterm / diacritica | Normaliseer voor zoekindex, behoud originele schrijfwijze in UI |
| Verkeerd getal voor personen | Valideer en toon veldfout; nooit negatieve of astronomische query versturen |
| Bronrecord zonder foto | Eigen ontworpen typografische placeholder |
| Bronrecord zonder capaciteit | Niet als expliciet capaciteitsgeschikt labelen |
| Verwijderde locatie | Uit resultaten verwijderen; SEO-status afhandelen zoals §20 |
| Wissel concept na samenstellen | Vraag of eerder gekozen locatie/leveranciers in plan mogen blijven; markeer mogelijk mismatch |
| Wissel twee gevoelens | Matches direct herberekenen; bewaar vorige keuze voor herstel via browserterug |

## 14. Data-integratie Greenbookings

### 14.1 Broncontract: eerst ontdekken, dan implementeren

Bij start moet Claude Code de live OpenAPI-specificatie inspecteren. Leg per veld exact vast: naam, type, nullable, voorbeeld, bron-URL, update-eigenaarschap en publiceerbaarheid. De in dit document genoemde API-filters zijn geverifieerd op de ontwikkelaarspagina; **details van de exacte JSON-respons, fotorechten en velden moeten uit de echte specificatie komen**. Neem niet aan dat elk record elke filter ondersteunt.

### 14.2 Import van uitsluitend aangesloten locaties — worker / cron

1. Vraag uitsluitend partnerpagina's op met `GET https://greenbookings.nl/api/v1/locaties?alleen_partners=true&limiet=50&start=0`, daarna start 50, 100, enzovoort tot de gedocumenteerde stopconditie. Controleer bij het bouwen of de OpenAPI `true` exact zo verwacht, en gebruik de gedocumenteerde serialisatie.
2. Gebruik server-side fetch, back-off bij `429`, maximaal afgesproken requesttempo ruim onder **600 aanvragen/uur/IP**; geen per-bezoeker massale bronrequests.
3. Valideer JSON tegen de opgehaalde OpenAPI-typen; markeer foutieve records zonder volledige batch te laten vallen.
4. Verifieer een **expliciete, positieve aangesloten-status** op recordniveau als de API dit veld levert. Een record mag alleen publiek verschijnen wanneer de bronfilter bevestigd én de partnerstatus positief gevalideerd is. Als de API geen afzonderlijke partnerstatus teruggeeft: verifieer aantoonbaar dat de gefilterde endpoint uitsluitend partners levert, en leg die broncontractbeslissing vast. **Bij onzekerheid niet publiceren**.
5. Upsert per stabiele bron-ID of, als die niet bestaat, gecontroleerde bron-slug. Sla bron-URL, bronstatus, `first_seen_at`, `last_seen_at`, `last_synced_at`, `source_updated_at` (alleen indien aangeleverd), genormaliseerde velden en bronhash op.
6. Detecteer verwijderingen én verlies van partnerstatus via een **voltooide partner-snapshot** (alle partnerpagina's succesvol). Partnerstatus die vervalt moet **onmiddellijk tot depublicatie uit publieke resultaten leiden** zodra dit betrouwbaar is vastgesteld. Bij onvolledige sync geen massale deactivaties.
7. Haal detailinformatie op voor records die wijzigen of nieuw zijn. Pagina-import en detail-verrijking zijn apart gequeue'd; bepaal tempo op basis van bronlimiet.
8. Een sync mag meermaals worden uitgevoerd zonder dubbele records, dubbele media of onnodig vervangen redactionele tekst.
9. Publiceer `last_successful_sync_at`, aantallen aangesloten, toegevoegd/gewijzigd/uitgesloten/inactief, fouten en bronlimiet-waarschuwingen in `/admin/data`.

De algemene 3.225 vermeldingen horen **niet** in de import. De omvang van de partner-subset moet bij de eerste broninspectie worden vastgesteld. De worker gebruikt paginering met limiet 50, ongeacht de uiteindelijke omvang. Detailverrijking blijft een achtergrondtaak, geen request op paginaweergave.

### 14.3 Datagrens en eigenaarschap

**Bron-geleide velden:** officiële naam, adres/regio, URL, praktische gegevens, capaciteiten, classificaties, eventueel media en aansluiting/status. **Top Locaties-eigen velden:** redactionele introductie, conceptuele toepassing, gevoelens, matchreden, uitgekozen fotografie binnen rechten, sortering. Sync wijzigt nooit Top Locaties-eigen editorial velden. Broncorrecties gebeuren in Greenbookings waar mogelijk.

### 14.4 Leveranciers — aparte gecontroleerde import

- Blokkeer de leveranciers-synchronisatie totdat eigenaar van Greenbookings een **rechtmatige gegevensbron** levert (read-only endpoint, export of overeengekomen feed).
- Maak alvast `SupplierSourceAdapter` met `fetchPage`, `normalize`, `validate`, `upsert`, `markInactive`; test met expliciete mockfixtures.
- Import van aangesloten én gratis publiek presenteerbare leveranciers waar overeenkomst/licentie dat toestaat, inclusief juiste partnercategorie.
- Geen publiek webscrapen als verborgen fallback; geen bedrijfsprofielen reconstrueren uit ongecontroleerde zoekresultaten.
- Externe logo's en portfoliofoto's alleen gebruiken als gebruiksrecht bevestigd is.

### 14.5 Foutbestendigheid

| Fout | Gedrag op site | Gedrag in beheer |
|---|---|---|
| Bron niet bereikbaar | Laatste gevalideerde index; subtiele actualiteitsvermelding waar nodig | `sync_failed`, technische fout, retry |
| Rate limit | Geen extra parallelle requests; wachten/back-off | Waarschuwing en nieuwe planning |
| Veldnaam gewijzigd | Record in quarantine; bestaand profiel behouden | Schema-drift alarm |
| Dataset plots 70% kleiner | **Stop massale deactivaties** en vraag beheerreview | Drempelalarm |
| Geen toestemming beeld | Editorial placeholder tonen | `media_permission_required` |
| Leveranciersfeed ontbreekt | Overzicht alleen publiceren als er betrouwbare inhoud is; anders eerlijke tijdelijke staat | Integratie als open blokkade |

## 15. Gegevensmodel en relaties

Het technische referentiemodel staat ook in `SQL-DATAMODEL-REFERENTIE.sql`. De SQL is een **voorstel voor een nieuwe PostgreSQL/Supabase-opzet**, geen migratie voor de huidige Greenbookings-productiedatabase.

### 15.1 Entiteiten

| Entiteit / tabel | Primaire velden | Eigenaar |
|---|---|---|
| `feelings` | `id`, `slug`, `label`, `description`, `shape_token`, `sort_order` | Redactie/design |
| `concepts` | `id`, `slug`, `title`, `eyebrow`, `intro`, `story`, `audience`, `goal`, `duration_label`, `status`, `published_at`, `featured_rank`, `seo_*` | Redactie |
| `concept_feelings` | `concept_id`, `feeling_id`, `weight`, `editorial_explanation` | Redactie |
| `concept_program_items` | `concept_id`, `position`, `duration_label`, `title`, `description` | Redactie |
| `concept_supplier_roles` | `concept_id`, `role_code`, `label`, `why_needed`, `sort_order` | Redactie |
| `venues` | `id`, `source_id`, `source_slug`, `name`, `city`, `province`, `source_url`, `capacity_*`, `facilities`, `partner_verified`, `partner_verified_at`, `status`, `last_seen_at`, `source_payload` | Greenbookings partner-sync |
| `suppliers` | `id`, `source_id`, `name`, `slug`, `category`, `service_regions`, `source_url`, `listing_kind`, `status`, `source_payload` | Greenbookings gecontroleerde feed |
| `concept_venue_matches` | `concept_id`, `venue_id`, `why`, `featured`, `sort_order`, `verified_at` | Redactie |
| `concept_supplier_matches` | `concept_id`, `supplier_id`, `role_id`, `why`, `sort_order`, `verified_at` | Redactie |
| `media_assets` | `entity_type`, `entity_id`, `url`, `alt`, `rights_status`, `credit`, `display_order` | Bron / redactie |
| `sync_runs` + `sync_run_errors` | `source`, `started_at`, `ended_at`, `status`, `stats`, `error` | Worker |
| `editorial_revisions` | `entity_type`, `entity_id`, `author_id`, `snapshot`, `action`, `created_at` | Beheer |
| `admin_memberships` | `user_id`, `role`, `enabled` | Platformbeheer |
| `saved_plans` (LATER) | `owner_id`, `concept_id`, `selected_*`, `notes`, `share_token_hash`, `expires_at` | Eigenaar / opt-in |
| `analytics_events` | `event_name`, `entity_id`, `source_context`, `created_at`, geaggregeerde eigenschappen | Analytics met privacyregels |

### 15.2 Relaties

- `concepts` ⇄ `feelings` = many-to-many met gewichten.
- `concepts` ⇄ `venues` = many-to-many met matchreden.
- `concepts` ⇄ `suppliers` = many-to-many met matchreden en **leveranciersrol**.
- `concepts` → `concept_program_items` = one-to-many, expliciet geordend.
- `concepts` → `concept_supplier_roles` = one-to-many, expliciet geordend.
- `venues` en `suppliers` hebben een unieke sleutel per bronsysteem; de redactionele koppelingen blijven bestaan als het record tijdelijk inactief wordt, maar verschijnen niet publiek totdat de bron weer actief is.

### 15.3 Schema- en integriteitseisen

- Unieke `slug` per entiteit, `source_id` per bron, en unieke join-relaties.
- `status` als expliciete enum/constraint (`draft`, `review`, `published`, `archived` voor concepten; `active`, `inactive`, `quarantined` voor bronrecords).
- `weight` integer 0–5, `sort_order` niet-negatief, datumvelden in UTC.
- `source_payload` alleen als gecontroleerd, beperkt JSONB-auditgegeven; geen onbedoelde privévelden opslaan.
- `media_assets` zijn niet publiek zolang `rights_status` geen goedgekeurd publicatierecht aangeeft.
- Index op `concepts(status, published_at)`, `venues(status, province, city)`, slug/bron-ID, gevoel-joins, categorie/serviceregio en tekstzoekkolommen.
- RLS of gelijkwaardig op admin mutaties en privéplannen; de anonieme frontend mag alleen gepubliceerde redactionele informatie en publiek bedoelde bronvelden lezen.

### 15.4 API-contracten van Top Locaties zelf (voorgesteld)

Deze routes zijn **nieuwe interne app-routes**, niet bestaande Greenbookings-endpoints:

| Methode / route | Inhoud | Cache / rechten |
|---|---|---|
| `GET /api/concepts` | Gepubliceerde concepten, query op gevoel/thema | Publiek, CDN/cache |
| `GET /api/concepts/:slug` | Detail, programma en contextuele matches | Publiek, cache met invalidatie |
| `GET /api/venues` | Gepagineerde **uitsluitend aangesloten** actieve partnerlocaties met gevalideerde facetten | Publiek, indexed + cache; partnerfilter niet te overriden |
| `GET /api/venues/:slug` | Publiek detail met extra redactionele context | Publiek, broncache |
| `GET /api/suppliers` | Actieve publiek toegestane leveranciers | Publiek zodra feed beschikbaar |
| `GET /api/suppliers/:slug` | Detail + conceptcontext | Publiek zodra feed beschikbaar |
| `POST /api/admin/sync/venues` | Synchronisatietaak triggeren, nooit inline duizenden fetches | Integratiebeheerder + CSRF/rate limit |
| `POST /api/admin/concepts/:id/publish` | Valideer en publiceer redactionele versie | Hoofdredacteur |

Maak concrete contractschemas met versiebeheer; beperk publiek geretourneerde velden. Frontend hoeft voor gewone pagina's niet eerst een client-side API-call te doen als SSR de gegevens al kan leveren.

## 16. Beheersysteem en redactionele workflow

### 16.1 Admin-structuur

| Route | Scherm | Functies |
|---|---|---|
| `/admin` | Dashboard | Conceptstatus, aangesloten locaties, leveranciers, syncgezondheid, ontbrekende beeldrechten, belangrijkste acties |
| `/admin/concepten` | Conceptbeheer | Zoeken, sorteren, statusfilter, nieuw, dupliceren als draft, archiveren |
| `/admin/concepten/nieuw` | Concepteditor | Schrijven, secties, doelgroep, eventdoel, duur, SEO |
| `/admin/concepten/:id` | Concepteditor | Visuele preview, feelings, programma, matched locaties, suppliers/rollen |
| `/admin/matches` | Matchbeheer | Relaties op concept-/locatie-/leveranciersniveau, uitleg, prioriteit, verifiëren |
| `/admin/locaties` | Aangesloten bronlocaties | Syncstatus, source link, bronwaarden, eigen toelichting, ontbrekende gegevens |
| `/admin/leveranciers` | Leveranciers | Bron/partnerstatus, categorieën, toelichting, mediarechten |
| `/admin/media` | Beeldredactie | Upload/verwijzing, rechten/credits, alttekst, uitsneden, inzet |
| `/admin/gevoelens` | Gevoelentaxonomie | Beschrijvingen, vormaccenten; zes basisgevoelens niet zomaar verwijderen |
| `/admin/data` | Bronbeheer | Adapterstatus, laatste geslaagde sync, logs, quarantine, telling partner-only |
| `/admin/seo` | Zoekzichtbaarheid | Metadata, redirects, sitemaps, indexatiecontrole, overlappreventie |
| `/admin/gebruikers` | Toegangsbeheer | Redacteur, hoofdredacteur, data-admin, platform-admin |
| `/admin/instellingen` | Site-instellingen | Externe links, meetinstellingen, privacyteksten, feature flags |

### 16.2 Concepteditor — verplichte velden

Voor publicatie vereist: unieke slug, titel, sterke introductie, wat het concept **is**, waarom het werkt, voor wie, gewenst resultaat, 1–2 hoofdgevoelens, beeld met gebruiksrecht **of** eigen ontworpen typografische presentatie, minimaal één voorbeeldprogrammasectie en minimaal één betekenisvolle leveranciersrol. Aanbevolen locaties mogen ontbreken als er nog geen passende **aangesloten** partnerlocaties zijn; dan benoemt de publieke UI eerlijk dat concrete locatievoorstellen volgen.

Concepten kunnen 3–6 redactionele voorkeurslocaties bevatten en optioneel extra dynamische matches. De beheerinterface toont uitsluitend records waarvan de aangesloten-status op dat moment waar is; het mag niet mogelijk zijn om een niet-aangesloten bronlocatie live te pinnen. Gearchiveerde concepten blijven voor redactionele geschiedenis maar verdwijnen uit publieke resultaten.

### 16.3 Publicatielifecycle

`draft → review → published → archived` (terug naar `draft` mogelijk met audit). Redacteur maakt/bewerkt en biedt ter review aan. Hoofdredacteur controleert inhoudelijke kwaliteit, beeldrechten, bronlinks, matchredenen en SEO, en publiceert. Publicatie triggert gerichte cache-invalidering/SSG-revalidatie en sitemapupdate. Terugdraaien naar eerdere versie kan via revision-snapshot. Geen auto-publicatie van door AI gegenereerde tekst.

### 16.4 Concept-template als beheervelden

De editor heeft vaste, begrijpelijke velden zodat niet elke redacteur een willekeurig design maakt:

1. `In één zin`: aansprekende belofte.
2. `Wat gebeurt er?`: concreet, geen marketingalgemeenheden.
3. `Zo voelt het`: gevoelentags met waarom.
4. `Voor wie`: team, vakpubliek, klanten, relaties, community.
5. `Het resultaat`: kennisdeling, trots, netwerk, focus, verbinding enzovoort.
6. `Zo zou de dag eruit kunnen zien`: tijdblokken en werkvormen.
7. `Ruimte & setting`: welke ruimtelijke eigenschappen vereist zijn.
8. `Passende aangesloten locaties`: echte matches met onderbouwing.
9. `Deze makers heb je nodig`: rollen, echte leveranciers en onderbouwing.
10. `Verder uitwerken`: selectie toevoegen aan persoonlijk plan.

### 16.5 Kwaliteitsregels in admin

- Inline waarschuwingen voor ontbrekende alttekst, verlopen beeldrechten, verouderde bevestiging, lege matchreden of niet-bestaande bronlink.
- Preview voor desktop én mobiel voordat gepubliceerd kan worden.
- Concept dupliceren kopieert content en gevoelens maar **niet** automatisch voormalige matchverificatie; die moet opnieuw worden bevestigd.
- Automatische spellingscontrole mag suggesties geven; niets zonder expliciet akkoord wijzigen.
- Bulkacties alleen voor niet-destructieve status en metadata; massaal verwijderen apart bevestigen en loggen.

## 17. Visueel ontwerp en interactiecontract

De overeengekomen designbron staat in `STYLE-GUIDE.md`, `COMPONENT-CONTRACTS.md`, `tokens.css`, `components.css` en `styleguide.html`. Dit functionele ontwerp is geen nieuw visueel voorstel. **Claude Code moet de bestaande visuele stijl conserveren en dezelfde componenten toepassen op alle nieuwe pagina's.**

### 17.1 Karakter, niet verhandelbaar

- Geen standaard SaaS-, makelaar- of booking-compositie; geen afgeronde kaarten met generieke paarse gradients.
- De uitstraling is **editorial, eigenzinnig, cultureel, levendig** met extreme typografische hiërarchie en zorgvuldig geplaatste fotografie.
- Display: **Archivo Black**, microcopy en UI-labels: **DM Mono**, lopende uitleg: **DM Sans**. Gebruik uitsluitend de exacte typetokens uit de designkit.
- Canonieke achtergrond-, zwart-, taupe-, koraal- en kobalttokens komen uit `tokens.css`; nieuwe willekeurige merkkleuren zijn verboden.
- Bold titels breken bewust over meerdere regels maar mogen nooit interactie, tekst of schermrand onbedoeld verbergen.
- Hoeken, borders, grids, buttons, hover, selectie en focus komen uit bestaande componentcontracten.
- Illustratieve eventbeelden mogen sfeer communiceren, maar niet de identiteit van een feitelijke locatie of leverancier voorstellen.

### 17.2 Designkritische componenten

| Component | Must-have states | Bijzonderheid |
|---|---|---|
| Header/navigatie | default, menu open, mobiel, focus | Consistent op concepten, locaties, leveranciers, admin met passende adminvariant |
| Emotiekaart | default, hover, selected, keyboard focus, disabled | Maximaal twee selecties, tekstlabel naast vorm |
| Concepttegel | default, hover, focus, selected in plan | Editorial typografie, duidelijke inhoud, geen decoratieve card-grid |
| Locatiekaart | loading, ready, no image, saved, unavailable | Naam en plaats direct zichtbaar, partnerverificatie verplicht |
| Leverancierkaart | loading, ready, no image, added | Vakgebied/rol duidelijk, geen ongefundeerde partnerschapsclaim |
| Search/filterbar | idle, typing, applied, invalid, no-results | URL-gedreven, mobiel bedienbaar |
| Conceptprogramma | normaal, mobiel, collapsed | Begrijpelijke tijdlijn/volgorde, geen overbodig animatiespektakel |
| Plancompositor | empty, partial, complete, export, error | Visuele samenvatting en duidelijk herroepen keuzes |
| Modal/drawer | open, close, backdrop, escape, focus-trap | Voor lange conceptbeschrijvingen geen beeldvullende onbruikbare overlay |
| Formulier | required, invalid, success, loading | Duidelijke feedback met echte betekenis |
| Bronstatus | current, stale, missing, excluded | Geen onjuist bericht over partnerstatus |

### 17.3 Beweging

Subtiele lineaire of op karakter gerichte reveal-animatie is toegestaan bij hoofdvisual en conceptwissel. Houd deze optioneel voor `prefers-reduced-motion`, respecteer toetsenbordbediening en vermijd scroll-jacking. Beweging ondersteunt het verhaal, niet het zoeken. Geen autoplay audio.

### 17.4 Responsief

- 1440+ desktop: uitgesproken asymmetrische editorial compositie, maar alle CTA's bereikbaar.
- 1024 tablet/kleine desktop: vloeiende schaal en twee kolommen indien logisch.
- 768 tablet: één/twee kolommen afhankelijk van inhoud, filters ingeklapt indien nodig.
- 390 en 360 mobiel: feeling-kiezers duidelijk, sticky `Mijn plan` alleen indien deze inhoud niet afdekt, locatiekaarten leesbaar, filterdrawer op volledige breedte of passend paneel.
- Elk nieuw template moet visueel op deze vijf breedtes worden beoordeeld, inclusief lange namen, kleine beeldformaten en Nederlandse afbreking.

## 18. AI-functies: optioneel, gecontroleerd

**Release 1 werkt zonder LLM.** De echte productinnovatie is de redactionele gevoelsmatching met geverifieerde Greenbookings-partners. Later mogen deze functies worden toegevoegd:

| Functie | Waarde | Veiligheids-/kwaliteitsgrens |
|---|---|---|
| Redactionele tekstassistent | Helpt concept intro, programma en SEO-tekst aanscherpen | Alleen suggesties in admin, altijd menselijke review |
| Conceptvarianten | Alternatieven voor gekozen doelgroep en sfeer | Geen verzonnen beschikbaarheid, locaties of leveranciers |
| Natuurlijk taal zoeken | `klein creatief teamfestival in Den Haag` → voorgestelde filters | Toon herkenbaar welke filters zijn afgeleid en laat wijzigen |
| Beeldanalyse van aangeleverd eventbeeld | Suggestie van sfeer/taxonomie | Alleen bij gebruiksrechten; nooit partnerstatus afleiden |
| Conceptbriefing uitbreiden | Kopieerbare programmarichtlijnen | Conceptueel, geen offerte of toezegging |

Geen externe betaalde AI-service zonder aparte toestemming. Invoer sanitiseren, geen privédata onnodig naar model sturen, data- en redactierechten afdwingen. AI-voorstellen mogen nooit via een automatische `published`-route live gaan.

## 19. SEO, vindbaarheid en vier-domeinenstrategie

### 19.1 Unieke inhoud per intentie

Top Locaties wint op **eventidee, gewenste beleving, hoe organiseer ik dit, welke setting en makers passen hierbij**. Greenbookings blijft de bron voor de officiële locatiedetails en duurzaamheidspropositie. De andere twee websites krijgen andere zoek- en informatie-intenties op basis van hun daadwerkelijke huidige inhoud (eerst auditen).

| Top Locaties-pagina | Primair intentiecluster | Eigen onderscheidende inhoud |
|---|---|---|
| `/eventconcepten/kennisfestival` | `kennisfestival organiseren`, `origineel congresconcept` | Verhaal, programma, beleving, makersrollen |
| `/eventconcepten/creatieve-teamdag` | `creatieve teamdag ideeën` | Opzet, groepsdynamiek, locatiesuggesties |
| `/eventconcepten/op-gevoel?gevoel=verbinding` | `event voor verbinding`, `teamverbinding activiteit` | Redactionele uitleg, daadwerkelijk passende concepten; querycombinaties niet automatisch indexeren |
| `/locaties` | `eventlocaties voor [concept]` | De **aangesloten** partners met conceptuele match; niet een kopie van de broncatalogus |
| `/locaties/:slug` | Locatie + relevante eventformats | Unieke, verifieerbare context; bronlink naar Greenbookings |
| `/leveranciers/:slug` | Supplier + conceptrollen | Makersrol en toegevoegde waarde, met bronverwijzing |

Geen vier min of meer identieke SEO-landingspagina's onder vier domeinen. Maak geen geïndexeerde combinaties voor elk willekeurig filter of elke automatisch gegenereerde gevoelsmix. Goede content krijgt een echte eigen hoofdvraag, redactionele kwaliteit en inhoud die op de andere sites niet staat.

### 19.2 Technische SEO-regels

- Eén canonieke URL per concept, leverancier en aangesloten locatie, op Top Locaties als die pagina voldoende unieke inhoud heeft.
- Zelf-refererende canonicals voor unieke Top Locaties-pagina's; waar inhoud vrijwel één-op-één de Greenbookings-bron herhaalt: voeg unieke context toe of gebruik passende `noindex`/canonical-beslissing, niet blind een tweede kopie indexeren.
- Paginering crawlbaar met echte links; filtercombinaties via URL state, in de regel `noindex` tenzij een redactionele landing met unieke waarde bestaat.
- XML sitemap alleen met gepubliceerde concepten, actuele aangesloten locaties met indexeerbare unieke pagina's, publiek toegestane leveranciers en redactionele landingspagina's.
- Bij het vervallen van een partnerstatus: depublicatie onmiddellijk; voormalige profiel-URL krijgt passend `410` of redirect naar een relevante aansluitende pagina. Nooit oude partnercontent blijven indexeren.
- `title`, `description`, `h1`, semantische headingvolgorde, breadcrumbs, OG-afbeelding met rechten, goede altteksten en server-side vindbare links.
- Alleen passende structured data (`Organization`, `BreadcrumbList`, `Article` indien werkelijk artikel, `Event` alleen voor **een echt aangekondigd concreet event**); eventconcepten niet als geboekte events markeren.
- Geen fabrieksmatige AI-locatiepagina's, doorway-sites of kunstmatige kruislinks tussen de vier domeinen.

### 19.3 Redactionele contentkalender

Start met een kleine sterke collectie (voorstel: 12 zorgvuldig uitgewerkte concepten, minstens één hoofdconcept per gevoel, uiteenlopende eventtypen), daarna 2–4 kwalitatieve nieuwe of bijgewerkte concepten per maand afhankelijk van resources. Crosslink naar locaties en suppliers op *relevantie*, niet om linkvolume op te voeren. Meet Search Console per domein en houd één rapport bij voor zoekvraag/positie/kannibalisatie.

## 20. Meten, privacy, compliance, toegankelijkheid

### 20.1 Analytics-eventtaxonomie

| Event | Verplichte dimensies | Doel |
|---|---|---|
| `feeling_selected` | `feeling_slug`, `selection_count` | Welke emoties inspireren? |
| `concept_viewed` | `concept_id`, `entry_point` | Interesse per concept |
| `concept_match_opened` | `concept_id`, `feeling_selection` | Matching effectief? |
| `venue_search_submitted` | veilige filtercategorieën, `result_count` | Welke venuebehoefte? |
| `venue_profile_viewed` | `venue_id`, `context` | Zichtbaarheid partners |
| `supplier_profile_viewed` | `supplier_id`, `context` | Zichtbaarheid makers |
| `plan_venue_added` | `venue_id`, `concept_id` | Stap naar samenstellen |
| `plan_supplier_added` | `supplier_id`, `role_code` | Relevantie makers |
| `plan_exported` | `type` (`copy`, `pdf`) | Bruikbaarheid |
| `outbound_greenbookings_clicked` | `entity_type`, `entity_id`, `origin_page` | Effect op Greenbookings |
| `zero_results_shown` | niet-persoonsgebonden filters | Verbeteren taxonomie |

Geen vrije, mogelijk identificerende invoer in analytics (`notes`, open zoekterm met namen, e-mail of telefoon). Event-ID's pseudoniem of aggregatie afhankelijk van consent. Rapporteer funnel per context en per aangesloten partner; geen persoonlijke bezoekerslijsten voor leveranciers.

### 20.2 Privacy, cookies en security

- Voor optionele analytics/marketingcookies toestemming volgens Nederlands/Europees kader, met even eenvoudige afwijzing als accepteren; geen tracking vóór toestemming. Privacyvriendelijke noodzakelijke functionele opslag duidelijk beschrijven.
- Zonder account alleen lokale opslag voor plan en favorieten; wissen mogelijk. Optionele shared links en accounts pas na privacyreview.
- TLS, veilige securityheaders/CSP, XSS-preventie, inputvalidatie, rate limiting op muterende routes, auditlogging, secret management, backups en hersteltest.
- Admin: authenticatie, MFA voor publicerende/beherende rollen, server-side RBAC. Geen vertrouwen op alleen verborgen frontendknoppen.
- Als Supabase wordt ingezet: Row Level Security op privé- en admin-tabellen, service role uitsluitend server-side, geen publieke sleutel die admin mutaties kan uitvoeren.
- Import alleen uit vooraf toegestane Greenbookings-endpoints, geen generieke gebruikers-URL-fetch die SSRF mogelijk maakt.
- Datarechten, beeldlicenties, contactgegevens en verwerkersafspraken voor elke integratie vastleggen vóór publicatie.

### 20.3 Toegankelijkheid

Minimumniveau: **WCAG 2.2 AA als ontwerp- en testdoel**. Volledige toetsenbordbediening voor gevoelenselectie, kaart-/lijstnavigatie, filterdrawers en composer. Semantische headings, zichtbare focus, foutmeldingen gekoppeld aan invoer, voldoende contrast, tekstvarianten voor geometrische gevoelsvormen, skiplink, correct `aria-pressed`, dialogfocus/escape, betekenisvolle fotobeschrijvingen en ondersteuning voor minder animatie.

## 21. Technische architectuur en prestatie-eisen

### 21.1 Aanbevolen opzet, conditioneel

Bij een nieuwe webapp: een server-renderend React-framework zoals Next.js, PostgreSQL (eventueel Supabase), objectopslag voor gelicentieerde beelden, een cron/worker voor Greenbookings-synchronisatie en CDN-cache. Bij bestaande projecten de huidige werkende stack hergebruiken wanneer die dezelfde doelen kan halen. **Geen frameworkmigratie puur om de mode.**

Scheid modules:

1. **Presentation:** design system, HTML templates, componenten, toegankelijkheid.
2. **Editorial:** concepten, gevoelens, programma, curatie, matching.
3. **Directory:** uitsluitend aangesloten venues + gecontroleerde suppliers, zoekindex/facetten.
4. **Data adapters:** Greenbookings public venue API, toekomstige supplier feed, audit en synchronisatie.
5. **My Plan:** browser-only state, export (later server/account).
6. **Admin:** RBAC, redactioneel review, audit, importobservatie.
7. **Measurement:** privacyvriendelijke events, uitgaande klikken, SEO-health.

### 21.2 Prestatie- en betrouwbaarheidstargets

| Eis | Doel / acceptatie |
|---|---|
| Core Web Vitals | Streefwaarden bij echte gebruikers: LCP ≤ 2,5s, INP ≤ 200ms, CLS ≤ 0,1; meet per device |
| Zoekactie | Eerste zichtbare, zinvolle respons idealiter ≤ 1s uit eigen index, zonder realtime full API-crawl |
| Dataversheid | Dagelijkse partner-sync als start; uitbreidbaar naar kortere intervallen na afstemming |
| Bronuitval | Laatste geverifieerde index beschikbaar, met stale-markering; nooit niet-partners nieuw publiceren |
| Schaal | Alle actuele aangesloten locaties, groei zonder vaste kunstmatige limiet |
| Mobiel | Volledig bruikbaar op 360px zonder horizontale scroll of verborgen CTA's |
| Beelden | Responsive beeldformaten, lazy loading onder de vouw, echte alt/credits, geen onrechtmatige rehosting |
| Vindbaarheid | SSR/SSG van primaire content en crawlbare paginering |
| Beveiliging | Geautomatiseerde dependency-/authchecks en handmatige publicatierechtencheck |

### 21.3 Deployment en omgeving

`development` met expliciete demo-/fixturedata, `staging` met gecontroleerde spiegeldata en `production` met echte gekeurde partnerdata. Scheid omgevingssleutels, admin-rollen, zoekindexen en analytics. Test database-migraties op staging en werk met back-up vóór productiewijzigingen. Feature flags voor supplier feed, PDF, accounts, AI en aanvragen. Productiedomein pas koppelen na redactionele en technische acceptatie.

## 22. Acceptatietests en definitie van klaar

### 22.1 Gebruiker en functionaliteit (test-ID's)

| ID | Wanneer | Dan |
|---|---|---|
| F-01 | Bezoeker selecteert Energie | Energie is geselecteerd en bijpassende concepten verschijnen met waarom-uitleg |
| F-02 | Bezoeker selecteert Energie en Trots en vervolgens Rust | Maximaal twee actief; keuze voor derde krijgt duidelijk wisselgedrag conform feeling-contract |
| F-03 | Geen gevoel geselecteerd | Redactioneel uitgelichte concepten zichtbaar en zoek-/browse-route blijft open |
| F-04 | Conceptdetail wordt geopend | Verhaal, doel, doelgroep, beleving, programma, aangesloten venueaanbevelingen en makersrollen zichtbaar |
| F-05 | Een aanbevolen venue heeft geen foto | De kaart toont een ontworpen tekstplaceholder met correcte naam/plaats |
| F-06 | Gebruiker filtert op provincie en personen | URL, resultaatcount en kaarten geven dezelfde actieve criteria weer |
| F-07 | Geen zoekresultaten | Duidelijke empty state met uitleg en filterreset; nooit fake kaarten |
| F-08 | Partnerlocatie toegevoegd aan plan | Precies één actieve locatie is geselecteerd; selectie blijft bij navigeren in dezelfde browser behouden |
| F-09 | Gebruiker kiest een tweede locatie | Oude wordt bewust vervangen; mogelijkheid tot ongedaan maken |
| F-10 | Twee verschillende leveranciers toegevoegd | Plan bevat beide één keer inclusief rollen en links |
| F-11 | Gebruiker kopieert plan | Bruikbare Nederlandse briefing met echte namen en disclaimer, zonder persoonsgegevens |
| F-12 | Gebruiker verlaat/reloadt de site | Plan blijft lokaal behouden tot zelf verwijderen, binnen opslagmogelijkheden van browser |
| F-13 | Gebruiker navigeert met Tab/Enter/Space | Feeling, filters, kaarten, modals en composer werken zonder muis |
| F-14 | Bezoeker opent mobiel filterpaneel | Focus en scroll zijn beheerst; sluiten met Escape/back, geen content onder overlay nodig |
| F-15 | Bron is tijdelijk onbereikbaar | Geen crash; laatste geverifieerde partnerrecords blijven volgens afgesproken beleid beschikbaar |
| F-16 | Leveranciersfeed is niet ingericht | Geen verzonnen makers, geen dode productielinks; beheer toont duidelijke blocker |

### 22.2 Partner-only — harde veiligheidstests

| ID | Test | Verwachte uitkomst |
|---|---|---|
| P-01 | Importrequest wordt uitgevoerd | `alleen_partners=true` staat expliciet in **elke** paginerende bronrequest |
| P-02 | Import ontvangt een niet-aangesloten record door bronfout | Record gaat naar quarantine of wordt geweigerd; nooit publiek |
| P-03 | Frontend vraagt `/api/venues?alleen_partners=false` | Parameter wordt genegeerd/afgewezen; response bevat uitsluitend geverifieerde partners |
| P-04 | Bezoeker opent oude URL van niet-partner | Geen profiel, brondata of publiceerbare meta; passende 404/410 |
| P-05 | Niet-partner staat nog in oude redactionele match | Niet publiek renderen; admin waarschuwt en vraagt vervangende partner |
| P-06 | Venue wordt ontkoppeld bij Greenbookings | Na betrouwbare statusverificatie verdwijnt hij uit resultaten, concepten, aanbevelingen én sitemap |
| P-07 | Bron-API heeft storing / partnerfilter werkt niet | Geen fallback naar ongefilterde algemene gids |
| P-08 | Gebruiker stelt datum of groepsgrootte in | Geen ongefundeerde claims over beschikbaarheid/geschiktheid |
| P-09 | Partnercount weergegeven op homepage | Teller is gelijk aan actieve geverifieerde partners in lokale index, niet algemene 3.225 |
| P-10 | Sitemap en interne zoekindex geregenereerd | Geen niet-aangesloten of gedeactiveerde locaties aanwezig |

### 22.3 Beheer en data

| ID | Test | Verwachte uitkomst |
|---|---|---|
| D-01 | Zelfde sync twee keer | Geen dubbele records, geen duplicaatmedia, geen vernietigde editorial tekst |
| D-02 | Eén paginaverzoek faalt | Run is gedeeltelijk/failed; geen massale deactivatie op basis van onvolledige snapshot |
| D-03 | Source-API stuurt gewijzigde veldtypes | Fout zichtbaar in admin/quarantine; geen stille misleidende waarde op site |
| D-04 | Redacteur probeert te publiceren | Geen rechten; hoofdredacteur kan met geldige sessie publiceren |
| D-05 | Concept zonder matchreden wordt aangeboden ter review | Publicatiecontrole geeft gerichte waarschuwing/stop waar verplicht |
| D-06 | Leverancier heeft geen beeldrecht | Placeholder; asset niet publiceren |
| D-07 | Inactief venue wordt in matchbeheer gezocht | Kan niet als live aanbeveling worden vastgezet |
| D-08 | Redactionele tekst aangepast en sync loopt | Eigen tekst blijft bestaan; bronvelden worden afzonderlijk bijgewerkt |
| D-09 | Op concept wordt vorige versie hersteld | Revisie en publicatiestatus correct met audit en cache-invalidering |

### 22.4 Visuele QA, performance en privacy

Maak browser-screenshots op **1440×900, 1024×768, 768×1024, 390×844, 360×780** voor home, conceptenindex, conceptdetail, locatiezoeker, locatiedetail, leveranciersindex/detail, plan en admin. Vergelijk met bestaande referentie (`dist/hupr.html`, `dist/concept.html`, `dist/locaties.html`, `styleguide.html`). Test ook lange titels, ontbrekende beelden, lege data, meerdere gevoelens en ingeklapte menu's. Gebruik `node design-system/check-design.mjs` als ondersteunende waarschuwing, niet als vervanging van visuele review.

Voor oplevering: lighthouse-achtige prestatie-audit, geautomatiseerde axe/WCAG-scan, handmatige toetsenbordtest, privacy/cookietest, robots/sitemaps, gebroken externe links, autorisatie-test, bronfilter-integratietest en een representatieve mobile real-device review.

**Definitie van klaar:** geen fictieve productiegegevens, alle publieke venues daadwerkelijk aangesloten, geen defecte primaire gebruikersstroom, geen kritieke toegankelijkheids-/beveiligingsissues, correcte bronvermeldingen, consistent design, getest mobiel, redactionele preview en beheer, monitorbare synchronisatie. Laat openstaande functies expliciet als `LATER` staan; verklaar ze niet stilzwijgend af.

## 23. Bouwfasen, afhankelijkheden en opleverpunten

| Fase | Resultaat | Succespoort |
|---|---|---|
| 0 — Code- & bronnenaudit | Rapport bestaande stack, map content, geïnspecteerde OpenAPI, bevestigde partner-only broncontracten | Geen fictieve aannames over endpoints, schema of auth |
| 1 — Visuele fundering | Design tokens, gedeelde componenten, header, footer, feelings-selector, screenshotbaseline | Ondersteunt alle vijf schermbreedtes; stijl identiek aan geaccepteerde referentie |
| 2 — Editorial fundament | Conceptenmodel, CMS-basis, conceptenindex, detail, preview, gevoelens, programmas | Eén volledig concept end-to-end zonder demo-hardcoding |
| 3 — Aangesloten locaties | Partner-only adapter, gefilterde import, index, zoekfilters, venuekaart, detail en bronlink | Partner-only tests P-01 t/m P-10 geslaagd |
| 4 — Contextuele combinaties | Concept-venue matches, leveranciersrolmodel en waar mogelijk echte supplier feed | Alles heeft een controleerbare reden/bron, geen fictieve leveranciers |
| 5 — Mijn plan & analytics | Selectie, lokale opslag, kopie/export, consent-aware meting | U-01 t/m U-05 doorlopen en relevante events geregistreerd |
| 6 — Redactioneel beheer & SEO | Review/publicatie, audit, SEO, sitemaps, rolbeheer, correcties | Content door redacteur beheerd zonder codewijziging |
| 7 — Hardening & release | Tests, responsiviteit, toegankelijkheid, stagingreview, deployment | Definitie van klaar bevestigd door opdrachtgever |

**Geen afhankelijkheid om de hele website stil te zetten:** fase 1–2 kunnen met duidelijk gemarkeerde demo-data worden ontwikkeld. Publicatie van een echte venuegids vereist fase 3. Leveranciersoverzicht gaat pas live na een rechtmatige bronfeed.

### 23.1 Eerste bouwopdracht voor Claude Code

1. Lees dit hele document en de bestaande designkit.
2. Inspecteer het project en de echte Greenbookings OpenAPI. Maak `docs/TECH-AUDIT.md` met bevestigde feiten, aannames en blokkades.
3. Bouw `docs/TRACEABILITY.md`: mapping eisen G/U/F/P/D naar bestanden en tests.
4. Toon exact welke bronwaarde `aangesloten partner` betekent, en verifieer de filter `alleen_partners=true` met testrecords. **Zonder bewezen partnerfilter geen venues publiceren.**
5. Start bouwfase 1, niet direct alle mogelijke features tegelijkertijd.
6. Maak bij de eerste opgeleverde pagina screenshots en een verschiloverzicht t.o.v. de referentie.
7. Rapporteer welke taken gereed zijn, wat nog mock is, welke bronnen bevestigd zijn en welke beslissing nodig is.

Voor een kant-en-klare volledige startprompt en een uitvoerbare taakvolgorde: `CLAUDE_CODE_BOUWPLAN.md`.

## 24. Beslissingen die nog moeten worden bevestigd

| Vraag | Huidige veilige standaard | Wanneer blocker? |
|---|---|---|
| Definitie van `aangesloten locatie` | Officiële `alleen_partners=true`-subset én verifieerbare status | **Voor live partnerimport** |
| Hoe krijg je actuele leveranciersgegevens? | Geautoriseerde export of feed uit Greenbookings | **Voor live leveranciersgids** |
| Hebben we recht om locatie-/leverancierfoto's te tonen? | Alleen met bevestigde licentie, anders editorial fallback | **Voor publicatie van het betrokken beeld** |
| Waar draait Top Locaties technisch? | Onderzoek bestaand project, zo nodig server-renderende webapp | Voor migratie/deployment |
| Wie beheert artikelen en keurt concepten goed? | Redacteur + hoofdredacteur | Voor productiebeheer |
| Krijgt het platform eigen aanvraagformulieren? | Nee, doorverwijzen naar Greenbookings | Niet blocker voor MVP, wel voor nieuwe leadroute |
| Komen er bezoekersaccounts? | Nee voor MVP | Niet blocker |
| Welke voorbeelduitleg bij sponsors versus suppliers? | Alleen leverancier als bronrol dat bevestigt | Voor supplier-publicatie |
| Exacte inhoud van locatie-zoeker.nl en meetings.nu | Eerst eigen siteaudit; geen ongecontroleerde SEO-aannames | Voor gezamenlijk SEO-programma |
| Wordt de selectie een PDF? | Copy eerst; PDF `SHOULD` | Niet blocker voor MVP |

## 25. Officiële bronnen / referenties

- Greenbookings ontwikkelaarsdocumentatie: https://greenbookings.nl/ontwikkelaars
- Greenbookings OpenAPI-document: https://greenbookings.nl/openapi.json
- Greenbookings publieke API: https://greenbookings.nl/api/v1/locaties
- Greenbookings MCP: https://greenbookings.nl/mcp
- Greenbookings locatiedirectory: https://greenbookings.nl/locaties
- Google Search Central — consolidatie en canonicalisatie: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central — spambeleid: https://developers.google.com/search/docs/essentials/spam-policies
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Autoriteit Persoonsgegevens — cookies en online tracking: https://autoriteitpersoonsgegevens.nl/themas/internet-slimme-apparaten/cookies
- Supabase — Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security

**Slotregel aan Claude Code:** als een technische aanname niet blijkt te kloppen, wijzig de implementatie én documenteer het verschil. Als een keuze botst met **partner-only**, rechten/privacy of de goedgekeurde visuele identiteit, ga niet zelfstandig verder maar leg één concrete beslisvraag voor.
