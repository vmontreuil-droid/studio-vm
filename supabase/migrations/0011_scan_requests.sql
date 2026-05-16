-- Scan-aanvragen met e-mail: volledige analyse in het klantenportaal
-- via een tokenlink. Toepassen na 0010. Supabase → SQL Editor → Run.
-- Zonder deze tabel valt de scanner terug op de inline-teaser zonder
-- e-mailpoort (geen fout, niets breekt).

create table if not exists public.scan_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  email text not null,
  url text not null,
  locale text not null default 'nl',
  scan jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists scan_requests_token_idx
  on public.scan_requests (token);
create index if not exists scan_requests_created_idx
  on public.scan_requests (created_at desc);

-- RLS aan, géén anon policies: enkel de service-role (server + portaal).
alter table public.scan_requests enable row level security;
