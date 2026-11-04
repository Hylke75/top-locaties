-- Top Locaties — eigen eventconcepten (conceptmaker), delen, samenwerken en versies.
-- Supabase-project: top-locaties (los van de Greenbookings-database).
-- Idempotent: veilig om (opnieuw) in zijn geheel uit te voeren in de SQL Editor.

-- 1. Eigen concepten ---------------------------------------------------------------------------
create table if not exists public.user_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  base_slug text not null check (base_slug ~ '^[a-z0-9-]{1,60}$'),
  title text not null check (char_length(title) between 1 and 160),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 300000),
  share_token text unique check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{24,64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_concepts add column if not exists share_token text unique check (share_token is null or share_token ~ '^[A-Za-z0-9_-]{24,64}$');
create index if not exists user_concepts_user_id_idx on public.user_concepts (user_id, updated_at desc);

-- 2. Samenwerken: leden per concept (uitnodiging op e-mailadres; rol redacteur of lezer) ----------
create table if not exists public.concept_members (
  concept_id uuid not null references public.user_concepts(id) on delete cascade,
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  invited_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (concept_id, email)
);
create index if not exists concept_members_email_idx on public.concept_members (email);

-- 3. Versies: automatische momentopnamen (max. één per 10 minuten, max. 50 per concept) ----------
create table if not exists public.user_concept_versions (
  id bigint generated always as identity primary key,
  concept_id uuid not null references public.user_concepts(id) on delete cascade,
  title text not null,
  data jsonb not null,
  saved_by_email text,
  created_at timestamptz not null default now()
);
create index if not exists user_concept_versions_idx on public.user_concept_versions (concept_id, created_at desc);

-- Hulpfuncties (security definer, zodat RLS-regels elkaar niet recursief aanroepen).
-- In een eigen schema dat niet via de API bereikbaar is (Supabase-advies). --------------------------
create schema if not exists tl_private;
revoke all on schema tl_private from public, anon;
grant usage on schema tl_private to authenticated;
create or replace function tl_private.tl_my_email() returns text language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) $$;
create or replace function tl_private.tl_is_owner(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_concepts c where c.id = cid and c.user_id = auth.uid()) $$;
create or replace function tl_private.tl_member_role(cid uuid) returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.concept_members m where m.concept_id = cid and m.email = tl_private.tl_my_email() $$;
revoke execute on function tl_private.tl_is_owner(uuid), tl_private.tl_member_role(uuid) from public, anon;
grant execute on function tl_private.tl_is_owner(uuid), tl_private.tl_member_role(uuid), tl_private.tl_my_email() to authenticated;

-- Triggers ---------------------------------------------------------------------------------------
create or replace function public.tl_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists user_concepts_touch on public.user_concepts;
create trigger user_concepts_touch before update on public.user_concepts
  for each row execute function public.tl_touch_updated_at();

-- Eigenaar blijft eigenaar; alleen de eigenaar beheert de deellink.
create or replace function public.tl_guard_concept() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'De eigenaar van een concept kan niet worden gewijzigd.'; end if;
  if new.share_token is distinct from old.share_token and old.user_id <> auth.uid() then raise exception 'Alleen de eigenaar kan de deellink wijzigen.'; end if;
  return new;
end; $$;
drop trigger if exists user_concepts_guard on public.user_concepts;
create trigger user_concepts_guard before update on public.user_concepts
  for each row execute function public.tl_guard_concept();

create or replace function public.tl_limit_user_concepts() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.user_concepts where user_id = new.user_id) >= 100 then
    raise exception 'Maximaal 100 concepten per account.';
  end if;
  return new;
end; $$;
revoke execute on function public.tl_limit_user_concepts() from public, anon, authenticated;
drop trigger if exists user_concepts_limit on public.user_concepts;
create trigger user_concepts_limit before insert on public.user_concepts
  for each row execute function public.tl_limit_user_concepts();

create or replace function public.tl_snapshot_version() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.data is distinct from new.data or old.title is distinct from new.title then
    if not exists (select 1 from public.user_concept_versions v where v.concept_id = old.id and v.created_at > now() - interval '10 minutes') then
      insert into public.user_concept_versions (concept_id, title, data, saved_by_email) values (old.id, old.title, old.data, tl_private.tl_my_email());
      delete from public.user_concept_versions v where v.concept_id = old.id and v.id not in (
        select id from public.user_concept_versions where concept_id = old.id order by created_at desc limit 50);
    end if;
  end if;
  return new;
end; $$;
revoke execute on function public.tl_snapshot_version() from public, anon, authenticated;
drop trigger if exists user_concepts_versions on public.user_concepts;
create trigger user_concepts_versions after update on public.user_concepts
  for each row execute function public.tl_snapshot_version();

