---
name: claude-code-permissions
description: Diagnosis and fix for Claude Code approval prompts appearing when they should not, in the VS Code extension or the CLI. Covers the three settings.json keys and which file each runtime actually reads, the master-toggle bug that wasted weeks, the relaunch requirement, the paths that always prompt regardless, and the escalation ladder. Use when the user says "prompts came back", "still asking me to approve", "permission prompts", "bypass isn't working", or asks to configure permission mode. Check this BEFORE searching anywhere else — the diagnosis is complete, only the remedy varies.
allowed-tools:
  - Bash
  - Read
  - Edit
---

# Claude Code permission mode

Dom runs every session with full bypass, zero approval prompts. When prompts return, the cause is always one of the items below. Do not re-investigate from scratch.

**Platform is never the cause.** He is on macOS and uses the VS Code extension as his primary entry point (switched from Cursor 2026-08-10; all Cursor data and config references deleted). The bug is in the extension itself and is identical on every OS.

## The keys, and which file each runtime reads

The two namespaces are **independent**. Setting only the CLI path does NOT cover the extension.

**VS Code extension** — `~/Library/Application Support/Code/User/settings.json` (Windows `%APPDATA%\Code\User\settings.json`, Linux `~/.config/Code/User/settings.json`):

```json
"claudeCode.allowDangerouslySkipPermissions": true,
"claudeCode.initialPermissionMode": "bypassPermissions",
"claudeCode.permissions": { "defaultMode": "bypassPermissions" }
```

The **first key is the master toggle**. Without it the others are dead settings. This is the bug that wasted weeks of diagnosis. (Observed 2026-07-25: the VS Code file carries the first two and bypass works; the third is belt-and-braces from the Cursor era.)

**CLI** — `~/.claude/settings.json`:

```json
"permissions": { "defaultMode": "bypassPermissions" }
```

**After changing VS Code's settings.json, fully quit and relaunch VS Code.** A window reload is not enough; the extension caches the mode at process start.

## Known extension bug

The extension is supposed to honor `defaultMode` from `~/.claude/settings.json` and doesn't. Six-plus open issues: anthropics/claude-code #36348, #43308, #12604, #15921, #35870, #43953. Do not try to fix this by editing `~/.claude/settings.json` alone — wrong file for the runtime.

## Paths that still prompt even in bypass mode

Anthropic safety circuit-breakers, cannot be disabled: `.git`, `.vscode`, `.idea`, most of `.claude`, plus `rm -rf /` or `rm -rf ~`.

## If prompts return after a clean relaunch

1. Verify the keys are still in VS Code's settings.json — the settings UI sometimes overwrites them.
2. Check for a per-repo `.claude/settings.json` overriding `defaultMode`.
3. Escalation: launch the CLI directly with `--dangerously-skip-permissions` instead of the extension.
4. Last resort, only if it keeps happening despite all of the above: a community patcher exists at [github.com/seanGSISG/claude-code-extension-patcher](https://github.com/seanGSISG/claude-code-extension-patcher), which patches the extension binary directly. Do not recommend lightly; it requires re-patching on every extension update.
