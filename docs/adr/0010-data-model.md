# 0010: Data model shape, co-hosts, and enums for states that can grow

- Date: 2026-10-12
- Status: Accepted

## Context
ADRs 0008 and 0009 set the product rules for events, lineups, roles, and merges. Turning
them into tables left choices that are expensive to change once users share links and log
nights: how pages are addressed, how ratings are stored, how many collectives an event can
have, how the unnamed-night rules are enforced, where "who created this" is kept, and how
yes or no states are stored. The full model is in `docs/DATA_MODEL.md`.

## Options considered
- **URLs.** Slugs only (`/venues/tresor-berlin`): clean, but needs rules for clashing
  names, renames, merges, and non-Latin names. UUIDs: reliable, long, unreadable. A short
  random ID plus a name part (`/venues/k3x9p2/tresor-berlin`): the ID finds the page, and
  the name part redirects when outdated.
- **Ratings.** Decimal 0.5 to 5, or whole numbers 1 to 10 (half-stars times two).
- **Collectives on an event.** One collective (ADR 0008), a main collective plus co-hosts,
  or any number of equal co-hosts.
- **Unnamed nights.** Postgres treats two missing names as different, so a plain unique
  rule lets two unnamed nights in. Options: two rules (one for unnamed, one for named),
  `NULLS NOT DISTINCT` (Postgres 15 and later), or comparing a blank-text key. For
  co-hosts, the rule needs the collective, date, and name together: either copy the
  event's date and name onto each co-host row so a unique index can see them, or check in a
  trigger that locks the collective and date.
- **Who created what.** A `created_by` column on each row (ADR 0009), or a separate table.
  Row level security hides rows, not columns, so a column is readable by anyone who can
  read the row.
- **Yes or no states.** Booleans and timestamps, or enums for states that could gain a
  value, even when they have one value today.
- **Link fields.** One column per site on venues, DJs, and collectives, or a links table
  with a platform lookup.

## Decision
- Every table uses a UUID key. Venues, DJs, collectives, events, and logs also get a
  `short_id` used in URLs, followed by a name part built when the page renders. Log URLs
  never include the handle. Profiles are `/@handle`, and an old handle does not redirect.
- Ratings are `smallint` 1 to 10, shown as 0.5 to 5 stars, on every rating.
- An event has any number of equal co-host collectives. The no-venue rule from SPEC
  section 3 applies per collective across all co-hosts: per collective and date, one
  unnamed event plus named events with distinct names, among events not merged. An event
  merge combines collectives instead of picking one.
- Events use one unique index with `NULLS NOT DISTINCT` for the venue rule. Co-host rows
  carry non-null copies of the event's date, name key, and states, kept correct by a
  reference back to the event, so the database enforces the collective rule itself.
- Who created an event, lineup slot, venue, DJ, or collective is kept in a `creations`
  table, readable by that user, moderators, and admins.
- The role values are `user`, `moderator`, and `admin`. The app shows `moderator` as
  "Local", and the cities table is `moderator_cities`.
- Enums for states that can grow: log visibility (`public`, `private`), Going visibility
  (`private`), follow status (`active`), reaction (`like`), account status (`active`,
  `banned`). Enums for every kind and type column.
- Links live in a `links` table, with allowed domains per platform in `link_platforms`.
- Venue, DJ, and collective averages are calculated but not shown in v1. The pages focus on
  logs and people, not scores.
- Collectives have an optional home city, never used to match events.
- Dates are read in the event city's timezone. The Going prompt is due at 12:00 the day
  after the event date.
- Comments are flat. Editing shows "edited", the author's delete leaves "Comment deleted",
  and the log owner cannot delete other people's comments.

## Consequences
- Replaces from ADR 0008: one `collective_id` per event, and "the merger picks" for the
  collective. Replaces from ADR 0009: `created_by` columns, the `local` role value, and
  `local_cities`. Their product rules otherwise stand.
- `NULLS NOT DISTINCT` needs Postgres 15 or later on Supabase. Checked in Milestone 0.
- Co-host rows carry four copied columns. A wrong copy is refused and changes to the event
  flow to them automatically.
- Adding followers-only logs, follow requests, reactions, or suspensions adds an enum value
  instead of changing a column's type and every query that reads it.
- The rating scale and URL shapes are effectively permanent once links are shared.
- New schema work follows `.claude/rules/database.md`.
