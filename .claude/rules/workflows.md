---
paths:
  - ".github/**"
---

# GitHub Actions

Applies to `.github/workflows/`. Follows GitHub's security hardening guide for Actions.
`ci.yml` and `migrate.yml` are the examples.

- Every third-party action is pinned to a full commit SHA, with the release in a comment:
  `uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`. A tag can be
  moved to other code; a SHA cannot. To update, look up the release's commit on GitHub.
- `permissions: contents: read` at the top of every workflow. A job that needs more asks
  for it on that job only.
- `actions/checkout` sets `persist-credentials: false`, so later steps cannot reuse the
  token.
- Every job has `timeout-minutes`.
- `concurrency`: cancel in-progress runs for checks; never cancel a run that changes
  something (migrations, deploys).
- Secrets reach a step through `env`, never written into a `run` line. Values from the
  event (PR titles, branch names) are untrusted input: pass them through `env` too, never
  as `${{ }}` inside a `run` script, where they would run as shell.
- No `pull_request_target`. It runs with the base repo's secrets on code from the PR.
- Node comes from `.nvmrc` (`node-version-file`), and installs use `npm ci`.
- Each step has a `name` that says what it does. A comment explains any step whose reason
  is not obvious, such as a flag left out on purpose.
- Steps run the same `npm run` commands as `CLAUDE.md` lists, so CI checks what a
  contributor runs locally.
