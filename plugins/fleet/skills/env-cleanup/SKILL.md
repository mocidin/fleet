---
name: env-cleanup
description: Audit and clean up environment variables across a Next.js + Vercel project. Finds vars declared locally or in Vercel that aren't used in code, flags vars used in code that are missing from Vercel (will break in production), syncs the NAME set between .env.local and Vercel so every environment has the same keys, and rewrites .env.local into its clean house format — bare KEY=value lines, zero comments, grouped by blank lines. Values are never logged or printed. Use when the user asks to "clean up env vars", "sync env vars with Vercel", "find unused env vars", "audit environment variables", or "clean up / tidy / remove the comments from .env.local".
allowed-tools:
  - Agent
  - Glob
  - Grep
  - Read
  - Edit
  - Write
  - Bash
  - TodoWrite
  - mcp__vercel__list_projects
  - mcp__vercel__get_project
  - mcp__vercel__list_teams
---

# Env Cleanup Skill

Reconcile three sources of truth for environment variables and make them agree:

1. **Code** — what `process.env.X` references actually exist in the repo.
2. **Local** — what's declared in `.env.local` (and peers: `.env`, `.env.production`, `.env.example`).
3. **Vercel** — what's set in the project on Vercel (across production, preview, development).

The goal: every var used in code is present in every environment, and every var declared in any environment is actually used in code. Nothing orphaned, nothing missing.

**This skill handles the NAME set, not values.** Values in local and Vercel can legitimately differ (dev DB vs prod DB). The skill never reads, logs, echoes, or copies values unless the user explicitly asks it to copy a specific var from local → Vercel.

## Non-negotiable rules

1. **Never print, log, or paste env var values anywhere.** Not in reports, not in terminal output, not in tool results. Names only. Keep values out of the command line (and thus shell history + tool logs) by reading them from **stdin** (`printf '%s' "$V" | vercel env add ...`) — NOT via `--value` on the command line. **Never create a var as `--sensitive`** (see rule 11); masking from the transcript is achieved by stdin piping, not by the sensitive flag.
2. **Never delete a var from Vercel without explicit per-var user confirmation.** A wrong deletion breaks production silently — the app builds and deploys fine, then fails at runtime. Batch-confirmation is not enough; each deletion needs its own "yes".
3. **Never delete these categories without explicit confirmation even if they appear unused.** Match the bare provider name AND any prefixed variant (e.g., `STRIPE` and `STRIPE_*`):
   - Stripe (`STRIPE`, `STRIPE_*`)
   - Supabase (`SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*`)
   - Webhook secrets (anything matching `*_SECRET`, `*_WEBHOOK_SECRET`, `*_SIGNING_SECRET`)
   - Integration providers (`TWILIO`, `TWILIO_*`, `ZERNIO`, `ZERNIO_*`, `ANTHROPIC`, `ANTHROPIC_*`, `OPENAI`, `OPENAI_*`, `GOOGLE`, `GOOGLE_*`, `NOTION`, `NOTION_*`, `TAVILY`, `TAVILY_*`)
   - Internal auth tokens — vars named after the app itself (e.g., `BRANDFLARE`, `STONEDGPT`, `HYPERTHEORY` — used in server-to-server fetches)
   - Anything prefixed `NEXT_PUBLIC_` (build-time injection, removing breaks deploys)
   These are often referenced by name in dashboards, webhooks, CLI invocations, or CI — "not in code" doesn't mean "not in use".
4. **Never modify `.env.local` values.** Only add missing vars (empty placeholder), remove unused ones, or restructure the file per rule 11. Every value carries over byte-for-byte; the file's shape changes, its values never do.
5. **Never assume the project is linked to Vercel.** Check `.vercel/project.json` exists; if not, run `vercel link` interactively first or tell the user to.
6. **Dynamic env access is unverifiable.** If code uses `process.env[someVar]` with a computed key, flag the file/line for manual review — do not assume any var is unused based on grep alone.
7. **Never commit changes.** Leave the working tree for the user to review and commit themselves.
8. **Never create backup files.** Do not copy `.env.local` to `/tmp/*.bak` or `.env.local.bak` before editing. Do not add any "backup" step to any phase. Just edit. The user finds backups of in-session edits excessive and non-minimal. If they want a backup, they'll ask.
9. **Production target ONLY — never Preview or Development.** Every var the skill adds goes to **Production only** (`vercel env add NAME production ...`). If an existing var is on Preview and/or Development, those records are offenders to remove — leave only Production. Local dev reads `.env.local`, so the Vercel Development target is redundant; Preview is unwanted. This is a standing cross-project preference (also in `~/.claude/CLAUDE.md`). NOTE: `vercel env rm NAME <env>` can remove ALL targets of a multi-target record. To surgically drop just the Preview/Development record while keeping Production, delete it **by id** via the API: `DELETE /v9/projects/<projectId>/env/<envId>?teamId=<orgId>` (get ids from `GET /v9/projects/<id>/env?teamId=…`).
10. **`.env.local` carries NO comments, ever — and the skill leaves it that way.** Standing user directive (2026-07-27, also in `~/.claude/CLAUDE.md`): the file is bare `KEY=value` lines only. No `#` header comments, no section banners, no per-var explanations, no commented-out placeholder vars. Structure comes from blank lines alone: shared/core vars first (Supabase, admin email, URL, cron secret, LLM keys), then one blank-line-separated block per app or service, related keys adjacent. If a var needs explaining, that explanation belongs in the repo's `CLAUDE.md` — never in the env file. This applies to `.env.example` too. Every run of this skill normalizes the file (Phase 4g), whether or not the user mentioned comments, and the skill never *emits* a comment (see Phase 4a — placeholders are bare `NAME=`, and the TODO goes in the report).
    - **Only whole-line comments are ever stripped** (`^\s*#`). NEVER strip anything after `=` on a value line: `#` is a legal character inside a secret, and cutting at it would silently corrupt a key. A line that looks like `FOO=bar # note` is reported for the user to resolve by hand, not auto-edited.
