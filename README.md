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

Maak eenmalig een account aan. Het wachtwoord wordt via stdin gevraagd en alleen als scrypt-hash bewaard in `.admin/users.json`, dat niet in git staat:

```bash
node scripts/admin-user.mjs add hylke@greenbookings.nl hoofdredacteur Hylke
```

Start daarna het beheer:

```bash
npm run admin
```

Open http://127.0.0.1:4174/admin/ en log in met e-mailadres en wachtwoord.

- **Redacteur:** concepten maken en bewerken (draft → review), locatieredactie, makers en gevoelsteksten.
- **Hoofdredacteur:** daarnaast publiceren en archiveren, de site bouwen en de Greenbookings-sync starten.
- Elke mutatie wordt gevalideerd, als revisie bewaard en in `src/content/audit-log.jsonl` vastgelegd.
- Bronvelden zijn niet bewerkbaar; keuzelijsten bevatten alleen aangesloten partners.
- Na vijf mislukte inlogpogingen wacht het beheer vijf minuten.
- Op een server: zet de accounts in `TL_ADMIN_USERS` met de uitvoer van `node scripts/admin-user.mjs export`, en draai het beheer alleen achter eigen toegangsbeveiliging.

Na wijzigingen: commit `src/content/`, push, en Vercel bouwt de site opnieuw (of deploy handmatig).

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

Productie draait op https://top-locaties.vercel.app (Vercel-project `top-locaties`). `vercel.json` regelt de build (`node scripts/build.mjs` → `site/`) en de redirects voor de prototype-URL's.

## Documentatie

- `CLAUDE.md`: projectregels.
- `design-system/`: stijl, componenten, functioneel ontwerp en bouwplan.
- `docs/TECH-AUDIT.md`: architectuur, bron en open punten.
- `docs/TRACEABILITY.md`: eis → code → test.
