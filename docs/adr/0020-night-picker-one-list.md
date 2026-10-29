# 0020: One result list in the night picker, and the event name field

- Date: 2026-10-29
- Status: Accepted

## Context
Bobby reviewed the log form mockups (`docs/style-guide.md`, Claude Design canvas) and
raised two problems.

- **The picker asks a question users do not think about.** ADR 0008 splits the results
  into "Nights" (join an existing event) and "Start a new night" (create one). That is how
  the data is stored. People remember a night as "I was at Tresor on Saturday", and under
  a button called "Log a night" they may expect to create the night themselves. Every
  wrong "Start" is a duplicate event that needs a log move or a merge.
- **The DJ part of the search reads as a way to start a night.** The search matches DJs
  on lineups, but a night needs a venue or a collective (ADR 0008, ADR 0010). A label that
  lists "DJ" next to "venue" suggests a DJ can be picked to start one.
- **The event name field reads as required.** With the label "Name on the poster
  (optional)" above the rating, it sat first in the form. Bobby wanted it lower and named
  plainly.

## Options considered

**Picker results**
- **Keep two groups, reworded.** Least change, but users still choose between joining and
  creating.
- **One list, each row saying what tapping it does.** Joining and starting look the same
  to the user. A venue that already has a night on the date shows as that night, so the
  existing night is the obvious pick.
- **Pick a venue or collective first, then show its nights.** One more step for every
  log, and DJ and event name search no longer find nights directly.

**Event name field**
- Keep ADR 0016's label and placement, or rename it and move it below the review. The
  help text carries the poster framing either way.

## Decision

**The night picker results are one list.** The search box is labelled "Where were you?"
with the help text "Venue, collective, event name, or a DJ who played." Each row ends with
"Join" or "Start". In order:
1. Existing nights on the chosen date, with "Join". A matching venue or collective that
   has a night on that date shows as that night, never as a "Start" row.
2. Matching venues and collectives with no night on that date, with "Start".
3. Existing nights one day either side, with "Join".
4. "Add a venue or collective".

A night that matched only through a DJ adds "DJ Stingray 313 on the lineup". A search
that matches DJs but no venue or collective shows their nights, then "A new night needs a
venue or collective. Search for where it was." ADR 0008's "No, it's a different party"
becomes "A different party at Tresor?", under that venue's nights on the date.

**The event name field.** Label "Event name (optional)", and "Event name" where it is
required. Placeholder "Day Party". In the log form it sits below the review. The help
text stays as ADR 0016 set it: "Use the official name from the poster. Leave it empty if
the night didn't have one." The text under the required field is unchanged.

**Parts replaced.** ADR 0008's "Results come in two groups" and "Start a new night"
bullets, and its "No, it's a different party" wording, are replaced by the list above.
ADR 0016's label, placeholder ("Halloween"), and its required label "Name on the poster"
are replaced by the field above. Every rule for when a night is created, joined, or needs
a name stands.

## Consequences
- Fewer duplicate events: starting a second night at a venue that has one on the date
  takes a deliberate tap on "A different party at Tresor?".
- The picker query returns venues and collectives together with their nights on the
  chosen date, so each venue row knows whether to show "Join" or "Start". The existing
  index on `events (date, city_id)` and the trigram indexes cover it
  (`docs/DATA_MODEL.md`, Indexes).
- "Day Party" is a description, not a poster name, so it may invite descriptive names
  more than "Halloween" did. The help text and the setter's edit rule from ADR 0016 are
  the guard. Revisit if logs show many generic names.
- `SPEC.md` section 3 carries the full text.
