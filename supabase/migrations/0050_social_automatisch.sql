-- 0050 — Social media volledig automatisch
--
-- Wat:
--   1. social_posts: kanalen zonder LinkedIn (linkedin blijft enkel geldig zodat
--      oude rijen leesbaar blijven), nieuwe statussen (concept, goedgekeurd,
--      gepland, gepubliceerd, mislukt, overgeslagen), soort 'reel', en de
--      kolommen post_type, taal, goedkeuring_nodig, gekeurd_op, media, kanalen,
--      publicatie, link_post, tekst_kort en slot (uniek: nooit dubbel
--      gepland). scheduled_for wordt nu gebruikt.
--   2. goedkeur_tokens: eenmalige goedkeurlinks uit het weekoverzicht (enkel de
--      SHA-256 van de sleutel; RLS aan, geen policies: enkel de service-role).
--   3. page_views.utm_content (welk bericht bracht de klik).
--   4. Publieke opslagbucket 'social-media' voor bevroren JPEG's en video's die
--      de platformen zelf moeten ophalen. Schrijven enkel via de service-role.
--   5. app_settings 'social_alles_automatisch' (standaard 'nee').
--
-- Uitvoeren: Supabase -> SQL Editor -> plak dit volledige bestand -> Run.
-- Veilig om opnieuw te draaien (if not exists / drop ... if exists / DO-blokken).
--
-- VOLGORDE: eerst de nieuwe code deployen, DAN deze migratie draaien. De code
-- werkt ook zonder (dan plant de contentmachine niets en werken de
-- goedkeurlinks niet; /admin/social toont een melding).
--
-- Bestaande rijen (enkel bij de EERSTE run, herkenbaar aan het ontbreken van
-- social_posts.post_type):
--   - drafts van de oude dagelijkse machine (notes bevat 'auto-engine', nooit
--     gepland, nooit gepost) en ongepubliceerde LinkedIn-rijen -> overgeslagen;
--   - idee/klaar -> concept, gepost -> gepubliceerd, gearchiveerd -> overgeslagen.
-- De oude statuswaarden blijven toegelaten, zodat een oude deploy die nog
-- 'klaar' schrijft niet faalt.

-- ---------- 1. Statussen van bestaande rijen omzetten (eerste run) ----------
alter table public.social_posts drop constraint if exists social_posts_status_check;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'social_posts' and column_name = 'post_type'
  ) then
    update public.social_posts
       set status = 'overgeslagen'
     where status in ('idee', 'concept', 'klaar')
       and scheduled_for is null
       and (coalesce(notes, '') like '%auto-engine%' or platform = 'linkedin');
    update public.social_posts set status = 'concept'      where status in ('idee', 'klaar');
    update public.social_posts set status = 'gepubliceerd' where status = 'gepost';
    update public.social_posts set status = 'overgeslagen' where status = 'gearchiveerd';
  end if;
end $$;

alter table public.social_posts add constraint social_posts_status_check
  check (status in (
    'concept', 'goedgekeurd', 'gepland', 'gepubliceerd', 'mislukt', 'overgeslagen',
    -- oude waarden (vóór 0050), enkel nog geldig voor achterblijvers:
    'idee', 'klaar', 'gepost', 'gearchiveerd'
  ));
alter table public.social_posts alter column status set default 'concept';

-- ---------- 2. Kanalen en soorten ----------
alter table public.social_posts drop constraint if exists social_posts_platform_check;
alter table public.social_posts add constraint social_posts_platform_check
  check (platform in (
    'facebook', 'instagram', 'google', 'youtube', 'tiktok', 'pinterest', 'x', 'threads', 'bluesky', 'algemeen',
    -- enkel voor oude rijen; de admin biedt LinkedIn nergens meer aan:
    'linkedin'
  ));

alter table public.social_posts drop constraint if exists social_posts_post_kind_check;
alter table public.social_posts add constraint social_posts_post_kind_check
  check (post_kind is null or post_kind in ('persoonlijk', 'page', 'group', 'ad', 'story', 'article', 'reel'));
alter table public.social_posts alter column post_kind set default 'page';

-- ---------- 3. Nieuwe kolommen ----------
alter table public.social_posts
  add column if not exists post_type         text,
  add column if not exists taal              text,
  add column if not exists goedkeuring_nodig boolean not null default false,
  add column if not exists gekeurd_op        timestamptz,
  add column if not exists media             jsonb   not null default '{}'::jsonb,
  add column if not exists kanalen           jsonb   not null default '[]'::jsonb,
  add column if not exists publicatie        jsonb   not null default '{}'::jsonb,
  add column if not exists link_post         boolean not null default false,
  add column if not exists tekst_kort        text,
  add column if not exists slot              text;

