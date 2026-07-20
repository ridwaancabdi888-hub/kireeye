create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  requested_role := coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'customer');

  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Kireeye User'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  );

  insert into public.user_roles (user_id, role)
  values (new.id, requested_role);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);
create policy "roles read own" on public.user_roles
  for select using (auth.uid() = user_id);
create policy "public vehicles readable" on public.vehicles
  for select using (status = 'available');
create policy "customers read own bookings" on public.bookings
  for select using (auth.uid() = customer_id);
create policy "customers create own bookings" on public.bookings
  for insert with check (auth.uid() = customer_id);
create policy "customers read own payments" on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );
create policy "customers create reviews" on public.reviews
  for insert with check (auth.uid() = customer_id);
