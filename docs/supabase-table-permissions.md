# Supabase Table Permissions

## Why this file exists

Supabase is changing its default behavior for tables exposed through the Data API.

For `zoed.signal`, the practical meaning is simple:

- creating a table is no longer enough
- we also need to state who is allowed to use that table

If we do not do that, the table may exist in Postgres but still fail when the app tries to access it through `supabase-js`.

## Current project access model

At the current stage of `zoed.signal`:

- the website reads and writes through the server
- the server uses `SUPABASE_SERVICE_ROLE_KEY`
- regular frontend users do not directly query Supabase tables yet
- Auth, user-level RLS, and client-side table access are not finished yet

So the safest current rule is:

- published content tables can be read by `anon` and `authenticated`
- internal and user tables stay service-only for now
- the server continues to write through `service_role`

## Table-by-table rule

### `public.briefs`

What it stores:

- brief issues / editions

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: read only
- `authenticated`: read only

Why:

- the site renders brief content on the server
- the browser is not querying Supabase directly

### `public.news_items`

What it stores:

- structured news content shown in briefs

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: read only
- `authenticated`: read only

Why:

- this is core editorial content
- it is currently managed through server-side code and admin flows

### `public.source_feeds`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.source_import_runs`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.source_items_raw`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.jobs`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.feature_flags`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.system_settings`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: no access

### `public.profiles`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: later use RLS, not now

### `public.user_bookmarks`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: later use RLS, not now

### `public.user_reads`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: later use RLS, not now

### `public.user_feedback`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no access
- `authenticated`: later use RLS, not now

## What changed in `schema.sql`

We added four important ideas:

1. Explicit `grant` for current tables
   This ensures the right roles can reach the right tables through the Data API.

2. Public read access only for `briefs` and `news_items`
   This matches the product behavior where published content is visible to site visitors.

3. Internal and user tables stay service-only for now
   This avoids premature client-side exposure before Auth + RLS are finished.

4. `alter default privileges`
   This helps future tables stay accessible to `service_role` by default.

5. RLS stays enabled
   We keep row level security enabled so the project can evolve safely later.

## What this means in plain language

For now, the project follows two rules:

- public content can be read by visitors
- everything else stays server-controlled

## What to do when adding a new table later

Ask one question first:

Who should use this table?

### Case 1. Internal table

Examples:

- ingestion logs
- source registry
- processing state
- admin-only content

Use the current pattern:

- `service_role` only

### Case 2. Public-readable table

Examples:

- if later you want some data to be safely readable from the browser

Then you would explicitly grant read access, for example:

```sql
grant select on table public.your_table to anon, authenticated;
```

Only do this when you intentionally want client-side access.

### Case 3. User-owned table

Examples:

- per-user bookmarks
- notes
- saved filters

Then the right long-term pattern is:

- grant access to `authenticated`
- enable RLS
- add policies like "users can only read their own rows"

That is a later-stage change, not the current one.

## Current conclusion

For `zoed.signal` right now, the correct and simplest permissions model is:

1. `briefs` and `news_items` are public-read tables.
2. All internal and user-scoped tables are service-only for now.
3. The legacy `bookmarks` table is retired in favor of `user_bookmarks`.
4. Future tables should follow this same rule by default until Auth and RLS policies are introduced properly.
