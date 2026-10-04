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
    'bounce/complaint tracking op prospect_outreach + outreach_webhook_secret op company_settings',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'prospect_outreach'
        and column_name = 'bounced_at'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'company_settings'
        and column_name = 'outreach_webhook_secret'
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

  union all select
    '0049_tickets_compleet.sql',
    'tickets compleet: soort/project/volgnummer/ongelezen + bijlagen, notities, revisie-uren, invoices.ticket_id/vat_reverse',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'tickets'
        and column_name = 'klant_ongelezen'
    )
    and exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'ticket_uren'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'invoices'
        and column_name = 'vat_reverse'
    )

  union all select
    '0050_social_automatisch.sql',
    'social automatisch: post_type/taal/goedkeuring/media/kanalen/publicatie/link_post/slot op social_posts, goedkeur_tokens, page_views.utm_content, bucket social-media',
    exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'social_posts'
        and column_name = 'post_type'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'social_posts'
        and column_name = 'slot'
    )
    and exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'goedkeur_tokens'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'page_views'
        and column_name = 'utm_content'
    )
    and exists(
      select 1 from storage.buckets where id = 'social-media'
    )
  union all select
    '0051_facturatie_waterdicht.sql',
    'facturatie: doorlopende nummers per jaar (documentnummers + triggers), gestructureerde mededeling, btw-regime',
    exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'documentnummers'
    )
    and exists(
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'invoices'
        and column_name = 'ogm'
    )
    and exists(
      select 1 from pg_trigger where tgname = 'invoices_nummer'
    )
  union all select
    '0052_invordering.sql',
    'invordering: bewijslog, deurwaarders per arrondissement, invorderingsdossiers',
    exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'bewijslog'
    )
    and exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'deurwaarders'
    )
    and exists(
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'invorderingen'
    )
  union all select
    '0053_invordering_buitenland.sql',
    'invordering buitenland: vaste partner per land (NL/DE/FR/LU) in deurwaarders',
    exists(
      select 1 from pg_constraint
      where conname = 'deurwaarders_arrondissement_check'
        and pg_get_constraintdef(oid) like '%land-nl%'
    )
)
select
  migration,
  case when installed then '✓ GEDAAN' else '⚠ NOG TE DOEN' end as status,
  wat
from checks
order by migration;
