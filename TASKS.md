# Tasks

Read this at the start of every session. Work one task at a time. Delete a task when it is
done. Big decisions get an ADR in `docs/adr/`; rule changes get a line in
`docs/changelog.md`.

A milestone is a group of tasks that ships one usable slice of the app. Milestones run in
order.

## Decisions waiting on Bobby

- **Public repo.** This repo stays private. A public repo comes later, around launch,
  started fresh from `main` so the history carries no personal paths or work email.
  Notes that should stay private go in a separate private repo.

- **Database URL secret.** The Migrate workflow connects with the `SUPABASE_DB_URL` repo
  secret (session pooler URL with the database password). Update it whenever the database
  password changes, or Migrate fails at "List the migrations that will run". The staging
  project's goes in `SUPABASE_STAGING_DB_URL` the same way.

Decided: the name is Peer Review and the domain is `peerreview.club`, served at
`www.peerreview.club`. The design is in
`docs/style-guide.md`, with the approved mockups in the Claude Design canvas "Peer Review
design directions" (Screens page).

## Milestone 1: Accounts

Done: the `profiles` table; sign-in with an email link, with handle and display name
setup (ADR 0022); sign-in email through Resend, with the hosted auth settings in both
Supabase projects (ADR 0023); signed-in screenshots (`npm run screenshot -- --as=user`);
account deletion on `/settings`; and Google sign-in with the privacy page (ADR 0024).
Auth's shared per-IP limits are raised to 150 per 5 minutes for sign-ins and
verifications in both Supabase projects; per-user limits wait for Milestone 9.
Milestone 1 is finished.

Every later milestone that adds a table adds its column write tests the way
`supabase/tests/profiles.test.ts` does. A table holding data a user owns also
cascades from `profiles`, and its milestone adds that data to the list on the settings
page's "Delete account" section (`DeleteAccountSection`) and to the privacy page
(`PrivacyPolicy`), with a new "Last updated" date.

## Milestone 2: Venues, DJs, collectives

Done: `cities` and `city_names`, seeded from GeoNames cities1000, with `search_cities` and
the GeoNames credit on the privacy page (ADR 0025). The `sound_systems` and
`link_platforms` lookups, with text IDs and the hosts each link field accepts. `creations`
with the daily cap trigger, and `catalog_edits`, with their read rules. Their foreign keys
come with each table, and the `used_by_others_at` trigger waits for Milestone 3.

Tasks, one PR each, in order:
1. Venues, with the city picker. The picker calls `search_cities`. Its generated type
   says `admin1_name` is a string, but it is null when GeoNames has no region, so the
   picker's type marks it nullable. Show `matched_name` beside the name when they differ
   ("Köln (Cologne)"). The `links` table, with a trigger refusing a URL whose host is not
   in the platform's `allowed_hosts`, and the same check in the form, with an error under
   the field built from the platform's label: "Paste a Bandcamp link, such as
   name.bandcamp.com." The Bandcamp error adds "Using your own domain? Paste your
   name.bandcamp.com address, or add it as your website.", since custom domains are
   refused. Adds the `creations.venue_id` foreign key, and the trigger that writes a
   `catalog_edits` row for each edit, shared by DJs and collectives. Adds created venues
   and edits to the "Delete account" list and the privacy page.
2. DJs, with the `creations.artist_id` foreign key.
3. Collectives, with the `creations.collective_id` foreign key.

The milestone as a whole: venues with name, city, links, and sound tags. DJs and collectives. Search-first creation
with fuzzy duplicate suggestions. Links in a `links` table, validated by domain per
platform. DJ names containing "b2b" are refused. An optional home city on DJs, required
when a new DJ's name matches one with no city, shown in DJ search and on the DJ page, with
the unique index on name and city (ADR 0011). Daily caps per user on new venues, DJs, and
collectives, by a trigger on `creations` (ADR 0011). The creator edits their entry until
another user picks it (ADR 0009), with `used_by_others_at` set by a trigger and the
creator read from `creations` (ADR 0010). Every edit writes a `catalog_edits` row from
the first one (ADR 0009), so history and "Revert" in Milestone 6 have data to show.

## Milestone 3: Events and logs

The `used_by_others_at` trigger (ADR 0009): set on a venue, DJ, or collective the first
time a user other than its creator joins or starts a night with it, or adds or picks the
DJ on a lineup. The `creations.event_id` and `creations.lineup_slot_id` foreign keys.
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

PWA manifest, with an app icon made from the wordmark, also used as the favicon and as
the Google consent screen's logo (which starts Google's brand review, ADR 0024).
Per-user Auth rate limits: forward the user's IP with `Sb-Forwarded-For`, which Supabase
honours only with a secret key. Needs an ADR for a client used only for Auth calls, with
the secret key server-side and a test that it never queries the database, and IP Address
Forwarding turned on in both Supabase projects (`docs/DATA_MODEL.md`).
Backups: the free tier keeps no downloadable backups (Supabase's production checklist),
so a scheduled `pg_dump` of the app schemas, never `auth`, to private storage, with a
tested restore.

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

- Dark mode: dark values for the color tokens, with their pairs added to the contrast
  test in `src/styles/tokens.test.ts` (`docs/style-guide.md`, "Color")
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
