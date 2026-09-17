---
name: social-assets
description: Generate a fleet app's social identity kit, the profile photo (white mark on the app primary, 1080x1080), its Notion icon (gray mark on transparent, 280x280), and three LinkedIn header options in the mosaic pixel-block pattern at random seeds, all in the app's own colors; either piece can be made alone. Use when the user asks for social assets, a profile photo, avatar, LinkedIn header, cover, banner or brand assets for Ghostplug, Recruiterbase, Brandflare, StonedGPT or Hypertheory.
---

# Social assets

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


One command produces the profile photo and THREE header candidates for an app,
each read from the app's own `app/icon.svg` and `--primary-rgb`, nothing
hand-picked. The default family is `mosaic` (the pixel-block die of squares at
tiny squares with occasional 2x2 clusters, three tints, no background panels,
finalized by Dom 2026-08-29: do not restyle it, a new look gets its own variant), three fresh seeds per run, each also rendered as a `-left` cut whose
tiles fade out across the left third where LinkedIn's profile photo sits. The user
picks a header; the chosen one's variant and seed are its permanent recipe.

The scripts live beside this SKILL.md (find the directory with `find ~/code/hypertheory/fleet ~/.claude/plugins -path '*/skills/social-assets/scripts/social-assets.mjs' | head -1`).

```bash
node <this skill's directory>/scripts/social-assets.mjs <app-key> [--variant <family>|random] [--theme light|dark|white|brand] [--seed N] [--count 3]
```

- Profile photo: the app's mark from `app/icon.svg` recolored white, centered at
  56% on a solid square of its primary, 1080x1080 (`scripts/profile-photo.mjs`,
  which can also run alone: `node .../profile-photo.mjs <app>`). A monochrome
  mark (every color in icon.svg is a gray, which is Hypertheory: the brand is
  black and white, its green `--primary-rgb` is only a UI accent) gets the mark's
  own darkest gray as the ground instead, so Hypertheory is white on near-black.
- Notion icon: `node .../profile-photo.mjs <app> --notion` renders the app's
  mark as a Notion page / workspace icon (Settings, General, Icon). Notion paints
  its own tinted rounded square behind an icon, so the file is the mark ALONE:
  280x280 (Notion's documented icon size), a TRANSPARENT background, never a
  colored square, and the mark in Notion's flat icon gray `#d4d4d4` with its ink
  spanning 80% of the canvas. That is how every icon in the Hypertheory workspace
  looks, so a new one sits beside them as a sibling: the built-in `_gray` glyphs
  and the uploaded custom ones all measure transparent, rgb 212,212,212, ink 82%
  of the square, and Dom took 2% off that (2026-09-08, settled after three
  passes: a green square, then a black square, then this). The `--notion`
  defaults ARE the answer, so pass no size or fraction. Saved as
  `~/Downloads/<app>-notion-icon-<date>-<time>.png`.

- Header: the halftone design system (`scripts/linkedin-cover.mjs`, runnable
  alone as `node .../linkedin-cover.mjs <app> [light|dark] [seed] [variant]`;
  1512x256, no text,
  every tone a tint of the app's primary). With no `--variant` every candidate is
  `mosaic` at a random seed; `--variant random` draws families from the approved
  set (`classic`, `dual`, `halftone`, `plus`, `dither`, `mosaic`, `iso`) instead,
  and a random seed lays each out fresh, with the same guarantees
  everywhere: no two islands ever touch, no slivers, no overlapping shapes, a
  clear moat around the honeycomb. `circuit` and `engineered` are opt-in only. The script prints the variant and seed
  used; quote them in the reply so the header can be reproduced exactly.

Files land in `~/Downloads/<app>-profile-photo-<date>-<time>.png` and three
`~/Downloads/<app>-linkedin-cover-<variant>-<theme>-seed<N>-<date>-<time>.png`
plus a `-left` twin of each (unique names, so a fresh run always appears at the
top of Downloads). Send all seven with SendUserFile and list each header's variant and seed so the user can
name the one they pick. Recruiterbase already has its header chosen
(2026-08-29); do not regenerate it unless asked. Say the paths,
send them with SendUserFile (the chat card is not a download), and if the user
wants a different header, run again (new seed) rather than editing the pattern.

Rules: never add text or a logo to the header; never hand-pick colors (fix the
app's `--primary-rgb` instead); when the session cannot view images, have a
fresh-context subagent check a render before shipping it. Before shipping any
icon, LOOK at the render and measure it with sharp rather than trusting the
script's own log: corner pixel, the opaque colors, and the ink bounding box as a
fraction of the canvas. A destination's convention (Notion's transparent gray) is
read from what is already there, never assumed from the app's tokens; the
`--primary-rgb` in globals.css can be a UI accent the brand does not use, which
is how Hypertheory's black and white minotaur first came out green.
