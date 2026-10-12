# 0011: Daily caps on new catalog entries, and notes for DJs with the same name

- Date: 2026-10-12
- Status: Accepted

## Context
The catalog is built by users with no verification (SPEC section 2). A review of the
logging flow found two gaps in that model:
- Nothing limits how many venues, DJs, collectives, or events one account creates. Sign-in
  accepts any email address, including aliases, so a second account costs nothing. The
  3-logs-per-date limit does not cap events either: it counts per night's date, so one
  account can back-date logs across hundreds of past dates and create an event for each.
- DJs have no city. Two real artists with the same name end up as one entry: search shows
  the existing one, users pick it, and both artists' nights land on one page.

## Options considered
For aliases:
- **Refuse alias addresses.** Stripping Gmail `+tags` catches the easy case. Relay services
  (SimpleLogin, iCloud Hide My Email) and second mailboxes cannot be told apart from a real
  address. ADR 0004 allows aliases on purpose, for users wary of being identified.
- **Allow aliases, and limit what one account can do.** Keeps ADR 0004. Reports and bans
  handle accounts that misbehave.

For creation limits:
- **No limit until abuse appears.** Nothing to build, but cleaning up after a spam run means
  hiding hundreds of rows by hand.
- **Low caps raised on request.** The users most likely to hit them are the first users in
  each city, who add most of the catalog at launch.
- **Caps well above normal use, per account, over the last 24 hours.** A real user never
  meets them. One bad account can do limited damage per day.

For DJs with the same name:
- **A city on DJs.** DJs tour, and many have no home city anyone knows.
- **Show the DJ's most recent night in search.** Needs no new field, but a new DJ has no
  nights, and two artists can play the same club.
- **An optional note to tell them apart**, as MusicBrainz does with its disambiguation
  comment. Shown in search and on the DJ page.

## Decision
**Aliases.** Any email address works, including aliases (unchanged from ADR 0004).

**Caps.** Per user, over the last 24 hours: 10 venues, 10 collectives, 50 DJs, and 20 new
events. Moderators and admins are exempt. Lineup slots and logs that join an existing event
are not capped. A trigger on `creations` counts that user's rows of the same kind and
refuses the insert at the cap. The four numbers are constants in that one function, so
changing one is a one-line migration. The form shows "You've added 10 venues today. You can
add more tomorrow."

**DJ notes.**
- `artists.disambiguation`: optional text, up to 60 characters. Shown as "Note to tell them
  apart" in forms.
- The note field appears when a new DJ's name matches an existing DJ exactly, ignoring case
  and surrounding spaces, and is required then. A unique name never shows it. A close name
  ("Rush" beside "DJ Rush") goes through the normal duplicate suggestions.
- DJ search results show the note and the DJ's link sites beside the name. The DJ page shows
  the note under the name. Lineups and URLs show the name only.
- The DJ who had the name first has no note until their creator adds one (while they still
  can edit) or a local does. Nothing forces it.
- The database refuses two DJs, not merged, with the same name and the same note, a missing
  note counting as equal. One unique index on `(lower(btrim(name)),
  lower(btrim(disambiguation)))` with `NULLS NOT DISTINCT`, limited to rows not merged.
  Renaming a DJ to a name taken by a DJ with no note is refused the same way.

## Consequences
- One account can add at most 90 catalog entries and 20 events a day. Many accounts can
  still add more. If that happens, the next step is sign-up limits (Supabase Auth rate
  limits, or a CAPTCHA on sign-in).
- A user who reaches a cap waits up to 24 hours. A local or admin can add entries for them.
- Undoing a DJ merge can collide with this index: a DJ with no note created after the merge
  takes the name back. Undo already handles values that would break a unique rule (ADR
  0009).
- Data model: `artists.disambiguation`, the unique index above, and the cap trigger on
  `creations`.
- Checked on PostgreSQL 16: the index refuses a second unnoted "DJ Rush" (any case or
  spacing), allows one with a note, refuses the same note twice, ignores merged rows, and
  refuses unmerging into a taken name. The cap trigger refuses the 11th venue in 24 hours,
  counts each kind apart, ignores rows older than 24 hours, and lets moderators past it.
- Unverified: Supabase Auth's own sign-up rate limits. Checked in Milestone 0 task 5.
