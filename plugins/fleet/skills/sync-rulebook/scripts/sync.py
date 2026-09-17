#!/usr/bin/env python3
"""Copy the fleet rulebook from the hub to every other fleet repo present.

The rulebook is hypertheory/.claude/rules/fleet.md (the reference). Every other
fleet repo carries a byte-identical copy at the same path because a cloud
session reads only its own repo; the laptop's ~/.claude/CLAUDE.md imports the
hub's copy and needs nothing. The fleet root is ~/code/hypertheory on the
laptop; in a cloud session it is the parent of the current repo, holding only
the repos attached to the session.
"""
import os, subprocess

REL = os.path.join('.claude', 'rules', 'fleet.md')

def fleet_root():
    laptop = os.path.expanduser('~/code/hypertheory')
    if os.path.isfile(os.path.join(laptop, 'hypertheory', REL)):
        return laptop
    top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    return os.path.dirname(top) if top else os.getcwd()

root = fleet_root()
src = os.path.join(root, 'hypertheory', REL)
if not os.path.isfile(src):
    raise SystemExit(f'reference rulebook not found at {src}')
rules = open(src).read()
for name in sorted(os.listdir(root)):
    if name == 'hypertheory':
        continue
    repo = os.path.join(root, name)
    if not os.path.isfile(os.path.join(repo, 'CLAUDE.md')):
        continue
    dst = os.path.join(repo, REL)
    if os.path.isfile(dst) and open(dst).read() == rules:
        continue
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w').write(rules)
    print(f'updated {name}/{REL}')
print('rulebook in sync')
