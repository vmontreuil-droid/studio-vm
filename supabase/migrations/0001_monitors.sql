-- Site-monitoring voor de gratis scan-tool.
-- Toepassen: Supabase → SQL Editor → plak dit → Run.
-- Of via CLI: supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.monitors (
  id            uuid primary key default gen_random_uuid(),
  url           text not null,
  email         text not null,
  locale        text not null default 'nl',
  token         text not null unique,
  active        boolean not null default false,
  created_at    timestamptz not null default now(),
  confirmed_at  timestamptz,
  last_scan_at  timestamptz,
  unsubscribed_at timestamptz
);

create index if not exists monitors_active_idx
  on public.monitors (active) where active = true;
create unique index if not exists monitors_url_email_idx
  on public.monitors (lower(url), lower(email));

create table if not exists public.monitor_scans (
  id              uuid primary key default gen_random_uuid(),
  monitor_id      uuid not null references public.monitors (id) on delete cascade,
  scanned_at      timestamptz not null default now(),
  score           int,
  grade           text,
  stack           text,
  cert_days_left  int,
  critical_count  int,
  snapshot        jsonb
);

create index if not exists monitor_scans_monitor_idx
  on public.monitor_scans (monitor_id, scanned_at desc);

-- RLS aan, geen policies → enkel de service-role key (server-side) heeft
-- toegang. De anon/public key kan deze tabellen niet lezen of schrijven.
alter table public.monitors enable row level security;
alter table public.monitor_scans enable row level security;
