---
name: sync-rulebook
description: Copy the fleet rulebook (hypertheory/.claude/rules/fleet.md, the always-on core, plus the path-scoped notes in .claude/rules/fleet/, the reference) to every other fleet repo so all copies stay byte-identical. Use after editing the rulebook, or when the user says "sync the rulebook", "sync rules", "update the global Claude file everywhere", "the rules drifted".
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Sync rulebook

One rulebook, one reference: the always-on core `hypertheory/.claude/rules/fleet.md` and the path-scoped notes in `hypertheory/.claude/rules/fleet/` (design, public-apps, automation, ai, accounts), which load only when a chat touches their files. Every other fleet repo (ghostplug, brandflare, stonedgpt, recruiterbase, whaletrail, email-landing) carries byte-identical copies at the same paths, because a cloud session reads only its own repo; a note removed from the hub is removed everywhere. The laptop's `~/.claude/CLAUDE.md` imports the hub's copy, so it never needs syncing.

Edit the hub's file, then run:

```bash
python3 ~/.claude/skills/sync-rulebook/scripts/sync.py
```

The script prints each repo it updated. Commit each changed repo with a one-sentence message describing the rule change (no em dashes) and push only when the user says push. In a cloud session only the repos attached to the session are present; attach all six for a full sync, or run it again from the laptop.

Editing the rulebook itself: a rule every chat needs goes into the core, in the section it belongs to; a standard for one area (a UI rule, a cron rule, an AI-call rule, an account fact) goes into that area's note in `fleet/`, and a new area gets a new note with `paths:` frontmatter plus its line in the core's index table. The core stays under 3,000 words, a note under 1,500. Incident stories compress to a dated parenthetical; a changed fact is rewritten in place, never stacked under a dated update.
