# 0019: Styling, data fetching, and state

- Date: 2026-10-27
- Status: Accepted

## Context
`docs/code-style.md` came from an earlier project and assumed styled-components,
client-side React Query, Sentry, and atoms. None of them are in this stack. The app runs on
Next.js 16 with the App Router and Cache Components on (the `create-next-app` default),
Supabase for data, and Vercel's serverless functions for hosting. Each choice below was
checked against Next's bundled docs and, where it matters, by building test routes.

## Options considered

**Styling**
- **CSS Modules with CSS variables for tokens.** Built into Next, no dependency, works in
  server components, and keeps the existing rule that colors come from CSS variables.
- **Tailwind.** Fast to write, but it replaces the token variables with its own class
  system, and the style guide's rules would all change.
- **Zero-runtime CSS-in-TypeScript (vanilla-extract and similar).** Typed styles, but a
  dependency and a build plugin for little gain over CSS Modules.
- **styled-components.** Needs client components and a style registry in the App Router,
  which pushes rendering to the browser for no product reason.

**Reading data**
- **Server components read through a Supabase client, rendered per request.** RLS runs as
  the signed-in user, and nothing but the rendered result reaches the browser.
- **Also cache public catalog reads with `use cache` and tags.** Checked in the docs: on
  serverless hosting, the default cache is in memory and entries do not persist across
  requests, so it saves little on Vercel without a paid remote cache. It also cannot read
  cookies, so a cached read must never use the signed-in client.
- **A client data library (React Query, SWR).** Useful for live client-side data. No v1
  screen needs it.

**Cache Components itself**
- **Keep it on.** Pages get a prerendered static shell, and data streams in behind
  `<Suspense>`. Checked by building test routes: reading cookies outside `<Suspense>` fails
  the build, inside it passes, and `new Date()` during prerender fails the build. So the
  mistakes it guards against are caught in CI.
- **Turn it off.** Fewer rules, but every page renders whole on each request, and turning
  it on later is a migration across every route.

**Writing data:** server actions, or route handlers called from client code. Server actions
work with forms, `useActionState`, and `refresh()` without extra code.

**Validation:** Zod schemas, or hand-written checks. A schema checks and types the input
in one place, and server actions are public endpoints that must check every input.

**Error monitoring:** Sentry or similar now, or at launch. Before launch there are no users
whose errors would be missed, and Vercel's logs show server errors.

## Decision
- **Styling:** CSS Modules beside each component. Colors, spacing, and type come from CSS
  variables in one token file, imported once by the root layout (Milestone 0 task 8). No
  CSS-in-JS and no utility-class framework.
- **Cache Components stays on.** Data is read per request, never inside `use cache`, until
  a measured need and an ADR. Anything that reads cookies or other request data sits
  inside `<Suspense>` with a fallback the size of the content.
- **Reads:** server components call server-only data functions. A data function takes the
  Supabase client as its first argument, so the same function runs as the signed-in user in
  the app and as test users in database tests.
- **Writes:** server actions, one per file. Each one validates its input with a Zod schema,
  checks who is calling, writes through the signed-in user's client so RLS applies, and
  returns `{ ok: true, data }` or `{ ok: false, message, fieldErrors }`. After a write it
  calls `refresh()` or `redirect()`.
- **State:** server data stays on the server. Filters, tabs, and pages live in the URL.
  UI-only state lives in `useState` or `useReducer` in the client component that needs it.
  `useOptimistic` gives instant feedback (likes). No global client store.
- **Client components** are leaves marked `"use client"` at the smallest point that needs
  the browser. Props passed to them reach the browser, so they carry only fields the user
  may see.
- **Errors:** expected failures are returned values shown in the form. Unexpected ones are
  thrown and caught by the segment's `error.tsx`, which offers `retry()`. Missing entities
  call `notFound()`. Error monitoring is decided at launch (Milestone 9).

## Consequences
- Server components with data are async, and React Testing Library does not render async
  components. They stay thin: data functions are tested against the local stack, logic in
  pure functions, client components with React Testing Library, and pages with Playwright.
- Every page that shows signed-in data streams it behind a fallback, so fallbacks are part
  of each design, not an afterthought.
- Zod is added with the first form (Milestone 1).
- Revisit caching if Supabase load or page speed calls for it: options then are
  `use cache: remote`, or `use cache` on reads that use a client without cookies.
- Code-style sections 8 to 10 and the checklist are rewritten to match.
