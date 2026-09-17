---
name: tech-stack-update
description: Update every package in the project to its latest version, propagate breaking changes through the entire app using official upgrade tools, quadruple-check no regressions were introduced, and produce a precise list of anything the user still needs to do by hand. Works across Next.js + Supabase + Stripe + Tailwind + TypeScript codebases (Hypertheory, BrandFlare, StonedGPT, etc.). Use when the user asks to "update the stack", "bump dependencies", "upgrade everything", or "modernize the app".
allowed-tools:
  - Agent
  - Glob
  - Grep
  - Read
  - Edit
  - Write
  - Bash
  - WebFetch
  - WebSearch
  - TodoWrite
---

# Tech Stack Update Skill

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


Do four things, in order:

1. **Update every package** in `package.json` to its absolute latest version, including majors. Default to maximal.
2. **Flow every breaking change through the codebase** — run official upgrade tools / codemods, edit call sites, fix what `tsc`/`build` surfaces — until the project typechecks, lints, and builds clean on the new versions.
3. **Quadruple-check every change** with a systematic audit: verify renames are pure, verify migration tools handled everything, verify no deprecated patterns remain, verify custom code was preserved, verify SDK call sites still work.
4. **Tell the user exactly what you did** and hand them a precise checklist of things only they can do (UI QA for Tailwind, webhook replay for Stripe, env var edits).

The user runs this across several codebases (Hypertheory, BrandFlare, StonedGPT) that share the same stack. Do not hardcode assumptions about any one repo — detect the shape of the project from its files.

## Default attitude: aggressive

Go for the absolute latest on every package, including majors with config rewrites. The user has explicitly asked for this pattern and prefers to accept some risk for a clean, fully-up-to-date stack rather than a partially-updated one. Push back only when something is **genuinely unfixable by code alone** (see "When to defer" below).

Patch bumps and minor bumps are never worth discussing — batch install them. Majors warrant brief mention (one-liner) but still get attempted by default. Only deferred items warrant an explanation paragraph.

## Hard rules

- **Never run the dev server.** The user keeps one on port 3000. Verify only with `npx tsc --noEmit`, `eslint .`, and `npx next build`.
- **Never commit or push.** Stage changes with `git add -A` and let the user commit.
- **Never use `--force` or `--legacy-peer-deps`.** If a peer-dep conflict appears, resolve it explicitly or defer only that one package.
- **Never bump `@types/*` past the runtime package's major.** `@types/react` must match `react`. `@types/node` matches the major pinned in `engines.node` (set in Step 4.5), never higher.
- **The Node runtime is updated like any other package (Step 4.5).** It moves as one unit: `engines.node` in code plus the Vercel project setting, never one without the other.
- **One major bump at a time** for framework-critical packages (Next.js, React, Tailwind, TypeScript, Supabase, Stripe, React Query). Install, verify, move on. Don't stop between to ask permission — just verify `tsc` + `build` pass and continue.

## When to defer (the short list)

Defer a major only when one of these applies:

1. **Upstream peer-dep genuinely blocks the upgrade.** Example: ESLint 10 requires `eslint-plugin-react@8+`, but latest is `eslint-plugin-react@7.37.5` with peer `eslint: ... || ^9.7`. Using overrides would force a runtime API mismatch. This is the user's infra; they can't fix it locally.
2. **The migration requires architectural decisions, not just code patches.** Example: a major that requires rewriting auth flow to use a different model. Not "lots of call-site edits" — those are fine. "Decide between two architectural options" is not fine.
3. **The package is experimental / pre-1.0 with no changelog and no upgrade guide.** Stop, flag, move on.

That's it. Everything else proceeds. "Surfaces lots of type errors" is fixable. "Visual regressions possible" is QA-able by the user. "Config rewrite" is done via official upgrade tools.

## Step 1 — Detect the project shape

Run these in parallel before doing anything else:

