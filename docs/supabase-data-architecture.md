# zoed.signal Supabase Data Architecture

## Goal

Stabilize the backend data model before expanding ingestion, AI processing, and search.

This design intentionally does not cover:

- frontend visual redesign
- crawler implementation details
- heavy knowledge base rollout in phase 1
- final search ranking strategy

## Current Gap

The current schema only mirrors three business-facing datasets:

- `briefs`
- `news_items`
- `bookmarks`

That is enough for manual CRUD, but not enough for a durable content pipeline because:

- raw source data is not preserved
- ingestion and AI processing status are not first-class
- tags are stored as arrays instead of a reusable taxonomy
- `news_items.brief_id` couples ingestion with editorial grouping too early
- bookmarks are not user-scoped yet
- search and knowledge-base expansion have no stable anchor tables

## Recommended Design Principles

1. Separate source capture, AI processing, and editorial publishing.
2. Use internal `uuid` primary keys for database stability.
3. Keep user-facing IDs or slugs as separate unique fields.
4. Avoid storing many-to-many relationships in arrays if they may evolve.
5. Keep raw content forever unless there is a compliance reason to delete it.
6. Allow content to exist before it is assigned to a brief.
7. Keep search and embeddings as attachable layers, not as the core model.

## Recommended Core Tables

### 1. `sources`

Purpose: define where content comes from and how trustworthy or reusable the source is.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Internal source ID |
| `code` | `text` unique | Stable short code such as `openai_blog` |
| `name` | `text` | Display name |
| `base_url` | `text` | Site root |
| `source_type` | `text` | Example: `official`, `media`, `newsletter`, `social`, `research`, `job_board` |
| `language` | `text` | Default language |
| `country` | `text` nullable | Optional region marker |
| `default_trust_score` | `numeric(3,2)` nullable | Optional heuristic input |
| `is_active` | `boolean` | Whether ingestion should keep using it |
| `notes` | `text` nullable | Manual editorial notes |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### 2. `raw_ingestions`

Purpose: store fetched raw records before cleaning, deduping, or editorial decisions.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Internal ingestion ID |
| `source_id` | `uuid` FK -> `sources.id` | Source site |
| `external_id` | `text` nullable | Source-side ID if present |
| `canonical_url` | `text` | Normalized source URL |
| `url_hash` | `text` | For fast exact dedup |
| `title_raw` | `text` nullable | Raw title |
| `author_raw` | `text` nullable | Raw author/byline |
| `published_at_raw` | `text` nullable | Unparsed raw value |
| `published_at` | `timestamptz` nullable | Parsed timestamp |
| `language` | `text` nullable | Detected language |
| `content_raw` | `text` | Raw extracted content |
| `content_markdown` | `text` nullable | Optional normalized text body |
| `content_hash` | `text` | For near-duplicate candidate generation |
| `fetch_status` | `text` | Example: `fetched`, `parse_failed`, `empty`, `blocked` |
| `fetched_at` | `timestamptz` | |
| `meta` | `jsonb` default `'{}'::jsonb` | Headers, parser stats, source payload |
| `created_at` | `timestamptz` | |

Notes:

- `raw_ingestions` is append-oriented.
- Do not overwrite historical raw payloads unless the row is clearly a retry of the same fetch job.

### 3. `news_items`

Purpose: store normalized, editorially useful news records after processing.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Internal canonical news ID |
| `public_id` | `text` unique | URL-safe external ID such as `news-20260505-openai-enterprise` |
| `raw_ingestion_id` | `uuid` FK -> `raw_ingestions.id` | Primary origin row |
| `source_id` | `uuid` FK -> `sources.id` | Source copied for easier querying |
| `title` | `text` | Standardized title |
| `source_name_snapshot` | `text` | Denormalized read helper |
| `source_url` | `text` | Canonical source URL |
| `published_at` | `timestamptz` | Parsed publication time |
| `category` | `text` | Controlled enum/check |
| `importance` | `text` | Controlled enum/check |
| `what_happened` | `text` | Factual summary |
| `why_important` | `text` | User value explanation |
| `relevance_to_business_students` | `text` | Audience relevance |
| `interview_or_case_use` | `text` | Reuse angle |
| `next_action` | `text` | Concrete action |
| `status` | `text` | Example: `draft`, `ready`, `needs_review`, `published`, `rejected`, `duplicate` |
| `review_status` | `text` | Example: `pending`, `approved`, `rejected` |
| `duplicate_of_news_item_id` | `uuid` nullable FK -> `news_items.id` | If dedup marked this as non-canonical |
| `editorial_score` | `numeric(5,2)` nullable | Optional ranking helper |
| `ai_summary_version` | `text` nullable | Pipeline version tag |
| `structured_payload` | `jsonb` default `'{}'::jsonb` | Optional trace for extracted fields |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `reviewed_at` | `timestamptz` nullable | |
| `published_at_in_product` | `timestamptz` nullable | When surfaced to users |

