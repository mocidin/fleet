---
name: claude-code-permissions
description: Diagnosis and fix for Claude Code approval prompts appearing when they should not, in the Claude Desktop app (Code tab), the CLI, or a cloud session. Covers the Desktop app's per-account bypass toggle, the settings precedence that lets a repo's committed settings override the global bypass, the laptop-only override file, the relaunch requirement, and the paths that always prompt regardless. Use when the user says "prompts came back", "still asking me to approve", "permission prompts", "bypass isn't working", "had to allow everything", or asks to configure permission mode. Check this BEFORE searching anywhere else, the diagnosis is complete, only the remedy varies.
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Claude Code permission mode

Dom runs every local session with full bypass, zero approval prompts. When prompts return, the cause is one of the items below. Do not re-investigate from scratch.

**Surface (since 2026-09-16):** the Claude Desktop app, Code tab, is the only local entry point. VS Code and Cursor are retired; their settings.json keys are dead and must not be recommended. Cloud sessions (phone, browser, Desktop app in cloud mode) run in accept-edits with every tool pre-approved by each repo's committed `.claude/settings.json` and never prompt.

## The two layers on the laptop, both required

1. **App gate.** Settings > Claude Code > **"Allow bypass permissions mode"** must be ON. It is a per-account opt-in stored by the app (`bypassPermissionsGateByAccount` in `~/Library/Application Support/Claude/claude_desktop_config.json`, read it for diagnosis, never edit it). While it is off, any request for bypass is refused with "bypass permissions mode is not available here (not enabled for this account in Settings...)" and the session silently falls back to a prompting mode. Only Dom can flip it; it takes effect for NEW sessions, and if a fresh session still asks, quit and reopen the app once.

2. **Mode selection.** Settings precedence is managed > local project (`.claude/settings.local.json`) > shared project (`.claude/settings.json`) > user (`~/.claude/settings.json`). Every fleet repo commits `.claude/settings.json` with `"defaultMode": "acceptEdits"` for cloud sessions, and that OUTRANKS the bypass in `~/.claude/settings.json`. So each fleet repo carries a gitignored `.claude/settings.local.json`:

```json
{ "permissions": { "defaultMode": "bypassPermissions" } }
```

(hypertheory's also keeps its `allow` list). Installed 2026-09-16 in hypertheory, ghostplug, brandflare, stonedgpt, recruiterbase. A new fleet repo or a fresh clone needs the file added; a missing file is the first thing to check when one repo prompts and the others do not.

## Diagnosis order

1. `get_session self` (ccd session tool) or the mode selector next to the send button: if the running session says acceptEdits or default, layer 2 is missing for this repo, or layer 1 is off.
2. Try `set_session_permission_mode bypassPermissions` on self. "not available here / not enabled for this account" = layer 1 off, tell Dom the exact toggle. "session was not launched with --dangerously-skip-permissions" = layer 1 is fine, only this already-running session cannot switch; new sessions will start in bypass. In that case switch the current session to `auto` as the stopgap.
3. Check the repo's `.claude/settings.local.json` exists, is gitignored (`git check-ignore -q .claude/settings.local.json`), and carries `defaultMode: bypassPermissions`.
4. Check `~/.claude/settings.json` still has `permissions.defaultMode: bypassPermissions` (the user layer, belt and braces).

## Paths that still prompt even in bypass mode

Anthropic safety circuit-breakers, cannot be disabled: `.git`, `.vscode`, `.idea`, most of `.claude`, plus `rm -rf /` or `rm -rf ~`. Raising a session to a MORE permissive mode from inside the session always shows Dom one approval card; that single card is expected, not a regression.

## CLI (rarely used now)

`~/.claude/settings.json` `permissions.defaultMode: bypassPermissions` plus the same per-repo local override; or launch with `claude --dangerously-skip-permissions`.
