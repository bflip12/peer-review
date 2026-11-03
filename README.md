# Peer Review

Letterboxd for club nights. Log a night you went to, rate the sound, the venue, and each
DJ set, and read what other people thought. Built for the underground scene: house,
techno, and rooms where the sound system matters.

Live at [www.peerreview.club](https://www.peerreview.club).

## Status

In development. Accounts are done: sign-in with an email link or Google, handles, and
account deletion. Venues, DJs, and collectives are being built now. Logging nights,
profiles, following, and the feed come next. The full plan, milestone by milestone, is in
[`TASKS.md`](TASKS.md).

## What it does

- Log a night: the date, where it was, and who played. Rate the night, the sound, and the
  venue, and pick the sets you listened to.
- One shared catalog of venues, DJs, collectives, and nights, built by the people using
  it. Search comes first, with fuzzy duplicate checks, so two people at the same party
  end up on the same night.
- Venues work in any city from day one, picked from a seeded list of world cities.
- Each log is public, followers only, or private. Email addresses are never shown.

The product spec is [`SPEC.md`](SPEC.md).

## How it's built

- **Next.js** (App Router) and **TypeScript**, deployed on **Vercel**. Every pull request
  gets a preview deployment.
- **Supabase**: Postgres, Auth, and row-level security. Every table has explicit grants
  and RLS policies, and database tests check them through the same API the browser uses.
- **CI** on GitHub Actions runs typecheck, lint, format, unit tests, and the build. A
  second job starts a local Supabase stack, runs the database tests and the Playwright
  end-to-end tests, and checks that the generated database types are current.
- **Migrations** reach the staging and production databases only through a workflow that
  runs on merges to `main`. None are applied by hand.

## How it's made

I build Peer Review with Claude Code as a pair: it drafts, researches, reviews, and lays
out options, and I make the calls. These files are the record of that work.

| File | What it holds |
| --- | --- |
| [`docs/ai-log.md`](docs/ai-log.md) | How I use AI at each stage, from the first idea to code, and which calls were mine. |
| [`docs/adr/`](docs/adr/README.md) | Architecture decision records: each big decision, the options, and why. |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Tables, constraints, indexes, and who can read what. |
| [`docs/style-guide.md`](docs/style-guide.md) | The design: type, color, spacing, and components. |
| [`docs/changelog.md`](docs/changelog.md) | Dated changes to the rules and workflow, with the reason for each. |
| [`CLAUDE.md`](CLAUDE.md), [`.claude/`](.claude) | The rules and skills the agent works under. |

## Running it locally

Needs Node 22.18 or later and Docker.

```bash
npm ci
```

```bash
npm run db:start
```

```bash
npm run db:env
```

```bash
npm run dev
```

`db:start` starts a local Supabase stack and applies every migration. `db:env` writes its
URL and key to `.env.local`. The rest of the commands are listed in
[`CLAUDE.md`](CLAUDE.md).

## Contributing

This is a personal project, and it doesn't take issues or pull requests.

## License

Copyright Bobby Filippopoulos. All rights reserved. The code is public to read. It is not
licensed for reuse.
