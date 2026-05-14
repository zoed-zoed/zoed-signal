create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.briefs (
  id text primary key,
  title text not null,
  date date not null,
  intro text not null,
  tags text[] not null default '{}',
  core_trend text,
  student_insight text,
  content_ideas text,
  resume_portfolio_note text,
  news_item_ids text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.news_items (
  id text primary key,
  brief_id text not null references public.briefs(id) on delete restrict,
  title text not null,
  source_name text not null,
  source_url text not null,
  published_at date not null,
  category text not null,
  importance text not null,
  what_happened text not null,
  why_important text not null,
  relevance_to_business_students text not null,
  interview_or_case_use text not null,
  next_action text not null,
  tags text[] not null default '{}',
  saved_type text[] not null default '{}',
  curation_stage text not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint news_items_importance_check check (importance in ('必看', '可扫')),
  constraint news_items_curation_stage_check check (curation_stage in ('candidate', 'published'))
);

create index if not exists briefs_date_idx on public.briefs (date desc);
create index if not exists news_items_brief_id_idx on public.news_items (brief_id);
create index if not exists news_items_published_at_idx on public.news_items (published_at desc);
create index if not exists news_items_category_idx on public.news_items (category);
create index if not exists news_items_importance_idx on public.news_items (importance);

drop trigger if exists briefs_set_updated_at on public.briefs;
create trigger briefs_set_updated_at
before update on public.briefs
for each row
execute function public.set_updated_at();

drop trigger if exists news_items_set_updated_at on public.news_items;
create trigger news_items_set_updated_at
before update on public.news_items
for each row
execute function public.set_updated_at();

alter table public.briefs enable row level security;
alter table public.news_items enable row level security;

-- Supabase Data API explicit grants for current public content tables.
-- Public content can be read by site visitors, but only the server can modify it.

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.briefs from anon, authenticated;
revoke all on table public.news_items from anon, authenticated;

grant select on table public.briefs to anon, authenticated;
grant select on table public.news_items to anon, authenticated;

grant select, insert, update, delete on table public.briefs to service_role;
grant select, insert, update, delete on table public.news_items to service_role;

grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to service_role;

alter default privileges in schema public
grant usage, select on sequences to service_role;
