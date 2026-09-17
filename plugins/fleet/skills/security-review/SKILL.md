---
name: security-review
description: Recurring security review for any Hypertheory fleet app (Hypertheory, Ghostplug, Brandflare, StonedGPT, Recruiterbase). Finds holes an attacker could actually use (missing auth on a server action or route, cross-tenant reads or writes, RLS policies that let a user grant themselves a paid plan, service-role clients reachable without auth, leaked secrets, SSRF, unsigned webhooks, critical framework advisories), checks the live Supabase posture, and keeps a per-repo ledger so a finding is reported once, tracked to fixed, and re-checked for regression. "Nothing to report" is the designed normal outcome. Use when the user types /security-review, asks for a security audit or review of an app or the fleet, asks "is X secure", "any security holes", "check auth on this repo", or when the weekly scheduled review runs.
allowed-tools:
  - Agent
  - Bash
  - Read
  - Grep
  - Glob
  - Edit
  - Write
  - AskUserQuestion
---

# Security review

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session only the attached repo exists; resolve `<repo>` against `git rev-parse --show-toplevel`. Skill files: `$CLAUDE_PLUGIN_ROOT/skills/security-review/` (scanner at `scripts/scan.mjs`, posture queries at `scripts/rls.sql`).

One question, answered per app: **can someone who is not supposed to, read, change, delete, or pay nothing for something, by sending a request this code accepts?** Everything in this skill exists to answer that with evidence, write the answer down once, and stay quiet when the answer is no.

The review is designed so that a clean run costs one ledger line and a clean quarter is the expected result. It is NOT an improvement pass: no hardening suggestions, no best-practice drift, no "consider". If the bar below is not met, nothing is written anywhere.

## Modes

