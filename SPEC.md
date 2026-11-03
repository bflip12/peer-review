# Peer Review: v1 spec

## What it is

Letterboxd for music nights, aimed at the underground scene: house, techno, and rooms where
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
- The handle and display name fields start empty. Nothing is copied from the Google
  profile (name or photo).
- Under the sign-in form: "Your email is only used to sign in. It is never shown to other
  users. Any address works, including an alias."

### 2. Venues, DJs, collectives
- Search first. If nothing matches, the user creates the entry. No verification.
- The user who created a venue, DJ, or collective can edit it until another user picks it
  in a form: joins or starts a night at the venue or with the collective, or adds or picks
  the DJ on a lineup. No time limit. After that, locals and admins edit it (section 7), and
  users report mistakes.
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
  SoundCloud, Bandcamp, website). A collective has an optional home city, used for display
  and search, never to match events.
- A DJ name containing "b2b" is refused, with a pointer to the "b2b with" button on the
  lineup. b2b sets are lineup slots, not DJs (section 3).
- DJs have an optional home city, picked from the city list, labelled "Where they're
  based" with the help text "Not where you saw them. Check their RA or Instagram if
  unsure." It tells apart two artists with the same name (ADR 0011). Empty means unknown;
  there is no "No home city" choice.
- When a new DJ's name matches an existing DJ exactly, ignoring case and surrounding
  spaces, the form shows "There's already a DJ called DJ Rush." above each existing one with
  its city, links, and "Use this DJ", then "Different person?" with the city field and "Add
  as a new DJ". The city is required when an existing DJ with that name has no city, and
  optional otherwise. Two DJs with the same name and city are refused.
- DJ search results show the city and the DJ's link sites beside the name. The DJ page
  shows the city under the name.
- Per user, over the last 24 hours, at most 10 venues, 10 collectives, 50 DJs, and 20 new
  events (ADR 0011). Locals and admins are exempt. At a cap the form shows "You've added 10
  venues today. You can add more tomorrow."
- Each link field accepts only its own domain. The Instagram field accepts only
  instagram.com links.
- Sound system tags come from a seeded list: Funktion-One, Void Acoustics, L-Acoustics,
  d&b audiotechnik, Danley, Martin Audio, Other.

### 3. Events
- An event is a date (the night it started), a city, a venue, one or more collectives, or
  both, and an optional name (ADR 0008, ADR 0010, ADR 0016). A collective without a venue
  covers warehouse parties with no fixed home. A collective's party at a club has both.
- Collectives on an event are equal co-hosts. The event shows on each of their pages.
- Per venue and date, among events not merged: one unnamed event, plus any number of named
  events with distinct names. This covers a day party and a night party at one club.
- Per collective and date, for events with no venue, among events not merged: one unnamed
  event, plus any number of named events with distinct names, counting every co-host.
  Collective nights at a venue fall under the venue rule.
- Names compare ignoring case and surrounding spaces.
- Dates are read in the event city's timezone. "Today" in any rule means today in that
  city.
- The name is the official name from the poster (ADR 0016, ADR 0020). Wherever it is
  asked, the field reads:
  - Label: "Event name (optional)"
  - Placeholder: "Day Party"
  - Help text: "Use the official name from the poster. Leave it empty if the night didn't
    have one."
  - In the log form it sits below the review.
- Anyone logging an event or marking Going on it can fill in its venue or name when it has
  none, and add a collective. The user who set the name can change or clear it until
  another user logs the night or marks Going on it after the name was set. Changing or
  removing any other value that is already set, and the name after that, is for locals and
  admins (section 7).
- Filling in a venue on a night with no venue is refused when the venue is in another city,
  or when the venue already has a night on that date that is also unnamed or has the same
  name. Adding a collective to a night with no venue is refused the same way when that
  collective already has such a night. The form says "Tresor already has a night on Sat 4
  Oct." and offers "Report as the same night", which files a "Duplicate" report (section 7).
- An event is created when the first log or Going marker on it is saved, never earlier. If
  two users create the same event at the same moment, the second save joins the first.
- Event pages never show who created the event.
- Venue, DJ, and collective pages list an event only once it has at least one public log.
  Future events and nights logged only privately are reachable through the night picker
  only.
- An event with no logs and no Going markers left is deleted. If a log move caused it, the
  old URL redirects to the event the log moved to.

