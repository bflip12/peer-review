---
name: ai-log
description: Decide whether the current session's work belongs in docs/ai-log.md, the public record of how Bobby uses AI to build Peer Review, and add an entry if it does. Use after finishing a task, before its PR is marked ready, or when Bobby asks to update the AI log.
---

# AI log entry

`docs/ai-log.md` is a public record of how Bobby uses AI on this project and how he works
as a developer. Readers are people outside the project, such as someone reviewing his work.

## 1. Decide if the session qualifies

Add an entry when the session did at least one of these:
- Made a product, architecture, or scope decision (usually a new ADR).
- Used AI in a way the log has not shown yet (a review pass, a research spike, a new tool,
  hook, or skill).
- Bobby rejected, corrected, or changed what the AI proposed, and the reason says
  something about how he works.
- Finished a milestone.

Skip routine work: small fixes, copy edits, dependency bumps, formatting, a task that went
as planned with no decision in it. When the session's work extends a topic that already has
an entry, update that entry instead of adding a new one.

If it does not qualify, write nothing and do not mention it.

## 2. Write the entry

The log is grouped by stage, from idea to code: working rules, product concept, feature
specs, technical spec, reviews, implementation. Each stage opens with a paragraph on how
Bobby uses AI in it. Add the entry at the end of its stage, since entries run oldest
first. If a session uses AI in a way the stage paragraph does not cover, update that
paragraph.
Format:

```md
### <What happened, in plain words> (YYYY-MM-DD)

**Goal.** One sentence.

**How I used AI.** Optional. One sentence, only when this step used AI differently from
the stage paragraph.

**My calls.** The decisions Bobby made and why, including where he changed or rejected
the AI's proposal.

**Output.** Links to files and ADRs, and commit hashes.
```

Rules:
- First person, as Bobby. Follow `.claude/rules/voice.md`: plain sentences, no em-dashes.
- Public: no local paths, usernames, employers, private repo names, or secrets.
- Only write what happened in this session or what the record (commits, ADRs, changelog)
  shows. Never invent a disagreement or an override. If Bobby's reasoning is unknown, state
  the decision without a reason.
- Keep each section to a few sentences. Link to the ADR instead of repeating it.

## 3. Commit

After a finished task, the entry goes in the task's last commit, before its PR is marked
ready. Run on its own, commit it
alone as Bobby Filippopoulos <bflip12@gmail.com> with the message "Add AI log entry: <title>".
In the reply, say in one line that an entry was added, with its title.
