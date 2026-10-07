# Tasks

Read this at the start of every session. Work one task at a time. Delete a task when it is
done. Big decisions get an ADR in `docs/adr/`; rule changes get a line in
`docs/changelog.md`.

A milestone is a group of tasks that ships one usable slice of the app. Milestones run in
order.

## Decisions waiting on Bobby

- **City dataset.** The GeoNames cities export is the candidate for the seeded `cities`
  table. Confirm its license and attribution terms before loading it (unverified).
- **Design direction.** Collect 3 to 5 reference screenshots of sites, apps, or record
  sleeves. Then install the frontend-design plugin and use them with it.
- **Name and domain.** Check that "Peer Review" and a domain are available.

## Milestone 0: Setup

1. Scaffold Next.js and TypeScript with a `src/` folder. Prettier settings from code-style
   section 1, ESLint with a `max-lines` limit, Vitest with React Testing Library, and
   Playwright. Record every command in `CLAUDE.md`.
2. Add a `PostToolUse` hook on `Edit|Write` that runs Prettier and ESLint fix on the edited
   file. Add a permissions allowlist to `.claude/settings.json` for routine commands.
3. Add a screenshot script that captures a page at 375px and 1280px.
4. Add CI on GitHub Actions: typecheck, lint, test, build.
5. Create the Supabase project and local dev setup, a migrations folder, a way to test RLS
   policies, and `.claude/rules/supabase.md`.
6. Add to `docs/code-style.md`: server component data fetching, and the Next.js
   default-export exception for route files.
7. Write the rules not covered yet: where state lives and what may not hold it, when a new
   dependency is acceptable, what is committed versus generated, and the error and loading
   conventions.
8. Create the token file and `docs/style-guide.md` with the first styled component (the app
   shell).

## Milestone 1: Accounts

Sign-in with magic link and Google, handle and display name setup, the sign-in privacy
note, RLS tests proving email is never exposed, account deletion.

## Milestone 2: Venues, DJs, collectives

Cities seed and autocomplete. Venues with name, city, links, and sound tags. DJs and
collectives. Search-first creation with fuzzy duplicate suggestions. Link validation by
domain.

## Milestone 3: Events and logs

Log form, join-or-create event, lineup, overall and sub-ratings, public or private.

## Milestone 4: Pages

Log, event, venue, DJ, collective, profile with stats, search by name.

## Milestone 5: Social

Follow, feed, likes, comments.

## Milestone 6: Moderation

Report button, admin page (hide, merge, ban).

## Milestone 7: Share previews

Open Graph metadata and images for log, venue, and DJ pages.

## Milestone 8: Launch

Privacy page, PWA manifest, production deploy, sound systems seed.

## Later

- Venue-claimed pages, with an opt-in public location
- AI features: venue review summaries, log assist, visiting a city
- Photos
- Want-to-go list, custom lists
- Natural-language search ("clubs with Funktion-One")
- Upcoming events
- Notifications
