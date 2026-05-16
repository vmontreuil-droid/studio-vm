-- Klant-websites: de site(s) die Studio VM voor een klant bouwt/beheert.
-- Admin vult ze in (service-role), klant ziet enkel de zijne (RLS op
-- e-mail). Toepassen na 0012. Supabase -> SQL Editor -> Run.

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  name text not null,
  url text,
  status text not null default 'in_aanbouw'
    check (status in ('in_aanbouw', 'online', 'onderhoud', 'offline')),
  last_deploy date,
  repo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_email_idx on public.sites (client_email);

alter table public.sites enable row level security;

drop policy if exists sites_own on public.sites;
create policy sites_own on public.sites
  for select to authenticated
  using (client_email = public.current_email());
