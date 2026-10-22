# Peer Review

Letterboxd for club nights. Log a night, rate the sound, the venue and each DJ set, and
follow people. Product: `SPEC.md`. Backlog: `TASKS.md`. Decisions: `docs/adr/`.
Owner: Bobby Filippopoulos, software developer.

## Stack
Next.js App Router, TypeScript, Supabase (Postgres, Auth, RLS), Vercel.

## Commands
Do not guess a command that is not listed here. Node 22 or later, npm.
- `npm run dev`, `npm run build`, `npm run start`: Next.js dev server, build, and server.
- `npm run typecheck`: generates route types, then runs `tsc`.
- `npm run lint`: ESLint. `npm run format` writes Prettier, `npm run format:check` checks.
- `npm test`: Vitest once. `npm run test:watch`: Vitest in watch mode.
- `npm run e2e`: Playwright, starting the dev server (CI: build and start). In cloud
  sessions, prefix `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium`.

Before writing Next.js code, read the guide for it in `node_modules/next/dist/docs/`
(`AGENTS.md`, which `next dev` keeps current).

## Rules
1. Confirm before building: propose the plan, ask what changes the work, wait for "go".
   Small fixes Bobby reports can be made directly.
2. Read `TASKS.md` at session start. Update it when a task finishes or work is left pending.
3. Tests first for logic. Layout is checked with screenshots at 375px and 1280px.
4. No stubs. Every file runs, is typed, and is tested.
5. Verify library behaviour against its source or by running it. Flag what is unverified.
6. Run typecheck, lint, and tests before calling a task done.
7. Work on a branch, never `main`. Commit as work progresses, as author Bobby
   Filippopoulos <bflip12@gmail.com> (committer stays Claude in cloud sessions, so GitHub
   verifies it), and push after each commit. Open a draft PR with a task's first commit;
   mark it ready when the task is done. PRs are squash-merged, so `main` gets one commit per
   task, and the squash message says what and why. After the merge, delete the branch; the
   next task starts a new one from `main` (in cloud sessions, the session's branch name).
8. Architecture, new technology, or a major scope change: write an ADR in `docs/adr/`.
9. Rule or workflow change: update the owning file, add a dated line to `docs/changelog.md`.
10. Before marking a task's PR ready, run the `ai-log` skill. It updates `docs/ai-log.md`.

## Where the rest lives
- `.claude/rules/voice.md`: writing voice for UI copy, docs, commits, and replies.
- `.claude/rules/react.md`: loads for `src/**`. Code style, colors, Next.js exceptions.
- `.claude/rules/database.md`: loads for `supabase/**` and `docs/DATA_MODEL.md`. Enums,
  future-proofing checks, and value conventions for the schema.
- `docs/DATA_MODEL.md`: tables, constraints, indexes, and RLS visibility rules.
