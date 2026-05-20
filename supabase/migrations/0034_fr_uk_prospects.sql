-- Frankrijk (Sirene/INSEE) + UK (Companies House) — open bedrijvendata.
-- Zelfde structuur als kbo_enterprises zodat de prospects-pagina
-- één UI heeft voor de drie landen.

-- ---------- 🇫🇷 Sirene (Frankrijk, ~25 M établissements) ----------
create table if not exists public.sirene_enterprises (
  siret              text primary key,         -- 14 cijfers, uniek per vestiging
  siren              text,                     -- 9 cijfers, uniek per onderneming
  legal_form         text,                     -- categorieJuridiqueUniteLegale
  status             text,                     -- 'A' = actief, 'F' = gesloten
  start_date         date,
  name               text,
  postcode           text,
  city               text,
  street             text,
  ape_main           text,                     -- APE/NAF-code (~NACE)
  email              text,
  phone              text,
  website            text,
  email_found        jsonb,
  email_scanned_at   timestamptz,
  updated_at         timestamptz not null default now()
);
create index if not exists sirene_postcode_idx     on public.sirene_enterprises (postcode);
create index if not exists sirene_status_idx       on public.sirene_enterprises (status);
create index if not exists sirene_ape_main_idx     on public.sirene_enterprises (ape_main);
create index if not exists sirene_email_scan_idx   on public.sirene_enterprises (email_scanned_at);
create index if not exists sirene_name_trgm        on public.sirene_enterprises using gin (name gin_trgm_ops);
create index if not exists sirene_batch_finder_idx
  on public.sirene_enterprises (status)
  where website is not null and email_scanned_at is null;
alter table public.sirene_enterprises enable row level security;

-- ---------- 🇬🇧 Companies House (UK, ~5 M companies) ----------
create table if not exists public.uk_companies (
  company_number     text primary key,
  name               text,
  status             text,                     -- 'Active' / 'Dissolved' / ...
  category           text,                     -- bv. 'Private Limited Company'
  incorporated_date  date,
  postcode           text,
  city               text,
  street             text,
  sic_main           text,                     -- SIC-code (~NACE)
  email              text,
  phone              text,
  website            text,
  email_found        jsonb,
  email_scanned_at   timestamptz,
  updated_at         timestamptz not null default now()
);
create index if not exists uk_postcode_idx     on public.uk_companies (postcode);
create index if not exists uk_status_idx       on public.uk_companies (status);
create index if not exists uk_sic_main_idx     on public.uk_companies (sic_main);
create index if not exists uk_email_scan_idx   on public.uk_companies (email_scanned_at);
create index if not exists uk_name_trgm        on public.uk_companies using gin (name gin_trgm_ops);
create index if not exists uk_batch_finder_idx
  on public.uk_companies (status)
  where website is not null and email_scanned_at is null;
alter table public.uk_companies enable row level security;

-- ---------- Atomic-claim functies (parallel-safe) ----------
create or replace function public.claim_sirene_for_scan(
  p_limit    integer,
  p_q        text default null,
  p_postcode text default null,
  p_ape      text default null,
  p_form     text default null,
  p_active   boolean default true
) returns table (enterprise_number text, website text)
language plpgsql
as $$
begin
  return query
  update public.sirene_enterprises k
     set email_scanned_at = now()
   where k.siret in (
     select e.siret
       from public.sirene_enterprises e
      where e.website is not null
        and trim(e.website) <> ''
        and e.email_scanned_at is null
        and (p_q        is null or e.name      ilike '%' || p_q || '%')
        and (p_postcode is null or e.postcode  like  p_postcode || '%')
        and (p_ape      is null or e.ape_main  like  p_ape || '%')
        and (p_form     is null or e.legal_form = p_form)
        and (not p_active        or e.status   = 'A')
      limit p_limit
        for update skip locked
   )
   returning k.siret as enterprise_number, k.website;
end;
$$;

create or replace function public.claim_uk_for_scan(
  p_limit    integer,
  p_q        text default null,
  p_postcode text default null,
  p_sic      text default null,
  p_cat      text default null,
  p_active   boolean default true
) returns table (enterprise_number text, website text)
language plpgsql
as $$
begin
  return query
  update public.uk_companies k
     set email_scanned_at = now()
   where k.company_number in (
     select e.company_number
       from public.uk_companies e
      where e.website is not null
        and trim(e.website) <> ''
        and e.email_scanned_at is null
        and (p_q        is null or e.name     ilike '%' || p_q || '%')
        and (p_postcode is null or e.postcode like  p_postcode || '%')
        and (p_sic      is null or e.sic_main like  p_sic || '%')
        and (p_cat      is null or e.category = p_cat)
        and (not p_active        or e.status  = 'Active')
      limit p_limit
        for update skip locked
   )
   returning k.company_number as enterprise_number, k.website;
end;
$$;

grant execute on function public.claim_sirene_for_scan(
  integer, text, text, text, text, boolean
) to anon, authenticated, service_role;
grant execute on function public.claim_uk_for_scan(
  integer, text, text, text, text, boolean
) to anon, authenticated, service_role;
