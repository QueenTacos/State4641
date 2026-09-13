# State 4641 — Supabase backend setup

This document is the complete backend reference for the **State 4641** clone: the
full database schema, every RLS policy, and everything else you asked to review
before wiring this app up to a brand-new Supabase project.

**Read this first, because it will save you time**: this app's real backend
architecture is much simpler than the request template usually implies. It is a
static, no-build vanilla JS/HTML/CSS site (no Next.js, no server, no API routes).
The "database" is **one Postgres table** (`app_state`) holding a JSON blob per
data category. There are no other tables, no foreign keys, no enums, views,
functions, triggers, stored procedures, RPCs, storage buckets, Edge Functions,
or Supabase Auth usage anywhere in this app — so rather than inventing those to
match the shape of your request, this doc says plainly, category by category,
"not used by this app" wherever that's the honest answer. Everything that *is*
used is documented in full below, with runnable SQL.

This exact design is already how the live State 3929 site's backend works —
nothing about the backend architecture changed for this clone, only the branding
(`stateNumber: "4641"`) and the fact that this copy's Supabase credentials are
blank, pointing at nothing, so you can wire it up to your own new project.

---

## 1. Why one table, not a relational schema

Every piece of app data (`Store.members`, `Store.schedule`, `Store.bagSubmissions`,
`Store.svsSignups`, etc. in `data.js`) is stored as one row in `app_state`, keyed
by the same string key the app already used for `localStorage` (e.g.
`"wos_members"`), with the actual data as a `jsonb` value. The JS-side `Store`
object transparently swaps between reading/writing `localStorage` (default,
zero setup, per-browser) and reading/writing this Supabase table (once you fill
in `SUPABASE_CONFIG` in `data.js`) — the rest of the app (`app.js`) never knows
or cares which one is active.

Trade-off, stated plainly: this is "last write wins" per key, not per-row —
two admins editing the member list at the exact same instant will have one
overwrite the other, not merge. That's fine for occasional admin edits from a
handful of people, which is this app's actual usage pattern. If you ever outgrow
that, a given key (e.g. `wos_bag_submissions`) can be split into its own real
relational table later without touching anything else — but that is **not**
part of this clone, since you asked to keep functionality identical.

### The logical "tables" (all stored as rows in the one `app_state` table)

