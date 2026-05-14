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

- business tables are available to `service_role`
- `anon` and `authenticated` do not get table access yet

## Table-by-table rule

### `public.briefs`

What it stores:

- brief issues / editions

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no direct table access
- `authenticated`: no direct table access

Why:

- the site renders brief content on the server
- the browser is not querying Supabase directly

### `public.news_items`

What it stores:

- structured news content shown in briefs

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no direct table access
- `authenticated`: no direct table access

Why:

- this is core editorial content
- it is currently managed through server-side code and admin flows

### `public.bookmarks`

What it stores:

- saved news items grouped into buckets like `interview`, `case`, `content`, `research`

Who should access it now:

- `service_role`: can read, create, update, delete
- `anon`: no direct table access
- `authenticated`: no direct table access

Why:

- the project does not yet have a finished user auth and per-user RLS model
- exposing this table too early would make later permission cleanup harder

## What changed in `schema.sql`

We added four important ideas:

1. Explicit `grant` for current tables
   This ensures `service_role` is explicitly allowed to use the current business tables.

2. Explicit `revoke` for `anon` and `authenticated`
   This matches the current product stage: no direct client-side database access yet.

3. `alter default privileges`
   This helps future tables stay accessible to `service_role` by default.

4. RLS stays enabled
   We keep row level security enabled so the project can evolve safely later.

## What this means in plain language

For now, all three current business tables follow one rule:

- only the server is allowed to use them directly

This matches how `zoed.signal` works today.

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

1. `briefs`, `news_items`, and `bookmarks` are service-only tables.
2. The app server can read and write them with `service_role`.
3. `anon` and `authenticated` do not directly access them yet.
4. Future tables should follow this same rule by default until Auth and RLS policies are introduced properly.
