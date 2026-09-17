---
name: cleanup
description: Wipe every regenerable cache on the machine and report what is left, and reclaim RAM by ending Claude chat processes idle for six hours (the swap-death cause; an hourly launchd job ends them at twelve between runs). Covers Claude Code session cruft, dev build caches, dead node_modules, the whole VS Code cache and local-history surface, the TypeScript and npm and pip and Homebrew caches, app updater leftovers, and known-safe app caches. Ends with a discovery scan so new bloat surfaces itself instead of needing a manual audit. Preserves chats, memory, MCP, skills, and all source.
disable-model-invocation: true
allowed-tools:
  - Bash
---

Run the whole script below, then report its output.

Two rules govern what is in here, and they are why this skill should not need revising again:

1. **Only regenerable state gets deleted.** Never source, never chats, never memory, never credentials. Everything wiped either rebuilds itself on next use or re-downloads on demand. Nothing here is recoverable-only-from-here.
2. **Anything not covered gets reported, not ignored.** The final step scans for large directories the script did not handle. New bloat from a newly installed app shows up in that list on the next run rather than requiring a fresh manual audit.

It intentionally **stops every running dev server through `dev stop`** (so `.next` can be cleared safely; a pkill would be undone by launchd within seconds), restarts the hub at the end, and **keeps all conversation transcripts**.

