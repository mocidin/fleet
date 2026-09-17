---
name: cron-summary
description: Print a live, fleet-wide summary of every cron job across the Hypertheory repos (hypertheory, ghostplug, brandflare, stonedgpt, recruiterbase), read fresh from each repo's vercel.json and cron route code. Use when the user types /cron-summary or asks "what crons do I have", "summarize my cron jobs", "cron overview".
---

# Cron Summary

> Fleet root: `~/code/hypertheory` on the laptop. In a cloud session the repos live side by side under the parent of the current repo (`$(git rev-parse --show-toplevel)/..`), and only the repos attached to that session exist; resolve every `~/code/hypertheory/<app>` path below against whichever root exists.


Produce a fleet-wide cron summary IN CHAT, read live from the repos so it can never go stale. Do not write any files and do not create any dashboards; the chat output is the deliverable.

## Gather (do this fresh every run)

1. Read `vercel.json` in each of: `~/code/hypertheory/hypertheory`, `~/code/hypertheory/ghostplug`, `~/code/hypertheory/brandflare`, `~/code/hypertheory/stonedgpt`, `~/code/hypertheory/recruiterbase`. A missing file or empty `crons` array means that app has none, and that is worth reporting too.
2. For every cron entry, read the route file it points to (`app/<path>/route.ts`) and identify what it actually runs. Piggybacked sweeps matter most: a single route often runs many jobs (Hypertheory's snapshot route is the canonical example), so list what each call does, not just the route name.
3. Convert each schedule to Pacific time alongside UTC.
4. Diff the result against the hub job catalog (`hypertheory/app/admin/jobs/catalog.ts`, what the Jobs page shows): a cron missing there, or a schedule that differs, is reported at the end as catalog drift to fix.

## Output format (exactly this shape)

A `## Cron Jobs` heading, then one section per app that has crons, then a single line for apps with none. Per app:

- Bold app name with schedule in parentheses, e.g. `**Hypertheory** (daily 4:55pm PT / 23:55 UTC)`
- A one-line **Why this time** bullet giving the timing justification (see below)
- A **Runs** list: one short bullet per job the route performs, plain language, each bullet stating what happens and why it matters (one clause each, no jargon)

Style rules:
- NEVER use em dashes or en dashes anywhere in the output; use commas, colons, or parentheses instead
- Plain language a non-engineer could follow; name the user-visible effect (e.g. "pauses inboxes landing in spam so they stop burning leads"), not the function name
- Keep it tight: each bullet one line, the whole summary under ~30 lines
- End with a one-line total, e.g. `3 crons across 5 apps; StonedGPT and Recruiterbase have none`

## Timing justifications (verify, then state)

Derive the "why this time" from the code and these known rationales; if a schedule has changed, re-derive rather than parroting:

- Hypertheory 23:55 UTC: five minutes before UTC midnight so the daily metrics snapshot captures the complete day
- Ghostplug 06:00 UTC (11pm PT): after the US Reddit day ends so impression counts include the full day
- Brandflare 08:00 UTC (1am PT): quiet hours, and staggered so the fleet's crons never compete
- General: 00:00 UTC is the most congested Vercel cron slot and would break end-of-day snapshot math; staggered off-peak times are deliberate

If a NEW cron appears with no obvious rationale, say so plainly ("timing looks arbitrary, consider staggering") instead of inventing a justification.
