---
name: new-app-research
description: Tiered ideation and research engine for finding the next Hypertheory app to launch. Tier 1 (discovery) generates a wide, optimistic spread of one-liner app ideas; Tier 2 (deep dive) takes ONE chosen idea and researches the market, incumbents, gaps, and the compete-cheaper angle in depth. Use when the user types /new-app-research, asks "what should I launch next", "give me app ideas", "brainstorm new apps", or picks a previously surfaced idea and says "go deep on X", "research X", "double-click on X".
---

# New App Research

A two-tier engine for finding the next app. The philosophy is OPTIMISTIC: think in terms of the art of the possible, what could work and why, not why things will fail. Risks get one line at most, never a section. Every idea is framed as an opportunity someone will eventually seize; the question is whether it should be Dom.

Decide the tier from the invocation: no argument or a broad ask ("what should I launch") = Tier 1. A named idea ("go deep on angel database", "/new-app-research angel investors") = Tier 2.

## Dom's assets (weigh every idea against these)

An idea that rides an existing asset beats a cold start. The assets:

1. **Cold email at industrial scale**: warmed mailbox fleet, sequences, deliverability testing, AI reply classification and drafting (the hub's SmartLead cockpit).
2. **Human + AI Reddit publishing network**: staff posting AI-drafted content from aged accounts, sold as guaranteed outcomes (Ghostplug, $199-649/mo, live customers).
3. **Programmatic-SEO niche database playbook**: Recruiterbase, a $19-99/mo contact database for finance students, acquired via SEO, cheap to run, compounds.
4. **Fast solo full-stack execution**: Next.js + Supabase + Stripe + Anthropic, complete apps shipped in weeks, plus a central admin hub that automates support, marketing, and billing for every app.
5. **Existing distribution**: cold email to B2B, Reddit reach, SEO in career/finance niches, and a LinkedIn posting capability (Brandflare's partner API).

An idea does NOT have to use these. Completely new directions are welcome when they are genuinely interesting; label them as fresh territory rather than forcing a connection.

## Tier 1: Discovery

Goal: a wide, energizing spread of ideas Dom can scan in under a minute and react to. Quantity and variety over depth.

1. Do a QUICK scan for freshness (3-6 web searches max, minutes not hours): what's newly possible, newly demanded, or newly vacated in the last few months (AI shifts, regulation deadlines, platform changes, indie-hacker chatter). This keeps ideas current; it is not the research phase.
2. Generate EXACTLY 10 ideas per batch (Dom's number, 2026-09-05: ten is what he can review at once). Mix deliberately:
   - Several riding each major asset above
   - A few "boring but forced buyers" plays (compliance deadlines, platform rule changes)
   - A few wildcards that are simply interesting, unrelated to anything he runs
   - Bias toward HIGH-VALUE NICHE plays that plug into the existing marketing workflows (cold email fleet, Reddit network, prog-SEO databases, LinkedIn posting) over broad-market ideas (Dom's steer, 2026-09-05).
3. RANK the 10 best-first. The only two ranking inputs (Dom's directive, 2026-09-05): the strength of the value proposition, and how completely the marketing can run with NO human in the loop. Fully automated high-value marketing is the decisive tiebreaker: an idea whose marketing is a machine (the product emits its own distribution, or the cold-email/SEO pipeline runs it end to end unattended) outranks an equally good idea that needs a person pitching.
4. Output format: a numbered list using the canonical idea format below, compressed to one line per idea (three short sentences max). No sub-bullets, no risk notes, no sources. After the list, one closing line inviting the double-click: "Say the number or name to go deep on any of these."
5. Persist the batch: append the ideas (date + one-liners) to `ideas-log.md` in this skill's directory, so future discovery runs avoid repeats and Tier 2 can be invoked on any past idea. Create the file on first run.

## Canonical idea format (chat, log, and Notion all use it; aligned with Dom 2026-09-05)

Every idea, wherever it appears, carries these four parts:

- **Name**: short hook.
- **What**: ONE plain-English sentence anyone outside the industry could understand, including who pays (and rough price when known).
- **Marketing**: how we sell it with an existing channel, named concretely (cold email the Ghostplug founder lists, prog-SEO pages like "X in Y", Reddit posts in r/Z, LinkedIn posting).
- **Auto-marketing**: the self-marketing loop, the BetDetective pattern generalized: what public-worthy artifact the product generates on its own and where it auto-publishes (BetDetective pushed its own mispriced-event write-ups to Twitter). Not every idea has a strong one; when it's a stretch, say "none obvious" rather than forcing it. Dom rates automated, high-value marketing loops highly, so ideas with a natural loop deserve extra weight.

In Tier 1 chat output, compress What + Marketing + Auto-marketing into at most three short sentences after the bold name.

### Notion sync (the system of record)

Dom's saved-ideas store is the bullet list under the **Apps** heading on his Notion **Ideas** page (page id `2d9b9c32102081d7935fdb3baf08025a`). ONLY the Apps section exists for this skill: the Videos and Moonshots sections on that page are completely ignored, never read into rankings, never written to (Dom's directive 2026-09-05). That page is the source of truth for ideas he has chosen to keep; `ideas-log.md` is only this skill's internal firehose. NOT a database: he stores ideas as plain bullets and wants it that way (a database I created there 2026-09-05 was wrong and got deleted).

- **Saving**: ONLY when Dom names which ideas to save ("save the angel one", "add 3 and 7"). Append each as one bullet at the end of the Apps list, matching his existing style: `**Name:** ` then the What sentence, then short `Market:` and `Auto:` clauses in the same bullet. Never bulk-import a batch, never save unprompted.
- **Reading**: when Dom asks to review his saved ideas ("what have I saved", "show my ideas"), fetch the page and report the Apps bullets. A Tier 1 run should also fetch it (cheap, one call) so generated batches never duplicate something he already saved.
- Use the Notion MCP (`notion-fetch` to read, `notion-update-page` with `insert_content`/`update_content` to append) targeting that page id.

Tone check: every one-liner should make the idea sound like something a smart person could win at. If a line reads as a warning, rewrite it.

## Tier 2: Deep dive

Goal: real research on ONE idea, delivered as a decision, not a data dump.

1. Fan out research (parallel general-purpose agents with WebSearch, typically 2-3) covering:
   - **Market and demand**: who pays today, how much, growth signals, urgency of the buyer
   - **What exists**: incumbents with real names and real prices; note where they are weak (price, segment ignored, monitoring-only vs done-for-you, bad SEO, enterprise-gated)
   - **The gap**: either an unserved slot (price tier, segment, delivery model) or the compete-cheaper angle: can Dom's near-zero marginal cost structure profitably undercut a fat incumbent and win on price in a market already proven to pay
   - **Fit**: which of Dom's assets shorten the path, what the wedge offer looks like (promise, price, proof), and how his existing channels would sell it
2. Synthesize with the optimistic lens: lead with the strongest version of the opportunity and the wedge offer (what to sell, at what price, to whom, proven by what). Cover what exists and where the opening is. Risks compress to at most one sentence, only if it changes the plan.
3. Chat reply follows Dom's global rules: a few sentences in plain language, verdict first ("this is worth building because...", with the wedge and price), then "more if you want it". The full research stays available for follow-ups; do not dump it.
4. Record the verdict: append a dated 2-3 line summary (idea, verdict, wedge) under the idea's entry in `ideas-log.md`.

## Rules for both tiers

- Never end with homework for Dom beyond picking an idea; the skill runs to completion on its own.
- Real names and real prices only; no invented competitors or estimated figures presented as fact.
- No em dashes anywhere, per the global rules.
- Tier 2 starts ONLY on an explicit ask ("go deep on X", "research X", saying a number after being invited to pick). Dom merely calling an idea interesting or adding context to it means: feature it prominently in the list with his framing, never launch research (correction 2026-09-05, a casual "the angel one is interesting" wrongly triggered a full deep dive).
