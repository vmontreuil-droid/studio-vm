-- Nederland en Duitsland als prospectbron (Vincent 4/10).
--
-- Bron: Overture Maps Places (open data, CDLA-Permissive-2.0), ingeladen met
-- scripts/overture-import.mjs. Er bestaat geen bruikbaar open register met
-- namen én activiteitscodes voor NL (de open KVK-set is anoniem) of DE (geen
-- bulk). De Overture-categorie wordt vertaald naar een NACE-code in
-- nace_main, zodat de outreach dezelfde doelgroepen en mails gebruikt als
-- voor België (43.12 grondwerk, 42.11 wegenbouw, 71.121 studiebureau,
-- 71.122 landmeter, 71.111 architect, …).
--
-- Zelfde kolommen als kbo_enterprises / sirene_enterprises / uk_companies,
-- zodat de prospects-pagina, de e-mailzoeker en de outreach-machine zonder
-- uitzondering werken. Eén tabel per land (de bestaande code filtert per
-- tabel, niet per landkolom).

create extension if not exists pg_trgm;

-- ---------- 🇳🇱 Nederland ----------
create table if not exists public.nl_bedrijven (
  id                 text primary key,          -- Overture place-id
  name               text,
  legal_form         text,                      -- niet gekend in Overture: null
  status             text not null default 'actief',
  postcode           text,
  city               text,
  street             text,
  nace_main          text,                      -- afgeleid uit de Overture-categorie
  categorie          text,                      -- Overture taxonomy.primary
  email              text,                      -- e-mail uit Overture (indien gekend)
  phone              text,
  website            text,
  email_found        jsonb,
  email_scanned_at   timestamptz,
  lon                double precision,
  lat                double precision,
  bron               text,                      -- bv. 'overture 2026-09-23.1'
  updated_at         timestamptz not null default now()
);
create index if not exists nl_bedrijven_nace_idx      on public.nl_bedrijven (nace_main);
create index if not exists nl_bedrijven_status_idx    on public.nl_bedrijven (status);
create index if not exists nl_bedrijven_postcode_idx  on public.nl_bedrijven (postcode);
create index if not exists nl_bedrijven_email_scan_idx on public.nl_bedrijven (email_scanned_at);
create index if not exists nl_bedrijven_name_trgm     on public.nl_bedrijven using gin (name gin_trgm_ops);
create index if not exists nl_bedrijven_batch_finder_idx
  on public.nl_bedrijven (status)
  where website is not null and email_scanned_at is null;
alter table public.nl_bedrijven enable row level security;

-- ---------- 🇩🇪 Duitsland ----------
create table if not exists public.de_bedrijven (
  id                 text primary key,
  name               text,
  legal_form         text,
  status             text not null default 'actief',
  postcode           text,
  city               text,
  street             text,
  nace_main          text,
  categorie          text,
  email              text,
  phone              text,
  website            text,
  email_found        jsonb,
  email_scanned_at   timestamptz,
  lon                double precision,
  lat                double precision,
  bron               text,
  updated_at         timestamptz not null default now()
);
create index if not exists de_bedrijven_nace_idx      on public.de_bedrijven (nace_main);
create index if not exists de_bedrijven_status_idx    on public.de_bedrijven (status);
create index if not exists de_bedrijven_postcode_idx  on public.de_bedrijven (postcode);
create index if not exists de_bedrijven_email_scan_idx on public.de_bedrijven (email_scanned_at);
create index if not exists de_bedrijven_name_trgm     on public.de_bedrijven using gin (name gin_trgm_ops);
create index if not exists de_bedrijven_batch_finder_idx
  on public.de_bedrijven (status)
  where website is not null and email_scanned_at is null;
alter table public.de_bedrijven enable row level security;

-- ---------- Atomic-claim (zelfde parameters als claim_kbo_for_scan) ----------
create or replace function public.claim_nl_for_scan(
  p_limit    integer,
  p_q        text default null,
  p_postcode text default null,
  p_nace     text default null,
  p_form     text default null,
  p_active   boolean default true
) returns table (enterprise_number text, website text)
language plpgsql
as $$
begin
  return query
  update public.nl_bedrijven k
     set email_scanned_at = now()
   where k.id in (
     select e.id
       from public.nl_bedrijven e
      where e.website is not null
        and trim(e.website) <> ''
        and e.email_scanned_at is null
        and (p_q        is null or e.name      ilike '%' || p_q || '%')
        and (p_postcode is null or e.postcode  like  p_postcode || '%')
        and (p_nace     is null or e.nace_main like  p_nace || '%')
        and (p_form     is null or e.legal_form = p_form)
        and (not p_active        or e.status   = 'actief')
      limit p_limit
        for update skip locked
   )
   returning k.id as enterprise_number, k.website;
end;
$$;

create or replace function public.claim_de_for_scan(
  p_limit    integer,
  p_q        text default null,
  p_postcode text default null,
  p_nace     text default null,
  p_form     text default null,
  p_active   boolean default true
) returns table (enterprise_number text, website text)
language plpgsql
as $$
begin
  return query
  update public.de_bedrijven k
     set email_scanned_at = now()
   where k.id in (
     select e.id
       from public.de_bedrijven e
      where e.website is not null
        and trim(e.website) <> ''
        and e.email_scanned_at is null
        and (p_q        is null or e.name      ilike '%' || p_q || '%')
        and (p_postcode is null or e.postcode  like  p_postcode || '%')
        and (p_nace     is null or e.nace_main like  p_nace || '%')
        and (p_form     is null or e.legal_form = p_form)
        and (not p_active        or e.status   = 'actief')
      limit p_limit
        for update skip locked
   )
   returning k.id as enterprise_number, k.website;
end;
$$;

-- Enkel de server (service role) mag claimen; de tabellen hebben RLS zonder
-- policies, dus anon/authenticated zien er sowieso niets van.
revoke all on function public.claim_nl_for_scan(integer, text, text, text, text, boolean) from public;
revoke all on function public.claim_de_for_scan(integer, text, text, text, text, boolean) from public;
-- Supabase geeft nieuwe functies standaard ook aan anon/authenticated: expliciet intrekken.
revoke execute on function public.claim_nl_for_scan(integer, text, text, text, text, boolean) from anon, authenticated;
revoke execute on function public.claim_de_for_scan(integer, text, text, text, text, boolean) from anon, authenticated;
grant execute on function public.claim_nl_for_scan(integer, text, text, text, text, boolean) to service_role;
grant execute on function public.claim_de_for_scan(integer, text, text, text, text, boolean) to service_role;
