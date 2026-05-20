-- Twee-tier Health Check: Standard (€49, volledig automatisch) en
-- Premium (€99, incl. 30-min videocall). Veilig her-uitvoerbaar.

alter table public.health_checks
  add column if not exists package text not null default 'premium'
    check (package in ('standard', 'premium'));

create index if not exists health_checks_package_idx
  on public.health_checks (package);

notify pgrst, 'reload schema';
