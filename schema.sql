-- State Combat Analytics — Supabase schema
--
-- Run this once in your Supabase project's SQL Editor (Project -> SQL
-- Editor -> New query -> paste -> Run) before filling in SUPABASE_CONFIG
-- in data.js. See README.md -> "Going multi-user" for the full walkthrough.
--
-- This is a single key/value table, not a fully relational schema — every
-- Store.x value (members, schedule, feedback, bag submissions, etc.) is
-- stored as one JSON row keyed by its localStorage-era name (e.g.
-- "wos_members"). That matches how the app already reads/writes its data
-- internally, so the JS-side Store object could stay almost identical
-- instead of needing a full rewrite. The tradeoff: two admins editing the
-- exact same list at the exact same instant will have one overwrite the
-- other (last write wins per key) rather than merging row-by-row. Fine for
-- occasional admin edits; if you outgrow that, split a given key into its
-- own real table later.

create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security is on by default for new Supabase tables once you
-- enable it below. This app doesn't use Supabase Auth — its own PIN check
-- runs entirely in the browser (see README.md -> "Sign-in" for the
-- tradeoffs of that) — so these policies allow anyone holding your
-- project's anon key (i.e. anyone with your site's URL, since the anon
-- key ships in the page source) to read and write. That's the same trust
-- model the app already has client-side; this just makes the data shared
-- instead of per-browser. If you need real access control, put this
-- behind Supabase Auth and scope these policies to authenticated users —
-- a bigger change than this file covers.
alter table app_state enable row level security;

create policy "app_state anyone can read" on app_state
  for select using (true);

create policy "app_state anyone can insert" on app_state
  for insert with check (true);

create policy "app_state anyone can update" on app_state
  for update using (true);

-- Turns on realtime change notifications for this table (Database ->
-- Replication -> supabase_realtime in the dashboard does the same thing
-- with a toggle, if you prefer the UI). Without this, writes still save
-- fine, but other open browser tabs won't see them until they reload.
alter publication supabase_realtime add table app_state;

-- ---------------------------------------------------------------------------
-- SVS Screenshot/Proof storage — run this section once, ALSO before your
-- Scan buttons/Proof uploads are used, in the same SQL Editor as above.
-- Completely separate from app_state and from the item-image reference
-- library (item-images.js): this is a Storage bucket for PLAYER-uploaded
-- evidence screenshots (uploadSvsProofScreenshot in data.js), never the
-- reference images that ship with the app.
--
-- The bucket is created PRIVATE (public = false) — no public URL exists for
-- any file in it; viewing a proof image requires a short-lived signed URL
-- (see svsProofSignedUrl in data.js), which only this app's own code
-- generates. "Private" here means "not publicly browsable by URL", not
-- full per-user access control — this app has no Supabase Auth (see the
-- comment on app_state above), so, same trust model as everywhere else in
-- this schema, anyone holding your project's anon key can still request a
-- signed URL for any path. If you need real per-user access control, put
-- this behind Supabase Auth — a bigger change than this file covers.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('svs-submission-screenshots', 'svs-submission-screenshots', false)
on conflict (id) do nothing;

create policy "svs proof screenshots anyone can upload" on storage.objects
  for insert with check (bucket_id = 'svs-submission-screenshots');

create policy "svs proof screenshots anyone can read" on storage.objects
  for select using (bucket_id = 'svs-submission-screenshots');

create policy "svs proof screenshots anyone can delete" on storage.objects
  for delete using (bucket_id = 'svs-submission-screenshots');
