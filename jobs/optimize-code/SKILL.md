---
name: optimize-code
description: Comprehensive codebase audit + dead-code removal for a Next.js + Supabase + Stripe + Tailwind + Vercel app. Finds bugs, anti-patterns, scoping issues, perf problems, and deployment risks, AND removes dead code — unused files, exports, types, npm deps, orphaned API routes, unreferenced public assets, unused env vars, commented-out code, and dead branches. Runs fully autonomously — no audit or approval step; every fix/deletion is gated behind verification (grep + tsc/lint/build) and skipped-and-noted only when it can't be verified safe. Use when the user asks to "optimize the code", "audit the codebase", "find inefficiencies", "remove dead code", "clean up unused code", or "trim the repo". Database schema optimization (indexes, RLS, migrations) is OUT of scope — that is `/optimize-database`.
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

# Optimize Code Skill

Run a comprehensive, best-in-class pass over the application codebase. Two complementary jobs:

1. **Audit** — catch bugs, anti-patterns, scoping issues, perf problems, and deployment risks before they reach production.
2. **Prune** — remove dead code so every file, export, dependency, and env var is actually used: nothing vestigial, nothing commented-out, nothing orphaned.

This skill **edits and deletes code**. Every destructive step is gated behind a final cross-repo grep and a post-change build check, so a broken run is caught and reverted inside the skill, not in production.

**Out of scope:** database dead code and schema optimization (unused columns, functions, policies, indexes, RLS, migrations). Those belong to `/optimize-database`. If the user asks for DB cleanup, redirect.

## Autonomous operation (no approval gates)

This skill runs end-to-end without stopping to audit, propose, or ask. Detection feeds directly into fixing — never present a "here's what I found, what should I do?" plan and pause, and never ask the user to pick from a menu of fixes.

- **Every action is gated on a concrete verification, not on user confirmation.** The gate is evidence: grep-verify a filename/dependency/route path, or run `tsc`/lint/build. If a check confirms the action is safe → do it. If a check is inconclusive or shows risk → skip **only that one action**, note it in the final report, and keep going. "Uncertain ⇒ skip-and-note," never "uncertain ⇒ ask." One unverifiable item never blocks the rest of the run.
- **When an action can't be verified non-breaking, skip only that action and note it — then continue.** Do not halt the run because a single item is ambiguous.
- **Quadruple-check nothing broke, locally.** After every batch AND again at the end, run `npx tsc --noEmit`, the Phase 0 resolved lint command (`npm run lint`, else `npx eslint .` — never a hardcoded `next lint`), `npx next build`, and the project's tests if present. Auto-revert (`git restore`) any batch that regresses versus the Phase 0 baseline (only paths this run changed that were clean at start); never cascade a failure forward.
- **Finish the job.** Apply all fixes, then commit per the global rules: work on `main`, one commit per category so reverts stay surgical, and push per the repo's rules. Never leave the working tree dirty "for review" — a dirty tree awaiting approval IS the audit-and-gate behavior this skill no longer performs.
- **Commit safety.** Commit only the paths this run changed — never `git add -A`/`git add .`; pre-existing uncommitted work stays untouched and uncommitted. Never `git restore` a file that was already dirty before the run (you'd clobber the user's work) — auto-revert applies only to paths this run changed that were clean at start. If the repo isn't a git repo or isn't on `main`, note it and skip the commit rather than failing the run.

## Operating doctrine — reason from first principles

Before fixing, ask: "if this were built correctly from scratch today, what would the best end-state be?" Then close the gap to that end-state — don't just patch the nearest symptom.

- **Root cause over local patch.** If N call-sites share a bug, an anti-pattern, or a copy-pasted class-pile, fix the shared source (a utility, hook, helper, type, config) so all N are fixed at once. One good abstraction beats N identical edits.
- **Large refactors are in scope, not feared.** Consolidating duplicate components, extracting a shared module, renaming for clarity, restructuring a directory, replacing an ad-hoc pattern with the framework-native one — all welcome WHEN the end-state is clearly better. Scope is bounded by *verifiability*, never by size.
- **The one hard limit is "don't break anything."** A change is allowed exactly when the quadruple-check can prove it didn't change behavior: types + lint + build + tests green (and for behavior the tests don't cover, either a reasoned equivalence argument, an added characterization check, or a smaller provably-safe step instead). Irreversibility raises the bar — a reversible edit can be bold; a lossy one (deleting the last copy of something) demands near-certainty or a recoverable path first.
- **Leave it simpler.** Fewer moving parts, less code, clearer names, one source of truth. Every area you touch should end up more elegant than you found it. Elegance that can't be verified safe is deferred (noted), not forced.

