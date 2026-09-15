-- ============================================================================
-- State 4641 — Supabase schema (complete)
--
-- Run once in a brand-new, empty Supabase project:
--   - Dashboard: SQL Editor -> New query -> paste this whole file -> Run
--   - CLI:       supabase db push   (with this file in supabase/migrations/)
--
-- See ../../SUPABASE_SETUP.md in this project for the full walkthrough,
-- including why this app uses a single key/value table rather than a fully
-- relational schema, and a requirement-by-requirement checklist confirming
-- what does and doesn't apply (no auth, storage, edge functions, triggers,
-- views, or stored procedures are used by this app).
-- ============================================================================

-- --- Table -------------------------------------------------------------
-- One row per data category (members, schedule, bag submissions, SVS
-- signups, etc. — see the key/value table in SUPABASE_SETUP.md section 1).
-- Primary key: `key` (text). No foreign keys — there is only this one
-- table. No enums, views, functions, triggers, or stored procedures exist
-- in this schema; none are used by the app.
create table if not exists app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- --- Index ---------------------------------------------------------------
-- The primary key on `key` already creates a unique B-tree index covering
-- every read/write this app performs (always a single-key lookup or a
-- "select all rows" on load) — no additional indexes are needed.

-- --- Row Level Security ---------------------------------------------------
-- This app does not use Supabase Auth — its PIN-based sign-in runs
-- entirely client-side. These policies match that existing trust model:
-- anyone holding the project's anon key (i.e. anyone with the site's URL)
-- can read and write. Same trust model the app already has today; this
-- just makes the data shared across visitors instead of per-browser.
alter table app_state enable row level security;

create policy "app_state anyone can read" on app_state
  for select using (true);

create policy "app_state anyone can insert" on app_state
  for insert with check (true);

create policy "app_state anyone can update" on app_state
  for update using (true);

-- No delete policy: the app never issues a SQL DELETE against app_state.
-- Every "clear"/"delete" action (Clear Bags, delete a member, delete an SVS
-- signup, etc.) is an UPDATE that overwrites a row's `value` with a
-- smaller/emptied JSON object.

-- --- Realtime --------------------------------------------------------------
-- Lets every open browser tab see another admin's changes live, without a
-- manual reload.
alter publication supabase_realtime add table app_state;
