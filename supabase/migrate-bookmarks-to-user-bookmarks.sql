-- Migrate rows from the legacy public.bookmarks table into public.user_bookmarks
-- for the current single-owner stage of zoed.signal, then remove the legacy table.
--
-- Migration behavior:
-- 1. Pick one owner user id from either:
--    - the first profile row, or
--    - a manually substituted UUID if you prefer to edit this file before running it.
-- 2. Copy legacy bookmarks into user_bookmarks for that owner.
-- 3. Drop the old bookmarks table.

with owner_profile as (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
insert into public.user_bookmarks (user_id, news_id, bucket, created_at)
select owner_profile.id, b.news_id, b.bucket, b.created_at
from public.bookmarks b
cross join owner_profile
on conflict (user_id, news_id, bucket) do nothing;

drop table if exists public.bookmarks;
