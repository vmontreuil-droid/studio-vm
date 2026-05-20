-- ============================================================
-- STUDIO-VM "GA LIVE"-CLEANUP
-- ------------------------------------------------------------
-- Run in Supabase SQL Editor, blok per blok.
-- LEES ELK BLOK voor uitvoeren — truncate cascade is permanent.
--
-- Aanbevolen volgorde:
--   1) BLOK 0 (overzicht, niets gewist) — zien wat er staat.
--   2) BLOK 1 (scans + health-checks) — zekere weg.
--   3) BLOK 2 (tickets) — de "test test test" gaan weg.
--   4) Daarna BLOK 3, 4, 5, 6 per geval bekijken.
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
select 'tickets',               count(*) from public.tickets
union all
select 'ticket_messages',       count(*) from public.ticket_messages
union all
select 'prospects (KBO/etc)',   count(*) from public.prospects
order by 1;


-- ────────────────────────────────────────────────────────────
-- BLOK 1 — Scans + health-checks volledig wissen
-- ────────────────────────────────────────────────────────────
truncate table public.scan_requests   restart identity cascade;
truncate table public.health_checks   restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 2 — Tickets (incl. de "test test test"-tickets)
-- ────────────────────────────────────────────────────────────
truncate table public.ticket_messages restart identity cascade;
truncate table public.tickets         restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 3 — Contactformulier-inzendingen (test-submissions)
-- ────────────────────────────────────────────────────────────
truncate table public.form_submissions restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 4 — Outreach-historiek wissen
-- ⚠ Alleen draaien als geen lopende echte outreach loopt waarvan
--    je nog opvolg-mails verwacht. Warmup-counters in
--    company_settings blijven staan (dat hoort).
-- ────────────────────────────────────────────────────────────
truncate table public.prospect_outreach restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- BLOK 5 — Test-offertes opruimen, Carpentier behouden
-- N.B.: quotes-tabel heeft 'name' (contactpersoon) + 'company',
-- NIET 'client_name' (dat staat alleen op invoices na 0041).
-- Eerst kijken wat er staat:
--   select id, name, company, email, status, created_at
--     from public.quotes
--     order by created_at desc;
-- Daarna deze regel uitvoeren (Carpentier blijft staan):
-- ────────────────────────────────────────────────────────────
delete from public.quotes
  where lower(coalesce(name,    '')) not like '%carpentier%'
    and lower(coalesce(company, '')) not like '%carpentier%';


-- ────────────────────────────────────────────────────────────
-- BLOK 6 — Test-facturen opruimen
-- ⚠ EERST kijken wat erin zit. Een echte verstuurde factuur
--    mag je niet zomaar verwijderen (boekhoudkundig spoor).
--   select id, client_name, client_email, number, status, amount_cents, issued_at
--     from public.invoices
--     order by created_at desc;
-- Pas truncaten als ALLES test is:
-- ────────────────────────────────────────────────────────────
-- truncate table public.invoices restart identity cascade;


-- ────────────────────────────────────────────────────────────
-- WAT NIET AANRAKEN
-- ────────────────────────────────────────────────────────────
--   public.prospects               KBO/Sirene/UK — echte business-data
--   public.sirene_enterprises      net geïmporteerd
--   public.kbo_enterprises         KBO bron
--   public.uk_companies            UK Companies House
--   public.company_settings        Firma + outreach config
--   public.monitors                Uptime-checks van MY_SITES
--   public.monitor_scans           Historiek van site-scans (grafieken!)
--   public.sites                   Echte klant-portals
--   public.bank, purchase_invoices Boekhouding
--   public.journal                 Changelog


-- ────────────────────────────────────────────────────────────
-- Klaar? Run dan opnieuw BLOK 0 — alles wat je geleegd hebt
-- staat nu op 0. Vanaf hier zijn alle nieuwe rows ECHTE klanten.
-- ────────────────────────────────────────────────────────────
