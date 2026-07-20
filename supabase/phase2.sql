-- Kireeye phase 2: storage, permissions, invitations, notifications and richer marketplace data.

create table if not exists public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  storage_path text not null,
  public_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.employee_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role_name text not null default 'Company Employee',
  permissions jsonb not null default '{}',
  invited_by uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now(),
  unique(company_id,email,status)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'general',
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.payments add column if not exists reviewed_by uuid references public.profiles(id);
alter table public.payments add column if not exists reviewed_at timestamptz;
alter table public.payments add column if not exists rejection_reason text;
alter table public.vehicles add column if not exists description text;
alter table public.vehicles add column if not exists deposit_amount numeric(12,2) default 0;
alter table public.vehicles add column if not exists fuel_type text;
alter table public.vehicles add column if not exists plate_number text;
alter table public.vehicles add column if not exists featured boolean default false;

alter table public.vehicle_images enable row level security;
alter table public.employee_invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin') or public.has_role('platform_admin');
$$;

create or replace function public.owns_company(target_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.companies
    where id = target_company and owner_id = auth.uid()
  );
$$;

create policy "vehicle images public read" on public.vehicle_images
  for select using (true);
create policy "owners manage vehicle images" on public.vehicle_images
  for all using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id) or public.is_platform_admin())
    )
  ) with check (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id) or public.is_platform_admin())
    )
  );

create policy "company owners manage invitations" on public.employee_invitations
  for all using (public.owns_company(company_id) or public.is_platform_admin())
  with check (public.owns_company(company_id) or public.is_platform_admin());

create policy "users read own notifications" on public.notifications
  for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications
  for update using (user_id = auth.uid());
create policy "admins create notifications" on public.notifications
  for insert with check (public.is_platform_admin() or user_id = auth.uid());

create policy "admins read audit logs" on public.audit_logs
  for select using (public.is_platform_admin());
create policy "authenticated create audit logs" on public.audit_logs
  for insert with check (actor_id = auth.uid());

create policy "admins manage companies" on public.companies
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "owners read own company" on public.companies
  for select using (owner_id = auth.uid() or public.is_platform_admin());
create policy "owners update own company" on public.companies
  for update using (owner_id = auth.uid() or public.is_platform_admin());

create policy "owners manage own vehicles" on public.vehicles
  for all using (
    owner_id = auth.uid() or public.owns_company(company_id) or public.is_platform_admin()
  ) with check (
    owner_id = auth.uid() or public.owns_company(company_id) or public.is_platform_admin()
  );

create policy "admins manage bookings" on public.bookings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "companies read assigned bookings" on public.bookings
  for select using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id))
    )
  );
create policy "companies update assigned bookings" on public.bookings
  for update using (
    exists (
      select 1 from public.vehicles v
      where v.id = vehicle_id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id))
    )
  );

create policy "admins manage payments" on public.payments
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "customers insert own booking payments" on public.payments
  for insert with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
  ('vehicle-images','vehicle-images',true,10485760,array['image/jpeg','image/png','image/webp']),
  ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']),
  ('verification-documents','verification-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "vehicle images publicly readable" on storage.objects
  for select using (bucket_id = 'vehicle-images');
create policy "authenticated upload vehicle images" on storage.objects
  for insert to authenticated with check (bucket_id = 'vehicle-images');
create policy "owners update their vehicle images" on storage.objects
  for update to authenticated using (bucket_id = 'vehicle-images' and owner_id = auth.uid()::text);
create policy "owners delete their vehicle images" on storage.objects
  for delete to authenticated using (bucket_id = 'vehicle-images' and owner_id = auth.uid()::text);

create policy "customers upload payment proofs" on storage.objects
  for insert to authenticated with check (bucket_id = 'payment-proofs');
create policy "customers read own payment proofs" on storage.objects
  for select to authenticated using (bucket_id = 'payment-proofs' and owner_id = auth.uid()::text);

create policy "authenticated upload verification documents" on storage.objects
  for insert to authenticated with check (bucket_id = 'verification-documents');
create policy "owners read verification documents" on storage.objects
  for select to authenticated using (bucket_id = 'verification-documents' and owner_id = auth.uid()::text);
