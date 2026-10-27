# 0018: Hosting and deploys

- Date: 2026-10-27
- Status: Accepted

## Context
ADR 0001 chose Vercel and Supabase. Before any feature, the app needs a production
deploy on `peerreview.club`, preview deploys per PR, and a hosted database whose schema
only changes through reviewed migrations. Auth redirects, cookies, and link previews in
Milestone 1 have to be tested on the real domain.

## Options considered
- **Region:** the Supabase project lives in Canada (`ca-central-1`) and cannot move after
  creation. Users elsewhere get slower requests, not a broken app, and one region is
  enough at this scale. Vercel functions run in Montréal (`yul1`), the same AWS region.
- **Preview deploys' database:** previews on the production database are simpler, but a
  preview with a bug can damage real data. A second free Supabase project as staging keeps
  previews away from it.
- **Deploy order:** Vercel's Git integration deploys on its own while CI applies
  migrations, so either can finish first. Deploying from CI after migrations makes the
  order strict, but needs a Vercel token in CI and more workflow code.
- **Paused projects:** free Supabase projects pause after 7 days of low activity. A
  scheduled job could keep the project awake, but that works against what the free tier
  is for. Resuming is one click, and real traffic keeps it awake after launch.

## Decision
- Vercel Hobby with its Git integration: production from `main`, a preview per PR.
  `peerreview.club` points at Vercel through Cloudflare DNS, with Cloudflare's proxy off.
  Functions run in `yul1` (`vercel.json`).
- Migrations reach the hosted project only through `.github/workflows/migrate.yml` on
  merges to `main`, which then runs the schema guard tests against it.
- Every migration works with the live app, since deploys and migrations run at the same
  time (`.claude/rules/supabase.md`).
- Previews use a separate staging project, created in Milestone 1 when the app first needs
  a database. Supabase keys go into Vercel by hand, per environment, not through the
  Supabase integration, which copies keys into every environment.
- Pausing is accepted until launch.

## Consequences
- A broken migration fails the Migrate run on `main` while the app may already be live.
  The fix is a new migration in a new PR.
- Vercel Hobby is for non-commercial use. Revisit before the app earns money.
- Revisit the deploy order if a change ever needs the new schema and the new code at the
  same moment.
