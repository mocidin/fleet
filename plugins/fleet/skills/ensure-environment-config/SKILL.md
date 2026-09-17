---
name: ensure-environment-config
description: Verify and auto-fix every per-repo identity layer (git, gh CLI, GitHub MCP, Vercel MCP, Vercel CLI, Supabase MCP) so the right account is used everywhere for the current repo. Detects personal vs Hypertheory work based on the repo's owner, then verifies the directory-conditional git identity layer (includeIf + pinned credential helpers — push auth never depends on gh's active account), stale remote URLs (renamed-account redirects), per-repo .mcp.json github tokens, and flags Vercel MCP, Vercel CLI, and Supabase MCP misalignments. Use when the user says "fix git config", "ensure environment is correct", "wrong account pushing", "Vercel blocked deploy", "wrong Vercel account", "switch accounts", "MCP wrong account", or before any push or deploy the user is unsure about.
allowed-tools:
  - Bash
  - Edit
  - Read
---

# Ensure Environment Configuration

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


Verify the current repo's full identity stack — git, gh, GitHub MCP, Vercel MCP, Vercel CLI, Supabase MCP — matches the user's canonical account map, fix what's wrong, and confirm push will succeed. Never actually push.

## Canonical account map

The user has **exactly TWO real identities**, each spanning GitHub + Vercel + Supabase:

| Identity | gh login | Commit email | Vercel account | Supabase | Owns |
|---|---|---|---|---|---|
| **personal** | `dominicpusateri` | `dominic.pusateri@gmail.com` | Vercel account `dominic.pusateri@gmail.com` — sees the `Personal` scope (slug `dpusateri`, team id `team_Rh4A5fBJKHVwvnyEisKiKuEA`) and **nothing else**. Vercel CLI username: `dpusateri0` (see collision note) | per-repo Supabase project where one exists (e.g. `supabase-personal` in the `personal` repo); a personal repo with no Supabase of its own may share the Hypertheory backend via a `supabase-hypertheory` entry | `dominicpusateri`, `personal`, `brokenbacksturgeonfishing`, `centralcoastfishingcharters` |
| **work** | `mocidin` | `dom@hypertheory.ai` | Vercel account `dom@hypertheory.ai` — sees the `hypertheory` team and **nothing else** | per-repo Supabase project (e.g. `supabase-hypertheory`, `supabase-brandflare`, `supabase-stonedgpt`) referenced in each repo's `.mcp.json` | All Hypertheory ecosystem: `hypertheory`, `stonedgpt`, `brandflare`, `betdetective`, `ghostplug`, `recruiterbase` |

Each Vercel identity has **two independent auth paths** that must both match: the **MCP** (OAuth session to `https://mcp.vercel.com`) and the **CLI** (token at `~/Library/Application Support/com.vercel.cli/auth.json`). They are authenticated separately — MCP can be right while the CLI is wrong, or vice versa. The CLI is what `vercel deploy` / `vercel env` use, so a wrong-account CLI silently acts on the wrong Vercel account even when MCP looks correct.

**The two Vercel accounts are fully separate.** There is no cross-membership; one OAuth/CLI session reaches exactly one account's scopes. Switching between them is manual for both paths — MCP via Claude Code's `/mcp` re-OAuth, CLI via `vercel login` — neither has a static token that can be rewritten the way `.mcp.json` does for GitHub.

## Directory-conditional git identity (the standing architecture)

**Since 2026-06-12, git identity is resolved by directory, not by gh's "active account".** gh's credential helper only serves the *active* account's token (verified: it returns nothing for a non-active username), so the old switch-based approach was global mutable state — racy across concurrent sessions. The standing fix pins identity per directory tree:

