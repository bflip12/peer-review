# 0003: Venues have no address or map location in v1

- Date: 2026-10-07
- Status: Accepted

## Context
Many venues in this scene do not list an address publicly. Some share the location only
with attendees, sometimes only on the night. Some are not on Google Maps at all. A user
creating a venue entry cannot be trusted to know which venues want their location kept
private, and may pin it anyway.

## Options considered
- **Google Places autocomplete with a manual fallback.** Best typing experience for listed
  venues. Costs money past the free allowance, has terms on storing coordinates, and still
  lets users pin private venues manually.
- **Places plus a "location not public" flag per venue.** Depends on the user creating the
  venue knowing the venue's wishes.
- **No location at all.** A venue is a name, a city, and links to its own channels.

## Decision
A venue has a name, a city picked from a seeded city list, and optional links (Instagram,
Resident Advisor, website). No address, no map pin, no coordinates. Users find the venue
through the venue's own channels.

## Consequences
- No private location can leak through the app.
- No Places API cost or terms, and no PostGIS in v1.
- No map view and no "near me". Location features work at city level only.
- A seeded `cities` table is needed so every Berlin night points at one Berlin. The GeoNames
  cities export is the candidate; its license is unconfirmed.
- Precise location can return later as an opt-in, set by a venue that claims its page.
