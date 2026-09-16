---
name: legal-audit
description: Audit and harden the entire legal surface area of any Hypertheory-fleet app (Ghostplug, Brandflare, StonedGPT, Recruiterbase, Hypertheory) — privacy policy, terms of service, assent mechanics, protective clauses, and policy-vs-code truthfulness — to minimize indefensible lawsuit exposure. Self-evolving — every run re-verifies the legal landscape (state privacy laws, FTC rules, AI disclosure laws, case law on clickwrap/arbitration) via web research and updates this skill's own evolving sections. Rewrites legal documents autonomously; code changes are additive-and-peripheral only (assent checkbox, legal pages, contact/removal channels) — NEVER touches core product functionality; accepted gray-area practices are shielded via drafting, not re-litigated. Use when the user asks to "legal audit", "audit the legal surface", "harden the terms/privacy policy", "make the ToS bulletproof", "check legal compliance", or "reduce lawsuit exposure".
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

# Legal Audit Skill

Bring the current repo (or a named fleet app, or "all apps") to the fleet's legal gold standard: terms and privacy policy that are (1) **true** — they describe exactly what the code does, nothing more, nothing less; (2) **maximally protective** — every enforceable shield a consumer SaaS can carry; (3) **enforceably assented to** — clickwrap that courts actually uphold. The governing objective, in the user's words: *minimize the surface area for a lawsuit we can't defend.*

**This skill is not a lawyer.** It produces best-practice legal work product and cites primary sources, but nothing it writes is legal advice. High-stakes items (entity formation, arbitration strategy for a live customer base, cannabis/age-gating decisions, non-user data sales) end the report with an explicit "worth an hour of a real attorney" flag when they clear the severity bar.

## The threat model (rank findings by this, always)

A solo-founder SaaS gets sued or fined through a small number of well-worn doors. Order every audit finding by which door it opens:

1. **False statements in your own legal documents.** FTC Act §5 (deceptive practices) has NO size threshold and is the FTC's favorite hook — promising deletion you don't perform, naming security practices you don't have, claiming "we don't share data" while sending it to an undisclosed vendor. These are also breach-of-contract claims any individual plaintiff can bring. Cheapest to fix, highest ROI: **make the documents true first.**
2. **Missing protective clauses.** No arbitration clause + no class-action waiver + no liability cap = uncapped classwide exposure for any slip. One template fix per app.
3. **Unenforceable assent.** The best terms on earth bind nobody if the user never agreed to them. Browse-wrap (a footer link only) fails ~86% of the time in court. The fleet standard (user directive) is sign-in-wrap done as well as it can be done: a conspicuous "By continuing, you agree" notice directly adjacent to the auth buttons, hyperlinked terms, and a server-side versioned acceptance record on every successful auth. Courts uphold well-executed sign-in-wrap regularly; proximity, conspicuousness, and acceptance records are what win those cases, so maximize all three. Checkboxes are banned (they change the user journey).
4. **Promises the code doesn't keep** (retention windows, deletion pipelines, opt-out honoring). Sub-case of #1 but needs code, not prose.
5. **Undisclosed data practices** — real vendors and data flows absent from the policy (state privacy laws + FTC §5).
6. **Strict-liability statutes with no revenue threshold**: CAN-SPAM (per-email penalties), ROSCA (auto-renewal disclosure + easy cancel), COPPA, TCPA if SMS ever ships.
7. **Business-practice exposure** — things a document cannot cure because the practice itself is the risk (undisclosed paid endorsements, platform-ToS circumvention, selling non-user PII, no age gate on age-sensitive products). **These are never "fixed" by this skill — they are reported, plainly, with options.** Writing a ToS clause that "discloses" a deceptive practice does not launder it; it memorializes it.

## Autonomy boundaries (read carefully — different from the optimize-* skills)

