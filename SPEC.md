# Peer Review: v1 spec

## What it is

Letterboxd for club nights, aimed at the underground scene: house, techno, and rooms where
the sound system matters. Users log nights they attended, rate them, and read what others
thought.

## Launch audience

Online scene communities across many cities. Two consequences:
- Venues have to work in any city from day one.
- Links shared in forums and group chats are how people arrive, so shared pages need
  previews.

## v1 features

### 1. Accounts
- Sign in with an email magic link or Google.
- Handle required. Display name optional; the user decides what goes in it.
- Under the sign-in form: "Your email is only used to sign in. It is never shown to other
  users. Any address works, including an alias."

### 2. Venues, DJs, collectives
- Search first. If nothing matches, the user creates the entry. No verification.
- Duplicate suggestions use fuzzy name matching (Postgres `pg_trgm`), so "Tresor" and
  "Tresor Club" in the same city are flagged before a second entry is created.
- A venue has separate fields: a name (typed), a city (picked from the city list), optional
  links (Instagram, Resident Advisor, website), and optional sound system tags.
- Venues have no address, map pin, or coordinates. Many venues share their location
  themselves, and users find the venue through those channels (ADR 0003).
- Cities come from a seeded `cities` table: a list of world cities loaded once when the
  database is set up. Users pick from it with autocomplete, so every Berlin night points at
  the same Berlin.
- DJs and collectives have a name and optional links (Instagram, Resident Advisor,
  SoundCloud, Bandcamp, website).
- A DJ name containing "b2b" is refused, with a pointer to the "b2b with" button on the
  lineup. b2b sets are lineup slots, not DJs (section 3).
- Each link field accepts only its own domain. The Instagram field accepts only
  instagram.com links.
- Sound system tags come from a seeded list: Funktion-One, Void Acoustics, L-Acoustics,
  d&b audiotechnik, Danley, Martin Audio, Other.

### 3. Events
- An event is a date (the night it started), a city, a venue, a collective, or both, and an
  optional name (ADR 0008). A collective without a venue covers warehouse parties with no
  fixed home. A collective's party at a club has both.
- Per venue and date: one unnamed event, plus any number of named events with distinct
  names. This covers a day party and a night party at one club.
- Anyone logging an event can set its collective or name when it has none. Changing a value
  that is already set is admin only.
- An event is created when the first log or Going marker on it is saved, never earlier. If
  two users create the same event at the same moment, the second save joins the first.
- Event pages never show who created the event.
- Venue, DJ, and collective pages list an event only once it has at least one public log.
  Future events and nights logged only privately are reachable through the night picker
  only.
- An event with no logs and no Going markers left is deleted. If a log move caused it, the
  old URL redirects to the event the log moved to.

**The night picker.** The first step of the log form and the Going form. Venue and
collective nights work the same way.
- The date comes first and defaults to last night.
- One search box matches venue names, collective names, event names, and DJs on lineups.
- **Nights** lists existing events. Tapping one joins it. Nights on the chosen date come
  first, then nights one day either side. Each row starts with the date and shows the
  venue, collective, name, first three DJs, and the public log count when it is above zero.
  A night with no lineup shows "No lineup yet".
- **Start a new night** lists matching venues and collectives, then "Add a venue or
  collective". Tapping one starts a new event, created when the log is saved.
- Starting a new night at a venue or collective that already has a night on that date
  requires a name. Text under the field: "Tresor already has a night on Sat 4 Oct. Name
  this party so people can tell the two apart, for example 'Day party' or the collective
  running it." If a collective is picked, the field starts with its name.
- Starting a new night at a venue or collective that has a night one day either side shows
  one line first: "Tresor has a night on Fri 3 Oct. Nights that run past midnight go under
  the date they started."
- After the pick, the form shows the night at the top (venue, collective, name, date,
  lineup, public log count) with a "Change" link.

**Lineups.**
- A lineup slot is one set and holds one or more artists. A slot with several artists is a
  b2b set, shown as "A b2b B" with each name linking to its DJ page.
- Users add DJs to the lineup from the log or Going form. Each slot has a "b2b with" button
  that adds another artist to it.
- Typing "A b2b B" (also "B2B" and "b3b") in DJ search makes a b2b slot when every name
  exactly matches an existing DJ, with an undo. Otherwise the form suggests "Add as a b2b
  set: A + B". "&", "vs", and "x" only suggest, because duo names contain them.
- The user who added a slot can remove it until someone else has picked it in their log.
  After that, users report it with the reason "Didn't play" and an admin removes it.
  Removing a slot removes its picks and ratings. The logs stay.

### 4. Logs
- One log per user per event. Editable.
- At most 3 logs per user per date, for party hopping. Archived logs do not count.
- A log can only be created for an event dated today or earlier.
- Overall rating required: 0.5 to 5 in half steps.
- Optional review text.
- Public by default, with a private toggle per log.
- Optional sub-ratings sit in a section that starts collapsed, "Rate the sound, venue, and
  sets":
  - Sound and venue, 0.5 to 5. On a night with no venue, the venue rating rates the space
    the collective picked.
  - "Which sets did you listen to?" shows the lineup as buttons. Each set picked shows
    optional stars. On a lineup of one or two sets, they start picked.
- "Change night" on a log opens the night picker and moves the log. Everything carries
  over: ratings, review, and set picks. DJs the log picked that are not on the new lineup
  are added to it. The move is blocked when the user already logged that event or would
  pass 3 logs on its date.

