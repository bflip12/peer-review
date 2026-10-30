# AI log

How I use AI to build Peer Review, from the first idea to working code, and the calls I
make along the way. I work with Claude Code as a pair: it drafts, researches, reviews, and
lays out options, and I decide. Product decisions are recorded in
[`docs/adr/`](adr/README.md) and workflow rules in [`docs/changelog.md`](changelog.md).
This log covers the process that produced them.

The log follows the project's stages in order. Each stage starts with how I use AI in it.
The entries under it, oldest first, say what each step set out to do, which calls were
mine, and what came out of it.

## 1. Working rules

Before any product work, I set the rules the agent works under: confirm a plan before
building, verify library behaviour instead of trusting memory, no stubs, a writing voice,
and a dated record of every rule change. Claude drafts the rules with me. They live in
files that load only when relevant, so the instructions that load every session stay
short. A skill keeps this log current: after each task, Claude decides whether the work
belongs here and writes the entry.

### Rules before code (2026-10-06)

**Goal.** Set how the agent works before any product work starts.

**My calls.** Carried over the rules that apply to any project: confirm the plan before
building, verify library behaviour instead of trusting memory, no stubs, a dated changelog
for every rule change, and a writing voice for UI copy and docs. Left behind the rules that
existed only for the earlier project. Added a deny rule so the agent cannot edit the
earlier project's files from this one.

**Output.** `CLAUDE.md`, [`docs/changelog.md`](changelog.md),
[`docs/code-style.md`](code-style.md), commit `5feef73`.

### This log (2026-10-08)

**Goal.** Keep a record of how AI is used on this project, next to the decisions it produced.

**My calls.** A separate file, because its readers and purpose differ from the other two
logs. Public. Notable steps only, decided by the agent without asking me each time. On
2026-10-22 I had it reorganized by stage, from idea to code, with how I use AI described
once per stage, because the same detail in every entry was getting too specific.

**Output.** This file, `.claude/skills/ai-log/SKILL.md`, rule 10 in `CLAUDE.md`.

## 2. Product concept

I worked through the product with Claude in planning sessions. For each big question (the
stack, privacy, what a venue is, what stays out of v1), Claude laid out the options with
their trade-offs and I picked one. Each decision went into an Architecture Decision Record
so the reasoning survives.

### Planning v1 (2026-10-07)

**Goal.** Turn "Letterboxd for club nights" into a scoped v1 with a stack, a data shape,
and a task list.

**My calls.**
- Next.js, Supabase, and Vercel, so shared links get server-rendered previews.
- No venue addresses or map pins. Many venues in this scene keep their location private,
  and a user creating the entry cannot know which ones.
- Handles, hidden email, and public logs with a private toggle per log.
- No photos or video, since many of these clubs do not allow phones.
- No AI features in v1. Venue recommendations need more reviews per city than the app will
  have at launch. AI builds the app, but it is not part of v1.
- `CLAUDE.md` cut to under 30 lines, because long instruction files load every session and
  get followed less. Detailed rules moved to files that load only when relevant.

**Output.** [`SPEC.md`](../SPEC.md), [`TASKS.md`](../TASKS.md), ADRs
[0001](adr/0001-nextjs-supabase-vercel.md) to [0006](adr/0006-no-ai-in-v1.md), commit
`7ddea51`.

## 3. Feature specs

Features are specced one at a time, before any code. I bring the problem and usually a
first idea. Claude checks it against the spec and earlier decisions, traces how it touches
the rest of the app, walks through the edge cases in plain examples, and argues the
options, including the case against its own recommendation. Flows and forms are drawn as
text so I can judge them before anything is built, and UI copy goes through several
rounds.

### Event joining and merges (2026-10-07)

**Goal.** Decide what happens when several people log the same night, and how an admin
merges duplicate events.

**My calls.** Venue nights join an existing event automatically. Collective nights ask "Is
this your night?" because a collective can run two parties on one date. The first merge
rule deleted a user's older log when both of their logs ended up on one event. The revised
rule archives it and lets the user choose which one to keep, because a merge should not
remove someone's writing without their say.

