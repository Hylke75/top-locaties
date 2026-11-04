-- Top Locaties — eigen eventconcepten van geregistreerde gebruikers (conceptmaker).
-- Supabase-project: top-locaties (los van de Greenbookings-database).
create table public.user_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  base_slug text not null check (base_slug ~ '^[a-z0-9-]{1,60}$'),
  title text not null check (char_length(title) between 1 and 160),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 300000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_concepts_user_id_idx on public.user_concepts (user_id, updated_at desc);

create or replace function public.tl_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;
create trigger user_concepts_touch before update on public.user_concepts
  for each row execute function public.tl_touch_updated_at();

alter table public.user_concepts enable row level security;
revoke all on public.user_concepts from anon;
grant select, insert, update, delete on public.user_concepts to authenticated;

create policy "eigen concepten lezen" on public.user_concepts for select to authenticated using (user_id = (select auth.uid()));
create policy "eigen concepten maken" on public.user_concepts for insert to authenticated with check (user_id = (select auth.uid()));
create policy "eigen concepten wijzigen" on public.user_concepts for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "eigen concepten verwijderen" on public.user_concepts for delete to authenticated using (user_id = (select auth.uid()));

-- Max. 100 concepten per account.
create or replace function public.tl_limit_user_concepts() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.user_concepts where user_id = new.user_id) >= 100 then
    raise exception 'Maximaal 100 concepten per account.';
  end if;
  return new;
end; $$;
revoke execute on function public.tl_limit_user_concepts() from public, anon, authenticated;
create trigger user_concepts_limit before insert on public.user_concepts
  for each row execute function public.tl_limit_user_concepts();

-- AVG: eigen account (en alle concepten) verwijderen.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Niet ingelogd.'; end if;
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