11. **Never sensitive — always `--no-sensitive`.** The user must never see a "Sensitive" tag. Always pass `--no-sensitive` so vars stay `encrypted` (dashboard-readable, revealable). A var that already exists as type `sensitive` is an offender: its value is unreadable (no reveal, `vercel env pull` returns empty), so to normalize it you must source the value from `.env.local` (or ask the user), then delete the sensitive record and re-add `--no-sensitive` to Production. If the value is unrecoverable and the var is unused in code, propose deletion (per-var confirmation per rule 2).

> **Shell gotcha:** the user's shell is **zsh**, which does NOT word-split unquoted `$VAR`. Pass multi-flag option lists as an array — `OPTS=(--scope … --yes --no-sensitive --force); vercel env add NAME production "${OPTS[@]}"` — never an unquoted `$OPTS` (it becomes one bogus argument and the CLI errors `unknown or unexpected option`).

## Naming conventions (enforce on audit + on creation)

The user's house style is **minimal naming**. Apply these rules to every var the skill creates, and flag every existing var that violates them in the Phase 3 report. **Do not auto-rename** — renames are multi-step refactors (code references + Vercel + .env.local + delete old name) that the user must explicitly approve. Skill flags + proposes; user decides.

### The base name = provider name only

When a var represents a single key from a provider, use the **provider name alone**:

- ✓ `GOOGLE`, `NOTION`, `ZERNIO`, `STRIPE`, `TAVILY`, `ANTHROPIC`
- ✗ `GOOGLE_API_KEY`, `NOTION_TOKEN`, `STRIPE_SECRET_KEY`, `TAVILY_API_KEY`

API keys / tokens / secrets are the default — adding `_API_KEY` / `_TOKEN` / `_SECRET_KEY` / `_KEY` suffixes is redundant noise and gets flagged.

### Suffixes — only when disambiguating

Suffixes are allowed (and necessary) only when one provider has multiple keys with distinct purposes:

- **Role qualifier** — same provider, different key types:
  - `ZERNIO` (API key) + `ZERNIO_SECRET` (webhook signing secret)
  - `STRIPE` (API key) + `STRIPE_WEBHOOK` (webhook signing secret)
  - `SUPABASE_SERVICE_ROLE` (admin) + `NEXT_PUBLIC_SUPABASE_ANON` (anon)
- **App/scope qualifier** — one provider account shared across several apps, split for billing/usage tracking. **Qualify by APP, never by channel** (a channel name like `REDDIT` or `LINKEDIN` stops being true the moment that app adds a second channel):
  - `ANTHROPIC_GHOSTPLUG`, `ANTHROPIC_BRANDFLARE` ✓
  - `ANTHROPIC_REDDIT`, `ANTHROPIC_LINKEDIN`, `ANTHROPIC_EMAIL` ✗ (channel, not app)
  - Add a second qualifier only when one app has several workloads that can independently blow up the bill: `ANTHROPIC_HYPERTHEORY_OUTREACH`, `ANTHROPIC_HYPERTHEORY_SUPPORT`, `ANTHROPIC_HYPERTHEORY_INTERNAL`

**When to qualify at all — one test: is the provider account shared across apps?**

- **Own account per app** (Stripe, Supabase, Zernio, Tavily) → bare name. The console is already app-scoped, so there is nothing to disambiguate: `STRIPE`, `SUPABASE_SECRET`.
- **One account across the fleet** (Anthropic, Resend, Apify, SmartLead, Porkbun) → add the app: `ANTHROPIC_GHOSTPLUG`, `RESEND_BRANDFLARE`.
- **In the hub**, any sibling app's credential always carries the app name: `GHOSTPLUG_STRIPE`, `STONEDGPT_SUPABASE_SERVICE_ROLE`.

