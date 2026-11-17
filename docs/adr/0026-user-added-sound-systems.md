# 0026: Users add sound system brands

- Date: 2026-11-16
- Status: Accepted

## Context
Venues are tagged with sound system brands from `sound_systems`, a list of seven seeded
rows that only a migration can extend (`docs/DATA_MODEL.md`). The venue form showed them as
seven checkboxes. Bobby found the checkboxes took a lot of room, and a venue's system is
often a brand the list does not have, which then can only be tagged "Other".

## Options considered
- **A fixed list with a search field.** Search the seven brands and add each pick as a tag.
  No schema change, but a missing brand still ends up as "Other", and adding one needs a
  migration.
- **Brands typed per venue.** A free-text brand stored on the venue only. No shared list
  to keep tidy, but the same brand is typed many ways, and nothing can be counted or
  searched across venues.
- **Users add brands to the shared list.** Search the list; when nothing matches, "Add
  Pioneer Pro Audio" adds the brand for everyone. The list grows with use, but needs a
  duplicate check, a daily cap, and cleanup by locals.

## Decision
Users add brands to the shared list.
- `create_sound_system(name)` adds a brand, or returns the existing one when the name
  matches one already listed, ignoring case, accents, spaces, and punctuation: "funktion
  one" is Funktion-One. A unique index on that folded form stops two rows for one brand.
- `search_sound_systems(query)` serves the venue form's search, close names first, so
  "Funktion One" is offered before "Add …" appears.
- Each brand a user adds writes a `creations` row, with a daily cap of 10 per user.
  Moderators and admins are exempt, as for other caps (ADR 0011).
- User-added brands get a generated ID (`b_` and a short ID). The seeded brands keep their
  readable IDs, which code may name. User-added brands have no `sort_order` and sort by
  name after the seeded ones.
- The seeded "Other" stays, so venues already tagged with it keep the tag.

## Consequences
- A misspelled or joke brand stays in the list until locals can rename, merge, or hide
  brands in Milestone 6. The folded-name index only stops exact duplicates; "Funktion 1"
  is a new brand.
- Deleting an account keeps the brands the user added, without the record that they added
  them, as for venues and DJs.
- `sound_systems` is no longer seeded-only: SPEC section 2 and `docs/DATA_MODEL.md` say so.
