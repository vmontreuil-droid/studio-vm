-- Inzendingen van contact-/reservatieformulieren op gepubliceerde
-- klantsites. Komen binnen via de service-role (publieke bezoeker,
-- geen login) en zijn voor de klant zichtbaar in zijn portaal.
-- Toepassen: Supabase -> SQL Editor -> Run.

create table if not exists public.form_submissions (
  id            uuid primary key default gen_random_uuid(),
  client_email  text not null,
  design_id     uuid references public.builder_designs (id) on delete set null,
  site_title    text not null default '',
  page          text not null default '',
  visitor_name  text not null default '',
  visitor_email text not null default '',
  fields        jsonb not null default '[]'::jsonb,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists form_submissions_email_idx
  on public.form_submissions (client_email, created_at desc);

alter table public.form_submissions enable row level security;

-- Klant ziet en beheert (lezen/gelezen-markeren/verwijderen) enkel zijn
-- eigen inzendingen. Invoegen gebeurt serverzijde met de service-role
-- (omzeilt RLS) — een publieke bezoeker heeft géén insert-policy.
drop policy if exists form_submissions_select on public.form_submissions;
create policy form_submissions_select on public.form_submissions
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists form_submissions_update on public.form_submissions;
create policy form_submissions_update on public.form_submissions
  for update to authenticated
  using (client_email = public.current_email())
  with check (client_email = public.current_email());

drop policy if exists form_submissions_delete on public.form_submissions;
create policy form_submissions_delete on public.form_submissions
  for delete to authenticated
  using (client_email = public.current_email());
