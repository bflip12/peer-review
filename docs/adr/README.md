# Architecture Decision Records

One file per big decision: architecture, a new technology, the shape of the data model, or a
major scope cut. Smaller choices live in commit messages. Rule and workflow changes live in
`docs/changelog.md`.

Together with `SPEC.md`, this folder is the record of how the app is built and why.

## Format

File name: `NNNN-short-title.md`, numbered in order.

```
# NNNN: Title

- Date: YYYY-MM-DD
- Status: Accepted | Superseded by NNNN

## Context
What problem or question forced the decision.

## Options considered
Each option with its main tradeoff.

## Decision
What was chosen.

## Consequences
What this makes easier, what it rules out, what has to be revisited and when.
```

## Rules

- Until its PR merges, an ADR is a draft and can be edited freely.
- After its PR merges, an ADR is never rewritten. Typos aside, the text stays as decided.
- A reversal is a new ADR. The old one's status changes to "Superseded by NNNN", and that
  status line is the only edit allowed.

## Index

| ADR | Decision | Status |
|---|---|---|
| [0001](0001-nextjs-supabase-vercel.md) | Next.js, Supabase, and Vercel | Accepted |
| [0002](0002-event-identity.md) | An event is a date plus a venue or a collective | Superseded by 0008 |
| [0003](0003-venues-without-location.md) | Venues have no address or map location in v1 | Accepted |
| [0004](0004-privacy-model.md) | Handles, hidden email, public logs with a private toggle | Accepted |
| [0005](0005-no-media-in-v1.md) | No photos or video in v1 | Accepted |
| [0006](0006-no-ai-in-v1.md) | No AI features in v1 | Accepted |
| [0007](0007-private-going-marker.md) | A private "Going" marker for future events | Accepted |
| [0008](0008-night-picker-and-lineup-slots.md) | One night picker for every event, and lineup slots for b2b sets | Accepted |
| [0009](0009-locals-and-reversible-merges.md) | Locals, and merges that can be undone | Accepted |
| [0010](0010-data-model.md) | Data model shape, co-hosts, and enums for states that can grow | Accepted |
