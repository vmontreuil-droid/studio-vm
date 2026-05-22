-- 0045_social_and_utm.sql
-- Social Media-hub + UTM-tracking
--
-- 1. social_posts — post-library (drafts, klaar, gepost) per platform, met
--    automatisch gegenereerde UTM-link en optionele resultaten.
-- 2. app_settings — sleutel-waarde-store voor Pixel-IDs (FB/LinkedIn/Insta),
--    handgrepen, etc. — zodat je geen Vercel-env-redeploy nodig hebt.
-- 3. page_views krijgt utm_source/medium/campaign-kolommen zodat we per
--    klik kunnen achterhalen welke post-/campagne traffic bracht.

-- =====================================================================
-- 1. social_posts
-- =====================================================================
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  platform text not null check (platform in ('facebook','linkedin','instagram','x','algemeen')),
  post_kind text default 'persoonlijk' check (post_kind in ('persoonlijk','page','group','ad','story','article')),
  status text not null default 'idee' check (status in ('idee','concept','klaar','gepost','gearchiveerd')),

  title text not null,
  body text,
  hashtags text,
  attachments_json jsonb default '[]'::jsonb,

  -- UTM-link — wordt in admin gegenereerd
  target_url text default '/',
  utm_source text,
  utm_medium text default 'social',
  utm_campaign text,

  -- Schedule + resultaten
  scheduled_for timestamptz,
  posted_at timestamptz,
  posted_url text,
  result_likes int default 0,
  result_comments int default 0,
  result_shares int default 0,
  notes text
);

create index if not exists social_posts_status_idx on social_posts (status, created_at desc);
create index if not exists social_posts_platform_idx on social_posts (platform, created_at desc);
create index if not exists social_posts_campaign_idx on social_posts (utm_campaign);

-- Auto-update updated_at
create or replace function social_posts_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists social_posts_touch on social_posts;
create trigger social_posts_touch
  before update on social_posts
  for each row execute function social_posts_touch_updated_at();

alter table social_posts enable row level security;

do $$ begin
  create policy "no public access" on social_posts for all to anon, authenticated using (false) with check (false);
exception when duplicate_object then null; end $$;

-- =====================================================================
-- 2. app_settings — pixel-IDs + andere config
-- =====================================================================
create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

do $$ begin
  create policy "no public access" on app_settings for all to anon, authenticated using (false) with check (false);
exception when duplicate_object then null; end $$;

-- Default-rijen — service_role schrijft, admin-UI vult later in
insert into app_settings (key, value) values
  ('fb_pixel_id', null),
  ('linkedin_insight_id', null),
  ('instagram_business_id', null),
  ('google_analytics_id', null),
  ('tiktok_pixel_id', null)
on conflict (key) do nothing;

-- =====================================================================
-- 3. page_views — UTM-kolommen
-- =====================================================================
alter table page_views
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

create index if not exists page_views_utm_source_idx on page_views (utm_source) where utm_source is not null;
create index if not exists page_views_utm_campaign_idx on page_views (utm_campaign) where utm_campaign is not null;