- `~/.gitconfig` ends with two `includeIf` blocks: `gitdir:~/code/personal/` → `~/.gitconfig-identity-personal`, `gitdir:~/code/hypertheory/` → `~/.gitconfig-identity-work`. They must stay **last** in the file so they override the defaults above them.
- Each identity file sets `user.name = Dominic Pusateri`, the identity's `user.email`, and a `credential "https://github.com"` helper pinned to that identity's keyring token via `gh auth token --user <login>` (preceded by a blank `helper =` line that clears inherited helpers).
- Global fallback (repos outside both trees): `user.name = Dominic Pusateri`, `user.email = dominic.pusateri@gmail.com`, gh's standard active-account helper.

Consequences: **pushes never require `gh auth switch`**; per-repo `user.email` local overrides are redundant (remove stale ones on sight); new clones under either tree inherit the correct identity with zero setup. Canonical identity-file template (substitute login + email for the tree):

```gitconfig
[user]
	name = Dominic Pusateri
	email = <identity-email>
[credential "https://github.com"]
	helper =
	helper = "!f() { test \"$1\" = get || exit 0; echo username=<gh-login>; echo \"password=$(/opt/homebrew/bin/gh auth token --user <gh-login>)\"; }; f"
```

If an identity file or the `includeIf` wiring is missing (e.g. fresh machine, overwritten gitconfig), **restore it from this template** — that is an auto-fix, not a user decision.

### Phantom usernames (renamed → still redirect)

These show up in some local clones because they were the original owners before GitHub renames. Redirects keep pushes working but the canonical owner has moved on — rewrite the remote when found.

| Phantom in remote URL | Real current owner |
|---|---|
| `dpusateri0` | `dominicpusateri` |
| `dpusateri10` | `mocidin` |
| `datronatro` | `mocidin` |

The user has explicitly stated `dpusateri10` and `dpusateri0` are former **GitHub** usernames — do not propose either as an active GitHub account.

**Critical collision — `dpusateri0` on Vercel is NOT a phantom.** The personal Vercel **CLI** username is genuinely `dpusateri0` (a different namespace from GitHub). So `vercel whoami` printing `dpusateri0` is *correct* for the personal account — it is not a misconfiguration, even though the same string is a dead GitHub username. **Never** judge the Vercel CLI by its username string; always verify the Vercel CLI by **email** (`dominic.pusateri@gmail.com`), per Phase 3f.

## Decision rule

1. Run `git remote get-url origin` to get the URL.
2. Parse the owner segment.
3. Map to identity:
   - Owner `dominicpusateri` → **personal**
   - Owner `dpusateri0` → **personal** (rewrite remote: phantom redirect to `dominicpusateri`)
   - Owner `mocidin` → **work**
   - Owner `dpusateri10` or `datronatro` → **work** (rewrite remote: phantom redirect to `mocidin`)
   - Any other owner → STOP, surface to the user, do not guess

The directory path is a secondary signal — `~/code/personal/*` strongly suggests personal, `~/code/hypertheory/*` strongly suggests work — but the remote URL is authoritative. If the directory and remote disagree, trust the remote and flag the mismatch.

## Procedure

### Phase 1 — Inventory

Run in parallel:

```bash
git rev-parse --show-toplevel              # confirm we're in a repo
git remote -v                              # current remote(s)
git config user.email                      # RESOLVED email (includeIf applied) — this is what commits use
git config --local --get user.email        # stale local override (should be ABSENT — includeIf is the source)
git config --show-origin --get-all 'credential.https://github.com.helper'  # pinned helper must come from the identity file
ls ~/.gitconfig-identity-personal ~/.gitconfig-identity-work 2>&1           # identity files present?
git config --global --get-regexp includeif 2>&1                             # includeIf wiring present?
gh auth status 2>&1                        # both accounts still authed in keyring
test -f .mcp.json && cat .mcp.json         # per-repo MCP config (github token lives here)
vercel whoami 2>&1                         # Vercel CLI username — verify by EMAIL (Phase 3f), NOT this string
cat .vercel/project.json 2>/dev/null       # linked Vercel project + orgId (which team it deploys to)
```

If not in a git repo, stop with a clear message.