create or replace function public.tl_limit_members() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.concept_members where concept_id = new.concept_id) >= 20 then
    raise exception 'Maximaal 20 samenwerkers per concept.';
  end if;
  return new;
end; $$;
revoke execute on function public.tl_limit_members() from public, anon, authenticated;
drop trigger if exists concept_members_limit on public.concept_members;
create trigger concept_members_limit before insert on public.concept_members
  for each row execute function public.tl_limit_members();

-- Rechten (RLS) ----------------------------------------------------------------------------------
alter table public.user_concepts enable row level security;
alter table public.concept_members enable row level security;
alter table public.user_concept_versions enable row level security;
revoke all on public.user_concepts, public.concept_members, public.user_concept_versions from anon;
grant select, insert, update, delete on public.user_concepts to authenticated;
grant select, insert, update, delete on public.concept_members to authenticated;
grant select on public.user_concept_versions to authenticated;

drop policy if exists "eigen concepten lezen" on public.user_concepts;
drop policy if exists "eigen concepten maken" on public.user_concepts;
drop policy if exists "eigen concepten wijzigen" on public.user_concepts;
drop policy if exists "eigen concepten verwijderen" on public.user_concepts;
drop policy if exists "concepten lezen" on public.user_concepts;
drop policy if exists "concepten wijzigen" on public.user_concepts;
create policy "concepten lezen" on public.user_concepts for select to authenticated
  using (user_id = (select auth.uid()) or tl_private.tl_member_role(id) is not null);
create policy "eigen concepten maken" on public.user_concepts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "concepten wijzigen" on public.user_concepts for update to authenticated
  using (user_id = (select auth.uid()) or tl_private.tl_member_role(id) = 'editor')
  with check (user_id = (select auth.uid()) or tl_private.tl_member_role(id) = 'editor');
create policy "eigen concepten verwijderen" on public.user_concepts for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "leden lezen" on public.concept_members;
drop policy if exists "leden beheren" on public.concept_members;
drop policy if exists "leden wijzigen" on public.concept_members;
drop policy if exists "leden verwijderen" on public.concept_members;
create policy "leden lezen" on public.concept_members for select to authenticated
  using (tl_private.tl_is_owner(concept_id) or email = tl_private.tl_my_email() or tl_private.tl_member_role(concept_id) is not null);
create policy "leden beheren" on public.concept_members for insert to authenticated
  with check (tl_private.tl_is_owner(concept_id));
create policy "leden wijzigen" on public.concept_members for update to authenticated
  using (tl_private.tl_is_owner(concept_id)) with check (tl_private.tl_is_owner(concept_id));
create policy "leden verwijderen" on public.concept_members for delete to authenticated
  using (tl_private.tl_is_owner(concept_id) or email = tl_private.tl_my_email());

drop policy if exists "versies lezen" on public.user_concept_versions;
create policy "versies lezen" on public.user_concept_versions for select to authenticated
  using (tl_private.tl_is_owner(concept_id) or tl_private.tl_member_role(concept_id) is not null);

