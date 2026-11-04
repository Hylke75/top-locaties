-- RLS-test voor supabase/migrations/20261104_user_concepts.sql (lokaal, met een auth-stub).
-- Anna = eigenaar, Bob = redacteur, Carla = buitenstaander, anon = geen account.
\set ON_ERROR_STOP 1
create or replace function pg_temp.as_user(uid text, mail text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub', uid, 'email', mail)::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FOUT %', label; end if; end $$;
create or replace function pg_temp.fails(stmt text, label text) returns void language plpgsql as $$
begin begin execute stmt; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end; raise exception 'FOUT % (geen fout)', label; end $$;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'anna@x.nl');
insert into public.user_concepts (id, base_slug, title, data) values ('11111111-1111-1111-1111-111111111111', 'kick-off', 'Kick-off Anna', '{"notes":"v1"}');
select pg_temp.ok((select count(*) from public.user_concepts) = 1, 'eigenaar ziet eigen concept');
insert into public.concept_members (concept_id, email, role) values ('11111111-1111-1111-1111-111111111111', 'bob@x.nl', 'editor');
update public.user_concepts set data = '{"notes":"v2"}' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.ok((select count(*) from public.user_concept_versions) = 1, 'wijziging maakt een versie (oude stand)');
update public.user_concepts set data = '{"notes":"v3"}' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.ok((select count(*) from public.user_concept_versions) = 1, 'max. één versie per 10 minuten');
update public.user_concepts set share_token = 'abcdefghijklmnopqrstuvwxyz012345' where id = '11111111-1111-1111-1111-111111111111';
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@x.nl');
select pg_temp.ok((select count(*) from public.user_concepts) = 1, 'redacteur ziet gedeeld concept');
update public.user_concepts set title = 'Kick-off (Bob)' where id = '11111111-1111-1111-1111-111111111111';
select pg_temp.ok((select title from public.user_concepts) = 'Kick-off (Bob)', 'redacteur kan bewerken');
select pg_temp.fails($$update public.user_concepts set share_token = null where id = '11111111-1111-1111-1111-111111111111'$$, 'redacteur kan deellink niet wijzigen');
select pg_temp.fails($$update public.user_concepts set user_id = '00000000-0000-0000-0000-00000000000b' where id = '11111111-1111-1111-1111-111111111111'$$, 'eigenaar kan niet worden overgenomen');
delete from public.user_concepts where id = '11111111-1111-1111-1111-111111111111';
reset role;
select pg_temp.ok((select count(*) from public.user_concepts) = 1, 'redacteur kan niet verwijderen (RLS)');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@x.nl');
select pg_temp.fails($$insert into public.concept_members (concept_id, email, role) values ('11111111-1111-1111-1111-111111111111', 'carla@x.nl', 'editor')$$, 'redacteur kan geen leden uitnodigen');
select pg_temp.ok((select count(*) from public.user_concept_versions) >= 1, 'redacteur ziet versies');
reset role;

update public.concept_members set role = 'viewer' where email = 'bob@x.nl';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@x.nl');
update public.user_concepts set title = 'poging' where id = '11111111-1111-1111-1111-111111111111';
reset role;
select pg_temp.ok((select title from public.user_concepts) = 'Kick-off (Bob)', 'lezer kan niet bewerken');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'carla@x.nl');
select pg_temp.ok((select count(*) from public.user_concepts) = 0, 'buitenstaander ziet niets');
select pg_temp.ok((select count(*) from public.user_concept_versions) = 0, 'buitenstaander ziet geen versies');
select pg_temp.ok((select count(*) from public.concept_members) = 0, 'buitenstaander ziet geen leden');
select pg_temp.fails($$insert into public.user_concepts (user_id, base_slug, title) values ('00000000-0000-0000-0000-00000000000a', 'diner', 'nep')$$, 'kan geen concept op naam van een ander maken');
reset role;

set role anon;
select pg_temp.fails($$select * from public.user_concepts$$, 'anon heeft geen toegang tot de tabel');
select pg_temp.ok((select count(*) from public.shared_concept('abcdefghijklmnopqrstuvwxyz012345')) = 1, 'anon leest via geldige deellink');
select pg_temp.ok((select count(*) from public.shared_concept('fout-token-fout-token-fout-1234')) = 0, 'onjuiste deellink geeft niets');
select pg_temp.ok((select count(*) from public.shared_concept(null)) = 0, 'lege deellink geeft niets');
reset role;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a', 'anna@x.nl');
select public.delete_my_account();
reset role;
select pg_temp.ok((select count(*) from public.user_concepts) = 0 and (select count(*) from public.user_concept_versions) = 0, 'account verwijderen wist concepten en versies');

-- Aanmelden en statistiek
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@x.nl');
insert into public.user_concepts (id, base_slug, title, data, registration_token, registration_open, registration_limit) values ('22222222-2222-2222-2222-222222222222', 'diner', 'Diner Bob', '{"datum":"2027-05-01"}', 'regtokenregtokenregtoken1234', true, 2);
reset role;
set role anon;
select pg_temp.ok((select open from public.registration_info('regtokenregtokenregtoken1234')) = true, 'anon ziet aanmeldinfo via token');
select public.register_for_event('regtokenregtokenregtoken1234', 'Carla', 'Carla@X.nl', 'Bureau', array['vegan'], null);
select public.register_for_event('regtokenregtokenregtoken1234', 'Carla C.', 'carla@x.nl', 'Bureau', array['vegan'], null);
select public.register_for_event('regtokenregtokenregtoken1234', 'Dirk', 'dirk@x.nl', null, '{}', null);
select pg_temp.fails($$select public.register_for_event('regtokenregtokenregtoken1234', 'Eva', 'eva@x.nl', null, '{}', null)$$, 'aanmelden stopt bij de limiet');
select pg_temp.fails($$select * from public.event_registrations$$, 'anon kan de deelnemerslijst niet lezen');
select public.track('view_concept', 'diner'); select public.track('view_concept', 'diner'); select public.track('onzin', 'diner');
select pg_temp.fails($$select * from public.site_stats$$, 'statistiek is niet publiek leesbaar');
reset role;
select pg_temp.ok((select count(*) from public.event_registrations where concept_id = '22222222-2222-2222-2222-222222222222') = 2, 'dubbele aanmelding wordt bijgewerkt, niet verdubbeld');
select pg_temp.ok((select n from public.site_stats where event = 'view_concept' and slug = 'diner') = 2 and (select count(*) from public.site_stats) = 1, 'statistiek telt alleen bekende gebeurtenissen');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c', 'carla@x.nl');
select pg_temp.ok((select count(*) from public.event_registrations) = 0, 'buitenstaander ziet geen aanmeldingen');
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b', 'bob@x.nl');
select pg_temp.ok((select count(*) from public.event_registrations) = 2, 'eigenaar ziet de aanmeldingen');
reset role;
