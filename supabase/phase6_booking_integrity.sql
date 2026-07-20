-- Kireeye phase 6: booking integrity, availability protection and automatic notifications.

create or replace function public.prevent_overlapping_bookings()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.return_at <= new.pickup_at then
    raise exception 'Return time must be after pickup time';
  end if;

  if new.status in ('pending','awaiting_payment','confirmed','in_progress') and exists (
    select 1 from public.bookings b
    where b.vehicle_id = new.vehicle_id
      and b.id <> coalesce(new.id, gen_random_uuid())
      and b.status in ('pending','awaiting_payment','confirmed','in_progress')
      and tstzrange(b.pickup_at,b.return_at,'[)') && tstzrange(new.pickup_at,new.return_at,'[)')
  ) then
    raise exception 'Vehicle is not available for the selected period';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_booking_overlap on public.bookings;
create trigger prevent_booking_overlap
before insert or update of vehicle_id,pickup_at,return_at,status on public.bookings
for each row execute procedure public.prevent_overlapping_bookings();

create or replace function public.notify_booking_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  vehicle_name text;
  provider_user uuid;
  company_owner uuid;
begin
  select v.name, v.owner_id, c.owner_id
    into vehicle_name, provider_user, company_owner
  from public.vehicles v
  left join public.companies c on c.id = v.company_id
  where v.id = new.vehicle_id;

  if tg_op = 'INSERT' then
    insert into public.notifications(user_id,title,body,type,link)
    values(new.customer_id,'Booking-ka waa la gudbiyey','Booking-ka ' || coalesce(vehicle_name,'gaadhiga') || ' ayaa la gudbiyey.','booking','/customer/bookings');

    if provider_user is not null and provider_user <> new.customer_id then
      insert into public.notifications(user_id,title,body,type,link)
      values(provider_user,'Booking cusub',coalesce(vehicle_name,'Gaadhi') || ' wuxuu helay booking cusub.','booking','/company/bookings');
    end if;
    if company_owner is not null and company_owner <> provider_user and company_owner <> new.customer_id then
      insert into public.notifications(user_id,title,body,type,link)
      values(company_owner,'Booking cusub',coalesce(vehicle_name,'Gaadhi') || ' wuxuu helay booking cusub.','booking','/company/bookings');
    end if;
  elsif old.status is distinct from new.status then
    insert into public.notifications(user_id,title,body,type,link)
    values(new.customer_id,'Booking status updated','Booking-ka ' || coalesce(vehicle_name,'gaadhiga') || ' wuxuu noqday ' || replace(new.status::text,'_',' ') || '.','booking','/customer/bookings');
  end if;

  return new;
end;
$$;

drop trigger if exists booking_notification_trigger on public.bookings;
create trigger booking_notification_trigger
after insert or update of status on public.bookings
for each row execute procedure public.notify_booking_change();

create or replace function public.notify_payment_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  customer uuid;
begin
  select b.customer_id into customer from public.bookings b where b.id = new.booking_id;
  if customer is null then return new; end if;

  if tg_op = 'INSERT' then
    insert into public.notifications(user_id,title,body,type,link)
    values(customer,'Payment received','Payment-ka ' || new.method || ' wuxuu sugayaa xaqiijin.','payment','/customer/bookings');
  elsif old.status is distinct from new.status then
    insert into public.notifications(user_id,title,body,type,link)
    values(customer,'Payment status updated','Payment-kaaga wuxuu noqday ' || replace(new.status,'_',' ') || '.','payment','/customer/bookings');
  end if;
  return new;
end;
$$;

drop trigger if exists payment_notification_trigger on public.payments;
create trigger payment_notification_trigger
after insert or update of status on public.payments
for each row execute procedure public.notify_payment_change();