- `Read` `package.json` (deps, devDeps, engines, scripts).
- `Glob` for `{package-lock.json,pnpm-lock.yaml,yarn.lock,bun.lockb}` → package manager.
- `Glob` for `next.config.{js,mjs,ts}`, `tsconfig.json`, `tailwind.config.{js,ts,mjs}`, `postcss.config.{js,mjs}`, `eslint.config.*` / `.eslintrc*` → tooling surface.
- `Glob` for `app/layout.{tsx,ts}` vs `pages/_app.{tsx,ts}` → App Router vs Pages Router.
- `Grep` the codebase for `@supabase/ssr`, `@supabase/supabase-js`, `stripe`, `@tanstack/react-query`, `@radix-ui`, `next/image`, `next/font` → integration inventory.
- `Read` `package.json#engines.node` if present and `.vercel/project.json` (project id + team id for Step 4.5); also `node --version` for the local runtime.

Report one line: *"Next.js 15.1 App Router on pnpm, Node 20, Supabase SSR, Stripe 17, Tailwind 3.4, Radix UI, React Query 5."* This frames the rest of the run.

## Step 2 — Inventory what's out of date

`npm outdated --json` works regardless of which package manager the lockfile uses (reads `package.json` directly). Parse into a triage table:

| Package | Current | Latest | Bump |
|---|---|---|---|
| next | 15.0.3 | 15.1.6 | minor |
| react | 18.3.1 | 19.0.0 | **major** |
| @supabase/ssr | 0.5.2 | 0.6.1 | minor (pre-1.0 → treat as major) |
| stripe | 17.3.0 | 18.0.0 | **major** |

Also run `npm ls --all 2>&1 | grep -iE "peer dep|deprecat|UNMET"` and flag every peer-dep warning and deprecated package (UNMET OPTIONAL warnings are platform-binary false positives, ignore).

For each major, `Grep` the codebase for API surface the bump will touch and count call sites. This informs the risk assessment, not the decision to attempt. If a codemod or upgrade tool exists, that's the plan regardless of call-site count.

For every major, identify the upgrade path:
- **Next.js**: `npx @next/codemod@latest <name> .`
- **React**: `npx types-react-codemod@latest preset-19 ./`
- **React Query**: `npx @tanstack/react-query-codemods@latest <name> ./`
- **Tailwind 3 → 4**: `npx @tailwindcss/upgrade@latest --force` (handles config rewrite, class renames, PostCSS config, globals.css)
- **Supabase auth-helpers → `@supabase/ssr`**: manual (swap imports, adopt `cookies.getAll`/`setAll`)
- **Stripe**: type-driven (let `tsc` guide the edits; most majors are additive or renames)
- **TypeScript**: usually clean if tsconfig already has `strict: true` + explicit `target`/`module`. Otherwise fix what `tsc` surfaces.
- **ESLint 9 → 10**: currently upstream-blocked by `eslint-plugin-react`; defer.

**Stripe apiVersion note:** SDK majors silently shift the pinned `apiVersion` (e.g. v20→v22 shifts clover→dahlia). This is **fine** when the code only reads stable core fields (`status`, `current_period_end`, `cancel_at_period_end`, `pause_collection`, `session.client_reference_id`, `product.metadata.*`). Read the webhook/route.ts before bumping Stripe majors — if you see reads of experimental or beta fields, add an explicit `apiVersion` pin to the `new Stripe(key, { apiVersion: '<current>' })` constructor. Otherwise let it drift with the SDK and note the shift in the report.

## Step 3 — Present the plan (briefly) and proceed

Show the user:

1. The current → latest table, grouped by `patch / minor / pre-1.0 minor / major`.
2. For each major: one-line description of what changes + whether an official upgrade tool exists.
3. Anything being **deferred** and why (upstream-blocked, architectural decision, etc.) — keep this short.

