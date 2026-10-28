---
paths:
  - "src/**/*.{ts,tsx,css}"
---

# React, TypeScript, and styling

- Follow `docs/code-style.md`. Run its section 13 checklist before committing.
- Server components by default. `"use client"` only on the leaf that needs the browser.
  Reads go through `data/` functions in server components; writes through server actions
  (code-style section 9, ADR 0019).
- Anything that reads cookies or the signed-in user sits inside `<Suspense>`. No
  `use cache` around a Supabase read without an ADR.
- Colors come from CSS variables defined in one token file. Never inline a color. The token
  file is created with the first styled component, and the palette is recorded in
  `docs/style-guide.md`.
- Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`) use
  `export default`, because Next.js requires it. Everything else stays `export const`.
