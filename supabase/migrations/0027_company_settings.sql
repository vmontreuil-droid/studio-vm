-- Boekhoud-suite (Billit-stijl) — Module 1: bedrijfsinstellingen.
-- Eén rij ('default') met firmagegevens, btw, factuurnummering en
-- betaalvoorwaarden. Alle volgende modules (facturen, creditnota's,
-- aankoop, rapporten) lezen hieruit. Toepassen: Supabase -> SQL
-- Editor -> Run. Veilig her-uitvoerbaar.

create table if not exists public.company_settings (
  id                  text primary key default 'default',
  company_name        text not null default 'Studio VM',
  legal_name          text,
  vat_number          text,
  address             text,
  email               text,
  phone               text,
  website             text,
  iban                text,
  bic                 text,
  bank_holder         text,
  invoice_prefix      text    not null default 'F',
  invoice_counter     integer not null default 0,
  credit_prefix       text    not null default 'CN',
  credit_counter      integer not null default 0,
  payment_terms_days  integer not null default 14,
  default_vat_rate    numeric not null default 21,
  invoice_footer      text,
  updated_at          timestamptz not null default now()
);

-- Enige rij, geseed met de huidige gekende waarden.
insert into public.company_settings
  (id, company_name, bank_holder, iban, bic, website, email)
values
  ('default', 'Studio VM', 'Vincent Montreuil',
   'BE18 6508 9831 1165', 'REVOBEB2',
   'https://studio-vm.be', 'vmontreuil@outlook.be')
on conflict (id) do nothing;

-- Enkel de service-role (admin) mag dit lezen/schrijven.
alter table public.company_settings enable row level security;
