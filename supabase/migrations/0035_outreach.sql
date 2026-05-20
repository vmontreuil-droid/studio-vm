-- Outreach-engine: van koud prospect naar betalende klant.
-- Eén tabel die per (land, prospect) bijhoudt: hun scan-resultaat,
-- of we hen al gemaild hebben, of ze klikten, of ze antwoordden,
-- en of er een opvolg-mail moet komen.

create table if not exists public.prospect_outreach (
  land               text not null,         -- 'be' | 'fr' | 'uk'
  prospect_id        text not null,         -- enterprise_number / siret / company_number
  website            text,
  -- scan-resultaten (geprefetcht via cron, zodat we ze in mails kunnen tonen)
  scan_score         integer,
  scan_grade         text,
  scan_stack         text,
  scan_issues        jsonb default '[]'::jsonb,
  scan_token         text,                  -- token voor het publieke /scan/[token]-portaal
  scan_at            timestamptz,
  -- mail-flow
  mail_to            text,                  -- het feitelijke adres dat aangeschreven werd
  mail_sent_at       timestamptz,
  followup_sent_at   timestamptz,
  -- engagement
  opened_at          timestamptz,           -- eerste klik op de scan-portaal-link
  replied_at         timestamptz,           -- manueel of via reply-detection
  -- status: 'nieuw' | 'gescand' | 'verzonden' | 'opgevolgd' | 'geopend' | 'beantwoord' | 'klant' | 'geen_interesse'
  status             text not null default 'nieuw',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  primary key (land, prospect_id)
);

create index if not exists outreach_status_idx
  on public.prospect_outreach (status, scan_score);
create index if not exists outreach_sent_idx
  on public.prospect_outreach (mail_sent_at);
create index if not exists outreach_token_idx
  on public.prospect_outreach (scan_token);

alter table public.prospect_outreach enable row level security;

-- Outreach-configuratie (kolommen op company_settings — één globale rij)
alter table public.company_settings
  add column if not exists outreach_paused        boolean not null default true,
  add column if not exists outreach_daily_quota   integer not null default 20,
  add column if not exists outreach_cal_link      text,
  add column if not exists outreach_sender_name   text default 'Vincent Montreuil',
  add column if not exists outreach_sender_email  text default 'vincent@studio-vm.be',
  add column if not exists outreach_min_score     integer not null default 30,
  add column if not exists outreach_max_score     integer not null default 65,
  add column if not exists outreach_nace_prefixes jsonb default '[]'::jsonb,
  add column if not exists outreach_lands         jsonb default '["be"]'::jsonb;
