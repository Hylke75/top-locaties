# Definitie van gereed — visuele en functionele QA

## Controle per nieuwe pagina

- [ ] Woordmerk, kleuren en typografie komen uit centrale tokens.
- [ ] Grote kop heeft bewust ontworpen regels, geen toevallige automatische afbreking.
- [ ] Geheel oogt als één familie met `dist/hupr.html`, `dist/concept.html` en `dist/locaties.html`.
- [ ] Geen generieke AI-esthetiek: glassmorphism, pill-buttons, willekeurige gradients, kartelvrije emoji-iconen, grote border-radius.
- [ ] Op desktop één uitgesproken redactioneel gebaar, maar informatie is snel vindbaar.
- [ ] Fotografie is relevant, voorzien van licentie/credit en eerlijk gelabeld als illustratief waar nodig.
- [ ] Alle navigatie en CTA's werken, hebben zichtbare hover/focus en gaan naar juiste bestemmingen.
- [ ] Alle belangrijke acties zijn uitvoerbaar met alleen toetsenbord.
- [ ] Een bezoeker kan bij elk concept het idee, programma, de aanbevolen locaties en leveranciers direct vinden.
- [ ] De gebruiker kan kiezen op gevoel en begrijpt waarom een match getoond wordt.
- [ ] De aanbeveling toont geen onbevestigde capaciteit, prijs, beschikbaarheid of leverancierrelatie.
- [ ] De auteur kan elk nieuw concept toevoegen zonder CSS/JS per object te dupliceren.
- [ ] Lege, fout-, laad- en geselecteerde states zijn ontworpen en getest.
- [ ] Afbeeldingen hebben passende alt-tekst; decoratie is als decoratie gemarkeerd.
- [ ] Contrast AA voor gewone tekst en belangrijkste bediening is gecontroleerd; focusring is zichtbaar.
- [ ] Touch targets voor primair gebruik minimaal 44×44 px.
- [ ] SEO-titel, beschrijving, H1 en canonical passend bij pagina, zonder duplicaten.

## Verplichte schermbreedtes

| Viewport | Wat vaststellen |
|---|---|
| 1440×900 | Editorial compositie, grote hero, gridritme, volledige navigatie. |
| 1024×768 | Geen horizontale overflow, typografie blijft leesbaar, 2–3 kolommen logisch. |
| 768×1024 | Menu en filterbediening functioneert, hero kan stapelen, cards niet te smal. |
| 390×844 | Primaire actie direct te vinden; kaarten 1 kolom; woorden niet afgekapt. |
| 360×800 | Geen horizontale scroll, formulier volledig bruikbaar, navigatie bereikbaar. |

## Functionaliteitsroutes die getest moeten zijn

1. **Gevoel → concept:** kies `Verbinding + Rust`, open de match, lees de gevoelsignatuur; ga terug en wijzig de keuze.
2. **Concept → keuze:** kies een locatie, voeg twee leveranciers toe; controleer status en tekst van het conceptplan.
3. **Zoeker:** zoek een stad, wijzig twee filters, reset, sorteer, controleer nulresultaat en regio-overzicht.
4. **Extern:** open meerdere bronlinks in een nieuwe tab; bevestig dat ze naar bestaande relevante Greenbookings-profielen verwijzen.
5. **Toegankelijk:** Tab/Shift+Tab, Enter, Space, Escape waar van toepassing, 200% zoom, reduced-motion.

## Visuele regressie

- Bewaar een referentiescreenshot per route bij 1440 en 390 px.
- Laat Claude **de nieuwe screenshot met de stijlguide én de relevante huidige pagina vergelijken**; noteer verschillen in typography, spacing, line breaks, colors, states, image crop.
- Verschillen groter dan een klein redactioneel accent eerst corrigeren voordat nieuwe functionaliteit wordt gebouwd.
- Automatiseer later met Playwright-screenshot tests, maar claims over geslaagde visuele QA alleen na werkelijke screenshotvergelijking.

## Performance- en SEO-richtlijnen

- Hero-image bij voorkeur WebP/AVIF, dimensies vooraf vastleggen, boven de vouw gericht laden; overige afbeeldingen lazy.
- CLS bij afbeeldingen vermijden met verhouding of vaste dimensions.
- Meet Lighthouse/Core Web Vitals in de echte hostingomgeving; geen fictieve score claimen.
- Filterpagina's niet blind indexeren als ze dunne duplicaten creëren.

## Governance van het design system

Elke nieuwe basiscomponent of merkwijziging bestaat uit vier edits:

1. `tokens.css` / `tokens.json` indien een nieuwe waarde nodig is.
2. `components.css` en een voorbeeld in `styleguide.html`.
3. `COMPONENT-CONTRACTS.md` of `STYLE-GUIDE.md` voor gedrag/regels.
4. Een visuele test op desktop én mobiel.

Zo voorkom je dat losse Claude-opdrachten langzaam weer uiteenlopende AI-websitestijlen opleveren.
