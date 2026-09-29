---
name: optimize-database
description: Audit and fix a Next.js + Supabase (Postgres) database for efficiency, redundancy, and RLS correctness. Adds indexes, tightens policies, removes vestigial columns/functions — fully autonomously (no approval step), with every destructive change gated behind grep + data checks and skipped-and-noted when it can't be verified safe on live data. Use when the user asks to "optimize the database", "optimize the backend", "clean up the DB", "make the schema elegant", or when reviewing a Supabase project for perf/security issues.
allowed-tools:
  - mcp__supabase__list_tables
  - mcp__supabase__list_migrations
  - mcp__supabase__list_extensions
  - mcp__supabase__execute_sql
  - mcp__supabase__apply_migration
  - mcp__supabase__get_advisors
  - Agent
  - Glob
  - Grep
  - Read
  - Edit
  - Write
  - Bash
  - TodoWrite
  - WebSearch
  - WebFetch
---

# Optimize Backend Skill

Comprehensive audit + fix pass for a Next.js + Supabase backend. The goal is a schema that is **efficient** (hot-path queries use indexes), **non-redundant** (no vestigial columns, duplicated data, or dead functions), and **RLS-correct** (policies are consistent, performant, and match the authentication model).

**This skill is safety-first.** Schema changes are easy to get wrong and hard to reverse. Every destructive change is preceded by a data check that must pass before it applies; a change that can't be verified safe is skipped and noted, never guessed at. No column is ever dropped without grep-verifying it in the app code first. No constraint is ever added without running the precondition check first.

## Autonomous operation (no approval gates)

This skill runs end-to-end without stopping to triage, present a plan, or wait for a go-ahead. Analysis feeds directly into applying migrations — the same run that finds a problem fixes it.

- **Every change is gated on evidence, not on the user.** The gate is a concrete precondition check — grep the repo for the identifier, `SELECT COUNT(*) WHERE col IS NULL`, a duplicate-detection query, an advisor diff, an `EXPLAIN` — never a confirmation prompt. If the check passes, apply the change. If it fails or is inconclusive, skip.
- **Doubt always resolves to skip.** When a change can't be verified safe, skip only that change, note it in the report, and continue with the rest. Because this runs on live production data, uncertainty means skip-and-note — never guess, and never stop to ask.
- **Quadruple-check nothing broke.** After applying: run `get_advisors` (security + performance) and diff against the Phase-1 baseline; `EXPLAIN` every touched hot path and confirm `Index Scan` (not `Seq Scan`); re-run the null/duplicate/data-reality checks for anything tightened; and smoke-call any touched `SECURITY DEFINER` RPC to confirm its return shape. Migrations are transactional, so a failed one rolls back untouched. A brand-new advisor notice is a regression — investigate and revert before continuing.
- **Finish the job.** Apply every verified-safe change as its own migration, then report. Never leave findings parked in a "waiting for approval" state — the report is a record of what was applied and what was skipped-and-noted, not a request for sign-off.
- **Commit safety (for any app-code edits).** When a DB change requires touching app code (e.g. updating a TypeScript interface after a rename), commit only the paths this run changed — never `git add -A`; leave pre-existing uncommitted work untouched, and never `git restore` a file that was already dirty before the run. Migrations themselves are applied via `apply_migration`/`execute_sql`, not git.

## Operating doctrine — reason from first principles

Before changing anything, ask: "if this schema were designed correctly from scratch today, what would the best end-state be?" Then close the gap — don't just patch the nearest symptom.

- **Root cause over local patch.** If several tables share a redundant column, a repeated policy shape, or a missing-index pattern, fix the shared cause (one migration that corrects all of them) rather than one-off tweaks.
- **Large refactors are in scope, not feared.** Consolidating redundant policies, normalizing a denormalized mess (or vice-versa where justified), collapsing duplicate indexes, unifying inconsistent naming, extracting a shared function — all welcome WHEN the end-state is clearly better AND verifiable. Scope is bounded by *verifiability*, never by size.
- **The one hard limit is "don't break anything," and irreversibility raises the bar.** This is production data. A reversible, additive change (an index, a new policy) can be bold. A lossy/irreversible one (a hard `DROP`, a `NOT NULL` that rejects future writes) demands near-certainty AND a recoverable path first. When correctness can't be proven on live data, do the smaller safe step and note the larger one.
- **Leave it simpler.** Fewer redundant objects, consistent naming, one source of truth, policies that read cleanly. Every area you touch should end up more elegant — but elegance that can't be verified safe on live data is deferred (noted), not forced.

