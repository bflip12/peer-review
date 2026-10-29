---
paths:
  - "src/**/*.{ts,tsx}"
---

# Security

Applies to server code, server actions, and anything that touches a secret. Follows
Next.js's data security guide
(`node_modules/next/dist/docs/01-app/02-guides/data-security.md`) and Supabase's auth
docs. Database rules (RLS, grants, function security) are in `.claude/rules/supabase.md`.

## Who is calling

- On the server, identity comes from `supabase.auth.getClaims()`, which verifies the
  token, or `supabase.auth.getUser()`, which asks the Auth server. Never from
  `getSession()`: on the server it reads the cookie without verifying it, and auth-js's
  own docs say its user must not be trusted there.
- Every server action checks the caller itself, even when the page that shows the form
  already did. An action is a separate public endpoint (code-style section 9).
- RLS is the boundary. App code checks the caller to show the right message, not instead
  of a policy. Writes go through the signed-in user's client, never the service role key.

## Secrets and environment variables

- Only variables prefixed `NEXT_PUBLIC_` reach the browser, and Next.js copies them into
  the bundle at build time. Only the Supabase URL and the publishable (anon) key are
  public.
- Read a public variable by its full literal name, `process.env.NEXT_PUBLIC_SUPABASE_URL`.
  Next.js does not replace a name built at runtime, so the value is `undefined` in the
  browser.
- The service role key is never imported under `src/`. Tests and scripts that need it
  read it from the local stack (`supabase/tests/utils/getLocalSupabase.ts`).
- Secrets live in Vercel's environment settings and GitHub repository secrets, never in a
  committed file.

## What reaches the browser

- Props passed to a client component are sent to the browser. Pass only the fields it
  renders (code-style section 8). An email address never leaves the server
  (`docs/DATA_MODEL.md`).
- An action returns only what the form shows: `ActionResultT`, never a whole row.
- Never show a server `error.message` to the user. Expected failures return a written
  message; unexpected ones reach `error.tsx` as a digest (code-style section 10).

## Untrusted input

- No `dangerouslySetInnerHTML`. Reviews and names render as text, and React escapes them.
- A redirect target taken from input (`?next=` after sign-in) must be a path on this site:
  it starts with a single `/`, not `//` or a scheme. Otherwise redirect to the home page.
- A link's host is checked against its platform's `allowed_hosts` by a database trigger
  (`docs/DATA_MODEL.md`). Links that open in a new tab carry `rel="noopener noreferrer"`.
- Every action input goes through its Zod schema first, including ids, which are checked
  as UUIDs or short ids before they reach a query.