```bash
set -u

# ---------------------------------------------------------------------------
# Helpers. Every wipe goes through wipe() so a step can never report success it
# did not achieve. The old `rm ... 2>/dev/null && echo "Cleared"` pattern hid
# real failures: 337MB of stale VSIXs and a 30MB log dir once survived a run
# that printed success. wipe() prints before -> after, so a no-op is visible.
#
# ${dir:?} makes an empty variable abort the expansion instead of becoming /*.
# find is used instead of shell globs throughout: zsh errors on a glob that
# matches nothing, which would abort the script mid-run.
# ---------------------------------------------------------------------------
wipe() {
  local label="$1" dir="$2" before after
  [ -d "$dir" ] || { printf '  %-34s absent\n' "$label"; return; }
  before=$(du -sh "$dir" 2>/dev/null | cut -f1)
  find "${dir:?}" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null
  after=$(du -sh "$dir" 2>/dev/null | cut -f1)
  printf '  %-34s %6s -> %s\n' "$label" "$before" "$after"
}

# Same reporting, but removes the directory itself rather than its contents.
nuke() {
  local label="$1" dir="$2" before
  [ -e "$dir" ] || { printf '  %-34s absent\n' "$label"; return; }
  before=$(du -sh "$dir" 2>/dev/null | cut -f1)
  rm -rf "${dir:?}"
  [ -e "$dir" ] && printf '  %-34s %6s FAILED\n' "$label" "$before" \
                || printf '  %-34s %6s -> gone\n' "$label" "$before"
}

START=$(df -k / | awk 'NR==2{print $4}')

# ---------------------------------------------------------------------------
echo ""
echo "1. Dev servers"
# Stopped through the launchd remote control so the .next dirs below can be
# cleared without a half-written cache. Never pkill them: each server is a
# KeepAlive launchd service and would be back within five seconds, mid-wipe.
for app in $(/opt/homebrew/bin/dev | awk '$3=="running"{print $1}'); do
  /opt/homebrew/bin/dev stop "$app" | sed 's/^/  /'
done
echo "  done"

# ---------------------------------------------------------------------------
echo ""
echo "1.5 Claude session processes (RAM, not disk)"
# Each Claude Desktop chat keeps a 200-300MB session process alive until the
# app quits (the app's own idle timeout is disabled), and days of them once
# pushed the machine 11GB into swap (2026-09-01). An hourly launchd job
# (ai.hypertheory.reaper) ends chats idle for 12h, measured by CPU time; a
# manual cleanup tightens to 6h. Ending one loses nothing, chats stay
# resumable. The reaper always spares this session's own ancestry.
sysctl vm.swapusage 2>/dev/null | sed 's/^/  /'
out=$(~/.claude/scripts/reap-claude-sessions.sh 6 2>/dev/null)
[ -n "$out" ] && echo "$out" | sed 's/^/  /' || echo "  none idle over 6h"

# ---------------------------------------------------------------------------
echo ""
echo "2. Claude Code ephemera"
# Session metadata that regenerates on next launch. Transcripts are NOT here.
for d in shell-snapshots session-env debug todos plans cache; do
  wipe "$d" ~/.claude/"$d"
done

# file-history backs the Esc-Esc rewind. It is the undo net now that VS Code
# Local History is switched off, so it keeps a 7 day window rather than being
# wiped. Do not shorten this without turning localHistory back on.
find ~/.claude/file-history -type f -mtime +7 -delete 2>/dev/null
find ~/.claude/file-history -type d -empty -delete 2>/dev/null
echo "  file-history                       pruned to 7 days"

# Session sidecar dirs (subagent + workflow transcripts) sit NEXT TO the
# <uuid>.jsonl chat transcripts. The chats are untouched and stay resumable;
# workflow resume is same-session only, so old sidecars are dead weight.
# -not -name memory is load-bearing: per-project memory lives at the same depth.
find ~/.claude/projects -mindepth 2 -maxdepth 2 -type d -not -name memory -mtime +7 -exec rm -rf {} + 2>/dev/null
echo "  project sidecar dirs               pruned to 7 days"

wipe "CLI cache" ~/Library/Caches/claude-cli-nodejs
find /private/tmp/claude-$(id -u) -mindepth 2 -maxdepth 2 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null
echo "  stale scratchpads                  pruned to 7 days"

# ---------------------------------------------------------------------------
echo ""
echo "3. Permission allow list"
# LOAD-BEARING: only mutate s.permissions.allow. Do NOT touch defaultMode,
# additionalDirectories, or any key outside `allow`. defaultMode=bypassPermissions
# is what makes the CLI run without prompts; the editor extension's bypass lives
# in ~/Library/Application Support/Code/User/settings.json (claudeCode.allow-
# DangerouslySkipPermissions + claudeCode.initialPermissionMode). This skill
# writes to that VS Code file in exactly one place, step 5, and touches only the
# localHistory key. See ~/.claude/CLAUDE.md "Claude Code Permission Mode".
node -e "
const fs=require('fs');
const p=require('os').homedir()+'/.claude/settings.json';
const s=JSON.parse(fs.readFileSync(p,'utf8'));
const before=(s.permissions&&s.permissions.allow||[]).length;
if(s.permissions) s.permissions.allow=[];
fs.writeFileSync(p,JSON.stringify(s,null,2));
console.log('  allow list emptied ('+before+' entries)');
"

# ---------------------------------------------------------------------------
echo ""
echo "4. Repo build caches"
# Globbed over every repo root, so new repos are covered with no edit here.
# NEVER delete tsconfig.tsbuildinfo: it is the incremental typecheck cache and
# removing it makes `tsc --noEmit` slower, which is the opposite of the point.
for dir in ~/code/*/*/; do
  [ -d "$dir/.next" ] && nuke "$(basename "$dir")/.next" "$dir/.next"
  [ -d "$dir/node_modules/.cache" ] && nuke "$(basename "$dir")/nm/.cache" "$dir/node_modules/.cache"
done

# node_modules for repos with no commit in 90 days. A dormant repo's 600MB of
# dependencies is dead weight, and `npm install` restores it exactly if the repo
# ever wakes up. Active repos are listed but never touched, because deleting
# theirs would break the dev server this script just asked you to restart.
CUTOFF=$(( $(date +%s) - 90*86400 ))
for dir in ~/code/*/*/; do
  [ -d "$dir/node_modules" ] || continue
  last=$(git -C "$dir" log -1 --format=%ct 2>/dev/null || echo 0)
  if [ "$last" -lt "$CUTOFF" ]; then
    nuke "$(basename "$dir")/node_modules (dormant)" "$dir/node_modules"
  else
    printf '  %-34s %6s kept (active)\n' "$(basename "$dir")/node_modules" \
      "$(du -sh "$dir/node_modules" 2>/dev/null | cut -f1)"
  fi
done

# ---------------------------------------------------------------------------
echo ""
echo "5. VS Code"
# All of this regenerates and is safe to delete while VS Code is running (macOS
# unlink semantics; the post-run relaunch finishes the job). Everything is wiped
# whole rather than "keep the newest": keeping the newest only ever saved one
# cold start, and the partial-prune logic is exactly what silently failed before.
#
#   CachedExtensionVSIXs  downloaded .vsix installers. Extensions are already
#                         unpacked in ~/.vscode/extensions, so these matter only
#                         on reinstall. Routinely the biggest single item.
#   CachedData            V8 bytecode caches per build. Rebuilds on launch.
#   Cache GPUCache Dawn*  Chromium disk caches.
#   CachedProfilesData    profile scratch.
#   WebStorage            localStorage for extension webview panels. NOT browsing
#   Service Worker        history. Worst case a webview reopens at its default.
#   logs                  one dir per session, including the running one, which
#                         simply reopens its log file.
#   User/History          VS Code Local History, the Timeline panel's store.
#                         Redundant here: git covers tracked files and Claude's
#                         own file-history (step 2) backs Esc-Esc. The feature is
#                         disabled just below, so this stays near zero after the
#                         first run.
VSC=~/Library/"Application Support"/Code
for c in CachedExtensionVSIXs CachedData Cache GPUCache DawnCache DawnGraphiteCache \
         DawnWebGPUCache CachedProfilesData WebStorage "Service Worker" logs User/History; do
  wipe "$c" "$VSC/$c"
done

# Keep Local History from regrowing. Additive single-key write; every other key
# in this file, including the two bypass keys, is preserved exactly.
node -e "
const fs=require('fs');
const p=process.env.HOME+'/Library/Application Support/Code/User/settings.json';
try{
  const s=JSON.parse(fs.readFileSync(p,'utf8'));
  if(s['workbench.localHistory.enabled']===false){console.log('  localHistory already disabled');}
  else{s['workbench.localHistory.enabled']=false;fs.writeFileSync(p,JSON.stringify(s,null,4));console.log('  localHistory disabled');}
}catch(e){console.log('  localHistory setting SKIPPED: '+e.message);}
"

# ---------------------------------------------------------------------------
echo ""
echo "6. Language and package caches"
# typescript: one dir per TS version of the global @types auto-acquisition cache.
#   Only the version matching the active TS server is read, and everything in it
#   re-downloads on demand for plain JS files. Real projects resolve types from
#   their own node_modules and never touch it.
# npm/pip: content-addressable download caches. Clearing costs one slower
#   install and breaks nothing.
# Homebrew: downloaded bottles for already-installed formulae.
wipe "Caches/typescript" ~/Library/Caches/typescript
npm cache clean --force >/dev/null 2>&1 && echo "  npm cache                          cleaned" || echo "  npm cache                          FAILED"
wipe "Caches/pip" ~/Library/Caches/pip
if command -v brew >/dev/null 2>&1; then
  brew cleanup --prune=all >/dev/null 2>&1 && echo "  homebrew                           cleaned" || echo "  homebrew                           FAILED"
else
  echo "  homebrew                           not installed"
fi

# ---------------------------------------------------------------------------
echo ""
echo "7. App updater leftovers"
# Squirrel/ShipIt staging dirs (*.ShipIt, *-updater) are downloaded installers
# for updates that already applied. Pure garbage, every app recreates its own.
# find, not a glob: zsh aborts on a glob that matches nothing.
find ~/Library/Caches -maxdepth 1 \( -name "*.ShipIt" -o -name "*-updater" \) -type d 2>/dev/null | while IFS= read -r d; do
  nuke "$(basename "$d")" "$d"
done

# ---------------------------------------------------------------------------
echo ""
echo "8. App caches"
# Named explicitly rather than wiping ~/Library/Caches wholesale, so a cache
# some app treats as real state can never be caught in the blast radius. These
# are all confirmed regenerable. Chrome and Spotify refill within a day of
# normal use, so expect them back in the discovery scan; that is working cache,
# not bloat, and it is listed here only because it is genuinely reclaimable.
for c in Google com.spotify.client Adobe com.apple.callintelligenced; do
  wipe "$c" ~/Library/Caches/"$c"
done
# Only the Caches copy above. ~/Library/Application Support/Google is the Chrome
# PROFILE (history, passwords, extensions) at 8GB and must never be touched.
# This stray one is a genuine cache dir that ended up under Application Support.
wipe "Application Support/Caches" ~/Library/"Application Support"/Caches

# ---------------------------------------------------------------------------
echo ""
echo "9. Left over (not touched, review if any line looks wrong)"
# The self-maintaining half of this skill. Anything big that the steps above did
# not handle prints here, so bloat from a newly installed app surfaces on the
# next run instead of needing another manual audit. Review this list; if
# something on it is plainly regenerable, add it to step 7 or 8.
{
  du -sh ~/Library/Caches/* 2>/dev/null
  du -sh ~/Library/"Application Support"/* 2>/dev/null
  du -sh ~/.Trash 2>/dev/null
  du -sh ~/.vscode/extensions 2>/dev/null
} | sort -rh | awk '$1 ~ /G$/ || ($1 ~ /M$/ && $1+0 >= 200)' | head -15 | sed 's/^/  /'
echo "  (~/.Trash and ~/.vscode/extensions are deliberate holdouts, see below)"

# ---------------------------------------------------------------------------
# The hub is the one app that runs at login; bring it back, the rest start on demand.
echo ""
echo "10. Dev servers back"
/opt/homebrew/bin/dev hypertheory | sed 's/^/  /'

date -u +"%Y-%m-%dT%H:%M:%S.000Z" > ~/.claude/.last-cleanup
END=$(df -k / | awk 'NR==2{print $4}')
echo ""
echo "Reclaimed this run: $(( (END - START) / 1048576 ))GB"
echo "~/.claude is now $(du -sh ~/.claude 2>/dev/null | cut -f1)"
```