**Output.** `SPEC.md` event and merge sections, Milestones 3 and 6 in `TASKS.md`, commits
`79bc49a` and `9cfb7ea`.

### A private "Going" marker (2026-10-07)

**Goal.** Let users mark nights they plan to attend, not only nights that already happened.

**My calls.** Only the user sees their own marker. Anyone can follow anyone without
approval, so a public or followers-only "going" list tells strangers where someone will be
on a given night. No note on the marker, because notes invite promoters to post ticket
links. The morning after, the marker turns into a prompt to log the night.

**Output.** [ADR 0007](adr/0007-private-going-marker.md), Milestone 7 in `TASKS.md`, commit
`0a78a26`.

### Locals, and merges that can be undone (2026-10-09)

**Goal.** Decide whether catalog fixes and moderation of people should be separate roles,
and make merges safe enough to hand to more people.

**My calls.**
- Two roles: locals fix venues, DJs, collectives, and events; admins handle reports on
  people, hiding, and bans. I named them "Local".
- Locals have cities on their profile, stored but not enforced yet.
- Locals confirm merges themselves after a summary of what will change. Claude first
  suggested that admins confirm any merge that touches users' logs.
- Archived logs are kept, shown to their owner in an Archived section with the reason, and
  answering the merge notice no longer deletes a log. I questioned why the spec deleted it.
- Merges can be undone. I suggested snapshotting with new activity staying on the kept
  entry; we kept that rule but record each change instead of a snapshot, so later edits are
  not overwritten.
- When undo would put back a name that now collides with another night, the person undoing
  chooses what happens. Claude first had the current name stay.
- Venue merges ask about same-date nights instead of merging them, because two separate
  venues never prompted anyone to name a second party.
- Creators can fix their own venue, DJ, or collective until someone else uses it, with no
  time limit.
- "Duplicate" reports ask the reporter to describe the place or night. Claude suggested
  evidence like matching links; I changed it to what a regular would recognize, since
  venues have no address and a local can verify a description of the room.

**Output.** [ADR 0009](adr/0009-locals-and-reversible-merges.md). `SPEC.md` sections 2, 3,
7, and 8, aggregation rules, and the data model. Milestones 2 and 6 in `TASKS.md`. Rule 7
in `CLAUDE.md`: draft PRs from a task's first commit, squash-merged.

### A private original copy of each log (2026-10-13)

**Goal.** Decide whether users get a read-only copy of their logs, so they keep their
originals when other people edit the night.

**How I used AI.** Claude first argued against a copy table on technical grounds, and
changed its answer when I asked for a product view.

**My calls.**
- A log is the whole entity, not just its review, and users will feel ownership of it.
  That turned the recommendation from "export only" to a copy.
- The copy holds the current review along with the night as it was originally recorded.
- No notice on the log when its night changes. On a busy app lineups get corrected all
  the time, so it would show on most logs. The copies get their own private page, with a
  plain explanation at the top.
- The copy refreshes on every save by its owner, not only the first. Claude recommended
  it so "Change night" does not leave a copy of the old night, and I accepted.

**Output.** [ADR 0015](adr/0015-original-logs.md), `SPEC.md` section 4,
[`docs/DATA_MODEL.md`](DATA_MODEL.md) (`log_snapshots`), `TASKS.md` Milestones 3 and 4.
Commit `92befb8`.

### Party names come from the poster, not the user (2026-10-14)

**Goal.** Stop users from treating the event name as their own label for a night, without
losing the real party names people search by.

**How I used AI.** While writing the data model, Claude caught that storing who set the
name on the event row would break the project's rule against showing who did what on a
public row.

**My calls.**
- My first idea was to show the name field only for a second night at the same venue and
  date. I changed course because names like "Frequencies" matter for recognition.
- Claude recommended making a party name an entity with its own page. I rejected it: most
  named nights are one-offs, and series don't matter at this scale.
- The copy: "poster" instead of "flyer", "official name" in the help text, and "Halloween"
  as the placeholder. I dropped "Day party" as the example because it makes people second
  guess what kind of night it was, and cut the preview row as corny.

