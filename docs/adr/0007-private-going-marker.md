# 0007: A private "Going" marker for future events

- Date: 2026-10-07
- Status: Accepted, amended by 0014

## Context
v1 covered only nights that already happened. Users also want to mark nights they plan to
attend. A log is shared after the night, but "going" says where someone will be and when.
For this audience, publishing that is a safety risk: anyone can follow anyone, and follows
need no approval.

## Options considered
- **Public.** Everyone sees who is going. Most social, and anyone can see where a person
  will be on a given night.
- **Count public, names to followers.** Everyone sees how many are going; followers see
  names. Follows need no approval, so a stranger can follow to see someone's plans.
- **Count public, names to mutual follows.** Names show only to people the user follows
  back. Real protection, still social between friends.
- **The user chooses per event.** Most flexible, with a choice on every marker and more
  screens and tests.
- **Only the user.** No social signal. The marker becomes a reminder that turns into a log
  prompt.
- A short note on the marker was also considered. It adds context but invites promoters to
  post ticket links and adds text to moderate.

## Decision
A private "Going" marker on events dated today or later. No note. Only the user sees it, in
an "Upcoming" list on their own profile. The morning after the event, an in-app notice
offers "Log it" or "I didn't go".

## Consequences
- Plans give no social signal in v1: no counts, no feed items.
- Events can now have future dates. They stay off venue, DJ, and collective pages until
  their date passes, so public upcoming listings remain out of v1, and event pages never
  show who created an event.
- Logs are limited to events dated today or earlier.
- Reuses the in-app notices built for event merges (Milestone 6), so Going ships after it.
- If a social version is wanted later, mutual-follow visibility is the starting point.
