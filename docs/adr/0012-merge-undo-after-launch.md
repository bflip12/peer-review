# 0012: Merge undo ships after launch, and merges are admin-only until then

- Date: 2026-10-12
- Status: Accepted

## Context
ADR 0009 lets locals merge without approval because any merge can be undone. Undo is the
most complex part of the app: replaying `merge_changes` backwards, skipping rows changed
since, collision prompts, child merges, an undo summary, and notices. It roughly doubles
the merge work in Milestone 6.

v1 is done when 20 people log nights for a month. At that size, merges are rare and wrong
merges rarer. The one part of undo that cannot be added later is the record: a merge with no
`merge_changes` rows can never be undone.

## Options considered
- **Ship undo in v1 as planned.** Locals can merge from launch. Milestone 6 stays the
  largest milestone, for a case that may not happen before launch.
- **Record merges from the first one, build undo after launch, and keep merges admin-only
  until then.** Every merge stays undoable once undo ships. The owner makes every merge in
  the meantime, which is a small queue at launch size.
- **Drop undo.** Wrong merges move real logs with no way back. Rejected for the reasons in
  ADR 0009.

## Decision
- Every merge writes `merges` and `merge_changes` from the first merge, in the format ADR
  0009 and `docs/DATA_MODEL.md` describe.
- Merges are admin-only until undo ships. "Duplicate" reports go to the admin queue until
  then.
- Locals keep the rest of ADR 0009: editing venues, DJs, and collectives, changing set event
  fields, the other catalog reports, removing lineup slots, and reverting catalog edits.
- Undo, and merges by locals, are a milestone after launch. ADR 0009's undo rules stand for
  that milestone.

## Consequences
- Replaces from ADR 0009: locals merging in v1, and undo in v1. The rest of ADR 0009 stands.
- Milestone 6 loses the undo work. The owner's queue gains merges until the undo milestone.
- The undo milestone adds `merges.undone_by`, `merges.undone_at`, and the `merge_undone`
  notice kind. Each is cheap to add then.
- Catalog edit reverts are unchanged: they are separate from merge undo and stay in v1.
