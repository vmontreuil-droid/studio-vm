-- Auto-factuur bij akkoord: voorkomt dubbele facturen per offerte.
-- Toepassen na 0016. Supabase -> SQL Editor -> Run.

alter table public.offers add column if not exists invoiced_at timestamptz;
alter table public.invoices add column if not exists offer_id uuid;
create index if not exists invoices_offer_idx on public.invoices (offer_id);
