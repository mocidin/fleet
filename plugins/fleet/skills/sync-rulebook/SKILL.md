---
name: sync-rulebook
description: Copy the fleet rulebook (hypertheory/.claude/rules/fleet.md, the reference) to every other fleet repo so all copies stay byte-identical. Use after editing the rulebook, or when the user says "sync the rulebook", "sync rules", "update the global Claude file everywhere", "the rules drifted".
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Sync rulebook

One rulebook, one reference: `hypertheory/.claude/rules/fleet.md`. Every other fleet repo (ghostplug, brandflare, stonedgpt, recruiterbase, email-landing) carries a byte-identical copy at the same path, because a cloud session reads only its own repo. The laptop's `~/.claude/CLAUDE.md` imports the hub's copy, so it never needs syncing.

Edit the hub's file, then run:

```bash
python3 "$(find ~/.claude/plugins ~/code/hypertheory/fleet -path '*/skills/sync-rulebook/scripts/sync.py' 2>/dev/null | head -1)"
```

The script prints each repo it updated. Commit each changed repo with a one-sentence message describing the rule change (no em dashes) and push only when the user says push. In a cloud session only the repos attached to the session are present; attach all six for a full sync, or run it again from the laptop.

Editing the rulebook itself: a new rule goes into the section it belongs to (design rules under Design & UX, serverless rules under Production / Serverless), never into a new file; keep the whole file under 7,500 words.
