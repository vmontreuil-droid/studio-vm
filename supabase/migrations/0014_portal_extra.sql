-- Portaal-uitbreiding: projectvoortgang, onboarding-checklist,
-- documenten (link-gebaseerd) en domein/hosting-velden op sites.
-- Toepassen na 0013. Supabase -> SQL Editor -> Run.

-- ---------- Projectvoortgang (1 rij per klant) ----------
create table if not exists public.project_progress (
  client_email text primary key,
  step text not null default 'briefing'
    check (step in ('briefing', 'ontwerp', 'bouw', 'online', 'nazorg')),
  note text,
  updated_at timestamptz not null default now()
);

-- ---------- Onboarding-checklist ----------
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  label text not null,
  done boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists checklist_email_idx
  on public.checklist_items (client_email);

-- ---------- Documenten (link-gebaseerd) ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  name text not null,
  url text not null,
  kind text not null default 'document',
  created_at timestamptz not null default now()
);
create index if not exists documents_email_idx
  on public.documents (client_email);

-- ---------- Domein & hosting op sites ----------
alter table public.sites add column if not exists domain text;
alter table public.sites add column if not exists registrar text;
alter table public.sites add column if not exists domain_renewal date;
alter table public.sites add column if not exists hosting text;
alter table public.sites add column if not exists dns_note text;

-- ---------- RLS ----------
alter table public.project_progress enable row level security;
alter table public.checklist_items enable row level security;
alter table public.documents enable row level security;

drop policy if exists progress_own on public.project_progress;
create policy progress_own on public.project_progress
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists checklist_own on public.checklist_items;
create policy checklist_own on public.checklist_items
  for select to authenticated
  using (client_email = public.current_email());

-- Klant mag zelf items afvinken (enkel done).
drop policy if exists checklist_toggle on public.checklist_items;
create policy checklist_toggle on public.checklist_items
  for update to authenticated
  using (client_email = public.current_email())
  with check (client_email = public.current_email());

drop policy if exists documents_own on public.documents;
create policy documents_own on public.documents
  for select to authenticated
  using (client_email = public.current_email());
