#!/bin/zsh
# The keeper: the one maintenance job for the laptop. Runs hourly from launchd
# (ai.hypertheory.keeper); "keeper deep" is the same sweep by hand when asked.
#
#   keeper            hourly pass: end chats idle 12h, stop dev servers idle 6h
#                     (the hub excepted), prune week-old Claude scratch, warn
#                     when swap runs high; runs the weekly sweep by itself on
#                     the first pass between 3 and 6am once 7 days have passed
#   keeper deep       the weekly sweep now: chats idle 6h, every dev server
#                     stopped, every regenerable cache wiped, a scan of what is
#                     left, the hub restarted
#   keeper [mode] dry report what would happen, change nothing
#
# Two rules: only regenerable state is ever deleted (never source, chats,
# memory, credentials), and anything big it does not handle is reported, not
# ignored, so new bloat surfaces on the next run instead of needing an audit.
MODE=${1:-hourly}; DRY=${2:-}; [[ $MODE == dry ]] && { MODE=hourly; DRY=dry }
FLEET=~/code/hypertheory; DEV=/opt/homebrew/bin/dev
STATE=~/.claude/.keeper-state; STAMP=~/.claude/.last-cleanup
NOW=$(date +%s); H=3600
say() { echo "$(date '+%F %T') $*" }
act() { [[ -n $DRY ]] && { echo "  would: $*"; return 1 }; return 0 }

# Every wipe reports before -> after so a no-op is visible, never a false success.
wipe() { local l=$1 d=$2; [[ -d $d ]] || { printf '  %-34s absent\n' $l; return }
  local b=$(du -sh $d 2>/dev/null | cut -f1); act "clear $d" || return
  find "${d:?}" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null
  printf '  %-34s %6s -> %s\n' $l $b "$(du -sh $d 2>/dev/null | cut -f1)" }
nuke() { local l=$1 d=$2; [[ -e $d ]] || { printf '  %-34s absent\n' $l; return }
  local b=$(du -sh $d 2>/dev/null | cut -f1); act "remove $d" || return
  rm -rf "${d:?}"; [[ -e $d ]] && printf '  %-34s %6s FAILED\n' $l $b || printf '  %-34s %6s -> gone\n' $l $b }

# --- chats: end Claude chat processes idle for $1 hours. A chat exposes no
# session id, but one that is thinking, running tools or receiving messages
# burns CPU and an idle one does not, so idleness is CPU time standing still.
# Ending one loses nothing: the transcript is on disk and the chat resumes on
# its next message. This process's own ancestry is always spared.
chats() {
  local limit=$(( $1 * H )); typeset -A SPARE PCPU PAT; local p=$$
  while (( p > 1 )); do SPARE[$p]=1; p=$(ps -o ppid= -p $p 2>/dev/null | tr -d ' '); [[ -n $p ]] || break; done
  [[ -f $STATE ]] && while read -r pid cpu at; do PCPU[$pid]=$cpu; PAT[$pid]=$at; done < $STATE
  : > $STATE.next
  ps -axo pid=,rss=,time=,command= | grep -E "anthropic\.claude-code|Claude/claude-code/[^ ]*/MacOS/claude " | grep -v -e grep -e disclaimer | while read -r pid rss time rest; do
    local t=${time%%.*} secs=0; IFS=: read -rA f <<< "${t//-/:}"; for x in "${f[@]}"; do secs=$(( secs * 60 + x )); done
    local cpu=${PCPU[$pid]:-} at=${PAT[$pid]:-}
    if [[ -z $cpu ]] || (( secs < cpu || secs >= cpu + 1 )); then cpu=$secs; at=$NOW; fi
    echo "$pid $cpu $at" >> $STATE.next
    [[ -n ${SPARE[$pid]:-} ]] && continue
    local idle=$(( NOW - at )); (( idle >= limit )) || continue
    act "end chat pid $pid (idle $(( idle / H ))h, $(( rss / 1024 ))MB)" || continue
    kill -TERM $pid 2>/dev/null && say "ended chat pid $pid (idle $(( idle / H ))h, $(( rss / 1024 ))MB)"
  done
  mv $STATE.next $STATE
}

# --- servers: stop dev servers whose log has not moved in $1 hours (Next logs
# every request and compile, so the log's age is the server's idle time). The
# hub is the one app that lives permanently. "all" stops every running one.
servers() {
  $DEV | awk '$3=="running"{print $1}' | while read -r app; do
    [[ $1 == all ]] || { [[ $app == hypertheory ]] && continue
      local age=$(( NOW - $(stat -f %m ~/Library/Logs/fleet/$app.log 2>/dev/null || echo $NOW) ))
      (( age >= $1 * H )) || continue }
    act "stop dev server $app" || continue
    $DEV stop $app >/dev/null && say "stopped dev server $app"
  done
}

# --- memory: a warning, not a fix. macOS grows swap on demand, so used/total
# says little; the kernel's own free percentage is the honest signal.
memory() { local free=$(memory_pressure 2>/dev/null | sed -nE 's/.*free percentage: ([0-9]+)%.*/\1/p')
  [[ -n $free ]] && (( free < 15 )) && say "memory tight: ${free}% free, $(sysctl -n vm.swapusage | sed -E 's/.*used = ([0-9.]+)M.*/\1/')M swapped, quit the Claude app or run keeper deep"; true }

