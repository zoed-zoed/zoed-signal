alter table public.news_items
add column if not exists curation_stage text not null default 'published';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'news_items_curation_stage_check'
  ) then
    alter table public.news_items
    add constraint news_items_curation_stage_check
    check (curation_stage in ('candidate', 'published'));
  end if;
end
$$;