Important decision:

- `brief_id` should not live directly on `news_items` as a required field.
- One news item should be able to exist before any brief is created.

### 4. `briefs`

Purpose: editorial issue/edition aggregation.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | Internal brief ID |
| `public_id` | `text` unique | Example: `vol-12` |
| `title` | `text` | |
| `brief_date` | `date` | Primary issue date |
| `intro` | `text` | |
| `core_trend` | `text` nullable | |
| `student_insight` | `text` nullable | |
| `content_ideas` | `text` nullable | |
| `resume_portfolio_note` | `text` nullable | |
| `status` | `text` | Example: `draft`, `published`, `archived` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `published_at` | `timestamptz` nullable | |

Important decision:

- Remove `news_item_ids text[]`.
- Use a join table so sorting, pinning, and future reuse stay flexible.

### 5. `brief_items`

Purpose: connect briefs and news items in ordered editorial sequences.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `brief_id` | `uuid` FK -> `briefs.id` | |
| `news_item_id` | `uuid` FK -> `news_items.id` | |
| `position` | `integer` | Ordering inside brief |
| `section` | `text` nullable | Optional future grouping |
| `is_featured` | `boolean` default `false` | Optional emphasis |
| `created_at` | `timestamptz` | |

Primary key recommendation:

- composite PK on `brief_id, news_item_id`

### 6. `bookmarks`

Purpose: user saves and future library grouping.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `user_id` | `uuid` | Supabase auth user ID |
| `news_item_id` | `uuid` FK -> `news_items.id` | |
| `bucket` | `text` | Controlled enum: `interview`, `case`, `content`, `research` |
| `notes` | `text` nullable | Optional future personal note |
| `created_at` | `timestamptz` | |

Unique constraint recommendation:

- unique on `user_id, news_item_id, bucket`

Important decision:

- remove `saved_type` array from `news_items`
- derive saved buckets from bookmarks instead of duplicating them

### 7. `tags`

Purpose: canonical tag dictionary.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `slug` | `text` unique | Stable machine key |
| `label` | `text` | Human-readable display |
| `tag_type` | `text` | Example: `topic`, `industry`, `company`, `skill`, `use_case` |
| `description` | `text` nullable | |
| `parent_tag_id` | `uuid` nullable FK -> `tags.id` | For lightweight hierarchy |
| `is_active` | `boolean` | |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### 8. `news_tags`

Purpose: many-to-many relation between news and tags.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `news_item_id` | `uuid` FK -> `news_items.id` | |
| `tag_id` | `uuid` FK -> `tags.id` | |
| `confidence` | `numeric(3,2)` nullable | Optional AI confidence |
| `source` | `text` | Example: `ai`, `editor`, `rule` |
| `created_at` | `timestamptz` | |

Primary key recommendation:

- composite PK on `news_item_id, tag_id`

### 9. `processing_logs`

Purpose: track AI processing lifecycle, failures, retries, and pipeline traceability.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `raw_ingestion_id` | `uuid` nullable FK -> `raw_ingestions.id` | |
| `news_item_id` | `uuid` nullable FK -> `news_items.id` | |
| `job_type` | `text` | Example: `precheck`, `screening`, `dedup`, `extract`, `tagging`, `review_queue` |
| `job_status` | `text` | Example: `queued`, `running`, `succeeded`, `failed`, `retrying`, `cancelled` |
| `attempt_no` | `integer` | |
| `model_name` | `text` nullable | AI model if used |
| `input_payload` | `jsonb` default `'{}'::jsonb` | |
| `output_payload` | `jsonb` default `'{}'::jsonb` | |
| `error_message` | `text` nullable | |
| `started_at` | `timestamptz` nullable | |
| `finished_at` | `timestamptz` nullable | |
| `created_at` | `timestamptz` | |

## Reserved Tables For Later

These should be designed now but built lightly.

### `knowledge_chunks`

Purpose: split approved news or briefs into searchable text chunks.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `entity_type` | `text` | Example: `news_item`, `brief` |
| `entity_id` | `uuid` | ID of source record |
| `chunk_index` | `integer` | |
| `content` | `text` | Chunk text |
| `token_count` | `integer` nullable | |
| `metadata` | `jsonb` | tags, date, category, source |
| `created_at` | `timestamptz` | |

### `embeddings`

Purpose: store vector embeddings without forcing vector search into every table.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `chunk_id` | `uuid` FK -> `knowledge_chunks.id` | |
| `model_name` | `text` | |
| `embedding` | `vector` | pgvector column |
| `dimensions` | `integer` | |
| `created_at` | `timestamptz` | |

### `search_index`

Purpose: unified search surface without coupling search logic to raw business tables.

