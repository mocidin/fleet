# fleet

Claude Code tooling for the Hypertheory fleet, distributed as one plugin.

- `plugins/fleet/skills/`: the shared skills (slash commands). Edit them here; the laptop loads this clone in place, cloud sessions install the plugin from GitHub at session start.
- `plugins/fleet/hooks/`: the SessionStart hook that, in cloud sessions only, installs packages and writes `.env.local` from the Vercel project's Production env (`VERCEL` token on the cloud environment).

Every fleet repo enables it in `.claude/settings.json`:

```json
{ "extraKnownMarketplaces": { "fleet": { "source": { "source": "github", "repo": "mocidin/fleet" } } }, "enabledPlugins": { "fleet@fleet": true } }
```
