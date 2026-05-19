-- Boekhoud-suite — Module 5: bank.
-- Geïmporteerde banktransacties (CSV) + matching met verkoop-/
-- aankoopfacturen. Toepassen: Supabase -> SQL Editor -> Run.
-- Veilig her-uitvoerbaar.

create table if not exists public.bank_transactions (
  id            uuid primary key default gen_random_uuid(),
  booked_at     date not null default current_date,
  amount_cents  integer not null default 0,           -- + inkomend / - uitgaand
  counterparty  text,
  communication text,
  fingerprint   text unique,                          -- dedupe bij her-import
  matched_invoice_id  uuid references public.invoices (id) on delete set null,
  matched_purchase_id uuid references public.purchase_invoices (id) on delete set null,
  status        text not null default 'open'
                  check (status in ('open', 'gematcht', 'genegeerd')),
  created_at    timestamptz not null default now()
);
create index if not exists bank_tx_status_idx
  on public.bank_transactions (status, booked_at desc);

alter table public.bank_transactions enable row level security;
