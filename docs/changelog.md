# Changelog

Dated record of rule and style changes, newest first. Each entry says what changed and why.

## 2026-10-27

- `.claude/rules/supabase.md`: every migration works with the live app (add before use,
  remove after use, rename in steps). `CLAUDE.md` describes deploys: never apply a
  migration by hand. Reason: Vercel and the migration job run at the same time on a merge
  to `main` (ADR 0018).

## 2026-10-26

- Rule 7: merge only when CI is green on the PR's latest commit. Reason: the repo is
  private on a free plan, so GitHub does not enforce the required check, and this rule
  stands in for it.
- Added `.claude/rules/supabase.md`, loaded for `supabase/**`: migrations, explicit
  grants, function security, and database tests (ADR 0017). The function security rules moved
  there from `TASKS.md`. `CLAUDE.md` lists the database commands and the cloud setup for
  Docker and the Supabase image registry. Reason: Milestone 0 task 5.

## 2026-10-23

- CI on GitHub Actions (`.github/workflows/ci.yml`) checks every PR and every push to
  `main`, and `CLAUDE.md` describes it. Actions are pinned to commit SHAs (was: no CI).
  Reason: a clean machine catches what only works in one container, and a SHA cannot be
  moved to different code the way a tag can.

## 2026-10-22

- Rule 3 names `npm run screenshot` and says the captures are read before a UI task is
  called done (was: screenshots at 375px and 1280px, with no tool). Reason: the script
  now exists, and a capture nobody opens checks nothing.
- Rule 7: GitHub deletes the branch on merge (was: delete the branch after the merge).
  Reason: the repo deletes merged branches automatically.
- `CLAUDE.md`: the cloud Chromium prefix applies to `npm test` and `npm run screenshot`
  as well as `npm run e2e`, and the allowlist covers it for every npm script. Reason: the
  screenshot script's test launches a browser.
- `docs/ai-log.md` is grouped by stage, from idea to code, with entries oldest first in
  each stage (was: one list, newest first). How AI is used is described once per stage,
  and an entry adds one sentence only when it differs. The `ai-log` skill writes entries
  this way. Reason: Bobby wants the log to read as the overall process, and the same
  detail in every entry was getting too specific.
- `.claude/settings.json`: a `PostToolUse` hook on `Edit|Write` runs Prettier and
  `eslint --fix` on the edited file, and exits 2 with any errors left so Claude fixes them
  in the same turn. Markdown is skipped. Reason: formatting no longer depends on anyone
  running `npm run format`, and lint errors show up at the edit, not at the end of a task.
- `.claude/settings.json`: an allowlist for the npm scripts, `npx` runs of the project's
  tools, and git, including `add`, `commit`, and `push`. Deny rules block force pushes and
  pushes to `main`. Reason: rule 7 pushes after every commit, and asking each time added
  up. The deny rules match command text, so they cover the usual commands, not every way
  of writing one.
- `package.json` sets `"type": "module"` and Node 22.18 or later. Reason: Node runs the
  TypeScript hook directly, and 22.18 is the first Node 22 release that does so without a
  flag.

## 2026-10-13

- `.claude/rules/database.md`: a one-value enum column is allowed only when the enum table
  in `docs/DATA_MODEL.md` names the value expected next and the feature that brings it
  (was: any state that could gain a value). Reason: the old wording contradicted the rule
  against adding a column in case a feature arrives. Enums still replace booleans.
- `.claude/rules/database.md`: each table lists who writes which column, enforced with
  column grants or a trigger, with a test per protected column. Function security rules
  live in `.claude/rules/supabase.md`. Reason: RLS picks rows, not columns, so an owner
  update policy alone lets a user set their own role to admin through the API.

## 2026-10-12

- Added `.claude/rules/database.md`, loaded for migrations and `docs/DATA_MODEL.md`: use an
  enum for any state that could gain a value, check each schema change against the "Not in
  v1" and "Later" lists, store missing values as `NULL`, and keep "who did what" off public
  rows. Reason: Bobby wants future-proofing checked on every schema change, not only in the
  data model session.
- ADRs gain the status "Accepted, amended by NNNN" for a later ADR that replaces part of
  one (`docs/adr/README.md`). ADRs 0008 and 0009 now carry it for ADR 0010. Reason: ADR
  0010 changes parts of both, and "Superseded" would mark their other decisions as void.

## 2026-10-09

