---
name: push-code
description: Verify every fleet working tree is complete and deploy-safe, then commit and push everything to production in one pass. Checks all five Hypertheory repos (hypertheory, ghostplug, brandflare, stonedgpt, recruiterbase) for uncommitted or unpushed work, validates each changed repo compiles clean (npx tsc --noEmit), commits with a proper message, and pushes to main (push = deploy). Invoking this skill IS the explicit push authorization required by the global no-push rule. Use when the user types /push-code or says "push the code", "ship everything", "push it all to production", "commit and push the fleet".
---

# Push Code

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


Sweep all five fleet working trees, verify each one is complete and will not break the build, then commit and push to main. Pushing to main IS deploying to production. Invoking this skill counts as Dom saying "push", so no further push confirmation is needed; everything that passes validation ships in this run.

The repos: `~/code/hypertheory/hypertheory`, `~/code/hypertheory/ghostplug`, `~/code/hypertheory/brandflare`, `~/code/hypertheory/stonedgpt`, `~/code/hypertheory/recruiterbase`.

## 1. Survey (all repos, in parallel)

For each repo run `git status --porcelain`, `git branch --show-current`, and `git log origin/main..main --oneline`. This yields three buckets per repo: uncommitted changes, committed-but-unpushed work, and clean. A repo that is clean and pushed needs nothing else, skip it.

If a repo is on a side branch or has one, fast-forward or merge it into main and delete the branch (the one-branch rule). If origin/main has moved, `git pull --ff-only` (or rebase onto origin/main) before anything else.

## 2. Vet the uncommitted work (the "complete and in a good spot" gate)

For every repo with uncommitted changes, actually read the diff (`git diff` plus each untracked file) and judge it:

- **Throwaway artifacts** (debug scripts, stray screenshots, compiled bundles of committed source, `check-*.mjs` style scripts): delete them, never commit them.
- **Stranded half-finished work**: a file whose diff references code, imports, or files that do not exist in the tree is another session's incomplete work. NEVER sweep it into a commit (this exact pattern broke a production build 2026-08-06). Leave it uncommitted, and name it in the report.
- **Work still in progress**: even if it compiles, hold back anything that reads as a feature mid-build: a new component nothing renders yet, a route or action with no caller, a button wired to nothing, TODO/placeholder markers in the diff, or a schema/prompt change whose consuming code is not there yet. When in doubt about whether something is finished, DO NOT push that repo; report it as in progress instead. Shipping half a feature to production is worse than shipping nothing.
- **Secrets**: anything that looks like a key, token, or `.env` content staged in a tracked file blocks that repo's push until reported.
- **Complete work**: everything else proceeds.

When a repo mixes complete and stranded work, commit only the complete files by explicit path, never `git add -A`.

## 3. Validate (every repo that will receive a commit or has unpushed commits)

- `npx tsc --noEmit` must pass. If it fails on code being shipped, fix the errors (they are part of finishing the work) and re-run until clean. If it fails only on pre-existing untouched code, report it and still ship, noting the pre-existing failure.
- If the changes touch dependencies, `next.config.*`, or `vercel.json`, the repo is build-risky: run `npx next build` for that repo too (never `next dev`). One repo at a time, these are CPU-heavy on Dom's machine.
- Never run dev servers or kill port 3000.

## 4. Commit and push

Per repo with work to ship:

1. Commit with one descriptive sentence describing what the change does (no em or en dashes, product names as prose: Brandflare, Ghostplug, Recruiterbase, Hypertheory, StonedGPT).
2. `git push`. A rejected push means the remote moved: `git pull --ff-only` or rebase onto origin/main, then push again. NEVER force-push.

Do not babysit deploys: report each push as "pushed", not "live". Only watch a deploy through to Ready when the change was build-risky (dependency/config changes), and say so.

## 5. Report

A few sentences in plain language: which apps shipped and what each change does in one clause, which repos were already clean, and anything deliberately left behind (stranded work, deleted debug files, pre-existing type errors) with one line on why. No tool narration, no per-command detail.
