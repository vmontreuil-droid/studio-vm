-- Resultaat van de batch contact-zoeker per KBO-prospect:
-- gevonden e-mailadressen uit hun publieke website + tijdstip.
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

alter table public.kbo_enterprises
  add column if not exists email_found      jsonb,
  add column if not exists email_scanned_at timestamptz;

create index if not exists kbo_email_scan_idx
  on public.kbo_enterprises (email_scanned_at);