## Non-negotiable invariants

Violating any of these is a bug in the skill. Read them before every destructive action.

1. **Never drop a column, function, or policy without first grep-verifying every reference in the app code AND checking Postgres-internal dependents.** Search the repo for the identifier in `.ts`, `.tsx`, `.js`, `.sql`, migration files, and `supabase/functions/**` (Edge Functions). If there are references, either update them in the same turn or refuse to drop. Beyond app code, query the database for objects that depend on the target — views, other functions, generated columns, indexes, FKs, triggers, and RLS policies (via `pg_depend`, `information_schema`, `pg_get_viewdef`). A drop that would cascade into a view or function is NOT safe: skip-and-note it, unless the dependent is refactored first in the SAME migration and that too is verified. Note also that other repos or external services hitting this DB directly are invisible to grep — a reason to prefer a recoverable drop for any populated column.
2. **Never add `NOT NULL` without running `SELECT COUNT(*) WHERE col IS NULL` first.** If the count is nonzero, either backfill with a deterministic, collision-safe strategy or skip-and-note the constraint.
3. **Never add `UNIQUE` without running a duplicate-detection query first** (`SELECT col, COUNT(*) FROM t GROUP BY col HAVING COUNT(*) > 1`). Dupes → resolve first, or skip.
4. **Never rewrite an RLS policy without recording the old `qual`/`with_check` and the new `qual`/`with_check` side-by-side in the report.** Policies are the security boundary; a subtle misquote can silently grant or revoke access.
5. **Never modify a `SECURITY DEFINER` function without preserving `search_path` pinning, advisory locks, and the exact return signature.** These are often load-bearing for security and concurrency.
6. **Never change FK cascade behavior (`ON DELETE CASCADE` / `SET NULL`) autonomously.** The correct semantic can't be inferred safely from grep + a data check, and getting it wrong can silently destroy billing history or audit trails. DEFAULT to leaving cascade behavior untouched: skip-and-note it as a flagged item rather than guessing.
7. **One logical change per migration.** If something breaks, the blast radius is small and the migration name explains what changed.
8. **Run `get_advisors` for both `security` and `performance` before AND after the pass.** Report a diff. A change that "cleaned up" but added new advisor notices is regression.
9. **If a change can't be verified safe by a grep + data check, skip it and note it.** The user gave you production data access. Ambiguity → skip-and-note, never guess and never block on the user.

## Self-evolution protocol (read first, follow exactly)

This file maintains itself. Two region types:

- **STABLE** — everything outside `EVOLVING` markers: the frontmatter, this protocol, the non-negotiable invariants, every phase procedure, the anti-patterns list, "What this skill does NOT do", and the failure-modes section. **Never modified by a skill run.** Only the user (or an explicit user request) changes STABLE content.
- **EVOLVING** — the blocks between `<!-- EVOLVING:START ... -->` and `<!-- EVOLVING:END -->` markers: the best-practices snapshot and the changelog. These are the ONLY parts a run may rewrite.

**Phase 0 of every run — refresh the snapshot:**

1. Read the target repo's `package.json` for the installed `@supabase/ssr` and `@supabase/supabase-js` versions, and (via `mcp__supabase__get_project` or `mcp__supabase__list_extensions`) note the project's Postgres major version. These pin the substitutions in the queries below.
2. Run the standardized queries (all of them, verbatim — substituting the Postgres major version found above):
   - `Supabase RLS policy performance auth.uid select initplan best practices`
   - `Postgres <major> index best practices composite partial covering`
   - `Supabase database linter advisors security performance rules`
   - `Postgres SECURITY DEFINER function search_path best practices`
