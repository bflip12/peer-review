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
- Each link field accepts only its own domain. The Instagram field accepts only
  instagram.com links.
- Sound system tags come from a seeded list: Funktion-One, Void Acoustics, L-Acoustics,
  d&b audiotechnik, Danley, Martin Audio, Other.

### 3. Events
- An event is a date (the night it starts), a city, and a venue or a collective. A
  collective without a venue covers warehouse parties with no fixed home.
- Users add DJs to the lineup. Optional event name.
- Event pages never show who created the event.
- An event dated in the future is not listed on venue, DJ, or collective pages until its
  date has passed. It is reachable through the log and Going forms only.

**Venue nights.** Logging a venue and date that already exists joins that event instead of
creating a new one (ADR 0002). The form shows the event it joined: venue, city, date,
lineup so far, and how many people logged it. The user can add missing DJs.

**Collective nights with no venue.** Two events by one collective on one date can be
real (a day party and a night party), so the app asks instead of deciding:
- If the collective already has an event on that date, the form asks "Is this your
  night?" and shows that event's name, lineup, and log count.
- "Yes, log this night" joins it. The user can add missing DJs.
- "No, it was a different party" creates a new event. The event name is required in this
  case, so the two events can be told apart.
- With no match, the form goes straight to the lineup and ratings.

### 4. Logs
- One log per user per event. Editable.
- A log can only be created for an event dated today or earlier.
- Overall rating required: 0.5 to 5 in half steps.
- Optional sub-ratings: sound, venue, and each DJ set in the lineup.
- Optional review text.
- Public by default, with a private toggle per log.

### 5. Social
- Follow users.
- Feed of followed users' public logs, newest first.
- Likes and comments on logs.

### 6. Pages
- Log, event, venue (averages, sound tags, links, recent logs), DJ (average set rating,
  links, recent logs), collective.
- Profile with stats: nights logged, top venues, most-seen DJs, this year.
- Search by name across venues, DJs, collectives, and users.

### 7. Moderation
- Report button on logs, comments, events, venues, DJs, and collectives. Reasons include
  "Duplicate".
- Admin page: report queue, hide content, merge duplicate entries (events, venues, DJs,
  collectives), ban users.
- Admin is a role flag on the profile.

**Merging two events.** The admin picks the event to keep and the one to merge in.
- Logs and Going markers move to the kept event, and the lineups combine without
  repeating a DJ.
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
- On an event dated today or later, the user taps "Going". If the event does not exist,
  it is created with the same matching rules as logging: venue nights join automatically,
  collective nights get "Is this your night?". Users can add DJs to the lineup in advance.
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
| `events` | Date, `city_id`, `venue_id` or `collective_id`, optional name. Unique on venue and date when a venue is set |
| `lineup_slots` | One row per DJ per event: who played that night |
| `logs` | A user's log of an event, with an `archived` flag. Unique on user and event among non-archived logs |
| `set_ratings` | A log's rating of one lineup slot |
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