- Rule 7: a branch is deleted after its PR merges, and the next task starts a new branch
  from `main`. Reason: a squash merge leaves the branch's commits outside `main`, so reusing
  the branch needs a force push.
- Rule 7: commits happen as work progresses, and PRs are squash-merged so `main` still gets
  one commit per task (was: one commit per finished task). Rule 10 and the `ai-log` skill
  now run before a task's PR is marked ready. Reason: a draft PR from the start of a task
  only backs up work if work in progress is committed.
- ADRs can be edited freely until their PR merges (`docs/adr/README.md`). Reason: Bobby
  confirmed that a pending ADR is still a draft. The no-rewrite rule protects decisions
  already merged.
- Rule 7: a draft PR opens with a task's first commit and is marked ready when the task is
  done (was: a PR at the end). Reason: Bobby wants work backed up and visible online from
  the start of a task.
- Rule 7: work happens on a branch, never on `main`, and the branch is pushed after each
  commit. It merges to `main` by PR when the work is finished (was: push only when asked).
  Reason: the work is saved on GitHub throughout, and cloud containers are deleted after
  inactivity. The review gate is the merge.
- Rule 7: Bobby stays the commit author. In cloud sessions the committer is Claude
  <noreply@anthropic.com>, so GitHub shows the commit as verified. Reason: committing with
  Bobby as committer made the session amend every commit afterwards.

## 2026-10-08

- Added `docs/ai-log.md`, a public record of how AI is used to build the app and which calls
  are Bobby's. Reason: ADRs record product decisions and this file records rule changes;
  neither shows the process. Backfilled from the work of 2026-10-06 and 2026-10-07.
- Added the `ai-log` skill (`.claude/skills/ai-log/SKILL.md`) and rule 10 in `CLAUDE.md`:
  before committing a finished task, the session checks whether the work qualifies for an
  entry and adds one if it does. Routine work is skipped. Reason: Bobby wants notable steps
  logged without having to ask each time.

## 2026-10-07

Planning session. Product decisions are in `docs/adr/` and `SPEC.md`; the entries below are
changes to how sessions work.

- `CLAUDE.md` cut to under 30 lines. Reason: long instruction files load every session and
  lower adherence. Detail moved to the files below.
- Writing voice and reply rules moved to `.claude/rules/voice.md`, unchanged.
- React, TypeScript, and color rules moved to `.claude/rules/react.md`, which loads only for
  files under `src/`. Reason: they matter only when touching code.
- Next.js exception added: route files use `export default`, because Next.js requires it.
  Every other export stays `export const`.
- `TASKS.md` replaces `docs/todo.md` as the file read at session start. Open items from
  `docs/todo.md` moved into it.
- Commits: one per finished task, with a message that says what and why (was: commit only
  when asked). Push still only when asked. Reason: git log becomes the per-task record
  between sessions.
- Tests come first for logic (pure functions, RLS policies, server actions). Layout is
  checked with screenshots at 375px and 1280px. Reason: tests written first follow the
  requirement, and screenshots catch layout problems tests miss.
- Big decisions (architecture, new technology, major scope changes) get an Architecture
  Decision Record in `docs/adr/`. Reason: Bobby wants a record of how and why the app took
  its shape, readable years later.
- `docs/code-style.md` is now this project's own copy. Changes no longer go to the portfolio
  copy first. Reason: this project will change it, and those changes may not apply to the
  portfolio.

## 2026-10-06

- Rule: replies to Bobby are concise and direct, explained simply for a developer, with
  more depth only on request. The voice rules (no "silently", "quietly") cover replies too.
  Reason: Bobby asked for it on 2026-10-06.
- Project created beside the portfolio repo at `/Users/bobbyfilippopoulos/peer-review`.
  Nothing about the application is decided; planning happens in its own session.
- `CLAUDE.md`, `docs/todo.md` and this changelog carried over from the portfolio project:
  the session-start todo check, the dated changelog for every rule change, "confirm before
  building", "verify technical claims", "no stubs", "never inline a color", and the writing
  voice rules. Reason: those rules were settled with Bobby over the portfolio project and
  are not specific to it.
- `docs/code-style.md` copied from the portfolio project unchanged. The portfolio copy stays
  the source of truth for both until Bobby says otherwise. It is written to be public-facing,
  so it carries no provenance and names no employer, product, or repo.
- Left behind deliberately: the authorship blame rule, the sanitization rule, the fixed
  numbers, the piece workflow, and the resume rules. All of those exist because the
  portfolio publishes writing about private work.
