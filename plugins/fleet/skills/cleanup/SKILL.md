---
name: cleanup
description: Run the laptop keeper's weekly sweep now and report it. The keeper (plugins/fleet/scripts/keeper.sh) is the ONE maintenance job on Dom's Mac, it runs hourly from launchd (ai.hypertheory.keeper) ending chats idle 12h and dev servers idle 6h, pruning week-old Claude scratch and warning when memory is tight, and does its weekly sweep by itself between 3 and 6am once a week. This skill is that sweep on demand, chats idle 6h ended, every dev server stopped, every regenerable cache wiped (Claude scratch, repo build caches, dormant node_modules, VS Code leftovers, TypeScript/npm/pip/Homebrew caches, updater leftovers, known-safe app caches), a list of anything big it did not handle, the hub restarted. Preserves chats, memory, skills, credentials and all source. Use when the user types /cleanup, says "clean up my machine", "free up disk", "the machine is slow", "run the sweep". Laptop only.
disable-model-invocation: true
allowed-tools:
  - Bash
---

Run the sweep and report its output in a few plain sentences (what was reclaimed, anything on the left-over list that looks wrong, and that the hub is back on port 3000 while the other apps start on demand):

```bash
zsh "${CLAUDE_PLUGIN_ROOT}/scripts/keeper.sh" deep
```

If `${CLAUDE_PLUGIN_ROOT}/scripts/keeper.sh` does not exist or `VERCEL` is set (a cloud session), say the sweep is laptop-only and stop.

Everything the script deletes rebuilds itself on next use or re-downloads on demand. Never touched: conversation transcripts, `~/.claude/projects/*/memory/`, `~/.claude.json` and every MCP server, the plugins directory, `CLAUDE.md`, `settings.json`, `file-history` inside 7 days, all source, `tsconfig.tsbuildinfo` files, active repos' `node_modules` (only repos with no commit in 90 days lose theirs), `~/.Trash` and `~/.vscode/extensions` (reported, left for a human). To dry-run, add `dry` after `deep`. Its hourly log is `~/Library/Logs/fleet/keeper.log`.
