# 0001: Next.js, Supabase, and Vercel

- Date: 2026-10-07
- Status: Accepted

## Context
Peer Review is a solo, part-time project that should ship a usable v1 on a small budget.
Users arrive through links shared in scene communities, so public pages (logs, venues, DJs)
need to load fast and show previews when pasted into chat apps and forums. The project also
serves as a portfolio piece for a developer whose experience is in React single-page apps.

## Options considered
- **Vite single-page app + Supabase.** Plain React, least to learn, fastest to v1. Pages
  arrive as an empty shell, so link previews need a separate edge function for crawlers,
  and search engines index the pages more slowly. Server code runs as Supabase edge
  functions on Deno, a second runtime.
- **Next.js App Router + Supabase.** Public pages are rendered on the server, so previews
  and indexing work without extra code. Server code lives in the same repo and runtime.
  Adds server components, server-side auth with cookies, and caching rules to learn.
- **Next.js + Neon + Drizzle + Auth.js.** No vendor lock-in and a typed schema in
  TypeScript. Auth, permission checks, and storage are built by hand.

## Decision
Next.js App Router with TypeScript, Supabase for Postgres, Auth, and row-level security,
hosted on Vercel.

## Consequences
- Permission rules live in the database as RLS policies and are tested there.
- Server-rendered public pages give link previews and indexing.
- Server-side rendering and server components are new ground and take learning time.
- `docs/code-style.md` needs a section on server-side data fetching, and an exception for
  route files that Next.js requires to use `export default`.
- Vercel Hobby allows non-commercial use only. Adding ads, payments, or paid work on the
  site requires the Pro plan. Donations do not count as commercial use.
- Supabase free tier: 500 MB database, 50,000 monthly active users, and the project pauses
  after a week with no traffic.
