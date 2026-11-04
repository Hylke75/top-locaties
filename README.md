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
- **Hoofdredacteur:** daarnaast publiceren en archiveren, de kwaliteitstoets (100 punten) invullen, de site bouwen en de Greenbookings-sync starten.
- Een concept bevat ook de methodevelden (aanleiding, doelen op drie niveaus, doelgroep, bezoekersreis, communicatie, KPI's, bijstellingen) en de velden voor het conceptplan in twaalf hoofdstukken (§16–18 in het beheer).
- Elke mutatie wordt gevalideerd, als revisie bewaard en in `src/content/audit-log.jsonl` vastgelegd.
- Bronvelden zijn niet bewerkbaar; keuzelijsten bevatten alleen aangesloten partners.
- Na vijf mislukte inlogpogingen wacht het beheer vijf minuten.
- Op een server: zet de accounts in `TL_ADMIN_USERS` met de uitvoer van `node scripts/admin-user.mjs export`, en draai het beheer alleen achter eigen toegangsbeveiliging.

Na wijzigingen: commit `src/content/`, push, en Vercel bouwt de site opnieuw (of deploy handmatig).

## Routes voor bezoekers

- `/conceptplan/`: briefing in acht vragen, geeft drie wezenlijk verschillende concepten.
- `/eventconcepten/?dagdeel=ochtend|middag|dag|avond`: concepten per dagdeel.
- `/eventconcepten/<slug>/conceptplan/`: het printbare conceptplan in twaalf hoofdstukken, vooraf ingevuld met de vragenlijst op maat.

## Accounts en conceptmaker

- Supabase-project `top-locaties` (los van Greenbookings). Tabel en rechten: `supabase/migrations/20261104_user_concepts.sql` (RLS: alleen eigen concepten; max. 100 per account; `delete_my_account()`).
- Instellingen in `src/content/site.json → accounts` (URL en publishable key zijn bedoeld voor de browser). `enabled: false` toont "binnenkort"; voorvertoning in je eigen browser met `/account/?voorvertoning=aan`.
- Live zetten: voer de migratie uit, zet in Supabase *Authentication → URL Configuration* de Site URL op `https://top-locaties.nl` en voeg `https://top-locaties.nl/account/` toe als redirect, en zet `enabled` op `true`.
- Routes: `/account/`, `/maker/?basis=<slug>` of `?id=<uuid>`, `/presentatie/?basis=<slug>` of `?id=<uuid>`.
- Delen, samenwerken (redacteur/lezer) en versies zitten in dezelfde migratie. Rechten getest met `supabase/tests/rls_test.sql` (lokale PostgreSQL met auth-stub).
- Test: `npm run account-e2e` (gesimuleerde Supabase).

## Contactformulier

- `api/contact.mjs` (Vercel-functie) schrijft berichten naar Greenbookings `contactberichten` met `bron = 'top-locaties'`, alleen voor gepubliceerde én aangesloten locaties, met honeypot en snelheidslimiet.
- Zet in Vercel de omgevingsvariabele `GREENBOOKINGS_SUPABASE_SERVICE_KEY` (type *Sensitive*). Zonder die sleutel rondt de bezoeker af op het Greenbookings-profiel.
- Optioneel: `RESEND_API_KEY` en `CONTACT_FROM` (bv. `Top Locaties <hallo@top-locaties.nl>`) voor een bevestigingsmail aan de bezoeker.

## E-mail (Resend)

- Domein `top-locaties.nl` staat in Resend (EU). Na de DNS-records bij TransIP: verifiëren, een SMTP-sleutel maken en in Supabase *Authentication → SMTP Settings* invullen (host `smtp.resend.com`, poort 465, gebruiker `resend`, wachtwoord = de sleutel, afzender bv. `account@top-locaties.nl`).

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
