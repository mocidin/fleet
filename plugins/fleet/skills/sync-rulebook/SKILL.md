---
name: sync-rulebook
description: Make every copy of the fleet rulebook identical after an edit. The rulebook is the "Fleet rulebook" block at the end of the hub's CLAUDE.md, mirrored into every fleet repo's CLAUDE.md and into the laptop's ~/.claude/CLAUDE.md. Use after editing the rules in any of those places, or when the user says "sync the rulebook", "sync rules", "update the global Claude file everywhere", "the rules drifted".
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Sync rulebook

One rulebook, seven copies: the hub's `## Fleet rulebook` block (the reference), the same block in ghostplug, brandflare, stonedgpt, recruiterbase and email-landing, and the same sections inside the laptop's `~/.claude/CLAUDE.md` (which also keeps laptop-only sections: Permission Mode, Memory layout). This skill copies the reference everywhere so no copy drifts.

Where the edit was made decides the direction:

- Edited the hub block (the normal case, cloud or laptop): `python3 <this skill's directory>/scripts/sync.py`
- Edited the laptop's `~/.claude/CLAUDE.md`: `python3 <this skill's directory>/scripts/sync.py --from-global`

Find the script with `find ~/.claude/plugins ~/code/hypertheory/fleet -path '*/skills/sync-rulebook/scripts/sync.py' 2>/dev/null | head -1`.

The script prints each file it changed. Then commit each changed repo with a one-sentence message describing the rule change (no em dashes), and push only when the user says push. In a cloud session only the repos attached to the session are present; attach all six for a full sync, or run it again from the laptop.

Rules for editing the block itself: it is the laptop rulebook minus the two laptop-only sections, section for section, so a new rule goes into the section it belongs to (design rules under Design & UX, serverless rules under Production / Serverless), never into a new file. The 7,500-word budget applies to the whole block.