If `origin` doesn't exist, stop and ask the user what the remote should be.

### Phase 2 — Determine expected identity

Apply the decision rule against the remote URL's owner. The output of this phase is exactly one of:

- **personal** → expect resolved `user.email` = `dominic.pusateri@gmail.com` (via `~/.gitconfig-identity-personal`), credential helper pinned to `dominicpusateri`, remote owner = `dominicpusateri`, repo located under `~/code/personal/`, Vercel MCP scope = `dpusateri`, Vercel CLI email = `dominic.pusateri@gmail.com`
- **work** → expect resolved `user.email` = `dom@hypertheory.ai` (via `~/.gitconfig-identity-work`), credential helper pinned to `mocidin`, remote owner = `mocidin`, repo located under `~/code/hypertheory/`, Vercel MCP scope = `hypertheory`, Vercel CLI email = `dom@hypertheory.ai`

gh's **active** account is NOT part of the expectation — push auth is pinned per directory and never reads it.

### Phase 3 — Diff + fix

Walk through each component. For each, only act if the current value is wrong; otherwise leave it.

#### 3a. Remote URL owner

If the remote owner is a phantom (`dpusateri0`, `dpusateri10`, or `datronatro`):

```bash
# Extract repo name, rewrite to canonical owner
REPO=$(git remote get-url origin | sed -E 's|.*/([^/]+)\.git$|\1|; s|.*/([^/]+)$|\1|')
# Pick the right canonical owner based on which phantom you found
git remote set-url origin "https://github.com/<canonical-owner>/$REPO.git"
```

Mapping: `dpusateri0` → `dominicpusateri`; `dpusateri10` or `datronatro` → `mocidin`.

If the remote owner is something completely unknown (not in the map and not a phantom), stop and surface to the user — never silently rewrite to a guessed owner.

#### 3b. Directory-conditional identity layer (email + push credentials)

Verify the layer described in "Directory-conditional git identity" above:

1. **Repo location.** If the repo lives outside both `~/code/personal/` and `~/code/hypertheory/`, the includeIf layer doesn't cover it — flag this to the user (the repo should probably move into the right tree) and fall back to a local `git config --local user.email` override as a stopgap.
2. **Identity files + wiring.** If either `~/.gitconfig-identity-*` file or the `includeIf` blocks in `~/.gitconfig` are missing, restore them from the canonical template (auto-fix). The includeIf blocks must remain at the END of `~/.gitconfig`.
3. **Resolved values.** `git config user.email` must equal the expected identity's email, and `git config --show-origin --get-all 'credential.https://github.com.helper'` must show the pinned helper sourced from the matching identity file as the LAST entry.
4. **Stale local overrides.** If `git config --local --get user.email` returns anything, remove it (`git config --local --unset user.email`) — the includeIf layer is the single source of truth and a stale override can silently mask it.

Do **not** touch the global `user.email` / `user.name` defaults (`dominic.pusateri@gmail.com` / `Dominic Pusateri`) except to restore exactly those values.

#### 3c. gh accounts (keyring presence — NOT active-account)

Push auth does not read gh's active account (the pinned helpers use `gh auth token --user <login>` directly), so **never run `gh auth switch` to fix a push**. The only requirements:

- **Both accounts must be logged in** (present in the keyring) — `gh auth status` must list `dominicpusateri` and `mocidin`. If the expected identity's account is missing, its pinned helper returns an empty token and push fails.
- The **active** account only affects `gh` API commands (`gh pr create`, `gh api`, …). When running such commands for this repo, either switch (`gh auth switch -u <expected-login>`) or prefix with `GH_TOKEN=$(gh auth token --user <expected-login>)`. Prefer the env-var form — it doesn't mutate global state other sessions share.

