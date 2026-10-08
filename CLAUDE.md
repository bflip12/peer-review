# Peer Review

Letterboxd for club nights. Log a night, rate the sound, the venue and each DJ set, and
follow people. Product: `SPEC.md`. Backlog: `TASKS.md`. Decisions: `docs/adr/`.
Owner: Bobby Filippopoulos, software developer.

## Stack
Next.js App Router, TypeScript, Supabase (Postgres, Auth, RLS), Vercel.

## Commands
Added by the scaffold task. Do not guess a command that is not listed here.

## Rules
1. Confirm before building: propose the plan, ask what changes the work, wait for "go".
   Small fixes Bobby reports can be made directly.
2. Read `TASKS.md` at session start. Update it when a task finishes or work is left pending.
3. Tests first for logic. Layout is checked with screenshots at 375px and 1280px.
4. No stubs. Every file runs, is typed, and is tested.
5. Verify library behaviour against its source or by running it. Flag what is unverified.
6. Run typecheck, lint, and tests before calling a task done.
7. Commit once per finished task as Bobby Filippopoulos <bflip12@gmail.com>. The message
   says what and why. Push only when asked.
8. Architecture, new technology, or a major scope change: write an ADR in `docs/adr/`.
9. Rule or workflow change: update the owning file, add a dated line to `docs/changelog.md`.
10. Before committing a finished task, run the `ai-log` skill. It updates `docs/ai-log.md`.

## Where the rest lives
- `.claude/rules/voice.md`: writing voice for UI copy, docs, commits, and replies.
- `.claude/rules/react.md`: loads for `src/**`. Code style, colors, Next.js exceptions.
