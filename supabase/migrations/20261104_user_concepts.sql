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

-- Hulpfuncties (security definer, zodat RLS-regels elkaar niet recursief aanroepen) --------------
create or replace function public.tl_my_email() returns text language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) $$;
create or replace function public.tl_is_owner(cid uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_concepts c where c.id = cid and c.user_id = auth.uid()) $$;
create or replace function public.tl_member_role(cid uuid) returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.concept_members m where m.concept_id = cid and m.email = public.tl_my_email() $$;
revoke execute on function public.tl_is_owner(uuid), public.tl_member_role(uuid) from public, anon;
grant execute on function public.tl_is_owner(uuid), public.tl_member_role(uuid), public.tl_my_email() to authenticated;

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
      insert into public.user_concept_versions (concept_id, title, data, saved_by_email) values (old.id, old.title, old.data, public.tl_my_email());
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
  using (user_id = (select auth.uid()) or public.tl_member_role(id) is not null);
create policy "eigen concepten maken" on public.user_concepts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "concepten wijzigen" on public.user_concepts for update to authenticated
  using (user_id = (select auth.uid()) or public.tl_member_role(id) = 'editor')
  with check (user_id = (select auth.uid()) or public.tl_member_role(id) = 'editor');
create policy "eigen concepten verwijderen" on public.user_concepts for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "leden lezen" on public.concept_members;
drop policy if exists "leden beheren" on public.concept_members;
drop policy if exists "leden wijzigen" on public.concept_members;
drop policy if exists "leden verwijderen" on public.concept_members;
create policy "leden lezen" on public.concept_members for select to authenticated
  using (public.tl_is_owner(concept_id) or email = public.tl_my_email() or public.tl_member_role(concept_id) is not null);
create policy "leden beheren" on public.concept_members for insert to authenticated
  with check (public.tl_is_owner(concept_id));
create policy "leden wijzigen" on public.concept_members for update to authenticated
  using (public.tl_is_owner(concept_id)) with check (public.tl_is_owner(concept_id));
create policy "leden verwijderen" on public.concept_members for delete to authenticated
  using (public.tl_is_owner(concept_id) or email = public.tl_my_email());

drop policy if exists "versies lezen" on public.user_concept_versions;
create policy "versies lezen" on public.user_concept_versions for select to authenticated
  using (public.tl_is_owner(concept_id) or public.tl_member_role(concept_id) is not null);

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
  delete from public.concept_members where email = public.tl_my_email();
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
