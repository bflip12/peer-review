# 0008: One night picker for every event, and lineup slots for b2b sets

- Date: 2026-10-09
- Status: Accepted, amended by 0010, 0013, 0014, 0016, and 0020

## Context
A review of the logging flow against apps with community-built catalogs (Untappd,
setlist.fm, Concert Archives, MusicBrainz) found that search before create does not stop
duplicates by itself. The apps that work make joining an existing entry the default and
creating a new one the fallback, and they let users fix their own mistakes.

ADR 0002 left these gaps:
- An event had a venue or a collective. A collective's party at a club could be logged once
  under the venue and once under the collective, and nothing caught it.
- Venue nights joined automatically and collective nights asked "Is this your night?". The
  same action behaved differently for a reason users cannot see, and a second party at a
  venue on the same date had no way in.
- A user who picked the date they arrived (2am Sunday) instead of the date the night
  started created a second event with no prompt.
- A lineup slot held one DJ, so b2b sets would be created as fake DJs ("A b2b B").
- "Most-seen DJs" counted every DJ on the lineup, which is wrong for multi-room nights.
- A log could not move to another event, so every wrong pick needed an admin merge.

## Options considered
- **Keep ADR 0002 and add more matching on top.** Less to change, but the venue and
  collective paths stay different and the two-entry-point duplicate stays.
- **One picker for every event, with venue and collective both allowed on an event.** One
  rule to learn. Uniqueness moves from venue and date to venue, date, and name.
- **Explicit event pages created before logging.** Rejected again for the reasons in ADR
  0002: more friction, more duplicates.

For b2b sets:
- **A b2b entity** (an artist row standing for a pairing). Creates its own duplicates ("A
  b2b B" and "B b2b A") and needs a link to its members anyway.
- **A lineup slot that holds several artists.** One rating per set, counted toward each
  artist. A page for a recurring pairing can be built later from slots with the same
  artists.

For what a user heard:
- **Count the whole lineup.** No input needed, wrong on multi-room nights.
- **Count rated sets only.** Most users skip set ratings, so stats stay thin.
- **The user picks the sets they listened to, with an optional rating each.** One tap per
  set, and the form shows stars only for the sets picked.

## Decision
**Events.**
- An event is a date (the night it started), a city, a venue, a collective, or both, and an
  optional name. At least one of venue and collective is set.
- Per venue and date: one unnamed event, plus any number of named events with distinct
  names (case-insensitive).
- Anyone logging an event can set its collective or name when it has none. Changing a value
  that is already set is admin only.
- An event is created when the first log or Going marker on it is saved, never earlier.
- If two users create the same event at the same moment, the second save joins the first.

**The night picker** (the first step of the log form and the Going form).
- The date comes first and defaults to last night.
- One search box matches venue names, collective names, event names, and DJs on lineups.
- Results come in two groups. "Nights" lists existing events; tapping one joins it. Nights
  on the chosen date come first, then nights one day either side. Each row starts with the
  date and shows the venue, collective, name, first three DJs, and the public log count when
  it is above zero. A night with no lineup shows "No lineup yet".
- "Start a new night" lists venues and collectives, then "Add a venue or collective".
  Tapping one creates the event when the log is saved.
- Starting a new night at a venue or collective that already has a night on that date
  requires a name. Text under the field says why: "Tresor already has a night on Sat 4 Oct.
  Name this party so people can tell the two apart, for example 'Day party' or the
  collective running it." If a collective is picked, the field starts with its name.
- Starting a new night at a venue or collective that has a night one day either side shows
  one line first: "Tresor has a night on Fri 3 Oct. Nights that run past midnight go under
  the date they started."

**Logs.**
- One log per user per event, and at most 3 non-archived logs per user per date, for party
  hopping. Going markers have no limit.
- "Change night" on a log moves it to another event. Everything carries over: ratings,
  review, and set picks. DJs the log picked that are not on the new lineup are added to it.
  The move is blocked when the user already logged the target event or would pass 3 logs
  on its date.
- When a move, a deleted log, or a removed Going marker leaves an event with no logs and no
  markers, the event is deleted. If a move caused it, the old event URL redirects to the
  new one.

**Lineups.**
- A lineup slot is one set and holds one or more artists. A slot with several artists is a
  b2b set. Whether a slot is b2b is worked out from its artist count, never stored.
- Each slot has one rating per log. A b2b rating counts toward each artist in it. Artist
  views return solo, b2b, and combined averages so they can be shown apart later.
- Typing "A b2b B" (also "B2B" and "b3b") in DJ search makes a b2b slot when every name
  exactly matches an existing DJ, with an undo. Otherwise the form suggests "Add as a b2b
  set: A + B". "&", "vs", and "x" only suggest. Creating an artist with "b2b" in the name is
  refused with a pointer to the "b2b with" button.
- The user who added a slot can remove it until someone else has picked it. After that,
  logs report it with the reason "Didn't play" and an admin removes it. Removing a slot
  removes its picks and ratings. The logs stay.

**Listened.**
- The log form asks "Which sets did you listen to?" and shows the lineup as buttons. Each
  set picked shows optional stars. On a lineup of one or two sets, they start picked.
- Profile stats show "Most listened to DJs". Event pages show "12 listened to this set".

**Visibility.**
- Venue, DJ, and collective pages list an event only once it has at least one public log.
  This covers future events and nights logged only privately.

**Merges** (additions to the rules in `SPEC.md`).
- The kept event takes the other's venue, collective, or name when it has none. When both
  have a different value, the admin picks.
- Set picks and ratings move to the kept event's slot with the same artists.
- The 3-per-date limit applies to user actions, not to merges.

## Consequences
- ADR 0002 is superseded. Its core idea stands: a venue and a date identify a night, and
  logging one that exists joins it.
- The "Is this your night?" prompt is gone. The night picker covers venue and collective
  nights the same way.
- Users fix most of their own duplicates by moving a log. An admin merge is needed only
  when a duplicate event has logs from more than one user.
- Stats need users to pick sets. A user who never does has no "Most listened to" stats.
- Data model: `events` gets nullable `venue_id` and `collective_id` with a check that one is
  set, and two unique indexes for venues. `lineup_slots` drops its artist column for a
  `slot_artists` table. `set_ratings` becomes `set_listens` with a nullable rating. A
  trigger enforces 3 logs per date, and another deletes empty events.
- A night that exists in the picker with no public logs shows that someone logged it or
  marked it, never who. ADR 0007 already accepts this for Going markers.
- Reports gain lineup slots as a target and "Didn't play" as a reason.
