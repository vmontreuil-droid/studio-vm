-- ============================================================
-- SIRENE-TRIM — disk-verbruik op Supabase verlagen
-- ------------------------------------------------------------
-- Twee hefbomen, ELK BLOK APART runnen in Supabase SQL Editor.
-- 'concurrently' en 'vacuum' MOGEN NIET in een transactie zitten.
--
-- Aanbevolen volgorde:
--   1) BLOK 0 vooraf (size + count)
--   2) BLOK 1 (zware GIN-index swappen)
--   3) BLOK 2a (preview status-verdeling)
--   4) BLOK 2b (delete inactive + vacuum)
--   5) BLOK 0 nogmaals (zien wat gewonnen is)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- BLOK 0 — Stand vooraf (en achteraf opnieuw)
-- ────────────────────────────────────────────────────────────
select
  count(*)                                              as totaal_rijen,
  pg_size_pretty(pg_total_relation_size('public.sirene_enterprises'))
                                                        as totale_grootte,
  pg_size_pretty(pg_relation_size('public.sirene_enterprises'))
                                                        as tabel_alleen,
  pg_size_pretty(pg_indexes_size('public.sirene_enterprises'))
                                                        as indexes_samen
from public.sirene_enterprises;

-- Overzicht per index — zien welke de grootste zijn:
select indexname,
       pg_size_pretty(pg_relation_size(format('public.%I', indexname)::regclass)) as grootte
  from pg_indexes
 where schemaname = 'public' and tablename = 'sirene_enterprises'
 order by pg_relation_size(format('public.%I', indexname)::regclass) desc;


-- ────────────────────────────────────────────────────────────
-- BLOK 1 — Zware GIN-index swappen voor partiële (~10 GB winst)
-- De volle trgm-index op 42M namen is overkill — we doorzoeken
-- alleen actieve etablissementen met een website (= de prospects-
-- pool die je effectief mailt). Partiële index = ~5-8M rijen.
--
-- ⚠ CONCURRENTLY moet APART van transacties draaien. In Supabase
--    SQL Editor: run deze regel per regel of plak ze één voor één.
-- ────────────────────────────────────────────────────────────

drop index concurrently if exists public.sirene_name_trgm;

create index concurrently if not exists sirene_name_trgm_active
  on public.sirene_enterprises
  using gin (name gin_trgm_ops)
  where website is not null and status = 'A';


-- ────────────────────────────────────────────────────────────
-- BLOK 2a — Preview: hoeveel rijen verdwijnen als we inactive
-- (status <> 'A') verwijderen?
-- ────────────────────────────────────────────────────────────
select status,
       count(*)                                              as rijen,
       round(100.0 * count(*) / sum(count(*)) over (), 1)    as pct
  from public.sirene_enterprises
  group by status
  order by 2 desc;


-- ────────────────────────────────────────────────────────────
-- BLOK 2b — Inactive rijen wegen + ruimte echt vrijgeven
-- ⚠ DELETE op miljoenen rijen duurt enkele minuten. Wacht
--    rustig af. Daarna VACUUM ANALYZE om dead-tuples op te
--    ruimen en statistieken te verversen.
-- ────────────────────────────────────────────────────────────

delete from public.sirene_enterprises
  where status is null
     or status <> 'A';

vacuum analyze public.sirene_enterprises;


-- ────────────────────────────────────────────────────────────
-- Klaar? Run BLOK 0 opnieuw — vergelijk de cijfers.
-- Verwacht: totale_grootte daalt ~25-35 GB, tabel_alleen
-- daalt ~25-35%, indexes_samen flink terug (vooral de GIN).
-- ────────────────────────────────────────────────────────────
