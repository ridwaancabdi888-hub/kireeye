-- Kireeye phase 3: harden signup roles and add operational helpers.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text;
  safe_role public.app_role;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
  safe_role := case
    when requested_role = 'company_owner' then 'company_owner'::public.app_role
    when requested_role = 'car_owner' then 'car_owner'::public.app_role
    else 'customer'::public.app_role
  end;

  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Kireeye User'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, safe_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create or replace function public.recalculate_vehicle_rating(target_vehicle uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vehicles
  set rating = coalesce((select avg(rating)::numeric(3,2) from public.reviews where vehicle_id = target_vehicle), 0)
  where id = target_vehicle;
end;
$$;

create or replace function public.after_review_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.recalculate_vehicle_rating(coalesce(new.vehicle_id, old.vehicle_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recalculate_vehicle_rating on public.reviews;
create trigger reviews_recalculate_vehicle_rating
after insert or update or delete on public.reviews
for each row execute procedure public.after_review_change();

create or replace function public.increment_vehicle_booking_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    update public.vehicles set booking_count = booking_count + 1 where id = new.vehicle_id;
  end if;
  return new;
end;
$$;

drop trigger if exists booking_confirmation_counter on public.bookings;
create trigger booking_confirmation_counter
after update of status on public.bookings
for each row execute procedure public.increment_vehicle_booking_count();

create index if not exists vehicles_status_featured_idx on public.vehicles(status, featured, booking_count desc);
create index if not exists bookings_customer_status_idx on public.bookings(customer_id, status, created_at desc);
create index if not exists bookings_vehicle_status_idx on public.bookings(vehicle_id, status, created_at desc);
create index if not exists payments_status_created_idx on public.payments(status, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
