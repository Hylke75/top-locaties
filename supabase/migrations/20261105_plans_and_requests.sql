-- Top Locaties — fase 6 (deelbare plannen) en fase 7 (één aanvraagformulier).
-- Idempotent. Tabellen zonder directe toegang (RLS aan, geen policies); alleen via de RPC's hieronder.

-- ---------- Fase 6: deelbare link naar een plan ----------
-- Alleen keuzes (gevoel, locatie, makers, eventgegevens zonder naam/e-mail). Geen persoonsgegevens; de URL bevat alleen een willekeurig id.
create table if not exists public.shared_plans (
  id text primary key,
  base_slug text not null check (base_slug ~ '^[a-z0-9-]{2,60}$'),
  data jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days'
);
alter table public.shared_plans enable row level security;
revoke all on public.shared_plans from anon, authenticated;

create or replace function public.create_shared_plan(p_slug text, p_data jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_id text;
  v_answers jsonb;
  v_clean jsonb;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9-]{2,60}$' then raise exception 'ongeldig concept' using errcode = '22023'; end if;
  -- Eenvoudige rem tegen misbruik: maximaal 120 nieuwe deellinks per minuut in totaal.
  if (select count(*) from public.shared_plans where created_at > now() - interval '1 minute') >= 120 then
    raise exception 'even te druk, probeer het zo opnieuw' using errcode = '53400';
  end if;
  -- Alleen toegestane antwoordvelden (geen naam, organisatie of e-mail).
  select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) into v_answers
    from jsonb_each(coalesce(p_data->'answers', '{}'::jsonb))
    where key in ('datum', 'gasten', 'start', 'eind', 'doel', 'doelgroep', 'dieet', 'toegankelijk', 'hybride', 'budget');
  v_clean := jsonb_build_object(
    'feelings', coalesce(p_data->'feelings', '[]'::jsonb),
    'venueId', p_data->'venueId',
    'supplierIds', coalesce(p_data->'supplierIds', '[]'::jsonb),
    'answers', v_answers);
  if pg_column_size(v_clean) > 8000 then raise exception 'plan te groot' using errcode = '22023'; end if;
  v_id := replace(gen_random_uuid()::text, '-', '');
  insert into public.shared_plans (id, base_slug, data) values (v_id, p_slug, v_clean);
  delete from public.shared_plans where expires_at < now(); -- opruimen
  return v_id;
end $$;

create or replace function public.get_shared_plan(p_id text)
returns table (base_slug text, data jsonb, created_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.base_slug, s.data, s.created_at, s.expires_at from public.shared_plans s
  where s.id = p_id and s.expires_at > now();
$$;

revoke all on function public.create_shared_plan(text, jsonb) from public;
revoke all on function public.get_shared_plan(text) from public;
grant execute on function public.create_shared_plan(text, jsonb) to anon, authenticated;
grant execute on function public.get_shared_plan(text) to anon, authenticated;

-- ---------- Fase 7: één aanvraag naar locatie en makers ----------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  base_slug text not null check (base_slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]{2,}$'),
  organisation text check (char_length(organisation) <= 160),
  event_date date,
  guests integer check (guests between 1 and 100000),
  message text check (char_length(message) <= 4000),
  venue_slug text,
  venue_name text,
  suppliers jsonb not null default '[]'::jsonb,
  plan jsonb,
  venue_forwarded boolean not null default false,
  status text not null default 'nieuw' check (status in ('nieuw', 'doorgestuurd', 'afgehandeld', 'spam'))
);
alter table public.quote_requests enable row level security;
revoke all on public.quote_requests from anon, authenticated;
create index if not exists quote_requests_created_idx on public.quote_requests (created_at desc);

-- Wordt aangeroepen door de serverfunctie /api/aanvraag/ (die ook honeypot, herkomst en tempo controleert).
-- De database remt zelf ook: max. 3 aanvragen per e-mailadres per uur en 30 per minuut in totaal.
create or replace function public.submit_quote_request(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_email text := lower(trim(p->>'email'));
begin
  if (select count(*) from public.quote_requests where email = v_email and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'te veel aanvragen' using errcode = '53400';
  end if;
  if (select count(*) from public.quote_requests where created_at > now() - interval '1 minute') >= 30 then
    raise exception 'even te druk' using errcode = '53400';
  end if;
  insert into public.quote_requests (base_slug, name, email, organisation, event_date, guests, message, venue_slug, venue_name, suppliers, plan, venue_forwarded, status)
  values (p->>'base_slug', trim(p->>'name'), v_email, nullif(trim(p->>'organisation'), ''),
          nullif(p->>'event_date', '')::date, nullif(p->>'guests', '')::integer, nullif(trim(p->>'message'), ''),
          nullif(p->>'venue_slug', ''), nullif(p->>'venue_name', ''), coalesce(p->'suppliers', '[]'::jsonb), p->'plan',
          coalesce((p->>'venue_forwarded')::boolean, false), case when coalesce((p->>'venue_forwarded')::boolean, false) then 'doorgestuurd' else 'nieuw' end)
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.submit_quote_request(jsonb) from public;
grant execute on function public.submit_quote_request(jsonb) to anon, authenticated;
