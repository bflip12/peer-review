# Tasks

Read this at the start of every session. Work one task at a time. Delete a task when it is
done. Big decisions get an ADR in `docs/adr/`; rule changes get a line in
`docs/changelog.md`.

A milestone is a group of tasks that ships one usable slice of the app. Milestones run in
order.

## Decisions waiting on Bobby

- **Design direction.** Collect 3 to 5 reference screenshots of sites, apps, or record
  sleeves. Then install the frontend-design plugin and use them with it.
- **Name and domain.** Check that "Peer Review" and a domain are available.

## Milestone 0: Setup

1. Scaffold Next.js and TypeScript with a `src/` folder. Prettier settings from code-style
   section 1, ESLint with a `max-lines` limit, Vitest with React Testing Library, and
   Playwright. Record every command in `CLAUDE.md`.
2. Add a `PostToolUse` hook on `Edit|Write` that runs Prettier and ESLint fix on the edited
   file. Add a permissions allowlist to `.claude/settings.json` for routine commands.
3. Add a screenshot script that captures a page at 375px and 1280px.
4. Add CI on GitHub Actions: typecheck, lint, test, build.
5. Create the Supabase project and local dev setup, a migrations folder, a way to test RLS
   policies, and `.claude/rules/supabase.md`.
6. Add to `docs/code-style.md`: server component data fetching, and the Next.js
   default-export exception for route files.
7. Write the rules not covered yet: where state lives and what may not hold it, when a new
   dependency is acceptable, what is committed versus generated, and the error and loading
   conventions.
8. Create the token file and `docs/style-guide.md` with the first styled component (the app
   shell).

## Milestone 1: Accounts

Sign-in with magic link and Google, handle and display name setup, the sign-in privacy
note, RLS tests proving email is never exposed, account deletion.

## Milestone 2: Venues, DJs, collectives

Cities seed from the GeoNames cities export, with autocomplete. Venues with name, city,
links, and sound tags. DJs and collectives. Search-first creation with fuzzy duplicate
suggestions. Link validation by domain. DJ names containing "b2b" are refused.

## Milestone 3: Events and logs

Events with a venue, a collective, or both (ADR 0008). The night picker: date first,
one search across venues, collectives, event names, and lineups, "Nights" and "Start a new
night" groups, nights one day either side, a required name for a second night at the same
place and date, and the past-midnight line. Events created only when a log is saved, with
the concurrent-save case joining instead of failing. Lineup slots with one or more artists,
b2b detection in DJ search, and slot removal by the user who added it. Log form with the
overall rating, review, and privacy first, and a collapsed section for sound, venue, and
"Which sets did you listen to?". At most 3 logs per user per date, enforced by a trigger.
"Change night" on a log, carrying everything over. Deletion of events left with no logs
and no Going markers, with a redirect when a move caused it. The log form accepts only
events dated today or earlier.

## Milestone 4: Pages

Log, event, venue, DJ, collective, profile with stats, search by name. Venue, DJ, and
collective pages list only events with at least one public log. Artist averages computed
solo, b2b, and combined, with the combined one shown. "Most listened to DJs" counts picked
sets.

## Milestone 5: Social

Follow, feed, likes, comments.

## Milestone 6: Moderation

Roles (ADR 0009): `user`, `local`, and `admin` on the profile, with cities stored on locals
and shown as "Berlin local" but not enforced. Report button, including lineup slots with
"Didn't play". A catalog report queue for locals (reporters not shown) and a queue for
reports on logs, comments, and users for admins. Locals and admins edit venues, DJs,
collectives, and set event fields, with an edit history and revert. Admins hide content,
ban users, and assign roles.

Merges of events, venues, DJs, and collectives, by locals and admins, each with a summary
before confirming (private logs as a count only). Merged entries keep their row with
`merged_into_id`, redirect, and refuse anything new; unique indexes ignore them. Event
merges move logs and markers, combine lineups by set, move set picks, and fill in missing
fields. Venue merges merge colliding events as child merges; collective merges list
same-date nights to merge or name; DJ merges combine matching slots. When a user logged
both events, the more recently edited log stays and the other is archived with
`archived_merge_id`. In-app notices table and banner, with "Keep the one showing" and
"Switch to the other", neither deleting a log. An "Archived" section on the owner's profile.
RLS tests that archived logs never appear in averages, feeds, or stats.

Undo: `merges` and `merge_changes` written from the first merge. Undo with a summary,
newest first, children only with their parent, putting back only rows still as the merge
left them, and moving DJs picked after the merge onto the original lineup. Tests for every
undo rule in ADR 0009.

## Milestone 7: Going

"Going" on events dated today or later, using the night picker from Milestone 3. No limit
on markers per date. Private "Upcoming" list on the user's own profile. Morning-after
notice with "Log it" (opens the log form with the event filled in) and "I didn't go"
(removes the marker). Future events left off venue, DJ, and collective pages. RLS tests
that no one but the owner can read a marker. Event merge moves markers.

## Milestone 8: Share previews

Open Graph metadata and images for log, venue, and DJ pages.

## Milestone 9: Launch

Privacy page, PWA manifest, production deploy, sound systems seed. A credit line with
a link to geonames.org on the about or privacy page (required by the GeoNames CC BY 4.0
license for the cities data).

## Later

- Venue-claimed pages, with an opt-in public location
- AI features: venue review summaries, log assist, visiting a city
- Photos
- Want-to-go list, custom lists
- Natural-language search ("clubs with Funktion-One")
- Public upcoming event listings
- Notifications
