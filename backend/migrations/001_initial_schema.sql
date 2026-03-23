create extension if not exists pgcrypto;

create table if not exists schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  auth_provider text not null,
  auth_provider_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_provider, auth_provider_user_id)
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_user_id_idx on user_sessions(user_id);
create index if not exists user_sessions_expires_at_idx on user_sessions(expires_at);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  latex_content text not null,
  source_type text not null,
  file_name text,
  parse_status text not null,
  extracted_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users(id) on delete cascade,
  academic_info_json jsonb not null default '{}'::jsonb,
  preferences_json jsonb not null default '{}'::jsonb,
  skills_review_json jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  external_source text not null,
  external_job_id text,
  company text not null,
  title text not null,
  location text,
  description text,
  url text,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists jobs_unique_external_idx
  on jobs(user_id, external_source, external_job_id)
  where external_job_id is not null;

create index if not exists jobs_user_id_idx on jobs(user_id);
create index if not exists jobs_imported_at_idx on jobs(imported_at desc);

create table if not exists application_tracker_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null,
  match_score numeric(5,2),
  deadline timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists application_tracker_user_id_idx on application_tracker_items(user_id);

create table if not exists scraper_bootstrap_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  extension_id text not null,
  allowed_origin text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists scraper_bootstrap_grants_user_id_idx on scraper_bootstrap_grants(user_id);

create table if not exists extension_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  extension_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists extension_access_tokens_user_id_idx on extension_access_tokens(user_id);

create table if not exists embedding_documents (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null,
  parent_type text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
