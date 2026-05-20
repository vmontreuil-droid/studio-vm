-- Health Check €99 — premium-features.
-- Auto-actieplan + follow-up-mails + extra tracking.
-- Veilig her-uitvoerbaar.

alter table public.health_checks
  add column if not exists action_plan        jsonb default '[]'::jsonb,
  add column if not exists report_html        text,
  add column if not exists followup_1d_sent_at timestamptz,
  add column if not exists followup_3d_sent_at timestamptz,
  add column if not exists followup_7d_sent_at timestamptz,
  add column if not exists feedback_rating    integer,
  add column if not exists feedback_text      text;

notify pgrst, 'reload schema';
