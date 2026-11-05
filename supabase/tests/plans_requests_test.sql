-- Test voor supabase/migrations/20261105_plans_and_requests.sql (lokaal; rollen anon/authenticated moeten bestaan).
-- Gebruik: psql -v ON_ERROR_STOP=1 -f supabase/migrations/20261105_plans_and_requests.sql -f supabase/tests/plans_requests_test.sql
\set ON_ERROR_STOP 1
create or replace function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if not ok then raise exception 'NIET OK: %', label; end if; raise notice 'OK   %', label; end $$;
create temp table ids (id text);
grant all on ids to anon;

set role anon;
insert into ids select public.create_shared_plan('teamdag', '{"feelings":["rust"],"venueId":"geofort","supplierIds":["xr"],"answers":{"gasten":"40","organisatie":"Geheim BV","contact":"Jan","email":"j@x.nl","datum":"2027-03-01"}}');
select pg_temp.check(length((select id from ids)) = 32, 'deellink: willekeurig id van 32 tekens');
select pg_temp.check((select data->'answers' ? 'organisatie' or data->'answers' ? 'contact' or data->'answers' ? 'email' from public.get_shared_plan((select id from ids))) = false, 'deellink: geen naam, organisatie of e-mail opgeslagen');
select pg_temp.check((select data->'answers'->>'gasten' from public.get_shared_plan((select id from ids))) = '40', 'deellink: keuzes en eventgegevens blijven');
select pg_temp.check((select count(*) from public.get_shared_plan('bestaatniet')) = 0, 'deellink: onbekend id geeft niets');
do $$ begin perform public.create_shared_plan('../../x', '{}'); raise exception 'mocht niet'; exception when sqlstate '22023' then raise notice 'OK   deellink: ongeldig concept geweigerd'; end $$;
do $$ begin perform count(*) from public.shared_plans; raise exception 'mocht niet'; exception when insufficient_privilege then raise notice 'OK   anon leest shared_plans niet direct'; end $$;

select public.submit_quote_request('{"base_slug":"teamdag","name":"Test Persoon","email":"Test@Example.nl","guests":"40","event_date":"2027-03-01","venue_slug":"geofort","suppliers":[{"slug":"xr","name":"Beau & XR"}]}') is not null as ingevoegd \gset
select pg_temp.check(:'ingevoegd'::boolean, 'aanvraag: anon kan via RPC indienen');
do $$ begin perform count(*) from public.quote_requests; raise exception 'mocht niet'; exception when insufficient_privilege then raise notice 'OK   anon leest quote_requests niet'; end $$;
do $$ begin perform public.submit_quote_request('{"base_slug":"teamdag","name":"X","email":"geen-mail"}'); raise exception 'mocht niet'; exception when check_violation then raise notice 'OK   aanvraag: ongeldige naam/e-mail geweigerd'; end $$;
select public.submit_quote_request('{"base_slug":"teamdag","name":"Test Persoon","email":"test@example.nl"}') is not null as b \gset
select public.submit_quote_request('{"base_slug":"teamdag","name":"Test Persoon","email":"test@example.nl"}') is not null as c \gset
do $$ begin perform public.submit_quote_request('{"base_slug":"teamdag","name":"Test Persoon","email":"test@example.nl"}'); raise exception 'mocht niet'; exception when sqlstate '53400' then raise notice 'OK   aanvraag: max. 3 per e-mailadres per uur'; end $$;
reset role;
select pg_temp.check((select count(*) from public.quote_requests where email = 'test@example.nl') = 3, 'aanvraag: e-mail genormaliseerd en opgeslagen');