### LLM provider keys — split by what can independently blow up the bill

Provider usage APIs can only group spend by **api key** and **model**. Nothing else. So two workflows that share a key *and* a model are permanently indistinguishable in the bill — you cannot answer "what caused the spike" after the fact, and no amount of later analysis recovers it.

Audit every app's LLM call sites and give a separate key to each workload that can independently run away. The test is not "how much does it cost today" — it is **"if this tripled next month, would I want to know it was this one?"**

- **Already separated for free** — workflows on different models (a Haiku classifier next to an Opus drafter) need no extra key; the model dimension does it. But check whether that separation is *load-bearing or accidental*: if it only holds because one call site hardcodes a model, it breaks at the next model bump and should get a key anyway.
- **Needs its own key** — same model, different trigger. Cron-driven versus user-driven, per-reply versus per-list, product versus internal tooling.
- **Volume-driven work always gets its own key** — anything that scales with input size (list enrichment, bulk research, per-row extraction) rather than with user actions. That is the one that surprises you.
- **Never split by channel** (`_REDDIT`, `_LINKEDIN`, `_EMAIL` as a *product* label) — split by the workload that owns the spend.
- Where one client module is a chokepoint for several workloads, pass a `scope` and select the key inside it rather than building one client per module. Fall back to a primary key so a scope whose key hasn't been created yet keeps working instead of 401ing.

Worked example (Hypertheory hub — nine modules, one shared `completeText`):

```
ANTHROPIC_HYPERTHEORY_EMAIL      classify, draft, scheduled follow-ups
ANTHROPIC_HYPERTHEORY_LEADS      list enrichment (scales with list size)
ANTHROPIC_HYPERTHEORY_SUPPORT    support drafts + subject generation
ANTHROPIC_HYPERTHEORY_STAFF      staff messages + thread openers
```

Cross-cutting helpers (a "learn from the edit" step invoked by several drafters) bill to the **calling** scope, derived from an argument the caller already passes — not to a bucket of their own, or the cost of improving one drafter shows up nowhere near it.

### The console name IS the env var name

Standing directive (2026-07-30). Wherever a provider's web console lets you name a key, the name must be **byte-identical to the env var that holds it** — `ANTHROPIC_GHOSTPLUG_POSTS` in the Anthropic console, `ANTHROPIC_GHOSTPLUG_POSTS` in `.env.local` and Vercel. Reading any console then tells you the exact variable, in the exact repo, with no translation step.

This is why shared-account providers need the app qualifier: one console namespace cannot hold four keys all named `ANTHROPIC`. Where a console does not support naming (Supabase anon/service keys, the default Stripe secret key), the rule does not apply — those accounts are per-app anyway.

Audit consoles as part of every run for any provider whose keys are nameable, and flag mismatches alongside the env-var naming violations.

Do not invent suffixes for a single-key provider. `GOOGLE` stays `GOOGLE`, not `GOOGLE_GEMINI` or `GOOGLE_AI`.

### `NEXT_PUBLIC_` prefix — only when client-read

A var gets `NEXT_PUBLIC_` only if it is **explicitly read in browser code** (client components, client-side libraries). Server-only vars must NOT have the prefix.

- ✓ `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON` (Supabase browser client)
- ✓ `NEXT_PUBLIC_STRIPE_*` price IDs (read by client-side upgrade modals)
- ✗ `NEXT_PUBLIC_DATABASE_URL` if the DB is only touched from server actions
- ✗ `NEXT_PUBLIC_ANTHROPIC_LINKEDIN` (LLM keys are server-only — bug if exposed)

When the skill detects a `NEXT_PUBLIC_` var that is never read from client code, flag it as a likely security issue (key exposed to the browser unnecessarily).

### Internal app tokens — name them after the app

Server-to-server auth tokens used internally between routes get the app name itself:

