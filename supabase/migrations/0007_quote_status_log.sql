-- Statushistoriek per aanvraag. Toepassen na 0006.
-- Supabase → SQL Editor → Run. Zonder deze tabel werkt het wijzigen van
-- status gewoon door — er wordt dan enkel niets gelogd (geen fout, geen
-- tijdlijn). Er verandert niets live.

create table if not exists public.quote_status_log (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);

create index if not exists quote_status_log_quote_idx
  on public.quote_status_log (quote_id, created_at desc);

-- RLS aan, géén anon policies: enkel de service-role (admin + server).
alter table public.quote_status_log enable row level security;
