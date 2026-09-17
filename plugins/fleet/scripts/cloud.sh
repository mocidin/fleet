#!/bin/bash
# Cloud session bootstrap for every fleet repo, run by the plugin's SessionStart
# hook. Does nothing on the laptop (CLAUDE_CODE_REMOTE is only true in a cloud
# session). In the cloud it installs the repo's packages and writes .env.local
# from the Vercel project's Production env, so a phone or browser session runs
# against the same services the laptop does. VERCEL is the team API token set
# once on the cloud environment at claude.ai/code; the Vercel project is named
# after the repo. Never exits non-zero: a failed bootstrap must not block a session.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -f package.json ] || exit 0

# Pull the latest skills so an edit pushed to mocidin/fleet reaches the next
# cloud session instead of waiting for the environment cache to rebuild.
claude plugin update fleet@fleet >/dev/null 2>&1 || true

if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 || true
fi

if [ ! -s .env.local ] && [ -n "$VERCEL" ]; then
  project=$(git remote get-url origin 2>/dev/null | sed -E 's#.*/([^/]+?)(\.git)?$#\1#')
  team=team_UeaxNGIDJ3QYArNTa2bj2DAM
  # Plain KEY=value lines, quoted only when the value needs it (dotenv reads both).
  curl -sf -H "Authorization: Bearer $VERCEL" \
    "https://api.vercel.com/v9/projects/$project/env?teamId=$team&decrypt=true" \
    | jq -r '.envs[] | select(.target | index("production")) | if (.value | test("[\n\"#$\\\\]")) then "\(.key)=\(.value | @json)" else "\(.key)=\(.value)" end' \
    > .env.local 2>/dev/null || rm -f .env.local
  [ -s .env.local ] && echo "fleet: wrote .env.local for $project from Vercel Production" || echo "fleet: could not pull env for $project from Vercel"
fi
exit 0