**Prime directive: NEVER break or alter core product functionality. Ever.** Posting flows, scraping, proxies, outreach automation, AI generation, data sourcing, the Recruiterbase contact database — these ARE the products. No fix, however legally motivated, may disable, gate, throttle, or modify them. A legal fix that breaks the product is a worse outcome than the legal risk it addressed. The lever this skill pulls is **documents**: terms and privacy language that shifts risk, disclaims, caps, and compels arbitration to the maximum lawful extent.

- **Legal documents: fully autonomous.** Rewrite privacy policies and terms freely — accuracy fixes, protective clauses, removing phantom-feature disclosures, correcting entity names, adding governing law/contact channels. Bump "Last updated" to the real date. `npx tsc --noEmit` gates every touched repo.
- **Small, clearly-required code fixes: autonomous but ADDITIVE-ONLY and PERIPHERAL-ONLY.** Permitted: a passive assent notice on the auth screen ("By continuing, you agree to the [Terms] and [Privacy Policy]") plus invisible server-side acceptance logging with a terms version; a new legal page; a working contact/removal email; a suppression/unsubscribe endpoint where the app itself sends marketing email. **NEVER a checkbox, gate, or any interactive step in auth/signup (user directive 2026-07-22: the user journey must not change whatsoever — assent is the passive notice + logged acceptance, full stop).** The user knowingly accepts the sign-in-wrap vs clickwrap enforceability tradeoff; do not re-raise it. Every Bucket B change must be something a user could not perceive as the product changing — new surface only, mirroring existing repo patterns, least code possible. A broken retention promise is fixed by **amending the policy to match reality** (never by adding deletion jobs that destroy product data — that touches core behavior).
- **Everything else: report only.** Product behavior, business model, posting mechanics, data sourcing, pricing/refund policy substance, age-verification vendor integrations, entity formation — surfaced as decisions. NEVER silently change what the product does.

## Accepted gray areas & drafting altitude

