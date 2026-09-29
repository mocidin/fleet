#!/bin/bash
# Makes every skill in this repo a slash command in every chat on this machine,
# laptop or cloud sandbox, with no install step and no copy: each folder under
# skills/ is linked into ~/.claude/skills, which Claude Code reads live. So a
# skill added, edited or deleted here is added, edited or deleted everywhere the
# moment the change is on disk. Run at every session start (the laptop's
# user-scope SessionStart hook, the cloud's through cloud.sh): it pulls this
# repo first, so a change pushed from one machine reaches the next chat on any
# other. jobs/ is never linked: those are the briefs the hub's recurring agents
# read from GitHub, not commands anyone types. Never exits non-zero: a failed
# refresh must not block a session.
main() {
  root="$(cd "$(dirname "$0")/.." && pwd)" || exit 0
  dest="$HOME/.claude/skills"
  git -C "$root" pull --ff-only --quiet 2>/dev/null || true
  mkdir -p "$dest"
  for dir in "$root"/skills/*/; do
    [ -f "$dir/SKILL.md" ] || continue
    link="$dest/$(basename "$dir")"
    # A real folder of the same name is somebody's own skill: left alone, and said.
    if [ -e "$link" ] && [ ! -L "$link" ]; then echo "fleet: $link is not a link, skill not refreshed"; continue; fi
    ln -sfn "${dir%/}" "$link"
  done
  # A skill deleted from the repo leaves a link pointing at nothing: removed.
  for link in "$dest"/*; do
    [ -L "$link" ] || continue
    case "$(readlink "$link")" in "$root"/*) [ -e "$link" ] || rm -f "$link" ;; esac
  done
  exit 0
}
main
