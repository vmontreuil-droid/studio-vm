-- Changelog-CMS: entries beheerbaar vanuit /admin. Toepassen na 0007.
-- Supabase → SQL Editor → Run. Zonder deze tabel valt /changelog terug
-- op het ingebouwde (statische) logboek — er verandert niets live.

create table if not exists public.changelog_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  version text not null default '',
  kind text not null default 'feature',  -- launch | feature | improve | fix
  published boolean not null default false,
  -- content per taal: { "nl": {title,detail}, "fr": {...}, "en": {...} }
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists changelog_entries_pub_idx
  on public.changelog_entries (published, entry_date desc);

-- RLS aan, géén anon policies: enkel de service-role (admin + server).
alter table public.changelog_entries enable row level security;
