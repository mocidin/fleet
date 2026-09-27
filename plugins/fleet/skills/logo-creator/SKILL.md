---
name: logo-creator
description: "Install (or remove, or bake in) the ephemeral Logo Creator in any Hypertheory-fleet app (Ghostplug, Brandflare, StonedGPT, Recruiterbase, Hypertheory): a dev-only, full-height floating panel that swaps the app's LIVE header logo, wordmark font, BODY font and PRIMARY color, across a curated grid of 176 star, flame, fire, meteor, space and abstract game-icons.net marks plus a search box over the full 4,239-icon game-icons catalog and 583 Google fonts in ten type groups, with per-type step and shuffle controls, casing, letter spacing, weight and icon size, a 20-step back-forward history, and a bookmark that saves full combinations (with Update original or Save as new when a loaded combo was edited) into a side-by-side Saved list stored per brand in the hub's lab table. Use when the user says \"logo creator\", \"redesign the logo\", \"bring back the logo picker\", \"try new fonts/colors\", \"try new logos\", \"find a new logo/font for <app>\", \"randomize the logo\", \"bake in the logo we picked\", or \"remove the logo creator\"."
---

# Logo Creator (skill name logo-creator)

Status: Hypertheory INSTALLED 2026-09-07 (hub commit a4f5a90, current mark is the
atomic slashes path, Current (Orbitron) logo font and Current (Montserrat) body font
as two `family: null` entries, defaults upper, wide, 500, size 20, hover none; the
hub needs no proxy route or HYPERTHEORY line, its own `/api/lab` takes the admin
session). Hypertheory difference, by Dom's direction: the mark never takes the
primary, it is `text-main` in the header, preview and hover tab, and the live
favicon is #171717 / #fafafa in dark like the hub's icon.svg (commit after
a4f5a90). The files in `files/` are the hub copy as of 2026-09-07 (hub constants,
monochrome mark, the Lorc pattern and water blocks, 346 curated marks) and carry
the catalog browser: author chips (picks, lorc, delapouite, skoll, sbed, all),
uncapped search, icons fetched only as they scroll into view, debounced cache
write. Keep for now (2026-09-07): the X offers "Keep this one for now" when the
selection is not the brand; it crowns the combo (hub `lab.current`, so a later
session can read what Dom is trialing) and PUTs the path to `/api/lab/keep`
(`files/hub-keep-route.ts`, dev only), which rewrites `app/icon.svg` on his
machine so favicon, apple icon, OG and Twitter images follow; nothing is
committed, the trial shows as a modified icon.svg in git status until baked or
reverted with `git checkout app/icon.svg`. Make this my logo (2026-09-07): the
same popover's primary button PUTs the combo plus path to `/api/lab/bake`
(`files/hub-bake-route.ts`, dev only, hub-specific paths and Hypertheory
casing text; port the file when installing elsewhere), which rewrites
icon.svg, LogoIcon.tsx, AppLogo.tsx (lab wiring kept), the layout font loaders
(`// LOGO FONT` and `// BODY FONT` marker lines, FireFilter for the fire hover),
globals (`--font-logo` token, primary when changed, `/* LOGO HOVER */`
keyframes when needed), the AppBadge copy, and the creator's own CURRENT_*,
SAVED_DEFAULT, DEFAULT_LAB and "current" icon entry, then makes one local
commit ("Hypertheory logo baked from the Logo Creator: ..."). The panel then
renames "Current (X)" fonts in the saved list to their real names, crowns the
combo and reloads. Dry-run verified 2026-09-07 (8 files, tsc clean, reverted).
After a bake the manual bake steps below are only needed for a remove. Brandflare BAKED 2026-09-06 (flame-solid by brandflare, Poppins 600
title normal, body Sora, #F77F00, size 21, hover fire) and its Logo Creator removed;
the hub `lab` table and `/api/lab` route stay for the next app. The
Brandflare-specific bits in `files/LogoCreator.tsx` (`RESTORED`, the seed and
restore flags, `CURRENT_*`, the flame-solid entry in icons.ts) are history,
strip them when installing elsewhere.

Built for Brandflare 2026-09-06 and adopted as the fleet way to choose a logo:
nothing is mocked up in a design tool, the candidate mark and wordmark are
swapped into the app's real header, in light and dark, on the marketing page
and inside the product, until one feels right. The three files in `files/`
ARE the tool. Copy them verbatim; do not redesign the panel (Dom signed it
off: "EXACTLY like this").

## Modes

- `/logo-creator` (no args) or `/logo-creator install`: install the panel in the
  current app.
- `/logo-creator show` or "bring the logo creator back": the X hides the panel
  until asked; bump the `HIDE_VERSION` constant in `LogoCreator.tsx` (no
  shortcut, by Dom's choice) and it reappears on the next reload.
- `/logo-creator remove`: strip it, leaving the app byte-identical to before.
- `/logo-creator bake <icon-name> <Font Name> <casing> <tracking> <weight> <size>`
  (or read the choice off the panel's localStorage description the user
  pastes, "polar-star by delapouite, Orbitron"): make the chosen combo the
  app's real logo, then remove the Logo Creator.

## Install

One command, nothing by hand (2026-09-27, after a Whaletrail install lost forty minutes to two stale-copy bugs):

```bash
python3 "$(find ~/.claude/plugins ~/code/hypertheory/fleet -path '*/skills/logo-creator/scripts/install.py' 2>/dev/null | head -1)" <app-key> "<Brand>" "<#primary>" "<Font Name>"
```

Example: `install.py whaletrail Whaletrail "#0284C7" Sora`. The script copies the panel from `files/`, sets `BRAND`, the `Current (<Font>)` entry, `CURRENT_*` and `SAVED_DEFAULT` (title, normal, 500, 22, lift), puts the app's own mark from `app/icon.svg` in as the `current` icon (pass `<path d> <viewBox>` as two more arguments when icon.svg holds more than one path), writes `app/api/lab/route.ts` (the hub proxy) and `app/api/lab/keep/route.ts` (Keep for now, mark in the brand primary), adds `HYPERTHEORY` to `.env.local` from the hub's, wires `AppLogo.tsx` from `files/AppLogo.example.tsx` (the fleet shape: `text-primary` mark, `font-display` wordmark, lift hover), mounts the panel dev-only in `app/layout.tsx` after the modal root, typechecks, curls the pinned dev port and makes ONE local commit. It refuses to run twice. Never push the commit.

`files/` is a byte copy of the hub's live panel (`hypertheory/app/components/logo/creator/`), refreshed whenever the hub's changes: the panel loads every Google font at RUNTIME through one stylesheet link, never one `next/font/google` loader per font. The old 583-loader copy hit Google's rate limit under Next 16.3 and 500ed the dev server on every install (Whaletrail, 2026-09-27); a `next/font/google` name can also disappear between Next versions (`Saira_Stencil_One` became `Saira_Stencil`), which the runtime link never sees. An app whose logo component departs from the fleet shape (a second wordmark class, a different hover) gets `AppLogo.tsx` adjusted by hand after the script, keeping every touched line marked `// EPHEMERAL: logo creator`.

The hub itself is the one exception to the script: its panel is already installed, its mark is monochrome (`text-main`, `#171717` / `#fafafa` favicon), and its keep and bake routes are the hub-specific ones in `files/hub-*.ts`.

## Remove

`git rm -r app/components/logo/creator`, restore the logo component and root
layout from the install commit's parent (`git checkout <sha>^ -- <file>`),
tsc, commit. If the Logo Creator is the only thing in its commits, `git revert` them.

## Bake

Dom's intent (2026-09-06): when a combo wins, everything it names (icon path,
wordmark font, casing, tracking, weight, icon size, body font, primary) gets
wired into the app permanently and the Logo Creator is removed, no manual steps left.

1. Icon: fetch `https://raw.githubusercontent.com/game-icons/icons/master/<by>/<name>.svg`,
   take the `fill="#fff"` path (drop the black `M0 0h512v512H0z` background
   rect), write it into `app/icon.svg` (viewBox `0 0 512 512`, the app's
   `--primary` hex as fill, keep the fleet's theme-aware style block if the
   app has one) and into the app's `LogoIcon.tsx` (`fill="currentColor"`).
   Programmatic apple/OG/twitter images read icon.svg, nothing else changes
   (audited 2026-09-06: all five apps carry icon.svg plus the three
   generators and a byte-identical lib/assets/icon.ts). The Logo Creator previews
   this live by rewriting the favicon link to a data URI of the chosen mark.
   Credit: game-icons.net icons are CC BY 3.0, add "Icon by <author>,
   game-icons.net" to the app's about or legal page if it lacks one.
2. Font: load it in the root layout via `next/font/google` with a
   `--font-logo` variable, register `--font-logo` in the globals `@theme`,
   apply `font-logo` plus the chosen casing text, tracking class and weight in
   the logo component. Nothing else in the app changes font.
3. Icon size: the chosen `size` replaces the icon's `w-[22px] h-[22px]`;
   the chosen hover key's class string (from `HOVERS`) replaces the logo's
   hover classes, and the hub AppBadge CONFIGS entry for the app is updated
   to the same mark, font, color and anim so it no longer needs the override.
4. Body font: if the chosen body differs from the app's current one, swap
   the `next/font/google` loader whose `.className` sits on `<body>` in the
   root layout (Brandflare: `spaceGrotesk.className`) for the chosen font.
   Primary color: set `--primary-rgb` (as `r, g, b`) and `--primary-dark`
   (each channel times 0.85) in the app's globals `:root` block, plus
   `app/icon.svg`'s fill; grep the repo for the old hex to catch hardcoded
   copies (OG images, manifest theme color, email templates).
5. Remove the Logo Creator (above), tsc, one commit, report; push only when Dom says.
6. Hub note: when a sibling's logo changes, update its copy in the hub's
   AppBadge too.

## Where the candidates came from

Icons: game-icons ONLY (`github.com/game-icons/icons`). Font Awesome, MDI,
Tabler, Phosphor, Bootstrap, Remix, Heroicons and Ionicons were tried and
rejected 2026-09-06 ("Lorc's are infinitely better"), and their duplicate
names caused React key warnings; do not bring them back. The curated grid is
`icons.ts` (`{ name, by, viewBox, d }`, black background rect dropped) and
the whole catalog is `catalog.ts` (author, name pairs from the repo tree),
searched in the LOGO section and fetched on demand by `iconCache.ts` from
raw.githubusercontent.com, cached in localStorage. Nothing else out there
matches this style at this size; Kenney (CC0, flat UI), Ravenmore and 7Soul
(PNG fantasy packs) are the nearest and not worth adding. Never write to localStorage from a render effect in this panel: that
is exactly how Dom's saved combos got wiped on 2026-09-06 (an effect wrote the
empty initial list before the loaded one arrived and React's dev double mount
re-read it). Writes happen only inside explicit user actions, and every write
copies the previous list to `logo-creator-saved-backup`, which load falls back to. Fonts: 583 in ten groups (common, geometric, retro, futuristic, space, script, display, serif,
condensed, mono), originally generated by `files/fonts.py` from next's Google font data (latin subset only, no CJK, no pixel fonts); each FONTS entry now carries `family` (the CSS name) and `axis` (`wght@400;700` for fixed fonts, `wght@100..900` for variable ones, read from `font-data.json`), loaded at runtime by `loadFont`, never through next/font. The group filter chips also scope the random font roll. The pixel fonts
(Press Start 2P, VT323, Silkscreen) and the first small display-only set were
tried and rejected 2026-09-06 as unreadable or gimmicky; Dom wants cool,
retro, READABLE, with common fonts mixed in. Check a font exists before
adding: `node -e "console.log(require('next/dist/compiled/@next/font/dist/google/font-data.json')['Font Name'])"`.