## Non-negotiable rules

Violating any of these is a bug in the skill. Read them before every destructive action.

1. **Never remove `console.log`, `console.warn`, or `console.error` statements.** Per the user's standing rule, these are intentional — even when static analysis flags them as side-effect-only.
2. **Never delete a file without a final filename grep across every file type.** Search the basename (no extension) across `.ts`, `.tsx`, `.js`, `.json`, `.md`, `.sql`, `.mjs`, `.env*`, `vercel.json`, and CI configs. If any reference exists outside the file itself, do not delete — report instead.
3. **Never remove a dependency without grep-verifying it.** Check `from '<pkg>'`, `require('<pkg>')`, AND subpath imports (`<pkg>/something`) — `knip` is usually right but occasionally misses subpaths in string-based config.
4. **Never remove an API route without grep-verifying its URL path.** For `app/api/foo/bar/route.ts`, grep for `/api/foo/bar` (including trailing segments) across the entire repo. Externally-referenceable webhook-style routes (Stripe / Twilio / Zernio dashboards may reference them externally) are **NOT auto-deleted** — code can't verify external references, so it can't confirm the deletion is safe: skip-and-note it.
5. **Never touch test files or fixtures in the first pass.** They often import "unused" exports on purpose. Only clean tests if the user explicitly asks.
6. **Run `npx tsc --noEmit` and the resolved lint command (Phase 0 — `npm run lint`, else version-safe fallback; never a hardcoded `next lint`) after every change batch.** If either regresses *relative to the Phase 0 baseline* (a NEW error, not a pre-existing one), revert that batch with `git restore` and report. Do not proceed to the next batch with a newly-broken build.
7. **One commit per category (so reverts are surgical). Apply and commit autonomously — never leave the tree dirty awaiting review.**
8. **When a grep/build check can't confirm a deletion is safe, skip that one deletion and note it — proceed with everything verified safe. Never block on the user.**

## Self-evolution protocol (read first, follow exactly)

This file maintains itself. Two region types:

- **STABLE** — everything outside `EVOLVING` markers: the frontmatter, this protocol, the non-negotiable rules, and every phase (0–6, including the report/summary templates). **Never modified by a skill run.** Only the user (or an explicit user request) changes STABLE content.
- **EVOLVING** — the blocks between `<!-- EVOLVING:START ... -->` and `<!-- EVOLVING:END -->` markers: the best-practices snapshot and the changelog. These are the ONLY parts a run may rewrite.

**Phase 0 of every run — refresh the snapshot:**

1. Read the target repo's `package.json` and note the exact **major** versions of `next`, `react`, `tailwindcss`, `@supabase/ssr` / `@supabase/supabase-js`, `stripe`, and `knip`. These versions parameterize the queries below and the snapshot's per-repo notes.
2. Run the standardized queries (all of them, verbatim — substitute the major versions found above):
   - `Next.js <major> app router server components best practices`
   - `React <major> hooks rules use client use server directives`
   - `Tailwind CSS <major> upgrade breaking changes`
   - `Supabase @supabase/ssr createServerClient createBrowserClient best practices`
   - `Stripe webhook signature verification idempotency Node best practices`
3. Source hierarchy — a practice may only be added/changed in the snapshot when confirmed by a **Tier 1** source: nextjs.org/docs, react.dev, vercel.com/docs, tailwindcss.com/docs, supabase.com/docs, stripe.com/docs. Tier 2 (web.dev, vercel.com blog) may corroborate but never solely justify a change. Random blogs are signal only — verify against Tier 1 before acting.
4. Diff findings against the snapshot below. If nothing changed, update only the `Last verified:` date. If something changed, rewrite the affected snapshot lines and append ONE changelog entry: `- YYYY-MM-DD: <what changed> (<Tier 1 source URL>)`.
5. **Self-edit safety rules:**
   - Edit only between the EVOLVING markers. Never touch frontmatter or STABLE sections, never rename/move this file, never edit the markers themselves.
   - After any self-edit, re-read the file and verify: frontmatter delimiters intact, both `EVOLVING:START`/`EVOLVING:END` marker pairs present, all `## ` phase headings present. If broken, immediately restore the damaged section from the version still in context — do not proceed to the audit with a broken skill file.
   - Changelog is append-only; never delete or rewrite past entries. If it exceeds ~30 entries, compact the oldest 15 into a single dated summary line.
   - If web research is unavailable (offline, tool denied), skip Phase 0, note "snapshot not refreshed this run" in the report, and proceed with the existing snapshot — never block the audit on it.
