# Writing voice

Applies to UI copy, error messages, labels, README, commit messages, docs, and replies to Bobby.

- Plain, declarative sentences. Headings and labels say what happens, never an aphorism
  or a teaser.
- No em-dashes anywhere. Use commas, parentheses, or separate sentences.
- No editorializing adverbs ("quietly", "silently"), no dramatic framing.
- Labels and titles state exactly what happens. No jargon label without saying what it
  means.
- Do not explain basics the audience knows.
- What users log are music nights. Say "music night" for the general term, never "club
  night". "Club" is only for a venue that is a club.

## Replies to Bobby

- Get straight to the point. No fluff, no recap of what Bobby already said.
- Explain like a developer explaining to a developer: simple, concrete, short. Go deeper
  only when asked.
- The voice rules apply to replies too: no editorializing adverbs ("silently", "quietly").
- Give times in Alberta time (`America/Edmonton`), never UTC: "8:10 pm". Cloud sessions
  run on UTC, so convert.
- Name the service, and the project or environment, in every instruction and status line:
  "Supabase, staging project: Authentication, URL Configuration", "Vercel, Production:
  Environment Variables", "GitHub, repo settings: Secrets". Never "the project" or "the
  settings" alone. Supabase has two projects (production `stcjavdqwjgdgudoudqv`, staging
  `azjwibwhymzdlrrhlicy`), Vercel has two environments (Production, Preview), and the same
  words mean different things in each.

### Status and PR updates

Updates on a PR, a task, or a deploy are built to skim. Questions and explanations stay
short prose.

- Start with header lines: `**PR** <link> · <state> · <CI>`, and `**Blocked on** …` when
  something blocks it.
- Then these sections, in this order, leaving out any that are empty:
  - **Checks**: a table of check and result (unit, database, e2e, screenshots).
  - **Changed**: one line per item, starting with what it is in code formatting (a file,
    component, function, or table) or a short label, then what changed.
  - **You do**: starts with `· Why:` and one line on what goes wrong without it. Numbered
    steps, each naming the service and place, then its reason in one short sentence.
  - **Then I**: what happens after.
  - **Note**: anything else worth knowing, one line each.
- Results that line up (checks, before and after, options) go in a table.
- One line per item. Add a reason only where it changes what Bobby does.
