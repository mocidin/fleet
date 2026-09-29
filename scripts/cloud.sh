#!/bin/bash
# Cloud session bootstrap for every fleet repo, run at every session start by
# the SessionStart hook of this repo's hook-only plugin (hooks/hooks.json),
# which the cloud environment's setup script installs from GitHub
# (claude plugin marketplace add mocidin/fleet; claude plugin install
# fleet@fleet --scope user). The plugin carries this hook and nothing else: no
# skills. Run from a plain clone instead (bash <clone>/scripts/cloud.sh), it
# registers itself as the sandbox's SessionStart hook. Does nothing on the
# laptop (CLAUDE_CODE_REMOTE is only true in a cloud session).
# It links the fleet's skills from the hub's clone into the sandbox (a session
# over one repo also loads that repo's own copy). For the repo the session
# opened or for EVERY repo when the environment checked out several side by side
# (cwd /home/user with hypertheory, recruiterbase, ... under it), sets the git
# identity, installs packages and writes .env.local from the Vercel project's
# Production env, so a phone or browser session runs against the same services
# and secrets the laptop does (the cron secret included, so a cloud session can
# fire a hub route itself instead of waiting on a clock). VERCEL is the team API
# token set once on the cloud environment at claude.ai/code; the Vercel project
# is named after the repo. Every line it prints lands in the session, so the
# session knows what it has. Never exits non-zero: a failed bootstrap must not
# block a session.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
self="$(cd "$(dirname "$0")" && pwd)"
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# Refresh this repo, so an edit to this script reaches the next cloud session
# instead of waiting for the environment cache to rebuild.
if [ -n "$CLAUDE_PLUGIN_ROOT" ]; then
  claude plugin marketplace update fleet >/dev/null 2>&1 || true
  claude plugin update fleet@fleet >/dev/null 2>&1 || true
else
  git -C "$self/.." pull --ff-only --quiet 2>/dev/null || true
fi

team=team_UeaxNGIDJ3QYArNTa2bj2DAM
api=https://api.vercel.com

