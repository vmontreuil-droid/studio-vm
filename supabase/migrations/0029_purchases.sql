-- Boekhoud-suite — Module 4: aankoop & leveranciers.
--   * suppliers          : leveranciersfiche
--   * purchase_invoices  : aankoopfacturen/bonnen (bedrag/btw/datum,
--                          met geüpload bronbestand + ruwe OCR)
--   * storage 'purchases': privébucket voor de bon/factuur-bestanden
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

create table if not exists public.suppliers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  vat_number  text,
  email       text,
  iban        text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists suppliers_name_idx on public.suppliers (name);

create table if not exists public.purchase_invoices (
  id            uuid primary key default gen_random_uuid(),
  supplier_id   uuid references public.suppliers (id) on delete set null,
  supplier_name text,
  number        text,
  net_cents     integer not null default 0,
  vat_cents     integer not null default 0,
  total_cents   integer not null default 0,
  vat_rate      numeric not null default 21,
  category      text,
  status        text not null default 'open'
                  check (status in ('open', 'betaald')),
  invoice_date  date not null default current_date,
  due_date      date,
  file_url      text,
  ocr           jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists purchase_inv_date_idx
  on public.purchase_invoices (invoice_date desc);
create index if not exists purchase_inv_supplier_idx
  on public.purchase_invoices (supplier_id);

-- Privébucket voor de bron-bestanden (admin-only via service-role).
insert into storage.buckets (id, name, public)
values ('purchases', 'purchases', false)
on conflict (id) do nothing;

alter table public.suppliers         enable row level security;
alter table public.purchase_invoices enable row level security;
