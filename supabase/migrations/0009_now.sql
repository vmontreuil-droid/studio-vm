-- /now beheerbaar vanuit /admin (één rij). Toepassen na 0008.
-- Supabase → SQL Editor → Run. Zonder deze tabel toont /now de
-- ingebouwde teksten — er verandert niets live.

create table if not exists public.now_page (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique,  -- forceert max. 1 rij
  updated_on date not null default current_date,
  -- content per taal: { "nl": {work:[],ideas:[],bandwidth:""}, "fr": {...}, "en": {...} }
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS aan, géén anon policies: enkel de service-role (admin + server).
alter table public.now_page enable row level security;
