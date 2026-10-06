-- ============================================================
-- 0056 — wat 0048 nooit binnenbracht + NL/DE
-- ------------------------------------------------------------
-- 0048 werd nooit gedraaid. De code viel overal terug (signalen in
-- scan_stack, website-zoeker op een willekeurige pagina), maar de
-- zoeker liep daardoor rond in dezelfde rijen. Alles hieronder is
-- idempotent; FR/UK kregen hun kolom al in 0055.
-- ============================================================

alter table public.prospect_outreach
  add column if not exists signalen jsonb;
comment on column public.prospect_outreach.signalen is
  'Aannemers-campagne: {v, merken[], andereMerken[], sturing[], werk[], taal, bron} van de homepage-scan.';

create index if not exists outreach_aannemers_klaar_idx
  on public.prospect_outreach (scan_score desc)
  where status = 'gescand' and scan_grade like '3D:%' and mail_sent_at is null;
create index if not exists outreach_mail_to_lower_idx
  on public.prospect_outreach (lower(mail_to));

alter table public.kbo_enterprises
  add column if not exists website_discovery_at timestamptz;
alter table public.nl_bedrijven
  add column if not exists website_discovery_at timestamptz;
alter table public.de_bedrijven
  add column if not exists website_discovery_at timestamptz;

create index if not exists kbo_nace_main_prefix_idx
  on public.kbo_enterprises (nace_main text_pattern_ops);

notify pgrst, 'reload schema';
