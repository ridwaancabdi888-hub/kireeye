-- Kireeye security hardening (audit P0/P1 follow-ups). Idempotent.
-- 1. Fix broken employee->company read policy (self-join bug: ce.company_id = ce.id)
drop policy if exists "employees read their company" on public.companies;
create policy "employees read their company" on public.companies
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.company_employees ce
      where ce.company_id = companies.id and ce.user_id = auth.uid() and ce.active
    )
    or is_platform_admin()
  );

-- 2. Bookings are created only by the server API (server-side pricing). Remove the
--    client insert path that allowed arbitrary subtotal/total values from the browser.
drop policy if exists "customers create own bookings" on public.bookings;

-- 3. Payments are created only by the server API (proof upload / cash). Remove the
--    client insert path that allowed customers to insert self-approved payment rows.
drop policy if exists "customers insert own booking payments" on public.payments;

-- 4. Audit logs: only platform admins may write from the client; the server
--    (service role) bypasses RLS. Prevents forged audit entries by regular users.
drop policy if exists "authenticated create audit logs" on public.audit_logs;
drop policy if exists "admins create audit logs" on public.audit_logs;
create policy "admins create audit logs" on public.audit_logs
  for insert with check (is_platform_admin() and actor_id = auth.uid());

-- 5. Reviews: add the missing read path and require a completed booking that
--    belongs to the reviewer and matches the vehicle. unique(booking_id) already
--    enforces one review per booking.
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
drop policy if exists "customers create reviews" on public.reviews;
create policy "customers create reviews" on public.reviews
  for insert with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.vehicle_id = reviews.vehicle_id
        and b.status = 'completed'
    )
  );
drop policy if exists "admins manage reviews" on public.reviews;
create policy "admins manage reviews" on public.reviews
  for all using (is_platform_admin()) with check (is_platform_admin());

-- 6. Defense in depth: booking financial/identity columns may only change via the
--    server (service role or direct connection). Companies can still update
--    status/workflow fields through their existing policies.
create or replace function public.protect_booking_financials()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', 'service_role') = 'service_role' then
    return new;
  end if;
  if new.customer_id is distinct from old.customer_id
     or new.vehicle_id is distinct from old.vehicle_id
     or new.subtotal is distinct from old.subtotal
     or new.commission_amount is distinct from old.commission_amount
     or new.total is distinct from old.total then
    raise exception 'Booking financial fields can only be changed by the server.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_booking_financials on public.bookings;
create trigger protect_booking_financials
before update on public.bookings
for each row execute procedure public.protect_booking_financials();