**Output.** [ADR 0016](adr/0016-event-names.md), `SPEC.md`, `TASKS.md`,
[`docs/DATA_MODEL.md`](DATA_MODEL.md), 9770e07.

## 4. Technical spec

The data model turns the spec into tables, constraints, and access rules. Claude reads the
spec and ADRs, asks about each ambiguity one at a time, and explains the Postgres
behaviour behind each choice. Key rules run on a local Postgres to prove them, which
caught a unique rule that let two unnamed nights both save. Choices that are hard to
change after launch are flagged, and a rules file puts every later schema change through
the same checks.

### Designing the data model (2026-10-12)

**Goal.** Turn the spec into a v1 data model, and flag what is hard to change once users
have shared links and logged nights.

**How I used AI.** Partway through, Claude merged in decisions from two parallel planning
sessions and listed where they disagreed.

**My calls.**
- Collectives on an event are equal co-hosts, so a shared party shows on both profiles.
- Averages are calculated but not shown in v1. I want the app to feel like a community, not
  a place to find the best-rated club.
- Log owners cannot delete comments on their logs. Claude had proposed they could; I want
  people to own what they say and be able to answer back. Edits show "edited".
- URLs use a short ID plus the name, since IDs survive renames and merges.
- City search needs English names like "Cologne". Claude had suggested skipping alternate
  names at first.
- I asked which yes or no columns should be enums before they need a second value, and
  for a rule so every schema change gets the same check.
- I questioned why "no name" needed converting to blank text. Postgres 15 can compare
  missing values directly, so events use that, and the blank key stays only where the
  database needs it to enforce the co-host rule.
- The role is `moderator` in code and "Local" in the app.

**Output.** [`docs/DATA_MODEL.md`](DATA_MODEL.md), [ADR 0010](adr/0010-data-model.md),
[`.claude/rules/database.md`](../.claude/rules/database.md). `SPEC.md` sections 2, 3, 5, 6,
7, and 9, and `TASKS.md` Milestones 0, 2, 3, and 6.

### Styling, data fetching, and state for Next.js 16 (2026-10-27)

**Goal.** Replace the style guide's data and styling rules, written for a different stack,
with ones that fit Next.js 16, Supabase, and Vercel.

**How I used AI.** I asked Claude to review its own plan as a senior Next.js developer
before writing anything. It read Next's bundled docs and built throwaway routes to see
which mistakes fail the build. The review dropped part of the plan: caching catalog reads
would save little on Vercel, because the default cache does not persist across serverless
requests.

**My calls.**
- CSS Modules with token variables, not Tailwind or CSS-in-JS.
- Cache Components stays on, with data read per request until a measured need.
- Zod validates every server action, since an action is a public endpoint.
- Error monitoring waits until launch.

**Output.** [ADR 0019](adr/0019-styling-data-and-state.md),
[`docs/code-style.md`](code-style.md) sections 8 to 10.

## 5. Reviews

Before code, I have Claude review the plan as a critic: against similar apps with
community-built catalogs, for abuse, for cost, and as a skeptical senior engineer. Each
review reads the planning docs, ranks its findings, and lists what it could not verify. I
approve findings one at a time, and where I am not convinced I ask for a worked example or
the pros and cons of each option.

### Reviewing the logging flow against similar apps (2026-10-09)

**Goal.** Check that logging a night feels natural, and that duplicate nights are avoided
or fixed without friction.

**My calls.**
- A collective's party at a club is one event, so an event can have both a venue and a
  collective.
- Venue and collective nights follow one rule, with a required name for a second party at
  the same place and date.
- Party hopping is allowed up to 3 logs per date, not the 2 I first suggested, to cover a
  day party. Going markers stay unlimited.
- Moving a log to another night carries everything over.
- A b2b set counts toward each DJ in it, but its rating is stored so solo and b2b can be
  shown apart later.
- The venue rating on a night with no venue stays, because it shows how the collective
  picked the space.
- Sets are picked under "Which sets did you listen to?". I chose "Listened" over the
  suggested "Heard".

