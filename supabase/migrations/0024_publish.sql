-- Publiceren van builder-ontwerpen op een subdomein + capability-
-- vlaggen op het abonnement (modules die de klant erbij koopt).
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

alter table public.builder_designs
  add column if not exists slug         text,
  add column if not exists published    boolean not null default false,
  add column if not exists published_at timestamptz;

-- Slug uniek (maar meerdere NULL toegestaan).
create unique index if not exists builder_designs_slug_key
  on public.builder_designs (slug)
  where slug is not null;

-- Capability-modules op het abonnement: array van sleutels, bv.
-- {'reservations','seo'}. Leeg = enkel de basissite.
alter table public.subscriptions
  add column if not exists capabilities text[] not null default '{}';

-- De live-site wordt serverzijde (service-role) opgezocht op slug en
-- toont enkel als published = true én er een actief abonnement is.
-- RLS op builder_designs blijft zoals in 0022 (klant ziet eigen rijen;
-- service-role omzeilt RLS voor de publieke render).
