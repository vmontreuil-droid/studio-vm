-- Telefoonnummer verplicht bij intake/aanbetaling.
-- Toepassen: Supabase → SQL Editor → plak dit → Run.

alter table public.quotes
  add column if not exists phone text;
