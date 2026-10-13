# AI features review

- Date: 2026-10-13
- Inputs: `SPEC.md`, ADR 0001, ADR 0006, `docs/DATA_MODEL.md`, `TASKS.md` "Later".
  `docs/ARCHITECTURE.md` does not exist; the stack and budget come from SPEC "Stack and
  budget" and ADR 0001.

## Result

Keep ADR 0006: no AI in v1. Cost is not the reason. Every feature below costs cents per
user per month. The reasons:

1. **Data.** v1 is done at 20 users logging for a month, spread across many cities. That
   is about 80 logs and 30 reviews in total. The features that read other people's reviews
   (summaries, visiting a city, semantic search) have nothing to work with at that size.
2. **The v1 test.** v1 checks whether people log nights, follow, and comment. No AI feature
   changes that answer, and each one adds a paid API, a key, a per-user cap, and a privacy
   page change. SPEC says no paid APIs in v1.
3. **The log form is already short.** Only the overall rating is required, and the rest
   sits in a collapsed section. Log assist would save little until the data shows users
   skip the parts it would fill.

After v1, ship in this order, each when its trigger is met: log assist, then venue review
summaries, then visiting a city. Natural-language search is cut and replaced by filters.

## Features in the spec

The spec lists AI under "Not in v1". ADR 0006 and `TASKS.md` "Later" name three features,
and "Later" adds natural-language search. Each is reviewed below.

### Cost assumptions

- An active user logs 4 nights a month. 40% of logs have review text, about 120 tokens each.
- Token counts are estimates. Measure them with the token counting endpoint before an ADR
  quotes them.
- Anthropic API prices per million tokens (input / output), from the price list cached on
  2026-10-06. The Batch API halves both.

| Model | Input | Output |
|---|---|---|
| Claude Haiku 5.5 | $0.10 | $0.50 |
| Claude Sonnet 5.5 | $2.00 | $10.00 |
| Claude Opus 5.5 | $4.00 | $20.00 |

Output token counts include thinking tokens, which are billed as output.

### 1. Log assist

The user writes how the night went in their own words. The model fills the sub-ratings and
picks sets from the night's lineup. The user checks the form and saves.

**What it needs.**
- One LLM call per use, from a server action. Input: instructions and output schema (about
  1,000 tokens), the night's lineup with slot IDs (up to about 600), the user's text (about
  150). Output: JSON with suggested sound and venue ratings and slot IDs, about 150 tokens,
  plus thinking.
- No embeddings. No data from other users. It works on the first log in the app.
- Structured output validated with Zod. Slot IDs must come from the lineup it was given.

**Cost.** About 1,750 input and up to 500 output tokens per call. Assume 6 calls per user per
month (4 logs, some re-runs).

| Model | Per call | Per user per month | 1,000 users per month |
|---|---|---|---|
| Haiku 5.5 | $0.0004 | $0.003 | $3 |
| Sonnet 5.5 | $0.009 | $0.05 | $51 |
| Opus 5.5 | $0.017 | $0.10 | $102 |

**With too little data.** Not an issue for volume. The risk is a vague note ("great night")
turned into made-up ratings. Rules:
- It never sets the overall rating. That stays the user's own number.
- A field the text says nothing about stays empty.
- It never adds a DJ or slot. A DJ named in the text but not on the lineup is shown as
  "Not on the lineup: add them?" and goes through the normal DJ search.

**v1?** No. Revisit after v1 with this check: of logs with review text, how many leave
sound, venue, and set picks empty. If most do, log assist fills a real gap. If users already
fill them, it only adds a confirm step.

### 2. Venue review summaries

A few sentences on a venue page saying what reviewers say about the sound, the room, and
the crowd.

**What it needs.**
- One LLM call per venue when it gets a new eligible review, at most once a day, through the
  Batch API. Input: instructions (about 500 tokens) and the 30 most recent eligible reviews
  (about 3,600). Output: about 200 tokens plus thinking.
- No embeddings.
- A `venue_summaries` table: venue, text, the log IDs it read, generated at.
- Eligible reviews follow the SPEC aggregation rules: public, not hidden, not archived, not
  from banned users. A review that becomes hidden, private, archived, or deleted queues a
  regeneration, so removed text never stays in a summary.

**Cost.** About 4,100 input and 500 output tokens per run, halved by the Batch API. About
1.6 reviews per user per month, each causing at most one run.

| Model | Per run (batch) | Per user per month | 1,000 users per month |
|---|---|---|---|
| Haiku 5.5 | $0.0003 | $0.0005 | $0.50 |
| Sonnet 5.5 | $0.007 | $0.01 | $11 |
| Opus 5.5 | $0.013 | $0.02 | $21 |

