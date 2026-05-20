-- Peppol + Billit-integratie op invoices.
-- Sinds 1 januari 2026 is e-facturatie via Peppol verplicht voor BE B2B.
-- Wij gebruiken Billit als Peppol Access Point — invoice wordt na
-- creatie naar Billit gepusht, Billit handelt de Peppol-delivery af
-- en stuurt status-updates via webhook terug.
--
-- Veilig her-uitvoerbaar.

alter table public.invoices
  add column if not exists billit_order_id   text,
  add column if not exists peppol_status     text
    check (peppol_status in (
      'niet_vereist',  -- particulier of geen btw-nr
      'wachten',       -- staat in onze queue, nog niet naar Billit
      'verzonden',     -- naar Billit gepusht, Peppol-delivery loopt
      'afgeleverd',    -- Billit bevestigt: ontvangen door tegenpartij
      'mislukt'        -- foutmelding van Billit of Peppol-netwerk
    )),
  add column if not exists peppol_sent_at    timestamptz,
  add column if not exists peppol_error      text;

create index if not exists invoices_peppol_status_idx
  on public.invoices (peppol_status);

-- Billit-configuratie hoort bij de firma — niet hardcoded.
alter table public.company_settings
  add column if not exists billit_api_key      text,
  add column if not exists billit_company_id   text,
  add column if not exists billit_webhook_secret text;

notify pgrst, 'reload schema';