3. Source hierarchy — a practice may only be added/changed in the snapshot when confirmed by a **Tier 1** source: supabase.com/docs, postgresql.org/docs, nextjs.org/docs. Tier 2 (supabase.com/blog) may corroborate but never solely justify a change. Random blogs are signal only — verify against Tier 1 before acting.
4. Diff findings against the snapshot below. If nothing changed, update only the `Last verified:` date. If something changed, rewrite the affected snapshot lines and append ONE changelog entry: `- YYYY-MM-DD: <what changed> (<Tier 1 source URL>)`.
5. **Self-edit safety rules:**
   - Edit only between the EVOLVING markers. Never touch frontmatter or STABLE sections, never rename/move this file, never edit the markers themselves.
   - After any self-edit, re-read the file and verify: frontmatter delimiters intact (with WebSearch/WebFetch and all `mcp__supabase__*` tools present), both `EVOLVING:START`/`EVOLVING:END` marker pairs present, all `## ` phase headings present. If broken, immediately restore the damaged section from the version still in context — do not proceed to the audit with a broken skill file.
   - Changelog is append-only; never delete or rewrite past entries. If it exceeds ~30 entries, compact the oldest 15 into a single dated summary line.
   - If web research is unavailable (offline, tool denied), skip Phase 0, note "snapshot not refreshed this run" in the report, and proceed with the existing snapshot — never block the audit on it.
6. Deprecations flow one way: a practice removed from the snapshot gets a changelog line saying why. The audit then treats occurrences of the deprecated pattern in the schema as gaps to fix.

<!-- EVOLVING:START best-practices snapshot -->
## Current best-practices snapshot

Last verified: 2026-08-08 (re-confirmed against supabase.com/docs database-advisors + RLS troubleshooting guide and postgresql.org CREATE FUNCTION docs)

- **RLS initplan perf**: wrap `auth.uid()` / `auth.jwt()` in `(select …)` inside policy `USING`/`WITH CHECK` so Postgres evaluates the auth function once per query (initplan) instead of once per row. Identical semantics; pure perf win the Supabase advisor explicitly recommends.
- **Per-role policies**: split multi-role policies into one policy per role (e.g. separate `service_role` and `authenticated`) so the `authenticated` path doesn't re-evaluate the `service_role` branch on every row. Always name the role with `TO` so unrelated roles skip the policy entirely.
- **Index RLS predicate columns**: any column referenced in a policy's `USING`/`WITH CHECK` (e.g. `user_id` in `(select auth.uid()) = user_id`) must be indexed if not already a PK; Supabase docs cite 100x+ wins on large tables.
- **Indexing**: add composite indexes that cover demonstrated hot paths (from `pg_stat_user_tables` seq-scans + API-route query inference) and index every FK column the advisor flags. Match column order to the query's filter+sort shape.
- **SECURITY DEFINER functions**: pin `search_path` (e.g. `SET search_path = ''` or an explicit schema list) and preserve the exact return signature when redefining; these are load-bearing for security and for every caller. When using an explicit schema list, put `pg_temp` LAST — the temp schema is otherwise searched first and is writable by anyone (postgresql.org CREATE FUNCTION docs).
- **Advisor diffing**: run `get_advisors` for both `security` and `performance` before AND after the pass, and report the diff. A change that "cleaned up" but added a new advisor notice is a regression.
- **Migration hygiene**: one logical change per migration, with `IF [NOT] EXISTS` idempotency so retries and renewals are safe.
- **Verification**: confirm with `EXPLAIN` that touched hot paths now use `Index Scan` / `Index Only Scan` rather than `Seq Scan`; an index the planner never chooses is dead weight.
- **Postgres major version** is read per-project at runtime (via `get_project` / `list_extensions`) — index and function guidance is version-sensitive, so don't hardcode a version here.
<!-- EVOLVING:END -->

<!-- EVOLVING:START changelog -->
## Changelog

