# TOP LOCATIES — blijvende instructies voor Claude Code

Je werkt aan **Top Locaties**, het redactionele inspiratieplatform voor eventconcepten, locaties en leveranciers in het Greenbookings-ecosysteem. De website is Nederlandstalig. **Visuele consistentie is een harde acceptatie-eis.**

## Eerst lezen (bij iedere UI-opdracht)

1. `design-system/STYLE-GUIDE.md` — identiteit, kleuren, typografie, ritme, beeld en patronen.
2. `design-system/COMPONENT-CONTRACTS.md` — exacte componenten en gedrag.
3. `design-system/CONTENT-AND-PAGES.md` — pagina-indelingen, feeling-first flow en datamodel.
4. `design-system/QA-CHECKLIST.md` — checklist vóór oplevering.
5. Bekijk de bestaande, **werkende** referenties `dist/hupr.html`, `dist/concept.html`, `dist/locaties.html`, `dist/feelings.css`, `dist/feelings.js` en `dist/site-navigation.js`.
6. Open `design-system/styleguide.html` om alle nieuwe componenten visueel te vergelijken.

`dist/v2.html` is een eerdere, afgewezen stijlproef; negeer die bij nieuwe vormgeving.

## Niet-onderhandelbare vormgevingsregels

- Houd het merk eigen en redactioneel: *een experimenteel designmagazine over events*, geen SaaS-dashboard en geen standaard locatiedirectory.
- Gebruik uitsluitend de centrale waarden uit `design-system/tokens.css` en `design-system/tokens.json`. Oude HTML-referenties hebben kleine historische kleurafwijkingen; de nieuwe tokens zijn de **canonieke norm**.
- Display: `Archivo Black`, zware kapitalen, krappe letterafstand, bewust asymmetrische regelafbrekingen.
- Microcopy: `DM Mono` in kapitalen, nummering `01 /`, dunne scheidingslijnen. Doorlopende uitleg: `DM Sans`.
- Palet: inkt `#292A2C`, accent `#F45269`, elektrisch blauw `#2546BB`, papier `#F6F5F2`, warm taupe `#D9C9BF`. Gebruik kleur doelgericht, nooit een willekeurige gradient.
- Vierkante of nagenoeg vierkante vormen, dunne borders, ruime marges, asymmetrische composities, grote fotografie. **Geen** afgeronde SaaS-cards, zwevende glassmorphismpanelen, emoji-iconen, pastelgradients, generieke statistiektegels of standaard hero met gecentreerde zoekbalk.
- Hergebruik bestaande beeldbestanden `dist/hero-event.webp` en `dist/festival-event.webp` voor ontwerpvergelijking; gebruik later uitsluitend foto’s met gebruiksrecht en echte locatiebeelden. Geen willekeurige foto als feitelijke weergave van een locatie.
- Beperk animatie tot betekenisvolle overgangen (150–500 ms); respecteer `prefers-reduced-motion`.
- Denk mobile first qua gedrag, zonder de desktop-signatuur af te zwakken. Richtpunten: 1440, 1024, 768, 390 px.
- Elke conceptpagina bevat het *waarom*, de gevoelsbeleving, programma, passende **echte** locaties, passende **echte** leveranciers en een samenstellingsactie. Geen alles-overheersende modal.
- "Kies op gevoel" is een primaire ontdekroute, niet slechts een extra filter: gebruikers kiezen één of twee gewenste gevoelens en zien uitlegbare conceptaanbevelingen.
- Alle data over locaties, leveranciers, capaciteit, beschikbaarheid en prijs moet brongebonden of expliciet `onbekend` zijn. Sfeerfoto’s en fictieve programma's altijd als illustratief markeren.

## Bouwafspraken

- **Stack (sinds 3 nov 2026):** afhankelijkheidsvrije statische generator. `npm run build` → `site/`. Bron: `src/content/*.json` (Greenbookings-snapshot + redactie), templates in `src/templates` + `src/pages`, browser-JS in `src/client`. Beheer: `npm run admin` (lokaal, rollen redacteur/hoofdredacteur). Zie `README.md` en `docs/TECH-AUDIT.md`.
- **Harde regel:** uitsluitend gepubliceerde én aangesloten Greenbookings-partnerlocaties (`isPublishablePartner()` in `src/lib/data.mjs`). Fail-closed. Geldt voor zoeker, detailroutes, matches, sitemap en beheer-keuzelijsten.
- Lees ook `design-system/FUNCTIONEEL-ONTWERP.md` en `design-system/CLAUDE_CODE_BOUWPLAN.md`.
- `dist/` is het oorspronkelijke prototype (ter vergelijking gepubliceerd onder `/prototype/`); niet meer bewerken.
- Gebruik bij uitbreiding herbruikbare, semantische, met `tl-` geprefixte componenten uit `design-system/components.css` (of exacte equivalenten in het gekozen framework). Geen nieuw visueel sub-systeem per pagina.
- Vermijd CSS-in-JS met hardcoded waarden. Gebruik design tokens. Een nieuwe kleur, een nieuw lettertype of een nieuwe basiscomponent vereist eerst een bewuste wijziging in het design system.
- Sluit bestaande interacties niet onbedoeld af: homepage → gevoel → concept → aanbevolen locatie/leverancier → plan.
- Maak componenten toegankelijk met echte knoppen/links, focus-zichtbaarheid, labels, toetsenbordbediening en tekstalternatieven.
- Bewaak SEO: iedere publiceerbare concept-, locatie- en leverancierspagina krijgt unieke titel, beschrijving, inhoud en canonical; publiceer geen honderden dunne duplicaatpagina's.
- Houd de Greenbookings-bron leidend. Nooit prijs of beschikbaarheid verzinnen.

## Controle vóór afronding

1. Vergelijk nieuwe UI met `design-system/styleguide.html` en minstens twee bestaande `dist/`-pagina's.
2. Controleer 1440 / 1024 / 768 / 390 px, hover / focus / selected / empty / loading / error / reduced-motion.
3. Doorloop de flow vanaf gevoel tot plan en externe leveranciers-/locatielink.
4. Rapporteer afwijkingen, ontbrekende data en resterende aannames. Noem een prototype geen live Greenbookings-integratie.
5. Draai `npm run qa` (build, unit-tests, functionele flows, design-audit) en `node scripts/admin-e2e.mjs` bij beheerwijzigingen; `npm run screenshots` voor de visuele vergelijking op vijf breedtes.

De instructies in `design-system/CLAUDE_CODE_PROMPT.md` zijn het startscript voor de eerste integratie in een eigen repository.
