# Design references

Bobby's references for the design direction (`TASKS.md`, "Design direction"). The mockups
are for style only. Layout, flows, and content come from `SPEC.md` and the ADRs.

- `mockups-1.webp`, `mockups-2.webp`, `mockups-3.webp`: three sheets of AI mockups, light
  and dark, desktop and phone.
- `typography-note.png`: a suggestion to look at Forma DJR Mono. Bobby is not sure about
  the type direction, so this is a lead, not a decision.
- ra.co, taken lightly. Peer Review should not look like a copy of it.

The three directions Bobby named:
- **Editorial publication:** typography, hierarchy, deliberate spacing, a strong light
  mode.
- **Music database:** structured ratings, artist and venue pages, searchable histories.
- **Old internet community:** personal profiles, chronological feeds, niche terminology,
  understated social interactions.

## What to keep

- Paper and ink. A warm off-white page, near-black text, and a near-black dark mode.
  Light mode is the main one.
- Hairline rules instead of boxes and shadows. Small uppercase section labels ("SETS",
  "RECENT LOGS"). Generous margins on desktop.
- Numbered lineups ("01 DJ Nobu"), stat rows ("42 nights / 87 logs / 18 following"), and
  the "PeerReview.club" wordmark with a smaller ".club".
- The phone feed card in `mockups-1.webp`: handle, action, night, then the sub-ratings in
  a row.

## Where the spec wins over the mockups

- **No photos (ADR 0005).** Every mockup leans on photos and avatars. v1 has neither, so
  type, rules, and spacing carry the page.
- **Ratings are 0.5 to 5 in half steps.** The mockups mix 9.4, 4.8, and a 5 to 10 picker.
  One scale everywhere, shown as stars and the number.
- **No averages (ADR 0014).** No "Popular Clubs 4.8 (312)", no "Trending", no per-set
  averages. Event pages show "12 listened to this set".
- **The log form starts with the overall rating** (required), then the review and the
  private toggle. Sound, venue, and sets sit in the collapsed "Rate the sound, venue, and
  sets" section. There is no crowd rating.
- **Not in the data model:** set times, event tags, genre tags, and "people went". Going
  markers are private (ADR 0007).
- **Words:** "log", not "review", on buttons and counts.

## Typography

- An all-mono UI suits numbers and metadata, but long reviews are tiring to read in it.
- Forma DJR Mono needs a paid license. Free monos with the same precision: IBM Plex Mono,
  JetBrains Mono, Geist Mono, Martian Mono, Commit Mono.
- Lean: mono for data (ratings, dates, counts, labels), a second family for headings and
  review text. The three directions test this.

## Sites to look at

Listed from memory, not checked live.

- Editorial: NTS, The Wire, Bandcamp Daily, Berghain's program page.
- Music database: Letterboxd (diary and log cards), setlist.fm (venues, dates, lineups),
  RateYourMusic, Discogs, Last.fm profiles (top artists, close to "Most listened to DJs").
- Old internet community: Are.na, lobste.rs, Hacker News, MetaFilter.
