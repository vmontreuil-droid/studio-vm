-- Online betalen via Mollie: koppeling op facturen.
-- Toepassen na 0014. Supabase -> SQL Editor -> Run.

alter table public.invoices
  add column if not exists mollie_payment_id text;
alter table public.invoices
  add column if not exists paid_at timestamptz;

create index if not exists invoices_mollie_idx
  on public.invoices (mollie_payment_id);