| Invocation | Scope | Writes |
|---|---|---|
| `/security-review` | the current repo | ledger + safe code fixes (committed locally, never pushed) |
| `/security-review report` | the current repo | ledger only, code untouched (the scheduled routine's mode) |
| `/security-review fleet` | all five repos, laptop only | one read-only agent per repo, then ledgers + safe fixes from the main session |
| `/security-review accept <id> <reason>` | one ledger row | marks a finding accepted so it is never re-reported |

## The bar: what is a finding

A finding is an attacker story with all three parts filled from the code, not from imagination:

1. **Who**: anonymous, any signed-in user, a member of a different tenant, a staff-portal visitor, or a cron/webhook impersonator.
2. **What request**: the exact route and method (or server action, PostgREST table op, or RPC) and the body or parameter that does it.
3. **Gets**: reads or changes another tenant's data, deletes something not theirs, grants themselves a paid plan or quota or credits, obtains a secret or a session, makes the server fetch an address of their choosing, or logs in as someone else.

If any part cannot be stated concretely, it is not a finding. Severity: **critical** (account or tenant takeover, money moved, secrets), **high** (cross-tenant read or write, self-granted paid access, unauthenticated privileged mutation), **medium** (SSRF into internal ranges, open redirect after auth, unsigned inbound webhook that changes state). There is no "low": below medium is not written.

**Never findings, never written, never mentioned:** missing rate limits, CSP or other headers, cookie flags, "consider validating", logging gaps, timing attacks, dependency advisories below critical or on dev-only or unreachable code, Supabase advisor notices about `search_path`, leaked-password protection, Postgres patch versions, or "RLS enabled no policy" (that is deny-all, which is correct for service-role tables), CSRF on Next server actions (origin-checked by the framework), secrets in `.env.local` (gitignored by design), anything an admin-only hub action can do (the hub's caller IS the owner once `requireAdmin` holds), anything the ledger marks `accepted`, and anything already `open` in the ledger (it is counted as still open, not re-described).

## Procedure, per app

Work through every step; skip none. Read the scanner output in full before judging anything.

### 0. Preflight

- App name from the repo folder; ledger at `<repo>/.claude/security.md`. Read it whole. If missing, create it from the template at the end of this file.
- Note `git rev-parse --short HEAD` and the date; both go in the run row.
- Fix mode only: `git status --short` must show no pre-existing changes to files you might touch; never sweep another session's work into a fix commit.

### 1. Scanner (deterministic candidates)

```bash
node "$CLAUDE_PLUGIN_ROOT/skills/security-review/scripts/scan.mjs" <repo> > <scratchpad>/scan-<app>.txt
```

Same tree in, same list out. It never decides; it narrows the code you must actually read to the places a hole can live. Sections and how to judge each:

- **Server actions without an auth call**: read each one. Decide who can invoke it (any browser can POST any exported action by id, regardless of what page renders it; the proxy and layouts do not protect actions) and what it does with a privileged client. A sign-in action is public by design. A staff-portal action that mutates by id through the service role with no check that the id belongs to that staffer is a finding if a visitor can reach the portal (Ghostplug's `/staff/<name>` pages are reachable by anyone who knows a name).
- **Routes with no visible mechanism**: read the file. Public by design: pageview pulse, Stripe success landing (must verify the Checkout Session with Stripe before fulfilling, never trust query params alone), auth callbacks, contact forms that only insert. Anything that reads or mutates user data, spends AI or vendor credit, or uses a service-role client with no session, bearer, signature, or cron check is a finding. A `Bearer` check is only a mechanism if the token is compared against a server env value.
- **Routes by mechanism**: spot-check that the mechanism gates the handler (an `auth.getUser()` whose result is never checked is not a gate). Webhooks must reject on signature failure BEFORE touching the DB.
- **Service-role importers marked ENTRY NO AUTH**: each is a route or action reaching a privileged client with no auth regex hit. Read it; either it has a mechanism the regex does not know (record the pattern in the ledger's public-by-design list) or it is a finding. A `CLIENT COMPONENT` importer is a finding only if the import is not type-only (the scanner already excludes `import type`).
- **Secret literals, tracked env files, secret-looking NEXT_PUBLIC names**: any hit is critical unless it is a documented public key (Supabase anon/publishable keys are public by design).
- **Variable-URL fetches**: a finding when the URL comes from a user-supplied field AND the host is not validated, or is validated once and then followed through redirects (`redirect: 'manual'` with re-validation per hop is the fix). Internal fetches to `getSiteUrl()` or an env base are not findings.
- **Redirects fed by request data**: a finding only when the target can leave the app's own origin after a privileged step (auth callback `next` that accepts `//evil.com` or `https://`).
- **Mutations by id through a privileged client, no ownership evidence**: read the file. If the id comes from the request and the row can belong to another tenant, and nothing before the mutation asserts ownership, it is a finding. Cron, webhook and admin-only files are trusted callers.
- **Edge layer**: confirm app routes are guarded by `startsWith` prefixes, not exact paths, and that the public list is only marketing, auth, legal and API paths. Remember the proxy is NOT the guard for server actions or API routes; those carry their own.
- **Dependency advisories**: only `critical` on a direct runtime dependency whose vulnerable feature the app uses counts (a Next.js proxy/middleware bypass counts for every app; an image-optimizer DoS on an app with no remote images does not). Record as one finding per package, remedy = the fixed version.

### 2. Live database posture

Run both statements from `scripts/rls.sql` through the Supabase MCP `execute_sql` (one statement per call) against the app's project, then `get_advisors` with type `security`. Project refs: Hypertheory `qotpuamixdgovsouqaqe`, Ghostplug `heebfqevdjhogsmkqsqg`, Brandflare `snulxevwuxgggcpkpdgr`, StonedGPT `pbsmzilrzdobtybdlrhx`, Recruiterbase `ueqdcbpoadackzmsjovn`. If no Supabase access exists in the session, write `rls: not checked` in the run row; never guess.

Judge policies with the same bar, table by table:

- A table holding user or tenant data with `rls: false` and anon/authenticated grants: critical.
- A permissive policy (`using true` or `check true`) for `anon`/`authenticated`/`public` on a table the browser client writes: finding unless the table is an insert-only sink (`pageviews`, `landing`) or genuinely public read (`staff` names, `subreddits`).
- A membership or join table whose INSERT check only proves `user_id = auth.uid()` and never proves a right to the parent (`brand_id`, `instance_id`): critical, this is tenant takeover.
- An UPDATE policy on a table that carries billing, plan, quota, limit or admin flags in a column or in `metadata`, whose `check` lets the member write any column: high (self-granted paid plan). The fix is a column-restricted policy or moving those writes to a server path that strips the keys.
- A `SECURITY DEFINER` function callable by `anon` or `authenticated`: read its body (`pg_get_functiondef`). Finding only if a caller-controlled argument changes what the caller may do or see beyond their own rows (a quota function that consumes the CALLER's own quota is not a hole; a gate that reveals other users' paid data is).
- Everything the advisors say beyond the above is noise for this review.

### 3. Money paths

Read them every time; they change rarely and cost the most when wrong:

- Stripe webhook: `constructEvent` with the env secret, failure returns 400 before any DB read, event type switch mutates only rows matched by customer or subscription id from the event.
- Checkout and portal routes: the session's user must own the Stripe customer (and subscription) referenced; `return_url` and `success_url` clamped to the app's own site URL; price ids from server config, never from the request.
- Success or fulfillment landing: retrieve the Checkout Session from Stripe by id and check `payment_status` before granting anything; idempotent on retry.
- Any place plan, quota, credits, `comp`, `subscription`, `limit` or `tier` is written: must be webhook, cron, or an admin path. A user-reachable write path to any of those is high.

### 4. Reconcile with the ledger

Match findings to ledger rows by meaning (same table and policy, same route and hole), not by line number.

- Not in the ledger: **new**. Assign an id `<class>-<short-slug>` (`rls-brand-members-insert`, `route-swap-assist-unauth`, `dep-next-proxy-bypass`), write the row and its story block, `first seen` today.
- In the ledger as `open`: **still open**; update `last seen` only.
- In the ledger as `fixed`: re-check that exact hole. Still closed: nothing to write. Back: flip to `open` with a `regressed <date>` history line and report it as a regression (severity unchanged, but it leads the report).
- In the ledger as `accepted`: skip silently unless the code at that location changed in a way that widens the hole; then it is a new finding with a new id, not a reopen.
- Open rows the scanner no longer finds and you have verified are gone (the code or policy changed): mark `fixed <date> (outside this review)`.
- Append one line to the run log: `| <date> | <mode> | <verdict> | new N | open N | regressed N | rls <checked|not checked> | <short sha> |`. Verdict is `clean` when new = 0 and regressed = 0, else `N to fix`.

The ledger's **public by design** list is part of the contract: a route or action listed there is never flagged for lacking a mechanism, only for its listed mechanism having changed. Add to it whenever you clear a candidate that the scanner will raise again next run, so the next run is cheaper and identical.

### 5. Fix tier (default and fleet modes only; `report` mode ends at step 4)

A fix is applied only when ALL of these hold; otherwise the finding stays `open` with its remedy written in the ledger:

1. Code-only. No live RLS or policy change, no DNS, no env var, no vendor console, no dependency major bump.
2. Additive guard that rejects a request no legitimate caller makes: you have grepped every caller of the action or route (and every client component that posts to it) and each one still passes. A webhook, cron, or public-by-design caller that would start failing means the fix is wrong, not the caller.
3. The finding is critical or high (medium fixes are applied only when they are a one-line clamp such as `redirect: 'manual'` or a same-origin check).
4. `npx tsc --noEmit` clean after the edit, and the repo's lint command clean on the touched files.
5. One commit per finding, only the touched files (`git add <file>`), message naming the finding id. Never push: pushing is deploying and needs Dom's word. In a cloud session the repo's own CLAUDE.md governs the push.

Dependency remedies: a same-major bump of a critical direct dependency (for example `next` patch) is applied in default mode when `npx tsc --noEmit` passes afterwards, as its own commit, and the ledger row records that Vercel's build is the real verdict (local hub builds fail randomly on font fetches and are not a gate). Never bump across a major.

Live database fixes (RLS policies, function grants) are NEVER applied by this skill on its own. The ledger row carries the exact SQL. When Dom is in the session, ask once per change with `AskUserQuestion` naming the table and the policy; a yes applies it through the Supabase MCP `apply_migration` and marks the row `fixed`. When he is not (scheduled run, no answer), the row stays `open` and the report says so.

### 6. Report (chat)

A few sentences, plain words, no file paths unless he asks. Shape:

- Clean: `Clean. <app>: 0 new, <n> still open (in the ledger since <date>), 0 regressions.` One line per app in fleet mode.
- Findings: lead with regressions, then new findings, one line each in the attacker-story form ("Any signed-in Ghostplug user can add themselves to another customer's brand and take it over; fix is a policy change, needs your go"), then what was fixed and committed, then one line of what is still open and why (needs a live DB change, needs a version bump you should watch, etc).
- Never list what was checked, never list clean categories, never suggest hardening.

## Fleet mode

Laptop only. Launch one `general-purpose` agent per repo, in parallel, each told: the repo path, `report` mode, this skill's path, and to return ONLY the finding candidates that meet the bar in the story form plus the public-by-design entries it confirmed, no prose. Run step 2 (DB posture) in the main session for all five projects while the agents read code. Reconcile every ledger in the main session, then apply the fix tier repo by repo. Commit each repo's ledger change separately from any code fix.

## Scheduled routine

One weekly cloud routine per repo (Monday, before Dom's morning), prompt `/security-review report`. It reads code and the live posture, updates only `.claude/security.md`, commits that file alone when it changed, and pushes per the repo's CLAUDE.md (a ledger-only commit rebuilds identical code, so it is deploy-safe). A clean week therefore produces exactly one line in the run log and nothing else. Fixes never happen in the routine; they happen when Dom runs the skill in a session and can answer the live-change questions.

## Ledger template (`<repo>/.claude/security.md`)

```markdown
# Security ledger: <App>

Maintained by /security-review. One row per finding, stable id, status open | fixed <date> | accepted <date>. Runs append to the log. Hand edits: only `accepted` with a reason.

## Public by design
Routes and actions that take unauthenticated or lightly-gated traffic on purpose, with the mechanism that makes that safe. Never re-flagged unless the mechanism changes.
- app/api/pulse/route.ts: cookieless pageview insert, anon insert-only policy
- app/api/stripe/webhook/route.ts: Stripe signature (constructEvent)
- app/auth/callback/route.ts: code exchange, redirect clamped to origin

## Findings
| id | severity | status | where | story |
|---|---|---|---|---|

### <id>
Who: … What: … Gets: …
Fix: … (exact SQL or code change)
History: <date> found

## Runs
| date | mode | verdict | new | open | regressed | rls | sha |
|---|---|---|---|---|---|---|---|
```

## Anti-churn rules (why a quiet quarter is the design)

- The scanner is deterministic and the public-by-design list absorbs every cleared candidate, so an unchanged tree yields an identical candidate set and zero new judgment work.
- Findings are stories with a request in them. No story, no finding. This is what keeps "could be tighter" out of the ledger.
- Open findings are counted, never re-described. A finding is described once, in its own block, on the day it is found.
- Accepted findings are silent forever unless the code at that spot widens.
- Fixes are gated on verified callers and a clean type check, one commit each, never pushed by the skill, and never a live database change without Dom's named yes.
- A clean run writes one table row. That row is the proof that the quarter was quiet, and it is the only thing the routine is allowed to add.
