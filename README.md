# fleet

Claude Code tooling for the Hypertheory fleet, distributed as one plugin.

- `plugins/fleet/skills/`: the shared skills (slash commands). Edit them here; the laptop loads this clone in place, cloud sessions install the plugin from GitHub at session start.
- `plugins/fleet/hooks/`: the SessionStart hook that, in cloud sessions only, installs packages and writes `.env.local` from the Vercel project's Production env (`VERCEL` token on the cloud environment).

Cloud sessions get it from the environment's setup script (`claude plugin marketplace add mocidin/fleet` then `claude plugin install fleet@fleet --scope user`); the hook refreshes it at every session start. The laptop loads this clone in place through a directory marketplace.
