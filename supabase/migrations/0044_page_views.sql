-- 0044_page_views.sql
-- Lichte first-party bezoekers-tracking — privacy-light:
--  - GEEN IP opgeslagen
--  - visitor_hash = sha256(ip|ua|dag|salt) — wisselt elke dag, niet
--    persoon-traceerbaar; dient om sessies/unieke bezoekers per dag te tellen
--  - Bots & admin-/api-/portail-routes worden serverside uitgefilterd
--  - Toelaten zonder cookie-consent (GDPR-conform — anonieme analytics)

create table if not exists page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  locale text,
  referrer text,
  visitor_hash text,
  ua_family text,      -- 'mobile' | 'desktop'
  country text         -- via x-vercel-ip-country
);

create index if not exists page_views_created_idx on page_views (created_at desc);
create index if not exists page_views_path_idx on page_views (path);
create index if not exists page_views_visitor_idx on page_views (visitor_hash, created_at desc);

alter table page_views enable row level security;

-- Standaard niemand. service_role bypasst RLS en schrijft via API.
-- Admin-pagina leest ook via service_role (server component).
do $$ begin
  create policy "no public access" on page_views for all to anon, authenticated using (false) with check (false);
exception when duplicate_object then null; end $$;