- `BRANDFLARE` (Brandflare's internal token)
- `STONEDGPT`, `HYPERTHEORY` (in their respective projects)

### Generic shared vars

- `URL` — canonical app URL used in webhook configs and similar
- `NODE_ENV` — Node automatic, never set manually

### Naming-violations report

In Phase 3, add this category:

```
### ⚠ Naming violations (rename recommended — not auto-applied)

- `GOOGLE_API_KEY` → `GOOGLE` (drop redundant `_API_KEY`)
- `STRIPE_SECRET_KEY` → `STRIPE` (drop redundant `_SECRET_KEY`)
- `MY_BRANDFLARE_TOKEN` → `BRANDFLARE` (use bare app name)
- `NEXT_PUBLIC_DB_URL` (only used in server code) → `DB_URL` (drop NEXT_PUBLIC_)
```

For each, give: current name → proposed name + one-line reason. Do not execute the rename without user approval; renaming requires updating every code reference, adding the new name to Vercel, removing the old name from Vercel and .env.local — that's a separate operation.

## Local vs Vercel value alignment

The user's expectation: **same name set, mostly same values**, across `.env.local`, Vercel-Production, Vercel-Preview, and Vercel-Development. The skill's job is to keep the NAME set in sync — it never compares values directly (security — values are never read into context).

The narrow exceptions, where local and prod legitimately differ in value:

| Var pattern | Local value | Production value |
|---|---|---|
| `URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, any `*_URL` | `http://localhost:3000` | `https://<brand-domain>` |
| Webhook callback / OAuth redirect URLs | localhost or ngrok tunnel | production domain |
| Provider keys with separate dev/prod accounts | dev/test key (e.g., Stripe `sk_test_...`) | live key (e.g., `sk_live_...`) — only if user explicitly maintains separate accounts |

Outside those exceptions, assume the same value belongs in every environment. When the skill ADDS a var to either side, it must ask the user **once** whether the var is "URL-style" (different per env) or "shared" (identical everywhere) before proceeding — defaulting to shared.

When the skill detects that a var exists in both `.env.local` and Vercel under the same name (most cases), it does NOT need to verify the values match — that's the user's responsibility. The skill's contract is the name set, not the value set.

## Vercel CLI setup & troubleshooting (CRITICAL — read before Phase 0)

The Vercel MCP at `mcp.vercel.com` does **not** expose env-var CRUD tools. Only `list_teams`, `list_projects`, `get_project`, deployment tools, and toolbar tools are available. **All env-var operations must go through the Vercel CLI.** This is a hard upstream limitation; do not waste time trying alternate MCP queries.

### Required CLI version: pin to v51

```bash
npm i -g vercel@51
```

**Do NOT install v52+.** v52 changed auth storage in ways that break in some sandboxed environments (Cursor, certain VSCode setups, restricted shells): the OAuth flow completes successfully and the CLI prints "Congratulations! You are now signed in", but the token is never persisted to either `auth.json` (stays at `{}`, 3 bytes) or the macOS Keychain (no entry created). Subsequent commands re-prompt for OAuth indefinitely. v51.8.0 uses plaintext `auth.json` reliably.

If the user already has v52 installed, downgrade them: `npm i -g vercel@51`. Verify with `vercel --version` (must report `51.x.x`).

### Auth file location (macOS)

```
~/Library/Application Support/com.vercel.cli/
├── auth.json          # token lives here, mode 600
├── config.json        # currentTeam + telemetry settings
└── telemetry-*.json
```

A successful login produces `auth.json` of ~300-500 bytes. If it's stuck at 3 bytes (`{}`), auth did not persist — see troubleshooting below.

### Security posture

- `auth.json` is created with mode `0600` (owner read/write only). No other user on the system can read the token.
- The file lives outside any git repo and is never accidentally committed.
- The only access boundary is OS user permissions — appropriate for personal-machine use. For shared/CI contexts, prefer `VERCEL_TOKEN` env var with a project-scoped token.
- Token is bearer-style: anyone holding the token can impersonate the account. Treat the file as a credential.

### Persistence troubleshooting (if auth keeps re-prompting)

The most common cause is a **zombie `vercel` process from a prior interrupted session** — it holds the OAuth device-code polling open, races every new login, and overwrites `auth.json` with `{}` immediately after any write.

Diagnostic procedure (run in this exact order):

1. **Check for zombies:**
   ```bash
   ps aux | grep '/opt/homebrew/bin/vercel' | grep -v grep
   ```
   Any running `vercel` process (especially `vercel whoami` or `vercel login`) older than your current session is a zombie. Kill it: `pkill -9 -f '/opt/homebrew/bin/vercel'`.

2. **Test write persistence on auth.json:**
   ```bash
   F="$HOME/Library/Application Support/com.vercel.cli/auth.json"
   echo '{"marker":"AAA"}' > "$F"
   sleep 1
   cat "$F"
   ```
   Should print `{"marker":"AAA"}`. If it prints `{}`, something is reverting writes — re-check for zombies, then check `lsof "$F"` for processes holding the file.

3. **Verify keychain isn't the issue (v52 only):**
   ```bash
   security find-generic-password -s 'vercel-cli' 2>&1
   security find-generic-password -s 'com.vercel.cli' 2>&1
   ```
   On v52 with broken keychain integration, both commands return "could not be found" while `auth.json` stays empty. The fix is downgrade to v51.

4. **Re-run login:**
   ```bash
   rm -f "$HOME/Library/Application Support/com.vercel.cli/auth.json"*
   vercel whoami    # triggers fresh OAuth
   ```
   After OAuth completes, verify `auth.json` is non-empty:
   ```bash
   stat -f%z "$HOME/Library/Application Support/com.vercel.cli/auth.json"
   ```
   Should be ≥ ~100 bytes. If still 3 bytes, there's another zombie — repeat from step 1.

### Project linking without `vercel link`

`vercel link` is interactive. Bypass it by writing `.vercel/project.json` directly using MCP-fetched IDs:

```bash
# 1. Get team ID (orgId) and project ID via MCP — no auth needed for these
#    mcp__vercel__list_teams              → orgId (e.g., team_xxx)
#    mcp__vercel__list_projects(teamId)   → projectId (e.g., prj_xxx)
mkdir -p .vercel
cat > .vercel/project.json <<EOF
{"projectId":"prj_xxxxx","orgId":"team_xxxxx","projectName":"<name>"}
EOF
```

Verify `.vercel/` is in `.gitignore` (Next.js scaffolds usually include this; double-check).

---

## Phase 0 — Preflight

Run these in parallel:

- `git status` — warn if working tree is dirty (env file changes will mix with existing work).
- `which vercel && vercel --version` — confirm v51.x is installed. If missing or wrong version, run `npm i -g vercel@51` and re-check.
- **Kill any zombie Vercel processes** — `pkill -9 -f '/opt/homebrew/bin/vercel'` then verify with `ps aux | grep vercel | grep -v grep` returning empty. Mandatory before any auth-touching command.
- Check for `.vercel/project.json` — if absent, write it manually using MCP `list_teams` + `list_projects` (see "Project linking without `vercel link`" above).
- Verify auth: `vercel whoami` should return a username instantly without re-prompting. If it triggers OAuth, run the troubleshooting procedure above.
- After any login, sanity-check `auth.json` size: `stat -f%z "$HOME/Library/Application Support/com.vercel.cli/auth.json"` ≥ 100 bytes. If 3 bytes (`{}`), auth didn't persist — troubleshoot.
- Read `package.json` for project name.
- Glob for `.env*` files at repo root to know what's declared locally.

### 0a. Confirm project scope (CRITICAL)

Vercel accounts often have many projects (Brandflare, StonedGPT, Hypertheory, etc.). The skill must touch **only** the project linked to this directory. Before running any query:

1. Read `.vercel/project.json` to get `projectId` and `orgId`.
2. Call `mcp__vercel__get_project` with that `projectId` to fetch the project's human-readable name.
3. Print to the user:

   ```
   This skill will operate on Vercel project: "<name>" (id: <projectId>)
   Local dir: <cwd>
   Proceed? [y/N]
   ```

4. **Do not continue until the user confirms.** This is a one-time check per run — once confirmed, every subsequent `vercel env ...` command in this skill automatically scopes to the linked project via `.vercel/project.json`; there is no cross-project risk.

## Phase 1 — Inventory (three sources, read-only)

Create a TodoWrite list with the three sub-phases so progress is visible.

### 1a. Code — what's actually used

Grep every `process.env.X` reference across the repo. Include:

- `app/**`, `lib/**`, `components/**`, `pages/**` (if present)
- `next.config.{js,mjs,ts}`
- `middleware.ts`, `proxy.ts`, or any root-level `.ts` files
- `mdx-components.tsx` (Next.js MDX entrypoint)
- `scripts/**` (build/deploy scripts often read env)
- `.github/workflows/**` and `vercel.json` (CI/CD references)
- `package.json` `scripts` section (env vars embedded in npm scripts as `$VAR` or `process.env.X`)
- `.mcp.json` (Claude Code MCP config — usually contains hardcoded secrets, not env refs, but confirm it's gitignored)
- `supabase/` directory — but distinguish app code (edge functions using `Deno.env.get(...)`) from Supabase platform config (`supabase/config.toml` references like `OPENAI_API_KEY`, `SENDGRID_API_KEY` are template placeholders for Supabase auth providers, NOT app env vars — exclude from the diff)

```bash
# Static references: process.env.VAR_NAME and process.env["VAR_NAME"]
{ grep -rhoE 'process\.env\.[A-Z_][A-Z0-9_]*' app lib components mdx-components.tsx proxy.ts middleware.ts next.config.* vercel.json 2>/dev/null; \
  grep -rhoE 'process\.env\[["'"'"'][A-Z_][A-Z0-9_]*["'"'"']\]' app lib components 2>/dev/null; } | \
  sed -E 's/process\.env\.//; s/process\.env\[["'"'"']([A-Z_][A-Z0-9_]*)["'"'"']\]/\1/' | sort -u

# Dynamic references: process.env[<expression>] — flag, can't enumerate
grep -rnE 'process\.env\[[^"'"'"']' app lib components 2>/dev/null

# Template-string construction: `process.env[`PREFIX_${x}`]` or `${process.env...
grep -rnE "\`NEXT_PUBLIC_|process\.env\[\`" app lib components 2>/dev/null

# Edge functions (Deno runtime, not Node)
grep -rnE 'Deno\.env\.get\(' supabase 2>/dev/null
```

Also check for Next.js `env` config in `next.config.*` — these expose vars to the client at build time and are first-class usages.

**Quadruple-check before declaring "unused":** for each candidate, ALSO grep for case variants (camelCase, lowercase) and substring matches in case the var name appears as part of a larger identifier or reference. False positives here are far cheaper than false negatives.

### 1b. Local — what's declared in `.env*` files

Parse each `.env*` file for variable names only. **Never read values into memory beyond what's needed to detect the name, and never include values in any output.**

```bash
for f in .env .env.local .env.production .env.development .env.example; do
  [ -f "$f" ] && awk -F= '/^[A-Z_][A-Z0-9_]*=/ {print $1}' "$f" | sort -u > "/tmp/env-local-$f.txt"
done
```

Keep per-file lists separate — `.env.local` is the authoritative dev set; `.env.example` often lags behind.

**Also count the formatting offenders (rule 10)** — names and counts only, never values:

```bash
# whole-line comments (strippable) and commented-out vars (deleted, name goes in the report)
grep -c '^[[:space:]]*#' .env.local
grep -oE '^[[:space:]]*#[[:space:]]*[A-Z_][A-Z0-9_]*(?==)' .env.local   # commented-out var NAMES only
# inline-comment suspects — REPORTED, never auto-edited (a `#` may be part of the secret)
awk -F= '/^[A-Z_][A-Z0-9_]*=/ && $0 ~ /[[:space:]]#/ {print $1}' .env.local
```

A commented-out var (`# NOTION_NOTES_DB=`) is a declaration the user deliberately parked. Treat its name as a "missing locally" candidate for the Phase 3 report, then drop the line — never carry the comment forward.

### 1c. Vercel — what's set on the deployed project

Use the Vercel CLI. The `vercel env ls` command prints names + redacted values; parse names only.

```bash
# Names in each environment (production, preview, development)
vercel env ls production 2>/dev/null | awk 'NR>2 && $1 ~ /^[A-Z_]/ {print $1}' | sort -u > /tmp/env-vercel-prod.txt
vercel env ls preview    2>/dev/null | awk 'NR>2 && $1 ~ /^[A-Z_]/ {print $1}' | sort -u > /tmp/env-vercel-preview.txt
vercel env ls development 2>/dev/null | awk 'NR>2 && $1 ~ /^[A-Z_]/ {print $1}' | sort -u > /tmp/env-vercel-dev.txt
```

If `vercel env ls` errors with auth issues, tell the user to run `vercel login` and stop.

**Capture `type` and per-record `target` (CRITICAL for rules 9 + 11).** `vercel env ls` shows every var as "Encrypted" and cannot distinguish `sensitive` from `encrypted`, nor show exact targets cleanly. Use the API directly (token from the CLI auth file) to get authoritative `type` + `target` + record `id` for every var:

```bash
AUTH="$HOME/Library/Application Support/com.vercel.cli/auth.json"
TOKEN=$(python3 -c "import json;print(json.load(open('$AUTH'))['token'])")
PID=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['projectId'])")
TEAM=$(python3 -c "import json;print(json.load(open('.vercel/project.json'))['orgId'])")
# names + type + targets ONLY (no values, no decrypt) — read-only inventory
curl -s "https://api.vercel.com/v9/projects/$PID/env?teamId=$TEAM" -H "Authorization: Bearer $TOKEN" \
 | python3 -c "import sys,json;[print(e['id'],e['key'],e.get('type'),e.get('target')) for e in json.load(sys.stdin)['envs']]"
```

Any var with `type == sensitive`, or any record whose `target` is not exactly `['production']`, is an **offender** for Phase 2's normalization bucket. (Only add `&decrypt=true` later in Phase 4 when you actually need an `encrypted` var's value to recreate it — and `rm` that response immediately; it contains plaintext secrets.)

## Phase 2 — Diff

Produce one unified table: for each var name seen anywhere, a row with checkmarks indicating presence in code, `.env.local`, Vercel prod, Vercel preview, Vercel dev. Categorize into buckets:

- **In sync** — in code AND local AND all relevant Vercel environments. Nothing to do.
- **Unused (dead in local only)** — in `.env.local` but not in code and not in Vercel. Safe to remove from local.
- **Unused (dead in Vercel only)** — in Vercel but not in code and not in local. Candidate for Vercel removal (needs confirmation).
- **Unused (dead in both)** — in local and Vercel but not in code. Candidate for removal from both.
- **Missing locally** — in code and in Vercel but not in `.env.local`. Dev environment will fall back to whatever default exists (often broken). Add an empty placeholder to `.env.local`.
- **Missing in Vercel (CRITICAL)** — in code and in local but not in Vercel production. **This will fail at runtime in prod.** Flag red.
- **Needs normalization (sensitive and/or non-production)** — type is `sensitive`, OR present on Preview/Development. Must be fixed per rules 9 + 11: drop the Preview/Development records, and (for sensitive) recreate non-sensitive on Production. Recoverable if the value is `encrypted` (readable via `decrypt=true`) or present in `.env.local`; otherwise needs the user's value or deletion.
- **Dynamic (unverifiable)** — referenced via `process.env[computed]`. Report location, skip auto-cleanup.

Note: there is NO "partial Vercel coverage" goal anymore — Production-only is the target (rule 9). A var on Production but not Preview/Development is correct, not "partial".

## Phase 3 — Report

Output format:

```
## Env Var Report

### ✓ In sync (N vars)
[Collapsed list of var names]

### ⚠ Missing in Vercel production (CRITICAL — will break prod)
- VAR_NAME — used in app/api/foo/route.ts:12

### ⚠ Missing in .env.local (dev will fall back)
- VAR_NAME — used in app/api/foo/route.ts:12, set in Vercel prod

### 🗑 Unused — safe to remove from .env.local
- VAR_NAME — not referenced in code

### 🗑 Unused — candidate for removal from Vercel (needs per-var confirmation)
- VAR_NAME (in: production, preview) — not referenced in code
  ⚠ PROTECTED category: STRIPE_* / SUPABASE_* / *_SECRET / NEXT_PUBLIC_* / etc. — confirm carefully

### 🧹 `.env.local` formatting (rule 10 — applied automatically, no confirmation needed)

```
- N comment lines to strip
- N commented-out vars to drop: NAME, NAME  (listed above as missing-locally candidates if still used in code)
- N inline-comment suspects — NOT auto-edited, resolve by hand: NAME
- Regrouping: N blocks (core, then one per app/service)
```

If the file is already clean, say so in one line and move on.

### 🏷 Needs normalization (sensitive and/or non-production — rules 9 + 11)
- VAR_NAME — type=sensitive, targets=[production, preview]
  → value source: .env.local (recoverable) | encrypted-decrypt (recoverable) | UNRECOVERABLE (needs your value or deletion)
- VAR_NAME — targets=[production, preview] → just drop the preview/development record(s) by id

### ❓ Dynamic — manual review
- lib/config.ts:42 — process.env[key]

### Skipped (protected categories)
- STRIPE_WEBHOOK_SECRET — verified not in code but protected; left untouched
```

**Stop here.** Ask the user which buckets to proceed with, and for Vercel deletions, confirm each var individually.

## Phase 4 — Apply changes

In this order (safest first):

### 4a. Add missing vars to `.env.local`

For each "missing locally" var, append a **bare** placeholder line to `.env.local`:

```
VAR_NAME=
```

No trailing `# TODO` — the file takes no comments (rule 10). The TODO belongs in the Phase 6 summary's "Still needs attention" list, which is where the user actually reads it. Use Edit to append into the right block — do not overwrite or reorder existing lines here; 4g does the restructuring.

### 4b. Remove unused vars from `.env.local`

For each confirmed "unused in local" var, Edit `.env.local` to remove the line.

### 4c. Remove unused vars from Vercel

For each user-confirmed removal, delete every record of that var by id via the API (works regardless of how many targets it spans):

```bash
for id in $(curl -s "https://api.vercel.com/v9/projects/$PID/env?teamId=$TEAM" -H "Authorization: Bearer $TOKEN" \
   | python3 -c "import sys,json;print(' '.join(e['id'] for e in json.load(sys.stdin)['envs'] if e['key']=='VAR_NAME'))"); do
  curl -s -X DELETE "https://api.vercel.com/v9/projects/$PID/env/$id?teamId=$TEAM" -H "Authorization: Bearer $TOKEN"
done
```

Report failures without retrying destructively.

### 4d. Add missing vars to Vercel — **Production only, `--no-sensitive`**

For "missing in Vercel" vars, the skill cannot invent values. If the var exists in `.env.local`, offer (per-var confirmation) to push the local value to **Production only**, via stdin so the value never hits the command line or logs:

```bash
V=$(grep "^VAR_NAME=" .env.local | cut -d= -f2-)
printf '%s' "$V" | vercel env add VAR_NAME production --no-sensitive --yes
```

Never add to `preview` or `development` (rule 9). If the value isn't in `.env.local`, print a TODO for the user — do not invent values.

### 4e. Normalize sensitive / non-production vars (rules 9 + 11)

For each var in the "needs normalization" bucket:

- **Just drop extra targets** (var is already `encrypted`, only problem is a Preview/Development record): delete those records by id (4c technique) — leave the Production record intact. No value needed.
- **Recreate a `sensitive` var as non-sensitive**: get its value (from `.env.local`; or for an `encrypted` var via a one-off `decrypt=true` fetch — then `rm` that dump immediately), delete ALL its records by id, then re-add to Production with `--no-sensitive` (stdin pipe as in 4d).
- **Unrecoverable + unused** (`sensitive`, not in `.env.local`, not referenced in code): propose deletion (per-var confirmation). Do not guess a value.

### 4f. Update `.env.example`

If `.env.example` exists, rewrite it to match the current active set of names (with empty or example values, never real secrets). Same format rules as `.env.local` — bare `NAME=` lines, no comments, same block order. This keeps new-dev onboarding accurate.

### 4g. Normalize `.env.local` formatting (rule 10) — always, runs last

Runs on **every** invocation of this skill, even when the user only asked about Vercel sync and even when nothing else changed. It is not gated on confirmation: stripping comments and regrouping is a formatting change, and rule 10 is a standing directive. It runs **after** 4a and 4b so it formats the final name set in one pass.

**Read the entire file first.** `.env.local` is gitignored, so there is no `git checkout` undo and no backup (rule 8) — the Read in your context *is* the recovery path. Never Write this file without having Read it in the same session.

**Bail out instead of guessing.** Scan for lines that are neither blank, nor a whole-line comment, nor `^[A-Z_][A-Z0-9_]*=`. A multi-line or quoted-continuation value means line-wise rewriting would corrupt it: skip 4g entirely, report the line numbers, and let the user decide.

Then Write the file back as:

1. Every `KEY=value` line preserved **byte-for-byte to the right of the first `=`**. Values are never re-quoted, trimmed, escaped, or normalized.
2. All whole-line comments removed. Commented-out vars removed (their names were surfaced in the Phase 3 report).
3. Blocks separated by exactly one blank line, no leading or trailing blank lines, single trailing newline. Order: core/shared first (`NEXT_PUBLIC_*`, service-role, admin email, `URL`, `CRON_SECRET`, LLM keys), then one block per app or service with related keys adjacent (`SPOTIFY_ID` next to `SPOTIFY`, `NOTION_X` next to `NOTION_X_DB`).
4. Duplicate keys collapsed to the last occurrence (that is what dotenv resolves to) — report any collapse by name.

**Verify the values survived** — fingerprint the name=value set before and after. The hash reveals nothing, so it is safe to print:

```bash
grep -E '^[A-Z_][A-Z0-9_]*=' .env.local | sort | shasum -a 256   # run BEFORE the Write, and again AFTER
```

The two hashes must match (they will differ legitimately only if 4a/4b added or removed a var in the same run, or a duplicate was collapsed — in that case diff the *name* lists instead and confirm each delta was intentional). A mismatch you cannot account for means the rewrite corrupted a value: restore the file from the content you Read, immediately, before doing anything else.

## Phase 5 — Verification

1. Re-run the three inventories (code, local, Vercel) and confirm the diff is now empty (or only contains items the user explicitly skipped).
1b. Re-run the type/target API check from Phase 1c and confirm **zero offenders**: every var is `type=encrypted` (never `sensitive`) and `target=['production']` only. Print the count of offenders remaining (target: 0).
2. Run `npx tsc --noEmit` and `npx next build` — catches any env vars consumed at build time that went missing.
3. `git status` and `git diff .env*` — summarize what changed locally (names only; **never echo values**).
4. Confirm `.env.local` is clean (rule 10): `grep -c '^[[:space:]]*#' .env.local` must print `0`, and no two consecutive blank lines remain. Report the count — target 0.

## Phase 6 — Summary

```
## Env Cleanup Summary

Removed from .env.local: N vars
Added to .env.local (placeholders): N vars
Cleaned .env.local: N comment lines stripped, N commented-out vars dropped, regrouped into N blocks (values verified unchanged)
Removed from Vercel: N vars across E environment-slots
Added to Vercel: N vars across E environment-slots

Still needs attention:
- [list of TODOs the user needs to handle manually, e.g. values for missing prod vars]

Protected / skipped:
- [list of categories that were left untouched]

Verification: tsc ✓  build ✓

Next steps:
- Review: git diff .env*
- Set any TODO values in .env.local
- Trigger a redeploy if Vercel env changed: vercel --prod
```

Do not auto-commit or auto-deploy. Both are the user's call.
