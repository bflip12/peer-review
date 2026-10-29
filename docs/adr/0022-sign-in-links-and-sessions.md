# 0022: Sign-in links and sessions

- Date: 2026-10-29
- Status: Accepted

## Context
Milestone 1 adds sign-in with an email link (Google comes next). The app renders on the
server (ADR 0019), so the session lives in cookies that server code reads. Three choices
shape how a link becomes a session and how the session stays current.

## Options considered

**How the link proves who clicked it**
- **Code flow (Supabase's default).** The browser that asked for the link keeps a secret
  in a cookie, and the link carries a code that only works with it. A link opened in
  another browser fails: asked for on a laptop and opened on a phone, or opened by a
  phone mail app's built-in browser.
- **Token hash.** The link carries a one-time token that `/auth/confirm` checks with
  Auth. It works in any browser. It needs custom email templates in each Supabase
  project, since the default ones send code-flow links.

**When the token is used up**
- **On page load.** One click less. But some mail security scanners open links before
  the user does, and each token works once (checked: a second use returns
  `otp_expired`), so a scanner could use up the link.
- **On a button press.** `/auth/confirm` shows "Sign in", and the server action uses the
  token. A scanner that loads the page does not press the button.

**Keeping the session current**
- **Refresh in each server component.** Server components cannot write cookies, so a
  refreshed token would be lost and refreshed again on every request.
- **Refresh in `src/proxy.ts`.** Next.js 16's proxy (formerly middleware) runs before
  every page and can write cookies, which is the pattern `@supabase/ssr` documents.

## Decision
- Sign-in links use a token hash: `supabase/templates/` holds the templates, applied
  locally by `config.toml` and pasted into each hosted project by hand.
- `/auth/confirm` signs in on the "Sign in" button press, through `confirmSignIn`.
- The link points at the origin the sign-in form was served from, so a preview deploy
  sends links to itself. Each project's redirect allow list must include its origins, or
  Auth falls back to the project's Site URL.
- `src/proxy.ts` refreshes the session before every page (`updateSession`), and writes
  the new cookies to both the request and the response.
- Server code reads the user with `getClaims()` (`.claude/rules/security.md`), after
  `connection()`, since Auth checks expiry with the clock and Cache Components refuses
  the clock before a request arrives.
- Sign-out ends the session in this browser only.
- New users land on `/welcome` to pick a handle; users with a profile go home.

## Consequences
- Changing the email templates means changing them in three places: the repo and both
  hosted projects.
- One extra click on every sign-in.
- Every request to a page runs the proxy, which checks the session with Auth only when the
  access token has expired.
- End-to-end tests read the sign-in emails from the local stack's Mailpit, so they run in
  CI's database job, where the stack is up.
