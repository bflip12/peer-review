# Tasks

Read this at the start of every session. Work one task at a time. Delete a task when it is
done. Big decisions get an ADR in `docs/adr/`; rule changes get a line in
`docs/changelog.md`.

A milestone is a group of tasks that ships one usable slice of the app. Milestones run in
order.

## Decisions waiting on Bobby

- **Design direction.** Collect 3 to 5 reference screenshots of sites, apps, or record
  sleeves. Then install the frontend-design plugin and use them with it.
- **GeoNames download.** Before Milestone 2, allow `download.geonames.org` in the cloud
  environment's network settings.

Decided: the name is Peer Review and the domain is `peerreview.club`.

## Milestone 0: Setup

1. Scaffold Next.js and TypeScript with a `src/` folder. Prettier settings from code-style
   section 1, ESLint with a `max-lines` limit, Vitest with React Testing Library, and
   Playwright. Record every command in `CLAUDE.md`.
2. Add a `PostToolUse` hook on `Edit|Write` that runs Prettier and ESLint fix on the edited
   file. Add a permissions allowlist to `.claude/settings.json` for routine commands.
3. Add a screenshot script that captures a page at 375px and 1280px.
4. Add CI on GitHub Actions: typecheck, lint, test, build.
5. Create the Supabase project and local dev setup, a migrations folder, a way to test RLS
   policies, and `.claude/rules/supabase.md`. Confirm Supabase runs Postgres 15 or later
   (`NULLS NOT DISTINCT`), re-run the checks listed in `docs/DATA_MODEL.md` there, check
   that generated types turn enums into unions, check Supabase Auth's sign-up rate limits
   per IP (ADR 0011), and pick the `short_id` length and alphabet. Also check, all
   unverified so far: the built-in email sender's limits (believed to be a low hourly cap
   and, on newer projects, team members' addresses only), and which backups the free tier
   keeps and whether they can be downloaded.
   `.claude/rules/supabase.md` includes the function security rules:
   - Internal helper functions live in a schema the API does not expose.
   - Functions the app calls are `security invoker` unless they must bypass RLS.
   - A `security definer` function sets `search_path = ''`, checks `auth.uid()` and the
     caller's role itself, and has `EXECUTE` revoked from `PUBLIC` and `anon` (Postgres
     grants `EXECUTE` to `PUBLIC` by default, and Supabase serves every function in
     `public` over its API).
   - Each exposed function has a test that calls it as `anon` and as a plain user.
6. Deploy before any feature: Vercel production on `peerreview.club` and preview deploys
   per PR, a hosted Supabase project, and migrations applied by CI, never by hand. Auth
   redirects, cookies, OAuth callbacks, and link previews are then tested on the real
   domain from Milestone 1.
7. Write an ADR on styling and data fetching. `docs/code-style.md` sections 8 to 10 assume
   styled-components, client-side React Query (in its pre-v5 API), Sentry, and atoms, none
   of which are in the stack, and styled-components needs client components in the App
   Router. Proposal to weigh: CSS Modules with the token file, server components read,
   server actions write, and no client data library until a screen needs one. Then rewrite
   code-style sections 8 to 10 and checklist item 9 to match, with where state lives, the
   Next.js default-export exception for route files, and the error and loading
   conventions. Rules for new dependencies and for committed versus generated files are
   written when the first case comes up (Supabase generated types, task 5).
8. Create the token file and `docs/style-guide.md` with the first styled component (the app
   shell).

## Milestone 1: Accounts

Sign-in with magic link and Google, handle and display name setup, the sign-in privacy
note, RLS tests proving email is never exposed, account deletion. Custom SMTP for magic
links on `peerreview.club` with SPF and DKIM, on a free tier (for example Resend or
Postmark), with an ADR (new service). The handle and display name fields start empty;
nothing is copied from the Google profile. The privacy page, since Google's consent screen
asks for a privacy policy link (unverified for basic scopes). Column write tests for
`profiles`: a user cannot change their own `role` or `account_status`
(`docs/DATA_MODEL.md` "Column writes"). Every later milestone that adds a table adds its
column write tests the same way.

