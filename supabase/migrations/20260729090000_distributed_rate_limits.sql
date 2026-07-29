-- Distributed, per-account fixed-window rate limiting.
-- Rules and counters stay in a non-exposed schema and are reachable only
-- through the authenticated SECURITY DEFINER function below.
create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);

create table if not exists private.rate_limit_rules (
  scope text primary key,
  max_requests integer not null check (max_requests between 1 and 1000),
  window_seconds integer not null check (window_seconds between 1 and 86400)
);

alter table private.rate_limit_buckets enable row level security;
alter table private.rate_limit_rules enable row level security;
revoke all on table private.rate_limit_buckets from public, anon, authenticated;
revoke all on table private.rate_limit_rules from public, anon, authenticated;

create index if not exists rate_limit_buckets_updated_at_idx
  on private.rate_limit_buckets (updated_at);

insert into private.rate_limit_rules (scope, max_requests, window_seconds)
values
  ('booking:create', 8, 60),
  ('payment:proof', 8, 300),
  ('vehicle:create', 10, 300),
  ('booking:status', 30, 60),
  ('company:user:create', 10, 300),
  ('company:user:update', 30, 60),
  ('admin:company:create', 6, 300)
on conflict (scope) do update
set max_requests = excluded.max_requests,
    window_seconds = excluded.window_seconds;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_identity text
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_bucket_key text;
  v_window_started_at timestamptz;
  v_request_count integer;
  v_limit integer;
  v_window_seconds integer;
  v_window interval;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if p_scope is null or p_scope !~ '^[a-z0-9:_-]{1,80}$' then
    raise exception 'invalid rate-limit scope' using errcode = '22023';
  end if;

  if p_identity is null or length(p_identity) < 1 or length(p_identity) > 200 then
    raise exception 'invalid rate-limit identity' using errcode = '22023';
  end if;

  select rule.max_requests, rule.window_seconds
  into v_limit, v_window_seconds
  from private.rate_limit_rules as rule
  where rule.scope = p_scope;

  if v_limit is null then
    raise exception 'unknown rate-limit scope' using errcode = '22023';
  end if;

  v_window := make_interval(secs => v_window_seconds);
  v_bucket_key := md5(v_user_id::text || ':' || p_scope || ':' || p_identity);

  insert into private.rate_limit_buckets as bucket (
    bucket_key, window_started_at, request_count, updated_at
  )
  values (v_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do update
  set
    request_count = case
      when bucket.window_started_at + v_window <= v_now then 1
      else bucket.request_count + 1
    end,
    window_started_at = case
      when bucket.window_started_at + v_window <= v_now then v_now
      else bucket.window_started_at
    end,
    updated_at = v_now
  returning bucket.window_started_at, bucket.request_count
  into v_window_started_at, v_request_count;

  return query
  select
    v_request_count <= v_limit,
    greatest(v_limit - v_request_count, 0),
    v_window_started_at + v_window;
end;
$$;

revoke all on function public.consume_rate_limit(text, text) from public;
revoke all on function public.consume_rate_limit(text, text) from anon;
grant execute on function public.consume_rate_limit(text, text) to authenticated;