The user has explicitly accepted certain industry-standard gray-area practices (e.g., Ghostplug's Reddit marketing mechanics — every Reddit marketing agency operates this way). For these:

- **Do not re-litigate.** Once a practice is marked `[ACCEPTED]` in the fleet risk map, stop flagging it as a finding. It appears in reports only as a one-line standing note. The skill's job is to build the strongest possible paper shield around it, not to talk the user out of it.
- **Shield via drafting, maximally:** user-responsibility clauses (user is solely responsible for platform-ToS and ad-disclosure compliance), broad indemnification, no-warranty of platform outcomes or content persistence, arbitration + class waiver, tight liability caps, and service descriptions that are accurate at a protective altitude.
- **Style rule (user directive, 2026-07-22):** legal documents must read as if written by a sharp, experienced attorney, never by an AI. No em dashes anywhere in legal pages. Natural, confident legal prose; plain sentences and commas over dash-driven constructions; no AI-sounding filler or hedging.
- **Drafting altitude rule:** false statements in the documents MUST be fixed (a provably false policy is a plaintiff's best exhibit), but the fix is drafted **accurately and generally — never with self-incriminating operational detail.** Example: replace a false "we post via your connected accounts" with "content may be published through accounts operated by us or our personnel" — true, protective, and no more specific than necessary. Never enumerate internal mechanics (proxy vendors, evasion tactics, staffing models) in a public document. Accuracy is required; granularity is not.
- **What can't be shielded, say once:** where a clause genuinely cannot reach (e.g., regulator action doesn't care about your ToS), the risk map carries a single standing line so the user retains awareness — but it is never repeated as a fresh finding or "fix."
- **Material ToS changes to a live-customer app** (currently: Ghostplug; any app with paying users): apply the new terms for new users, but flag in the report that existing users must be notified (email or in-app banner with continued-use assent) before new clauses — especially arbitration — bind them. Courts routinely refuse to enforce arbitration clauses added silently after signup.
- **Never weaken.** Never delete an existing protective clause, disclaimer, or disclosure unless it is factually false. Never remove console logs. Commit only paths this run changed; one commit per repo to main, push (per global rules).

## Self-evolution protocol

Two region types, same contract as the other fleet skills:

- **STABLE** — everything outside `EVOLVING` markers. Never modified by a run; only the user changes it.
- **EVOLVING** — blocks between `<!-- EVOLVING:START ... -->` / `<!-- EVOLVING:END -->`: the legal-landscape snapshot, the fleet risk map, and the changelog. The only parts a run may rewrite.

**Phase 0 of every run — refresh the snapshot:**

1. Run these queries (verbatim, all of them):
   - `US state comprehensive privacy laws in effect <current year> thresholds new`
   - `FTC negative option rule ROSCA subscription cancellation status <current year>`
   - `FTC endorsement guides enforcement <current year> fake reviews undisclosed advertising`
   - `state AI chatbot disclosure law <current year> private right of action`
   - `clickwrap terms enforceability arbitration class action waiver recent case law`
   - `CAN-SPAM commercial email requirements enforcement <current year>`
2. Source hierarchy — snapshot changes require a **Tier 1** source: ftc.gov, a state AG / regulator site (oag.ca.gov, cppa.ca.gov), eur-lex/edpb for EU, an actual court opinion, or the statute text. Tier 2 (major law-firm client alerts — Gibson Dunn, Sidley, Jones Day, Orrick; iapp.org; fpf.org) may corroborate and may be the practical read of case law, but flag any snapshot line resting solely on Tier 2. Blogs/compliance vendors are signal only.
3. If nothing changed, update only `Last verified:`. Otherwise rewrite the affected lines and append ONE changelog entry: `- YYYY-MM-DD: <what changed> (<source URL>)`.
4. Self-edit safety: edit only inside EVOLVING markers; after any self-edit re-read the file and verify frontmatter + all marker pairs + all `## ` headings intact; changelog is append-only (compact oldest 15 into one line if >30 entries). If web research is unavailable, note "snapshot not refreshed" and proceed.

<!-- EVOLVING:START legal-landscape snapshot -->
## Current legal-landscape snapshot

Last verified: 2026-08-09 (full six-query web re-verification during the fleet-wide run; only the chatbot-law count and ANPRM date changed)

- **State privacy laws**: 20 states have comprehensive consumer privacy laws in effect (CA, VA, CO, CT, UT, IA, IN, TN, MT, OR, TX, FL, DE, NH, NJ, KY, NE, MN, MD, RI). Most have applicability thresholds (typically 100k consumers/yr or 25k + revenue-share-from-sale; CA adds $25M revenue; MT is 50k) that a pre-revenue solo SaaS sits UNDER — but **Texas and Nebraska apply to any business that isn't an SBA "small business,"** and CCPA's 100k threshold counts *households* and *devices*. Recruiterbase-style contact databases can cross "100k consumers" via the database rows themselves, not signups. Practical baseline: honor access/deletion/opt-out-of-sale requests fleet-wide regardless of thresholds — cheaper than threshold-lawyering, and thresholds don't shield against FTC §5 anyway.
- **CCPA specifics that bite**: "sale/share" is defined broadly (any disclosure for consideration — selling DB access to contacts' PII qualifies); private right of action exists for data breaches ($100–$750/consumer statutory); "Do Not Sell or Share My Personal Information" link required when selling/sharing.
- **FTC click-to-cancel / Negative Option Rule**: the 2024 rule was vacated by the 8th Circuit (July 2025) on procedural grounds; FTC restarted rulemaking (ANPRM formally published March 2026; still no NPRM as of 2026-08) and any new rule will likely mirror the old one. State AGs are actively scrutinizing subscription practices; DE/MT/NJ privacy cure periods have lapsed (immediate AG enforcement there). **ROSCA remains fully in force**: clear disclosure of auto-renewal terms before billing, express informed consent, simple cancellation. Stripe's hosted billing portal satisfies "simple cancellation" if cancellation is actually enabled there.
- **California ARL** (auto-renewal, no revenue threshold): clear-and-conspicuous renewal terms at checkout, acknowledgment email with cancel instructions, online cancellation for online signups.
- **AI chatbot disclosure**: California SB 243 (effective 2026-01-01, **private right of action**) — companion-style chatbots must clearly disclose non-human status where a reasonable person could be misled; extra duties for minors (3-hourly reminders, safety protocols). Utah AI Policy Act — disclose AI status when asked / for regulated interactions. At least seven states have chatbot laws (CA, WA, UT, NH, ME, NE, OR), three with private rights of action: CA SB 243 (in force), OR SB 1546 and WA HB 2225 (both effective 2027-01-01, ~$1,000 statutory damages per violation); ~78 more state bills pending — fastest-moving area of the snapshot. Practical baseline: any conversational AI product states "AI, not human" in the UI and onboarding; if minors could plausibly use it, the minor-facing duties apply — an age gate is what takes you out of that bucket.
- **FTC Endorsement Guides + Rule on Fake Reviews (in force since Oct 2024)**: undisclosed paid/native promotion, fake or anonymous-unverifiable testimonials, and unsubstantiated comparative claims ("#1", "better than X") are actionable; the fake-reviews rule carries civil penalties per violation. Applies to posting on social platforms on a client's behalf without disclosure.
- **CAN-SPAM** (per-email penalties ~$53k max, no threshold): accurate header/from, no deceptive subject, clear ad identification, valid physical postal address in every commercial email, working one-click-visible unsubscribe honored within 10 business days, suppression list. Applies to cold B2B outreach — B2B is NOT exempt.
- **Clickwrap enforceability** (case law, stable): checkbox + unambiguous "I agree" + conspicuous hyperlinked terms at signup ≈ enforceable (~70%+); sign-in-wrap shakier; browse-wrap fails ~86%. Keep versioned records of each user's acceptance (user id, timestamp, terms version). Arbitration clauses: AAA Consumer Rules, small-claims carve-out, delegation clause; a 30-day opt-out right materially improves enforceability odds. Class-action + jury-trial waiver ride with it. Mass-arbitration risk is real for big fleets of claims — batching/bellwether provisions are the current mitigation.
- **GDPR/UK**: applies only when targeting/monitoring EU/UK residents. If not targeting, say so and don't promise GDPR rights you can't operationalize; if EU users are real, Art. 14 requires notifying non-user data subjects whose data you obtained from third parties.
- **DMCA safe harbor**: only with a registered agent (copyright.gov, $6) + repeat-infringer policy in ToS. Cheap; do it for any UGC-bearing app.
- **COPPA**: under-13 collection with actual knowledge = liability regardless of "not directed at children" language. Age-sensitive branding (cannabis) without any age gate invites "directed at minors" arguments across multiple statutes.
<!-- EVOLVING:END -->

<!-- EVOLVING:START fleet risk map -->
## Fleet risk map

Standing per-app findings, last updated by the 2026-08-09 fleet-wide run (all five apps now carry the gold-standard clause set and sign-in-wrap assent). Update this block every run: remove items verified fixed, add new ones. Severity: ▲ business-practice risk (report once), ● document/clause fix, ◆ small additive code fix, `[ACCEPTED]` = user-accepted gray area — shield via drafting, never re-flag, never touch the underlying functionality.

| App | Status (2026-08-09) |
|---|---|
| **Ghostplug** (live customers) | `[ACCEPTED]` Reddit marketing mechanics (staff-account posting, implied-brand content, proxy-based access) — industry-standard for Reddit agencies; user accepted 2026-07-22. Shield in place as of 2026-07-22 run: truthful-at-altitude publication disclosure ("accounts operated by us or our personnel"), user-responsibility + indemnification + no-platform-warranty clauses, full arbitration stack. ✓ FIXED 2026-07-22 (commit 05d9e7b): privacy false statements corrected (posting mechanics, phantom Twilio/SES/Twitter-X→Resend/Google Workspace, "AI model improvement"→services, IP-hash analytics disclosed); terms upgraded (delegation clause, 30-day opt-out, informal-resolution-first, mass-arbitration batching, DMCA/repeat-infringer); sign-in-wrap assent ("By continuing, you agree" notice adjacent to both auth buttons, commits f023771 + 78edbf2) with versioned `tos_accepted` acceptance records in `logs` (TERMS_VERSION in lib/utils/logs.ts, bump on every material doc change). Lesson for all apps: enumerate EVERY auth surface (dedicated /auth page AND landing-page modals) before declaring assent done; Ghostplug has two. 2026-07-22 follow-up: governing law corrected Delaware→California (Hypertheory LLC is a CA LLC); em dashes removed per style rule. Customer notice: user DECLINED proactive notice 2026-07-22; mitigation is the sign-in assent checkbox, which captures re-assent from existing customers over time; do not raise again. OPEN: DMCA agent registration ($6, copyright.gov). |
| **Brandflare** (pre-launch) | ✓ FIXED 2026-08-09 (commit 0330033): phantom SMS/Twilio/SES/Twitter-X removed; LinkedIn ingestion disclosed at altitude ("publicly available professional sources"); entity standardized to Hypertheory LLC throughout (docs previously said "Brandflare LLC" — if a real Brandflare LLC exists, revert deliberately); full arbitration stack + CA governing law added; pageview analytics disclosed; TERMS_VERSION bumped to 2026-08-09. Assent notice + tos_accepted logging pre-existed from the 2026-08-08 auth standardization. OPEN: ● scraped third-party LinkedIn subjects (reference posts, profiles) have no removal channel and the marketing site has no logged-out contact path (privacy@/legal@brandflare.ai mailboxes unverified — verify aliases receive before launch). ◆ Public uploads bucket uses predictable public URLs (security hygiene, report-only). Reset-path has no assent microcopy (acceptable: reset is not signup). |
| **StonedGPT** | ✓ FIXED 2026-08-09 (commit 98ab0f5): full gold-standard terms + privacy rewrite (Hypertheory LLC, CA law, arbitration stack, liability cap, indemnification, AI-output + cannabis disclaimer, "AI, not human" stated in both docs); false 30-day-deletion and 12-month-usage retention claims amended to reality; false analytics/targeting-cookie claims removed; Anthropic web search + shared-chats disclosed; AI-output ownership corrected (user owns output); eligibility raised 13→18; sign-in-wrap assent + versioned tos_accepted (route mirrors upgrade-clicked; Google path logs in callback); public /contact page created (was NO legal contact channel anywhere); manageBilling server action now verifies session owns the Stripe customer and clamps return_url (was an IDOR exposing any customer's billing portal). STANDING ▲ (report once, decided by user): no 21+ age gate (checkboxes banned in auth; an age gate is a product decision) — CA SB 243 exposure grows as OR/WA PRAs arrive 2027; anonymous testimonials, "#1 most creative AI", "10,000+ users", "better than Claude and ChatGPT", and the named-competitor benchmark chart remain on the landing page (FTC fake-reviews rule); no in-chat "AI can make mistakes" line in the product UI. |
| **Recruiterbase** | `[ACCEPTED]`-adjacent: the contact database IS the product — never modify it. ✓ FIXED 2026-08-09 (commit 7dc38f4): privacy rewritten to cover the ~23k-row non-user professional database at altitude ("publicly available professional sources and third-party data services", AI categorization, derived-and-verified emails) with a Removal From Our Database section doubling as the CCPA sale/share opt-out; subprocessors named (Supabase, Vercel, Stripe, AWS, Smartlead, Anthropic, verification services); false targeting/analytics-cookie claims replaced with the truthful essential-only + cookieless-pageview disclosure; marketing-email enrollment disclosed with opt-out; terms rewritten to the full gold standard (Hypertheory LLC, CA law, arbitration stack, cap, indemnification, CAN-SPAM responsibility on the user, database AS-IS); sign-in-wrap assent + versioned tos_accepted on both auth paths (new `logs` table + lib/logs.ts, TERMS_VERSION 2026-08-09); FAQ removal mailto (unverified hypertheory.ai address) now points at /contact. STANDING: ▲ removed professionals can be re-inserted by the weekly discovery cron (no suppression list) — the policy deliberately promises only removal, not permanence; a suppression check keyed on removed slugs is the durable fix (product decision). ▲ Smartlead drip: user CONFIRMED 2026-08-09 the campaigns carry NO unsubscribe link and NO physical address (CAN-SPAM gap, strict liability, ~$53k/email ceiling); fixing campaign config is Dom's manual call, NEVER touch it, and never re-run even read-only verification as a suggestion — the fact is known. Policy opt-out language deliberately promises reply/contact, not an unsubscribe link (commit 725570a). ● FAQ "collected ethically and legally / reputable public sources" marketing copy is user's call. Pricing copy ($39) vs webhook ($19/IB) mismatch noted, not legal. |
| **Hypertheory** (hub) | ✓ FIXED 2026-08-09 (commit 34ade5d): public /privacy notice created (outreach data at altitude with permanent opt-out promise, cookieless pageview analytics, processor role linking all four product policies, contact dom@hypertheory.ai), Privacy link on the landing page, /privacy allowlisted in proxy.ts. ▲ STANDING: user CONFIRMED 2026-08-09 SmartLead campaigns carry NO unsubscribe link and NO physical address (CAN-SPAM gap on all cold outreach); SmartLead campaign config is Dom's manual call exclusively — never write to it, never re-verify, just carry this line. The hub records opt-outs permanently but renders no unsubscribe mechanism itself. Consider a privacy@hypertheory.ai alias to replace dom@ on the notice. ◆ Self-serve unsubscribe endpoint remains an option if wanted. |
| **Fleet-wide** | ✓ As of 2026-08-09 ALL FIVE apps carry: the "By continuing, you agree" sign-in-wrap notice, versioned tos_accepted logging on both auth paths, the full arbitration stack + CA law + Hypertheory LLC entity, truthful vendor lists, and the pageview-analytics disclosure. Hub feed excludes tos_accepted from all existing sibling log readers (Ghostplug 25baa30, Brandflare both readers 34ade5d); StonedGPT/Recruiterbase have no hub logs reader yet — add the exclusion when one is built. Existing-user re-assent: arbitration binds existing Recruiterbase/StonedGPT users only as they re-auth past the notice (same accepted posture as Ghostplug; do not re-raise). OPEN: ● entity confirmation (all docs now say Hypertheory LLC — confirm no separate Brandflare LLC should govern Brandflare). ● No DMCA agent registered ($6, copyright.gov; matters for Ghostplug/Brandflare/StonedGPT UGC). ● Verify privacy@/legal@ mailboxes actually receive for ghostplug.ai and brandflare.ai. |
<!-- EVOLVING:END -->

<!-- EVOLVING:START changelog -->
## Changelog

- 2026-07-22: Initial snapshot + fleet risk map authored from five-repo baseline survey and web verification (ftc.gov Negative Option Rule page; 8th Cir. vacatur + 2026 ANPRM via Gibson Dunn/Sidley alerts; CA SB 243 via sd18.senate.ca.gov; state-law count via IAPP-corroborated trackers).
- 2026-07-22: User directive — prime directive added: never touch core product functionality; documents are the sole lever. Ghostplug Reddit marketing mechanics marked `[ACCEPTED]`; drafting-altitude rule and `[ACCEPTED]` marker introduced. (User instruction, not a legal-landscape change.)
- 2026-07-22: First Ghostplug run completed (commit 05d9e7b). Snapshot re-verified same-day (endorsement enforcement push + CAN-SPAM $53,088/email 2026 adjustment confirmed via FTC warning letters coverage; no snapshot changes). Ghostplug is now the in-fleet reference implementation for the clause set and assent pattern.
- 2026-07-22: User directive — assent checkbox reverted (commit f023771); fleet assent standard is frictionless sign-in-wrap (passive "By continuing" notice + versioned server-side acceptance logging). Checkboxes/gates in auth are permanently banned; enforceability tradeoff knowingly accepted.
- 2026-08-09: Fleet-wide run completed (Recruiterbase 7dc38f4, StonedGPT 98ab0f5, Brandflare 0330033, hub 34ade5d) — every app now at the Ghostplug gold standard. Snapshot changes: chatbot laws now 7+ states / 3 PRAs after OR SB 1546 and WA HB 2225, both eff. 2027-01-01 (https://www.orrick.com/en/Insights/2026/04/2026-State-Chatbot-Laws-Key-Provisions-and-Regulatory-Trends, Tier 2); Negative Option ANPRM formally published March 2026 (https://www.federalregister.gov/documents/2026/03/13/2026-04952/rule-concerning-the-use-of-prenotification-negative-option-plans, Tier 1); DE/MT/NJ cure periods lapsed (Baker Donelson, Tier 2). All other claims re-verified unchanged.
<!-- EVOLVING:END -->

## Fleet map

| App | Repo | Domain | Legal pages | Entity named |
|---|---|---|---|---|
| Ghostplug | `~/code/hypertheory/ghostplug` | ghostplug.ai | `app/(marketing)/privacy/page.tsx`, `app/(marketing)/terms/page.tsx` | Hypertheory LLC (CA) |
| Brandflare | `~/code/hypertheory/brandflare` | brandflare.ai | `app/(marketing)/privacy/page.tsx`, `app/(marketing)/terms/page.tsx` | Brandflare LLC (DE) |
| StonedGPT | `~/code/hypertheory/stonedgpt` | stonedgpt.ai | `app/(marketing)/privacy/page.tsx`, `app/(marketing)/terms/page.tsx` | — |
| Recruiterbase | `~/code/hypertheory/recruiterbase` | recruiterbase.co | `app/privacy/page.tsx`, `app/terms/page.tsx` | — |
| Hypertheory | `~/code/hypertheory/hypertheory` | hypertheory.ai | none (create minimal notice) | Hypertheory LLC (CA) |

Running against "all apps": iterate the table, one repo at a time; Phase 0 runs once per sweep. The gold-standard clause set lives in this file (below), not in a reference repo — after the first full run, the best in-fleet implementation becomes the working reference.

## Phase 1 — Inventory reality (read-only, per app)

The code is the source of truth; the documents are the claim under audit. Build the factual record first — use parallel Explore agents for speed on multi-app runs:

1. **Data collected**: auth fields, DB schema PII (users AND non-users), uploaded content, contact forms, phone/SMS, payment data locality.
2. **Third parties that actually receive data** (grep deps + `.env.local` names + client libs): payments, AI providers (and exactly WHAT user data enters prompts), email senders, scrapers/enrichment (Apify, Exa, MillionVerifier, Tavily, Serper), analytics, hosting/DB.
3. **Automated actions on users' behalf** and on third parties: posting, scraping, cold outreach, AI drafting/sending.
4. **Tracking**: cookies actually set, `lib/pageview.ts` presence, pixels, local storage.
5. **Email flows**: transactional vs marketing, who sends, unsubscribe/suppression mechanics, footer content (in-repo or delegated to SmartLead/Resend config).
6. **Retention/deletion**: every promise in the current policy vs an actual implementing job/route.
7. **Assent mechanics**: signup UI — checkbox? linked terms? acceptance recorded with version?
8. **Age posture**: gate/attestation vs product sensitivity.
9. **Subscription mechanics**: auto-renewal disclosure at checkout, Stripe portal cancellation enabled, refund language.

## Phase 2 — Audit the documents

Diff the documents against (a) the Phase 1 factual record and (b) the gold-standard clause checklist:

**Truthfulness (fix every mismatch, both directions):** every named vendor exists in code; every code vendor is named; no phantom features (SMS, platforms never shipped); retention/deletion claims implemented; "we don't sell/train/share" claims verified; posting/automation mechanics described accurately; analytics identifiers (hashed IP) disclosed; correct email provider named; correct entity name everywhere; real, monitored contact email on both documents; "Last updated" is the real date.

**Gold-standard protective clause checklist (terms):** binding individual arbitration (AAA Consumer Rules, small-claims carve-out, delegation clause, 30-day opt-out, mass-arbitration batching provision) + class-action and jury-trial waiver; liability cap (greater of trailing-12-month fees or $100); AS-IS warranty disclaimer; user indemnification; governing law + venue matching the operating entity's state (Hypertheory LLC is a CALIFORNIA LLC, confirmed by user 2026-07-22, so its products use California; Brandflare LLC's formation state is unconfirmed, so verify before drafting its governing-law clause); AI-output disclaimer (accuracy not warranted, user reviews before reliance/publication); user responsibility for their platform accounts and applicable ad-disclosure law; IP ownership split; acceptable-use; termination; refund/renewal terms consistent with ROSCA + Stripe reality; unilateral-amendment-with-notice clause; severability; DMCA/repeat-infringer policy where UGC exists; 18+ (or 21+ where warranted) eligibility; entity's correct legal name.

**Privacy policy structure:** categories collected (users AND non-users where applicable); sources (including scraping/enrichment — named); purposes; complete subprocessor list; AI-provider flows stated plainly; retention that matches code; rights + a real exercise channel (email that works, removal flow where non-user data exists); state-law rights section (access/delete/opt-out honored regardless of thresholds); "Do Not Sell or Share" link IF the app sells/shares (Recruiterbase); children/age statement matched to product sensitivity; no GDPR promises unless actually operationalized.

## Phase 3 — Fix (bucketed)

- **Bucket A — documents (autonomous):** rewrite per Phase 2. Smallest true diff; keep each app's existing page structure/styling; never weaken; draft at protective altitude (accurate, general, no operational mechanics).
- **Bucket B — additive peripheral code (autonomous):** passive assent notice + versioned server-side acceptance record on auth (mirror Ghostplug's implementation; never a checkbox or gate); new legal pages; working contact/removal channel where non-user data demands it; unsubscribe endpoint only where the app itself sends marketing email. Broken retention promises are fixed by amending the policy — never by adding jobs that delete product data. Each Bucket B item gets its own justification line in the report; if a user could perceive it as the product changing, it's Bucket C.
- **Bucket C — report only:** every ▲ item not marked `[ACCEPTED]`. For each: plain-language risk, who could sue/fine and under what, 2–3 options with tradeoffs, and whether an attorney hour is warranted. Never implement. `[ACCEPTED]` items get a one-line standing note at most.

Verify: `npx tsc --noEmit` per touched repo; re-read final documents for internal consistency (ToS and privacy must agree with each other); confirm no protective language was lost. Commit to main + push, one commit per repo.

## Phase 4 — Report

Per app: findings table (finding / door-number from the threat model / bucket / status), documents diff summary, Bucket B code changes with justification, Bucket C decision list ranked by exposure, and out-of-repo TODOs (SmartLead footer verification, DMCA agent registration, existing-customer ToS notice, entity confirmations, GSC-style external configs). End with the single highest-leverage next action per app and update the fleet risk map block. Note whether the landscape snapshot changed.

## What this skill does NOT do

- **No legal advice** — work product for attorney review, and it says so when stakes warrant.
- **Never changes product behavior or business model** — no disabling features, no removing scrapers/proxies/posting flows, no altering pricing or refunds in code. Those are Bucket C decisions.
- **Never fabricates compliance** — no "GDPR compliant" badges, no promised rights without a mechanism, no disclosure written to launder a practice that remains deceptive in substance.
- **No external filings or sends** — DMCA registration, LLC checks, customer-notice emails, SmartLead campaign edits (read-only API checks only; bulk campaign writes are banned by standing rule) are TODOs for the user.
- **No self-edits outside the EVOLVING blocks, ever.** If research suggests the procedure itself is outdated, report it; the user changes STABLE sections.