# As permissive as the platform allows (Dom's standing directive). A cloud
# session refuses bypass whatever any settings file says (it starts in the mode
# picked next to the send button, Auto at best), so the most that can be done is
# an allow rule for every tool and every connector in the sandbox's own user
# settings, which a multi-repo environment reads where it reads no repo's
# settings.json at all. Run from a plain clone, the same file carries this
# script as the SessionStart hook, written once and replaced in place, never
# stacked; run by the plugin's hook or from the plugin's own folders (the setup
# script's first run), none is written and one left by an earlier run is
# removed, so the script never runs twice at a start. Merged, never
# overwritten: whatever else the sandbox's settings hold stays. In place for
# this session when the setup script ran this script before Claude started; for
# the next one otherwise.
plugin="$CLAUDE_PLUGIN_ROOT"; case "$self" in */.claude/plugins/*) plugin="$self" ;; esac
settings="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"
[ -s "$settings" ] || echo '{}' > "$settings"
jq --arg hook "bash \"$self/cloud.sh\"" --arg plugin "$plugin" '.permissions.allow = ((.permissions.allow // []) + [
  "Bash","Read","Edit","Write","MultiEdit","NotebookEdit","Glob","Grep","WebFetch","WebSearch","Agent","Monitor",
  "mcp__Supabase","mcp__Vercel","mcp__Stripe","mcp__Hypertheory","mcp__Gmail","mcp__Notion","mcp__Google_Drive","mcp__Google_Calendar","mcp__Claude_Docs","mcp__github","mcp__vercel"
] | unique) | .permissions.defaultMode = "auto" | .skipDangerousModePermissionPrompt = true
| .hooks.SessionStart = ((.hooks.SessionStart // []) | map(select(((.hooks // []) | map(.command // "" | test("scripts/cloud\\.sh")) | any) | not))
  + (if $plugin != "" then [] else [{matcher: "startup|resume", hooks: [{type: "command", command: $hook, timeout: 600, statusMessage: "Bootstrapping the cloud session"}]}] end))
| if (.hooks.SessionStart | length) == 0 then del(.hooks.SessionStart) else . end' "$settings" > "$settings.tmp" 2>/dev/null && mv "$settings.tmp" "$settings" || rm -f "$settings.tmp"

pull_env() {
  project=$(git remote get-url origin 2>/dev/null | sed -E 's#.*/([^/]+?)(\.git)?$#\1#')
  dir=$(mktemp -d)
  # The list endpoint hands back ciphertext whatever decrypt says; only the
  # single-record endpoint decrypts, so it is one call per variable, in parallel,
  # each to its own file so the JSON never interleaves.
  ids=$(curl -sf -H "Authorization: Bearer $VERCEL" "$api/v9/projects/$project/env?teamId=$team" | jq -r '.envs[] | select(.target | index("production")) | .id')
  fetch() { curl -sf --retry 4 --retry-all-errors --retry-delay 1 -H "Authorization: Bearer $VERCEL" "$api/v1/projects/$project/env/$1?teamId=$team&decrypt=true" > "$dir/$1.json" || rm -f "$dir/$1.json"; }
  for id in $ids; do
    fetch "$id" &
    while [ "$(jobs -r | wc -l)" -ge 6 ]; do sleep 0.2; done
  done
  wait
  # A transient connection failure must not cost a variable: one more pass, serial, for any record still missing.
  for id in $ids; do [ -s "$dir/$id.json" ] || fetch "$id"; done
  expected=$(printf '%s\n' $ids | grep -c .); got=$(ls "$dir"/*.json 2>/dev/null | wc -l | tr -d ' ')
  [ "$got" = "$expected" ] || echo "fleet: pulled $got of $expected env records for $project"
  # Plain KEY=value lines, quoted only when the value needs it (dotenv reads both).
  cat "$dir"/*.json 2>/dev/null \
    | jq -r 'select(.decrypted == true) | .value |= (sub("^\\s+"; "") | sub("\\s+$"; "")) | if (.value | test("[\n\"#$\\\\]")) then "\(.key)=\(.value | @json)" else "\(.key)=\(.value)" end' \
    | sort > "$dir/env" 2>/dev/null
  if [ -s "$dir/env" ]; then
    mv "$dir/env" .env.local
    echo "fleet: wrote .env.local for $project from Vercel Production ($(wc -l < .env.local | tr -d ' ') vars)"
  else
    echo "fleet: could not pull env for $project from Vercel"
  fi
  rm -rf "$dir"
}

# One repo: identity, packages, env. Runs in a subshell so a cd never leaks.
bootstrap() (
  cd "$1" 2>/dev/null || exit 0
  # Commits from a cloud session carry the founder's identity, as on the laptop.
  git config user.name "Dominic Pusateri" 2>/dev/null || true
  git config user.email "dom@hypertheory.ai" 2>/dev/null || true
  [ -f package.json ] || exit 0
  if [ ! -d node_modules ]; then
    npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || true
  fi
  if [ -s .env.local ]; then
    echo "fleet: $(basename "$PWD") already has .env.local"
  elif [ -n "$VERCEL" ]; then
    pull_env
  else
    echo "fleet: $(basename "$PWD") has no .env.local and the environment has no VERCEL token to pull one"
  fi
)

# The skills, where a repo's own copy is not loaded at start: a session over
# several repos opens above the clones, so the hub's folder (any repo's, when
# the hub is not attached: the copies are identical) is linked into the
# sandbox's own ~/.claude/skills.
for src in "$PWD/hypertheory/.claude/skills" "$PWD"/*/.claude/skills "$PWD/.claude/skills"; do
  [ -d "$src" ] && { bash "$self/skills.sh" "$src" || true; break; }
done

if [ -d .git ]; then
  bootstrap "$PWD"
else
  # A multi-repo environment: the session opens above the repos, so each one is bootstrapped in turn.
  for d in */; do [ -d "$d/.git" ] && bootstrap "$PWD/${d%/}"; done
fi
exit 0