**Output.** [ADR 0008](adr/0008-night-picker-and-lineup-slots.md), which supersedes
[ADR 0002](adr/0002-event-identity.md). `SPEC.md` sections 2, 3, 4, 6, 7, and 9 and the
data model. Milestones 2, 3, 4, 6, and 7 in `TASKS.md`.

### Reviewing the community-built catalog (2026-10-12)

**Goal.** Check that logging stays quick and community-run, with no verification, without
leaving the catalog open to abuse.

**How I used AI.** When Claude's plan for lineup fixes kept growing, I had it review its
own plan as a skeptical senior engineer. The review found that its design broke the main
case it was meant to fix.

**My calls.**
- Aliases stay allowed. Blocking them would not work, and the privacy model wants them.
- Daily caps per account on new venues, DJs, collectives, and events. I wasn't worried
  about anyone reaching them and considered starting lower and raising them on request. I
  kept them well above normal use, so the first users in each city, who add most of the
  catalog, never hit them.
- DJs with the same name are told apart by a home city from the cities list, not the
  free-text note Claude first proposed. I pushed on why a note beat a city, since two DJs
  with one name are almost always in different cities.
- The city is optional, and empty means unknown. I didn't want a "No home city" choice that
  becomes a catch-all. It is required only when a same-name DJ has no city.
- A rating for DJ A must never end up counting for DJ B. Claude's first answer moved
  ratings between slots, and the review showed it was too complex and contradicted itself.
  I asked for something simpler: a lineup slot never gets a different DJ, and a wrong one is
  replaced.
- I asked whether lineup fixes could be reverted. They couldn't, so removing a slot now
  hides it, and every slot change goes in the event's history with "Revert".
- I turned down hiding nights from DJ pages until a second person confirms the set. The app
  needs visibility to gain traction first, so it waits in Later.
- Merge undo moves to after launch. Merges stay recorded from the first one, and only
  admins merge until undo ships.
- Averages need a minimum number of logs from different users, plus a rule for new
  accounts, before they are shown.

**Output.** [ADR 0011](adr/0011-creation-caps-and-dj-cities.md),
[ADR 0012](adr/0012-merge-undo-after-launch.md), [ADR 0013](adr/0013-lineup-corrections.md).
`SPEC.md` sections 2, 3, and 7, "Aggregation rules", and "Not in v1",
[`docs/DATA_MODEL.md`](DATA_MODEL.md), and `TASKS.md` Milestones 0, 2, 3, 6, and 10.

### Reviewing which AI features belong in v1 (2026-10-13)

**Goal.** Decide which AI features are worth building, and when, before any of them gets
near the roadmap.

**How I used AI.** Claude priced each feature from token estimates against current model
prices, and proposed new ideas that turned out not to need AI at all.

**My calls.**
- No AI in v1 stays, as in [ADR 0006](adr/0006-no-ai-in-v1.md). The review showed cost is
  not the blocker: every feature is cents per user. v1 will not have the review data the
  features need.
- After v1, in order: log assist, then venue review summaries, then visiting a city, each
  when its trigger in the review is met.
- Natural-language search is cut. Sound tag and city filters answer the example query.

**Output.** [`docs/AI_FEATURES.md`](AI_FEATURES.md) and the "Later" list in `TASKS.md`.

### A senior review of the whole v1 plan (2026-10-13)

**Goal.** Find what is overbuilt, underbuilt, or contradictory across the spec, task list,
data model, and ADRs before any code is written.

**My calls.**
- Merges ship together with undo after launch, so the merge record is tested from the
  first merge. Averages are not calculated in v1, and the bulk revert page waits.
- Users can fill in an empty venue on a night, or add a collective, unless it clashes
  with another night. A clash offers a duplicate report. I asked for the pros and cons
  first; locals-only would have sent every fix to me.
- Follow status and Going visibility stay as one-value enums. They are there to
  future-proof, not instead of a boolean, so the rule was reworded to require a named next
  value rather than dropped. The reaction column on likes had no named next value, so I
  dropped it.
- Column write rules go into the data model. I asked how a user could even change their
  own role. The answer is that the browser writes to the database directly, and row rules
  do not check columns.
