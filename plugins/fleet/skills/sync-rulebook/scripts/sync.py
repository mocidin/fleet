#!/usr/bin/env python3
"""Keep every copy of the fleet rulebook identical.

The rulebook is the "## Fleet rulebook" block at the end of the hub's CLAUDE.md
(hypertheory/CLAUDE.md). Every other fleet repo carries the same block, and the
laptop's ~/.claude/CLAUDE.md carries the same sections plus its laptop-only ones.

  python3 sync.py                hub block -> every sibling repo present, and the laptop file when it exists
  python3 sync.py --from-global  laptop ~/.claude/CLAUDE.md -> hub block -> every sibling repo

The fleet root is ~/code/hypertheory on the laptop; in a cloud session it is the
parent of the current repo, holding only the repos attached to the session.
"""
import os, re, sys, subprocess

HEADER = '## Fleet rulebook'
LAPTOP_ONLY = {'## Claude Code Permission Mode (VS Code extension)', '## Memory & Knowledge Layout'}
PREAMBLE = (
    "The complete standards for every Hypertheory repo, mirrored verbatim from Dom's laptop rulebook (the hub copy is the reference; a change to one is made in all six repos in the same sitting). "
    "Cloud sessions read only this file, so nothing that affects code, design, data, or how replies are written lives anywhere else. Laptop-only rules (the Vercel CLI login gate, permission mode, memory layout) stay on the laptop."
)
GLOBAL = os.path.expanduser('~/.claude/CLAUDE.md')

def fleet_root():
    laptop = os.path.expanduser('~/code/hypertheory')
    if os.path.isdir(os.path.join(laptop, 'hypertheory')):
        return laptop
    top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    return os.path.dirname(top) if top else os.getcwd()

def sections(text):
    """[(title, body)] for every '## ' section; the text before the first is dropped."""
    parts = re.split(r'^(?=## )', text, flags=re.M)
    out = []
    for p in parts:
        if not p.startswith('## '):
            continue
        title = p.split('\n', 1)[0].strip()
        out.append((title, p.rstrip('\n')))
    return out

def block_from_sections(secs):
    return HEADER + '\n\n' + PREAMBLE + '\n\n' + '\n\n'.join(body for _, body in secs) + '\n'

def read(p):
    return open(p).read() if os.path.exists(p) else None

def write_if_changed(p, new):
    old = read(p)
    if old == new:
        return False
    open(p, 'w').write(new)
    return True

def block_of(text):
    i = text.find(HEADER)
    return text[i:] if i >= 0 else None

def main():
    root = fleet_root()
    hub = os.path.join(root, 'hypertheory', 'CLAUDE.md')
    from_global = '--from-global' in sys.argv
    if from_global:
        g = read(GLOBAL)
        if g is None:
            sys.exit('no ~/.claude/CLAUDE.md on this machine; run without --from-global')
        secs = [(t, b) for t, b in sections(g) if t not in LAPTOP_ONLY]
        block = block_from_sections(secs)
        h = read(hub)
        if h is None:
            sys.exit(f'hub CLAUDE.md not found at {hub}')
        head = h[:h.find(HEADER)] if HEADER in h else h.rstrip('\n') + '\n\n'
        if write_if_changed(hub, head + block):
            print('updated hypertheory/CLAUDE.md from the laptop rulebook')
    h = read(hub)
    if h is None or HEADER not in h:
        sys.exit(f'hub CLAUDE.md has no "{HEADER}" block at {hub}')
    block = block_of(h)
    # 1. every sibling repo present
    for name in sorted(os.listdir(root)):
        p = os.path.join(root, name, 'CLAUDE.md')
        if name == 'hypertheory' or not os.path.exists(p):
            continue
        t = read(p)
        if HEADER not in t:
            continue
        if write_if_changed(p, t[:t.find(HEADER)] + block):
            print(f'updated {name}/CLAUDE.md')
    # 2. the laptop file: same-titled sections replaced, laptop-only sections kept
    g = read(GLOBAL)
    if g is not None and not from_global:
        new_secs = dict(sections(block.split('\n\n', 2)[2]))
        parts = re.split(r'^(?=## )', g, flags=re.M)
        out = []
        for p in parts:
            title = p.split('\n', 1)[0].strip() if p.startswith('## ') else None
            if title in new_secs:
                out.append(new_secs[title] + '\n\n')
            else:
                out.append(p)
        new = ''.join(out)
        if write_if_changed(GLOBAL, new):
            print('updated ~/.claude/CLAUDE.md')
    print('rulebook in sync')

if __name__ == '__main__':
    main()