-- Delen: alleen-lezen via een geheime link (ook zonder account) ---------------------------------
create or replace function public.shared_concept(token text) returns table (title text, base_slug text, data jsonb, updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.title, c.base_slug, c.data, c.updated_at from public.user_concepts c
  where token is not null and length(token) >= 24 and c.share_token = token $$;
revoke execute on function public.shared_concept(text) from public;
grant execute on function public.shared_concept(text) to anon, authenticated;

-- AVG: eigen account, concepten en lidmaatschappen verwijderen -----------------------------------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  delete from public.concept_members where email = tl_private.tl_my_email();
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 4. Aanmelden voor een event (deelnemerslijst) ---------------------------------------------------
alter table public.user_concepts add column if not exists registration_token text unique check (registration_token is null or registration_token ~ '^[A-Za-z0-9_-]{24,64}$');
alter table public.user_concepts add column if not exists registration_open boolean not null default false;
alter table public.user_concepts add column if not exists registration_limit integer check (registration_limit is null or registration_limit between 1 and 5000);

create table if not exists public.event_registrations (
  id bigint generated always as identity primary key,
  concept_id uuid not null references public.user_concepts(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organisation text check (organisation is null or char_length(organisation) <= 120),
  diet text[] not null default '{}' check (cardinality(diet) <= 8),
  remarks text check (remarks is null or char_length(remarks) <= 500),
  created_at timestamptz not null default now(),
  unique (concept_id, email)
);
alter table public.event_registrations enable row level security;
revoke all on public.event_registrations from anon;
grant select, delete on public.event_registrations to authenticated;
drop policy if exists "aanmeldingen lezen" on public.event_registrations;
drop policy if exists "aanmeldingen verwijderen" on public.event_registrations;
create policy "aanmeldingen lezen" on public.event_registrations for select to authenticated
  using (tl_private.tl_is_owner(concept_id) or tl_private.tl_member_role(concept_id) is not null);
create policy "aanmeldingen verwijderen" on public.event_registrations for delete to authenticated
  using (tl_private.tl_is_owner(concept_id) or tl_private.tl_member_role(concept_id) = 'editor');

-- Alleen de eigenaar beheert de aanmeldlink (net als de deellink).
create or replace function public.tl_guard_concept() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.user_id is distinct from old.user_id then raise exception 'De eigenaar van een concept kan niet worden gewijzigd.'; end if;
  if (new.share_token is distinct from old.share_token or new.registration_token is distinct from old.registration_token
      or new.registration_open is distinct from old.registration_open or new.registration_limit is distinct from old.registration_limit)
     and old.user_id <> auth.uid() then raise exception 'Alleen de eigenaar kan de deellink en de aanmelding wijzigen.'; end if;
  return new;
end; $$;

create or replace function public.registration_info(token text) returns table (title text, datum text, organisatie text, open boolean, full_ boolean)
language sql stable security definer set search_path = '' as $$
  select c.title, c.data ->> 'datum', c.data ->> 'organisatie', c.registration_open,
         (c.registration_limit is not null and (select count(*) from public.event_registrations r where r.concept_id = c.id) >= c.registration_limit)
  from public.user_concepts c where token is not null and length(token) >= 24 and c.registration_token = token $$;

create or replace function public.register_for_event(token text, p_name text, p_email text, p_organisation text default null, p_diet text[] default '{}', p_remarks text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  select id, registration_open, registration_limit into c from public.user_concepts where token is not null and length(token) >= 24 and registration_token = token;
  if c.id is null then raise exception 'Deze aanmeldlink bestaat niet (meer).'; end if;
  if not c.registration_open then raise exception 'Aanmelden is gesloten.'; end if;
  if c.registration_limit is not null and (select count(*) from public.event_registrations r where r.concept_id = c.id) >= c.registration_limit then raise exception 'Het event is vol.'; end if;
  insert into public.event_registrations (concept_id, name, email, organisation, diet, remarks)
  values (c.id, trim(p_name), lower(trim(p_email)), nullif(trim(coalesce(p_organisation, '')), ''), coalesce(p_diet, '{}'), nullif(trim(coalesce(p_remarks, '')), ''))
  on conflict (concept_id, email) do update set name = excluded.name, organisation = excluded.organisation, diet = excluded.diet, remarks = excluded.remarks;
  return 'ok';
end; $$;
revoke execute on function public.registration_info(text), public.register_for_event(text, text, text, text, text[], text) from public;
grant execute on function public.registration_info(text), public.register_for_event(text, text, text, text, text[], text) to anon, authenticated;

-- 5. Anonieme gebruiksstatistiek (alleen tellers per dag; geen personen, geen IP, geen cookies) -----
create table if not exists public.site_stats (
  day date not null default current_date,
  event text not null check (event in ('view_concept', 'briefing', 'start_maker', 'save_concept', 'download', 'quote', 'share_view', 'register', 'contact')),
  slug text not null default '' check (slug ~ '^[a-z0-9-]{0,60}$'),
  n integer not null default 0,
  primary key (day, event, slug)
);
alter table public.site_stats enable row level security;
revoke all on public.site_stats from anon, authenticated; -- alleen leesbaar met de service key (beheer)

create or replace function public.track(p_event text, p_slug text default '') returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.site_stats (day, event, slug, n) values (current_date, p_event, coalesce(p_slug, ''), 1)
  on conflict (day, event, slug) do update set n = public.site_stats.n + 1;
exception when check_violation then null; -- onbekende gebeurtenis of slug: stil negeren
end; $$;
revoke execute on function public.track(text, text) from public;
grant execute on function public.track(text, text) to anon, authenticated;

-- 6. Bestaande databases: oude kopieën in public opruimen (de regels hierboven gebruiken tl_private) ---
do $$ begin
  begin drop function if exists public.tl_member_role(uuid); exception when dependent_objects_still_exist then raise notice 'public.tl_member_role nog in gebruik'; end;
  begin drop function if exists public.tl_is_owner(uuid); exception when dependent_objects_still_exist then raise notice 'public.tl_is_owner nog in gebruik'; end;
  begin drop function if exists public.tl_my_email(); exception when dependent_objects_still_exist then raise notice 'public.tl_my_email nog in gebruik'; end;
end $$;
revoke execute on all functions in schema tl_private from public, anon;
grant execute on all functions in schema tl_private to authenticated;
