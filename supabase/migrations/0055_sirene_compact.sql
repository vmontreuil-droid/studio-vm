-- ============================================================
-- 0055 — Sirene compact + wat 0048 op FR/UK miste
-- ------------------------------------------------------------
-- sirene_enterprises bevat de volledige Sirene-stock (~42 M vestigingen,
-- ook gesloten en buiten de doelgroep). Op die grootte haalde 0048 de
-- kolom website_discovery_at nooit binnen en lopen tellingen in de
-- time-out, waardoor de website-zoeker elke nacht dezelfde 100 rijen nam.
-- Nieuw: een compacte tabel met enkel actieve vestigingen in de
-- doelgroep-codes (± 535 k), gevuld door scripts/sirene-compact-import.mjs.
--
-- ELK BLOK APART draaien in de SQL-editor, in deze volgorde:
--   BLOK 1 nu, BLOK 2 na de import, BLOK 3 na controle.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOK 1 — lege compacte tabel + UK-kolom
-- ────────────────────────────────────────────────────────────
create table if not exists public.sirene_compact (
  siret                text primary key,
  siren                text,
  legal_form           text,
  status               text,
  start_date           date,
  name                 text,
  postcode             text,
  city                 text,
  street               text,
  ape_main             text,
  email                text,
  phone                text,
  website              text,
  email_found          jsonb,
  email_scanned_at     timestamptz,
  website_discovery_at timestamptz,
  updated_at           timestamptz not null default now()
);
alter table public.sirene_compact enable row level security;
revoke all on public.sirene_compact from anon, authenticated;

alter table public.uk_companies
  add column if not exists website_discovery_at timestamptz;
create index if not exists uk_sic_main_prefix_idx
  on public.uk_companies (sic_main text_pattern_ops);


-- ────────────────────────────────────────────────────────────
-- BLOK 2 — na de import: wisselen + indexen
-- ────────────────────────────────────────────────────────────
begin;
alter table public.sirene_enterprises rename to sirene_enterprises_oud;
alter table public.sirene_compact rename to sirene_enterprises;
commit;

create index if not exists sirene_c_postcode_idx    on public.sirene_enterprises (postcode);
create index if not exists sirene_c_status_idx      on public.sirene_enterprises (status);
create index if not exists sirene_c_ape_prefix_idx  on public.sirene_enterprises (ape_main text_pattern_ops);
create index if not exists sirene_c_email_scan_idx  on public.sirene_enterprises (email_scanned_at);
create index if not exists sirene_c_discovery_idx   on public.sirene_enterprises (website_discovery_at);
create index if not exists sirene_c_name_trgm       on public.sirene_enterprises using gin (name gin_trgm_ops);
create index if not exists sirene_c_batch_finder_idx
  on public.sirene_enterprises (status)
  where website is not null and email_scanned_at is null;
analyze public.sirene_enterprises;


-- ────────────────────────────────────────────────────────────
-- BLOK 3 — na controle: de oude reuzetabel weg (geeft schijfruimte vrij)
-- ────────────────────────────────────────────────────────────
drop table if exists public.sirene_enterprises_oud;
