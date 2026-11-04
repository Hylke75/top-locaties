-- Top Locaties — read-only snapshotquery op de Greenbookings-database.
-- Gebruikt op 2026-11-03 om src/content/greenbookings-snapshot.json te vullen.
-- Alleen publieke profielvelden; NOOIT contact-, sleutel- of salesvelden
-- (o.a. chatbot_api_sleutel, mice_api_key, contactmail, telefoon) selecteren.
-- Een geautomatiseerde sync (fase E) moet via een read-only rol of view lopen.

select l.slug, l.naam, l.stad, l.provincie, l.type, l.sfeer, l.tagline,
       l.capaciteit_min, l.capaciteit_max, l.status, l.aangesloten,
       l.sfeer_tags, l.bijeenkomst_types, l.hero_media_url, l.hero_alt,
       (select count(*) from public.locatie_media m where m.locatie_id = l.id) as media_count,
       l.bijgewerkt_op
from public.locaties l
where l.status = 'gepubliceerd'
  and l.slug = any(:venue_slugs);   -- slugs uit src/content/venues.editorial.json

select o.slug, o.naam, o.categorie, o.plaats, o.tagline, o.status,
       o.toon_in_gids, o.website, o.bijgewerkt_op
from public.organisaties o
where o.type = 'leverancier'
  and o.is_test = false
  and o.slug = any(:supplier_slugs); -- slugs uit src/content/suppliers.editorial.json

-- Uitbreiding 2026-11-04 (read-only): regio, aantal ruimtes en capaciteit per opstelling.
-- prijs_dagdeel_vanaf / catering_prijs_pp_indicatie zijn in de bron voor geen enkele locatie ingevuld → op de site 'op aanvraag'.
select l.slug, l.regio, count(r.id) as ruimtes,
       max(r.cap_theater) theater, max(r.cap_school) school, max(r.cap_u_vorm) u_vorm, max(r.cap_carre) carre,
       max(r.cap_diner) diner, max(r.cap_receptie) receptie, max(r.cap_cabaret) cabaret, l.prijs_dagdeel_vanaf
from public.locaties l left join public.ruimtes r on r.locatie_id = l.id
where l.status = 'gepubliceerd' and l.aangesloten = true and l.slug = any(:venue_slugs)
group by l.slug, l.regio, l.prijs_dagdeel_vanaf;