6. Deprecations flow one way: a practice removed from the snapshot gets a changelog line saying why. The audit then treats occurrences of the deprecated pattern in repos as gaps to fix — e.g. a Tailwind v3 `tailwind.config.js` once v4 `@theme`-in-CSS is confirmed the standard.

<!-- EVOLVING:START best-practices snapshot -->
## Current best-practices snapshot

Last verified: 2026-09-07 (verified against nextjs.org, react.dev, tailwindcss.com, supabase.com, stripe.com docs; major versions read per-repo at runtime)

- **Server vs client components**: default to server components; add `"use client"` only for interactivity/hooks; `"use server"` only marks server actions. Flag client components with no hooks/interactivity (should be server) and server components importing client-only code. Server Functions treat every argument as untrusted and check auth inside the function body.
- **App Router conventions**: use `layout.tsx`/`loading.tsx`/`error.tsx`/`not-found.tsx` where appropriate; set route-segment configs `dynamic`/`revalidate` (and `fetchCache`) correctly; use `revalidatePath`, `revalidateTag(tag, profile)` (two-arg form in Next 16; single-arg is deprecated) and `updateTag` (Server Actions only) over stale data; parallel-route slots ship `default.tsx`.
- **Next 16 specifics**: `proxy.ts` exporting `proxy` replaces `middleware.ts` (nodejs runtime only); `cookies()`/`headers()`/`draftMode()`/`params`/`searchParams` (including in icon/opengraph-image/sitemap generators) are async and must be awaited; `next lint` is removed and `next build` no longer lints, so `package.json` runs `eslint .` with a flat config; `experimental.ppr`/`dynamicIO`/`useCache` are replaced by top-level `cacheComponents` and `"use cache"` only applies with it on; Turbopack is default so a custom `webpack` config fails the build; `images.domains` and `next/legacy/image` are deprecated (use `remotePatterns`).
- **Supabase clients**: correct client per context — `createServerClient` from `@supabase/ssr` on the server, `createBrowserClient` in the browser; never use the service-role key in client code or outside secure server contexts; check `.error` on every query. Server-side auth checks trust `getClaims()`/`getUser()` (validates the JWT), never `getSession()` alone.
- **Stripe**: verify webhook signatures with `constructEvent` on the raw body; dedupe by logging processed event IDs (never rely on ordering); return 2xx before heavy work; idempotency keys (UUID, no PII) on mutating API calls; never hardcode secret keys/price IDs (env vars only); handle the full subscription lifecycle (created/updated/deleted).
- **Images**: use `next/image` with explicit `width`/`height`/`sizes`; lazy-load/dynamically import heavy client libraries.
- **React Query**: disciplined query keys, proper invalidation, and handled error/loading states; no direct state mutation.
- **Dead-code tooling**: `knip` is the primary tool (module-graph aware — unused files, exports, deps, types in one pass), run via `npx --yes knip` since fleet repos do not install it; `ts-prune`/`depcheck` are fallbacks only.
- **Tailwind 4 stale-name greps**: `shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, bare `ring`→`ring-3`, `bg-[--var]`→`bg-(--var)`, `!` is a suffix not a prefix, `@layer utilities`→`@utility`; `hover:` only fires on hover-capable devices.
<!-- EVOLVING:END -->

<!-- EVOLVING:START changelog -->
## Changelog

- 2026-07-04: Initial best-practices snapshot authored from the skill's existing domain guidance (Next.js/React/Tailwind/Supabase/Stripe current docs).
- 2026-07-15: Supabase server-side auth line strengthened — trust `getClaims()`/`getUser()`, never `getSession()` alone in server code (https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- 2026-09-07: Added Next 16 specifics (proxy.ts, async request APIs, next lint removal, cacheComponents, Turbopack default, image deprecations) and the two-arg revalidateTag/updateTag guidance (https://nextjs.org/docs/app/guides/upgrading/version-16); Server Functions check auth in-body (https://react.dev/reference/rsc/use-server); Stripe webhook line now covers raw-body constructEvent, event-ID dedupe and early 2xx (https://docs.stripe.com/webhooks, https://docs.stripe.com/api/idempotent_requests); Tailwind 4 stale-name grep list (https://tailwindcss.com/docs/upgrade-guide).
<!-- EVOLVING:END -->

## Phase 0 — Preflight

**First, run the Self-evolution Phase 0 above (refresh the best-practices snapshot) — then continue with preflight.**

- `git status` — record which files are already dirty so this skill's own changes stay distinguishable at commit time. If the tree has unrelated uncommitted work, commit or stash it first so each optimize commit is surgical, then proceed — do not halt.
- `git branch --show-current` — per the global rules, work directly on `main`; do not cut or switch to a side branch.
- Read `package.json` to confirm this is a Next.js project and see what tooling is already installed (`knip`, `depcheck`, `ts-prune`, `eslint`).
- Glob for `next.config.{js,mjs,ts}` or `app/` to confirm Next.js App Router. If it's Pages Router, adjust route-audit paths accordingly.
- **Resolve the lint command once (version-safe), then reuse it everywhere.** Prefer the project's own `npm run lint` script if `package.json` defines one. Otherwise: `next lint` is DEPRECATED and was removed in Next.js 16 — detect the installed Next major from `package.json`; use `npx next lint` only if a `lint` script or Next ≤ 15 makes it available, and fall back to `npx eslint .` when it isn't. Wherever a phase below says "lint," run this resolved command — never hardcode `next lint` as the only option.
- **Capture a verification BASELINE before any change.** Run the resolved lint command, `npx tsc --noEmit`, and `npx next build` ONCE up front and record their pre-existing errors, warnings, and failures. This baseline is the reference for the rest of the run: throughout, only NEW problems (absent from the baseline) count as regressions to auto-revert. A pre-existing failing build/lint/tsc is reported as-is, never blamed on this run, and does not block otherwise-safe fixes.

Create a TodoWrite list covering both the audit sections (Phase 1) and the dead-code categories (Phase 2) so the user sees progress. Run detection in parallel where possible.

---

## Phase 1 — Detect issues (read-only)

Detection here feeds directly into autonomous fixing (Phase 3+) — there is no report-and-wait between finding an issue and fixing it. All 10 detection sections below run exactly as written.

When the user invokes `/optimize-code`, optionally with a scope (e.g., `/optimize-code dashboard`, `/optimize-code stripe`), run every audit section below. If a scope is provided, focus on files related to that scope but still check cross-cutting concerns (env vars, types, build). If no scope is provided, audit the entire codebase.

### 1. Build & Type Safety

- Run `npx tsc --noEmit` and report any TypeScript errors.
- Run the resolved lint command (Phase 0 — `npm run lint`, else version-safe fallback to `npx eslint .`; `next lint` is deprecated/removed in Next.js 16) and report any ESLint warnings or errors.
- Run `next build` (with `NEXT_PRIVATE_SKIP_DEPLOY=1` if needed) and check for build failures or warnings.
- Flag any `any` types, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable` comments that suppress real issues.

