-- Klantenportaal: offertes, facturen, abonnementen, tickets.
-- Alles gekoppeld aan het e-mailadres van de klant (= het adres waarmee
-- hij scande en waarmee hij via magic link inlogt). RLS schermt elke
-- klant af tot zijn eigen rijen; de service-role (admin) omzeilt RLS.
-- Toepassen na 0011. Supabase -> SQL Editor -> Run.

-- Helper: e-mail van de ingelogde gebruiker, lowercase.
create or replace function public.current_email() returns text
  language sql stable
  as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

-- ---------- Offertes ----------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  title text not null,
  body text,
  amount_cents integer,
  currency text not null default 'EUR',
  status text not null default 'open'
    check (status in ('open', 'akkoord', 'afgewezen')),
  valid_until date,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Facturen ----------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  number text not null,
  description text,
  amount_cents integer not null default 0,
  currency text not null default 'EUR',
  status text not null default 'open'
    check (status in ('open', 'betaald', 'vervallen')),
  issued_at date not null default current_date,
  due_at date,
  pdf_url text,
  created_at timestamptz not null default now()
);

-- ---------- Abonnement ----------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  plan text not null,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  period text not null default 'maand',
  status text not null default 'actief'
    check (status in ('actief', 'gepauzeerd', 'gestopt')),
  started_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tickets ----------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  subject text not null,
  status text not null default 'open'
    check (status in ('open', 'in_behandeling', 'gesloten')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  sender text not null check (sender in ('klant', 'studio')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists offers_email_idx on public.offers (client_email);
create index if not exists invoices_email_idx on public.invoices (client_email);
create index if not exists subs_email_idx on public.subscriptions (client_email);
create index if not exists tickets_email_idx on public.tickets (client_email);
create index if not exists ticket_msg_ticket_idx
  on public.ticket_messages (ticket_id);

-- ---------- RLS ----------
alter table public.offers enable row level security;
alter table public.invoices enable row level security;
alter table public.subscriptions enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Klant ziet enkel zijn eigen rijen. Service-role (admin) omzeilt RLS.
drop policy if exists offers_own on public.offers;
create policy offers_own on public.offers
  for select to authenticated
  using (client_email = public.current_email());

-- Klant mag zijn offerte aanvaarden/afwijzen (enkel status/decided_at).
drop policy if exists offers_decide on public.offers;
create policy offers_decide on public.offers
  for update to authenticated
  using (client_email = public.current_email())
  with check (client_email = public.current_email());

drop policy if exists invoices_own on public.invoices;
create policy invoices_own on public.invoices
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists subs_own on public.subscriptions;
create policy subs_own on public.subscriptions
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists tickets_own on public.tickets;
create policy tickets_own on public.tickets
  for select to authenticated
  using (client_email = public.current_email());

drop policy if exists tickets_create on public.tickets;
create policy tickets_create on public.tickets
  for insert to authenticated
  with check (client_email = public.current_email());

drop policy if exists tmsg_own on public.ticket_messages;
create policy tmsg_own on public.ticket_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and t.client_email = public.current_email()
    )
  );

drop policy if exists tmsg_create on public.ticket_messages;
create policy tmsg_create on public.ticket_messages
  for insert to authenticated
  with check (
    sender = 'klant'
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_messages.ticket_id
        and t.client_email = public.current_email()
    )
  );

-- Klant ziet ook zijn eigen scans terug in het portaal.
drop policy if exists scan_requests_own on public.scan_requests;
create policy scan_requests_own on public.scan_requests
  for select to authenticated
  using (lower(email) = public.current_email());
