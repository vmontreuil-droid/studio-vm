-- CRM: interne notitie per aanvraag. (status bestaat al, default 'nieuw'.)
-- Toepassen na 0003. Supabase → SQL Editor → Run.

alter table public.quotes
  add column if not exists notes text;