### 2. Component Architecture & Scoping

- Verify components follow single-responsibility — flag components that are doing too much (rendering, data fetching, business logic, and state management all in one).
- Check that `"use client"` and `"use server"` directives are used correctly and only where needed.
- Flag client components that could be server components (no hooks, no interactivity).
- Flag server components that accidentally import client-only code.
- Check for prop drilling deeper than 2-3 levels where context or composition would be cleaner.
- Verify that shared/reusable components live in a shared location, not buried in feature folders.
- Check for duplicate or near-duplicate components that should be consolidated.

### 3. Next.js Best Practices

- Verify correct use of App Router conventions: `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` where appropriate.
- Check that API routes (`route.ts`) validate inputs, return proper status codes, and handle errors gracefully.
- Flag any API routes that expose sensitive data or lack auth checks.
- Check for proper use of `revalidatePath`/`revalidateTag` vs stale data.
- Verify metadata and SEO (`generateMetadata`, `<title>`, Open Graph) on public-facing pages.
- Check for missing or incorrect `dynamic`, `revalidate`, or `fetchCache` route segment configs.
- Flag any direct DOM manipulation or `document`/`window` access without guards in SSR-safe code.

### 4. Supabase & Data Layer

- Check that all Supabase queries use the correct client (`createClient` from `@supabase/ssr` for server, `createBrowserClient` for client).
- Verify RLS is not being bypassed — flag any use of the service role key outside of secure server-side contexts.
- Check for missing error handling on Supabase queries (unchecked `.error`).
- Flag any queries that fetch more data than needed (missing `.select()` columns, no `.limit()`).
- Check for N+1 query patterns or redundant fetches.
- Verify that auth state is checked before protected operations.

