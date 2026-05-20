-- Publieke factuur-pagina voor Health Check klanten (zonder admin-login).
-- Token-gebaseerde toegang, RLS bewaakt de rest.
-- Veilig her-uitvoerbaar.

alter table public.invoices
  add column if not exists public_token text;

create unique index if not exists invoices_public_token_idx
  on public.invoices (public_token);

notify pgrst, 'reload schema';
