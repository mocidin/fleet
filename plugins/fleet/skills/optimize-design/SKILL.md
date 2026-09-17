---
name: optimize-design
description: Audit and standardize the visual design system (light + dark mode) for any Hypertheory-fleet Next.js app (Brandflare, Ghostplug, StonedGPT, Recruiterbase, Hypertheory) to the fleet's shared token architecture and "floating-shadow" light-mode paradigm — perfect, efficient, elegant, and identical across apps. Self-evolving — every run re-verifies Tailwind/Next.js/accessibility best practices via web research against official sources and updates this skill's own evolving sections. Covers the CSS custom-property token scheme (backdrop tiers, main text tiers, borders, primary/secondary/negative), Tailwind 4 @theme + @utility conventions, next/font wiring, dark-vs-light elevation rules, hover contrast steps, cursor affordances, and WCAG contrast. Use when the user asks to "optimize the design", "standardize the design", "fix light/dark mode", "make the design consistent", "audit the design system", "apply the design schema to <app>", or "why does <app> look different".
allowed-tools:
  - Agent
  - Glob
  - Grep
  - Read
  - Bash
  - Edit
  - Write
  - TodoWrite
  - WebSearch
  - WebFetch
---

# Optimize Design Skill

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


Bring the current repo (or a named fleet app) up to the fleet's **design gold standard**: one shared token architecture, one light-mode paradigm, one dark-mode paradigm, applied identically everywhere. The in-fleet reference implementation is **Brandflare** (`~/code/hypertheory/brandflare`, `app/globals.css`) — when in doubt, mirror it.

The goal is that a component copied from any fleet app drops into any other and looks native, because every app shares the same `--backdrop` / `--main` / `--border` / `--primary` vocabulary and the same semantic `@utility` classes (`card`, `dropdown`, `shadow-around`, …).

## Autonomous operation (no approval gates)

This skill runs **end-to-end without stopping** to present a plan or ask for approval. The inventory feeds directly into applying fixes — there is no audit-and-approve phase.

