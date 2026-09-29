# fleet

The machinery behind the Hypertheory fleet's Claude Code setup. The skills themselves are not here: they live in the hub repo under `.claude/skills/`, one folder per slash command, and every fleet repo carries a synced copy (`/sync-rulebook`), which is how Claude Code loads them on the laptop and in the cloud alike.

- `jobs/`: the briefs the hub's recurring agents run (security, legal, the code, database and search optimizers). The hub reads them from GitHub at launch and mounts this repo in the agent's sandbox. Nobody types these.
- `scripts/cloud.sh`: the cloud session bootstrap (permissions, git identity, packages, `.env.local` from Vercel Production). Registers itself as the sandbox's SessionStart hook.
- `scripts/skills.sh`: the laptop's link step, run at every session start: links the hub's skills into `~/.claude/skills` so a chat opened anywhere on the laptop has them.
- `scripts/keeper.sh`: the laptop's hourly maintenance job.

A cloud environment's setup script is two lines: `git clone --depth 1 https://github.com/mocidin/fleet ~/.claude/fleet` then `bash ~/.claude/fleet/scripts/cloud.sh`.
