-- Auto-scan-resultaat opslaan bij een aanvraag (zichtbaar in /admin).
-- Toepassen na 0009. Supabase → SQL Editor → Run. Zonder deze kolom
-- werkt alles door; er wordt dan enkel geen scan bewaard (geen fout).

alter table public.quotes
  add column if not exists scan jsonb;