### 5. Stripe Integration

- Verify webhook signature verification is present on all Stripe webhook handlers.
- Check that Stripe API calls use proper error handling and idempotency keys where appropriate.
- Flag any Stripe secret keys or price IDs that are hardcoded instead of using env vars.
- Verify that subscription state changes (created, updated, deleted) are handled completely.
- Check that checkout sessions, billing portal, and payment flows handle edge cases (expired sessions, failed payments, duplicate submissions).
- Verify that Stripe metadata is consistent with database records.

### 6. Security & Environment

- Flag any secrets, API keys, or credentials that are hardcoded or committed.
- Verify all sensitive env vars are server-side only (no `NEXT_PUBLIC_` prefix on secrets).
- Check that `.env.local` / `.env` files are in `.gitignore`.
- Flag any missing input validation or sanitization on user-facing inputs.
- Check for XSS vectors — raw `dangerouslySetInnerHTML`, unescaped user content in markdown rendering.
- Verify CORS and auth middleware are correctly configured.

### 7. React & State Management

- Flag missing `key` props on lists or keys derived from array indices where items can reorder.
- Check for stale closures in `useEffect`, missing dependency array items.
- Flag effects that should be event handlers or derived state instead.
- Check for memory leaks — missing cleanup in effects (subscriptions, timers, abort controllers).
- Verify React Query usage: correct query keys, proper invalidation, error/loading states handled.
- Flag any direct state mutations.

### 8. Styling & UI Consistency

- Check for conflicting or redundant Tailwind classes (e.g., `text-sm text-lg`).
- Flag inline styles where Tailwind classes exist.
- Check for hardcoded colors/spacing that should use the theme/design tokens.
- Verify responsive design — flag components missing responsive breakpoints on key layouts.
- Check for accessibility basics: `alt` on images, proper heading hierarchy, focus management on modals/dialogs, `aria` labels on interactive elements.

### 9. Performance

- Flag large client bundles — components importing heavy libraries that could be lazy-loaded or dynamically imported.
- Check for missing `Suspense` boundaries around lazy-loaded components.
- Flag images not using `next/image` or missing `width`/`height`/`sizes`.
- Check for unnecessary re-renders — objects/arrays created in render, missing `useMemo`/`useCallback` on expensive operations.
- Flag any synchronous heavy computation in the render path.

### 10. Deployment Readiness (Vercel)

- Verify `next.config.mjs` has no dev-only settings that would break production.
- Check that all required env vars referenced in code have corresponding entries (flag any that might be missing in production).
- Verify there are no `console.log` statements left in production code (allow `console.error`/`console.warn`).
- Check for hardcoded `localhost` URLs or dev-only endpoints.
- Verify that the build output is clean — no unexpected warnings.

---

## Phase 2 — Detect dead code (read-only)

Run detection in parallel where possible.

### 2a. `knip` (primary tool)

`knip` is the gold standard — it understands the module graph and flags unused files, exports, dependencies, types, enum members, and class members in one pass.

```bash
# Non-interactive, structured output. Add --production to ignore dev-only tooling.
npx --yes knip --reporter json > /tmp/knip.json 2>/tmp/knip.err || true
```

If `knip` errors on config, fall back to `npx ts-prune` for unused exports and `npx depcheck` for unused dependencies. Read the JSON and categorize findings.

### 2b. `eslint --fix` for unused imports and locals

```bash
# Fixes unused imports + unused local vars in place. Zero-risk.
# Use the resolved lint command's --fix form: `npm run lint -- --fix` if the project
# defines a lint script, else `npx eslint . --fix`. `next lint --fix` is deprecated and
# removed in Next.js 16 — only use it if Next ≤ 15 and no other lint script exists.
npm run lint -- --fix   # or: npx eslint . --fix
```

