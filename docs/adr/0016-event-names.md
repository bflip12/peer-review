# 0016: An event's name is the official name from the poster

- Date: 2026-10-14
- Status: Accepted

## Context
ADR 0008 made the event name optional and let anyone logging a night fill it in when it
had none. Once set, only locals and admins could change it. Two problems:

- Users may read the field as their own label for the night ("FUN TIME PARTY" for Tresor on
  Jan 1). The first person to log a night would set the name everyone sees, and could not
  fix it afterwards.
- Real party names matter. People recognise and search for nights by the advertised name
  ("Frequencies" at Tresor). Showing the field only to tell two nights apart would lose
  them.

Most named nights are one-offs. A recurring name can repeat as text on each night.

## Options considered
- **Show the name only for a second night at one venue and date.** No personal labels
  through the common path, but advertised names are lost.
- **Make a party name an entity** (the collective, or a new series table) with its own
  page. Links recurring nights and combines ratings, but adds a page and creation step for
  names that are mostly one-offs, at a scale where series do not matter yet.
- **Keep free text, framed around the poster.** The label, placeholder, and help text say
  the name comes from the organisers. The person who set it can fix it until someone else
  logs the night.

## Decision
Free text, framed around the poster.

**The field.** Wherever the name is asked:
- Label: "Name on the poster (optional)"
- Placeholder: "Halloween"
- Help text: "Use the official name from the poster. Leave it empty if the night didn't
  have one."
- No preview of the night row and no tooltip.

**Where it is asked.**
- Starting a new night: the field is shown, optional.
- Starting a new night at a venue or collective that already has a night on that date: the
  form first shows the existing night with "Join". The name field appears only after "No,
  it's a different party", and is required there, with the label "Name on the poster". The
  text under it: "Tresor already has a night on Sat 4 Oct. Add the name from the poster so
  people can tell the two apart." If a collective is picked, the field starts with its
  name. This replaces ADR 0008's text with the "Day party" example.
- Logging or marking Going on an existing night with no name: the same optional field.

**Who can change it.** The user who set the name can change or clear it until another user
logs the night or marks Going on it after the name was set. After that, users report a
wrong name, and locals and admins change it. This is the rule venues, DJs, and collectives
already follow. A clear that would leave two unnamed nights at one venue or collective on
one date is refused, as any clash is.

**Parts of ADR 0008 replaced.** "Anyone logging an event can set its collective or name
when it has none. Changing a value that is already set is admin only" now reads: anyone
logging an event can set its collective when it has none, the name follows the rule above,
and other set values are changed by locals and admins (ADR 0009). The second-night text
with the "Day party" example is replaced by the text above. The rest of ADR 0008 stands.

## Consequences
- Some personal labels will still get through. The person who wrote one can fix it, and
  after that a report gets it fixed.
- A recurring party is the same text on separate nights, with no shared page. Typos split
  it. A series page can be built later from names at one venue, or as a parent table over
  events (`docs/DATA_MODEL.md` already lists recurring series as easy to add).
- Data model: `events.name_locked_at`, set by a trigger when a user other than the name's
  setter logs the night or marks Going on it, and cleared when the name changes. The
  setter is read from `catalog_edits` (the latest `name` edit) or `creations` (when the
  name was set with the event), never from a column on `events`, since a public row must
  not show who did what.
