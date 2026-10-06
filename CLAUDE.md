# Peer Review: guide for AI sessions

Read this first in every session. It holds the rules and workflow for this project.
The detail lives in `docs/`; read those files when the task touches them.

At the start of a session, read `docs/todo.md` and mention any open items that relate to
the task. Keep it current: remove items when done, add items when something is left pending.

## What this project is

A web application called Peer Review, built by Bobby Filippopoulos (frontend developer,
React and TypeScript, 6+ years).

**Nothing else is decided yet.** The scope, the stack, the data model, the hosting, and
the name of the eventual repo are all open. Planning happens in its own session. Until
that session has run and this file says otherwise, do not assume a framework, a database,
a UI library, a deployment target, or what the application does. If a task needs one of
those answers, ask rather than picking a default.

The rules below were carried over from Bobby's portfolio project
(`/Users/bobbyfilippopoulos/portfolio`), where earlier sessions settled them with him.
They apply from the first line of code.

## Hard rules

1. **Confirm before building.** For any new feature or significant revision, propose the
   plan, ask the questions that change the work, and wait for "go". Small fixes Bobby
   reports can be made directly.
2. **Follow `docs/code-style.md`.** It is the React and TypeScript style guide: file layout,
   naming, types, hooks, pure functions, components, tests. Section 13 is a checklist to
   run before committing.
3. **Small and complete. No stubs.** Every file runs, is typed, and is tested. A feature is
   not done because the happy path renders.
4. **Verify technical claims.** Check library behaviour against its source or by running it.
   If something cannot be verified, flag it to Bobby instead of asserting it.
5. **Never inline a color.** Colors come from CSS variables defined in one token file. The
   token file does not exist yet; create it with the first styled component and record the
   palette in `docs/style-guide.md`.
6. **Writing voice** (UI copy, error messages, labels, README, commit messages, docs):
   - Plain, declarative sentences. Headings and labels say what happens, never an aphorism
     or a teaser.
   - No em-dashes anywhere. Use commas, parentheses, or separate sentences.
   - No editorializing adverbs ("quietly", "silently"), no dramatic framing.
   - Labels and titles state exactly what happens. No jargon label without saying what it
     means.
   - Do not explain basics the audience knows.
7. **Commit and push only when asked.** Commit identity:
   Bobby Filippopoulos <bflip12@gmail.com>.

## Replies to Bobby

- Get straight to the point. No fluff, no recap of what Bobby already said.
- Explain like a developer explaining to a developer: simple, concrete, short. Go deeper
  only when asked.
- The voice rules apply to replies too: no editorializing adverbs ("silently", "quietly").

## Keeping this guide current

When Bobby changes a style, a rule, or a preference, in the same turn:
- Update the file that owns it: `CLAUDE.md` (rules, voice, workflow), `docs/style-guide.md`
  (visual and component decisions), the token file (colors).
- Add a dated line to `docs/changelog.md` with the reason.

`docs/code-style.md` is a copy of the portfolio project's file, which stays the source of
truth for both. Change it there first, then copy it here, and note the change in both
changelogs.

## Files

| Path | Purpose |
|---|---|
| `docs/code-style.md` | React and TypeScript style guide. Public-facing: sanitized, no provenance, no first or third person |
| `docs/changelog.md` | Dated record of rule and style changes |
| `docs/todo.md` | Open items and decisions waiting on Bobby |
| `docs/style-guide.md` | Palette, type, components. Created once the design starts |