**The night picker** (ADR 0008, ADR 0020). The first step of the log form and the Going
form. Venue and collective nights work the same way.
- The date comes first and defaults to last night.
- One search box, labelled "Where were you?" with the help text "Venue, collective, event
  name, or a DJ who played." It matches venue names, collective names, event names, and
  DJs on lineups.
- The results are one list. Users never choose between joining and creating: each row
  ends with what tapping it does, "Join" or "Start". In order:
  1. Existing nights on the chosen date, with "Join". A matching venue or collective that
     has a night on that date shows as that night, never as a separate "Start" row.
  2. Matching venues and collectives with no night on that date, with "Start". The row
     says "Venue" or "Collective", the city, and "No night logged on Sat 4 Oct yet".
     Tapping one starts a new event, created when the log is saved.
  3. Existing nights one day either side, with "Join".
  4. "Add a venue or collective".
- A night row starts with the date and shows the venue, collective, name, first three
  DJs, and the public log count when it is above zero. A night with no lineup shows "No
  lineup yet". A night that matched only through a DJ adds "DJ Stingray 313 on the
  lineup".
- When the search matches DJs but no venue or collective, the list shows the nights those
  DJs played, then "A new night needs a venue or collective. Search for where it was."
- Under the nights of a venue or collective on the chosen date: "A different party at
  Tresor?". It shows the name field, required, with the label "Event name". Text under
  the field: "Tresor already has a night on Sat 4 Oct. Add the name from the poster so
  people can tell the two apart." If a collective is picked, the field starts with its
  name.
- Starting a new night at a venue or collective that has a night one day either side shows
  one line first: "Tresor has a night on Fri 3 Oct. Nights that run past midnight go under
  the date they started."
- After the pick, the form shows the night at the top (venue, collective, name, date,
  lineup, public log count) with a "Change" link. A joined night with no name shows the
  optional name field.

**Lineups.**
- A lineup slot is one set and holds one or more artists. A slot with several artists is a
  b2b set, shown as "A b2b B" with each name linking to its DJ page.
- Users add DJs to the lineup from the log or Going form. Each slot has a "b2b with" button
  that adds another artist to it, until someone other than the person who added the slot
  has picked it. After that, a different b2b is a new slot.
- Typing "A b2b B" (also "B2B" and "b3b") in DJ search makes a b2b slot when every name
  exactly matches an existing DJ, with an undo. Otherwise the form suggests "Add as a b2b
  set: A + B". "&", "vs", and "x" only suggest, because duo names contain them.
- A slot never gets a different DJ, so a rating given to A never counts for B (ADR 0013).
  A wrong slot is removed and the right one added as a new slot.
- The user who added a slot can remove it until someone else has picked it in their log.
  After that, users report it with the reason "Didn't play", with an optional "Who played
  instead?", and a local or admin corrects the lineup (section 7).
- A removed slot is left out of the lineup, and its picks and ratings stop counting and
  are left out of logs. They stay stored, and reverting the removal brings them back. The
  logs and their reviews are not changed.
- Lineups leave out hidden DJs. A slot whose DJs are all hidden is left out.

### 4. Logs
- One log per user per event. Editable.
- At most 3 logs per user per date, for party hopping.
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
- **Original logs.** Each log keeps a private copy of its night, readable only by the
  owner (ADR 0015).
  - The copy freezes the date, city, event name, venue, collectives, lineup, and the
    user's set picks with their stars, as they were when the owner last saved the log. The
    ratings and review always show the current version.
  - Saving the log or its picks, or "Change night", replaces the copy. Edits by other
    users, lineup corrections, and merges never change it. A pick on a slot removed before
    the save stays in the copy, marked "Removed from the lineup".
  - The copies are listed on an "Original logs" page on the user's own profile, newest
    first. Nothing shows on the log itself. A row whose night has changed since the last
    save shows "Changed since you saved it". The owner's menu on a log has "View
    original", which opens its entry.
  - The page starts with: "A private copy of each of your logs, showing the night as it was
    when you last saved the log. Other people can correct a night's name, venue, or lineup.
    Those corrections show on your logs, but not here. Your rating and review always show
    your latest version. Only you can see this page."

