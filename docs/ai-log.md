# AI log

How I use AI to build Peer Review, and the calls I make along the way. I work with Claude
Code as a pair: it drafts, researches, and lays out options, and I decide. Product decisions
are recorded in [`docs/adr/`](adr/README.md) and workflow rules in
[`docs/changelog.md`](changelog.md). This log covers the process that produced them.

Entries cover notable steps only, newest first. Each one says what the step set out to do,
how AI was used, which calls were mine, and what came out of it.

## A senior review of the whole v1 plan (2026-10-13)

**Goal.** Find what is overbuilt, underbuilt, or contradictory across the spec, task list,
data model, and ADRs before any code is written.

**How I used AI.** I had Claude read every planning doc and review it as a skeptical
senior engineer, judged against the v1 done line: 20 people logging, following, and
commenting for a month. It listed concrete changes in three groups, and I approved each one
separately. Where I didn't follow a finding, it explained it again with a worked example
and laid out the pros and cons of each option. It flagged the Supabase limits it could
not check from the session.

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

## Reviewing which AI features belong in v1 (2026-10-13)

**Goal.** Decide which AI features are worth building, and when, before any of them gets
near the roadmap.

**How I used AI.** I asked Claude to review every AI feature in the spec and backlog: what
each needs (LLM calls, embeddings, data volume), a rough cost per user, what it does with too
little data, and whether it belongs in v1. It priced each feature from token estimates
against current model prices, checked what Supabase offers for free embeddings, and
estimated how much review data v1 will have. It also proposed new AI ideas and judged them
by the same questions, including some that turned out not to need AI at all. It listed what
it could not verify.

**My calls.**
- No AI in v1 stays, as in [ADR 0006](adr/0006-no-ai-in-v1.md). The review showed cost is
  not the blocker: every feature is cents per user. v1 will not have the review data the
  features need.
- After v1, in order: log assist, then venue review summaries, then visiting a city, each
  when its trigger in the review is met.
- Natural-language search is cut. Sound tag and city filters answer the example query.

**Output.** [`docs/AI_FEATURES.md`](AI_FEATURES.md) and the "Later" list in `TASKS.md`.

## Reviewing the community-built catalog (2026-10-12)

**Goal.** Check that logging stays quick and community-run, with no verification, without
leaving the catalog open to abuse.

**How I used AI.** I asked Claude to review the logging design against that goal. It read
the spec and ADRs, said what already works (join first, users fix their own mistakes,
undoable merges, hidden averages), and ranked five gaps. For the same-name DJ fix it drew
the forms and search results as text so I could judge the flow before anything was written.
It ran the new database rules on a local Postgres, including two inserts at the same moment
against the daily cap. When its plan for lineup fixes kept growing, I had it review the plan
as a skeptical senior engineer: what is overbuilt, underbuilt, and contradictory. The review
found that its own design broke the main case it was meant to fix.

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

## Designing the data model (2026-10-12)

**Goal.** Turn the spec into a v1 data model, and flag what is hard to change once users
have shared links and logged nights.

**How I used AI.** Claude read the spec and ADRs, asked me about every ambiguity one at a
time, and explained the Postgres behaviour behind each choice as we went. It ran the key
rules on a local Postgres to check them, which caught that two unnamed nights both save
under a plain unique rule. Partway through, it merged in decisions from two parallel
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

## Locals, and merges that can be undone (2026-10-09)

**Goal.** Decide whether catalog fixes and moderation of people should be separate roles,
and make merges safe enough to hand to more people.

**How I used AI.** I brought the idea of a second role. Claude checked it against the spec,
found that nobody could edit a venue or DJ name after creation, traced how one venue merge
cascades into event merges and archived logs, and walked through undo designs and their
edge cases (later edits, merge chains, unique rules) in plain examples until each rule was
clear.

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
