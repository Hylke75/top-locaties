---
description: Visuele en UX-regels voor alle Top Locaties gebruikersinterfaces
paths:
  - "dist/**/*.{html,css,js,ts,tsx,jsx}"
  - "src/**/*.{css,scss,html,js,jsx,ts,tsx}"
  - "app/**/*.{css,scss,html,js,jsx,ts,tsx}"
  - "components/**/*.{css,scss,html,js,jsx,ts,tsx}"
---

# Verplichte UI-beslissingen

1. Gebruik `design-system/tokens.css` als centrale bron voor kleur, schaal en afstanden; geen nieuwe hardcoded themakleuren.
2. Bouw nieuwe interfaces uit de patronen in `design-system/components.css` / `COMPONENT-CONTRACTS.md`.
3. Plaats grote displaykoppen in bewust ontworpen regels. Vermijd automatische woordafbreking in koppen, overloop of horizontaal scrollen.
4. Zorg dat minstens één groot redactioneel gebaar per pagina zichtbaar is: enorme kop, asymmetrisch beeldvlak, typografische kleurwisseling of genummerde editorial sectie.
5. Houd één primaire CTA per zichtbare sectie. Gebruik `↗` voor doorklikken en `↓` voor scrollen; teksten zijn korte Nederlandse werkwoorden.
6. Foto's tonen echte atmosfeer. Illustratieve foto's mogen niet worden gepresenteerd als de echte locatie.
7. Gevoelkeuzes zijn buttons met `aria-pressed`, max. twee actieve opties en een uitlegbare match. Locatie- en leveranciersselecties tonen echte selectiestatus.
8. Alle infoblokken mogen niet uitsluitend decoratief zijn: toon ook het doel van concept, waarom een locatie matcht en welke rol een maker heeft.
9. Alle layouts zijn bruikbaar vanaf 360 px. Grote teksten schalen met `clamp()`, grids worden 2 of 1 kolom waar nodig.
10. Doen vóór oplevering: toetsenbordcheck, mobiele screenshot, gegevenscontrole en visuele vergelijking met de stijlguide.

## Antipatroon — nooit invoeren zonder expliciete herontwerpbeslissing

`border-radius: 24px`, glazige kaarten, paarse/blauwe gradientachtergronden, willekeurige Lucide-iconen in rondjes, een dashboard-zijbalk op inspiratiepagina's, Bootstrap-look, glanzende UI-schaduwen, generieke AI-beeldtaal of eindeloze identieke 3-koloms cards.

Wanneer een functionele eis de vormgeving lijkt te breken: **herontwerp binnen de bestaande taal**, niet ernaast.
