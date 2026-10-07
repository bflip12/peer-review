# Changelog

Dated record of rule and style changes, newest first. Each entry says what changed and why.

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
