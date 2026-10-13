# 0014: Merges ship with undo after launch, and v1 has no averages or bulk revert

- Date: 2026-10-13
- Status: Accepted

## Context
A senior review measured the plan against the v1 done line: 20 people log nights for a
month, follow each other, and comment. Three planned parts serve a scale v1 will not reach.

- **Merges.** ADR 0012 keeps admin merges in v1 and writes `merge_changes` "in the format
  undo will need", with undo after launch. Nothing tests that format until undo exists, and
  `docs/DATA_MODEL.md` lists the merge record as hard to change later. At 20 users across
  many cities, a duplicate night with logs from two users is rare, and "Change night"
  fixes the one-user case. Merges were the largest part of Milestone 6.
- **Averages.** ADR 0008 has artist views return solo, b2b, and combined averages, and ADR
  0010 calculates venue, DJ, and collective averages without showing them. Code with no
  reader still has to be written and tested.
- **"Recent edits" bulk revert.** ADR 0009 gives admins a page to filter catalog edits by
  person and revert several at once. Only locals and admins edit entries others use, and
  v1 has a few hand-picked locals. The per-entry history and "Revert" stay, since slot
  removals need them.

## Options considered
For merges:
- **Keep admin merges in v1 (ADR 0012).** Duplicates get fixed at launch, but the record
  format ships untested and Milestone 6 stays the largest milestone.
- **Merges and undo ship together after launch.** Undo's tests check the record from the
  first merge. Duplicates with logs from two users stay as two nights until then.
- **Admin merges in v1 with undo tests written alongside.** Proves the format, but builds
  most of undo before launch, which ADR 0012 moved out.

For averages:
- **Calculate, do not show (ADR 0010).** Ready when an ADR turns them on.
- **Calculate nothing in v1.** Ratings are stored, so each average is a query written by
  the ADR that shows it, against the aggregation rules in `SPEC.md`.

## Decision
- No merges in v1. Merges and merge undo ship together in Milestone 10, after launch, and
  locals merge once both exist.
- "Duplicate" reports stay in v1 with the same fields. The admin queue shows both entries,
  linked, and the description. "Not a duplicate" closes a report; a real duplicate stays
  open for Milestone 10.
- The `merged_into_id` columns exist from the start and stay empty, because the event
  identity indexes and the co-host copies include them. `merges`, `merge_changes`,
  `logs.archived_merge_id`, the merge fields on `notices` and `catalog_edits`, and the
  merge enum values are added in Milestone 10.
- No averages are calculated in v1. The aggregation rules stay as written.
- The "Recent edits" page with bulk revert moves to "Later". Every catalog edit is still
  recorded from Milestone 2.
- `likes.reaction` and its one-value `reaction` enum are dropped. No planned feature names
  a second reaction, so the column fails the one-value enum rule in
  `.claude/rules/database.md`. Adding it later is one column with a default.

## Consequences
- Replaces from ADR 0012: admin merges in v1, and merges recorded before undo exists. Its
  reasoning for undo after launch stands.
- Replaces from ADR 0007: Going reusing the notices built for event merges. Going builds
  the notices table and banner in Milestone 7.
- Replaces from ADR 0008: artist views returning averages in v1. Replaces from ADR 0010:
  averages calculated in v1 and the `reaction` enum on likes. Replaces from ADR 0009: the
  "Recent edits" bulk revert in v1.
- Milestone 6 loses merges, the archive and switch notice, and the "Archived" section.
  Milestone 10 becomes "Merges and undo".
- Until Milestone 10, a duplicate with logs from several users shows as two nights, and its
  logs are split between them. Each user can still move their own log with "Change night".
- The one-live-log index on `logs` changes from `(user_id, event_id)` to a partial index in
  Milestone 10. Cheap on a small table.
