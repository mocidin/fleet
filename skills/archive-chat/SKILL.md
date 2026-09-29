---
name: archive-chat
description: The exit gate for a chat. Rebuilds the list of everything Dom asked for across the whole conversation, proves each one was delivered and that nothing is broken (typecheck, dev log, checks run on production, notes in the right place, no stranded or half-committed work, no collision with other sessions' work), finishes whatever is still open, and archives the chat only when every objective is met and nothing is left for Dom but decisions that are his. Use when the user types /archive-chat or says "can I archive this", "is this chat done", "wrap this up", "close this out". `/archive-chat push` also authorizes pushing what passes.
---

# Archive Chat

A chat is archived when every objective in it is met, nothing it touched is broken, and nothing is left hanging that a later session would have to rediscover. This skill proves that from evidence, finishes what is still open, and then archives the chat itself. It never hands Dom a checklist: the only things it leaves are decisions that are genuinely his (a push he has not authorized, a question only he can answer), each stated in one line.

## 1. Rebuild the objectives

Walk the conversation from its first message to the last. Every request becomes one objective, in Dom's own words, not the assistant's reframing. Count everything:

- The main asks, and every "also", "make sure", "as well" added mid-turn or in a later message.
- Questions Dom asked that deserved an answer, including ones asked in passing.
- Offers the assistant made that Dom accepted ("Want me to build it?" answered "yes").
- Standards Dom stated during the chat ("don't break anything", "make it the simplest thing"), which apply to every objective.

Write the list down before verifying anything, so nothing is verified against a memory of the chat that a summary may have shortened.

## 2. Prove each objective from evidence

For each objective, find the evidence on disk or in the systems, never in the transcript:

- **Code**: the change is in `git log` and `git diff` of the repo, on `main`, and does what was asked (read it, do not assume).
- **A check, alert or cron**: it has run against production data and its result was read (hub rule: reading the code is not proof). A scratchpad harness run that wrote the real row counts; an unpushed commit does not.
- **A fact Dom asked for**: the answer was given, with the number or the file, and nothing asked was skipped.
- **Notes**: every durable fact from the chat is where the memory layout puts it, in exactly one place (fleet-wide in the rulebook or a skill, per-repo in `.claude/rules/memory/`, never the laptop auto-memory), every note under its word cap, no dated diary lines.
- **Standards**: no long dashes or interpuncts in anything written, no byte-identical fleet file forked, no model named outside the router, no `.sql` or env file created, nothing removed to make something easier.

An objective with evidence is met. One without is open, whatever the transcript says.

## 3. Prove nothing is broken

In every repo the chat touched, in parallel where possible:

- `npx tsc --noEmit` passes. A failure in a file the chat touched is the chat's to fix now; a failure in an untouched file is pre-existing and is named as such.
- The dev server log (`~/Library/Logs/fleet/<app>.log`) shows no error since the changes landed. A stale server after a package install is restarted with `dev restart <app>` and read again.
- `git status --porcelain`: work the chat made is committed; work it did not make (another session's) is left exactly as it is and named in the report. Every commit the chat made is checked with `git show --stat` for a file that was not the chat's (a sweep of another session's half-finished edits): if one is found, the commit is rewritten to leave that file out.
- Other sessions and branches: `git branch -a` and `git log origin/main..main` in each repo. A side branch is fast-forwarded into main and deleted (the one-branch rule) unless another session is clearly working on it, in which case it is named and left alone. A change the chat made to something a sibling repo also carries (a fleet file, the rulebook, a shared helper) is confirmed present and byte-identical there.
- Anything the chat changed on a live service (Vercel settings, DNS, Stripe, Supabase) is read back once from that service.

## 4. Close the considerations

Every caveat the assistant gave, every "one thing to know", every open question and every follow-up offered is either resolved now or restated as a one-line decision for Dom. Resolve what code can resolve. A question Dom never answered where the safe default was taken is stated as the default taken. Nothing is left as "consider doing X later".

## 5. Verdict, then archive

Report in a few plain sentences, Dom's register: what the chat set out to do, that every objective is met and proven, and the one or two things that are his to decide, if any. A short table of objectives is fine when there are more than three.

Then:

- **Everything met, nothing broken, nothing open, nothing unpushed**: archive this chat with the session tool (`mcp__ccd_session_mgmt__archive_session`, `session_id: "self"`, a one-line reason). Send the report first; the conversation ends when the archive call returns.
- **Commits unpushed**: pushing is Dom's explicit call and pushing main is deploying. With `/archive-chat push`, run the `push-code` vetting on every repo with unpushed work and ship what passes, then archive. Without it, the report names the repos and the count of commits waiting, says "say push and this archives", and the chat stays open.
- **Anything open that the assistant can finish**: finish it now, re-run the proofs, and only then archive. A skill runs to completion; ending with a to-do list is a failure of this skill.
- **Something only Dom can decide**: the report states it in one line each, the chat stays open, and nothing else is left in the report.

## Rules

- Evidence over transcript, every time. A long chat has been summarized; the summary is not proof.
- Never push, deploy, send a message or change a live service to close an objective unless the objective itself was that, with Dom's go in the chat.
- Never archive a chat that another session's work depends on staying open (a side session sharing its worktree that is still working); the archive call refuses that on its own, and the report says so.
- The report follows the fleet reply rules: a few sentences, plain words, no file paths unless asked, one caveat at most.
