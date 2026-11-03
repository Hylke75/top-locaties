# Top Locaties — Design System 1.0

Een overdraagbaar, werkend ontwerp- en ontwikkelpakket voor **Claude Code**, gebaseerd op de op 3 november 2026 gebouwde Top Locaties-ontwerpstudie.

## De bestanden

| Bestand | Gebruik |
|---|---|
| `../CLAUDE.md` | Automatisch in te lezen projectregels voor Claude Code. |
| `../.claude/rules/top-locaties-ui.md` | Aanvullende regels bij UI-bestanden. |
| `CLAUDE_CODE_PROMPT.md` | Eén volledige startopdracht om te plakken in Claude Code. |
| `STYLE-GUIDE.md` | Alle visuele ontwerpkeuzes, exacte waarden en motivering. |
| `COMPONENT-CONTRACTS.md` | Catalogus met states, interacties en componentregels. |
| `CONTENT-AND-PAGES.md` | Inhoud, gebruikersstromen, paginatemplates, Greenbookings-koppeling. |
| `QA-CHECKLIST.md` | Acceptatiecriteria en concrete controles. |
| `tokens.json` | Machineleesbare design tokens voor verdere bouwtools. |
| `tokens.css` | Direct bruikbare CSS-variabelen. |
| `components.css` | Herbruikbare `tl-` componenten, utilities en responsive regels. |
| `styleguide.html` | Visuele, lokale componentgalerij die de CSS daadwerkelijk gebruikt. |
| `models.ts` | Frameworkonafhankelijke Typescript-contracten voor concepten, gevoelens, locaties en makers. |
| `check-design.mjs` | Optionele design-audit voor nieuwe UI-bestanden. |
| `../dist/` | **Volledige** originele prototypebron en de twee gegenereerde eventbeelden. |

## Aan de slag in je eigen repository

1. Kopieer `CLAUDE.md`, `.claude/` en `design-system/` naar de **root** van je Claude Code-project. Voeg `dist/` toe als de broncode nog niet aanwezig is. Overschrijf bestaande projectregels niet blind: integreer ze bewust.
2. Open `design-system/styleguide.html` in je browser. In dit pakket verwijst hij naar de twee foto's in `../dist/`.
3. Start Claude Code **in de projectroot**, zodat `CLAUDE.md` wordt opgepakt. In Claude Code controleer je met `/context` of het bestand geladen is.
4. Plak de volledige opdracht uit `CLAUDE_CODE_PROMPT.md` en vraag Claude om stapsgewijs te implementeren.
5. Laat Claude eerst het bestaande project analyseren en kiezen of het buildless HTML blijft of naar bijvoorbeeld React/Next.js migreert. Het ontwerp mag daarbij niet wijzigen.
6. Loop na iedere nieuwe pagina de visuele QA-checklist na.
7. Draai voor nieuwe broncode desgewenst `node design-system/check-design.mjs src app components`. Met `--strict` faalt het commando bij visuele stijlwaarschuwingen. De tool is adviserend en vervangt geen screenshotreview.

## Welke pagina is de beste bron?

- **`dist/hupr.html`**: merk, krachtige typografie, hero, marquee, conceptcarousel, redactionele secties.
- **`dist/feelings.css` + `dist/feelings.js`**: de unieke gevoelskeuze en matches.
- **`dist/concept.html`**: het inhoudelijke eventconcept, programma, locatie- en leveranciersselectie.
- **`dist/locaties.html`**: zoeken/filteren, kaarten, compositie en mobiele resultaten.
- **`design-system/styleguide.html`**: canonieke kleuren en herbruikbare bouwstenen voor al het nieuwe werk.

`dist/v2.html` is een eerdere, **niet-goedgekeurde** stijlverkenning. Hij zit alleen voor historische volledigheid in de bronmap en mag niet als designreferentie dienen.

## Belangrijke grens

Het pakket is een **visueel en functioneel referentie-ontwerp**. Niet alle Greenbookings-locaties en leveranciers zijn live aangesloten. Sommige sfeerbeelden zijn illustratief, en de in de prototypepagina's opgenomen gegevens zijn voorbeelden uit eerder gevonden profielen. Een productieversie moet de volledige, gecontroleerde Greenbookings-data koppelen.
