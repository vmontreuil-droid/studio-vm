-- KBO-import (Kruispuntbank van Ondernemingen, FOD Economie).
-- Eén gedenormaliseerde tabel met de relevante velden voor
-- B2B-prospectie. Voeden via scripts/kbo-import.mjs (service-role).
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

create table if not exists public.kbo_enterprises (
  enterprise_number  text primary key,            -- 0XXX.XXX.XXX
  type_of_enterprise text,                        -- code
  juridical_form     text,                        -- code (rechtsvorm)
  juridical_status   text,                        -- "000" = normaal/actief
  start_date         date,
  name               text,                        -- commerciële naam, anders sociale naam
  postcode           text,
  city               text,
  street             text,
  house_number       text,
  nace_main          text,                        -- NACE 2008, hoofdactiviteit
  nace_codes         jsonb default '[]'::jsonb,   -- alle NACE-2008-codes van deze onderneming
  email              text,
  phone              text,
  website            text,
  updated_at         timestamptz not null default now()
);

create index if not exists kbo_postcode_idx on public.kbo_enterprises (postcode);
create index if not exists kbo_status_idx   on public.kbo_enterprises (juridical_status);
create index if not exists kbo_nace_main_idx on public.kbo_enterprises (nace_main);
create index if not exists kbo_nace_codes_gin on public.kbo_enterprises using gin (nace_codes);
create index if not exists kbo_name_trgm on public.kbo_enterprises using gin (name gin_trgm_ops);
create extension if not exists pg_trgm;

alter table public.kbo_enterprises enable row level security;

-- Code-vertaling (rechtsvorm-, NACE-omschrijvingen) zoals KBO publiceert.
create table if not exists public.kbo_codes (
  category    text not null,                     -- "JuridicalForm", "Nace2008", ...
  code        text not null,
  language    text not null,                     -- "NL" / "FR" / "EN"
  description text,
  primary key (category, code, language)
);
alter table public.kbo_codes enable row level security;
