-- ============================================================
-- STUDIO-VM "GA LIVE"-CLEANUP
-- ------------------------------------------------------------
-- Run in Supabase SQL Editor, blok per blok.
-- LEES ELK BLOK voor uitvoeren — sommige zijn niet ongedaan
-- te maken (truncate cascade verwijdert ook gelinkte rows).
--
-- Aanbevolen volgorde:
--   1) Eerst BLOK 0 draaien (overzicht, niets gewist).
--   2) Dan BLOK 1 (scans + health-checks) — dat is de zekere.
--   3) Pas BLOK 2 en verder per geval bekijken.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOK 0 — Overzicht: tellingen per tabel (wist niets)
-- ────────────────────────────────────────────────────────────
select 'scan_requests'      as tabel, count(*) from public.scan_requests
union all
select 'health_checks',         count(*) from public.health_checks
union all
select 'prospect_outreach',     count(*) from public.prospect_outreach
union all
select 'form_submissions',      count(*) from public.form_submissions
union all
select 'quotes',                count(*) from public.quotes
union all
select 'invoices',              count(*) from public.invoices
union all
select 'prospects (KBO/etc)',   count(*) from public.prospects
order by 1;


-- ────────────────────────────────────────────────────────────
-- BLOK 1 — Scans + health-checks volledig wissen
-- (jij vroeg: "alle scans mogen er ook uit")
-- ────────────────────────────────────────────────────────────
truncate table public.scan_requests   restart identity cascade;
truncate table public.health_checks   restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 2 — Test-mails uit outreach-engine
-- ⚠️ Alleen draaien als je géén lopende outreach hebt waarvan
--    je nog opvolg-mails verwacht. De warmup-counters in
--    company_settings blijven staan (dat hoort).
-- ────────────────────────────────────────────────────────────
-- truncate table public.prospect_outreach restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 3 — Contactformulier-inzendingen
-- (vaak bevat dit test-submissions van tijdens development)
-- ────────────────────────────────────────────────────────────
-- truncate table public.form_submissions restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 4 — Test-offertes opruimen, Carpentier behouden
-- Eerst kijken wat er staat:
--   select id, client_name, status, created_at
--     from public.quotes
--     order by created_at desc;
-- Daarna deze regel uitvoeren (Carpentier blijft staan):
-- ────────────────────────────────────────────────────────────
-- delete from public.quotes
--   where lower(coalesce(client_name, '')) not like '%carpentier%';


-- ────────────────────────────────────────────────────────────
-- BLOK 5 — Test-facturen opruimen
-- ⚠️ EERST kijken wat erin zit. Een echte verstuurde factuur
--    mag je niet zomaar verwijderen (boekhoudkundig spoor).
--   select id, client_email, number, status, amount_cents, issued_at
--     from public.invoices
--     order by created_at desc;
-- Pas truncaten als ALLES test is:
-- ────────────────────────────────────────────────────────────
-- truncate table public.invoices restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 6 — Wat absoluut NIET aanraken
-- ────────────────────────────────────────────────────────────
--   public.prospects               KBO/Sirene/UK — echte business-data
--   public.company_settings        Firma + outreach config
--   public.monitors                Uptime-checks
--   public.journal                 Changelog
--   public.client_portal / sites   Echte klant-portals (geen demo)
--   public.bank, purchases, ...    Boekhouding


-- ────────────────────────────────────────────────────────────
-- Klaar? Run dan opnieuw BLOK 0 — alles wat je geleegd hebt
-- staat nu op 0. Vanaf hier zijn alle nieuwe rows ECHTE klanten.
-- ────────────────────────────────────────────────────────────