| `key` (row's primary key) | What it holds |
|---|---|
| `wos_state` | State config: state number, enemy state, SvS date, furnace/troop-building caps |
| `wos_members` | Member roster: name, gamer ID, alliance, role, PIN, preferred language |
| `wos_schedule` | The SvS time-slot schedule grid, per day |
| `wos_schedule_published` | Which days' schedules are published/visible to members |
| `wos_feedback` | Feedback board posts, votes, status |
| `wos_alliances` | Alliance tag list |
| `wos_furnace_fc` | Furnace/FC level options (admin-managed) |
| `wos_alliance_colors` | Per-alliance color overrides |
| `wos_bag_submissions` | Every member's submitted "bag" (backpack) form |
| `wos_bag_drafts` | In-progress (unsubmitted) bag drafts, autosaved |
| `wos_championship` | Alliance Championship lane plans, one entry per alliance tag |
| `wos_svs_signups` | SVS Battle Sign Up submissions, one entry per player ID |
| `wos_svs_signups_open` | Whether SVS Battle Sign Up is currently accepting submissions |

`Store.currentUser` (who's signed into *this specific browser*) is deliberately
**never** synced to Supabase — it's inherently per-device session state, not
shared data, so it always stays in `localStorage` only, with or without Supabase
configured.

---

## 2. Complete schema — SQL migration script

This is the entire database schema. Run it once, in full, in your **brand-new**
State 4641 Supabase project. It is also saved as a proper migration file at
`supabase/migrations/0001_init.sql` in this project if you're using the
Supabase CLI (`supabase db push`) instead of the dashboard's SQL Editor.

```sql
-- ============================================================================
-- State 4641 — Supabase schema (complete)
-- Run once in a brand-new, empty Supabase project's SQL Editor:
-- Project -> SQL Editor -> New query -> paste this whole file -> Run.
-- ============================================================================

-- --- Table -------------------------------------------------------------
-- One row per data category (see the key/value table in SUPABASE_SETUP.md).
-- Primary key: `key` (text). No foreign keys — there is only this one table,
-- so there is nothing for a foreign key to reference. No enums, views,
-- functions, triggers, or stored procedures exist in this schema; none are
-- used by the app.
create table if not exists app_state (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- --- Index ---------------------------------------------------------------
-- The primary key on `key` already creates a unique B-tree index covering
-- every read/write this app performs (always a single-key lookup or a
-- "select all rows" on load) — no additional indexes are needed or used.
-- (Documented explicitly since "indexes" was on the requirements list —
-- this IS the complete answer, not an omission.)

-- --- Row Level Security ---------------------------------------------------
-- This app does not use Supabase Auth (see section 4 below) — its PIN-based
-- sign-in runs entirely client-side. These policies match that existing
-- trust model: anyone holding the project's anon key (i.e. anyone with your
-- site's URL, since the anon key ships in the page source) can read and
-- write. That is the SAME trust model the app already has today — this
-- just makes the data shared across visitors instead of stuck per-browser.
alter table app_state enable row level security;

create policy "app_state anyone can read" on app_state
  for select using (true);

create policy "app_state anyone can insert" on app_state
  for insert with check (true);

create policy "app_state anyone can update" on app_state
  for update using (true);

-- No delete policy exists because the app never deletes app_state rows —
-- every "clear"/"delete" action (Clear Bags, delete a member, delete an SVS
-- signup, etc.) is implemented as an UPDATE that overwrites a row's `value`
-- with a smaller/emptied JSON object, never a SQL DELETE on app_state itself.

-- --- Realtime --------------------------------------------------------------
-- Lets every open browser tab see another admin's changes live, without a
-- manual reload. Equivalent to toggling Database -> Replication ->
-- supabase_realtime for this table in the dashboard UI.
alter publication supabase_realtime add table app_state;
```

---

## 3. Requirement-by-requirement checklist

You asked for a specific list of backend concerns to be covered. Here is each
one, answered directly:

- **Complete database schema / table definitions / columns / data types** —
  one table, three columns: `key text`, `value jsonb`, `updated_at timestamptz`.
  Given in full above.
- **Primary keys** — `key` (text) is the primary key of `app_state`.
- **Foreign keys / relationships** — none. There is only one table; nothing
  else exists for it to relate to.
- **Default values** — `updated_at` defaults to `now()`. No other columns have
  defaults (the app always supplies `key` and `value` explicitly on write).
- **Constraints** — `key` is `primary key` (implies `not null` + unique);
  `value` is `not null`. No `check` constraints are used — the shape of each
  row's JSON is enforced entirely client-side by `app.js`/`data.js`, not by
  Postgres, matching the app's existing (non-relational) design.
- **Indexes** — the primary key index on `key` is the only one, and it's the
  only one this app's query pattern ever needs (see the SQL comment above).
- **Unique constraints** — `key`'s primary key already enforces uniqueness.
- **Enums** — none exist. Fields that read like enums in the UI (member role,
  SVS participation choice, furnace level, etc.) are plain strings validated
  in JavaScript (`validateSvsSignupForm`, etc.), not Postgres enum types.
- **Views** — none.
- **Database functions / triggers / stored procedures / RPC functions** —
  none. Every read/write goes through Supabase's standard auto-generated
  REST API (`supabase-js`'s `.from("app_state")...`), called directly from
  `data.js` — there is no custom SQL logic anywhere in the backend.
- **Row Level Security policies** — three policies (read/insert/update), given
  in full above, with the trust-model rationale explained inline.
- **Authentication-related setup** — none. Supabase Auth is not used; this app
  ships its own PIN-based sign-in that runs entirely in the browser and is
  unrelated to Supabase. See `README.md` → "Sign-in" for that design and its
  trade-offs (it is unchanged from State 3929, per your "keep functionality
  identical" instruction).
- **Storage buckets and storage policies** — none. No file/image upload ever
  reaches Supabase Storage — the Alliance Championship screenshot tool
  (Tesseract.js OCR) and all card artwork run/live entirely client-side
  (`card-art.js` ships the artwork inline as the app's own asset, not
  user-uploaded).
- **Realtime configuration** — one line, given above (`alter publication
  supabase_realtime add table app_state`), so all connected browsers see
  changes live.
- **Edge Functions** — none.
- **Seed/default configuration data required for the app to function** — none
  is required in Supabase itself. On first connection, if the `app_state`
  table is empty, the app detects the missing keys and pushes its own
  in-code seed defaults (`SUPABASE_SYNCED_DEFAULTS` in `data.js` — the same
  roster/alliance/feedback placeholders described below) up to Supabase
  automatically. You do not need to manually insert any rows.

---

## 4. Setting up your brand-new State 4641 Supabase project

1. Go to [supabase.com](https://supabase.com) and create a **new, separate**
   project (do not reuse or fork the State 3929 project). Any name/region/
   database password is fine — you won't need the database password for any
   step below.
2. Once it finishes provisioning, open **SQL Editor** → **New query**, paste
   in the full script from section 2 above (or the contents of
   `supabase/migrations/0001_init.sql`), and **Run**. This creates the table,
   turns on RLS with the three policies, and enables realtime.
3. Open **Project Settings → API**. Copy the **Project URL** and the
   **`anon` `public`** key (never the `service_role` key — that one must
   never ship in a public site, and this app never asks for it).
4. Paste those two values into `SUPABASE_CONFIG` in `data.js` — see the
   comment already sitting there:
   ```js
   const SUPABASE_CONFIG = {
     url: "https://xxxxxxxxxxxx.supabase.co",   // YOUR new State 4641 project's URL
     anonKey: "eyJhbGciOi...",                    // YOUR new State 4641 project's anon public key
   };
   ```
   Leaving both blank (the shipped default in this clone) is also completely
   valid — the app runs exactly as it always has, `localStorage`-only, zero
   backend required.
5. Reload the site and check the browser console for errors; the Network tab
   should show requests to *your* `*.supabase.co` domain. Open the site in two
   browsers/windows, sign in as admin in both, and confirm a change in one
   (e.g. adding an alliance) appears in the other within a second or two.

Full narrative walkthrough, including the "Force Sync to Supabase" admin
button and known limits (free-tier project pausing after inactivity, etc.),
is already in `README.md` → "Going multi-user" — unchanged from State 3929,
since none of that behavior changed for this clone.

---

## 5. Environment variables for Vercel

Here's the direct answer, stated plainly, because it's different from what the
`NEXT_PUBLIC_...` example implied: **this app has no build step and no
framework, so it does not read `process.env` at all** — it's plain static
HTML/CSS/JS files served as-is. There is nothing for Vercel's environment
variables UI to inject into, because nothing in this codebase runs `npm run
build` or any server-side code.

The two values that would normally be environment variables are instead the
two `SUPABASE_CONFIG` fields you already pasted directly into `data.js` in
step 4 above:

| "Environment variable" | Where it actually goes in this app | Value source |
|---|---|---|
| `SUPABASE_URL` | `SUPABASE_CONFIG.url` in `data.js` | Your **new** State 4641 project → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | `SUPABASE_CONFIG.anonKey` in `data.js` | Your **new** State 4641 project → Project Settings → API → anon public key |

This is not a security downgrade from putting them in Vercel env vars — the
anon key is *meant* to be public (it ships to every visitor's browser either
way, and access is gated by the Row Level Security policies in section 2, not
by secrecy). This matches exactly how the State 3929 site already works.

**Deploying to Vercel**: Framework preset **"Other"**, leave the build command
blank, set the output directory to the project root (`.`). Vercel serves the
files as static assets with nothing to configure — no environment variables
needed there at all. Full steps are in `README.md` → "Deploy to Vercel".

**If you'd specifically prefer real Vercel environment variables anyway**
(e.g. so `SUPABASE_CONFIG` never has to be committed to your GitHub repo at
all), that's a small, optional, additive change — Vercel does support a build
command, so a one-line `sed`/Node script could inject `$SUPABASE_URL`/
`$SUPABASE_ANON_KEY` into `data.js` at deploy time — but that changes the
project's build workflow from "no build step" to "has a build step," which
your instructions said not to do. It's not included here for that reason; say
the word if you'd like it added as an explicit opt-in on top of this clone.
