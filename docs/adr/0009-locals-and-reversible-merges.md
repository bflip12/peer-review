# 0009: Locals, and merges that can be undone

- Date: 2026-10-09
- Status: Accepted

## Context
`SPEC.md` had one role besides users: admin, a flag on the profile. Admins handled
everything: the report queue, hiding content, bans, merges, removing "Didn't play" slots,
and changing an event's collective or name once set. Nobody could fix a misspelled venue,
DJ, or collective name except through an admin merge.

Two kinds of work were mixed in that role:
- **Fixing the catalog.** Names, cities, links, and duplicates. This needs knowledge of a
  local scene, and most of it is easy to check at a glance.
- **Acting on people.** Reports on logs and comments, hiding content, bans. This needs full
  trust, and reports show who reported what.

Merges were also one-way. A venue merge can force event merges on every date both venues
had a night, and each event merge can archive users' logs and send notices. A wrong merge
could not be reversed, and answering the merge notice deleted a log.

## Options considered
For roles:
- **One admin role.** Simple, but every catalog fix waits on the owner.
- **Admins and locals.** Locals fix the catalog, admins act on people.
- **Locals scoped to cities from day one.** Matches the idea of a local, but DJs have no
  city, and there are too few locals at launch for scope to matter.

For merges by locals:
- **Locals propose, admins confirm.** Safe, but most merges wait on the owner.
- **Locals merge only when nothing collides.** Covers most duplicates, but a merge that
  touches several users still waits.
- **Locals confirm any merge after a summary of what it will change, and any merge can be
  undone.** Locals know the scene well enough to judge, and undo covers a wrong call.

For undo:
- **Restore a snapshot.** Simple to describe, but it overwrites everything that happened
  after the merge: new logs, edits, comments, set picks.
- **Leave merged rows in place and resolve them on every read.** Undo is clearing one
  column, but every query for pages, averages, and feeds has to follow merges.
- **Record each change a merge makes and replay the record backwards.** Only what the merge
  moved goes back. Everything added since stays.

## Decision
**Roles.**
- `profiles.role` is `user`, `local`, or `admin`. Admins can do everything locals can.
  Admins assign roles.
- A local has one or more cities, shown on their profile as "Berlin local". The cities are
  stored but not enforced: in v1 a local can act anywhere.
- Locals:
  - Edit venues, DJs, and collectives: name, city, links, sound tags.
  - Change an event's venue, collective, or name when it is already set.
  - Work the catalog report queue: "Duplicate" and "Didn't play" reports, and any report
    on a venue, DJ, collective, event, or lineup slot. Reporters are not shown.
  - Remove lineup slots.
  - Merge and undo merges of events, venues, DJs, and collectives.
- Admins only: reports on logs, comments, and users, hiding content, bans, and roles.
- Every edit to a venue, DJ, collective, or event is recorded: who, which field, the old
  value, and the new one. Locals and admins see the history and can revert an edit.

**Merge summary.**
- Every merge shows a summary before it is confirmed: each pair of events that will merge
  (date, venue, collective, name, lineup, log count), the users with a log on both events,
  the slots that combine, and the fields where the merger has to pick a value.
- Public logs are shown in full. Private logs are shown only as a count, for locals and
  admins alike (ADR 0004).

**Merging.**
- A merged entry keeps its row, with `merged_into_id` set to the kept entry. Its URL
  redirects to the kept entry. It no longer appears in search, the night picker, or pages,
  and database triggers refuse any new log, Going marker, slot, event, or edit that points
  at it.
- Unique indexes ignore merged rows.
- Events: logs and Going markers move to the kept event, lineups combine by set, and set
  picks move to the kept slot with the same artists. A user with a log on both events keeps
  the more recently edited one on the event, and the other is archived. The kept event takes
  the other's venue, collective, or name when it has none. When both have a different
  value, the merger picks. The 3 logs per date limit does not apply.
- Venues: events move to the kept venue. Two events that would then break the
  one-unnamed-night rule or share a name merge too, as part of the venue merge.
- Collectives: events move to the kept collective. Nights of both collectives on the same
  date with no venue are listed, and the merger either merges each pair or names one of the
  two nights.
- DJs: lineup slots point at the kept DJ. A b2b slot that ends up with the same DJ twice
  becomes a solo set. Two slots on one event that end up with the same artists combine, and
  a log that picked both keeps its pick on the kept slot.
- Event merges caused by a venue, collective, or DJ merge are recorded as its child merges.

**Archived logs.**
- Archived logs are kept until their owner deletes them. Answering the merge notice never
  deletes a log.
- The merge notice has two choices: "Keep the one showing" closes the notice, and "Switch
  to the other" swaps which of the two logs is archived.
- An "Archived" section on the owner's profile, visible only to them, lists archived logs
  with the reason ("Archived when two listings of this night were merged"), a link to the
  night, and the same "Switch to the other" choice.

**Undo.**
- Each merge writes a `merges` row and one `merge_changes` row per change it makes: a log
  moved, a log archived, a slot dropped and its picks moved, a field filled in.
- Undo replays those changes backwards, for the merge and all its children. The merged
  entry opens again under its old ID, so old links work again.
- A change is reversed only when the row is still as the merge left it. Anything changed
  since keeps its later state: a log moved to another night with "Change night" stays
  there, a log its owner deleted stays deleted, and a field edited since keeps the new
  value. When restoring a value would break a unique rule, the current value stays.
- Logs, slots, and edits added to the kept entry after the merge stay on it.
- A moved log that picked a slot added after the merge takes that DJ with it: the DJ is
  added to the original event's lineup, as "Change night" does.
- Undo runs newest first. A merge can be undone only while its kept entry is not itself
  merged, and a child merge only together with its parent.
- Undo shows a summary before it is confirmed: logs going back and to which night,
  archived logs coming back, slots recreated, DJs added to a lineup, what stays on the kept
  entry, fields that keep a later value, logs that cannot come back because their owners
  deleted them, and who gets a notice. Private logs are a count, as in the merge summary.
- Users whose logs move back or come out of the archive get a notice. A merge notice still
  open is closed.
- The 3 logs per date limit does not apply to undo.

## Consequences
- Catalog fixes no longer wait on the owner. The owner's queue is reports on people.
- Changes ADR 0008's admin-only rules: changing a set event field and removing a reported
  slot are now for locals too.
- Merges no longer delete data. A wrong merge costs an undo, not lost logs.
- Merging is the most complex operation in the app, and undo roughly doubles it. Every rule
  under "Undo" needs a test.
- Merge records must be written from the first merge. A merge without a record can never
  be undone.
- `event_redirects` is now only for events deleted after a log move emptied them. Merged
  entries redirect through `merged_into_id`.
- City scope for locals can be enforced later with one policy change, once there are enough
  locals for it to matter.
- Data model: `profiles.role`, `local_cities`, `merged_into_id` on events, venues, artists,
  and collectives, `logs.archived_merge_id` (the merge that archived the log, in place of
  the `archived` flag), `merges`, `merge_changes`, and `catalog_edits`.
