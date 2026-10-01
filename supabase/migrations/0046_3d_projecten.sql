-- 0046 — Klantenportaal voor 3D-modellen: projecten + leveringen
--
-- Uitvoeren: Supabase → SQL Editor → plak dit volledige bestand → Run.
-- Veilig om opnieuw te draaien (if not exists / drop policy if exists).
--
-- Een project ontstaat uit een offerteaanvraag (quotes, source '3d-model').
-- Leveringen zijn de modelbestanden per machinesturing en per versie (revisie).
-- Klanten zien enkel hun eigen projecten (client_email = current_email(), zie 0012).
-- De bestanden zelf staan in de privé-bucket 'modellen' en worden enkel via een
-- tijdelijke link gedeeld NADAT de factuur van het project betaald is (server-side).

create table if not exists public.projecten (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  client_email    text not null,
  quote_id        uuid references public.quotes (id) on delete set null,
  offer_id        uuid references public.offers (id) on delete set null,
  invoice_id      uuid references public.invoices (id) on delete set null,
  titel           text not null,
  status          text not null default 'aanvraag'
                  check (status in ('aanvraag', 'offerte', 'akkoord', 'productie', 'geleverd', 'afgesloten', 'geannuleerd')),
  categorie       text not null default 'normaal'
                  check (categorie in ('vroegtijdig', 'normaal', 'last-minute')),
  merken          text[] not null default '{}',
  werf            jsonb,
  stelsel         jsonb,
  plannen         jsonb not null default '[]'::jsonb,
  geschatte_uren  numeric(6, 2),
  gewerkte_uren   numeric(6, 2),
  leverdatum      date,
  opmerking       text
);

create index if not exists projecten_client_idx on public.projecten (lower(client_email));
create index if not exists projecten_status_idx on public.projecten (status);

create table if not exists public.leveringen (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  project_id  uuid not null references public.projecten (id) on delete cascade,
  versie      int not null default 1,
  systeem     text not null,
  naam        text not null,
  pad         text not null,
  grootte     bigint,
  opmerking   text
);

create index if not exists leveringen_project_idx on public.leveringen (project_id, versie desc);

alter table public.projecten enable row level security;
alter table public.leveringen enable row level security;

drop policy if exists projecten_own on public.projecten;
create policy projecten_own on public.projecten
  for select using (lower(client_email) = public.current_email());

drop policy if exists leveringen_own on public.leveringen;
create policy leveringen_own on public.leveringen
  for select using (
    exists (
      select 1 from public.projecten p
      where p.id = leveringen.project_id
        and lower(p.client_email) = public.current_email()
    )
  );

-- Privé-bucket voor de modelbestanden (geen publieke toegang, geen klant-policies:
-- downloaden gebeurt via een tijdelijke link na betalingscontrole op de server).
insert into storage.buckets (id, name, public)
values ('modellen', 'modellen', false)
on conflict (id) do nothing;