## Milestone 2: Venues, DJs, collectives

Cities seed from the GeoNames cities export, with autocomplete. Pick the file (cities1000
is the current lean), leave out district entries, and add `city_names` with English and
local names so "Cologne" and "Köln" both match. A credit line with a link to geonames.org
on the privacy page (required by the GeoNames CC BY 4.0 license). Sound systems seed.
Venues with name, city, links, and sound tags. DJs and collectives. Search-first creation
with fuzzy duplicate suggestions. Links in a `links` table, validated by domain per
platform. DJ names containing "b2b" are refused. An optional home city on DJs, required
when a new DJ's name matches one with no city, shown in DJ search and on the DJ page, with
the unique index on name and city (ADR 0011). Daily caps per user on new venues, DJs, and
collectives, by a trigger on `creations` (ADR 0011). The creator edits their entry until
another user picks it (ADR 0009), with `used_by_others_at` set by a trigger and the
creator read from `creations` (ADR 0010). Every edit writes a `catalog_edits` row from
the first one (ADR 0009), so history and "Revert" in Milestone 6 have data to show.

## Milestone 3: Events and logs

Events with a venue, one or more co-host collectives, or both (ADR 0008, ADR 0010), with
the venue and collective unnamed-night rules enforced by unique indexes. The night picker: date first,
one search across venues, collectives, event names, and lineups, "Nights" and "Start a new
night" groups, nights one day either side, the optional name field with the poster copy
(ADR 0016), a second night at the same place and date showing the existing night with
"Join" before a required name, and the past-midnight line. Events created only when a log is saved, with
the concurrent-save case joining instead of failing, and counting toward the daily event cap
(ADR 0011). Lineup slots with one or more artists,
b2b detection in DJ search, "b2b with" and slot removal by the user who added it until
someone else picks it, with removal setting `removed_at` (ADR 0013). Log form with the
overall rating, review, and privacy first, and a collapsed section for sound, venue, and
"Which sets did you listen to?". At most 3 logs per user per date, enforced by a trigger.
"Change night" on a log, carrying everything over. Users fill in an empty venue or name
and add collectives, refused on a clash or a venue in another city, with "Report as the
same night". The name's setter changes or clears it until `name_locked_at`, set by a
trigger when another user logs the night or marks Going on it. Deletion of events left with no logs
and no Going markers, with a redirect when a move caused it. The log form accepts only
events dated today or earlier.
The private original copy of each log in `log_snapshots` (ADR 0015): written on the
owner's first save and replaced on each of their saves and "Change night", never by other
users' edits, lineup corrections, or hides, with RLS tests that no one but the owner reads
it, admins included.

## Milestone 4: Pages

Log, event, venue, DJ, collective, profile with stats, search by name. Venue, DJ, and
collective pages list only events with at least one public log. No averages (ADR 0014).
"Most listened to DJs" counts picked sets.
The private "Original logs" page on the owner's profile, with the explanation from SPEC
section 4, "Changed since you saved it" per row, and "View original" in the owner's log
menu (ADR 0015).

## Milestone 5: Social

Follow, feed, likes, comments.

## Milestone 6: Moderation

Roles (ADR 0009, ADR 0010, ADR 0012, ADR 0014): `user`, `moderator`, and `admin` on the
profile, with `moderator` shown as "Local" and cities in `moderator_cities`, shown as
"Berlin local" but not enforced. Report button, including lineup slots with "Didn't play".
"Duplicate" reports require the entry it duplicates and a description, with help text per
type, shown to the admin with links to both entries. "Not a duplicate" closes one; real
duplicates stay open until merges ship (ADR 0014). A catalog report queue for locals
(reporters not shown) and a queue for "Duplicate" reports and reports on logs, comments,
and users for admins. Locals and admins edit venues, DJs, collectives, and set event
fields, with a history list and "Revert" per entry. Lineup corrections by locals (ADR
0013): remove a slot, remove one DJ from a b2b slot, or switch to a same-name DJ, each in
the event's history with "Revert", and reverts refused when they would duplicate a slot.
"Didn't play" reports with an optional "Who played instead?". Hidden DJs left out of
lineups and stats. Admins hide content, ban users, and assign roles.

