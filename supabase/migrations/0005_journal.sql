-- Journal-CMS: posts beheerbaar vanuit /admin. Toepassen na 0004.
-- Supabase → SQL Editor → Run. Zonder deze tabel valt /journal terug
-- op de ingebouwde (statische) posts — er verandert dan niets live.

create table if not exists public.journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  post_date date not null default current_date,
  read_min int not null default 4,
  published boolean not null default false,
  -- content per taal: { "nl": {title,excerpt,tag,body}, "fr": {...}, "en": {...} }
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_posts_published_idx
  on public.journal_posts (published, post_date desc);

-- RLS aan, géén anon policies: enkel de service-role (admin + server)
-- leest en schrijft. Identiek patroon als quotes/monitors.
alter table public.journal_posts enable row level security;
