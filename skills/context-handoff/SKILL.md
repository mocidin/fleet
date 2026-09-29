---
name: context-handoff
description: Distill the current long chat into one copyable handoff block that a fresh chat can start from without re-searching the codebase. Use when the user types /context-handoff or says "give me context for a new chat", "summarize this chat for a handoff", "this chat is getting long, prep a new one".
---

# Context Handoff

Produce ONE copyable handoff block that lets a brand-new chat continue this session's work at full speed. The block is the deliverable: no files written, no follow-up tasks.

## What goes in (and what stays out)

A new chat automatically loads `~/.claude/CLAUDE.md`, the repo's `CLAUDE.md`, and the project memory. NEVER restate anything that lives there (standing rules, conventions, architecture notes). The block carries only what a fresh session could NOT know: this conversation's volatile state.

Aggregate, in this order:

1. **Where**: repo, working directory, branch.
2. **What this session did**: the completed work, stated as facts, each with its exact file paths (`app/...`, `lib/...`). Compress ruthlessly: what changed and where, not the journey, not the dead ends, not anything later reverted (state only the final outcome).
3. **In-flight state**: run `git status --short` fresh and reconcile it against the conversation. Note what is uncommitted, what has been typechecked or tested versus merely written, and anything mid-flow (a wizard half-configured, a batch staged, a draft pending).
4. **Infra and data changes**: migrations applied (table names), env vars added, external services configured, records repaired. Name identifiers exactly (table `csv`, campaign id 3097660) so nothing has to be rediscovered.
5. **Session decisions**: choices the user made in THIS chat that are not yet codified in CLAUDE.md or memory, including rejected approaches so the new chat does not re-propose them.
6. **Open threads**: what the user said they want next, unresolved questions, known issues left standing. If none, say none.
7. **Key pointers**: a short list of load-bearing file paths, functions, query keys, or ids the session kept returning to.

## Rules

- Verify before asserting: `git status` and a quick read of anything uncertain beat trusting a possibly-summarized memory of the chat. Never include a claim you cannot see evidence for.
- No secrets: never include env var VALUES, keys, or tokens. Names only.
- Follow the user's global writing rules inside the block (no long dashes, no interpunct, plain prose).
- Keep it tight: aim for under 60 lines. If the chat was mostly one feature, the block should read like a crisp PR description plus state, not a diary.
- Bullets over paragraphs. Exact paths over descriptions.

## Output format

First a single line: "Paste this into the new chat:". Then EXACTLY ONE fenced code block (```) containing the handoff, structured as:

```
CONTEXT HANDOFF (from previous chat, YYYY-MM-DD)

REPO: <repo> (<path>), branch <branch>

DONE THIS SESSION:
- ...

IN FLIGHT / UNCOMMITTED:
- ...

INFRA & DATA:
- ...

DECISIONS MADE (not yet in CLAUDE.md/memory):
- ...

OPEN THREADS:
- ...

KEY FILES:
- ...
```

Omit any empty section. Nothing after the closing fence except, if genuinely warranted, one short line flagging something the user should do before switching chats (for example: uncommitted work worth committing first).
