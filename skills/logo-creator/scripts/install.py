#!/usr/bin/env python3
"""Install the ephemeral Logo Creator in a fleet app in one pass.

usage: install.py <app-key> <Brand Name> <#primary> <Font Name> [<path d of the current mark> <viewBox>]

Copies the panel from files/ (kept identical to the hub's live copy, which loads
fonts at runtime; never a build-time loader per font), sets the brand constants,
writes the hub proxy and keep routes, adds HYPERTHEORY to .env.local, wires
AppLogo.tsx and mounts the panel in app/layout.tsx dev-only, then typechecks,
curls the app's dev port and commits ONE local commit. Idempotent: a second run
on an installed app stops at once.
"""
import os, re, subprocess, sys, pathlib, json

if len(sys.argv) < 5:
    sys.exit(__doc__)
app, brand, primary, font = sys.argv[1:5]
here = pathlib.Path(__file__).resolve().parent.parent / 'files'
root = pathlib.Path.home() / 'code' / 'hypertheory' / app
hub = pathlib.Path.home() / 'code' / 'hypertheory' / 'hypertheory'
if not root.is_dir():
    sys.exit(f'no app at {root}')
creator = root / 'app' / 'components' / 'logo' / 'creator'
if creator.exists():
    sys.exit(f'{app} already has the Logo Creator at {creator}')

def run(*cmd, cwd=root, check=True):
    return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=check)

# The current mark: from the args, else the single path of app/icon.svg.
if len(sys.argv) >= 7:
    d, view_box = sys.argv[5], sys.argv[6]
else:
    svg = (root / 'app' / 'icon.svg').read_text()
    m = re.search(r'\sd="([^"]+)"', svg); vb = re.search(r'viewBox="([^"]+)"', svg)
    if not m or not vb:
        sys.exit('could not read a path and viewBox from app/icon.svg; pass them as arguments')
    d, view_box = m.group(1), vb.group(1)

creator.mkdir(parents=True)
for f in ('LogoCreator.tsx', 'store.ts', 'icons.ts', 'iconCache.ts', 'catalog.ts'):
    (creator / f).write_text((here / f).read_text())

s = (creator / 'store.ts').read_text()
s = re.sub(r'export const BRAND = "[^"]+";', f'export const BRAND = "{brand}";', s, count=1)
(creator / 'store.ts').write_text(s)

s = (creator / 'icons.ts').read_text()
s, n = re.subn(r'\{ name: "current", by: "[^"]+", viewBox: "[^"]+", d: "[^"]*" \},\n',
               f'{{ name: "current", by: "{app}", viewBox: "{view_box}", d: "{d}" }},\n', s, count=1)
if n != 1: sys.exit('icons.ts has no "current" entry to replace')
(creator / 'icons.ts').write_text(s)

s = (creator / 'LogoCreator.tsx').read_text()
s, n1 = re.subn(r'  \{ name: "Current \([^)]+\)", family: null, group: "[a-z]+" \},\n(  \{ name: "Current \([^)]+\)", family: null, group: "[a-z]+" \},\n)?',
                f'  {{ name: "Current ({font})", family: null, group: "common" }},\n', s, count=1)
s, n2 = re.subn(r'const CURRENT_FONT = "[^"]+";', f'const CURRENT_FONT = "Current ({font})";', s, count=1)
s, n3 = re.subn(r'const CURRENT_BODY = "[^"]+";', f'const CURRENT_BODY = "Current ({font})";', s, count=1)
s, n4 = re.subn(r'const CURRENT_PRIMARY = "#[0-9A-Fa-f]{6}";', f'const CURRENT_PRIMARY = "{primary}";', s, count=1)
s, n5 = re.subn(r'const SAVED_DEFAULT: Saved = \{[^\n]*\};',
                f'const SAVED_DEFAULT: Saved = {{ icon: "current", by: "{app}", font: CURRENT_FONT, body: CURRENT_BODY, primary: CURRENT_PRIMARY, casing: "title", tracking: "normal", weight: 500, size: 22, hover: "lift" }};', s, count=1)
if not all((n1, n2, n3, n4, n5)): sys.exit(f'constants not all found in LogoCreator.tsx: {(n1, n2, n3, n4, n5)}')
(creator / 'LogoCreator.tsx').write_text(s)

lab = root / 'app' / 'api' / 'lab'
(lab / 'keep').mkdir(parents=True, exist_ok=True)
(lab / 'route.ts').write_text((here / 'proxy-route.ts').read_text())
(lab / 'keep' / 'route.ts').write_text((here / 'keep-route.ts').read_text().replace("const PRIMARY = '#0284C7';", f"const PRIMARY = '{primary}';"))

env = root / '.env.local'
if 'HYPERTHEORY=' not in env.read_text():
    token = next(l.split('=', 1)[1] for l in (hub / '.env.local').read_text().splitlines() if l.startswith('HYPERTHEORY='))
    with env.open('a') as fh: fh.write(f'\nHYPERTHEORY={token}\n')

logo = root / 'app' / 'components' / 'logo' / 'AppLogo.tsx'
logo.write_text((here / 'AppLogo.example.tsx').read_text().replace('Whaletrail', brand))

layout = root / 'app' / 'layout.tsx'
s = layout.read_text()
if 'LogoCreator' not in s:
    s = s.replace('import "./globals.css";', 'import "./globals.css";\nimport LogoCreator from "@/app/components/logo/creator/LogoCreator"; // EPHEMERAL: logo creator', 1)
    s = s.replace('<div id="modal-root"></div>', '<div id="modal-root"></div>\n                {process.env.NODE_ENV === "development" && <LogoCreator />} {/* EPHEMERAL: logo creator */}', 1)
    if 'LogoCreator />' not in s: sys.exit('could not mount the panel: no modal-root in app/layout.tsx')
    layout.write_text(s)

tsc = run('npx', 'tsc', '--noEmit', check=False)
if tsc.returncode: sys.exit('typecheck failed:\n' + tsc.stdout + tsc.stderr)
port = re.search(r'next dev[^"]* -p (\d+)', (root / 'package.json').read_text())
if port:
    code = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', f'http://localhost:{port.group(1)}/'], text=True, capture_output=True).stdout
    print(f'dev server on {port.group(1)} answers {code}')
run('git', 'add', '-A')
run('git', 'commit', '-q', '-m', f'Ephemeral logo creator installed in {brand}\n\nCo-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>')
print(f'installed in {app}: one local commit, not pushed')
