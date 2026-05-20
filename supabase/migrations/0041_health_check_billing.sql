-- Facturatiegegevens — gedeeld door health_checks + invoices.
-- FOD Financiën-vereisten voor een geldige B2B-factuur: naam/handels-
-- naam + adres + btw-nummer (B2B). Veilig her-uitvoerbaar.

-- Op health_checks: zo collecteren we de billing-info bij start.
alter table public.health_checks
  add column if not exists customer_type   text not null default 'particulier'
    check (customer_type in ('particulier', 'bedrijf')),
  add column if not exists company_name    text,
  add column if not exists vat_number      text,
  add column if not exists street          text,
  add column if not exists postal_code     text,
  add column if not exists city            text,
  add column if not exists country         text default 'BE';

-- Op invoices: zo bewaren we het exact zoals het op de factuur staat,
-- onafhankelijk van toekomstige wijzigingen op klant-side.
alter table public.invoices
  add column if not exists client_name     text,
  add column if not exists client_address  text,
  add column if not exists client_vat      text;

notify pgrst, 'reload schema';
