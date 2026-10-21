# 0015: A private original copy of each log

- Date: 2026-10-13
- Status: Accepted

## Context
A log is more than its review. It is the night: the date, the event's name, the venue, the
collectives, the lineup, and the sets the user picked and rated. Only the owner changes
their ratings and review (SPEC section 3: "The logs and their reviews are not changed"),
but everything around them is shared, and other people edit it. Locals rename venues and
DJs and correct lineups, a removed slot takes the user's pick and stars out of the log (ADR
0013), and after launch a merge moves a log to another listing (ADR 0014). Each edit is
right for the catalog. From the owner's side, their entry changed without them touching it.

Users feel ownership of their logs, and some will want to see a log exactly as they
recorded it.

## Options considered
- **No copy, an export only.** A download of the user's logs covers leaving the app or a
  shutdown, but it shows the night as it is at download time, not as it was logged.
- **A full copy of the log row.** It duplicates the ratings and review, which only the
  owner changes, so the copy and the log disagree as soon as the owner edits, with no
  answer to which one is the original.
- **Edit history on logs.** It keeps every version the owner saved. That is more than the
  problem needs: the owner's own edits are their choice.
- **A frozen copy of the night.** What the user writes shows live. What other people
  control is frozen.

For when the copy refreshes:
- **At the first save only.** The purest original, but after "Change night" the copy shows
  the old night, which looks like a bug.
- **On every save by the owner.** The copy is the night as it was when the owner last saved
  the log. "Change night" and the owner's edits refresh it. Nobody else's edits do.

For where it shows:
- **A line on the log when its night has changed.** On a busy app lineups are corrected all
  the time, so the line would show on most logs.
- **A separate private page.** People open it when they are looking for it.

## Decision
**Each log has one private copy of its night, readable only by the owner.** Locals and
admins cannot read it.

- Frozen in the copy: the date, city, event name, venue, collectives, the lineup as shown,
  and the user's set picks with their stars. Stored as names, so renames and merges do not
  change it.
- Shown live from the log: the overall, sound, and venue ratings, the review, and the
  visibility.
- The copy is written when the log is first saved, and replaced every time the owner saves
  the log or its picks, or uses "Change night". Edits by other users, lineup corrections,
  hides, merges, and merge undo never touch it.
- A pick on a slot that was removed (or whose DJs were all hidden) before the owner's save
  stays in the copy, marked "Removed from the lineup". Saving the log never drops a pick
  the user made from the copy.

**It lives on its own page.**
- "Original logs" is a private page on the user's own profile, next to "Upcoming". It lists
  each log newest first: the frozen night, with the current ratings and review.
- A row whose night has changed since the owner's last save shows "Changed since you saved
  it". Nothing is shown on the log itself.
- The owner's menu on a log has "View original", which opens its entry on that page.
- The page explains what it is at the top. The text is in SPEC section 4.

## Consequences
- Data model: a `log_snapshots` table, one row per log, deleted with the log. Owner-only
  read, written only by database functions. It is a separate table because logs are public
  and row level security hides rows, not columns.
- Deleting an account or a log deletes its copy. An archived log (Milestone 10) keeps its
  copy.
- The copy is written from Milestone 3, with logs, because a log saved before the table
  exists never gets one. The page ships with profiles in Milestone 4.
- "Changed since you saved it" compares the stored copy with one built from the live rows
  by the same function, so the two always have the same layout.
- The copy carries a format number. A new field goes into new copies, old copies keep
  their format, and the page reads both.
- An export of a user's logs, if one is built, can include the copies. Not in v1.
- An edit history of the owner's own changes stays out. Nothing here blocks it.