- **Every change is gated on EVIDENCE, not on user confirmation.** The gate is a concrete verification: `npx tsc --noEmit` passes, the per-scheme no-regression diff proves the untargeted scheme is unchanged, the Phase-1 paradigm greps come back clean, the cursor rule is present in the built CSS, and contrast recomputes above threshold. Because the skill only ever **standardizes and enforces the existing system** — it never redesigns — running autonomously is safe.
- **Uncertain ⇒ skip-and-note, never ask.** When a change cannot be verified non-breaking, skip only that single change, note it in the report, and keep going. Never pause to request approval for it.
- **Quadruple-check nothing broke — locally and per-scheme.** After each group AND again at the very end: run `npx tsc --noEmit`; diff the compiled/tracked `globals.css` scheme blocks — when the task is SCOPED to one scheme, prove the UNtargeted light/dark scheme is byte-for-byte unchanged; for a FULL standardization run (both schemes change on purpose) instead prove each scheme changed ONLY in the intended, enumerated ways, with no incidental drift; re-run the Phase-1 paradigm greps (every violation resolved, none reintroduced); confirm the global cursor rule is in the built CSS; recompute the contrast tiers. Auto-revert (`git restore`) any group that regresses on any of these checks. Never run a dev server (per global rules) — validate with `npx tsc --noEmit`.
- **Finish the job.** Apply every verified-safe fix, then commit per the global rules (work on `main`; one commit per repo; push per the repo's rules). Never leave the working tree dirty awaiting review.
- **Commit safety.** Commit only the paths this run changed — never `git add -A`/`git add .`; pre-existing uncommitted work stays untouched. Never `git restore` a file that was already dirty before the run (you'd clobber the user's work) — auto-revert applies only to paths this run changed that were clean at start. If the repo isn't a git repo or isn't on `main`, note it and skip the commit rather than failing the run.

## Operating doctrine — reason from first principles

Before changing anything, ask: "if this app's design system were built correctly from scratch today against the fleet standard, what would it look like?" Then close the gap — don't just patch the nearest inconsistency.

- **Root cause over local patch.** If dozens of components repeat the same class-pile or hardcoded color, fix the shared source — a token, an `@utility`, a base rule — so every call-site is corrected at once. One good utility beats fifty edited elements.
- **Large refactors are in scope, not feared.** Migrating a whole app from an old token scheme to the fleet vocabulary, extracting repeated class-piles into semantic `@utility` classes, converting `tailwind.config.js` `theme.extend` to v4 `@theme`, unifying light/dark handling — all welcome WHEN the end-state matches the standard and is verifiable. Scope is bounded by *verifiability*, never by size.
- **The one hard limit is "don't break anything."** A change is allowed when the quadruple-check proves it: `tsc` green, the intended scheme changed only in intended ways, the untargeted scheme unaffected when the task is scoped, paradigm greps clean, contrast holds. Where a visual change can't be verified equivalent, do the smaller safe step and note the larger one.
- **Leave it simpler.** Fewer bespoke classes, one shared vocabulary, tokens not literals, semantic utilities not ad-hoc piles. Every file you touch should read more like the fleet standard than before.

## Self-evolution protocol (read first, follow exactly)

This file maintains itself. Two region types:

- **STABLE** — everything outside `EVOLVING` markers: the frontmatter, this protocol, the phase procedure, the fleet map, the non-negotiables, and "What this skill does NOT do". **Never modified by a skill run.** Only the user (or an explicit user request) changes STABLE content.
- **EVOLVING** — the blocks between `<!-- EVOLVING:START ... -->` and `<!-- EVOLVING:END -->` markers: the design-system snapshot and the changelog. These are the ONLY parts a run may rewrite.

**Phase 0 of every run — refresh the snapshot:**

1. Read the target repo's `package.json` and note the exact major versions of `tailwindcss`, `next`, and `react`. Then run the standardized queries (all of them, verbatim, substituting the versions found):
   - `Tailwind CSS <major> theme variables @theme @utility custom properties`
   - `Tailwind CSS <major> dark mode variant configuration`
   - `Next.js <major> next/font local google font CSS variable`
   - `WCAG 2.2 contrast minimum text non-text APCA`
   - `CSS color-scheme prefers-color-scheme design tokens best practices`
2. Source hierarchy — a practice may only be added/changed in the snapshot when confirmed by a **Tier 1** source: `tailwindcss.com/docs`, `nextjs.org/docs`, `react.dev`, `developer.mozilla.org`, `www.w3.org/WAI` (WCAG). Tier 2 (web.dev, vercel.com/docs) may corroborate but never solely justify a change. Design blogs / dribbble / component libraries are inspiration only — never a best-practice source.
3. Diff findings against the snapshot below. If nothing changed, update only the `Last verified:` date. If something changed, rewrite the affected snapshot lines and append ONE changelog entry: `- YYYY-MM-DD: <what changed> (<Tier 1 source URL>)`.
4. **Self-edit safety rules:**
   - Edit only between the EVOLVING markers. Never touch frontmatter or STABLE sections, never rename/move this file, never edit the markers themselves.
   - After any self-edit, re-read the file and verify: frontmatter delimiters intact, both `EVOLVING:START`/`EVOLVING:END` marker pairs present, all `## ` phase headings present. If broken, immediately restore the damaged section from the version still in context — do not proceed to the audit with a broken skill file.
   - Changelog is append-only; never delete or rewrite past entries. If it exceeds ~30 entries, compact the oldest 15 into a single dated summary line.
   - If web research is unavailable (offline, tool denied), skip Phase 0, note "snapshot not refreshed this run" in the report, and proceed with the existing snapshot — never block the audit on it.
5. Deprecations flow one way: a practice removed from the snapshot gets a changelog line saying why. The audit then treats occurrences of the deprecated pattern in repos as gaps to fix (e.g., a Tailwind v3 `tailwind.config.js` `theme.extend` block once v4 `@theme` is the confirmed standard).

<!-- EVOLVING:START design-system snapshot -->
## Current design-system snapshot

Last verified: 2026-08-08 (Tailwind v4 + next/font per tailwindcss.com/docs & nextjs.org/docs; contrast per w3.org/WAI/WCAG22). Reference impl: Brandflare `app/globals.css`.

### Token architecture (CSS custom properties, defined per color-scheme)

All colors are CSS variables, declared twice — once under `:root` (light) and once under `.dark` (dark). Components NEVER hardcode a hex/rgb; they reference the token. Naming is the fleet vocabulary — short, tiered, single-word:

- **`--backdrop`** — the page background. Light: pure white (`255,255,255`). Dark: near-black (`~23,23,23`). Also expose `--backdrop-rgb` (raw channels) for `rgba()` composition and `--backdrop-transparent` (≈0.4 alpha) for sticky/blurred headers.
- **`--backdrop-1` / `--backdrop-2` / `--backdrop-3`** — three progressive **elevation/interaction** tiers above the page. Used for hover, dropdown fills, nested-dropdown fills. Each also has a `-rgb` companion where alpha composition is needed. Light: gentle steps *toward* the page color's opposite (near-white → very light gray). Dark: gray steps upward (`~42 → 60 → 78`).
- **`--main` / `--main-1 / -2 / -3`** — four **text tiers**, darkest→faintest (primary text, subtext, sub-subtext, faint/placeholder). `--main-3-1` / `--main-3-2` allow per-mode divergence when a single faint value can't satisfy contrast in both schemes.
- **`--border` / `--border-1` / `--border-2`** — neutral borders, optionally per-tier to match `backdrop-1/2` contrast in dark. Light mode often collapses all three to one value.
- **`--primary`** (+ `--primary-rgb`, `--primary-transparent` ≈0.1, `--primary-dark` for button hover), **`--secondary`** (+ `--secondary-dark`), **`--negative`** (+ `--negative-dark`). Accent/brand + destructive.
- Map every raw var into Tailwind via `@theme { --color-backdrop: var(--backdrop); … }` so `bg-backdrop`, `text-main-2`, `border-border` all work as utilities.

### Dark mode — progressive elevation (the baseline)

Surfaces are distinguished by **fill**: page = `backdrop`, raised card/dropdown = `backdrop-1`, nested = `backdrop-2`, deepest hover = `backdrop-3`. Cards carry a **border** (`border-border`) for definition. Hover moves **one tier deeper** (`backdrop-1` → `backdrop-2`). This scheme is considered correct and is the anchor — light mode is derived from it, never the reverse.

### Light mode — the "floating-shadow" paradigm

Because a white-on-white stack can't rely on fill for separation, light mode separates by **shadow**, not fill or border:

- **Surfaces are white.** *Every* floating surface — cards (INCLUDING every variant: non-clickable, skeleton, optimistic/pending rows), dropdown/menu popovers, modals — uses `bg-backdrop` (= page white) in light. Gray fills are **`dark:`-only** (`bg-backdrop dark:bg-backdrop-1`).
- **The `dark:` trap (why runs miss surfaces):** a surface written `bg-backdrop-1 dark:bg-backdrop-2` is STILL a light-mode violation — its light base is gray (`backdrop-1`), only the dark base is scoped. A grep for "`bg-backdrop-N` *without* `dark:`" will NOT catch it. The rule is about the **light base**: any floating surface whose light-mode base is `bg-backdrop-1/2/3` is wrong and must become `bg-backdrop dark:bg-backdrop-{whatever-it-was}`. Only the light value changes; the dark value is preserved.
- **Floating surface vs. inset control (don't over-convert):** the white rule applies to surfaces that *float* (have `shadow-around`/`card-light`, or are `absolute`/`fixed … rounded` popovers, or cards). It does NOT apply to legitimate inset gray controls — segmented toggles (`p-0.5 bg-backdrop-1 rounded-md`), avatar/icon circles, count chips — which are meant to read as a recessed tint. Convert floating surfaces; leave inset controls.
- **Separation is a drop shadow, never a border.** Cards use a soft downward shadow (`card-light` utility: `0 2px 6px /.10, 0 1px 2px /.06`); dropdowns/modals use an all-around shadow (`shadow-around`: `0 0 14px /.11`). No borders and no `0 0 0 1px` box-shadow rings on any floating surface in light. Dark restores the border and drops the shadow.
- **No gray dropdowns, ever, in light** — including trigger open-states and selected rows. Stacked/nested surfaces stay white; the shadow does the separating. Any resting gray is `dark:`-only.
- **Hover contrast = exactly one step from the surface's tier.** Since a light surface is white (tier 0), an item hover lands on `backdrop-1` (`hover:bg-backdrop-1 dark:hover:bg-backdrop-2`). Never jump 2–3 tiers on hover in light. The `backdrop-1/2/3` values are tuned close to white (each ~60% of the way from its old value toward white) so every light hover reads as a soft tint, not a slab.

### Tailwind 4 conventions

- Use `@import "tailwindcss";` then `@theme { … }` for tokens and `@utility name { … }` for semantic classes. No `tailwind.config.js` `theme.extend`. Dark variants via `:is(.dark &)` inside `@utility`, or `dark:` utilities in markup.
- **Class-based dark mode requires `@custom-variant`**: v4's `dark:` variant defaults to the `prefers-color-scheme` media feature, so an app using the fleet's explicit `.dark` toggle MUST declare `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (after `@import "tailwindcss";`) or `dark:` utilities silently follow the OS instead of the toggle. Treat its absence in a `.dark`-toggled app as a Phase-1 gap.
- Semantic `@utility` layer is shared fleet vocabulary: `card`, `card-interactive`, `card-light`, `card-shadow`, `dropdown`, `shadow-around`, `glass` / `glass-background`, `button`, `flex-center` / `flex-row` / `flex-between`, `icon-xs/sm/md/lg`, `bar-height` / `bar-height-sm`, `container-width`, `page-content`, `layout-gap` / `space-y-layout`. Prefer these over ad-hoc class piles so every app reads the same.
- **next/font**: apply the font's `.variable` class on `<html>` (not `<body>`) so the CSS var cascades to portaled UI (modals, dropdowns). Rename each next/font CSS var (e.g. `--next-outfit`) so it can't collide with the `@theme` token of the same suffix; map it in `@theme` as `--font-sans` / `--font-display`.
- **Canonical spacing over arbitrary px.** v4's spacing scale is dynamic (`n → n × 0.25rem`), so any spacing/sizing utility whose px value lands on the scale must use the named class, never `[…px]`: `h-[36px]`→`h-9`, `min-h-[60px]`→`min-h-15`, `w-[260px]`→`w-65`, `max-h-[1000px]`→`max-h-250`, and small halves `h-[10px]`→`h-2.5`, `mt-[2px]`→`mt-0.5`, and quarter-steps `h-[18px]`→`h-4.5`, `w-[15px]`→`w-3.75`, `w-[70px]`→`w-17.5` — the dynamic scale accepts ANY numeric multiple of 0.25rem, so EVERY integer-px spacing value converts via px÷4. Applies to `w/h/min-*/max-*/size/p*/m*/gap*/inset/top/right/bottom/left/space-*`. This is the Tailwind IntelliSense "arbitrary value can be replaced" hint — pixel-exact swap, zero visual change. **Leave genuinely off-scale values arbitrary**: font sizes are NOT on the spacing scale, so `text-[11px]`/`text-[13px]` have no canonical class and stay. Also leave `border-*`, `rounded-*`, `z-*` (separate scales). Never suppress the hint via editor config; convert or leave-arbitrary, don't hide.

### Scrollbars (fleet standard)

- **Scrollbars are hidden globally** — the reference `globals.css` carries `* { -ms-overflow-style: none; scrollbar-width: none }` + `*::-webkit-scrollbar { display: none }` ("keeps scroll functionality, prevents layout shift"). An app WITHOUT this block shows a visible scrollbar and gets layout shift whenever it appears/disappears (modal open, page-length change). The legacy `body { overflow-y: scroll }` gutter-reserve approach is superseded — remove it when adding the hiding block. Phase 1 must grep the target's globals for `scrollbar-width: none` and treat its absence as a gap.

### Interaction & affordance

- **Cursor**: a global rule makes every real control show a pointer — `button:not(:disabled), [role='button']:not([aria-disabled='true']), label[for], summary { cursor: pointer }` (Tailwind v4's Preflight does NOT add this; the rule is required). Clickable non-`<button>` elements (`<div onClick>`) still need an explicit `cursor-pointer`. If pointer "disappears everywhere," it's a webview/browser cache, not a regression — verify the rule is in the served CSS, then hard-refresh.
- Transitions: `transition-colors` on hover/active fills; keep durations short and consistent.

### Accessibility (WCAG 2.2)

- Body text ≥ 4.5:1 against its actual background; large text (≥24px, or ≥18.66px bold) and meaningful non-text/UI boundaries ≥ 3:1. The faint tier (`--main-3`) must still clear its threshold on `--backdrop` in BOTH schemes — this is why `--main-3-1/-2` exist.
- Set `color-scheme: light dark` (or per-mode) so native form controls/scrollbars match. Respect `prefers-color-scheme` for first paint, but the app's explicit `.dark` toggle wins.

### Semantic accent colors (status pills, badges, tags, colored buttons)

Status/semantic colors (success, info, warning, error, special) use **transparent tints**, never solid palette fills — a solid `bg-{color}-100` reads harsh on the white light-mode cards and diverges from the colored buttons. One convention fleet-wide:

- **Pills / badges / tags** (non-interactive): `text-{color}-600 bg-{color}-500/15 dark:bg-{color}-900/20`.
- **Colored action buttons** (interactive): add the hover step + dark text — `text-{color}-600 dark:text-{color}-400 bg-{color}-500/15 hover:bg-{color}-500/25 dark:bg-{color}-900/20`.
- **Never** `bg-{color}-100 dark:bg-{color}-900/30` opaque fills (legacy) — treat every occurrence as a gap and convert to the tint above.
- **Semantic mapping**, consistent across apps: green = published/success, blue = scheduled/info, amber = needs-review/warning, red = rejected/error/destructive, purple = draft/special. Neutral fallback = `text-main-2 bg-backdrop-2`.

These are palette-based (Tailwind `{color}-500/600/900`), NOT the per-app `--primary` brand token — so unlike brand accent values they ARE standardized fleet-wide. Reference: Brandflare `StatusBadge` + `PostDetailView` action buttons + `PostPublishedCard`.

- **NEVER re-shade palette utilities in `globals.css`.** Semantic colors render at Tailwind's stock values — a class like `bg-amber-500/15` must compile to the same color in every app. Do NOT add raw utility overrides to globals such as `html:not(.dark) .text-amber-600 { color: … }`, `.bg-green-500\/15 { background-color: … }`, `.bg-red-500 { … }`, `.border-amber-500\/30 { … }`, or `@media`-scoped equivalents. These silently darken/opacify semantic colors app-wide, diverge one app from another, and are **invisible to a token diff and a component-className diff** (the exact bug that made Hypertheory's pills/buttons a different shade than Brandflare's). If light-mode text contrast is genuinely too weak, fix it by choosing a different Tailwind step *in the component* (`text-amber-700` everywhere) or via a token — never by globally overriding `text-amber-600`.
<!-- EVOLVING:END -->

<!-- EVOLVING:START changelog -->
## Changelog

- 2026-08-08: Added the class-based dark-mode requirement: v4's `dark:` defaults to prefers-color-scheme, so a `.dark`-toggled app must declare `@custom-variant dark (&:where(.dark, .dark *));` in globals or the toggle is silently ignored (https://tailwindcss.com/docs/dark-mode)
- 2026-07-19: Added the global scrollbar-hiding block as an explicit snapshot item + Phase-1 grep — a Recruiterbase run ported tokens/utilities but missed Brandflare's `* { scrollbar-width: none }` block, leaving a visible scrollbar with layout shift. Also documented that it supersedes the legacy `body { overflow-y: scroll }` gutter approach. (Fleet reference impl: Brandflare globals.css.)
- 2026-07-19: Corrected canonical-spacing rule — v4's dynamic spacing scale accepts ANY quarter-step multiple (`h-4.5` = 18px, `w-3.75` = 15px, `w-17.5` = 70px), not just 2/6/10/14 halves; every integer-px spacing value converts via px÷4. Surfaced by Tailwind IntelliSense flagging `h-[18px]`→`h-4.5` in Recruiterbase after a run left 18/15px "off-scale" (tailwindcss.com/docs/theme dynamic spacing).
- 2026-07-10: Added **CSS-hygiene** Phase-1 checks (Tailwind review pass) — duplicate `@keyframes` (last-wins conflicts), unused `--animate-*`/keyframes (referenced only in globals), `@utility` redefining native v4 utilities (`text-balance`/`text-pretty`/`truncate`/`line-clamp`/`sr-only`/`container`/`antialiased`), redundant `@theme` resets that restate v4 defaults (breakpoints), duplicate `@utility` blocks with identical compiled selectors, plus a font baseline check (`antialiased` present; flag oversized/ephemeral `next/font` sets). Prompted by a Hypertheory review that found duplicate `@keyframes shimmer`, unused `--animate-shimmer`, a redundant `@utility text-balance`, a duplicate `@utility dark`, and a no-op breakpoint reset. (Tailwind v4 native-utility list current as of this date.)
- 2026-07-10: Added **canonical-spacing** convention + Phase-1 grep — v4's dynamic spacing scale means arbitrary `[…px]` on spacing/sizing utilities that land on the scale (`h-[36px]`→`h-9`, `min-h-[60px]`→`min-h-15`) must use the named class; pixel-exact, zero visual change. Off-scale font sizes (`text-[11px]`) and separate scales (`border/rounded/z`) stay arbitrary. Resolves the Tailwind IntelliSense "arbitrary value can be replaced" hints fleet-wide by converting, never suppressing. First applied in Hypertheory (28 swaps, 22 files).
- 2026-07-04: Initial snapshot authored from the Brandflare light-mode standardization session — token architecture (backdrop/main/border tiers), dark = progressive elevation, light = floating-shadow paradigm (white surfaces, drop-shadow separation, single-step hover, no borders/rings on floating surfaces), Tailwind 4 `@theme`/`@utility` + next/font wiring, global cursor rule, WCAG tiers. Reference impl: Brandflare `app/globals.css`. (Tailwind v4 + Next.js current docs.)
- 2026-07-05: Added detection of **raw palette-utility overrides in `globals.css`** — hand-written rules like `html:not(.dark) .text-amber-600{}` / `.bg-green-500\/15{}` / `.bg-red-500{}` silently re-shade semantic colors app-wide and are INVISIBLE to token + component-className diffs. Phase 1 now greps globals for these and diffs the two globals in full; the snapshot forbids them (fix contrast in-component or via a token, never by overriding a palette utility). Root cause of Hypertheory's pills/buttons rendering a different (darker/more-opaque) shade than Brandflare's despite byte-identical component classes, Tailwind version, and compiled `bg-amber-500/15` rule.
- 2026-07-04: Added the "`dark:` trap" detection — a floating surface written `bg-backdrop-1 dark:bg-backdrop-2` is a light-mode violation (gray light base) that a "no-`dark:`" grep misses; the rule is about the LIGHT base. Added: check every card variant (non-clickable/skeleton/optimistic) independently, the floating-vs-inset-control distinction (don't convert toggles/avatars/chips), and a cross-app className-diff parity check. Prompted by a run that standardized tokens + list cards but left dropdown panels gray, making translucent `bg-*/15` buttons render differently over the gray card. (Design consistency; Brandflare↔Hypertheory parity.)
- 2026-07-04: Added the semantic-accent-color convention — status pills/badges/tags/colored buttons use transparent tints (`bg-{c}-500/15`, hover `/25`, `dark:bg-{c}-900/20`), never opaque `bg-{c}-100`/`900/30` fills (which read harsh on white light-mode cards and diverge from the colored buttons). These palette-based semantic colors ARE standardized fleet-wide, distinct from per-app `--primary` brand values. Prompted by opaque StatusBadge pills diverging from the transparent action buttons. (Design consistency; verified against fleet usage.)
<!-- EVOLVING:END -->

## Fleet map

| App | Repo | Notes |
|---|---|---|
| Brandflare | `~/code/hypertheory/brandflare` | **Gold standard** — full token scheme + light/dark paradigm implemented in `app/globals.css`. Mirror it. |
| Ghostplug | `~/code/hypertheory/ghostplug` | Production Reddit app; shares Brandflare's lineage (fork ancestor). Reconcile token drift. |
| StonedGPT | `~/code/hypertheory/stonedgpt` | Verify token names + light-mode paradigm match. |
| Recruiterbase | `~/code/hypertheory/recruiterbase` | Design gold standard for SEO, not necessarily for tokens — verify against Brandflare. |
| Hypertheory | `~/code/hypertheory/hypertheory` | Internal admin hub; still uses the shared vocabulary. |

Running against "all apps": iterate the table one repo at a time, same phases; Phase 0 runs once for the whole sweep, not per repo. Never assume two apps already match — diff their `globals.css` token blocks explicitly.

## Non-negotiable rules

Violating any is a bug in the skill.

1. **Never change dark mode when the task is a light-mode fix (or vice-versa).** The user's dark mode is deliberately tuned; scope every edit with `dark:` / `:is(.dark &)` so the untargeted scheme is byte-for-byte unchanged. When unsure, diff the compiled output per scheme. (Scheme-scoped tasks only — a FULL standardization run changes both schemes on purpose; see the Autonomous quadruple-check and Phase 4 for the scoped-vs-full distinction.)
2. **Standardize the token ARCHITECTURE, never an app's BRAND IDENTITY.** Standardize the token *architecture, names, tiers, and the NEUTRAL system* (`--backdrop*`, `--main*`, `--border*`) and the light/dark paradigm — but NEVER an app's brand identity. `--primary` / `--secondary` (and their `-rgb` / `-dark` / `-transparent` companions) are per-app accent VALUES: preserve them exactly as-is; standardize only their variable STRUCTURE/naming. Never overwrite one app's brand hue with another's (e.g. don't push Brandflare's electric blue onto StonedGPT). If unsure whether a value is brand identity or a neutral, treat it as identity and preserve it (skip-and-note).
3. **Never hardcode a color.** Every color goes through a token. If a component needs a shade that doesn't exist, add/adjust the token, don't inline a hex.
4. **Never reintroduce a border or ring on a light-mode floating surface** (card, dropdown, menu, modal). Separation is shadow-only in light.
5. **Preserve the token vocabulary.** Don't rename `--backdrop-2` to something bespoke in one app; standardization means the *names* match across the fleet, not just the vibe.
6. **`npx tsc --noEmit` must pass** in every touched repo before committing. Never remove existing `console.*`. Commit to `main` autonomously, one commit per repo (per global rules).
7. **Centralize, don't scatter.** A design rule that applies everywhere belongs in `globals.css` (`@utility` / `@theme` / a base rule), not copy-pasted onto N components. Prefer editing one utility over editing fifty call-sites.

## Phase 1 — Inventory (read-only)

For the target repo, build the current picture. Parallelize with subagents where the repo is large.

1. Read `app/globals.css` (or wherever tokens live) IN FULL — not just the token block. Extract the `:root`/`.dark` token tables, the `@theme` map, every `@utility`, AND scan for **raw Tailwind-utility overrides written as CSS rules**: any selector matching `\.(text|bg|border|ring|from|to|via)-(green|red|blue|amber|yellow|purple|orange|gray|…)-` or `\.hover\\:…`, especially when scoped `html:not(.dark) …`, `.dark …`, or inside `@media`. `grep -nE '(html:not\(\.dark\)|\.dark)?\s*\.(text|bg|border)-(green|red|blue|amber|yellow|purple|orange|gray)-' app/globals.css`. When a reference app exists, **diff the two globals in full** — any override the reference lacks is a gap: it re-shades semantic colors app-wide, evades token/className diffs, and must be removed (the Hypertheory pill/button shade bug). If the app genuinely needs stronger contrast, the reference should adopt the same treatment or it's dropped — never leave one app silently re-shaded.
2. Diff the token set against the snapshot: missing tiers (`--main-3-2`?), missing `-rgb`/`-dark` companions, wrong/renamed names, tokens defined in only one scheme. Compare token STRUCTURE, names, tiers, and the NEUTRAL system (`--backdrop*`/`--main*`/`--border*`) — NOT the `--primary`/`--secondary` accent VALUES, which are this app's brand identity and are preserved, never reconciled to Brandflare's hue (rule #2).
3. `Grep` for **hardcoded colors** in components: `#[0-9a-fA-F]{3,8}`, `rgb(`/`rgba(` literals, and Tailwind palette utilities that should be tokens (`bg-white`, `bg-gray-*`, `text-black`, `bg-neutral-*`, `border-gray-*`). Each is a gap.
4. `Grep` for **light-mode paradigm violations**. Cover BOTH forms of gray-light-base:
   - Unscoped: `bg-backdrop-1/2/3` with no `dark:` at all.
   - **`dark:`-trapped (commonly missed): a floating surface whose LIGHT base is gray even though it has a `dark:` on another token** — e.g. `bg-backdrop-1 dark:bg-backdrop-2`. Grep floating surfaces specifically: `grep -rnE '(shadow-around|card-light|animate-dropdownFade|absolute|fixed)' --include=*.tsx | grep -E 'bg-backdrop-[123]'` and, for cards, `grep -rn 'rounded-lg px-4 py-3' | grep 'bg-backdrop-[123]'`. Each hit whose light base is `bg-backdrop-1/2/3` → rewrite to `bg-backdrop dark:bg-backdrop-{original}` (change only the light value). **Check EVERY card variant** in a list (non-clickable, skeleton, optimistic/pending rows), not just the main one — they drift independently. Skip inset controls (segmented toggles, avatar/count chips) per the snapshot's floating-vs-inset rule.
   - Also: floating surfaces with a `border`/ring but no `dark:`-scoping; stark hovers (`hover:bg-backdrop-2/3` on a white surface with no `hover:bg-backdrop-1` light counterpart); box-shadow `0 0 0 1px` rings on dropdowns.
   - **Cross-app parity check** (when a reference app exists): for each shared/forked component, diff the two files' className sets (`diff <(grep -oE 'className=…' ref | …) <(… target)`) and treat any surviving `bg-backdrop-[123]` / semantic-color drift as a gap. Translucent elements (`bg-*/15` pills & buttons) look identical in code but render differently over a gray vs. white card — so a drifted card behind them is the real cause of "the buttons look different."
5. Verify **next/font** wiring (`.variable` on `<html>`, renamed vars, `@theme` `--font-*`) and the **global cursor rule** presence.
6. Spot-check **contrast** for each text tier on its background (both schemes) against the WCAG thresholds in the snapshot.
7. `Grep` for **arbitrary px that has a canonical class** (the IntelliSense hint): `grep -rhoE '[a-z-]+-\[[0-9]+px\]' --include='*.tsx' --include='*.ts' | sort | uniq -c | sort -rn`. Flag only spacing/sizing utilities (`w/h/min-*/max-*/size/p*/m*/gap*/inset/top/right/bottom/left/space-*`) whose px divides onto the scale (÷4 → integer, or 2/6/10/14 → .5). Convert those to the named class (pixel-exact). Leave off-scale (`text-[11px]`, `w-[18px]`) and non-spacing scales (`border-*`,`rounded-*`,`z-*`) alone — see the Tailwind-4 conventions bullet.
8. **CSS hygiene in `globals.css`** — dead/redundant/duplicate rules that bloat the compiled sheet and read as un-elegant. Check each:
   - **Duplicate `@keyframes`**: `grep -oE '@keyframes [a-zA-Z0-9_-]+' app/globals.css | sort | uniq -d` — any name defined twice is a conflict (last wins globally); keep one.
   - **Unused `--animate-*` tokens / animations**: for each `--animate-x` and `.animate-x`/`@keyframes x`, grep the codebase (`--include='*.tsx'`) for the class; if it appears only in `globals.css`, it's dead — remove token + keyframes.
   - **`@utility` redefining a native v4 utility**: `text-balance`, `text-pretty`, `truncate`, `line-clamp-*`, `sr-only`, `container`, `antialiased` all ship in v4 — a hand-rolled `@utility` of the same name is redundant; delete it.
   - **Redundant `@theme` resets**: a `--breakpoint-*: initial` (or color reset) followed by redefining the *same values v4 already ships* (sm 640/md 768/lg 1024/xl 1280/2xl 1536) is pure noise — delete the whole block. Only keep resets that actually change a value.
   - **Duplicate `@utility` blocks**: two utilities producing the *same compiled selectors* (e.g. a standalone `@utility dark { & .dropdown }` when `@utility dropdown { :is(.dark &) }` already emits `.dark .dropdown`) — keep one.
9. **Font baseline**: `body`/root should have `antialiased` (font-smoothing) — grep for it; add if absent. Count `next/font` families in `layout.tsx` — more than a handful of *rendered* fonts (a font-picker feature aside) is bloat; each adds an `@font-face` + CSS var to every page. Flag large or comment-marked "ephemeral/candidate" font sets for the user to prune (don't auto-delete — font choice is a product decision).

Produce a gap table: item / current / standard / severity.

## Phase 2 — Sequence the fixes

Group gaps into the autonomous apply order: **token-scheme fixes** (add/rename/align vars — do first, everything else depends on them) → **paradigm fixes** (light-mode surfaces/hover/borders) → **de-hardcoding** (swap literals for tokens) → **utility centralization** (extract repeated class piles into `@utility`) → **a11y contrast** (adjust tier values that fail). No approval gate — this sequence feeds straight into Phase 3. For any change that shifts a SHARED token value (whole-app blast radius), record the before/after in the report, but **apply it — do not wait**.

## Phase 3 — Apply

Smallest diff, centralized, mirroring Brandflare's exact patterns. Order:

1. Token scheme — align `:root` + `.dark` tables and the `@theme` map first. Align architecture, names, tiers, and the neutral system (`--backdrop*`/`--main*`/`--border*`) only; preserve each app's `--primary`/`--secondary` accent values (and their `-rgb`/`-dark`/`-transparent` companions) verbatim — standardize their structure/naming, never their hue (rule #2).
2. `@utility` layer — add/align `card`, `card-light`, `dropdown`, `shadow-around`, etc.
3. Paradigm — convert light surfaces to white + shadow, scope grays behind `dark:`, fix hovers to single-step. Prefer editing the shared utility over touching call-sites.
4. De-hardcode — replace literals/palette utilities with tokens.
5. Cursor rule + next/font wiring if missing.
6. Contrast tier adjustments last (they ripple visually; re-verify after). Compute the actual WCAG ratio; if a standardized NEUTRAL fails contrast against an app's PRESERVED brand accent (e.g. `--main` text on a `--primary`-colored surface), adjust the neutral or add a per-mode tier (`--main-3-1/-2`) — never repaint the brand accent to fix contrast (rule #2).

After each group: `npx tsc --noEmit`. If it regresses, `git restore` that group and report.

## Phase 4 — Quadruple-check

1. `npx tsc --noEmit` clean.
2. **Per-scheme no-regression check** — for a task SCOPED to one scheme, the scheme you did NOT intend to change must be byte-for-byte unchanged: confirm the compiled tokens/utilities are unchanged (diff `git`-tracked `globals.css` scheme blocks; if a dev server is running, compare served CSS). For a FULL standardization run BOTH schemes change on purpose — there the check is not "unchanged" but "each scheme changed ONLY in the intended, enumerated ways": diff both scheme blocks and confirm no incidental drift beyond the fixes you set out to make.
3. **Paradigm sweep** — re-run the Phase 1 greps; every violation resolved, none reintroduced.
4. **Cursor** — confirm the global rule is in the built/served CSS (Tailwind v4 won't add it).
5. **Contrast** — recompute the actual WCAG ratio for each tier vs its background against the snapshot thresholds. If a standardized NEUTRAL fails against an app's PRESERVED brand accent (e.g. text on a `--primary` surface), fix it by adjusting the neutral or adding a per-mode tier — never by repainting the brand accent (rule #2).
6. Never run a dev server; for build validation use `npx tsc --noEmit` (per global rules).

## Phase 5 — Report

A post-hoc summary of what was already applied — NOT an approval gate. Per app: gap table (item / before / after / severity), any changes that were **skipped-and-noted** (couldn't be verified non-breaking) with the reason, whether the design-system snapshot changed this run (and what, with the Tier 1 source), any token values that shifted fleet-wide, remaining a11y notes, and the single highest-leverage next design action. If run across the fleet, end with a cross-app token-drift matrix (which apps still diverge from Brandflare and where).

## What this skill does NOT do

- **No redesign.** It standardizes and enforces the existing system; it does not invent new visual languages, restyle brand identity, or change layout/IA. Propose, don't impose.
- **No dark-mode changes on a light-mode task** (and vice-versa) — see rule #1.
- **No component-behavior refactors** beyond what a token/utility swap requires — that's `/optimize-code`.
- **No image/illustration/logo asset work**, no motion-design systems.
- **No self-edits outside the EVOLVING blocks**, ever — even if a source suggests the procedure itself is outdated. Report that to the user and let them change STABLE sections.