Ask once: "proceeding with all of the above unless you object." Give the user ~one message to narrow scope. Then execute. **Do not stop for approval between individual majors.** The approval is "go" for the whole plan; verification between batches is automatic, not a prompt.

## Step 4 — Apply updates

Use the detected package manager for installs (`npm install` / `pnpm add` / `yarn add` / `bun add`; `-D` for dev deps).

1. **All patch + minor bumps** (1.x+, no peer-dep conflicts) — one batched install. Verify.
2. **Pre-1.0 minors** — one at a time. Verify.
3. **Majors**, one at a time, in this preferred sequence:
    1. TypeScript
    2. ESLint / Prettier / test runner (if not upstream-blocked)
    3. React
    4. Next.js
    5. Tailwind (run `@tailwindcss/upgrade`)
    6. Supabase
    7. Stripe
    8. React Query
    9. Everything else
4. **`@types/*` bumps** last, matched to the now-current runtime packages.

After each install:

- Resolve peer-dep warnings by installing the correct peer, not forcing.
- **Run codemods / upgrade tools** where they exist (see Step 2 table).
- **Edit remaining call sites by hand** — `Grep` to find them, `Edit` to fix them. Common patches:
    - Next 15: `const h = headers()` → `const h = await headers()` (and make the enclosing function `async`).
    - React Query v5: `isLoading` → `isPending`, `cacheTime` → `gcTime`, `onSuccess`/`onError` lift into `useEffect`.
    - Supabase auth-helpers → `@supabase/ssr`: swap imports, adopt `cookies.getAll` / `cookies.setAll`.
    - Next 16: `next lint` removed — update `package.json` `"lint"` script to `"eslint ."`, delete `.eslintrc.json`, write `eslint.config.mjs` (flat config) using `eslint-config-next/core-web-vitals`.
    - `@next/next/no-assign-module-variable`: rename any `const module = X` → `const instance = X` (or similar). Comes up in webhook handlers using a `modules` table.
- **Verify** before moving on:
    - `npx tsc --noEmit` — must pass.
    - `npx next build` — must succeed.
    - `eslint .` — errors must be zero (warnings OK and expected; see Lint handling below).
- If verification fails and the fix isn't obvious within ~5 min: revert that one package (`npm install pkg@<prior>`), report the failure with the error output + upgrade-guide URL in the final report, and move on.

### Lint handling

Running `eslint .` after an upgrade often surfaces many new errors/warnings. Categorize before fixing:

1. **Legit errors from the upgrade** (e.g., `@next/next/no-assign-module-variable`, new Next rules): fix them mechanically. For `no-assign-module-variable` specifically, rename `module` → `instance` throughout the affected scope using `replace_all: true` on distinct patterns (`const module = modules?.[0]`, `module.id`, `module.channel`, `module.metadata`, `!module`).
2. **Pre-existing code quality warnings** (`react-hooks/exhaustive-deps`, `no-img-element`, `no-explicit-any`, `no-unused-vars`): leave them. They were always there; fixing them is code cleanup, not tech-stack work. Flag in the report as "pre-existing lint debt, N warnings, out of scope."
3. **Opinionated new React Compiler rules** (`react-hooks/set-state-in-effect`, `react-hooks/refs`, `react-hooks/static-components`, `react-hooks/purity`, `react-hooks/preserve-manual-memoization`, `react-hooks/immutability`): these fire on working code that isn't using React Compiler. If the project doesn't adopt RC, **disable these rules in `eslint.config.mjs`**. Example:
    ```js
    {
      rules: {
        'react-hooks/set-state-in-effect': 'off',
        'react-hooks/refs': 'off',
        'react-hooks/static-components': 'off',
        'react-hooks/purity': 'off',
        'react-hooks/preserve-manual-memoization': 'off',
        'react-hooks/immutability': 'off',
      },
    }
    ```
    Attempting to auto-fix 80+ setState-in-effect violations by refactoring components will introduce bugs. Disable the rule, note the decision in the report.

