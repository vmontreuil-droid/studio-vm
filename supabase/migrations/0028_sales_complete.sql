-- Boekhoud-suite — Module 3: verkoop afwerken.
--   * products       : product-/dienstcatalogus (lijnen voor offertes/facturen)
--   * credit_notes   : creditnota's (met of zonder factuurlink)
--   * invoices.*     : aanmaning-opvolging (herinneringsniveau + datum)
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

-- ---------- Product-/dienstcatalogus ----------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  unit_price_cents integer not null default 0,
  vat_rate         numeric not null default 21,
  kind             text not null default 'dienst'
                     check (kind in ('dienst', 'product')),
  active           boolean not null default true,
  sort             integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists products_active_idx
  on public.products (active, sort);

-- ---------- Creditnota's ----------
create table if not exists public.credit_notes (
  id           uuid primary key default gen_random_uuid(),
  number       text not null,
  invoice_id   uuid references public.invoices (id) on delete set null,
  client_email text not null,
  amount_cents integer not null default 0,
  vat_rate     numeric not null default 21,
  reason       text,
  status       text not null default 'open'
                 check (status in ('open', 'verwerkt')),
  issued_at    date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists credit_notes_email_idx
  on public.credit_notes (client_email);
create index if not exists credit_notes_invoice_idx
  on public.credit_notes (invoice_id);

-- ---------- Aanmaning-opvolging op facturen ----------
alter table public.invoices
  add column if not exists reminder_level   integer not null default 0,
  add column if not exists last_reminder_at timestamptz;

-- Enkel de service-role (admin) leest/schrijft deze tabellen.
alter table public.products     enable row level security;
alter table public.credit_notes enable row level security;