### 5. Social
- Follow users.
- Feed of followed users' public logs, newest first.
- Likes and comments on logs.

### 6. Pages
- Log, event (with "12 listened to this set" per set), venue (averages, sound tags, links,
  recent logs), DJ (average set rating, links, recent logs, b2b sets labelled "b2b with
  B"), collective (with the average venue rating of its nights with no venue).
- A b2b set's rating counts toward each artist in it. Artist averages are computed solo,
  b2b, and combined. Pages show the combined average in v1.
- Profile with stats: nights logged, top venues, most listened to DJs (sets picked under
  "Which sets did you listen to?", b2b sets counting for each artist), this year.
- Search by name across venues, DJs, collectives, and users.

### 7. Moderation
- Report button on logs, comments, events, lineup slots, venues, DJs, and collectives.
  Reasons include "Duplicate" and, for lineup slots, "Didn't play".
- Admin page: report queue, hide content, merge duplicate entries (events, venues, DJs,
  collectives), ban users.
- Admin is a role flag on the profile.

**Merging two events.** The admin picks the event to keep and the one to merge in.
- Logs and Going markers move to the kept event, and the lineups combine without
  repeating a set. Set picks and ratings move to the kept event's slot with the same
  artists.
- The kept event takes the other's venue, collective, or name when it has none. When both
  have a different value, the admin picks.
- The 3 logs per date limit does not block a merge.
- The merged event's URL redirects to the kept event, so shared links keep working.
- A user with a log on both events keeps their most recently edited log on the event. The
  other log is archived: hidden from everyone and left out of averages, feeds, and stats,
  but still stored. The merge screen lists these users and both of their logs before the
  admin confirms.
- The user gets an in-app notice showing both logs, with two choices: "Keep the one
  showing" deletes the archived log, and "Switch to the other" puts the archived log on the
  event and deletes the newer one. If the user never answers, the newer log stays and the
  archived one stays hidden.

### 8. In-app notices
- A banner the user sees on their next visit, shown until they act on it or dismiss it.
- v1 uses it for event merges and Going prompts. It is the base for any later
  notifications.

### 9. Going
- On an event dated today or later, the user taps "Going". The event is picked or started
  with the night picker, the same as logging. Users can add DJs to the lineup in advance.
- No limit on markers per date.
- No note. The marker is the whole feature.
- Only the user sees their markers. No public count, no feed item, nothing on the event
  page. Markers appear in an "Upcoming" list on the user's own profile, visible only to
  them (ADR 0007).
- The morning after the event date, an in-app notice asks "You marked going to <event>.
  How was it?" with two choices: "Log it" opens the log form with the event filled in, and
  "I didn't go" removes the marker. Ignoring the notice leaves the marker in place.
- Markers do not count toward stats.

### 10. Share previews
- Open Graph metadata and image for log, venue, and DJ pages.

## Aggregation rules

- Averages use public, non-hidden, non-archived logs from non-banned users only.
- Private logs count toward the owner's own profile stats and nowhere else.
- Archived logs count nowhere until the owner restores one.

## Privacy

- Email is stored only to sign in. It is never in a public table, never returned by any app
  query, and not shown on the admin page. RLS enforces this, with tests.
- Known limit: the Supabase project owner can read `auth.users`. Hiding emails from the
  operator entirely needs sign-in with no email at all (passkeys only, no account
  recovery). Not in v1.
- Deleting an account deletes the user's logs, comments, likes, follows, and Going
  markers.

## Not in v1

- AI features (ADR 0006)
- Photos and video (ADR 0005)
- Venue addresses and maps (ADR 0003)
- Public upcoming event listings
- Natural-language search
- DMs, email or push notifications (in-app notices only)
- Custom lists, want-to-go list
- Followers-only visibility
- Verified or claimed venue and DJ pages
- Native app

## Data model sketch

| Table | Holds |
|---|---|
| `profiles` | Handle, optional display name, admin flag. Never the email |
| `cities` | Seeded list of world cities |
| `venues` | Name, `city_id`, links. No location |
| `sound_systems` | Seeded list of sound system brands |
| `venue_sound_systems` | Which sound systems a venue has |
| `artists` | One row per DJ: name, links |
| `collectives` | Name, city, links |
| `events` | Date, `city_id`, nullable `venue_id` and `collective_id` (at least one set), optional name. Per venue and date: one unnamed event, and named events with distinct names |
| `event_redirects` | Old event ID to new event ID, written by merges and by log moves that empty an event |
| `lineup_slots` | One row per set on an event, with who added it |
| `slot_artists` | The artists in a slot. More than one row means a b2b set |
| `logs` | A user's log of an event, with an `archived` flag. Unique on user and event among non-archived logs. At most 3 non-archived logs per user per date, enforced by a trigger |
| `set_listens` | A log's pick of one lineup slot under "Which sets did you listen to?", with an optional rating |
| `follows`, `likes`, `comments`, `reports` | Social and moderation |
| `going` | A user's private Going marker on an event. Unique on user and event |
| `notices` | In-app notices for a user, with the action taken and when |

## Stack and budget

- Next.js App Router, TypeScript, Supabase (Postgres, Auth, RLS), Vercel (ADR 0001).
- Vercel Hobby: non-commercial use only. Moving to Pro is required once there are ads or
  payments.
- Supabase free tier: 500 MB database, 50,000 monthly active users, and the project pauses
  after a week with no traffic.
- No paid APIs in v1.

## v1 is done when

20 people from the launch communities can sign up, log nights for a month, follow each
other, and comment on each other's logs.
