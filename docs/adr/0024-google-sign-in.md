# 0024: Google sign-in

- Date: 2026-10-30
- Status: Accepted

## Context
SPEC section 1 lists Google sign-in beside email links, and says nothing is copied from
the Google profile. Supabase Auth runs the Google side. Four choices shape the rest.

## Options considered

**How the session reaches the server**
- **Code flow (PKCE) with a route handler.** A server action asks Auth for the Google URL,
  which stores a code verifier in a cookie. Google returns through Auth to
  `/auth/callback` with a code, which works only with that cookie. Google always returns
  to the browser that started, so ADR 0022's cross-browser problem with links does not
  apply.
- **Implicit flow.** Tokens come back in the URL fragment, which the server never sees, so
  a client component would have to save the session. The app reads the session on the
  server (ADR 0019).

**What Google is asked for**
- Auth always requests `email profile` from Google (checked on the local stack: the
  `scope` on its redirect to Google). The `scopes` option adds scopes, it cannot remove
  one. Auth stores the name and picture in `auth.users.raw_user_meta_data`.

**One account per email address**
- Auth links a Google sign-in to an existing account with the same verified email
  (Supabase's automatic identity linking, from its docs, not tested: a test cannot sign
  in with Google). So someone who signed up with an email link and later uses Google
  with the same address keeps one account.

**Google OAuth clients**
- **One client** listing both Supabase projects' callback URLs. Less setup.
- **One client per Supabase project**, in one Google Cloud project. The consent screen
  belongs to the Google Cloud project, so both share it. Each Supabase project holds only
  its own secret.

## Decision
- Code flow. `startGoogleSignIn` (a server action) redirects to Auth's Google URL with
  `redirectTo` set to `<origin>/auth/callback`, the origin the button was pressed on, so
  a preview signs in to itself. The redirect allow list in each Supabase project must
  include those origins, as for email links (ADR 0022).
- `/auth/callback` is a route handler. It checks the code is a UUID, exchanges it, and
  sends the user to `/welcome` or home (`getPathAfterSignIn`, shared with email links).
  A cancelled sign-in, a used code, or a code from another browser ends on
  `/auth/google-error`, which offers "Try again".
- The app never reads `raw_user_meta_data`. The handle and display name start empty
  (SPEC section 1), and the privacy page says Google sends a name and picture that the app
  does not use.
- Two OAuth clients, one per Supabase project, in one Google Cloud project.
- Locally, Google is enabled with a placeholder client so Auth builds the Google URL. Tests
  stop at Auth's `/authorize`. The code exchange is tested with a PKCE code from an email
  sign-in (`supabase/tests/utils/createPkceCode.ts`).

## Consequences
- The Google consent screen shows the Supabase project's domain (`<ref>.supabase.co`),
  since Google redirects there. Showing `peerreview.club` needs a Supabase custom domain,
  a paid add-on.
- The app is unverified with Google. Basic scopes (`email`, `profile`) are expected to
  need no review; not checked yet, to be confirmed when the consent screen is set up.
- A full Google round trip is checked by hand on a preview and on production, not in CI.
- Auth in a cloud session cannot reach Google: the session's proxy breaks TLS to
  `accounts.google.com`, so `/authorize` fails there. CI reaches it.
