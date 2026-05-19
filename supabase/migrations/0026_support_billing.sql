-- Maatwerk-supportabonnement (automatische maandfacturatie met
-- gratis-maand-logica) + zelfbouw-dunning. Toepassen: Supabase ->
-- SQL Editor -> Run. Veilig her-uitvoerbaar.

alter table public.subscriptions
  add column if not exists offer_id     uuid,
  -- 'mollie'  -> project via Mollie betaald -> 2 gratis maanden
  -- 'transfer'-> via overschrijving       -> geen gratis maanden
  add column if not exists pay_method   text,
  add column if not exists free_months  integer not null default 0,
  -- hoogste reeds verwerkte maand-cyclus (idempotentie cron)
  add column if not exists last_cycle   integer not null default 0,
  -- dunning (zelfbouw): uiterste datum vóór de site offline gaat
  add column if not exists grace_until  date;
