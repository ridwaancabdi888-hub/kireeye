create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role text;
  safe_role public.app_role;
begin
  -- Role is sourced EXCLUSIVELY from app_metadata (raw_app_meta_data), which only
  -- the service role / admin API can set. Self-signups can never assign themselves
  -- a role. Combined with public sign-up disabled in Supabase Auth, all accounts
  -- are admin-provisioned.
  requested_role := coalesce(new.raw_app_meta_data ->> 'role', 'customer');
  safe_role := case
    when requested_role = 'super_admin' then 'super_admin'::public.app_role
    when requested_role = 'platform_admin' then 'platform_admin'::public.app_role
    when requested_role = 'company_owner' then 'company_owner'::public.app_role
    when requested_role = 'company_employee' then 'company_employee'::public.app_role
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
