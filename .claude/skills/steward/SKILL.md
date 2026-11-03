---
name: steward
description: Take a task's pull request from first commit to merged and migrated. Use after opening a task's draft PR, on CI results and review comments for it, and after Bobby merges it.
---

# PR steward

Claude drives each task's PR until CI is green and it is ready. Bobby merges. Claude
never merges, and never approves a PR.

## While the PR is open

1. Subscribe the session to the PR's activity right after opening the draft PR, so CI
   results and review comments come back to the session.
2. CI red: find the cause and fix it on the branch. Never skip, disable, or loosen a test
   to get green. Never push an empty commit to rerun CI. If the failure is not this PR's
   (it is red on `main` too), say so to Bobby instead of widening the PR.
3. Review comments: make small, local fixes and push. A bigger ask (a schema change, a
   refactor across files, a new decision) goes to Bobby as a question first.
4. Before marking the PR ready, run CLAUDE.md rule 6's checks and the `ai-log` skill.
5. When the task is done and CI is green on the latest commit, mark the PR ready and
   notify Bobby (below).

## Stop and ask Bobby

Ask in the chat, and notify, when:
- the work grew past the plan Bobby said "go" to,
- a decision comes up that the plan did not cover,
- CI fails for a reason this PR cannot fix.

## After Bobby merges

1. Check the Migrate run for the merge commit when the PR added a migration. Both jobs
   ("Apply migrations to staging", "Apply migrations to production") must pass. If one
   fails, read its log and tell Bobby which step failed and why. Never apply a migration
   by hand.
2. Update `TASKS.md` if work was left pending.
3. Unsubscribe from the PR and cancel any check-in scheduled for it.

## Notifications

Send a push notification (under 200 characters, one line) only for these:
- Ready: "PR #36 ready to merge: <title>. CI green."
- Merged: "PR #36: Migrate passed on staging and production" (or "no migrations").
- Blocked: "PR #36 needs your call: <the question>"
- Failed: "Migrate failed on production: <step>"

Nothing for routine progress. Where it shows (desktop or phone) is set in the Claude app's
notification settings on each device.
