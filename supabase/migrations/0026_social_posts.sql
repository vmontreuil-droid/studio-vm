-- Social-posts: meertalige wachtrij met posts gegenereerd uit journal,
-- changelog en evergreen-templates. Werkt in copy-paste-modus (admin krijgt
-- elke dag een herinnering met de posts van vandaag) én later, zodra er
-- channel-tokens zijn, via Graph/LinkedIn/Bluesky-API's.
-- Toepassen na 0025. Supabase → SQL Editor → Run.

create table if not exists public.social_posts (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null,                 -- journal-announce | journal-insight | changelog | tip | manual
  source_ref     text,                          -- id van het bronitem (journal_posts.id, changelog_entries.id, …)
  locale         text not null default 'nl',    -- nl | fr | en
  headline       text not null,
  link           text,
  channels       text[] not null default '{}',  -- facebook, instagram, linkedin, bluesky, mastodon
  -- Per kanaal de daadwerkelijke tekst: { "facebook": {"text": "…"}, "instagram": {"text": "…"}, … }
  variants       jsonb not null default '{}'::jsonb,
  scheduled_at   timestamptz,
  status         text not null default 'concept'
    check (status in ('concept', 'gepland', 'verzonden', 'gepost', 'gearchiveerd')),
  notify_sent_at timestamptz,                   -- wanneer de dagelijkse herinnering verstuurd is
  posted_at      timestamptz,                   -- door admin gemarkeerd als gepost
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists social_posts_status_idx
  on public.social_posts (status, scheduled_at);
create index if not exists social_posts_locale_idx
  on public.social_posts (locale, created_at desc);

-- RLS aan, géén anon policies: enkel de service-role (admin) beheert.
alter table public.social_posts enable row level security;
