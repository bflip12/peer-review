# AI log

How I use AI to build Peer Review, and the calls I make along the way. I work with Claude
Code as a pair: it drafts, researches, and lays out options, and I decide. Product decisions
are recorded in [`docs/adr/`](adr/README.md) and workflow rules in
[`docs/changelog.md`](changelog.md). This log covers the process that produced them.

Entries cover notable steps only, newest first. Each one says what the step set out to do,
how AI was used, which calls were mine, and what came out of it.

## Reviewing the logging flow against similar apps (2026-10-09)

**Goal.** Check that logging a night feels natural, and that duplicate nights are avoided
or fixed without friction.

**How I used AI.** Claude reviewed the spec's logging, event, and merge rules against apps
with community-built catalogs (Untappd, setlist.fm, Concert Archives, MusicBrainz), using
web research and flagging what it could not verify. It ranked where the flow would feel
jarring, mocked up a single night picker as text, and laid out options for each gap over
several rounds.

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

## This log (2026-10-08)

**Goal.** Keep a record of how AI is used on this project, next to the decisions it produced.

**How I used AI.** Claude compared the new log with the existing ADRs and changelog, then
wrote a skill that runs before each task's commit, decides whether the work is worth an
entry, and writes it. It also backfilled the entries below from the commits and ADRs.

**My calls.** A separate file, because its readers and purpose differ from the other two
logs. Public. Notable steps only, decided by the agent without asking me each time.

**Output.** This file, `.claude/skills/ai-log/SKILL.md`, rule 10 in `CLAUDE.md`.

## A private "Going" marker (2026-10-07)

**Goal.** Let users mark nights they plan to attend, not only nights that already happened.

**How I used AI.** Claude listed five visibility models, from fully public to private, with
the trade-off of each, and checked how the feature would interact with the rest of the spec
(log dates, venue pages, the notice system).

**My calls.** Only the user sees their own marker. Anyone can follow anyone without
approval, so a public or followers-only "going" list tells strangers where someone will be
on a given night. No note on the marker, because notes invite promoters to post ticket
links. The morning after, the marker turns into a prompt to log the night.

**Output.** [ADR 0007](adr/0007-private-going-marker.md), Milestone 7 in `TASKS.md`, commit
`0a78a26`.

## Event joining and merges (2026-10-07)

**Goal.** Decide what happens when several people log the same night, and how an admin
merges duplicate events.

**How I used AI.** Drafted the join and merge rules with Claude, then went through the edge
cases: two parties by one collective on one date, and a user who logged both events being
merged.

**My calls.** Venue nights join an existing event automatically. Collective nights ask "Is
this your night?" because a collective can run two parties on one date. The first merge
rule deleted a user's older log when both of their logs ended up on one event. The revised
rule archives it and lets the user choose which one to keep, because a merge should not
remove someone's writing without their say.

**Output.** `SPEC.md` event and merge sections, Milestones 3 and 6 in `TASKS.md`, commits
`79bc49a` and `9cfb7ea`.

## Planning v1 (2026-10-07)

**Goal.** Turn "Letterboxd for club nights" into a scoped v1 with a stack, a data shape,
and a task list.

**How I used AI.** Worked through the product with Claude in one planning session. For each
big question, Claude laid out the options with their trade-offs. Each decision went into an Architecture Decision
Record so the reasoning survives. The same session reviewed the agent's own instruction
files.

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

## Rules before code (2026-10-06)

**Goal.** Set how the agent works before any product work starts.

**How I used AI.** Wrote `CLAUDE.md` with Claude, starting from rules I had settled with it
on an earlier project.

**My calls.** Carried over the rules that apply to any project: confirm the plan before
building, verify library behaviour instead of trusting memory, no stubs, a dated changelog
for every rule change, and a writing voice for UI copy and docs. Left behind the rules that
existed only for the earlier project. Added a deny rule so the agent cannot edit the
earlier project's files from this one.

**Output.** `CLAUDE.md`, [`docs/changelog.md`](changelog.md),
[`docs/code-style.md`](code-style.md), commit `5feef73`.
