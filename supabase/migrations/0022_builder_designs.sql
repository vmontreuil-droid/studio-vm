-- Builder-ontwerpen serverzijde, gekoppeld aan het klantaccount:
-- meerdere concepten, hervatten op elk toestel, status, jij ziet alles.
-- Toepassen: Supabase -> SQL Editor -> Run.

create table if not exists public.builder_designs (
  id          uuid primary key default gen_random_uuid(),
  client_email text not null,
  title       text not null default 'Mijn ontwerp',
  snapshot    jsonb not null default '{}'::jsonb,
  status      text not null default 'concept'
    check (status in ('concept', 'verstuurd')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists builder_designs_email_idx
  on public.builder_designs (client_email);

alter table public.builder_designs enable row level security;

-- Klant: volledige CRUD op zijn eigen ontwerpen. Service-role (admin)
-- omzeilt RLS sowieso.
drop policy if exists builder_designs_select on public.builder_designs;
create policy builder_designs_select on public.builder_designs
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists builder_designs_insert on public.builder_designs;
create policy builder_designs_insert on public.builder_designs
  for insert to authenticated
  with check (client_email = public.current_email());

drop policy if exists builder_designs_update on public.builder_designs;
create policy builder_designs_update on public.builder_designs
  for update to authenticated
  using (client_email = public.current_email())
  with check (client_email = public.current_email());

drop policy if exists builder_designs_delete on public.builder_designs;
create policy builder_designs_delete on public.builder_designs
  for delete to authenticated
  using (client_email = public.current_email());