# --- scratch: week-old Claude scratch that regenerates. Transcripts are NOT here.
# file-history backs the Esc-Esc rewind, so it keeps a 7 day window. The
# sidecar prune's -not -name memory is load-bearing: per-project memory lives at
# the same depth as the sidecar dirs.
scratch() {
  act "prune Claude scratch older than 7 days" || return
  find ~/.claude/file-history -type f -mtime +7 -delete 2>/dev/null; find ~/.claude/file-history -type d -empty -delete 2>/dev/null
  find ~/.claude/projects -mindepth 2 -maxdepth 2 -type d -not -name memory -mtime +7 -exec rm -rf {} + 2>/dev/null
  find /private/tmp/claude-$(id -u) -mindepth 2 -maxdepth 2 -type d -mtime +7 -exec rm -rf {} + 2>/dev/null
  for d in shell-snapshots session-env debug; do find ~/.claude/$d -type f -mtime +1 -delete 2>/dev/null; done
}

# --- sweep: the weekly deep clean.
sweep() {
  local START=$(df -k / | awk 'NR==2{print $4}')
  echo; say "weekly sweep${DRY:+ (dry)}"
  echo; echo "1. Chats idle over 6h and every dev server"; chats 6; servers all
  echo; echo "2. Claude scratch"; scratch
  for d in shell-snapshots session-env debug todos plans cache; do wipe $d ~/.claude/$d; done
  wipe "CLI cache" ~/Library/Caches/claude-cli-nodejs
  echo; echo "3. Repo build caches (tsconfig.tsbuildinfo is kept: it makes tsc faster)"
  for dir in ~/code/*/*/; do
    [[ -d $dir/.next ]] && nuke "$(basename $dir)/.next" $dir/.next
    [[ -d $dir/node_modules/.cache ]] && nuke "$(basename $dir)/nm/.cache" $dir/node_modules/.cache; done
  local CUTOFF=$(( NOW - 90 * 86400 ))
  for dir in ~/code/*/*/; do [[ -d $dir/node_modules ]] || continue
    if (( $(git -C $dir log -1 --format=%ct 2>/dev/null || echo 0) < CUTOFF )); then nuke "$(basename $dir)/node_modules (dormant)" $dir/node_modules
    else printf '  %-34s %6s kept (active)\n' "$(basename $dir)/node_modules" "$(du -sh $dir/node_modules 2>/dev/null | cut -f1)"; fi; done
  echo; echo "4. VS Code leftovers (retired app; every entry regenerates)"
  local VSC=~/Library/"Application Support"/Code
  for c in CachedExtensionVSIXs CachedData Cache GPUCache DawnCache DawnGraphiteCache DawnWebGPUCache CachedProfilesData WebStorage "Service Worker" logs User/History; do wipe $c "$VSC/$c"; done
  echo; echo "5. Language and package caches"
  wipe "Caches/typescript" ~/Library/Caches/typescript; wipe "Caches/pip" ~/Library/Caches/pip
  act "npm cache clean, brew cleanup" && { npm cache clean --force >/dev/null 2>&1 && echo "  npm cache                          cleaned"
    command -v brew >/dev/null && brew cleanup --prune=all >/dev/null 2>&1 && echo "  homebrew                           cleaned"; }
  echo; echo "6. App updater leftovers and known-safe app caches"
  find ~/Library/Caches -maxdepth 1 \( -name "*.ShipIt" -o -name "*-updater" \) -type d 2>/dev/null | while IFS= read -r d; do nuke "$(basename $d)" $d; done
  for c in Google com.spotify.client Adobe com.apple.callintelligenced; do wipe $c ~/Library/Caches/$c; done
  wipe "Application Support/Caches" ~/Library/"Application Support"/Caches
  echo; echo "7. Left over, not touched (add to 6 if plainly regenerable; ~/.Trash and ~/.vscode/extensions are deliberate holdouts)"
  { du -sh ~/Library/Caches/* ~/Library/"Application Support"/* ~/.Trash ~/.vscode/extensions 2>/dev/null; } | sort -rh | awk '$1 ~ /G$/ || ($1 ~ /M$/ && $1+0 >= 200)' | head -15 | sed 's/^/  /'
  echo; echo "8. Hub back"; act "restart hub" && $DEV hypertheory | sed 's/^/  /'
  [[ -z $DRY ]] && date -u +"%Y-%m-%dT%H:%M:%S.000Z" > $STAMP
  echo; echo "Reclaimed: $(( ($(df -k / | awk 'NR==2{print $4}') - START) / 1048576 ))GB, ~/.claude is $(du -sh ~/.claude 2>/dev/null | cut -f1)"
}

case $MODE in
  deep) sweep ;;
  hourly) chats 12; servers 6; scratch; memory
    (( NOW - $(stat -f %m $STAMP 2>/dev/null || echo 0) > 7 * 86400 )) && [[ $(date +%H) == 0[3-5] ]] && sweep ;;
  *) echo "usage: keeper [hourly|deep] [dry]"; exit 1 ;;
esac
exit 0