This is the only auto-fix step that runs without user confirmation — it's what the linter would do anyway, and it's already gated by the existing lint config.

### 2c. Orphaned API routes

List every `app/api/**/route.ts`, derive its URL path, and grep the repo for that path. Routes with zero references (excluding the route file itself) are candidates.

```bash
# List all routes and their derived paths
find app/api -name 'route.ts' -o -name 'route.tsx' | \
  sed 's|^app||; s|/route\.tsx\?$||' | sort -u
```

For each path, grep `/api/<path>` across `.ts`, `.tsx`, `.js`, `.md`, `.json`. **Flag webhook-looking routes (paths containing `webhook`, `callback`, `stripe`, `zernio`, `twilio`) for user review — never auto-delete.**

### 2d. Unreferenced public assets

```bash
find public -type f | while read f; do
  base=$(basename "$f")
  # Grep for basename across the repo (excluding the public dir itself)
  if ! grep -rq --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' --include='*.css' --include='*.json' --include='*.md' "$base" app lib components 2>/dev/null; then
    echo "UNREFERENCED: $f"
  fi
done
```

Flag all OG/social/favicon assets (`og-*.png`, `favicon.*`, `apple-touch-icon*`, `robots.txt`, `sitemap.xml`) for user review even if they look unreferenced — Next.js consumes these by filename convention.

### 2e. Unused environment variables

Find every `process.env.X` reference and compare against `.env.local`, `.env.example`, and any `.env.*` files. Vars declared but not referenced in code → flag. **Never auto-delete from `.env*` files — the user may have set them in Vercel for runtime use; just report.**

```bash
# Vars referenced in code
grep -rhoE 'process\.env\.[A-Z_][A-Z0-9_]*' app lib components --include='*.ts' --include='*.tsx' | \
  sort -u > /tmp/env-used.txt

# Vars declared in example/local files
for f in .env.example .env.local .env; do
  [ -f "$f" ] && grep -oE '^[A-Z_][A-Z0-9_]*' "$f"
done | sort -u > /tmp/env-declared.txt

comm -23 /tmp/env-declared.txt /tmp/env-used.txt  # declared but not used
```

### 2f. Commented-out code blocks

Multi-line comments (`//` runs of ≥3 lines or `/* */` blocks) whose content looks like code — contains `=`, `;`, `=>`, `function`, `const`, `return`, `import`, `export`, or matching braces. Use a careful regex; err on the side of reporting, not deleting.

Skip JSDoc (`/** */`), license headers, and `TODO:` / `FIXME:` / `NOTE:` comments even if they contain code-ish characters.

### 2g. Dead conditional branches

Grep for hard-dead conditions:

```bash
grep -rnE '\bif\s*\(\s*(false|0)\s*\)' --include='*.ts' --include='*.tsx' app lib components
grep -rnE '\bif\s*\(\s*true\s*\)' --include='*.ts' --include='*.tsx' app lib components
```

Also flag unreachable code after `return` / `throw` inside the same block (`knip` may catch some of this; a manual sweep catches the rest).

---

## Phase 3 — Fix everything (autonomous)

No approval gate. Detection from Phases 1–2 flows straight into fixing:

- **ALL Critical + Warning + Suggestion audit fixes** are applied automatically.
- **ALL safe + recommended dead-code removals** (unused imports/locals, exports, types, files, deps) are applied automatically once their grep/build check confirms them safe.
- **Review items (medium-risk)** — orphaned API routes, unreferenced public assets, unused env vars, commented-out blocks, dead branches — are applied when their grep/data check confirms them safe; if a check is inconclusive, skip-and-note that one item and continue.

Record findings inline as you fix them. The template below is NOT an approval gate — it is the post-hoc record produced in Phase 6 (applied vs. skipped-and-noted). Keep it for that purpose.