## Milestone 7: Going

"Going" on events dated today or later, using the night picker from Milestone 3. No limit
on markers per date. Private "Upcoming" list on the user's own profile. Morning-after
notice with "Log it" (opens the log form with the event filled in) and "I didn't go"
(removes the marker). Future events left off venue, DJ, and collective pages. RLS tests
that no one but the owner can read a marker. Builds the in-app notices table and banner
(SPEC section 8), the first use of notices now that merges come later (ADR 0014).

## Milestone 8: Share previews

Open Graph metadata and images for log, venue, and DJ pages.

## Milestone 9: Launch

PWA manifest. Backups: if the free tier keeps nothing downloadable (Milestone 0 task 5),
a scheduled `pg_dump` of the app schemas, never `auth`, to private storage, with a tested
restore.

## Milestone 10: Merges and undo

After launch (ADR 0014). Merges and undo ship together, so undo's tests prove the merge
record format from the first merge.

Merges of events, venues, DJs, and collectives, each with a summary before confirming
(private logs as a count only), opened from a "Duplicate" report with both entries side by
side. Merged entries set the `merged_into_id` columns that exist from Milestones 2 and 3:
they keep their row, redirect, and refuse anything new, and unique indexes ignore them.
Event merges move logs and markers, combine lineups by set, move set picks, and fill in
missing fields. Venue and collective merges list same-date nights to merge (as child
merges) or name; DJ merges combine matching slots. When a user logged both events, the
more recently edited log stays and the other is archived with `archived_merge_id`. The
`event_merge` notice with "Keep the one showing" and "Switch to the other", neither
deleting a log. An "Archived" section on the owner's profile. RLS tests that archived logs
never appear in feeds or stats. Adds `merges`, `merge_changes`, `logs.archived_merge_id`,
the merge fields on `notices` and `catalog_edits`, and the merge enum values
(`docs/DATA_MODEL.md`).

Undo with a summary, newest first, children only with their parent, putting back only rows
still as the merge left them, asking what to do when a value would collide, and moving DJs
picked after the merge onto the original lineup. Adds `merges.undone_by`,
`merges.undone_at`, and the `merge_undone` notice kind. Tests for every undo rule in ADR
0009. Then locals can merge, and "Duplicate" reports move to their queue.

## Later

- Venue-claimed pages, with an opt-in public location
- AI features: log assist, then venue review summaries, then visiting a city, each when
  its trigger in `docs/AI_FEATURES.md` is met
- "Recent edits" page for admins across the catalog, filtered by person, with bulk revert
  (ADR 0014). Edits are recorded from Milestone 2, so it can be built on existing data
- Show averages. Each needs a minimum number of public logs from different users and a rule
  for logs from new accounts (SPEC "Aggregation rules"). The numbers go in the ADR that
  turns averages on.
- DJ pages list a night only once someone other than the person who added the DJ's slot
  has picked it in a public log.
- "Played:" in DJ search: venues and collectives the DJ played, taken from lineups. Only
  nights with at least one public log, the same rule as DJ pages. Stops one user
  putting a DJ on a night they did not play. Wait until the app has enough traffic that
  this does not hide real nights.
- Paste a lineup ("A, B b2b C, D") to add several slots at once. A parser on commas, new
  lines, and the existing b2b rules, no AI (`docs/AI_FEATURES.md`)
- Photos
- Want-to-go list, custom lists
- Sound tag and city filters on venue search, which cover queries like "clubs with
  Funktion-One" without natural-language search (`docs/AI_FEATURES.md`)
- Public upcoming event listings
- Notifications