- Function security rules, custom email for magic links, and a production deploy from
  Milestone 0.

**Output.** [ADR 0014](adr/0014-merges-ship-with-undo.md), `SPEC.md`, `TASKS.md`,
[`docs/DATA_MODEL.md`](DATA_MODEL.md) ("Column writes"),
[`.claude/rules/database.md`](../.claude/rules/database.md). Commits `5eb3f57`, `3938d8c`,
`657f6ce`, `1fb412a`.

## 6. Implementation

Each task starts with a plan and the questions that change the work, and nothing is built
until I say go. Claude writes tests before logic, reads the current docs for a library
instead of working from memory, and checks each tool by running it. For layout, it
captures each page at phone and laptop widths and looks at the images itself before
calling the work done. Work goes on a branch with a draft PR from the first commit, and
each task merges to main as one commit.

### First code: the scaffold (2026-10-21)

**Goal.** Set up Next.js with formatting, linting, unit tests, and browser tests before
any feature code.

**My calls.** npm. Claude proposed a 200-line limit per file; I thought that was too
strict, and we settled on 300 lines of code (500 for tests), with blank lines and comments
not counted so docblocks never push a file over.

**Output.** [PR #13](https://github.com/bflip12/peer-review/pull/13), commands in
[`CLAUDE.md`](../CLAUDE.md).

### A hook that formats and lints every edit (2026-10-22)

**Goal.** Format and lint each file as Claude edits it, and stop asking permission for
routine commands.

**My calls.** Lint errors that `--fix` cannot fix go back to Claude to fix right away,
instead of waiting for `npm run lint`. `git add`, `commit`, and `push` are allowed, since
the workflow pushes after every commit, with deny rules for force pushes and pushes to
`main`. The docs say those rules match command text and are not a hard boundary, which I
accepted. Auto mode blocked Claude from editing its own settings and `CLAUDE.md`, so I
switched modes for that step.

**Output.** [`scripts/hooks/formatEditedFile.ts`](../scripts/hooks/formatEditedFile.ts),
[`.claude/settings.json`](../.claude/settings.json),
[PR #14](https://github.com/bflip12/peer-review/pull/14).

### CI on GitHub Actions (2026-10-23)

**Goal.** Check every PR on a clean machine: typecheck, lint, formatting, tests, the
build, and the browser smoke test.

**How I used AI.** Before deciding, I had Claude explain the terms I was not sure of (CI,
the Node setup step, pinning, and branch protection) with a diagram and a code example,
until each choice was clear.

**My calls.**
- The format check and the browser smoke test run in CI as well as the four checks the
  task named.
- Actions are pinned to commit SHAs, after the 2025 `tj-actions` attack showed how a moved
  tag can run someone else's code in CI. Dependabot updates come later.
- CI is required before merging into `main`, including merges Claude makes when I ask.

**Output.** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml),
[PR #17](https://github.com/bflip12/peer-review/pull/17).

### Supabase, with grants locked down and RLS tested through the API (2026-10-26)

**Goal.** Set up Supabase locally and in the cloud, with a way to test row level security
before any table exists.

**How I used AI.** Claude probed what Supabase actually grants by default on the local
stack instead of trusting the docs, and found that new tables and functions were open to
signed-out users. It then ran the tests once without its own fix to show they catch the
problem.

**My calls.**
- RLS tests go through the API as real signed-in users, not SQL tests inside the
  database, because the API is what an attacker reaches.
- Database tests run in CI on every PR.
- Automatic RLS on for the hosted project, as a safety net under the explicit rules.
- The project lives in Canada. One region is enough at this scale, and users elsewhere
  only see slower requests.
- URL IDs are 8 characters without lookalike letters.
- The repo stays private for now, with a fresh public repo later and a private repo for
  notes. GitHub does not enforce required checks on a private repo on the free plan, so a
  rule that Claude merges only on green CI stands in.

**Output.** [ADR 0017](adr/0017-explicit-grants-and-api-tests.md),
[`.claude/rules/supabase.md`](../.claude/rules/supabase.md),
[`supabase/`](../supabase/), [PR #18](https://github.com/bflip12/peer-review/pull/18).

### Deploying before any feature (2026-10-27)

**Goal.** Put the app live on `peerreview.club`, with a preview per PR and database
changes that only reach production through CI.

**How I used AI.** I set up the Vercel, Cloudflare, and GitHub accounts myself, and
Claude walked me through each dashboard from my screenshots, field by field.

**My calls.**
- Preview deploys get their own staging database from Milestone 1, so a buggy preview
  never touches real users' data.
- Vercel deploys on its own while CI applies migrations, with a rule that every migration
  works with the live app, instead of a stricter pipeline that needs more setup.
- No Supabase integration in Vercel: keys go in by hand per environment, so it is clear
  which deploy sees which database.
- Free-tier pausing is accepted until launch instead of a job that keeps the database
  awake.
- When the first migration run needed a token that could read the project's API keys,
  including the key that bypasses RLS, I chose to drop the token and connect CI straight
  to the database instead of widening its access.
- When the schema check flagged a function Supabase's automatic RLS option had left
  callable by signed-out users, I had it revoked by migration rather than allowed.

**Output.** [ADR 0018](adr/0018-hosting-and-deploys.md),
[`.github/workflows/migrate.yml`](../.github/workflows/migrate.yml),
[PR #19](https://github.com/bflip12/peer-review/pull/19).

### Choosing the design and styling the app shell (2026-10-29)

**Goal.** Settle how Peer Review looks, then build the token file and the first styled
component.

**How I used AI.** Claude worked as a senior designer. It recommended the tools, read my
reference mockups, drew three directions and then five screens in a Claude Design canvas
I could review on my phone, ran a design critique on them, and computed the contrast of
every color pair instead of estimating it.

**My calls.**
- Claude Design for mockups and the frontend-design and Design plugins, with no Figma,
  since a second design file would drift from the token file.
- My reference mockups were for style only. Claude designed the screens from the spec, so
  they have no photos (ADR 0005), one 0.5 to 5 rating scale, and no averages (ADR 0014).
- Picked the "old internet" direction out of three, styled after the one reference sheet
  I liked most. When I was unsure about link color, I had both drawn and picked ink over
  blue.
- Renamed the event name field to "Event name", with "Day Party" as the example, and moved
  it below the review so it reads as optional.
- Asked for the log form state where a new night has no lineup yet, which the first
  mockups left out.
- Questioned the night picker: a button called "Log a night" could read as the place to
  create a night, and the DJ option looked like a way to start one. The results became
  one list asked as "Where were you?", where each row says "Join" or "Start" and a venue
  with a night on the date shows as that night, so users never choose between joining
  and creating ([ADR 0020](adr/0020-night-picker-one-list.md)).

**Output.** [`docs/style-guide.md`](style-guide.md), `src/styles/tokens.css`, the app
shell in `src/features/app-shell/`, a contrast test over the token file,
[`docs/design/references/`](design/references/README.md),
[PR #23](https://github.com/bflip12/peer-review/pull/23),
[PR #24](https://github.com/bflip12/peer-review/pull/24).

### Moving the style guide into the linter (2026-10-29)

**Goal.** Review the development rules against the stack and every language in the repo,
so the code stays consistent as Claude writes more of it.

**How I used AI.** Claude worked as a staff developer reviewing the rule files, and
tested each finding by running it: a file with only lint warnings, an import of
`server-only` in a test, and a build with the React Compiler on.

**My calls.**
- After the first pass I asked whether React and the other languages had been reviewed.
  The second pass found that lint warnings failed nothing, so `exhaustive-deps` and every
  accessibility rule had never been reported, and that no data function could have loaded
  in a database test.
- Rules a machine can check go in the lint config, since a lint error reaches Claude
  after every edit and a paragraph only when remembered. Stylelint for CSS.
- React Compiler on before Milestone 1, while there is almost no app code
  ([ADR 0021](adr/0021-lint-enforcement-and-react-compiler.md)).
- `T | null` for database values and `?:` for optional inputs, instead of a `Maybe<T>`
  type that hides which one a value is.
- Two PRs: lint and config first, then the docs (security rules, SQL style, workflow
  rules, test and accessibility sections).

**Output.** [ADR 0021](adr/0021-lint-enforcement-and-react-compiler.md),
[`eslint.config.mjs`](../eslint.config.mjs), [`stylelint.config.mjs`](../stylelint.config.mjs),
[`.claude/rules/security.md`](../.claude/rules/security.md),
[`.claude/rules/workflows.md`](../.claude/rules/workflows.md),
[PR #26](https://github.com/bflip12/peer-review/pull/26),
[PR #27](https://github.com/bflip12/peer-review/pull/27).

### Sign-in, the first feature (2026-10-29)

**Goal.** The `profiles` table and sign-in with an email link, the first code users see.

**How I used AI.** Claude checked each library behaviour by running it against the local
stack before relying on it: that a sign-in link works once, what Auth returns for a resend
too soon, and that the proxy refreshes an expired session. Screenshots of every signed-in
state, read before calling the UI done, caught a header that wrapped on phones.

**My calls.**
- Before agreeing to the plan I asked what the Google OAuth client costs and what the
  SMTP provider is for, then created the staging project and the Vercel settings myself.
- Staging is a second Supabase project, not a Supabase branch. I asked whether one
  staging site would be simpler than a preview per branch, and kept one staging database
  with a preview per PR.
- I asked what a token hash link is for, then chose it: the link works in any browser,
  and signing in waits for a button press so a mail scanner cannot use up the link
  ([ADR 0022](adr/0022-sign-in-links-and-sessions.md)).
- Banned users can read their own profile, so the app can tell them why, and can no
  longer change it.
- I merged new code standards to `main` while the profiles PR was open, and had it
  brought up to them before merging.
- Setting it up on production, I asked what the SMTP provider does and what the
  alternatives are, then chose Resend ([ADR 0023](adr/0023-email-with-resend.md)). I had
  the sign-in email restyled to match the site, the error and "Check your email" messages
  made to stand out, and the link page's button renamed "Continue". I kept the button
  after asking what the mail scanner problem is.
- I asked for every instruction to name the service and project, after Supabase, Vercel,
  and GitHub steps got mixed up (`.claude/rules/voice.md`).

**Output.** [ADR 0022](adr/0022-sign-in-links-and-sessions.md),
`supabase/migrations/20261029055304_create_profiles.sql`, `src/features/auth/`,
`src/features/profiles/`, `src/proxy.ts`, `e2e/signIn.spec.ts`,
[PR #25](https://github.com/bflip12/peer-review/pull/25),
[PR #28](https://github.com/bflip12/peer-review/pull/28),
[PR #29](https://github.com/bflip12/peer-review/pull/29),
[PR #30](https://github.com/bflip12/peer-review/pull/30).

### Account deletion, before Google sign-in (2026-10-30)

**Goal.** Let users delete their account, so the privacy page that comes with Google
sign-in can point to a working control.

**How I used AI.** Claude read auth-js's source before relying on it: `getClaims()` asks
Auth for HS256 tokens but checks asymmetric ones itself, and `signOut()` ignores Auth's
404 for a deleted user while still clearing the cookies. It split the work into two PRs
because the project's deploy rule says a migration ships before the code that calls it.

**My calls.**
- The plan put Google sign-in next, with "email us to delete your account" on the privacy
  page. I had deletion built first instead.
- The privacy page's contact address will be a new one on the domain,
  `hello@peerreview.club`.
- I checked the JWT signing key on both Supabase projects myself. Both use ECC keys, so a
  deleted user's token passes sign-in checks in other browsers for up to an hour, while
  nothing it writes saves. That limit is recorded in `docs/DATA_MODEL.md`.

**Output.** `supabase/migrations/20261030052159_delete_my_account.sql`,
`src/features/account/`, `e2e/deleteAccount.spec.ts`,
[PR #31](https://github.com/bflip12/peer-review/pull/31),
[PR #32](https://github.com/bflip12/peer-review/pull/32).