If the expected account is **not logged in at all** → STOP. The fix requires browser interaction. Print:
  ```
  gh is not authenticated as <expected-login>.

  To fix:
    1. Open an incognito window and sign into github.com as <expected-login>.
       (This avoids the device-code flow authorizing whichever account is already
       signed in to your default browser.)
    2. In terminal, run:
         gh auth login --hostname github.com --git-protocol https
       Choose: HTTPS → Yes (auth git) → Login with a web browser
    3. Paste the device code into the incognito window and authorize.
    4. Then re-run this skill.
  ```

  If the user prefers a token-based flow (no browser dance):
  ```
  Alternative — paste a Personal Access Token (PAT):
    1. In an incognito window signed in as <expected-login>, go to
       Settings → Developer settings → Personal access tokens → Tokens (classic)
       → Generate new token. Scopes: repo, workflow, read:org, gist.
    2. In terminal:
         gh auth login --hostname github.com --git-protocol https --with-token
       Paste the token, hit Enter, then Ctrl-D.
  ```

  Do **not** attempt automated `gh auth login` — it requires browser interaction and will silently re-authorize the wrong account if the browser has another GitHub session open.

#### 3d. MCP github token (per-repo `.mcp.json`)

GitHub MCP auth is **per-repo**, not user-scope. Each repo's `.mcp.json` carries the Bearer token for `https://api.githubcopilot.com/mcp`. If the token in `.mcp.json` resolves to the wrong account, every `mcp__github__*` call from that repo acts as the wrong user (silent — the gh CLI side will look correct).

Resolve the expected token from `gh`'s keychain (no new PATs needed):

```bash
gh auth token --user <expected-login>   # personal: dominicpusateri; work: mocidin
```

Validate the on-disk token by hitting `https://api.github.com/user` with it and comparing `login`. If wrong/missing, rewrite `.mcp.json`:

```bash
EXPECTED_LOGIN="<dominicpusateri|mocidin>"
TOKEN=$(gh auth token --user "$EXPECTED_LOGIN")
python3 - <<PYEOF
import json, os, pathlib
p = pathlib.Path(".mcp.json")
d = json.loads(p.read_text()) if p.exists() else {}
d.setdefault("mcpServers", {})["github"] = {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp",
    "headers": {"Authorization": f"Bearer {os.environ['TOKEN']}"},
}
p.write_text(json.dumps(d, indent=2))
os.chmod(p, 0o600)
PYEOF
```

Notes:
- `.mcp.json` must be **gitignored** (it holds a token). If it isn't, add `.mcp.json` to `.gitignore` before writing.
- `chmod 600` so the token isn't world-readable.
- Never call `mcp__github__get_me` to verify — the running session's MCP server was loaded with the *old* config and won't reflect the rewrite until restart. Validate by curling `api.github.com/user` with the on-disk token instead.
- If the rewrite happened, mention in the final report: "MCP github token updated — restart Claude Code session to pick up the new token."

User-scope `~/.claude.json` should **not** contain a `github` MCP entry. If it does, it acts as a fallback that masks per-repo misconfig. Remove it:

```bash
python3 -c "
import json, pathlib
p = pathlib.Path.home() / '.claude.json'
d = json.loads(p.read_text())
if d.get('mcpServers', {}).pop('github', None) is not None:
    p.write_text(json.dumps(d, indent=2))
    print('removed user-scope github MCP')
"
```

#### 3e. Vercel MCP OAuth identity

Vercel MCP is user-scope (`https://mcp.vercel.com`) and uses OAuth — there is no static token in any config file. **Cannot be auto-fixed.** The skill detects mismatches and prompts the user to switch manually via Claude Code's `/mcp` UI.

The two Vercel accounts are fully separate (see canonical map). One OAuth session sees exactly one account.

**Verification:**

Call `mcp__vercel__list_teams` and read the result:

- **personal repo expected:** result contains a team with slug `dpusateri` (the `Personal` scope of `dominic.pusateri@gmail.com`).
- **work repo expected:** result contains a team with slug `hypertheory`.

If the result matches expectation → Vercel layer is correct, do nothing.

