-- Domein-jaar wordt vooruitbetaald in de aanbetaling (niet meer per maand).
-- Toepassen: Supabase → SQL Editor → plak dit → Run.

alter table public.quotes
  add column if not exists domain_year_cents int;