### 5. Social
- Follow users.
- Feed of followed users' public logs, newest first.
- Likes and comments on logs.
- Comments are flat. The author can edit a comment, which shows "edited", or delete it,
  which leaves "Comment deleted". The log owner cannot delete other people's comments;
  reports go to admins.

### 6. Pages
- Log, event (with "12 listened to this set" per set), venue (sound tags, links, recent
  logs), DJ (links, recent logs, b2b sets labelled "b2b with B"), collective.
- No averages in v1, shown or calculated. Pages focus on logs and people, not scores (ADR
  0010, ADR 0014). Ratings are stored, so the averages planned for later (venue rating per
  venue, set rating per DJ solo, b2b, and combined, and venue rating of a collective's
  nights with no venue) are queries added by the ADR that shows them.
- URLs: `/venues/<id>/<name>`, `/djs/<id>/<name>`, `/collectives/<id>/<name>`,
  `/events/<id>/<name>`, `/logs/<id>`, `/@handle`. The short ID finds the page, and an
  outdated name part redirects. A handle change does not redirect the old profile URL.
- Profile with stats: nights logged, top venues, most listened to DJs (sets picked under
  "Which sets did you listen to?", b2b sets counting for each artist), this year.
- The user's own profile links to their private pages: "Upcoming" (section 9) and
  "Original logs" (section 4).
- Search by name across venues, DJs, collectives, and users.

### 7. Moderation
Three roles: user, local, and admin (ADR 0009). Admins can do everything locals can. In the
data model and code the local role is `moderator`; "Local" is its label in the app (ADR
0010).

- Report button on logs, comments, events, lineup slots, venues, DJs, and collectives.
  Reasons include "Duplicate" and, for lineup slots, "Didn't play".
- Locals fix the catalog. Each local has one or more cities, shown on their profile as
  "Berlin local". In v1 the cities are not enforced, and a local can act anywhere. Locals:
  - Edit venues, DJs, and collectives: name, city, links, sound tags.
  - Change an event's venue, collective, or name when it is already set. The user who set
    a name can still change it until someone else logs the night (section 3).
  - Work the catalog report queue: "Didn't play", and any report on a venue, DJ,
    collective, event, or lineup slot other than "Duplicate". Reporters are not shown.
  - Correct lineups in three ways: remove a slot, remove one DJ from a b2b slot, or switch
    a DJ to another entry with the same name. Removing one DJ is refused when the slot
    would then match another slot on that night: "A is already listed solo on this night.
    Remove this slot instead."
- Admins also handle "Duplicate" reports and reports on logs, comments, and users, hide
  content, ban users, and assign roles.
- No merges in v1. Merges and merge undo ship together after launch (ADR 0014). Until then
  a "Duplicate" report shows the admin both entries, linked, and the description. "Not a
  duplicate" closes it; a real duplicate stays open for the merge milestone. A user who
  logged the wrong one of two nights fixes it with "Change night".
- Every edit to a venue, DJ, collective, event, or lineup slot is recorded with who made
  it, the field, the old value, the new one, and when. Slot changes are listed in their
  event's history.
  - Each entry has a history list with a "Revert" button on each row, for locals and
    admins.
  - A revert is itself an edit, so it shows in the history and can be reverted.
  - A revert that would put two slots with the same DJs on one night is refused. The local
    removes the other slot first.

**Duplicate reports.** A wrong merge moves real logs to the wrong place, for example when
someone confuses two real venues. The report gives the admin what they need to check.
- "Which one is it a duplicate of?" Required. A search of the same type: venues for a
  venue, nights for a night.
- A description, required, with a label and help text per type:
  - Venue, "Describe the place": "What would a regular recognize? The entrance, the
    layout, where the bar or booth is, anything specific to that room. Two different names
    can still be one place."
  - Night, "Describe the night": "Who played and when, which room, anything that shows
    both listings are the same party."
  - Collective, "Describe the parties": "Where they run them, what the nights are like,
    anything that shows both listings are the same crew."
  - DJ, "Describe how you know": "An alias they play under, a set you saw billed under both
    names, anything that shows it's one person."
- The admin sees the description without the reporter's name.

#### After launch: merges (ADR 0014)

These rules ship with merge undo. They are kept here so the merge milestone starts from
them.

- The duplicate report opens a screen with the two entries side by side (city, links,
  recent nights and lineups), matching links highlighted. "Merge" opens the merge summary
  with both entries filled in. "Not a duplicate" closes the report.

