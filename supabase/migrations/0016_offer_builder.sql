-- Offerte-bouwer: gestructureerde lijnen, klantgegevens, BTW (VIES),
-- bedenktijd + herinnering, offertenummer, Billit-haak (later).
-- Toepassen na 0015. Supabase -> SQL Editor -> Run.

alter table public.offers add column if not exists offer_no text;
alter table public.offers add column if not exists items jsonb;
alter table public.offers add column if not exists valid_days integer not null default 7;
alter table public.offers add column if not exists reminder_sent_at timestamptz;
alter table public.offers add column if not exists viewed_at timestamptz;
alter table public.offers add column if not exists internal_note text;
alter table public.offers add column if not exists client_name text;
alter table public.offers add column if not exists client_company text;
alter table public.offers add column if not exists client_address text;
alter table public.offers add column if not exists vat_number text;
alter table public.offers add column if not exists vat_valid boolean;
alter table public.offers add column if not exists vat_name text;
alter table public.offers add column if not exists vat_reverse boolean not null default false;
alter table public.offers add column if not exists billit_id text;

create index if not exists offers_reminder_idx
  on public.offers (status, valid_until)
  where status = 'open';

-- Klant mag z'n eigen offerte als 'bekeken' markeren (viewed_at via de
-- bestaande offers_decide-policy; geen extra policy nodig).