Recommended fields:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` PK | |
| `entity_type` | `text` | Example: `news_item`, `brief`, `chunk` |
| `entity_id` | `uuid` | |
| `title` | `text` nullable | |
| `body` | `text` | |
| `tsv` | `tsvector` | Full-text search index |
| `metadata` | `jsonb` | category, tags, published date |
| `updated_at` | `timestamptz` | |

## Relationship Summary

Recommended relational shape:

- `sources 1 -> many raw_ingestions`
- `sources 1 -> many news_items`
- `raw_ingestions 1 -> 0..1 primary news_items`
- `briefs many <-> many news_items` via `brief_items`
- `news_items many <-> many tags` via `news_tags`
- `users 1 -> many bookmarks`
- `raw_ingestions/news_items 1 -> many processing_logs`
- `news_items/briefs 1 -> many knowledge_chunks`
- `knowledge_chunks 1 -> many embeddings` only if you later support multiple embedding models

## Recommended Status Model

### `raw_ingestions.fetch_status`

Allowed values:

- `fetched`
- `parse_failed`
- `empty`
- `blocked`
- `skipped`

### `news_items.status`

Allowed values:

- `draft`
- `ready`
- `needs_review`
- `published`
- `rejected`
- `duplicate`

### `news_items.review_status`

Allowed values:

- `pending`
- `approved`
- `rejected`

### `processing_logs.job_status`

Allowed values:

- `queued`
- `running`
- `succeeded`
- `failed`
- `retrying`
- `cancelled`

## Recommended Ingestion Flow

1. Insert source definition into `sources` if it does not already exist.
2. Store fetched payload in `raw_ingestions`.
3. Run cheap rule-based precheck on the raw row.
4. Write every major AI or rule step into `processing_logs`.
5. If content passes screening, create or update a canonical `news_items` row.
6. If AI creates tags, map them through canonical `tags` and persist into `news_tags`.
7. If the record is duplicate, mark `news_items.status = 'duplicate'` and set `duplicate_of_news_item_id`.
8. Only after editorial approval should the item be attached to a `brief` through `brief_items`.
9. Only approved content should later be chunked into `knowledge_chunks`.
10. Only chunked content should later receive embeddings.

## Search And Knowledge Base Reserve Strategy

Phase 1 should not build a heavy RAG system.

Phase 1 reserve recommendations:

- keep `raw_ingestions.content_raw`
- keep `news_items.structured_payload`
- normalize tags now
- leave room for `knowledge_chunks`
- leave room for `search_index`

Phase 1 search recommendation:

- start with Postgres full-text search on `news_items` and later `briefs`
- add `tsvector` or a separate `search_index` only when search UX actually needs it

Phase 2 knowledge recommendation:

- chunk only approved `news_items` and published `briefs`
- generate embeddings asynchronously
- do not couple embeddings directly to `news_items`

## What Should Change Compared To The Current Schema

High-confidence changes:

- add `sources`
- add `raw_ingestions`
- add `processing_logs`
- add `tags`
- add `news_tags`
- add `brief_items`
- move bookmarks to `user_id + news_item_id + bucket`
- make brief assignment optional at the `news_items` layer

Recommended removals from core shape:

- remove `briefs.news_item_ids`
- remove `news_items.tags`
- remove `news_items.saved_type`
- stop requiring `news_items.brief_id` at insert time

Fields that can stay conceptually:

- `briefs.intro`
- `briefs.core_trend`
- `briefs.student_insight`
- `briefs.content_ideas`
- `briefs.resume_portfolio_note`
- all current business-facing explanatory fields on `news_items`

## Rollout Recommendation

### Phase A: stabilize schema

Do now:

- finalize core tables and constraints
- decide enum values
- decide `uuid` vs external public ID format
- add editorial status fields

### Phase B: migrate current app data

Do next:

- migrate existing `briefs`, `news_items`, `bookmarks`
- preserve current route-compatible external IDs using `public_id`
- backfill `brief_items`, `news_tags`, and userless or placeholder bookmarks if needed

### Phase C: add pipeline tables

Do after migration:

- start writing new ingestions into `raw_ingestions`
- write processing steps into `processing_logs`
- let new `news_items` be created without a brief

### Phase D: add search reserve

Do later:

- add `knowledge_chunks`
- add `embeddings`
- add `search_index` or `tsvector` search

## Decision Recommendation For This Thread

If this thread aims to lock the backend structure early, the best stable decision set is:

1. Canonical content object is `news_items`, not raw ingestion rows.
2. Raw fetched payload must always land in `raw_ingestions`.
3. `briefs` is an editorial grouping layer, not a required parent of `news_items`.
4. Tags and bookmarks should be normalized now instead of staying in arrays.
5. Search and embeddings should be reserved as separate attachable layers.
6. Every AI processing step should be traceable in `processing_logs`.

## Suggested Next Artifact

The most useful next artifact after this doc is a concrete Postgres migration draft that translates this design into:

- `create table`
- `check constraint`
- `index`
- `updated_at` trigger
- initial backfill strategy from current `briefs/news_items/bookmarks`