If `list_teams` is unavailable or the call fails (MCP server not running, transport error) → note in the report as "Vercel: not verifiable in this session" and continue. Do not block on it.

**On mismatch, halt the Vercel check and emit this prompt verbatim** (substitute `<expected-account>` with `dominic.pusateri@gmail.com` for personal repos or `dom@hypertheory.ai` for work repos):

```
Vercel MCP is OAuth'd as the wrong account for this repo.

  Expected:  <expected-account>
  Currently: <actual account inferred from list_teams slug>

Switching is manual — Vercel MCP uses OAuth, not a static token, so there's
no programmatic fix. Do this once:

  1. Open an incognito browser window. Sign into vercel.com as
     <expected-account>.
  2. In Claude Code, run /mcp → select `vercel` → Disconnect.
  3. Trigger a Vercel tool call (e.g., ask Claude to "list Vercel teams").
     When the OAuth URL appears, paste it into the incognito window and
     click Authorize.
  4. Re-run /ensure-environment-config to verify.
```

Do not attempt any other action on the Vercel MCP layer. Do not claim the MCP layer is correct unless `list_teams` actually confirmed the expected slug is present.

#### 3f. Vercel CLI identity

The Vercel **CLI** authenticates separately from Vercel MCP (see canonical map). Its token lives at `~/Library/Application Support/com.vercel.cli/auth.json` (macOS; Linux fallback `~/.local/share/com.vercel.cli/auth.json`). This is the credential `vercel deploy`, `vercel env`, and the `/env-cleanup` skill use — so a wrong-account CLI silently deploys to or reads env from the wrong account even when every other layer is correct.

**Do NOT trust `vercel whoami`'s output string.** It prints the Vercel *username*, not the email — and the personal account's username is literally `dpusateri0`, which collides with the dead GitHub phantom of the same name (see collision note above). On Vercel that handle is genuine and correct. **Always verify by email**, never by the username string.

Verify the authed email against the on-disk token:

```bash
TOKEN=$(python3 -c "import json,pathlib
for rel in ['Library/Application Support/com.vercel.cli/auth.json','.local/share/com.vercel.cli/auth.json']:
    f = pathlib.Path.home()/rel
    if f.exists():
        print(json.loads(f.read_text()).get('token','')); break")
curl -s -H "Authorization: Bearer $TOKEN" https://api.vercel.com/v2/user \
  | python3 -c "import sys,json; u=json.load(sys.stdin).get('user',{}); print('email:', u.get('email'), '| username:', u.get('username'))"
```