- 2026-07-04: Initial best-practices snapshot authored from the skill's existing domain guidance (Supabase RLS/advisors + Postgres indexing current docs).
- 2026-07-19: Added `pg_temp`-last rule for SECURITY DEFINER explicit schema lists (https://www.postgresql.org/docs/current/sql-createfunction.html); rest of snapshot re-confirmed unchanged against supabase.com/docs.
- 2026-08-08: Added explicit TO-role naming and index-RLS-predicate-columns rules (https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv); rest re-confirmed unchanged.
<!-- EVOLVING:END -->

## Phase 0 — Detect the project shape

**First, run the Self-evolution Phase 0 above (refresh the best-practices snapshot) — then continue detecting the project shape.**

Before running queries, confirm this is actually a Next.js + Supabase project:

- `Glob` for `next.config.{js,mjs,ts}` or `app/layout.{tsx,ts}` to confirm Next.js.
- `Grep` for `@supabase/ssr`, `@supabase/supabase-js`, or `createClient` in the codebase to confirm Supabase.
- Run `mcp__supabase__list_extensions` — if this errors, the Supabase MCP isn't wired up; stop and tell the user to configure it.
- Run `mcp__supabase__list_migrations` to see what migration style the project uses (names, format) so new migrations match the house style.

If the project looks different (e.g., Drizzle with a self-hosted Postgres, raw pg via Prisma), adapt: the analysis phase still works, but `apply_migration` may not. In that case, output the SQL for the user to run themselves.

## Phase 1 — Analyze (read-only, no DDL)

Create a TodoWrite list with the sections below so the user sees progress. Run all queries in parallel where possible.

### 1a. Schema inventory

```sql
-- Full table/column/FK snapshot
-- Use mcp__supabase__list_tables with schemas=["public"], verbose=true
```

Also pull policies, indexes, functions, triggers:

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT tablename, indexname, indexdef FROM pg_indexes
WHERE schemaname = 'public' ORDER BY tablename, indexname;

SELECT n.nspname AS schema, p.proname AS name,
       pg_get_function_arguments(p.oid) AS args,
       pg_get_function_result(p.oid) AS result,
       p.prosecdef AS security_definer,
       pg_get_functiondef(p.oid) AS def
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY name;

SELECT event_object_schema AS schema, event_object_table AS table_name,
       trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema IN ('public','auth')
ORDER BY table_name, trigger_name;
```

### 1b. Usage stats (where the pain actually is)

```sql
-- Which tables are seq-scanning? These are the priority targets.
SELECT relname, seq_scan, seq_tup_read, idx_scan, n_live_tup, n_dead_tup
FROM pg_stat_user_tables WHERE schemaname='public'
ORDER BY seq_tup_read DESC;

-- Which indexes are actually used?
SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes WHERE schemaname='public'
ORDER BY idx_scan ASC;  -- 0-scan indexes are candidates for removal
```

### 1c. Advisor sweep

```
mcp__supabase__get_advisors type=security
mcp__supabase__get_advisors type=performance
```

Capture the baseline. At the end you'll diff against this.

### 1d. Data-reality checks

For every column that *looks* dead, verify empirically:

```sql
-- "Is this column all-null?"
SELECT COUNT(*) FILTER (WHERE col IS NULL)   AS nulls,
       COUNT(*) FILTER (WHERE col IS NOT NULL) AS populated,
       COUNT(*)                              AS total
FROM tbl;

-- "Is this counter always zero?"
SELECT MIN(col), MAX(col), COUNT(*) FILTER (WHERE col <> 0) FROM tbl;

-- "Are there duplicates in what could be UNIQUE?"
SELECT col, COUNT(*) FROM tbl GROUP BY col HAVING COUNT(*) > 1;
```

### 1e. Hot-path query inference

Read the app's API routes (typically `app/api/**/route.ts` for Next.js App Router) and note which queries run per request. For each, check whether the accessed columns have a covering index. Common hot paths:

- Per-user lookups: `WHERE user_id = ? ORDER BY updated_at DESC` → needs `(user_id, updated_at DESC)`
- Chat/message style: `WHERE parent_id = ? ORDER BY created_at` → needs `(parent_id, created_at)`
- Rolling-window quotas: `WHERE user_id=? AND created_at >= now() - '24h'` → needs `(user_id, created_at)`
- Any RPC called from a hot request path → run `EXPLAIN` on its inner query

Use `EXPLAIN (FORMAT JSON, BUFFERS OFF) <query>` with a plausible literal (e.g., a zero UUID) to confirm the plan is using an index.

## Phase 2 — Triage

Classify every finding into one of four buckets. This is an internal classification only — it feeds straight into Phase 3, with no summary-and-wait gate. Each bucket's action proceeds automatically once its precondition check passes.

### Always-safe (apply without confirmation)

- **Adding indexes** on FK columns flagged by the advisor.
- **Adding composite indexes** that cover demonstrably hot queries (from Phase 1b + 1e).
- **Rewriting RLS policies** to wrap `auth.uid()` / `auth.jwt()` in `(select …)` — this is a pure perf change with identical semantics (Supabase advisor explicitly recommends it).
- **Adding explicit `service_role` policies** on tables that have RLS enabled but zero policies (intent-clarifying, no behavioral change since service role bypasses RLS anyway).

### Low-risk (apply after summarizing)

- **Dropping 0-scan indexes** that have existed for a while (skip if index was created recently — it just hasn't been used yet).
- **Changing RLS policy predicates** when the current predicate keys off an unstable column (e.g., email) and a stable one (e.g., user_id FK) is available. Requires: user_id is populated for every row AND is the authenticated user's id.
- **Splitting a multi-role policy into per-role policies** for perf (so `authenticated` path doesn't re-evaluate the `service_role` branch).

### Destructive (gated on an evidence check, applied when it passes, skipped-and-noted when it fails)

Each item below carries a precondition. When the precondition passes, apply the change automatically. When it fails or is inconclusive, skip only that change and note it in the report — never guess, never ask.

- **Dropping a column.** Precondition: `Grep` in repo (including `supabase/functions/**`) for the column name returns no results in app code, the DB-internal dependency check (views, functions, generated columns, indexes, FKs, triggers, RLS policies via `pg_depend`/`information_schema`/`pg_get_viewdef`) shows no dependents, AND the data-reality check shows no meaningful values being read anywhere. A `DROP COLUMN` is irreversible and destroys data: if the column ever held non-null values (per the data-reality check), first make it recoverable IN THE SAME migration — copy `(pk, value)` into a timestamped `_deprecated_backup` table (or, for tiny sets, emit the values in the migration comment) BEFORE the drop. Only a provably all-null column may be dropped directly. Passes → drop; fails or has a live dependent → skip-and-note (unless the dependent is refactored first in the same migration and verified).
- **Dropping a function or trigger.** Precondition: `Grep` (including `supabase/functions/**`) for the function name in `.rpc('...')` calls and elsewhere returns no results, AND the DB-internal dependency check shows no other function, view, trigger, or policy references it. Passes → drop; fails → skip-and-note.
- **Adding `NOT NULL`.** Precondition: null count is 0 (or a deterministic, collision-safe backfill lands first). Passes → add; fails → skip-and-note.
- **Adding `UNIQUE`.** Precondition: no duplicates AND the app's insert path has collision handling (or you add it in the same turn). Passes → add; fails → skip-and-note.
- **Changing a function's return signature.** Precondition: every caller is updated in the same turn. Passes → change; fails → skip-and-note.
- **Changing FK `ON DELETE` behavior.** The correct semantic can't be inferred safely, so this is NOT applied autonomously — always skip-and-note it as a flagged item (changing it could destroy billing/audit rows).

### Out-of-scope (flag, do not apply)

- Postgres version upgrades (operational, user-scheduled).
- Auth settings (leaked-password protection, percentage-based connections) — surface in dashboard, not DDL.
- Any change that requires downtime or a maintenance window.
- Anything intentionally documented as "do not change" in a code comment (e.g., denormalized columns with a stated rationale).

## Phase 3 — Apply (one migration per logical change)

Apply in the safe order below autonomously — no plan to present, no go-ahead to collect. Each destructive step re-runs its precondition check immediately before it executes and self-skips (noting it in the report) if the check fails. The always-safe → RLS rewrites → backfills → constraints → drops ordering keeps the blast radius small and lets each later step assume the earlier ones landed.

### Ordering

1. All always-safe additive changes first (indexes, new policies).
2. RLS rewrites second.
3. Backfills third (for any `NOT NULL`-to-be columns).
4. Constraints (`NOT NULL`, `UNIQUE`) fourth — AFTER the backfill lands.
5. Drops last. A drop is irreversible, so it only happens after every prior step is confirmed working.

### Migration hygiene

Use `mcp__supabase__apply_migration` with a descriptive snake_case name and a leading comment explaining WHY. Example:

```sql
-- Cover the three hottest queries currently doing sequential scans:
--   * sidebar: chats WHERE user_id=? ORDER BY updated_at DESC
--   * chat load: messages WHERE chat_id=? ORDER BY created_at
--   * quota check: usage WHERE user_id=? AND created_at >= now()-'24h'
CREATE INDEX IF NOT EXISTS chats_user_id_updated_at_idx
  ON public.chats (user_id, updated_at DESC);
-- ... etc
```

Rules:
- Use `IF NOT EXISTS` / `IF EXISTS` where idempotency makes sense.
- Never mix logical concerns. One migration = one comprehensible change.
- If a migration includes a function redefinition AND a column drop (because the function writes to the column), do them in **that** order in a single migration, so the function is never in a broken state.
- **Locking (prod outage risk).** A plain `CREATE INDEX` takes a write-blocking lock on the table for the entire build — fine on a small table, an outage on a large hot one. Check `pg_stat_user_tables.n_live_tup`: for any table that isn't small, use `CREATE INDEX CONCURRENTLY`, which must run OUTSIDE a transaction block — apply it via `mcp__supabase__execute_sql` (NOT `apply_migration`, which wraps its body in a transaction), then confirm it built with `SELECT indisvalid FROM pg_index WHERE indexrelid = 'idx_name'::regclass` (`true`). A CONCURRENTLY build that fails leaves an INVALID index behind that must be dropped before retrying. The same write-lock caution applies to `ALTER TABLE ... SET NOT NULL` and `ADD CONSTRAINT` on large tables — note the lock cost when applying those.

### Common migrations (templates)

**Cover FK + hot-path indexes:**
```sql
CREATE INDEX IF NOT EXISTS tbl_user_id_created_at_idx
  ON public.tbl (user_id, created_at DESC);
```
On a large hot table use the non-blocking form instead, run via `execute_sql` (outside a transaction), then verify `indisvalid`:
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS tbl_user_id_created_at_idx
  ON public.tbl (user_id, created_at DESC);
```

**Optimize RLS initplan** (the big advisor win):
```sql
DROP POLICY IF EXISTS "old policy name" ON public.tbl;
CREATE POLICY "Users can manage their own rows"
  ON public.tbl FOR ALL TO authenticated
  USING      ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
```
The bare `(select …)` initplan wrap is semantically identical — verify by inspection. But any RLS change that alters the *predicate* (e.g. `email` → `user_id`, or any new/removed condition) MUST be verified with the RLS transaction-test in Phase 4 ("Verifying an RLS change") — the MCP connection bypasses RLS, so a plain query will not reveal a broken policy. If a valid test context can't be built, skip-and-note the predicate change.

**Split multi-role into per-role:**
```sql
DROP POLICY IF EXISTS "combined policy" ON public.tbl;
CREATE POLICY "Service role full access"
  ON public.tbl FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Users can read their own"
  ON public.tbl FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
```

**Drop a vestigial column (only after grep + DB-internal dependency check + recoverability):**
```sql
-- Column X was never read by app code or by the <function> RPC, and no view,
-- function, generated column, index, FK, trigger, or policy depends on it.
-- If X ever held non-null values, snapshot (pk, value) BEFORE dropping so the
-- drop is recoverable (a provably all-null column may skip this step):
CREATE TABLE IF NOT EXISTS public.tbl_x_deprecated_backup_20260704 AS
  SELECT id, x FROM public.tbl WHERE x IS NOT NULL;
-- Redefine the function first so it stops writing to the column, then drop.
CREATE OR REPLACE FUNCTION public.fn(...) ... AS $$ ... $$;
ALTER TABLE public.tbl DROP COLUMN x;
```

**Backfill + tighten a nullable column:**
```sql
DO $$
DECLARE new_val text;
BEGIN
  -- deterministic or unique backfill, collision-safe if UNIQUE will follow
  LOOP
    new_val := public.generator();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.tbl WHERE col = new_val);
  END LOOP;
  UPDATE public.tbl SET col = new_val WHERE col IS NULL;
END $$;

ALTER TABLE public.tbl ALTER COLUMN col SET NOT NULL;
CREATE UNIQUE INDEX tbl_col_key ON public.tbl (col);
```

**Document an intent-only RLS (quiet the advisor without changing behavior):**
```sql
CREATE POLICY "Service role full access to tbl"
  ON public.tbl FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

## Phase 4 — Quadruple-check

Run the full battery after every migration batch. Any regression — a new advisor notice, a hot path that fell back to `Seq Scan`, a constraint that doesn't hold, an RPC whose shape changed — means investigate and revert. Do NOT push forward to the next change on a regression.

1. **Advisors again** — compare against Phase 1c baseline. Every previously-green item must still be green; every targeted lint should now be gone.
2. **EXPLAIN on hot-path queries** — confirm they now do `Index Scan` / `Index Only Scan` rather than `Seq Scan`. A composite index that never gets chosen is dead weight.
3. **Column/policy/index roll call** — re-query `information_schema.columns`, `pg_policies`, `pg_indexes` and confirm each change landed exactly as intended.
4. **Data integrity** — re-run the null/duplicate/zero checks from 1d for anything that was tightened. Confirm constraints hold.
5. **Smoke queries** — if you touched a `SECURITY DEFINER` RPC, call it (e.g., `SELECT * FROM consume_daily_quota(100)` with a reasonable context) to confirm it still returns the expected shape.

### Verifying an RLS change (the MCP connection BYPASSES RLS)

The Supabase MCP `execute_sql` runs as a privileged role that **bypasses RLS entirely**, so simply querying a table does NOT confirm a policy's effect — you'd see rows regardless of what the policy allows. To actually verify an RLS change, run a transaction that impersonates a real user and roll it back:

```sql
BEGIN;
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<a real user uuid from the table>"}';
-- representative SELECT/INSERT/UPDATE the policy should ALLOW, and one it should DENY
ROLLBACK;
```

Confirm rows are granted for the owner and denied for a non-owner (repeat with a different `sub`). The `ROLLBACK` guarantees the probe writes nothing.

- For the pure `(select auth.uid())` initplan wrap, semantic equivalence is provable by inspection (no behavior change) — the transaction test is not required.
- For any predicate CHANGE (e.g. `email` → `user_id`), the transaction test IS required. If a valid test context can't be constructed (e.g. no representative user uuid, or claims can't be set), skip-and-note the predicate change rather than applying it blind.

## Phase 5 — Report

Output a structured report:

```
## Backend Optimization Report

### Baseline
- Tables: N, rows across all tables: M
- Advisor warnings: X security, Y performance

### Applied (N migrations)
1. `<migration_name>` — <one-line why>
2. ...

### Deferred (flagged, not applied)
- <item> — <reason>

### Hot-path improvements (EXPLAIN'd)
- <query description>: `Seq Scan` (cost ~<old>) → `Index Scan` on `<index>` (cost ~<new>)

### Remaining advisor notices
- <notice> — <why left alone>

### App-side follow-ups needed
- <file:line> — <change required>
```

## Anti-patterns to watch for (learned from prior runs)

These are real patterns that look like wins but aren't. Don't fall for them.

- **"This column is always null, drop it."** Check if it's a new column that just hasn't been backfilled yet. Check migration timestamps.
- **"This column duplicates `auth.users.email`, drop it."** Look for code comments — denormalization into `logs` or `audit` tables is often intentional so admin tools don't have to cross-join the protected `auth` schema, or so records survive user deletion.
- **"This `share_count` / `view_count` is always zero, it's dead."** Grep for the increment RPC name, not just the column. The write path may be wired even if the read path isn't — that's a UI follow-up, not a DB cleanup.
- **"This index has zero scans, drop it."** If it was created in the most recent migration, it's zero-scan because it's brand new. Check `pg_stat_user_indexes.idx_scan` against migration age.
- **"Make `short_id` UNIQUE, app already generates them."** Check if the app's generator has collision retry; if it uses a DB-side function (`random()` or similar) without a retry loop, making the column UNIQUE will cause occasional insert failures.
- **"Change the RLS policy from `email` to `user_id`."** Verify both columns exist and `user_id` is set on every row, not just new ones.
- **"Drop this FK, it's unused."** FKs are rarely for perf; they're for integrity. Removing one can let the parent row's deletion silently orphan child rows.

## What this skill does NOT do

- **App code refactors** beyond the minimum needed to keep the DB changes safe (e.g., updating a TypeScript interface if a column was renamed). Broader code cleanup is the job of `/optimize-code`.
- **Migration consolidation.** This skill only adds migrations; it never rewrites historical ones.
- **Seeding, test-data management, or backup orchestration.** Out of scope.
- **Horizontal scaling decisions** (partitioning, sharding, read replicas). If the user asks, flag it and punt.

## Failure modes & recovery

- **A migration fails mid-way.** `apply_migration` is transactional, so a failure leaves the DB untouched. Report the error verbatim to the user and stop the run.
- **An `EXPLAIN` shows the new index isn't picked.** The planner may need `ANALYZE` — run `ANALYZE public.<table>` and re-check. If it still isn't picked, the index shape is wrong; flag and revert.
- **The advisor diff shows a new warning.** Something you did introduced regression. Investigate before continuing; do not "push through" to the next migration.
- **User interrupts mid-run.** The DB is in a safe state between migrations (each is atomic). Leave a todo list snapshot and a "next step" note so the run is resumable.
