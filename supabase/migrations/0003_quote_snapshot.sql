-- Builder-ontwerpen: volledige config opslaan bij een quotes-rij.
-- Toepassen na 0002. Supabase → SQL Editor → Run.

alter table public.quotes
  add column if not exists snapshot jsonb;
