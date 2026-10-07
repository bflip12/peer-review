# 0006: No AI features in v1

- Date: 2026-10-07
- Status: Accepted

## Context
The original idea included AI venue recommendations for a city the user is visiting. The
launch audience is spread across many cities, so most cities would have too few reviews for
recommendations to be useful at launch.

## Options considered
- **Visiting a city.** Venues in a city ranked from reviews, with an AI summary. Needs review
  density the app will not have at launch.
- **Venue review summaries.** An AI summary per venue once it has a few reviews. Works per
  venue, no city density needed.
- **Log assist.** The user writes how the night went and AI fills the form. Helps from day
  one, adds a confirm step to the log form.
- **No AI in v1.** Ship logging and social first.

## Decision
No AI features in v1. Duplicate detection for venues, DJs, and collectives uses Postgres
fuzzy matching (`pg_trgm`), which needs no AI.

## Consequences
- No AI API cost or keys in v1.
- Venue review summaries, log assist, and visiting a city stay on the list for later.
  Review data collected in v1 feeds them.