Preserved, never touched: **all conversation transcripts** (`*.jsonl`, chats stay resumable), `~/.claude/projects/*/memory/`, `~/.claude.json` and every MCP server, `~/.claude/plugins/` (the fleet plugin and its marketplaces), `~/.claude/CLAUDE.md`, everything in `~/.claude/settings.json` except the emptied allow list, `~/.claude/file-history` inside 7 days, every key in VS Code's `settings.json` except `workbench.localHistory.enabled`, all source code, and `tsconfig.tsbuildinfo` files (they make `tsc --noEmit` faster).

Deliberate holdouts, each for a reason, all reported by step 9 rather than silently skipped:

- **`~/.vscode/extensions`** (1.4GB). Superseded builds do pile up, but hand-deleting from the directory VS Code resolves extensions out of can break an extension mid-session. VS Code garbage-collects these itself on restart.
- **`~/.Trash`**. Files you chose to keep recoverable. Emptying it is a decision, not a cache sweep.
- **Active repos' `node_modules`**. Deleting them would break the dev server this script just told you to restart. Only repos dormant for 90+ days are cleared.

After running, tell the user: "Cleanup done. The hub dev server is back on port 3000, the other apps start on demand. Quit and relaunch the Claude Desktop app to release the memory its renderer and idle chats hold, since the disk sweep alone will not speed up the current session."
