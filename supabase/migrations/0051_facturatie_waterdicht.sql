-- 0051 — Facturatie waterdicht
--
-- Wat:
--   1. Eén teller per documentsoort en per jaar (FAC, CN, OFF), uitgedeeld
--      door de databank zelf: geen dubbele nummers, ook niet bij twee
--      gelijktijdige facturen.
--   2. Facturen en creditnota's krijgen hun nummer IN dezelfde bewerking als
--      het opslaan (trigger). Mislukt het opslaan, dan rolt de teller mee
--      terug: geen gaten in de reeks.
--   3. Een factuur of creditnota met een nummer kan niet gewist worden (maak
--      een creditnota). Enkel de allerlaatste van het jaar mag weg — dan
--      schuift de teller terug, zodat er ook dan geen gat ontstaat.
--   4. Het nummer van een factuur of creditnota kan niet meer wijzigen.
--   5. Elke factuur krijgt een Belgische gestructureerde mededeling uit jaar
--      + volgnummer: FAC-2026-001 -> +++202/6000/001xx+++ (nooit 000 vooraan).
--   6. Btw-regime per factuur en offerte: binnenland / verlegd / buiten-eu,
--      met het bewijs van de VIES-controle.
--
-- Uitvoeren: Supabase -> SQL Editor -> plak dit volledige bestand -> Run.
-- Veilig om opnieuw te draaien. De code werkt ook zolang dit niet gedraaid is
-- (dan telt ze zoals vroeger).

-- ---------- 1. Tellers ----------
create table if not exists public.documentnummers (
  soort   text    not null check (soort in ('FAC', 'CN', 'OFF')),
  jaar    integer not null check (jaar between 2000 and 2999),
  laatste integer not null default 0 check (laatste >= 0),
  primary key (soort, jaar)
);
alter table public.documentnummers enable row level security;
revoke all on public.documentnummers from anon, authenticated;

-- Volgend nummer, atomair (de rij blijft vergrendeld tot het einde van de
-- transactie: twee gelijktijdige facturen wachten op elkaar).
create or replace function public.volgend_documentnummer(p_soort text, p_jaar integer)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.documentnummers as d (soort, jaar, laatste)
  values (p_soort, p_jaar, 1)
  on conflict (soort, jaar) do update set laatste = d.laatste + 1
  returning laatste;
$$;
revoke all on function public.volgend_documentnummer(text, integer) from public, anon, authenticated;

