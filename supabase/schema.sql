create extension if not exists pgcrypto;

create table if not exists audit_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  correlation_id text not null,
  workflow_name text not null,
  status text not null,
  event_type text not null,
  input jsonb,
  output jsonb,
  error jsonb
);

create index if not exists audit_logs_corr_idx on audit_logs (correlation_id);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  correlation_id text not null,
  kind text not null,
  channel text not null,
  payload jsonb not null,
  risk_score integer not null default 0,
  rule_hits jsonb,
  status text not null default 'pending',
  approved_by text,
  approved_at timestamptz,
  scheduled_for timestamptz,
  executed_at timestamptz,
  result jsonb,
  error jsonb
);

create index if not exists approvals_status_idx on approvals (status, scheduled_for);

create table if not exists publish_jobs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  correlation_id text not null,
  channel text not null,
  approval_id uuid,
  payload jsonb not null,
  status text not null default 'queued',
  attempt_count integer not null default 0,
  last_error jsonb,
  external_id text,
  executed_at timestamptz
);

create index if not exists publish_jobs_status_idx on publish_jobs (status, created_at desc);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  correlation_id text not null,
  source_type text not null,
  source_url text,
  storage_bucket text not null default 'media',
  storage_path text not null,
  mime_type text not null,
  bytes bigint not null,
  sha256 text not null,
  license_owned_or_licensed boolean not null default false,
  model_release_on_file boolean not null default false,
  property_id text,
  photographer_credit text,
  restrictions text,
  meta jsonb
);

create index if not exists media_assets_sha_idx on media_assets (sha256);

create table if not exists system_flags (
  key text primary key,
  value jsonb not null
);

insert into system_flags (key, value)
values ('publishing_kill_switch', '{"enabled": false}')
on conflict (key) do nothing;

create table if not exists seen_items (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  source text not null,
  item_key text not null unique,
  payload jsonb
);

create table if not exists leads (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  correlation_id text not null,
  source text not null,
  name text,
  email text,
  phone text,
  message text,
  intent_score integer not null default 0,
  tags text[] not null default '{}',
  raw jsonb not null
);

create index if not exists leads_email_idx on leads (email);
create index if not exists leads_phone_idx on leads (phone);
