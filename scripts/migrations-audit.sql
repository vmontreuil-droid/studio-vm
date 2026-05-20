-- ============================================================
-- MIGRATIONS AUDIT — welke heb je al uitgevoerd?
-- ------------------------------------------------------------
-- Run dit in Supabase SQL Editor. Per recente migratie krijg je
-- TRUE/FALSE terug. Alles dat FALSE staat moet je nog draaien.
--
-- De migraties staan in supabase/migrations/00XX_*.sql in de
-- repo. Open het bestand en plak in de SQL Editor.
-- ============================================================

with checks as (
  select
    '0034_fr_uk_prospects.sql' as migration,
    'voegt country/legal_form etc toe op prospects (voor FR Sirene + UK CH)' as wat,
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'prospects'
        and column_name = 'country'
    ) as installed

  union all select
    '0035_outreach.sql',
    'outreach engine — voegt prospect_outreach tabel + outreach_sender_email op company_settings',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'company_settings'
        and column_name = 'outreach_sender_email'
    )

  union all select
    '0036_outreach_deliverability.sql',
    'List-Unsubscribe + bounce/spam tracking',
    exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'bounce_log'
    )

  union all select
    '0037_health_checks.sql',
    'maakt health_checks tabel aan (Site Health Check 99 euro)',
    exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'health_checks'
    )

  union all select
    '0038_health_check_premium.sql',
    'voegt action_plan/report_html/followup_* toe op health_checks',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'health_checks'
        and column_name = 'action_plan'
    )

  union all select
    '0039_invoice_public_token.sql',
    'voegt public_token toe op invoices (factuur-link zonder login)',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'invoices'
        and column_name = 'public_token'
    )

  union all select
    '0040_health_check_package.sql',
    'twee-tier: package kolom op health_checks (standard|premium)',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'health_checks'
        and column_name = 'package'
    )

  union all select
    '0041_health_check_billing.sql',
    'facturatiegegevens op health_checks (customer_type, btw_nr, adres) + client_name/address/vat op invoices',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'health_checks'
        and column_name = 'customer_type'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'invoices'
        and column_name = 'client_name'
    )
)
select
  migration,
  case when installed then '✓ GEDAAN' else '⚠ NOG TE DOEN' end as status,
  wat
from checks
order by migration;
