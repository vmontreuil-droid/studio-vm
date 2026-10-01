-- 0048_outreach_aannemers.sql
-- Outreach-engine omgebouwd naar aannemers (3D-modellen voor machinesturing).
--
-- Optioneel: de code werkt ook zonder deze migratie (signalen staan dan
-- enkel in de bestaande scan_*-kolommen, website-discovery kiest dan een
-- willekeurige pagina). Toepassen: Supabase -> SQL Editor -> Run.
-- Veilig her-uitvoerbaar. Verstuurt niets en wijzigt geen bestaande data.
--
-- Hergebruik van bestaande kolommen in prospect_outreach (blijft zo):
--   scan_grade  "3D:MC" machinesturing-signalen | "3D:GW" grond-/wegenwerk |
--               "3D:AL" site zonder signalen    | "3D:NS" geen (bereikbare) site
--               (A–F of leeg = oude website-campagne, wordt nooit meer gemaild)
--   scan_score  prioriteit 0–100 (hoogste eerst gemaild)
--   scan_issues leesbare signalen ("Trimble", "GPS", "grondwerken", …)
--   scan_stack  JSON met de volledige signalen

-- 1. Gestructureerde signalen van de homepage-scan (merken, termen, taal, bron).
alter table public.prospect_outreach
  add column if not exists signalen jsonb;

comment on column public.prospect_outreach.signalen is
  'Aannemers-campagne: {v, merken[], andereMerken[], sturing[], werk[], taal, bron} van de homepage-scan.';

-- Verzendvolgorde: klaarstaande aannemers op prioriteit.
create index if not exists outreach_aannemers_klaar_idx
  on public.prospect_outreach (scan_score desc)
  where status = 'gescand' and scan_grade like '3D:%' and mail_sent_at is null;

create index if not exists outreach_mail_to_lower_idx
  on public.prospect_outreach (lower(mail_to));

-- 2. Website-discovery: onthoud wie al geprobeerd is, zodat dezelfde
--    ondernemingen niet elke nacht opnieuw geraden worden.
alter table public.kbo_enterprises
  add column if not exists website_discovery_at timestamptz;
alter table public.sirene_enterprises
  add column if not exists website_discovery_at timestamptz;
alter table public.uk_companies
  add column if not exists website_discovery_at timestamptz;

-- 3. Snelle prefix-zoekopdrachten op de activiteitscode (LIKE '4312%').
create index if not exists kbo_nace_main_prefix_idx
  on public.kbo_enterprises (nace_main text_pattern_ops);
create index if not exists sirene_ape_main_prefix_idx
  on public.sirene_enterprises (ape_main text_pattern_ops);
create index if not exists uk_sic_main_prefix_idx
  on public.uk_companies (sic_main text_pattern_ops);

notify pgrst, 'reload schema';
