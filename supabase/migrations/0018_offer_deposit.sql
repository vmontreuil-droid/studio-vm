-- Directe intake + 30% aanbetaling vanaf de offerte-configurator.
-- Toepassen: Supabase → SQL Editor → plak dit → Run.
-- Breidt de bestaande quotes-tabel uit (geen nieuwe tabel: blijft in
-- /admin/aanvragen verschijnen).

alter table public.quotes
  add column if not exists company              text,
  add column if not exists address              text,
  add column if not exists vat_number           text,
  add column if not exists one_off_cents         int,
  add column if not exists discount_cents        int,
  add column if not exists deposit_cents          int,
  add column if not exists term                   int,
  add column if not exists monthly_install_cents  int,
  add column if not exists subscription_cents     int,
  add column if not exists domain_kind            text,
  add column if not exists domain_monthly_cents   int,
  add column if not exists mail_kind              text,
  add column if not exists mail_users             int,
  add column if not exists mail_monthly_cents     int,
  add column if not exists monthly_total_cents    int,
  add column if not exists lockin                 boolean not null default false,
  add column if not exists deposit_status         text not null default 'open',
  add column if not exists mollie_payment_id      text,
  add column if not exists deposit_paid_at        timestamptz;

create index if not exists quotes_deposit_status_idx
  on public.quotes (deposit_status);
