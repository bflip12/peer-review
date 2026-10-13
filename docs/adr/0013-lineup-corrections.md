# 0013: A lineup slot never gets a different DJ, and slot changes can be reverted

- Date: 2026-10-13
- Status: Accepted

## Context
Set picks and ratings attach to lineup slots (ADR 0008). Lineups are entered by users, so
some are wrong: a DJ who did not play, a b2b partner who never showed, or a night filed
under the wrong one of two DJs with the same name (ADR 0011). ADR 0008 and 0009 allowed
one fix: removing the slot, which deleted its picks and ratings and could not be reverted.
Catalog history and "Revert" covered venues, DJs, collectives, and event fields, not slots.

Changing the DJ on an existing slot would keep its ratings, but a rating someone gave A
would then count for B. Making ratings follow their DJ to another slot was considered and
rejected: it needed a table recording each pick's DJs, a step that moves picks after every
lineup edit, rules for when a pick fits several slots or none, and a prompt for users. That
is a lot of work to protect set averages that v1 does not show.

## Options considered
- **Change the DJ on a slot, ratings stay on the slot.** Simple, but a rating for A can end
  up counting for B.
- **Ratings follow their DJ between slots.** Correct in more cases, but the most complex
  option, and it breaks the same-name fix: moving a slot from one DJ Rush entry to the
  other would orphan every rating, though the person who played did not change.
- **A slot never gets a different DJ.** A wrong slot is removed and a new one added. Two
  changes are allowed because neither puts a rating on someone the user did not see:
  removing one DJ from a b2b set, and switching to another entry with the same name.

For removal:
- **Delete the slot and its picks** (ADR 0008). A wrong removal by a local loses other
  users' ratings for good.
- **Hide the slot and record the change**, so "Revert" brings it back with its picks.

## Decision
**A slot never gets a different DJ.**
- Locals and admins correct a lineup in three ways: remove a slot, remove one DJ from a b2b
  slot, or switch a DJ to another entry with the same name (ignoring case and surrounding
  spaces).
- Removing one DJ from a b2b slot is refused when the result would match another slot on
  that night: "A is already listed solo on this night. Remove this slot instead."
- "b2b with" adds a DJ to a slot only until someone other than the person who added the
  slot has picked it. After that, a user adds a new slot, and the wrong one is reported.
- DJ merges are exempt. A merge joins two entries for one person, so slots point at the
  kept DJ (ADR 0009).
- A wrong DJ is fixed by removing the slot and adding a new one. The removed slot's picks
  and ratings stop counting. The users' written reviews are on their logs, not on slots, and
  do not change.

**Slot changes can be reverted.**
- Removing a slot sets `lineup_slots.removed_at` instead of deleting it. A removed slot is
  left out of the lineup, its picks are left out of logs, counts, stats, and averages, and
  everything stays stored. This applies to every removal, including a user removing their
  own slot before anyone else picks it.
- Every slot change is a row in `catalog_edits` with the new `catalog_type` value
  `lineup_slot`, and appears in the event's history list with "Revert", like any catalog
  edit.
- A revert that would put two live slots with the same DJs on one night is refused. The
  local removes the other slot first.
- Reverting a removal brings the old slot back. A slot added since stays, as in ADR 0009.

**Reports.** "Didn't play" gets an optional "Who played instead?", stored in the report's
description, so the local knows which DJ to add.

**Hidden DJs.** Lineups, pages, and stats leave out hidden DJs. A slot whose DJs are all
hidden is left out of the lineup. Nothing is deleted, and unhiding brings them back.

## Consequences
- Replaces from ADR 0008: removing a slot removes its picks and ratings. Replaces from ADR
  0009: catalog history covers only venues, DJs, collectives, and events.
- A rating never counts for a DJ the user did not see on the slot they picked.
- When a slot is replaced, users who rated it lose that set rating until they pick the
  right set. The lineup was wrong, and only they know who they heard.
- "Same DJs at most once per event" counts live slots only.
- Event merges move removed slots with the event and combine only live slots.
- Data model: `lineup_slots.removed_at`, `lineup_slot` in `catalog_type`, and the lineup
  functions that enforce the rules above.
- If ratings ever need to follow their DJ, each pick's DJs can be recorded from that point
  on. Nothing here blocks it.
