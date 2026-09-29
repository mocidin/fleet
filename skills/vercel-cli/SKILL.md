---
name: vercel-cli
description: Reference for driving the Vercel CLI safely and correctly — reading deploy status, and adding, editing, inspecting, renaming or deleting environment variables without leaking secrets or nuking the wrong scope. Covers the stderr/stdout split in `vercel ls`, encrypted vs sensitive var types, non-interactive `env add` syntax, the destructive behaviour of `env pull` and `env rm`, and the grep discipline for renames. Use before running ANY `vercel` CLI command that touches env vars or parses deploy output. The login gate itself lives in the global CLAUDE.md and always applies, whether or not this skill is loaded.
allowed-tools:
  - Bash
  - Read
---

# Vercel CLI

Procedures and quirks. These cost real time when rediscovered, and several of them silently corrupt data or leak secrets when guessed at.

**Before any `vercel` command, the login gate in `~/.claude/CLAUDE.md` applies.** Read `~/Library/Application Support/com.vercel.cli/auth.json` first; empty `{}` means logged out and you must stop and ask. `vercel whoami` is NOT a safe check. That rule is in the global config on purpose, because a gate that only lives in a skill is not loaded in the session about to trip it.

## Reading deploy status

`vercel ls` writes the status table to **STDERR** and bare deployment URLs to stdout. Any script that greps for Ready/Error must merge streams (`2>&1`); with `2>/dev/null` you get only URLs and the status check silently never matches. In the merged table row the status word is **awk field 5** (age, project, url, ●, status).

A push is not done until the deploy is Ready. Watch every push through to Ready, with a hard iteration cap and an auth-file re-check each pass.

## Env var types

Two types, and `vercel env ls` shows BOTH as "Encrypted" — that column does not distinguish them:

- **encrypted** (default): decryptable via `vercel env pull` or dashboard Reveal.
- **sensitive**: only the running deployment can read it. No dashboard Reveal, and `env pull` returns an empty string.

Distinguish via `curl /v9/projects/<id>/env?decrypt=true` and inspect `.envs[].type`.

**`""` (empty-quoted) from `vercel env pull` means MISSING, not the value.** Never push `""` back. Fall back to `.env.local` for the real value; if it is absent there, ask.

## Adding (Production is the only target you should use)

```
printf 'value' | vercel env add NAME production --no-sensitive --yes
vercel env add NAME production --value 'value' --no-sensitive --force --yes
```

Use `printf`, not `echo` — echo appends a newline that becomes part of the secret.

The shell is **zsh**: pass multi-flag option lists as an array (`OPTS=(…); "${OPTS[@]}"`), never an unquoted `$OPTS` (zsh does not word-split).

## Deleting and narrowing scope

**`vercel env rm NAME ENV` deletes from ALL environments** when the var was created as one multi-env record. Never use it to "narrow" scope. To narrow: pull the value first, `rm` the whole var, then re-add with the narrower scope.

To surgically remove an unwanted Preview/Development record while leaving Production intact, delete it by id via the API rather than `env rm`:

```
DELETE /v9/projects/<id>/env/<envId>?teamId=…
```

**`vercel env pull .env.local` OVERWRITES the file.** Always pull to a temp file, read it, then remove it:

```
vercel env pull .env.prod.tmp --environment=production --yes
```

## Renaming or deleting a var in code

Grep the **whole repo root**, not just `app/ lib/ components/`. Include `proxy.ts`, `middleware.ts`, `next.config.*`, `instrumentation.ts`, `vercel.json`, `scripts/**`, `.github/workflows/**`. The delete grep must be at least as wide as the inventory grep.

## Never leak values into the transcript

When extracting env var NAMES from any file, always isolate the key field:

```
awk -F= '{print $1}'   cut -d= -f1   sed -E 's/=.*//'
```

A bare `print` or `cut -d=` leaks live secret values into the conversation transcript.
