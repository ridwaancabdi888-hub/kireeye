create type public.app_role as enum ('super_admin','platform_admin','company_owner','company_employee','car_owner','customer');
create type public.verification_status as enum ('pending','approved','rejected','suspended');
create type public.booking_status as enum ('draft','pending','awaiting_payment','confirmed','in_progress','completed','cancelled','rejected','disputed','refunded');
create type public.vehicle_status as enum ('draft','pending_approval','available','reserved','rented','maintenance','suspended','rejected','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text unique,
  email text,
  preferred_language text default 'so' check (preferred_language in ('so','en','ar')),
  avatar_url text,
  created_at timestamptz default now()
);
create table public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade,
  role app_role not null,
  primary key(user_id,role)
);
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null,
  slug text unique not null,
  phone text,
  whatsapp text,
  email text,
  status verification_status default 'pending',
  commission_percent numeric(5,2) default 10,
  created_at timestamptz default now()
);
create table public.company_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  permissions jsonb default '{}',
  active boolean default true,
  unique(company_id,user_id)
);
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  is_airport boolean default false,
  active boolean default true
);
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  name text not null,
  make text not null,
  model text not null,
  year int,
  category text,
  transmission text,
  seats int,
  driver_available boolean default true,
  self_drive_allowed boolean default false,
  intercity_allowed boolean default false,
  price_hour numeric(12,2),
  price_day numeric(12,2),
  price_week numeric(12,2),
  price_month numeric(12,2),
  location_id uuid references public.locations(id),
  status vehicle_status default 'pending_approval',
  rating numeric(3,2) default 0,
  booking_count int default 0,
  created_at timestamptz default now()
);
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  pickup_location_id uuid references public.locations(id),
  dropoff_location_id uuid references public.locations(id),
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  rental_type text not null,
  driver_required boolean default false,
  subtotal numeric(12,2) not null,
  commission_amount numeric(12,2) default 0,
  total numeric(12,2) not null,
  status booking_status default 'pending',
  created_at timestamptz default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null,
  currency text default 'USD',
  reference text,
  status text default 'pending',
  proof_url text,
  created_at timestamptz default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings(id),
  customer_id uuid references public.profiles(id),
  vehicle_id uuid references public.vehicles(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_employees enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
