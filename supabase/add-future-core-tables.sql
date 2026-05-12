create table if not exists public.source_feeds (
  id text primary key,
  name text not null,
  source_type text not null check (source_type in ('api', 'rss', 'manual', 'web')),
  base_url text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.source_import_runs (
  id bigserial primary key,
  feed_id text references public.source_feeds(id) on delete set null,
  run_status text not null default 'success' check (run_status in ('queued', 'running', 'success', 'failed')),
  trigger_type text not null default 'manual' check (trigger_type in ('manual', 'scheduled', 'retry')),
  fetched_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  failed_count integer not null default 0,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  notes text
);

create table if not exists public.source_items_raw (
  id bigserial primary key,
  run_id bigint references public.source_import_runs(id) on delete set null,
  feed_id text references public.source_feeds(id) on delete set null,
  external_id text,
  source_url text,
  title text,
  published_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  normalized_summary text,
  dedupe_key text,
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'normalized', 'imported', 'duplicate', 'failed')),
  mapped_news_item_id text references public.news_items(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  major text,
  academic_year text,
  career_direction text,
  is_business_student boolean not null default false,
  interests text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id text not null references public.news_items(id) on delete cascade,
  bucket text not null default 'research' check (bucket in ('interview', 'case', 'content', 'research')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, news_id, bucket)
);

create table if not exists public.user_reads (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id text not null references public.news_items(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  unique (user_id, news_id)
);

create table if not exists public.user_feedback (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id text not null references public.news_items(id) on delete cascade,
  feedback_type text not null check (feedback_type in ('like', 'dislike', 'too_basic', 'too_technical', 'save_for_later')),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.jobs (
  id bigserial primary key,
  job_name text not null,
  job_status text not null default 'idle' check (job_status in ('idle', 'running', 'success', 'failed')),
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_import_runs_feed_id_idx on public.source_import_runs (feed_id);
create index if not exists source_import_runs_started_at_idx on public.source_import_runs (started_at desc);
create index if not exists source_items_raw_run_id_idx on public.source_items_raw (run_id);
create index if not exists source_items_raw_feed_id_idx on public.source_items_raw (feed_id);
create index if not exists source_items_raw_source_url_idx on public.source_items_raw (source_url);
create index if not exists source_items_raw_dedupe_key_idx on public.source_items_raw (dedupe_key);
create index if not exists user_bookmarks_user_id_idx on public.user_bookmarks (user_id);
create index if not exists user_reads_user_id_idx on public.user_reads (user_id);
create index if not exists user_feedback_user_id_idx on public.user_feedback (user_id);

drop trigger if exists source_feeds_set_updated_at on public.source_feeds;
create trigger source_feeds_set_updated_at
before update on public.source_feeds
for each row
execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.source_feeds enable row level security;
alter table public.source_import_runs enable row level security;
alter table public.source_items_raw enable row level security;
alter table public.profiles enable row level security;
alter table public.user_bookmarks enable row level security;
alter table public.user_reads enable row level security;
alter table public.user_feedback enable row level security;
alter table public.jobs enable row level security;
alter table public.system_settings enable row level security;
alter table public.feature_flags enable row level security;
