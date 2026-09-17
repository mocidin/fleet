---
name: claude-code-permissions
description: Diagnosis and fix for Claude Code approval prompts appearing when they should not, in the Claude Desktop app (Code tab) or the CLI. Covers which settings tier the app honors for bypass, the SettingsResolver log line that names the culprit, the account toggle and folder mode picker, cloud-session limits, and the paths that always prompt regardless. Use when the user says "prompts came back", "still asking me to approve", "why am I seeing Allow buttons", "permission prompts", "bypass isn't working", or asks to configure permission mode. Check this BEFORE searching anywhere else. The diagnosis is complete, only the remedy varies.
---

# Claude Code permission mode

Dom runs every local session with full bypass, zero approval prompts. When prompts return, the cause is one of the items below. Do not re-investigate from scratch; read the log, match the cause, apply the remedy.

## Read the log first

```bash
grep -i "SettingsResolver\|setPermissionMode\|Failed to set permission mode" ~/Library/Logs/Claude/main.log | tail -20
```

- `Ignoring defaultMode "bypassPermissions" from projectLocal tier` or `from project tier`: the app refuses bypass from BOTH `.claude/settings.json` and `.claude/settings.local.json` (Desktop 2.110 / CLI 2.1.271, 2026-09-16). Bypass can only come from the user tier, and ANY `defaultMode` at the project tier outranks it. Remedy: no `defaultMode` key in either project file, in every fleet repo.
- `Cannot set permission mode to bypassPermissions because the session was not launched with --dangerously-skip-permissions`: the folder's mode picker was not on Bypass when the session started. Remedy: pick Bypass for that folder in the app (remembered per folder as `epitaxy-folder-permission-mode` in `~/Library/Application Support/Claude/claude_desktop_config.json`) and start a new session.

## The four things that must all be true (local sessions)

1. Desktop app account toggle: Settings > Claude Code > "Allow bypass permissions mode" ON (`bypassPermissionsOptInByAccount` in claude_desktop_config.json).
2. The folder's mode picker set to Bypass, so the app launches the CLI with `--dangerously-skip-permissions`.
3. `~/.claude/settings.json` has `"permissions": { "defaultMode": "bypassPermissions" }`.
4. No `defaultMode` key in `<repo>/.claude/settings.json` or `<repo>/.claude/settings.local.json`. Check every fleet repo:

```bash
for r in ~/code/hypertheory/*/; do grep -Hn defaultMode "$r.claude/settings.json" "$r.claude/settings.local.json" 2>/dev/null; done
```

Any hit is the bug. Remove the key (keep the file's allow list), commit the committed file's change locally, and tell Dom new sessions will start clean. The current session can be flipped from the app's mode picker; that is what he does himself.

## Cloud sessions (web, phone, remote repos in the Desktop app)

Cloud sessions can never run bypass; the docs say `bypassPermissions` and `dontAsk` from any settings file are ignored there. Their best is **Auto** (a classifier approves actions instead of prompting), chosen once per remote repo from the mode dropdown; the app remembers it per folder (`remote:mocidin/<repo>` entries in the desktop config). Never put `defaultMode: acceptEdits` back in a committed settings file "for cloud": it does nothing useful there and breaks bypass on the laptop.

## Paths that still prompt even in bypass mode

Anthropic safety circuit-breakers, cannot be disabled: writes under `.git`, `.vscode`, `.idea`, most of `.claude`, plus `rm -rf /` or `rm -rf ~`. A prompt on one of those is not a regression.

## History

- 2026-07-25 to 2026-09-15: VS Code extension era, master toggle `claudeCode.allowDangerouslySkipPermissions`; VS Code is retired, those keys no longer matter.
- 2026-09-16 morning: gitignored `.claude/settings.local.json` with bypass in each repo beat the committed accept-edits line. Worked for hours.
- 2026-09-16 evening: Desktop 2.110 started ignoring bypass at the project-local tier; the committed accept-edits then won every session. Fix was removing `defaultMode` from every committed settings.json (five repos, one commit each).