**Merge summary.** Every merge shows a summary before it is confirmed.
- Each pair of events that will merge (date, venue, collective, name, lineup, log count),
  the users with a log on both, the slots that combine, and the fields where the merger
  picks a value.
- Public logs are shown in full. Private logs are shown only as a count, to admins too.

**Merging.** The merger picks the entry to keep and the one to merge in.
- The merged entry keeps its row with `merged_into_id` set to the kept entry. Its URL
  redirects to the kept entry, so shared links keep working. It is left out of search, the
  night picker, and pages, and nothing new can point at it: no log, Going marker, slot,
  event, or edit.
- Events: logs and Going markers move to the kept event, and the lineups combine without
  repeating a set. Set picks and ratings move to the kept event's slot with the same
  artists. The kept event takes the collectives of both. It takes the other's venue or
  name when it has none, and when both have a different one, the merger picks.
- Venues: events move to the kept venue. Nights at both venues on the same date that would
  then both be unnamed, or share a name, are listed with "Merge" selected. For each pair,
  the merger either merges the two nights or names one of them.
- Collectives: events move to the kept collective. Nights of both collectives on the same
  date with no venue are listed the same way.
- DJs: lineup slots point at the kept DJ. A b2b slot that ends up with the same DJ twice
  becomes a solo set. Two slots on one event that end up with the same artists combine, and
  a log that picked both keeps its pick on the kept slot.
- The 3 logs per date limit does not block a merge.
- A user with a log on both events keeps their most recently edited log on the event. The
  other log is archived: hidden from everyone and left out of averages, feeds, and stats,
  but still stored.
- The user gets an in-app notice showing both logs, with two choices: "Keep the one
  showing" closes the notice, and "Switch to the other" swaps which of the two is archived.
  Neither choice deletes a log.
- An "Archived" section on the user's own profile, visible only to them, lists archived
  logs with the reason ("Archived when two listings of this night were merged"), a link to
  the night, and "Switch to the other". The user can delete an archived log there.

### 8. In-app notices
- A banner the user sees on their next visit, shown until they act on it or dismiss it.
- v1 uses it for Going prompts (section 9). Event merge notices come with merges (ADR
  0014). It is the base for any later notifications.

### 9. Going
- On an event dated today or later, the user taps "Going". The event is picked or started
  with the night picker, the same as logging. Users can add DJs to the lineup in advance.
- No limit on markers per date.
- No note. The marker is the whole feature.
- Only the user sees their markers. No public count, no feed item, nothing on the event
  page. Markers appear in an "Upcoming" list on the user's own profile, visible only to
  them (ADR 0007).
- At 12:00 on the day after the event date, in the event city's time, an in-app notice
  asks "You marked going to <event>. How was it?" with two choices: "Log it" opens the log form with the event filled in, and
  "I didn't go" removes the marker. Ignoring the notice leaves the marker in place.
- Markers do not count toward stats.

### 10. Share previews
- Open Graph metadata and image for log, venue, and DJ pages.

## Aggregation rules

- Averages, once shown, use public, non-hidden, non-archived logs from non-banned users
  only.
- Private logs count toward the owner's own profile stats and nowhere else.
- Archived logs (from merges, after launch) count nowhere until the owner switches to one.
- Picks and ratings on removed slots, and on hidden DJs, count nowhere.
- v1 has no averages (section 6). Before any is shown, it needs a minimum number of public
  logs from different users, and a rule for logs from new accounts, so a handful of
  accounts cannot set a venue's or DJ's score. The numbers are set in the ADR that turns
  averages on.

## Privacy

- Email is stored only to sign in. It is never in a public table, never returned by any app
  query, and not shown on the admin page. RLS enforces this, with tests.
- Known limit: the Supabase project owner can read `auth.users`. Hiding emails from the
  operator entirely needs sign-in with no email at all (passkeys only, no account
  recovery). Not in v1.
- Deleting an account deletes the user's logs (with their original copies), comments,
  likes, follows, and Going markers.

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
- Limiting locals to their cities
- Merges and merge undo (ADR 0014). The undo rules are in ADR 0009
- The admin "Recent edits" page with bulk revert (ADR 0014)
- Native app

## Data model

Tables, constraints, indexes, and visibility rules are in `docs/DATA_MODEL.md`.

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