Storage: hub `lab` table is the source of truth for saved combos (one row
per brand). `localStorage` keys are namespaced `logo-creator:<brand>:history`
(20 steps), `:saved` (cache), `:saved-backup` (previous value) plus
`logo-creator:icon-cache` (fetched catalog icons, shared across brands).
Each combo is icon, logo font, body font, primary hex, casing, tracking,
weight, icon size. Body font applies as `document.body.style.fontFamily`,
primary as `--primary-rgb` and `--primary-dark` on the root element; the
panel pins its own font (`CURRENT_FONT` in the file names the app's real body
font, update both when installing elsewhere) so body changes never reflow it.
Layout (Dom-approved 2026-09-06, after three rounds; keep it): title row
(shuffle all, save, back, counter, forward, collapse, X to hide), a PINNED preview
(mark, sample sentence, primary button, caption), then six TABS with one
identical shape each, a filter row with that tab's own shuffle on the right
and the picker below: Saved (rows with logo font, body font, color dot, hub
sync dot), Icon (search over the catalog, curated grid, size slider), Logo
font (type chips, stepper, case, spacing, weight), Body font (type chips,
stepper), Color (hex, picker, 149 swatches). No full font list: pick a type,
then step within it or shuffle. Clicking a saved row loads it and remembers
its id; the bookmark then turns amber once edited and offers Update original
or Save as new. The crown on a saved row makes it THE brand: it writes
`lab.current` (icon path included) and the hub's AppBadge renders that
live (mark, font via a runtime Google Fonts link, casing, spacing, weight,
color, hover) over its verbatim copy, so the hub follows a brand change the
moment it is chosen. Bake reads `current` back from the hub row.
