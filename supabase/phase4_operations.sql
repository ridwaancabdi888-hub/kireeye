-- Kireeye phase 4: operational tables, admin access, company earnings and platform settings.

create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status verification_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  account_name text,
  account_number text,
  instructions jsonb default '{}',
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  booking_id uuid references public.bookings(id),
  subject text not null,
  message text not null,
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.verification_documents enable row level security;
alter table public.site_settings enable row level security;
alter table public.payment_methods enable row level security;
alter table public.support_tickets enable row level security;

create policy "admins read all profiles" on public.profiles
  for select using (auth.uid() = id or public.is_platform_admin());
create policy "admins update profiles" on public.profiles
  for update using (auth.uid() = id or public.is_platform_admin());
create policy "admins read all roles" on public.user_roles
  for select using (auth.uid() = user_id or public.is_platform_admin());
create policy "super admins manage roles" on public.user_roles
  for all using (public.has_role('super_admin')) with check (public.has_role('super_admin'));

create policy "users manage own documents" on public.verification_documents
  for all using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());
create policy "company owners read company documents" on public.verification_documents
  for select using (public.owns_company(company_id) or public.is_platform_admin());

create policy "public read site settings" on public.site_settings
  for select using (true);
create policy "admins manage site settings" on public.site_settings
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "public read active payment methods" on public.payment_methods
  for select using (active = true or public.is_platform_admin());
create policy "admins manage payment methods" on public.payment_methods
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy "users manage own support tickets" on public.support_tickets
  for all using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());

create policy "companies read booking payments" on public.payments
  for select using (
    exists (
      select 1 from public.bookings b
      join public.vehicles v on v.id = b.vehicle_id
      where b.id = booking_id
      and (v.owner_id = auth.uid() or public.owns_company(v.company_id))
    ) or public.is_platform_admin()
  );

insert into public.payment_methods (name,account_name,account_number,instructions,sort_order)
values
  ('ZAAD','Kireeye','+252 63 4199277','{"so":"U dir lacagta number-kan kadib screenshot-ka geli.","en":"Send payment to this number and upload the receipt.","ar":"أرسل المبلغ إلى هذا الرقم ثم ارفع الإيصال."}',1),
  ('E-Dahab','Kireeye','+252 63 4199277','{"so":"U dir lacagta number-kan kadib screenshot-ka geli."}',2),
  ('EVC Plus','Kireeye','+252 63 4199277','{"so":"U dir lacagta number-kan kadib screenshot-ka geli."}',3),
  ('Sahal','Kireeye','+252 63 4199277','{"so":"U dir lacagta number-kan kadib screenshot-ka geli."}',4),
  ('Cash / Pay on pickup','Kireeye',null,'{"so":"Lacagta bixi marka gaadhiga laguu dhiibo."}',5)
on conflict (name) do update set account_number = excluded.account_number, instructions = excluded.instructions;

insert into public.site_settings (key,value)
values
  ('contact','{"phone":"+252 63 4199277","whatsapp":"+252 63 4199277","email":"ridwaancabdi888@gmail.com"}'),
  ('branding','{"name":"Kireeye","slogan_so":"Gaadhiga saxda ah, goob kasta, goor kasta.","slogan_en":"The right car, anywhere, anytime.","slogan_ar":"السيارة المناسبة، في أي مكان، وفي أي وقت."}'),
  ('commission','{"default_percent":8,"airport_fee":0,"intercity_fee":0}'),
  ('features','{"self_drive":true,"driver_rental":true,"hourly":true,"intercity":true,"airport":true}')
on conflict (key) do nothing;

insert into public.locations (name,city,is_airport)
select * from (values
  ('Hargeysa','Hargeysa',false),
  ('Muqdisho','Muqdisho',false),
  ('Hargeysa Airport','Hargeysa',true),
  ('Muqdisho Airport','Muqdisho',true)
) as seed(name,city,is_airport)
where not exists (select 1 from public.locations l where l.name = seed.name);

create index if not exists verification_documents_user_status_idx on public.verification_documents(user_id,status,created_at desc);
create index if not exists support_tickets_status_priority_idx on public.support_tickets(status,priority,created_at desc);