**With too little data.** A summary of two reviews repeats them, and a summary of reviews
from three accounts can be gamed the same way an average can. It needs the same threshold
the aggregation rules ask for before averages are shown: a minimum number of reviews from
different users, and the rule for new accounts. Below it, the page shows no summary and no
placeholder text. At v1 size, close to zero venues pass any useful threshold.

**v1?** No. The summary is also a score in another form, and v1 pages focus on logs and
people, not scores (ADR 0010). Revisit with the ADR that turns averages on, and use the same
threshold. Trigger: at least 20 venues pass it.

### 3. Visiting a city

The user picks a city and gets its venues ranked, with a summary of each.

**What it needs.**
- Venue averages, shown. v1 calculates them but does not show them.
- Venue review summaries (feature 2) for the summary part.
- Enough venues per city with enough reviews to rank. The launch audience is spread across
  many cities, which is why ADR 0006 deferred it.
- The ranking is SQL over averages. AI adds only the per-city summary, one call per city
  on the same schedule as venue summaries, at the same cost per run.

**With too little data.** A ranking of two venues with three reviews each is wrong in a way
users act on: they go to the venue. Below the threshold the city page lists venues by public
log count, with no ranking and no summary.

**v1?** No. It depends on feature 2 and on shown averages, and on density no launch city
will have. A "most logged venues in Berlin" list needs no AI and can ship whenever city pages
do.

### 4. Natural-language search ("clubs with Funktion-One")

**What it needs.** Two ways to build it:
- An LLM call per search that turns the query into filters (city, sound tags, entry type,
  name). About 800 input and 100 output tokens. Haiku 5.5: about $0.0001 per search, $0.003
  per user per month at 20 searches.
- Embeddings of review text for queries like "dark room, loud sound". Supabase Edge
  Functions run the `gte-small` embedding model built in, which keeps it off a paid API.
  Vectors are 384 floats, about 1.5 KB per review, so 10,000 reviews is about 15 MB of the
  500 MB free tier.

**With too little data.** Semantic search over 30 reviews returns the same few results for
every query. The filter parse works from day one, but the catalog is small enough that
filters do the same job.

**v1?** Cut. The example query is a sound tag plus a city, which a filter on the search page
answers with no AI. Add sound tag and city filters to venue search, in Milestone 4 or later.
Revisit embeddings when there are thousands of reviews.

## Requirements shared by every AI feature

- An ADR that amends ADR 0006 and changes SPEC "No paid APIs in v1".
- The API key in Vercel server environment variables only. Calls from server actions or
  route handlers, never the browser.
- A per-user daily cap on AI calls, enforced in the database the same way as the creation
  caps (ADR 0011). A spend limit set in the Anthropic Console.
- The privacy page says which text goes to the AI provider. Summaries read only public
  logs. Log assist sends the user's own draft when they press the button, private logs
  included.
- An eval set of real logs before choosing a model. Haiku 5.5 and Sonnet 5.5 are the two to
  compare; the eval decides.
- Tests run against recorded responses. CI makes no live API calls.

## Other ideas

| Idea | Needs AI? | Verdict |
|---|---|---|
| Paste a lineup ("A, B b2b C, D") to add several slots at once | No. A parser on commas, new lines, and the existing b2b rules | Worth it. Small, deterministic, saves the most typing on the log form. Consider for Milestone 3 |
| Translate a review | An LLM call per review and language, cached | Cut. Browsers translate pages already. Revisit if reviews come in many languages and users ask |
| Sort the admin report queue by type (spam, abuse, wrong info) | An LLM call per report | Cut. At v1 size one admin reads every report |
| Help admins judge "Duplicate" reports | An LLM call comparing two entries and the description | Cut. A wrong merge moves real logs, so this stays a human call. Volume is low |
| "People who picked DJ A also picked B" | No. SQL over `set_listens` | Later, once there is volume. No AI needed |
| Year in review text on profiles | An LLM call per user per year | Cut. The stats are SQL and read fine as numbers |
| Suggest sound tags for a venue from its reviews | An LLM call or keyword match | Cut. Users set tags directly, and a keyword match on brand names is enough if it is ever wanted |

## What v1 needs to keep these open

Nothing new. Review text is stored in `logs.body`, set picks in `set_listens`, and the
aggregation rules already define which logs count. The features above read those as they
are.

## Unverified

- Token counts and per-call costs are estimates, not measured.
- `gte-small` on Supabase Edge Functions: built in since Edge Runtime 1.36.0 per Supabase's
  docs, and trained on English text only, which matters for a multi-language audience. Free
  plan CPU and time limits for running it are not confirmed.
- pgvector on the Supabase free tier is expected but not checked.
