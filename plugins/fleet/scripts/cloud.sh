#!/bin/bash
# Cloud session bootstrap for every fleet repo, run by the plugin's SessionStart
# hook. Does nothing on the laptop (CLAUDE_CODE_REMOTE is only true in a cloud
# session). In the cloud it refreshes this plugin, sets the git identity,
# installs the repo's packages and writes .env.local from the Vercel project's
# Production env, so a phone or browser session runs against the same services
# the laptop does. VERCEL is the team API token set once on the cloud
# environment at claude.ai/code; the Vercel project is named after the repo.
# Never exits non-zero: a failed bootstrap must not block a session.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0

# Pull the latest skills so an edit pushed to mocidin/fleet reaches the next
# cloud session instead of waiting for the environment cache to rebuild.
claude plugin update fleet@fleet >/dev/null 2>&1 || true

# Commits from a cloud session carry the founder's identity, as on the laptop.
git config user.name "Dominic Pusateri" 2>/dev/null || true
git config user.email "dom@hypertheory.ai" 2>/dev/null || true

[ -f package.json ] || exit 0

if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || true
fi

if [ ! -s .env.local ] && [ -n "$VERCEL" ]; then
  project=$(git remote get-url origin 2>/dev/null | sed -E 's#.*/([^/]+?)(\.git)?$#\1#')
  team=team_UeaxNGIDJ3QYArNTa2bj2DAM
  api=https://api.vercel.com
  dir=$(mktemp -d)
  # The list endpoint hands back ciphertext whatever decrypt says; only the
  # single-record endpoint decrypts, so it is one call per variable, in parallel,
  # each to its own file so the JSON never interleaves.
  ids=$(curl -sf -H "Authorization: Bearer $VERCEL" "$api/v9/projects/$project/env?teamId=$team" | jq -r '.envs[] | select(.target | index("production")) | .id')
  for id in $ids; do
    curl -sf -H "Authorization: Bearer $VERCEL" "$api/v1/projects/$project/env/$id?teamId=$team&decrypt=true" > "$dir/$id.json" &
    while [ "$(jobs -r | wc -l)" -ge 8 ]; do sleep 0.2; done
  done
  wait
  # Plain KEY=value lines, quoted only when the value needs it (dotenv reads both).
  cat "$dir"/*.json 2>/dev/null \
    | jq -r 'select(.decrypted == true) | if (.value | test("[\n\"#$\\\\]")) then "\(.key)=\(.value | @json)" else "\(.key)=\(.value)" end' \
    | sort > "$dir/env" 2>/dev/null
  if [ -s "$dir/env" ]; then
    mv "$dir/env" .env.local
    echo "fleet: wrote .env.local for $project from Vercel Production ($(wc -l < .env.local | tr -d ' ') vars)"
  else
    echo "fleet: could not pull env for $project from Vercel"
  fi
  rm -rf "$dir"
fi
exit 0
