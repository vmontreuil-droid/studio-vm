-- Site Health Check €99 — laagdrempelig betaal-instap-product.
-- Veilig her-uitvoerbaar.

create table if not exists public.health_checks (
  id                 uuid primary key default gen_random_uuid(),
  name               text,
  email              text not null,
  website            text not null,
  locale             text not null default 'nl',
  amount_cents       integer not null default 9900,
  mollie_payment_id  text unique,
  status             text not null default 'wachten'  -- wachten | betaald | mislukt
                       check (status in ('wachten', 'betaald', 'mislukt')),
  scan               jsonb,
  scan_token         text,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);
create index if not exists health_checks_email_idx on public.health_checks (email);
create index if not exists health_checks_status_idx on public.health_checks (status);
create index if not exists health_checks_mollie_idx on public.health_checks (mollie_payment_id);

alter table public.health_checks enable row level security;