comment on column public.social_posts.status is
  'concept | goedgekeurd | gepland | gepubliceerd | mislukt | overgeslagen. De publisher neemt ENKEL status = ''goedgekeurd'' met scheduled_for <= now(); nooit de oude waarde ''klaar''.';
comment on column public.social_posts.post_type is 'tip | vraag | carrousel | realisatie | aanbod | video';
comment on column public.social_posts.taal is 'nl | fr | en | de (nooit tweetalig)';
comment on column public.social_posts.goedkeuring_nodig is
  'true = dit bericht vraagt een akkoord (realisatie, of tekst die de controle niet doorstaat). Blijft true na het akkoord: de status is leidend (concept = wacht nog, goedgekeurd = akkoord gegeven op gekeurd_op).';
comment on column public.social_posts.slot is 'vaste plaats van de contentmachine, bv. 2026-W41-di; uniek, zodat een week nooit dubbel gepland wordt (null bij eigen berichten)';
comment on column public.social_posts.media is '{ v, beelden: { og, portrait, square, story, gbp } (paden /beeld/social/<id>/<formaat>.jpg?v=), kaart, beeld, video, dias[] }';
comment on column public.social_posts.kanalen is 'doelkanalen, bv. ["facebook","instagram","threads","bluesky","x","pinterest"]';
comment on column public.social_posts.publicatie is 'resultaat per kanaal (door de publisher): { <kanaal>: { status, url, id, fout, op } }';
comment on column public.social_posts.link_post is 'gebruikt één van de hoogstens 2 linkberichten per maand (Facebook-linklimiet)';
comment on column public.social_posts.tekst_kort is 'korte tekst (± 200 tekens) voor X en Bluesky; hashtags komen erachter';

alter table public.social_posts drop constraint if exists social_posts_post_type_check;
alter table public.social_posts add constraint social_posts_post_type_check
  check (post_type is null or post_type in ('tip', 'vraag', 'carrousel', 'realisatie', 'aanbod', 'video'));

alter table public.social_posts drop constraint if exists social_posts_taal_check;
alter table public.social_posts add constraint social_posts_taal_check
  check (taal is null or taal in ('nl', 'fr', 'en', 'de'));

alter table public.social_posts drop constraint if exists social_posts_kanalen_check;
alter table public.social_posts add constraint social_posts_kanalen_check
  check (jsonb_typeof(kanalen) = 'array');

-- Bestaande rijen: taal en kanalen afleiden waar dat kan.
update public.social_posts
   set kanalen = jsonb_build_array(platform)
 where kanalen = '[]'::jsonb
   and platform in ('facebook', 'instagram', 'google', 'youtube', 'tiktok', 'pinterest', 'x', 'threads', 'bluesky');
update public.social_posts
   set taal = case when target_url like '/fr%' then 'fr' else 'nl' end
 where taal is null;

-- De publisher zoekt goedgekeurde berichten waarvan het tijdstip voorbij is.
create index if not exists social_posts_planning_idx
  on public.social_posts (status, scheduled_for)
  where scheduled_for is not null;

-- Grendel tegen dubbel plannen (cron en knop tegelijk, of een cron die twee
-- keer vuurt): elke plaats van een week bestaat hoogstens één keer. Niet
-- partieel, zodat "on conflict (slot) do nothing" werkt; NULL (eigen
-- berichten) mag zo vaak als nodig.
create unique index if not exists social_posts_slot_uniek
  on public.social_posts (slot);

-- ---------- 4. Eenmalige goedkeurlinks ----------
create table if not exists public.goedkeur_tokens (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  post_id     uuid not null references public.social_posts (id) on delete cascade,
  actie       text not null check (actie in ('goedkeuren', 'overslaan')),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  used_at     timestamptz
);
create index if not exists goedkeur_tokens_post_idx on public.goedkeur_tokens (post_id);
create index if not exists goedkeur_tokens_verval_idx on public.goedkeur_tokens (expires_at);

alter table public.goedkeur_tokens enable row level security;
-- Bewust GEEN policies: enkel de service-role (server) leest en schrijft.
revoke all on public.goedkeur_tokens from anon, authenticated;

-- ---------- 5. page_views.utm_content ----------
alter table public.page_views add column if not exists utm_content text;
create index if not exists page_views_utm_content_idx
  on public.page_views (utm_content)
  where utm_content is not null;

-- ---------- 6. Publieke opslag voor social-beelden en -video's ----------
-- Publiek LEZEN via de publieke URL (de platformen halen de media zelf op).
-- Geen storage-policies: niemand kan anoniem oplijsten, opladen of wissen;
-- dat doet enkel de server met de service-role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', true, 52428800, array['image/jpeg', 'image/png', 'video/mp4'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- 7. Schakelaar "alles automatisch" (standaard uit) ----------
insert into public.app_settings (key, value)
values ('social_alles_automatisch', 'nee')
on conflict (key) do nothing;

notify pgrst, 'reload schema';