```
## Optimize Code Report

### Audit — Critical (must fix before deploy)
- [blocking issues with file paths and line numbers]

### Audit — Warnings (should fix soon)
- [non-blocking but important issues]

### Audit — Suggestions (nice to have)
- [improvements and optimizations]

### Audit — Clean
- [audit sections that passed with no issues]

### Dead code — Safe to remove (already applied by lint --fix)
- N unused imports removed
- N unused local vars removed

### Dead code — Recommended removal (low risk)
- Unused files: [path + what knip saw]
- Unused exports: [path:line + symbol]
- Unused dependencies: [name]
- Unused types: [list]

### Dead code — Requires user review (medium risk)
- Orphaned API routes: [path]
- Unreferenced public assets: [list]
- Unused env vars: [list]
- Commented-out code blocks: [path:line]
- Dead conditional branches: [path:line]

### Skipped (out of scope or protected)
- Test files and fixtures
- console.log / console.warn / console.error
- Webhook-style API routes
- Next.js convention assets (og-*, favicon, sitemap, robots)
- Database columns / functions / policies — run /optimize-database
```

For each audit issue, record: (1) the file path and line number, (2) what the issue is, (3) the concrete fix applied (or the reason it was skipped-and-noted).

## Phase 4 — Apply in gated batches

For each category, in this order (safest first):

1. **Unused imports / locals** — already done by `lint --fix` in Phase 2b.
2. **Audit fixes** — apply all Critical/Warning/Suggestion fixes from Phase 1, grouped by section so each batch is a surgical, revertible commit.
3. **Unused exports** — edit files to remove the export; if the symbol is also unused internally, remove its declaration too.
4. **Unused types and interfaces** — remove declarations.
5. **Unused files** — for each file, do the final filename grep first (rule #2). Then `git rm <path>`.
6. **Unused dependencies** — `npm uninstall <pkg1> <pkg2> ...` (batch into one command). Run grep-verify first per rule #3.
7. **Orphaned API routes** — `git rm` each route whose URL-path grep confirms zero references (rule #4). Externally-referenceable webhook-style routes can't be confirmed safe → skip-and-note.
8. **Unreferenced public assets** — `git rm` each asset whose basename grep confirms zero references. Next.js convention assets (og-*, favicon, sitemap, robots) can't be confirmed safe → skip-and-note.
9. **Commented-out code blocks** — edit in place.
10. **Dead conditional branches** — edit in place to remove the dead branch and unwrap the live one (or delete entirely if whole block is dead).

**After every category batch:**

```bash
# Use the Phase 0 resolved lint command in place of `next lint`.
npx tsc --noEmit && npm run lint   # lint = resolved command; or `npx eslint .`
```

If either regresses relative to the Phase 0 baseline (a NEW failure, not a pre-existing one), immediately `git restore` **only the paths this batch touched that were clean at run start** (never a file that was already dirty before the run), report the failure, and move to the next category. Do not cascade failures.

## Phase 5 — Quadruple-check

Once all categories are processed, run the full battery. Any regression here auto-reverts the offending batch (`git restore`) — never ship a red build:

1. `npx tsc --noEmit` — no NEW errors versus the Phase 0 baseline.
2. Resolved lint command (Phase 0 — `npm run lint`, else `npx eslint .`; never a hardcoded `next lint`) — no NEW warnings/errors versus the baseline (pre-existing ones are reported, not blamed on this pass).
3. `npx next build` — full build. This catches issues `tsc` and lint miss (e.g., dynamic imports, route resolution, metadata generation). **Caveat:** a local `next build` can fail for environment reasons unrelated to the change — e.g. production env vars that only exist in Vercel. If the build fails, compare the failure against the Phase 0 baseline: only a NEW, change-caused failure triggers a revert; an env-only or pre-existing failure is noted in the report, not reverted.
4. If the project has tests, run them: `npm test` or equivalent.
5. `git status` — confirm the tree reflects exactly the applied categories plus any work that was already dirty before the run (which stays untouched); nothing stray. Summarize what changed (file count, line count, deps removed).

## Phase 6 — Summary

Produce a short final report:

```
## Optimize Code Summary

Audit fixes applied:
- N Critical, N Warning issues fixed (by section)

Dead code removed:
- N files
- N exports / types
- N npm dependencies
- N API routes
- N public assets
- N commented-out blocks
- N dead branches

Verification: tsc ✓  lint ✓  build ✓  tests ✓

Skipped-and-noted (could not be verified safe — never blocked the run):
- [items whose grep/build check was inconclusive, with the reason]

Committed:
- One commit per category (list them); pushed per the repo's rules.
```

Commit autonomously, one commit per category so reverts stay surgical. Do not leave the working tree dirty for review.
