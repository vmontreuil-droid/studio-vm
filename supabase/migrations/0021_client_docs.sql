-- Klant-documenten: upload via Supabase Storage (drag & drop in het
-- portaal). Privébucket, per klant afgeschermd op het e-mailadres
-- (= eerste padsegment). Toepassen: Supabase -> SQL Editor -> Run.

-- 1. Privébucket
insert into storage.buckets (id, name, public)
values ('client-docs', 'client-docs', false)
on conflict (id) do nothing;

-- 2. Storage-RLS: een klant kan enkel in zijn eigen map (pad =
--    "<e-mail>/<bestand>"). Service-role (admin) omzeilt RLS sowieso.
drop policy if exists "client docs read own" on storage.objects;
create policy "client docs read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-docs'
    and (storage.foldername(name))[1] = public.current_email()
  );

drop policy if exists "client docs insert own" on storage.objects;
create policy "client docs insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-docs'
    and (storage.foldername(name))[1] = public.current_email()
  );

drop policy if exists "client docs delete own" on storage.objects;
create policy "client docs delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'client-docs'
    and (storage.foldername(name))[1] = public.current_email()
  );

-- 3. documents-tabel: wie uploadde + klant mag eigen rijen toevoegen/
--    verwijderen.
alter table public.documents
  add column if not exists uploaded_by text not null default 'studio';

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own on public.documents
  for insert to authenticated
  with check (client_email = public.current_email());

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own on public.documents
  for delete to authenticated
  using (
    client_email = public.current_email() and uploaded_by = 'klant'
  );
