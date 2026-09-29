#!/bin/bash
# The link step. The fleet's skills live in the hub repo, one folder each under
# .claude/skills/, and every fleet repo carries a synced copy, which is what a
# chat opened in a repo loads, laptop or cloud. This links the hub's folders
# into ~/.claude/skills as well, for the two cases a repo's own copy does not
# cover: a chat opened outside a repo (anywhere on the laptop, or a cloud
# session over several repos, which starts above the clones and would not see
# their skills until it worked in one), and an edit to the hub's copy, live in
# every laptop chat before it is synced or committed. Run by the laptop's
# user-scope SessionStart hook with no argument (it pulls the hub first, so a
# skill changed from the phone is here in the next chat) and by cloud.sh with
# the skills folder of the hub's clone. A skill deleted from the hub loses its
# link. Never exits non-zero: a failed refresh must not block a session.
main() {
  here="$(cd "$(dirname "$0")" && pwd)"
  dest="$HOME/.claude/skills"
  src="$1"
  if [ -z "$src" ]; then
    src="$HOME/code/hypertheory/hypertheory/.claude/skills"
    bash "$here/pull.sh" "$HOME/code/hypertheory/hypertheory"
  fi
  [ -d "$src" ] || exit 0
  mkdir -p "$dest"
  for dir in "$src"/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    link="$dest/$(basename "$dir")"
    # A real folder of the same name is somebody's own skill: left alone, and said.
    if [ -e "$link" ] && [ ! -L "$link" ]; then echo "fleet: $link is not a link, skill not refreshed"; continue; fi
    ln -sfn "${dir%/}" "$link"
  done
  # A link that points at nothing is a skill that was deleted or moved: removed.
  for link in "$dest"/*; do
    [ -L "$link" ] && [ ! -e "$link" ] && rm -f "$link"
  done
  exit 0
}
main "$@"
