-- 0052 — Invordering via de deurwaarder
--
-- Wat:
--   1. bewijslog: wat er gebeurde rond een factuur (herinnering verstuurd met
--      de volledige tekst, offerte aanvaard, bestanden gedownload, ...), met
--      tijdstip. Dient als bewijs in het dossier voor de deurwaarder.
--   2. deurwaarders: per gerechtelijk arrondissement de gekozen
--      gerechtsdeurwaarder (de deurwaarder van het arrondissement van de klant).
--   3. invorderingen: één dossier per onbetaalde factuur, 14 dagen na de
--      derde herinnering klaargezet; Studio VM keurt het goed en verstuurt.
--
-- Enkel de server (service-role) leest en schrijft: geen policies.
-- Uitvoeren: Supabase -> SQL Editor -> plak dit volledige bestand -> Run.
-- Veilig om opnieuw te draaien. Zonder deze migratie blijft alles werken;
-- enkel de invordering staat dan uit.

-- ---------- 1. Bewijslog ----------
create table if not exists public.bewijslog (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  soort        text not null check (soort in (
                 'factuur_verstuurd', 'herinnering_verstuurd', 'offerte_beslist',
                 'levering_gedownload', 'betaling', 'invordering')),
  invoice_id   uuid references public.invoices (id) on delete set null,
  offer_id     uuid references public.offers (id) on delete set null,
  project_id   uuid,
  client_email text,
  details      jsonb not null default '{}'::jsonb
);
create index if not exists bewijslog_factuur_idx on public.bewijslog (invoice_id, created_at);
create index if not exists bewijslog_project_idx on public.bewijslog (project_id, created_at) where project_id is not null;
create index if not exists bewijslog_offerte_idx on public.bewijslog (offer_id, created_at) where offer_id is not null;
alter table public.bewijslog enable row level security;
revoke all on public.bewijslog from anon, authenticated;

-- ---------- 2. Deurwaarders per arrondissement ----------
create table if not exists public.deurwaarders (
  arrondissement text primary key check (arrondissement in (
                   'antwerpen', 'limburg', 'oost-vlaanderen', 'west-vlaanderen', 'leuven',
                   'brussel', 'waals-brabant', 'henegouwen', 'luik', 'luxemburg', 'namen', 'eupen')),
  naam           text not null check (char_length(naam) between 1 and 160),
  kantoor        text,
  email          text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telefoon       text,
  adres          text,
  taal           text not null default 'nl' check (taal in ('nl', 'fr', 'de')),
  notitie        text,
  updated_at     timestamptz not null default now()
);
alter table public.deurwaarders enable row level security;
revoke all on public.deurwaarders from anon, authenticated;

-- ---------- 3. Invorderingsdossiers ----------
create table if not exists public.invorderingen (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  invoice_id      uuid not null unique references public.invoices (id) on delete cascade,
  status          text not null default 'klaar'
                    check (status in ('klaar', 'verstuurd', 'gepauzeerd', 'afgesloten')),
  arrondissement  text,
  deurwaarder     jsonb,
  hoofdsom_cent   integer not null check (hoofdsom_cent >= 0),
  interest_cent   integer not null default 0 check (interest_cent >= 0),
  forfait_cent    integer not null default 0 check (forfait_cent >= 0),
  berekend_op     date not null default current_date,
  verstuurd_op    timestamptz,
  notitie         text check (notitie is null or char_length(notitie) <= 2000)
);
create index if not exists invorderingen_status_idx on public.invorderingen (status, created_at desc);
alter table public.invorderingen enable row level security;
revoke all on public.invorderingen from anon, authenticated;

notify pgrst, 'reload schema';
