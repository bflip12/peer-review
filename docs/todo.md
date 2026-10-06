# To do

Open items across sessions. Check this at the start of a session. When an item is done,
delete it here and add a dated line to `docs/changelog.md` if it changed a rule or style.

## Needs a decision from Bobby

- **Everything about the application.** A dedicated planning session will settle: what Peer
  Review does, who uses it, the scope of a first version, the stack, where data lives,
  authentication, hosting, and the repo name. Nothing here should be guessed before then.

## Next up

- **Scaffold.** After planning: create the project with its build tooling, add the test
  runner, add CI (typecheck, test, build), and record the commands in `CLAUDE.md` so a
  session never has to guess how to run or verify the app.
- **Token file and `docs/style-guide.md`.** Create both with the first styled component.
- **Permissions.** Extend `.claude/settings.json` with an allowlist for the project's
  routine commands once the stack is known, so they stop prompting. The
  `/fewer-permission-prompts` skill can build it from session transcripts.
- **Rules the portfolio project does not cover.** Decide and write into `CLAUDE.md`: where
  state lives and what may not hold it, when a new dependency is acceptable, what is
  committed versus generated, how to run the app to verify a change, and the error and
  loading conventions.

## Later

- Decide whether `docs/code-style.md` should become canonical here rather than in the
  portfolio repo, once this project exercises it more than the portfolio does.
