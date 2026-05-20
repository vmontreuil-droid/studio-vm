-- Anti-spam hardening voor de outreach-engine.
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

alter table public.prospect_outreach
  add column if not exists resend_message_id text,
  add column if not exists bounced_at        timestamptz,
  add column if not exists complaint_at      timestamptz;

create index if not exists outreach_resend_msg_idx
  on public.prospect_outreach (resend_message_id);

alter table public.company_settings
  add column if not exists outreach_started_at date,
  add column if not exists outreach_webhook_secret text;

notify pgrst, 'reload schema';
