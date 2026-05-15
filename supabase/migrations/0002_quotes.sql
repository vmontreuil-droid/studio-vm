-- Offerte-aanvragen vanaf de calculator (/offerte).
-- Toepassen: Supabase → SQL Editor → plak dit → Run.

create table if not exists public.quotes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  locale      text not null default 'nl',
  name        text not null,
  email       text not null,
  message     text,
  base        text not null,
  modules     jsonb not null default '[]'::jsonb,
  plan        text not null,
  est_low     int,
  est_high    int,
  monthly     int,
  status      text not null default 'nieuw',
  source      text not null default 'offerte-calculator'
);

create index if not exists quotes_created_idx
  on public.quotes (created_at desc);
create index if not exists quotes_status_idx
  on public.quotes (status);

-- RLS aan, geen policies → enkel de service-role key (server-side) heeft
-- toegang. De anon/public key kan deze tabel niet lezen of schrijven.
alter table public.quotes enable row level security;
