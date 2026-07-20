-- Kireeye phase 5: company onboarding and operational profile visibility.

create policy "owners create company" on public.companies
  for insert with check (owner_id = auth.uid());

create policy "companies read assigned customers" on public.profiles
  for select using (
    auth.uid() = id
    or public.is_platform_admin()
    or exists (
      select 1
      from public.bookings b
      join public.vehicles v on v.id = b.vehicle_id
      where b.customer_id = public.profiles.id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id))
    )
    or exists (
      select 1 from public.company_employees ce
      where ce.user_id = public.profiles.id
      and public.owns_company(ce.company_id)
    )
  );

create policy "employees read their company" on public.companies
  for select using (
    owner_id = auth.uid()
    or exists (select 1 from public.company_employees ce where ce.company_id = id and ce.user_id = auth.uid() and ce.active)
    or public.is_platform_admin()
  );

create policy "employees read company vehicles" on public.vehicles
  for select using (
    status = 'available'
    or owner_id = auth.uid()
    or public.owns_company(company_id)
    or exists (select 1 from public.company_employees ce where ce.company_id = vehicles.company_id and ce.user_id = auth.uid() and ce.active)
    or public.is_platform_admin()
  );

create policy "employees read assigned bookings" on public.bookings
  for select using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
      and (
        v.owner_id = auth.uid()
        or public.owns_company(v.company_id)
        or exists (select 1 from public.company_employees ce where ce.company_id = v.company_id and ce.user_id = auth.uid() and ce.active)
      )
    )
    or public.is_platform_admin()
  );

create or replace function public.slugify_company_name(company_name text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(company_name), '[^a-z0-9]+', '-', 'g'));
$$;
