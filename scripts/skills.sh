#!/bin/bash
# The laptop's link step. The fleet's skills live in the hub repo, one folder
# each under .claude/skills/, and every fleet repo carries a synced copy, which
# is what a chat opened in a repo loads, laptop or cloud. This links the hub's
# folders into ~/.claude/skills as well, so a chat opened anywhere on the laptop
# has them, and an edit to the hub's copy is live in every laptop chat before it
# is synced or committed. Run by the laptop's user-scope SessionStart hook. It
# pulls the hub first, so a skill changed from the phone is here in the next
# chat; a skill deleted from the hub loses its link. Never exits non-zero: a
# failed refresh must not block a session.
main() {
  hub="$HOME/code/hypertheory/hypertheory"
  dest="$HOME/.claude/skills"
  [ -d "$hub/.claude/skills" ] || exit 0
  git -C "$hub" pull --ff-only --quiet 2>/dev/null || true
  mkdir -p "$dest"
  for dir in "$hub"/.claude/skills/*/; do
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
main