-- Teller minstens op p_n zetten (voor een expliciet meegegeven nummer).
create or replace function public.teller_minstens(p_soort text, p_jaar integer, p_n integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.documentnummers as d (soort, jaar, laatste)
  values (p_soort, p_jaar, p_n)
  on conflict (soort, jaar) do update set laatste = greatest(d.laatste, excluded.laatste);
$$;
revoke all on function public.teller_minstens(text, integer, integer) from public, anon, authenticated;

-- FAC-2026-001 (drie cijfers; vanaf 1000 gewoon verder: FAC-2026-1000).
create or replace function public.document_nummer(p_soort text, p_jaar integer, p_n integer)
returns text
language sql
immutable
as $$
  select p_soort || '-' || p_jaar || '-' ||
         case when p_n < 1000 then lpad(p_n::text, 3, '0') else p_n::text end;
$$;

-- Gestructureerde mededeling: 10 cijfers = jaar * 1 000 000 + volgnummer,
-- plus 2 controlecijfers (mod 97; 0 -> 97).
create or replace function public.ogm_voor(p_jaar integer, p_n integer)
returns text
language plpgsql
immutable
as $$
declare
  basis bigint := p_jaar::bigint * 1000000 + p_n;
  chk   integer := (basis % 97)::integer;
  s     text;
begin
  if p_n < 1 or p_n > 999999 then
    raise exception 'volgnummer % valt buiten 1..999999', p_n;
  end if;
  if chk = 0 then chk := 97; end if;
  s := lpad(basis::text, 10, '0') || lpad(chk::text, 2, '0');
  return '+++' || substr(s, 1, 3) || '/' || substr(s, 4, 4) || '/' || substr(s, 8, 5) || '+++';
end;
$$;

-- Startwaarden: verder na het hoogste bestaande nummer van dit jaar (enkel
-- nummers in het vaste formaat; DEMO-… en oude formaten tellen niet mee).
insert into public.documentnummers (soort, jaar, laatste)
select 'FAC', substring(number from '^FAC-(\d{4})-')::int, max(substring(number from '^FAC-\d{4}-(\d+)$')::int)
  from public.invoices where number ~ '^FAC-\d{4}-\d+$'
 group by 1, 2
on conflict (soort, jaar) do update set laatste = greatest(documentnummers.laatste, excluded.laatste);

insert into public.documentnummers (soort, jaar, laatste)
select 'CN', substring(number from '^CN-(\d{4})-')::int, max(substring(number from '^CN-\d{4}-(\d+)$')::int)
  from public.credit_notes where number ~ '^CN-\d{4}-\d+$'
 group by 1, 2
on conflict (soort, jaar) do update set laatste = greatest(documentnummers.laatste, excluded.laatste);

insert into public.documentnummers (soort, jaar, laatste)
select 'OFF', substring(offer_no from '^OFF-(\d{4})-')::int, max(substring(offer_no from '^OFF-\d{4}-(\d+)$')::int)
  from public.offers where offer_no ~ '^OFF-\d{4}-\d+$'
 group by 1, 2
on conflict (soort, jaar) do update set laatste = greatest(documentnummers.laatste, excluded.laatste);

-- ---------- 2. Nieuwe kolommen ----------
alter table public.invoices
  add column if not exists ogm          text,
  add column if not exists btw_regime   text,
  add column if not exists btw_controle jsonb;
alter table public.offers
  add column if not exists btw_regime   text,
  add column if not exists btw_controle jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_btw_regime_chk') then
    alter table public.invoices add constraint invoices_btw_regime_chk
      check (btw_regime is null or btw_regime in ('binnenland', 'verlegd', 'buiten-eu'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'offers_btw_regime_chk') then
    alter table public.offers add constraint offers_btw_regime_chk
      check (btw_regime is null or btw_regime in ('binnenland', 'verlegd', 'buiten-eu'));
  end if;
end $$;

-- Bestaande facturen in het vaste formaat krijgen hun mededeling meteen.
update public.invoices
   set ogm = public.ogm_voor(substring(number from '^FAC-(\d{4})-')::int,
                             substring(number from '^FAC-\d{4}-(\d+)$')::int)
 where ogm is null and number ~ '^FAC-\d{4}-\d{1,6}$';

create unique index if not exists invoices_number_uniek     on public.invoices (number);
create unique index if not exists invoices_ogm_uniek        on public.invoices (ogm) where ogm is not null;
create unique index if not exists credit_notes_number_uniek on public.credit_notes (number);
create unique index if not exists offers_offer_no_uniek     on public.offers (offer_no) where offer_no is not null;

-- ---------- 3. Nummer toekennen bij het opslaan ----------
-- Per tabel een eigen functie: elke tabel heeft andere kolommen.
-- Jaar = Belgische kalenderdag van uitgifte (issued_at), anders vandaag.

create or replace function public.factuur_nummer_toekennen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jaar integer;
  v_n    integer;
begin
  if new.number is null or btrim(new.number) = '' then
    v_jaar := extract(year from coalesce(new.issued_at, (now() at time zone 'Europe/Brussels')::date))::integer;
    v_n := public.volgend_documentnummer('FAC', v_jaar);
    new.number := public.document_nummer('FAC', v_jaar, v_n);
    new.ogm := public.ogm_voor(v_jaar, v_n);
  elsif new.number ~ '^FAC-\d{4}-\d{1,6}$' then
    -- Expliciet nummer (oude code): teller minstens tot hier, zodat een
    -- volgend automatisch nummer nooit botst.
    perform public.teller_minstens('FAC', substring(new.number from '^FAC-(\d{4})-')::int,
                                   substring(new.number from '^FAC-\d{4}-(\d+)$')::int);
    if new.ogm is null then
      new.ogm := public.ogm_voor(substring(new.number from '^FAC-(\d{4})-')::int,
                                 substring(new.number from '^FAC-\d{4}-(\d+)$')::int);
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.creditnota_nummer_toekennen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jaar integer;
begin
  if new.number is null or btrim(new.number) = '' then
    v_jaar := extract(year from coalesce(new.issued_at, (now() at time zone 'Europe/Brussels')::date))::integer;
    new.number := public.document_nummer('CN', v_jaar, public.volgend_documentnummer('CN', v_jaar));
  elsif new.number ~ '^CN-\d{4}-\d{1,6}$' then
    perform public.teller_minstens('CN', substring(new.number from '^CN-(\d{4})-')::int,
                                   substring(new.number from '^CN-\d{4}-(\d+)$')::int);
  end if;
  return new;
end;
$$;

create or replace function public.offerte_nummer_toekennen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jaar integer;
begin
  if new.offer_no is null or btrim(new.offer_no) = '' then
    v_jaar := extract(year from (now() at time zone 'Europe/Brussels')::date)::integer;
    new.offer_no := public.document_nummer('OFF', v_jaar, public.volgend_documentnummer('OFF', v_jaar));
  elsif new.offer_no ~ '^OFF-\d{4}-\d{1,6}$' then
    perform public.teller_minstens('OFF', substring(new.offer_no from '^OFF-(\d{4})-')::int,
                                   substring(new.offer_no from '^OFF-\d{4}-(\d+)$')::int);
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_nummer on public.invoices;
create trigger invoices_nummer before insert on public.invoices
  for each row execute function public.factuur_nummer_toekennen();

drop trigger if exists credit_notes_nummer on public.credit_notes;
create trigger credit_notes_nummer before insert on public.credit_notes
  for each row execute function public.creditnota_nummer_toekennen();

drop trigger if exists offers_nummer on public.offers;
create trigger offers_nummer before insert on public.offers
  for each row execute function public.offerte_nummer_toekennen();

-- ---------- 4. Nummer en mededeling liggen vast ----------
create or replace function public.factuur_nummer_vast()
returns trigger
language plpgsql
as $$
begin
  if old.number ~ '^FAC-\d{4}-\d+$' and new.number is distinct from old.number then
    raise exception 'Het nummer % ligt vast en kan niet gewijzigd worden.', old.number using errcode = 'P0001';
  end if;
  if old.ogm is not null and new.ogm is distinct from old.ogm then
    raise exception 'De gestructureerde mededeling van % ligt vast.', old.number using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.creditnota_nummer_vast()
returns trigger
language plpgsql
as $$
begin
  if old.number ~ '^CN-\d{4}-\d+$' and new.number is distinct from old.number then
    raise exception 'Het nummer % ligt vast en kan niet gewijzigd worden.', old.number using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_nummer_vast on public.invoices;
create trigger invoices_nummer_vast before update on public.invoices
  for each row execute function public.factuur_nummer_vast();

drop trigger if exists credit_notes_nummer_vast on public.credit_notes;
create trigger credit_notes_nummer_vast before update on public.credit_notes
  for each row execute function public.creditnota_nummer_vast();

-- ---------- 5. Wissen: enkel de allerlaatste, en dan schuift de teller terug ----------
-- Gedeeld door facturen en creditnota's (allebei een kolom number).
create or replace function public.document_wissen()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_soort   text;
  v_jaar    integer;
  v_n       integer;
  v_laatste integer;
begin
  if old.number !~ '^(FAC|CN)-\d{4}-\d+$' then
    return old;  -- DEMO-… of oud formaat: geen reeks, gewoon wissen
  end if;
  v_soort := substring(old.number from '^(FAC|CN)-');
  v_jaar  := substring(old.number from '^[A-Z]+-(\d{4})-')::int;
  v_n     := substring(old.number from '-(\d+)$')::int;
  select d.laatste into v_laatste
    from public.documentnummers d
   where d.soort = v_soort and d.jaar = v_jaar
   for update;
  if v_laatste is not null and v_n = v_laatste then
    update public.documentnummers d set laatste = d.laatste - 1
     where d.soort = v_soort and d.jaar = v_jaar;
    return old;
  end if;
  raise exception '% kan niet gewist worden: een factuur of creditnota met een nummer blijft bestaan. Maak een creditnota.', old.number
    using errcode = 'P0001';
end;
$$;

drop trigger if exists invoices_niet_wissen on public.invoices;
create trigger invoices_niet_wissen before delete on public.invoices
  for each row execute function public.document_wissen();

drop trigger if exists credit_notes_niet_wissen on public.credit_notes;
create trigger credit_notes_niet_wissen before delete on public.credit_notes
  for each row execute function public.document_wissen();

-- Oude, gedeelde functies uit een eerdere versie van dit bestand opruimen.
drop function if exists public.ken_documentnummer_toe();
drop function if exists public.bewaak_documentnummer();
drop function if exists public.wis_documentnummer();

notify pgrst, 'reload schema';