- **personal repo expected:** email = `dominic.pusateri@gmail.com` (username will read `dpusateri0` — that's correct, not a fault).
- **work repo expected:** email = `dom@hypertheory.ai`.

Then confirm the repo is **linked** to a project in the right account. If `.vercel/project.json` exists, its `orgId` must be the expected team — personal = `team_Rh4A5fBJKHVwvnyEisKiKuEA` (slug `dpusateri`); work = the `hypertheory` team. A correct token with a stale `orgId` means `vercel deploy` targets the wrong account's project.

```bash
cat .vercel/project.json 2>/dev/null   # inspect orgId + projectName
vercel teams ls 2>&1                    # the scopes this CLI login can actually see
```

**Cannot be auto-fixed** — CLI login is interactive. If the token is missing or the email is the wrong identity, emit verbatim (substitute `<expected-account>` = `dominic.pusateri@gmail.com` for personal, `dom@hypertheory.ai` for work):

```
Vercel CLI is logged in as the wrong account for this repo.

  Expected:  <expected-account>
  Currently: <actual email from /v2/user, or "not logged in">

Switching is manual — `vercel login` is interactive. Do this once:

  1. In terminal:  vercel login
  2. Choose "Continue with Email" and enter <expected-account>
     (or the matching SSO/GitHub option for that account).
  3. Confirm:  vercel whoami   (personal shows username dpusateri0 — that's fine)
  4. Re-run /ensure-environment-config to verify.
```

If the CLI **email is correct** but `.vercel/project.json` points at a team the login can't see (stale link after an account switch), re-link rather than re-login:

```bash
rm -rf .vercel && vercel link   # interactive: pick the correct scope + project
```

Never run `vercel logout` — it's destructive and drops that account's credential entirely. Switching via `vercel login` is sufficient. If the CLI is not installed at all (`vercel` not found), note it in the report as "Vercel CLI: not installed" and continue — don't install it unprompted.

#### 3g. Supabase MCP (per-repo `.mcp.json`)

Supabase MCP is per-repo: each `.mcp.json` defines one or more `supabase-<project>` stdio servers with an `--access-token` and `--project-ref` in args. The token is a Supabase PAT (`sbp_*`); the project ref ties it to a specific project.

Check what the repo expects:

- **Hypertheory repos** — must have at least one `supabase-*` entry whose project ref matches the canonical project for that repo. The cross-project admin (`hypertheory`) carries multiple supabase entries (e.g., `supabase-hypertheory`, `supabase-brandflare`, `supabase-stonedgpt`); single-product repos carry one.
- **Personal repos** — a personal repo with its own Supabase project carries its own entry (e.g. `supabase-personal` in the `personal` repo) — that is correct, leave it. A personal repo with **no** `supabase-*` entry at all may share the Hypertheory backend via a `supabase-hypertheory` entry copied verbatim from the canonical source `~/code/hypertheory/hypertheory/.mcp.json` (see the auto-fix below) — but only auto-add it for repos that actually use a database; a static site needs none.

Verification:

```bash
# List supabase-* entries in the repo's .mcp.json
python3 -c "
import json, pathlib
p = pathlib.Path('.mcp.json')
if not p.exists():
    print('NONE'); exit()
d = json.loads(p.read_text())
for name, cfg in d.get('mcpServers', {}).items():
    if name.startswith('supabase'):
        args = cfg.get('args', [])
        ref = args[args.index('--project-ref')+1] if '--project-ref' in args else '?'
        print(f'{name}  ref={ref}')
"
```

For each token in those entries, validate by `curl -s -H "Authorization: Bearer <token>" https://api.supabase.com/v1/projects` — should return JSON with the project listed. If the token returns 401/403, the PAT is revoked or wrong; surface to the user (Supabase PATs are minted in the Supabase dashboard — only the user can rotate them).

**Auto-fix (personal repos only).** A personal repo missing the `supabase-hypertheory` entry is a config gap, not a valid state — it leaves the repo with no DB access. Copy the block verbatim from the canonical work repo (same PAT, same `--project-ref`) so every personal repo shares the Hypertheory backend identically:

```bash
python3 - <<'PYEOF'
import json, os, pathlib
src = json.loads(pathlib.Path.home().joinpath('code/hypertheory/hypertheory/.mcp.json').read_text())
block = src['mcpServers']['supabase-hypertheory']
p = pathlib.Path('.mcp.json')
d = json.loads(p.read_text()) if p.exists() else {'mcpServers': {}}
d.setdefault('mcpServers', {})
if 'supabase-hypertheory' in d['mcpServers']:
    print('supabase-hypertheory already present')
else:
    d['mcpServers']['supabase-hypertheory'] = block
    p.write_text(json.dumps(d, indent=2))
    os.chmod(p, 0o600)
    print('added supabase-hypertheory — RESTART Claude Code to load the MCP server')
PYEOF
```

Ensure `.mcp.json` is gitignored and `chmod 600` (it holds a PAT). The newly added server only goes live after a session restart — say so in the report.

For **work repos**, do **not** auto-create entries — the user manages those Supabase PATs and project assignments manually. Verify what's there and surface anything missing or invalid.

### Phase 4 — Verify push will succeed

```bash
git ls-remote origin HEAD
```

- **Success** (prints a SHA + `HEAD`) → identity is correct, push will work.
- **"Repository not found"** → either the remote URL still has a wrong owner (re-check Phase 3a), or the pinned helper served the wrong/empty token. Check `gh auth token --user <expected-login>` returns a token, and that the identity file's pinned helper is the LAST helper entry for `https://github.com` (Phase 3b).
- **"Authentication failed"** → the pinned token is revoked or the account was logged out. Run `gh auth token --user <expected-login>` — if it errors or returns nothing, the account needs re-login (3c stop message). If a token comes back, it's been revoked server-side: same re-login flow.

### Phase 5 — Report

Tight, scannable summary. Example for the success case:

```
Identity: personal (dominicpusateri)
  remote        github.com/dominicpusateri/brokenbacksturgeonfishing  ✓
  identity      ~/.gitconfig-identity-personal via includeIf          ✓
  user.email    dominic.pusateri@gmail.com (resolved, no override)    ✓
  push cred     pinned to dominicpusateri (gh keyring)                ✓
  mcp github    dominicpusateri (via .mcp.json)                       ✓
  mcp vercel    Personal scope (slug: dpusateri) reachable            ✓
  cli vercel    dominic.pusateri@gmail.com (username dpusateri0)       ✓
  mcp supabase  supabase-personal                                     ✓
  ls-remote     ok                                                    ✓
Ready to push.
```

For a Hypertheory repo:

```
Identity: work (mocidin)
  remote        github.com/mocidin/hypertheory                        ✓
  identity      ~/.gitconfig-identity-work via includeIf              ✓
  user.email    dom@hypertheory.ai (resolved, no override)            ✓
  push cred     pinned to mocidin (gh keyring)                        ✓
  mcp github    mocidin (via .mcp.json)                                ✓
  mcp vercel    hypertheory team reachable (slug: hypertheory)         ✓
  cli vercel    dom@hypertheory.ai                                     ✓
  mcp supabase  supabase-hypertheory, supabase-brandflare, supabase-stonedgpt  ✓
  ls-remote     ok                                                     ✓
Ready to push.
```

If anything could not be auto-fixed (e.g., gh not authed as expected account), end with a one-line TODO for the user — never paper over a real gap with a vague success message.

If a remote URL was rewritten from a phantom owner, mention it explicitly:

```
  remote      github.com/dominicpusateri/dominicpusateri  ✓ (rewritten from dpusateri0/dominicpusateri — phantom redirect)
```

## What this skill does NOT do

- **Never pushes.** The user runs `git push` themselves after this skill confirms identity.
- **Never modifies global git config beyond the canonical identity layer.** The only sanctioned global writes are restoring the includeIf blocks, the two `~/.gitconfig-identity-*` files, and the canonical `[user]` defaults — exactly as templated above. Everything else in `~/.gitconfig` is untouched.
- **Never runs `gh auth switch` to fix a push** — push auth is pinned per directory and doesn't read the active account. Switching (or better, `GH_TOKEN=$(gh auth token --user …)`) is only for `gh` API commands.
- **Never logs out of any `gh` account.** Logout breaks that identity's pinned credential helper everywhere.
- **Never runs `vercel logout` or auto-runs `vercel login`.** CLI login is interactive and account-specific; logout drops the credential. Detect the wrong account by email and hand the user the manual `vercel login` steps.
- **Never judges the Vercel CLI by `vercel whoami`'s username string.** The personal username `dpusateri0` collides with a dead GitHub phantom — always verify the CLI by email via `/v2/user`.
- **Never installs the Vercel CLI unprompted.** If `vercel` isn't found, report it and move on.
- **Never proactively wipes the keychain.** Only as a fix-step when `git ls-remote` fails with auth errors.
- **Never assumes a phantom-owner remote is canonical.** Always rewrites to the real owner per the phantom map above.
- **Never asks the user to confirm cosmetic changes** (e.g., setting an email override that matches the canonical map). Just do it. Only ask when the situation falls outside the known map (unknown owner, unrelated repo).
