#!/bin/bash
# Brings one repo to the latest origin/main, and says so when it cannot: a pull
# that fails without a word is how a laptop ends up serving yesterday's code.
# Run by the laptop's SessionStart hook for the repo a chat opens, by the dev
# wrapper before every start and restart, and by skills.sh for the hub.
#   behind only                  fast-forward
#   behind, with local commits   rebase them onto origin/main (tree must be clean)
#   cannot be done safely        one line saying how far behind and why
# Never forces, never stashes, never touches uncommitted work, never exits
# non-zero: a failed pull must not block a session or a dev server.
main() {
  repo="${1:-$PWD}"
  git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
  name=$(basename "$(git -C "$repo" rev-parse --show-toplevel)")
  [ "$(git -C "$repo" rev-parse --abbrev-ref HEAD 2>/dev/null)" = main ] || exit 0
  git -C "$repo" fetch --quiet origin main 2>/dev/null || { echo "fleet: $name could not reach GitHub, not pulled"; exit 0; }
  behind=$(git -C "$repo" rev-list --count HEAD..origin/main 2>/dev/null)
  [ "${behind:-0}" = 0 ] && exit 0
  ahead=$(git -C "$repo" rev-list --count origin/main..HEAD 2>/dev/null)
  if [ "${ahead:-0}" = 0 ]; then
    git -C "$repo" merge --ff-only --quiet origin/main 2>/dev/null && exit 0
    echo "fleet: $name is $behind behind origin/main and was NOT pulled: uncommitted work touches the same files"
  elif [ -z "$(git -C "$repo" status --porcelain --untracked-files=no)" ]; then
    git -C "$repo" rebase --quiet origin/main >/dev/null 2>&1 && exit 0
    git -C "$repo" rebase --abort >/dev/null 2>&1
    echo "fleet: $name is $behind behind origin/main and was NOT pulled: its $ahead unpushed commits conflict with it"
  else
    echo "fleet: $name is $behind behind origin/main and was NOT pulled: it has $ahead unpushed commits and uncommitted work"
  fi
  exit 0
}
main "$@"
