-- Mollie-koppeling voor het publiceer-abonnement (€199 opstart + €39/m).
-- Toepassen: Supabase -> SQL Editor -> Run. Veilig her-uitvoerbaar.

alter table public.subscriptions
  add column if not exists mollie_customer_id     text,
  add column if not exists mollie_subscription_id text,
  add column if not exists setup_paid             boolean not null default false;

-- De status-poort (zie lib/publish.getLiveSite) gebruikt status =
-- 'actief'. De Mollie-webhook zet die op 'actief' na de eerste betaalde
-- betaling en op 'gestopt' bij annulatie/mislukking. RLS ongewijzigd.
