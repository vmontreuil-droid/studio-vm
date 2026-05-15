-- Nieuwsbrief-abonnees. Toepassen na 0005. Supabase → SQL Editor → Run.
-- Zonder deze tabel logt de inschrijving enkel (zoals nu) — er verandert
-- niets live tot je de tabel aanmaakt.

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'nl',
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create index if not exists newsletter_subscribers_active_idx
  on public.newsletter_subscribers (active, created_at desc);

-- RLS aan, géén anon policies: enkel de service-role (admin + server).
alter table public.newsletter_subscribers enable row level security;
