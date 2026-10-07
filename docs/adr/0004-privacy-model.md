# 0004: Handles, hidden email, public logs with a private toggle

- Date: 2026-10-07
- Status: Accepted

## Context
People in this scene can be wary of being identified, including by the app's operator.
Logging volume is what makes the feed and the averages useful, so the privacy model has to
lower the barrier to logging without hiding everything.

## Options considered
- **All logs public.** Simplest, every log counts everywhere. Some nights would go unlogged.
- **Public by default with a private toggle.** Private logs still count in the user's own
  stats.
- **Public, followers-only, and private.** Three levels, more RLS rules and tests.
- **Sign-in with no email at all** (passkeys only). The operator never sees an email, but a
  lost device means a lost account.

## Decision
- Sign-in with an email magic link or Google.
- Handle required. Display name optional, and the user decides what goes in it.
- Email is never in a public table, never returned by any app query, and not shown on the
  admin page. RLS enforces this, with tests.
- The sign-in form states that email is only used to sign in, is never shown to other
  users, and that any address works, including an alias.
- Logs are public by default, with a private toggle per log.
- Deleting an account deletes the user's logs, comments, likes, and follows.

## Consequences
- The Supabase project owner can still read emails in `auth.users`. Removing that needs
  email-free sign-in, which is not in v1.
- Averages and feeds use public logs only. Private logs count toward the owner's stats.