The goal for lint is **zero errors** (so CI/Vercel doesn't break), not zero warnings. Warnings are non-blocking and the user can address them later.

## Step 4.5 — Runtime (Node.js on Vercel)

The Node.js runtime is part of the stack and is brought to the latest major on every run, the same way packages are. The repo is the source of truth: `package.json#engines.node` pins the major and Vercel honors it over the dashboard setting. The dashboard setting is synced to match anyway, because it is what drives Vercel's deprecation banner and what shows in the project list.

1. **Find the latest major Vercel supports.** Read it live, never from memory:
    ```bash
    curl -sL https://vercel.com/docs/functions/runtimes/node-js/node-js-versions | grep -oE '2[0-9]\.x' | sort -un | tail -1
    ```
    (24.x as of 2026-09.) Never pin a major that page does not list, even if Node itself has released it.
2. **Pin it in code.** `engines.node` = `"<N>.x"` (add the `engines` block if the project has none). `@types/node` = the latest release of that same major (`npm view @types/node@<N> version | tail -1`), never a higher major: types above the runtime let code call APIs the runtime lacks.
3. **Sync the Vercel project setting.** Project and team ids come from `.vercel/project.json`; the token is the `VERCEL` var in the hub's `.env.local` (a dashboard API token, never the CLI login token). Print only the returned `nodeVersion`, never the token:
    ```bash
    T=$(grep '^VERCEL=' ~/code/hypertheory/hypertheory/.env.local | cut -d= -f2-)
    P=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])")
    O=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['orgId'])")
    curl -s -X PATCH "https://api.vercel.com/v9/projects/$P?teamId=$O" -H "Authorization: Bearer $T" -H "Content-Type: application/json" -d '{"nodeVersion":"<N>.x"}' | python3 -c "import json,sys;print(json.load(sys.stdin)['nodeVersion'])"
    ```
    The setting applies to the next deployment, so the run's eventual push covers it. If the API rejects the version, Vercel does not support it yet: keep the previous pin and note it under Deferred.
4. Verify as usual (`tsc`, `build`). Report it under Majors as `Node <old>.x → <N>.x (engines + Vercel setting)`, or `already current` when nothing moved.

## Step 5 — Quadruple-check audit (new, required)

After the last install but **before** the final report, do a systematic audit. This catches class of bugs that `tsc` + `build` won't find (renames that miss a site, migrations that leave deprecated patterns, etc.).

### 5.1 Variable renames

For every manual rename (`module` → `instance`, etc.), verify it's a pure rename with no semantic drift:

```bash
# Expect zero output (only rename lines should appear in diff)
git diff --staged <file> | grep -E "^[+-]" | grep -v "^+++\|^---" | grep -vE "(oldname|newname)"

# Expect symmetric line counts
git diff --staged --stat <file>
# (N insertions, N deletions)
```

If the diff shows anything beyond the rename, investigate.

### 5.2 Auto-migrated files (Tailwind, etc.)

Spot-check that the migration tool covered every deprecated pattern. Grep for v3 Tailwind patterns that must be gone:

```bash
for pat in "flex-shrink-" "flex-grow-" "overflow-ellipsis" "bg-gradient-to-" "text-opacity-" "bg-opacity-" "border-opacity-" "divide-opacity-" "placeholder-opacity-" "ring-opacity-" "outline-none\b"; do
  count=$(grep -rEn "$pat" --include="*.tsx" --include="*.ts" app/ 2>/dev/null | wc -l | tr -d ' ')
  [ "$count" != "0" ] && echo "⚠️  '$pat': $count remaining" || echo "✅ '$pat': 0"
done
```

Also verify `!X-*` important-prefix inversion happened (`!p-5` → `p-5!`):

```bash
grep -rEn 'className="[^"]*\s!(p-|m-|mr-|ml-|mt-|mb-|w-|h-)' --include="*.tsx" app/ | head -3
# Expect empty
```

For `rounded-sm` specifically: v3 `rounded` (4px) → v4 `rounded-sm` (4px) is a rename that preserves pixel size. v3 `rounded-sm` (2px) → v4 `rounded-xs` (2px) is a different rename. Both happen automatically via the upgrade tool. Verify:

```bash
# Any pre-migration rounded-sm NOT renamed to rounded-xs:
git diff --staged | grep "^-.*rounded-sm" | head
```

### 5.3 Preserved custom CSS / utility classes

If the project had custom utility classes in `globals.css` (documented in CLAUDE.md or similar), verify they survived the v3→v4 migration. In v4 they use the `@utility` directive instead of raw `.class` selectors. Both work, but the directive is the canonical v4 form.

```bash
# For each custom class mentioned in CLAUDE.md or commonly used:
for cls in "page-content" "container-width" "icon-cell" "card" "button-secondary" "input-sm"; do
  grep -nE "@utility $cls|\.$cls\b" app/globals.css | head -1
done
```

Also diff CSS variables:

```bash
old_vars=$(git show HEAD:app/globals.css | grep -oE "\-\-[a-zA-Z0-9_-]+" | sort -u)
new_vars=$(grep -oE "\-\-[a-zA-Z0-9_-]+" app/globals.css | sort -u)
diff <(echo "$old_vars") <(echo "$new_vars") | grep "^<"
# Expect empty (zero CSS vars lost)
```

### 5.4 SDK call site checks

For each major SDK bumped (Stripe, Anthropic, Supabase):

- `grep -rn "from '<package>'"` → inventory import sites.
- Spot-read one call site per package; confirm the call pattern matches the new SDK's expected shape. If `tsc` passes, the types are compatible, but a quick human read catches surprises (e.g., argument ordering changes that happen to coincide with optional-arg fallbacks).
- For Stripe specifically: verify `new Stripe(key)` constructors are still valid (v22 requires `new`), and print the installed SDK's pinned `apiVersion`:
    ```bash
    grep ApiVersion node_modules/stripe/esm/apiVersion.js
    ```
    Note the version in the final report.

### 5.5 Lint warnings

```bash
npx eslint . --format json | python3 -c "
import json, sys, collections
data = json.load(sys.stdin)
rules = collections.Counter()
for f in data:
    for m in f['messages']:
        if m['severity'] == 1:
            rules[m['ruleId']] += 1
for r,c in rules.most_common():
    print(f'{c:4d}  {r}')"
```

Categorize each rule. If any rule count is unexpected (e.g., a rule that wasn't there before the upgrade and isn't obviously pre-existing debt), investigate. Otherwise note the categories in the report.

### 5.6 Final verification

- `npx tsc --noEmit` → clean.
- `npx next build` → compiles + generates all static pages. Capture the route count and build time.
- `eslint .` → zero errors.
- `npm audit` → run `npm audit fix` if vulnerabilities exist; verify zero remain.
- `npm outdated` → empty except for intentionally-held packages.

## Step 6 — Report

Output this verbatim so the user can paste it into a PR:

```
## Tech Stack Update

### Project
<one-line: framework, package manager, Node, main integrations>

### Updated (N packages)

**Patch / minor** — batched, no per-package notes
- <count> packages bumped across <areas>

**Pre-1.0 minor / config-sensitive**
- pkg@A → pkg@B — <why it needed care>

**Majors**
- pkg@A → pkg@B — tool: <codemod/upgrade-cli/manual>, N call sites touched
  - <what broke and how it was fixed, or "clean" if zero changes needed>
- Node <old>.x → <N>.x — engines.node pinned, @types/node matched, Vercel project setting synced

**Removed (unused)**
- pkg — grep-verified zero imports

### Tools run
- `<codemod-name>` — M files auto-migrated
- `@tailwindcss/upgrade` — N files auto-migrated, config rewritten, PostCSS updated

### Manual edits applied
- <file:line> — <what changed>
- ...

### Lint config changes
- <if React Compiler rules disabled, list them here with reason>

### Quadruple-check audit
- Variable renames: ✅ pure rename, N lines symmetric diff
- Tailwind migration: ✅ no deprecated v3 patterns remain, all custom classes preserved, zero CSS vars lost
- Stripe: pinned apiVersion now `<version>` (was `<old>`); code reads only stable fields
- Anthropic / Supabase / <others>: ✅ API surface compatible
- Lint warnings: N pre-existing (listed below), 0 introduced by upgrade

### Verification
- tsc --noEmit: ✅
- eslint .: ✅ (N warnings, 0 errors)
- next build: ✅ — <route count> routes, <build time>
- npm audit: ✅ (0 vulnerabilities)

### Deferred (flagged, not applied)
- pkg@X → pkg@Y — <reason; must fit one of: upstream-blocked, architectural, pre-1.0 no-guide>

### You need to do

**Before deploy — UI QA (if Tailwind 4 landed)**
- [ ] Click through every major screen in a browser. The upgrade tool auto-migrates 95% of class renames, but `shadow-*`, `ring-*`, `rounded-*` size semantics changed; edge cases can regress. Test: home, all modals, main modules (<list them>), admin, auth, settings.

**Before deploy — Stripe webhook sanity (if Stripe SDK major landed)**
- [ ] Stripe dashboard → Developers → Webhooks → your endpoint → Replay one recent event of each type. Confirm 200 OK.

**Soon**
- [ ] <pre-existing lint debt if >10 warnings: "Review N pre-existing lint warnings; they were hidden because `next lint` was broken in Next 16+">
- [ ] <any env var / dashboard edits the user needs to make>

**Wait on upstream**
- [ ] <e.g. ESLint 10 once eslint-plugin-react@8 ships>

### Held back
- pkg@current (latest @next) — <reason>

### Status
N files staged, not committed. Review with `git diff --staged` and commit when ready.
```

## Things to not do

- Don't pin Stripe `apiVersion` reflexively — let SDK majors shift it if the code only reads stable fields. Only pin if the code reads experimental/beta fields (rare).
- Don't move the Node version in only one place. `engines.node`, `@types/node` and the Vercel project setting change together in Step 4.5 or not at all.
- Don't try to auto-fix React Compiler-specific lint rule violations by refactoring components — disable the rules in the config.
- Don't try to fix pre-existing code-quality lint warnings — they're out of scope; note and move on.
- Don't drop a package flagged "unused" by `depcheck` without grep-verifying — some are dynamically required.
- Don't trust a codemod or upgrade tool blindly — always run the Step 5 quadruple-check.
- Don't run `next dev` to test. Use `tsc`/`lint`/`build`.
- Don't commit on the user's behalf.
- Don't stop and ask for approval between individual major bumps. Approval at Step 3 covers the whole run.

## If something goes wrong

- **Install fails with peer-dep error** → resolve the peer explicitly (install a compatible version), or defer that one package. Never `--force`.
- **`tsc` regresses after a batch** → revert packages one at a time until typecheck passes; report which package was the blocker.
- **`next build` fails but `tsc` passes** → usually a bundler/runtime-level change; capture the exact error and grep the upgrade guide for it. If not fixable in ~5 min, revert that package.
- **Upgrade tool corrupts files** → `git checkout -- <files>`, apply manually from the breaking-changes list, flag the tool as unreliable in the final report.
- **User interrupts** → every batch is an independent install, so the tree is in a consistent state between batches. Note which batches landed, which are staged, and which are pending, so the run is resumable.
- **Post-upgrade: "something looks broken in the UI"** → this is Tailwind 4 edge cases the upgrade tool missed. Grep for the class(es) the user reports broken; compare old behavior vs v4 in the Tailwind upgrade guide; patch by hand.
