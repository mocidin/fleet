# fleet

Claude Code tooling for the Hypertheory fleet. No plugin, no install, no copy: this repo is the one home of every skill, and each machine links it in place.

- `skills/`: the slash commands. One folder per skill, `SKILL.md` inside. Add, edit or delete a folder here and the command is added, edited or deleted in every chat.
- `jobs/`: the briefs the hub's recurring agents run (security, legal, the code, database and search optimizers). The hub reads them from GitHub at launch and mounts this repo in the agent's sandbox. Nobody types these, so they are never linked as commands.
- `scripts/skills.sh`: pulls this repo and links every folder under `skills/` into `~/.claude/skills`, which Claude Code reads live; removes the link of a skill that was deleted. Runs at every session start.
- `scripts/cloud.sh`: the cloud session bootstrap (skills, git identity, packages, `.env.local` from Vercel Production). Registers itself as the sandbox's SessionStart hook.
- `scripts/keeper.sh`: the laptop's hourly maintenance job.

The laptop runs `scripts/skills.sh` from its user-scope SessionStart hook, against the clone at `~/code/hypertheory/fleet`. A cloud environment's setup script is two lines: `git clone --depth 1 https://github.com/mocidin/fleet ~/.claude/fleet` then `bash ~/.claude/fleet/scripts/cloud.sh`.
