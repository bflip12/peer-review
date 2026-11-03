# Peer Review

Letterboxd for music nights. Log a night, rate the sound, the venue and each DJ set, and
follow people. Product: `SPEC.md`. Backlog: `TASKS.md`. Decisions: `docs/adr/`.
Owner: Bobby Filippopoulos, software developer.

## Stack
Next.js App Router, TypeScript, Supabase (Postgres, Auth, RLS), Vercel.

## Commands
Do not guess a command that is not listed here. Node 22.18 or later, npm.
- `npm run dev`, `npm run build`, `npm run start`: Next.js dev server, build, and server.
- `npm run typecheck`: generates route types, then runs `tsc`.
- `npm run lint`: ESLint, then Stylelint, failing on any warning. `npm run format` writes
  Prettier, `npm run format:check` checks.
- `npm test`: Vitest once. `npm run test:watch`: Vitest in watch mode.
- `npm run e2e`: Playwright, starting the dev server. With `CI` set it runs
  `npm run start`, so run `npm run build` first.
- `npm run screenshot -- / /other/route`: full-page PNGs of each route at 375px and
  1280px in `screenshots/`. Starts the dev server if nothing answers on port 3000. Add
  `--as=user` to capture signed in as `@dj_rush`, or `--as=new` as a user who has not
  picked a handle. Either needs the local stack (`npm run db:start`).
- `npm run db:start`, `npm run db:stop`: the local Supabase stack (Docker). `db:start`
  applies every migration. `npm run db:reset` reapplies them to an empty database.
- `npm run db:env`: writes the local stack's Supabase URL and publishable key to
  `.env.local`, which `npm run dev`, `npm run build`, and `npm run e2e` need.
- `npm run db:types`: regenerates `src/lib/supabase/database.types.ts` from the local
  schema. `npm run test:db`: database tests in `supabase/tests/`, against the local stack.
- `npm run db:cities -- supabase/migrations/<timestamp>_seed_cities.sql`: downloads the
  GeoNames files and writes the cities seed migration into that file (ADR 0025). Create the
  file first with `npx supabase migration new seed_cities`. Needs `unzip`.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, the format check, unit tests, and
the build on every PR and every push to `main`, on the Node version in `.nvmrc`. A second
job starts the local stack, runs the database tests, checks the generated types are
current, and runs e2e, which signs in against the stack.

Deploys (ADR 0018): Vercel deploys `main` to `www.peerreview.club` (the bare domain
redirects there) and each PR to a preview.
`.github/workflows/migrate.yml` applies new migrations to the staging and production
Supabase projects on merges to `main`. Never apply a migration by hand.

In cloud sessions:
- Prefix `npm test`, `npm run e2e`, and `npm run screenshot` with
  `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`. The container's Chromium is older
  than the one this Playwright version installs.
- Start Docker before `db:start`: `(dockerd > /tmp/dockerd.log 2>&1 &)`.
- Prefix `npm run db:start` and `npm run db:types` with
  `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`. The default registry is blocked there.
- Prefix `npm run db:cities` with `NODE_USE_ENV_PROXY=1`. Node's `fetch` ignores
  `HTTPS_PROXY` without it, and the container reaches the internet only through the proxy.

After each Edit or Write, a hook runs Prettier, then `eslint --fix` or `stylelint --fix`, on
the file (`scripts/hooks/formatEditedFile.ts`). Errors and warnings it cannot fix come back
to Claude to fix. Change a rule that blocks correct code in its config (ADR 0021).

Before writing Next.js code, read the guide for it in `node_modules/next/dist/docs/`
(`AGENTS.md`, which `next dev` keeps current).

## Rules
1. Confirm before building: propose the plan, ask what changes the work, wait for "go".
   Small fixes Bobby reports can be made directly.
2. Read `TASKS.md` at session start. Update it when a task finishes or work is left pending.
3. Tests first for logic. Layout is checked with screenshots at 375px and 1280px
   (`npm run screenshot`), read before a UI task is called done.
4. No stubs. Every file runs, is typed, and is tested.
5. Verify library behaviour against its source or by running it. Flag what is unverified.
6. Run typecheck, lint, and tests before calling a task done.
7. Work on a branch, never `main`. Commit as work progresses, as author Bobby
   Filippopoulos <bflip12@gmail.com> (committer stays Claude in cloud sessions, so GitHub
   verifies it), and push after each commit. Open a draft PR with a task's first commit;
   mark it ready when the task is done (the `steward` skill runs the PR). Bobby merges,
   only when CI is green on the PR's latest commit. PRs are squash-merged, so `main` gets
   one commit per task, and the squash message says what and why. GitHub deletes the
   branch on merge; the next task starts a new one from `main` (in cloud sessions, the
   session's branch name).
8. Architecture, new technology, or a major scope change: write an ADR in `docs/adr/`.
9. Rule or workflow change: update the owning file, add a dated line to `docs/changelog.md`.
10. Before marking a task's PR ready, run the `ai-log` skill. It updates `docs/ai-log.md`.

## Where the rest lives
- `.claude/rules/voice.md`: writing voice for UI copy, docs, commits, and replies.
- `.claude/rules/react.md`: loads for `src/**`. Code style, colors, Next.js exceptions.
- `.claude/rules/security.md`: loads for `src/**`. Auth checks, secrets, what reaches the
  browser, untrusted input.
- `.claude/rules/database.md`: loads for `supabase/**` and `docs/DATA_MODEL.md`. Enums,
  future-proofing checks, value conventions, and SQL and policy style.
- `.claude/rules/supabase.md`: loads for `supabase/**`. Migrations, grants, function
  security, and database tests.
- `.claude/rules/workflows.md`: loads for `.github/**`. Pinned actions, permissions, and
  secrets in GitHub Actions.
- `.claude/skills/steward/SKILL.md`: a task's PR from draft to merged and migrated, and
  when Claude notifies Bobby.
- `docs/DATA_MODEL.md`: tables, constraints, indexes, and RLS visibility rules.
