# 0002: An event is a date plus a venue or a collective

- Date: 2026-10-07
- Status: Accepted

## Context
The core thing a user logs is a night out. Several people log the same night, and their
logs need to land on one event page so ratings combine. Some nights have no fixed venue:
warehouse parties and pop-ups run by a collective.

## Options considered
- **Explicit event pages.** A user creates a named event first, and others log against it.
  Cleaner pages, but more friction and more duplicate events.
- **Venue plus date identifies the event.** Picking a venue and a date either joins the
  existing event or creates it. Little friction, and duplicates are prevented by a unique
  constraint.
- **Log entities directly** (rate a club or a DJ with no event). Simpler, but loses the
  night itself.

## Decision
An event is a date (the night it starts), a city, and a venue or a collective. Venue plus
date is unique. Logging a venue and date that already exists joins that event. Users add
DJs to the lineup. The event name is optional.

## Consequences
- One log per user per event. Sub-ratings for each DJ set attach to lineup slots.
- Two separate events at one venue on one date cannot be represented. Revisit if users
  report it.
- Collective-only events cannot be deduplicated by a constraint. Fuzzy matching on
  collective and date suggests existing events instead.
