-- Builder-templates: bibliotheek van visueel onderscheiden start-sites
-- die klanten in /builder kunnen kiezen. Alleen 'is_live = true'
-- templates verschijnen voor klanten; 'is_live = false' zijn drafts
-- die enkel de admin in /admin/templates-lab ziet.
--
-- Sections wordt opgeslagen als jsonb in het bestaande SectionData-
-- formaat van /app/[locale]/builder/page.tsx, zodat een template
-- één-op-één geladen kan worden in de editor.
--
-- Veilig her-uitvoerbaar.

create table if not exists public.builder_templates (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  sector        text,                              -- restaurant | salon | retail | bouw | consulting | ...
  tone          text check (tone in ('warm', 'zakelijk', 'speels')),
  accent_color  text,                              -- #ef7e22, #2563eb, ...
  radius        text check (radius in ('strak', 'zacht', 'rond')),
  preview_url   text,                              -- screenshot of relatieve thumb-asset
  description   text,                              -- "Voor restaurants met design-ambitie"
  header        jsonb not null default '{}'::jsonb,
  pages         jsonb not null default '[]'::jsonb, -- [{id, name, sections: [...]}, ...]
  is_live       boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists builder_templates_live_idx
  on public.builder_templates (is_live, sort_order);
create index if not exists builder_templates_sector_idx
  on public.builder_templates (sector);

-- Auto-update updated_at bij elke wijziging.
create or replace function public.bump_builder_templates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists builder_templates_updated_at on public.builder_templates;
create trigger builder_templates_updated_at
  before update on public.builder_templates
  for each row execute function public.bump_builder_templates_updated_at();

alter table public.builder_templates enable row level security;

-- Iedereen (anon + auth) mag LIVE templates lezen — anders kan de
-- publieke /builder ze niet tonen aan klanten zonder login.
drop policy if exists builder_templates_public_read on public.builder_templates;
create policy builder_templates_public_read on public.builder_templates
  for select to anon, authenticated
  using (is_live = true);

-- Service-role (admin) doet alles. Geen aparte policy nodig:
-- service-role omzeilt RLS by design.

notify pgrst, 'reload schema';
