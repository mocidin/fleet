#!/usr/bin/env python3
"""Copy the fleet rulebook from the hub to every other fleet repo present.

The rulebook is the always-on core hypertheory/.claude/rules/fleet.md plus
the path-scoped notes in hypertheory/.claude/rules/fleet/ (the reference).
Every other fleet repo carries byte-identical copies at the same paths
because a cloud session reads only its own repo; the laptop's
~/.claude/CLAUDE.md imports the hub's core and needs nothing. A note removed
from the hub is removed everywhere. The fleet root is ~/code/hypertheory on
the laptop; in a cloud session it is the parent of the current repo, holding
only the repos attached to the session.
"""
import os, subprocess

CORE = os.path.join('.claude', 'rules', 'fleet.md')
NOTES = os.path.join('.claude', 'rules', 'fleet')

def fleet_root():
    laptop = os.path.expanduser('~/code/hypertheory')
    if os.path.isfile(os.path.join(laptop, 'hypertheory', CORE)):
        return laptop
    top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    return os.path.dirname(top) if top else os.getcwd()

root = fleet_root()
hub = os.path.join(root, 'hypertheory')
if not os.path.isfile(os.path.join(hub, CORE)):
    raise SystemExit(f'reference rulebook not found at {os.path.join(hub, CORE)}')
files = {CORE: open(os.path.join(hub, CORE)).read()}
for name in sorted(os.listdir(os.path.join(hub, NOTES))):
    if name.endswith('.md'):
        files[os.path.join(NOTES, name)] = open(os.path.join(hub, NOTES, name)).read()

for name in sorted(os.listdir(root)):
    if name == 'hypertheory':
        continue
    repo = os.path.join(root, name)
    if not os.path.isfile(os.path.join(repo, 'CLAUDE.md')):
        continue
    changed = False
    for rel, text in files.items():
        dst = os.path.join(repo, rel)
        if os.path.isfile(dst) and open(dst).read() == text:
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, 'w').write(text)
        changed = True
    notes_dir = os.path.join(repo, NOTES)
    if os.path.isdir(notes_dir):
        for stale in os.listdir(notes_dir):
            if os.path.join(NOTES, stale) not in files:
                os.remove(os.path.join(notes_dir, stale))
                changed = True
    if changed:
        print(f'updated {name}')
print('rulebook in sync')
