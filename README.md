# fleet

The machinery behind the Hypertheory fleet's Claude Code setup. The skills themselves are not here: they live in the hub repo under `.claude/skills/`, one folder per slash command, and every fleet repo carries a synced copy (`/sync-rulebook`), which is how Claude Code loads them on the laptop and in the cloud alike.

- `jobs/`: the briefs the hub's recurring agents run (security, legal, the code, database and search optimizers). The hub reads them from GitHub at launch and mounts this repo in the agent's sandbox. Nobody types these.
- `scripts/cloud.sh`: the cloud session bootstrap (permissions, the skills link, git identity, packages, `.env.local` from Vercel Production), run at every cloud session start by `hooks/hooks.json`.
- `.claude-plugin/`, `hooks/`: a hook-only plugin, the one way a cloud environment runs a script at every session start whatever repos it holds. It carries no skills.
- `scripts/skills.sh`: the link step: links the hub's skills into `~/.claude/skills`, for a chat opened outside a repo. Run at every laptop session start and by `cloud.sh`.
- `scripts/pull.sh`: brings a repo to the latest origin/main and says so when it cannot. Run at every laptop session start and by the `dev` wrapper.
- `scripts/keeper.sh`: the laptop's hourly maintenance job.

A cloud environment's setup script is two lines: `claude plugin marketplace add mocidin/fleet` then `claude plugin install fleet@fleet --scope user`.
