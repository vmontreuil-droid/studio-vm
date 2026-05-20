-- Atomic-claim voor de batch-finder: meerdere parallelle clients
-- (bv. laptop thuis + desktop op kantoor) kunnen samen scannen
-- zonder dat ze elkaar prospects afpakken. FOR UPDATE SKIP LOCKED
-- zorgt dat elke client een eigen, exclusieve batch krijgt.

create or replace function public.claim_kbo_for_scan(
  p_limit    integer,
  p_q        text default null,
  p_postcode text default null,
  p_nace     text default null,
  p_form     text default null,
  p_active   boolean default true
) returns table (enterprise_number text, website text)
language plpgsql
as $$
begin
  return query
  update public.kbo_enterprises k
     set email_scanned_at = now()
   where k.enterprise_number in (
     select e.enterprise_number
       from public.kbo_enterprises e
      where e.website is not null
        and trim(e.website) <> ''
        and e.email_scanned_at is null
        and (p_q        is null or e.name        ilike '%' || p_q || '%')
        and (p_postcode is null or e.postcode    like  p_postcode || '%')
        and (p_nace     is null or e.nace_main   like  p_nace || '%')
        and (p_form     is null or e.juridical_form = p_form)
        and (not p_active        or e.juridical_status = '000')
      limit p_limit
        for update skip locked
   )
   returning k.enterprise_number, k.website;
end;
$$;

grant execute on function public.claim_kbo_for_scan(
  integer, text, text, text, text, boolean
) to anon, authenticated, service_role;
