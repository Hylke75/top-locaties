# Top Locaties

Redactioneel inspiratieplatform voor zakelijke evenementen. De route: **gevoel → eventconcept → aangesloten Greenbookings-locatie + makers → eigen plan**.

## Snel starten

Vereist: Node 20 of hoger. Er zijn geen dependencies; voor de browsertests is Playwright nodig.

```bash
npm run build
```

```bash
npm run serve
```

`npm run build` genereert de statische site in `site/`. `npm run serve` start een lokale server op http://localhost:4173/.

## Beheer

```bash
TL_EDITOR_TOKEN=kies-een-code TL_CHIEF_TOKEN=kies-een-andere npm run admin
```

Open daarna http://127.0.0.1:4174/admin/.

**Redacteur**
- maakt concepten aan en bewerkt ze (draft → review);
- beheert locatieredactie, makers en gevoelsteksten.

**Hoofdredacteur**
- publiceert of archiveert concepten;
- bouwt de site;
- start de Greenbookings-sync.

**Wat het beheer verder doet**
- Elke mutatie wordt gevalideerd, als revisie bewaard en in `src/content/audit-log.jsonl` vastgelegd.
- Bronvelden uit Greenbookings zijn niet bewerkbaar.
- Keuzelijsten bevatten uitsluitend aangesloten partners.
- Draai het beheer alleen lokaal of achter eigen toegangsbeveiliging.

Na wijzigingen: commit `src/content/` en deploy `site/`.

## Data

- `src/content/greenbookings-snapshot.json`: alle gepubliceerde, **aangesloten** partnerlocaties (read-only bron).
- `npm run sync` werkt de snapshot bij via de Greenbookings-API (`alleen_partners=true`). De sync is fail-closed: bij een onbereikbare bron, een onvolledige set of een niet-bevestigde partnerstatus verandert er niets.
- Redactie staat apart in `venues.editorial.json`, `suppliers.editorial.json`, `concepts.json` en `feelings.json`.

## Kwaliteit

```bash
npm run qa
```

```bash
node scripts/admin-e2e.mjs
```

```bash
npm run screenshots
```

`npm run qa` draait build, unit-tests, browserflows en de design-audit. Voor `admin-e2e` en `screenshots` moet `npm run serve` draaien.

## Deployment

`vercel.json` is ingesteld (build `node scripts/build.mjs`, output `site/`, redirects voor de prototype-URL's). Er is nog niets gedeployd: zie de beslispunten in `docs/TECH-AUDIT.md` §6.

## Documentatie

- `CLAUDE.md`: projectregels.
- `design-system/`: stijl, componenten, functioneel ontwerp en bouwplan.
- `docs/TECH-AUDIT.md`: architectuur, bron en open punten.
- `docs/TRACEABILITY.md`: eis → code → test.
