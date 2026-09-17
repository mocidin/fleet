---
name: optimize-seo
description: Audit and upgrade SEO for the whole Hypertheory fleet surface — the product apps (Ghostplug, Brandflare, StonedGPT, Recruiterbase, Hypertheory, and any app added to the fleet later; the skill discovers the current roster at run time) to current Next.js App Router best practices, AND the cold-outreach sales domains (email-landing project) whose job is staying OUT of the index — verified against live Google Search Console data plus live SERP checks (Serper). Self-evolving — every run re-verifies best practices via web research against official sources and updates this skill's own evolving sections. Covers metadata, robots.ts, sitemap.ts, canonicals, JSON-LD structured data, OG images, SEO content pages, auth-proxy interception of SEO routes, and sales-domain deindexing — using Recruiterbase as the in-fleet reference implementation.
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

# Optimize SEO Skill

Bring the current repo (or a named fleet app) up to the fleet's SEO gold standard, then verify with live data. The in-fleet reference implementation is **Recruiterbase** (`~/code/hypertheory/recruiterbase`) — when in doubt, mirror it.

## Autonomous operation (no approval gates)

This skill runs end-to-end without stopping to propose or ask. There is no separate audit-and-wait phase: the inventory and live-data checks feed directly into applying fixes.

- **Decisions come from evidence, not user confirmation.** Every fix is gated on a concrete verification — `npx tsc --noEmit` passing; a live `curl` confirming the `<title>` / robots / canonical tags and `/robots.txt` + `/sitemap.xml` returning 200s (not redirects); GSC checks — NOT on the user approving it.
- **All technical fixes are applied automatically**, mirroring Recruiterbase's patterns: robots.ts, sitemap.ts, metadata completeness, canonicals, JSON-LD structured data, OG image config, wrong-domain link corrections, and (hypertheory only) containment.
- **Net-new SEO content pages are generated autonomously — but QUALITY-gated, never volume-maximized.** The skill chooses sensible topics from the app's own product domain and generates them mirroring the Recruiterbase `/guide` article scaffold — no waiting for the user to pick topics. Publishing thin, mediocre, or near-duplicate articles actively HARMS SEO (Google's spam and helpful-content signals), so more is NOT better: generate only genuinely substantive, original, on-domain articles that clear the Recruiterbase quality bar. Cap net-new pieces to a small number you can make excellent (default ≤3 per run) and skip-and-note any topic you can't. Quality — not tsc/curl — is the gate for content; when in doubt about a piece's quality, do not publish it. This does NOT relax the anti-spam rules in "What this skill does NOT do": still no keyword stuffing, doorway pages, or thin/auto-generated filler — real, useful articles only.
- **Uncertain ⇒ skip-and-note, never ask.** When a fix can't be verified non-breaking, skip only that item, note it in the report, and keep going with the rest.
- **Quadruple-check nothing broke.** `npx tsc --noEmit` must pass in every touched repo; re-curl the live endpoints; re-verify that no metadata was weakened (only enriched) and no console logs were removed. Finish by committing to main and pushing (one commit per repo, per global rules) — never leave findings sitting in a "waiting for approval" state.
- **Commit safety.** Commit only the paths this run changed — never `git add -A`/`git add .`; pre-existing uncommitted work stays untouched. Never `git restore` a file that was already dirty before the run. If a repo isn't a git repo or isn't on `main`, note it and skip that repo's commit rather than failing the run.

## Operating doctrine — reason from first principles

Before changing anything, ask: "if this app's SEO were built correctly from scratch today against the fleet gold standard (Recruiterbase), what would it look like?" Then close the gap — don't just patch the nearest missing tag.

- **Root cause over local patch.** If every page repeats the same metadata mistake, fix it at the shared source (the metadata helper, the layout, the sitemap generator) so all pages are corrected at once.
- **Large refactors are in scope, not feared.** Restructuring content into the Recruiterbase route-per-article pattern, replacing a static robots.txt with `app/robots.ts`, unifying a hand-maintained sitemap into a data-driven one — all welcome WHEN the end-state matches the standard and is verifiable (`tsc` + live curl). Scope is bounded by *verifiability*, never by size.
- **The one hard limit is "don't break anything" — and for content, "don't harm rankings."** Technical fixes are fully verifiable (tsc, curl of tags + 200s) and applied automatically. Content correctness is NOT verifiable by a compiler — it rests on editorial quality, so it is held to a higher bar (below).
- **Leave it better.** Fewer metadata gaps, one canonical pattern, real content that earns its place. Never enrich for its own sake; never publish anything that could dilute the site.

## Self-evolution protocol (read first, follow exactly)

This file maintains itself. Two region types:

- **STABLE** — everything outside `EVOLVING` markers: the frontmatter, this protocol, the phase procedure, the fleet-discovery rules and Layer 2 contract, and "What this skill does NOT do". **Never modified by a skill run.** Only the user (or an explicit user request) changes STABLE content.
- **EVOLVING** — the blocks between `<!-- EVOLVING:START ... -->` and `<!-- EVOLVING:END -->` markers: the best-practices snapshot, the changelog, and the fleet roster. These are the ONLY parts a run may rewrite.

**Phase 0 of every run — refresh the snapshot:**

1. Run the standardized queries (all of them, verbatim):
   - `Next.js app router metadata API generateMetadata` 
   - `Next.js sitemap.ts robots.ts file conventions`
   - `Google Search Central documentation updates structured data`
   - `Next.js <current major version> SEO changes` (substitute the major version found in the target repo's package.json)
2. Source hierarchy — a practice may only be added/changed in the snapshot when confirmed by a **Tier 1** source: nextjs.org/docs, developers.google.com/search, vercel.com/docs. Tier 2 (vercel blog, web.dev) may corroborate but never solely justify a change. Blogs/SEO sites are signal only — verify against Tier 1 before acting.
3. Diff findings against the snapshot below. If nothing changed, update only the `Last verified:` date. If something changed, rewrite the affected snapshot lines and append ONE changelog entry: `- YYYY-MM-DD: <what changed> (<Tier 1 source URL>)`.
4. **Self-edit safety rules:**
   - Edit only between the EVOLVING markers. Never touch frontmatter or STABLE sections, never rename/move this file, never edit the markers themselves.
   - After any self-edit, re-read the file and verify: frontmatter delimiters intact, all three `EVOLVING:START`/`EVOLVING:END` marker pairs present, all `## ` phase headings present. If broken, immediately restore the damaged section from the version still in context — do not proceed to the audit with a broken skill file.
   - Changelog is append-only; never delete or rewrite past entries. If it exceeds ~30 entries, compact the oldest 15 into a single dated summary line.
   - If web research is unavailable (offline, tool denied), skip Phase 0, note "snapshot not refreshed this run" in the report, and proceed with the existing snapshot — never block the audit on it.
5. Deprecations flow one way: a practice removed from the snapshot gets a changelog line saying why. The audit then treats occurrences of the deprecated pattern in repos as gaps to fix.

<!-- EVOLVING:START best-practices snapshot -->
## Current best-practices snapshot

Last verified: 2026-08-31 (re-verified against nextjs.org/docs file-convention pages + developers.google.com/search/updates; no snapshot-affecting changes — FAQ rich-result removal already recorded, robots.ts/sitemap.ts conventions unchanged, metadata special routes cached by default)

- **Metadata**: static `export const metadata` for fixed pages, `generateMetadata` for dynamic; root layout must set `metadataBase`; every public page gets unique `title`, `description`, `alternates.canonical`, OpenGraph, Twitter card. **Landing/home page `title` is the bare brand name** (e.g. `"Ghostplug"`) — no tagline or description in the browser tab; the descriptive headline lives in `description` + the OpenGraph/Twitter `title` (which feed social-share cards, not the tab). Content/article pages keep the `"<Topic> | <Brand>"` pattern. (User standing preference, fleet-wide — supersedes the earlier "brand-only titles are a bug" guidance. Tradeoff: a bare-brand tab title is weaker for SERP disambiguation on name-colliding apps like Ghostplug; do NOT re-add a tagline to the home `<title>` as an SEO "fix" — surface it as a GSC-CTR note instead.)
- **Robots**: `app/robots.ts` (MetadataRoute.Robots) — not a static public/robots.txt; allow `/`, disallow auth/dashboard/admin/api routes, declare `sitemap:`.
- **Sitemap**: `app/sitemap.ts` (MetadataRoute.Sitemap) covering every public page with `lastModified`/`changeFrequency`/`priority`.
- **Structured data**: inline `<script type="application/ld+json">` in server components. Landing: Organization + WebSite (+ SoftwareApplication where true). Content pages: Article + BreadcrumbList. FAQPage markup no longer yields rich results (dropped from Google Search 2026-05-07) — existing markup is harmless, but don't add it as an SEO measure and don't count its absence as a gap.
- **OG images**: `app/opengraph-image.(png|tsx)` + `twitter-image.*` file conventions; dynamic generation via `next/og` ImageResponse is preferred for per-page images.
- **Rendering**: public marketing/content pages are server components with real text in the HTML payload; no client-only shells, no auth gate on `/`.
- **Content architecture** (Recruiterbase pattern): route-per-article with `content.mdx` + `page.tsx` carrying metadata + JSON-LD; hub page and sitemap driven by one shared posts array; breadcrumbs Home > Hub > Article; explicit `publishedTime`/`dateModified`.
- **GSC mechanics**: data lags ~2 days — end query windows 2 days back. Domain properties (`sc-domain:`). URL Inspection API separates "not indexed" from "indexed but not surfacing". Position is an average over impressions only — always read it alongside the impression count, and treat single-digit-impression positions as "when shown at all", not standing.
- **Deindexing mechanics** (developers.google.com/search/docs/crawling-indexing/block-indexing): noindex works only on crawlable pages — a robots.txt disallow hides the tag and freezes the stale index entry. To remove an indexed page, allow crawling and serve noindex.
<!-- EVOLVING:END -->

<!-- EVOLVING:START changelog -->
## Changelog

- 2026-06-12: Initial snapshot authored from fleet audit session (nextjs.org/docs metadata + file-convention pages current as of this date).
- 2026-06-12: FAQPage demoted — Google dropped FAQ rich results from Search as of 2026-05-07; FAQ search appearance + rich-result report being removed June 2026 (https://developers.google.com/search/updates).
- 2026-06-14: Landing/home page `<title>` standardized to the bare brand name (no tagline) — user standing preference, fleet-wide. Supersedes prior "brand-only titles are a bug" guidance; descriptive headline retained in description + OG/Twitter titles. (User directive, not a Tier 1 best-practice change.)
- 2026-08-31: Snapshot re-verified, no Tier 1 changes. Added GSC position/impression caveat and deindexing mechanics (noindex requires crawlability — https://developers.google.com/search/docs/crawling-indexing/block-indexing). Same day, at the user's explicit request, STABLE sections expanded fleet-wide: Layer 2 sales-domain surface (email-landing), the auth-proxy robots/sitemap interception landmine (found live on ghostplug.ai + hypertheory.ai), the Serper live-SERP check with query-rewrite diagnosis, and the marketing-card `fetchSeoSummary` pointer.
- 2026-08-31: Fleet roster made self-maintaining at the user's request — the app table moved into a third EVOLVING block that every run refreshes by discovering repos under ~/code/hypertheory/, with a STABLE new-app SEO onboarding checklist so future apps are folded in automatically.
<!-- EVOLVING:END -->

## Fleet map — the SEO surface has TWO layers

**The fleet GROWS — discover it, never trust the roster blindly.** New apps get added over time, so the roster table below is an EVOLVING cache, not the source of truth. At the start of every run (right after Phase 0), refresh it:

1. `ls ~/code/hypertheory/` and take every directory that is a Next.js app repo (has `package.json` with a `next` dependency). Skip `archive`. Skip repos whose own `CLAUDE.md` marks them as outside the fleet.
2. For each repo not in the roster (or with stale notes), read its `CLAUDE.md` to learn its role and domain, and check the standard file set (robots.ts, sitemap.ts, OG generators, proxy matcher exclusions, content hub).
3. Rewrite the roster block to match reality — add new apps, update stale notes, and only ever delete a row when the repo is actually gone. A brand-new app additionally gets the "New-app SEO onboarding" checklist below as its Phase 3 work list.
4. Cross-check completeness: the hub's marketing `APPS` array (`hypertheory/app/admin/marketing/actions.ts`) and metrics app list name every app Dom actively markets; an app there but not in the roster (or vice versa) is a finding.

**New-app SEO onboarding checklist** (everything a fresh fleet app needs; mirror Recruiterbase for 1-6):

1. `app/robots.ts` + `app/sitemap.ts`, and the auth-guard matcher line that excludes `robots.txt|sitemap.xml` (the Phase 1 proxy landmine — new apps forked from an older sibling inherit the broken matcher).
2. Full metadata per the snapshot: `metadataBase` from the site-URL helper, bare-brand home title, canonicals, OG/Twitter.
3. Programmatic OG/Twitter/apple-icon generators off `app/icon.svg` (fleet icon standard).
4. JSON-LD on the landing page (Organization + WebSite, SoftwareApplication where true).
5. Server-rendered public pages, no auth gate on `/`.
6. A `/guide`-style content hub when the product domain supports genuinely useful articles (quality-gated as always).
7. GSC domain property — surface it for Dom to verify (skill can't create it); the impersonating client then sees it automatically.
8. If the app gets cold outreach: its sales domains go through email-landing under the Layer 2 contract, never through the product app.

**Layer 1: product apps (goal = rank).**

<!-- EVOLVING:START fleet roster -->
Roster last refreshed: 2026-08-31

| App | Repo | Domain | Notes |
|---|---|---|---|
| Ghostplug | `~/code/hypertheory/ghostplug` | ghostplug.ai | Reddit product. Name collides with generic "ghost plug" SERP AND Google spell-corrects "ghostplug" queries toward "ghost blog" (entity not yet recognized, verified 2026-08-31) — needs strong disambiguation (rich titles, entity signals, off-site mentions). |
| Brandflare | `~/code/hypertheory/brandflare` | brandflare.ai | LinkedIn product (fork of ghostplug). |
| StonedGPT | `~/code/hypertheory/stonedgpt` | stonedgpt.ai | Full metadata file set present (robots, sitemap, OG/Twitter/apple-icon generators). No content hub yet. |
| Recruiterbase | `~/code/hypertheory/recruiterbase` | recruiterbase.co | **Gold standard** — full checklist implemented, incl. the `/guide` content hub. |
| Hypertheory | `~/code/hypertheory/hypertheory` | hypertheory.ai | Internal admin hub. SEO goal is *containment*: robots.ts disallowing /admin /api /auth, noindex on admin layout. No sitemap.ts, by design. Not a marketing site. |
<!-- EVOLVING:END -->

**Layer 2: cold-outreach sales domains (goal = stay OUT of the index).** All 13+ sales domains (gethypertheory.com, getghostplug.com, the InboxKit clusters, etc. — the authoritative roster lives in the hub `domain` table and the domain-infrastructure project memory) serve one-page landings from the **`email-landing`** Vercel project. Repo `mocidin/email-landing`, **GitHub-only by Dom's choice — no local checkout; edit via the GitHub API and every push to main auto-deploys.** Their exclusion contract (corrected 2026-08-31):

- The `noindex, nofollow, nocache` meta in `app/layout.tsx` is the ONLY exclusion mechanism.
- `app/robots.js` must **ALLOW** crawling. NEVER add a robots disallow there: Google only honors noindex on pages it can fetch, and a crawl block hides the tag — gethypertheory.com sat frozen in the index from the pre-noindex era and outranked ghostplug.ai for "ghostplug ai" exactly this way.
- Staying deindexed is load-bearing: it keeps the cluster of near-identical sibling domains out of doorway-page scoring and stops them competing with the product site for its own brand terms. A sales domain surfacing for a product brand query is a red-flag finding, not a curiosity.
- These domains have NO GSC properties, deliberately. Verify them with live curls and Serper, not GSC.

Running against "all apps": iterate the Layer 1 table, one repo at a time, same phases, then run the Layer 2 checks once; Phase 0 runs once for the whole sweep, not per repo.

## Phase 1 — Inventory (read-only)

For the target repo, check each snapshot item and build a gap table. Read Recruiterbase's implementation side-by-side for the canonical pattern (`app/robots.ts`, `app/sitemap.ts`, `app/guide/*/page.tsx`):

1. robots.ts per snapshot. **THE PROXY LANDMINE (found 2026-08-31): a correct robots.ts/sitemap.ts in the repo proves NOTHING about what crawlers see.** Every fleet app's auth guard (`proxy.ts`, matcher-based) runs before Next's metadata routes; unless the matcher's negative lookahead explicitly excludes `robots.txt|sitemap.xml`, the proxy 307-redirects both to `/auth` and Google can never read them — ghostplug.ai and hypertheory.ai shipped this way for months while their robots.ts files looked perfect in code review. The fix is the Brandflare matcher line (`...|favicon.ico|robots.txt|sitemap.xml|...`). Check the matcher in EVERY app's proxy.ts, and treat the Phase 2 live curl as the only proof.
2. sitemap.ts per snapshot.
3. Metadata completeness on every public page.
4. JSON-LD per snapshot.
5. OG images per snapshot.
6. Server rendering of public pages.
7. Domains — no hardcoded wrong-domain links (grep for all sibling domains; past bug: brandflare's LogoSlider linked dead `ghostplug.com`). Cross-link fleet sites where natural — internal-fleet backlinks are the cheapest link equity available.
8. SEO content pages — `/guide`-style hub presence.
9. Containment (hypertheory only) — admin/private routes disallowed in robots AND noindex'd in layout metadata.
10. Sales-domain layer (Layer 2, once per sweep) — read `app/robots.js` and `app/layout.tsx` in `mocidin/email-landing` via the GitHub API: robots must allow crawling, layout must carry the noindex meta. Then curl a sample of live sales domains (`/robots.txt` must serve `Allow: /`, homepage must carry `noindex` in meta robots).

## Phase 2 — Verify with live data

Four independent checks; run all:

1. **GSC search analytics** — fleet service-account JSON key (`hypertheory@hypertheory-gc`) in `hypertheory/.env.local` as `GOOGLE`; client pattern in `hypertheory/lib/gsc/client.ts` (impersonates dom@ via domain-wide delegation, so every property Dom owns is readable — no per-property grants). Pull last-28-day totals, top queries, top pages, and the brand-name query specifically. **Read positions with the impression count next to them: GSC position averages ONLY the impressions where the site appeared at all.** A "position 2.8" on 4 impressions/28d means "on the rare occasions we showed, we were #3" — it says nothing about the default SERP, where the site may be absent entirely (the exact trap behind the marketing card's "#3 for ghostplug ai", 2026-08-31). Never report a GSC brand position without its impression count, and pair thin-sample positions with check 4.
2. **URL Inspection API** — same credentials, scope `https://www.googleapis.com/auth/webmasters`, `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` with `{inspectionUrl, siteUrl: "sc-domain:<domain>"}`. Read `verdict`, `coverageState`, `googleCanonical`, `lastCrawlTime`.
3. **Live-site spot checks** — `curl` homepage for `<title>`, meta robots, canonical; `curl -I /robots.txt` and `/sitemap.xml` (expect 200s, not redirects — a 307 to /auth is the proxy landmine from Phase 1).
4. **Live SERP (Serper)** — `SERPER` key in `hypertheory/.env.local`; client pattern in `hypertheory/lib/serper/client.ts`. Query the brand name and its realistic forms (`<brand> ai`, `<brand> app`) with `gl: 'us', hl: 'en'` and scan the full organic list. Two things to read off it: (a) whether the app actually appears, and where — a found rank is trustworthy, but a fresh domain "dances" (same query returns #2, #8, absent within a minute), so accept ABSENCE only after 3 misses in a row (the client already does this); (b) **whether Google rewrote the query** — when the results are about something else entirely (Ghost CMS for "ghostplug ai") or the page says "Including results for ...", Google spell-corrected the brand away, which means the entity isn't recognized yet. That is an off-site problem (mentions, links, brand demand); no on-site fix changes it. Also confirm no sales domain appears for any product brand query.

The hub's own rank surface — the marketing card — is computed in `hypertheory/app/admin/marketing/actions.ts` `fetchSeoSummary` (GSC 28-day rank window + alt query forms + Serper fallback). When Dom asks "why does the card say X", read that function first; its number is honest to GSC but inherits the thin-sample caveat above.

Diagnosis guide: indexed + zero brand impressions → off-site problem (mentions/links/demand), not code. Impressions at position ≤10 but ~zero clicks → title/description CTR problem. Not indexed → crawl/robots/canonical problem. GSC shows a good position on single-digit impressions while Serper shows the site absent → query-rewrite/entity problem, report it as "not surfacing", never as the GSC number. A sales domain ranking for a product brand term → stale index entry; verify email-landing's robots allows crawling so the noindex can be seen, then wait out the recrawl (never "fix" it by blocking crawl).

## Phase 3 — Fix

Apply gaps found in Phase 1, smallest diff possible, replicating Recruiterbase's exact patterns. Rules:

- New `robots.ts`/`sitemap.ts` mirror Recruiterbase verbatim, adjusted for the app's routes.
- Proxy matchers missing the `robots.txt|sitemap.xml` exclusion get the Brandflare matcher line copied in; re-curl the live URLs after the app deploys.
- Sales-domain fixes are edited in `mocidin/email-landing` via the GitHub API (no local checkout exists); a push there IS a deploy of all sales domains at once, so verify with a live curl of one domain afterward.
- Never weaken existing metadata; only enrich. Never remove existing console logs.
- Generate `/guide` content pages autonomously — pick sensible topics from the app's product domain and copy the Recruiterbase article scaffold. This is QUALITY-gated, not volume-maximized: thin/mediocre/near-duplicate articles actively HARM SEO (Google spam + helpful-content signals), so more is NOT better. Publish only genuinely substantive, original, on-domain pieces that clear the Recruiterbase quality bar; cap net-new pieces to a small number you can make excellent (default ≤3 per run) and skip-and-note any topic you can't. Quality — not tsc/curl — is the gate for content; when in doubt, do not publish. Never thin/spam content (see "What this skill does NOT do").
- Sitemap `lastModified` arrays are manual — update them whenever content pages change.
- `npx tsc --noEmit` must pass in every touched repo before committing. Commit to main, push (per global rules). One commit per repo.

## Phase 4 — Report

Per app: gap table (item / before / after), GSC snapshot (clicks, impressions, brand-query position or "not surfacing"), whether the best-practices snapshot changed this run (and what), and the off-site TODOs code can't fix (Reddit post cadence, entity anchors: LinkedIn page, X, GitHub org, Product Hunt, Crunchbase). End with the single highest-leverage next action per app.

## What this skill does NOT do

- No keyword stuffing, doorway pages, or auto-generated thin content.
- Never adds a robots.txt disallow to the sales domains (email-landing), and never removes their noindex meta — the allow-crawl + noindex pair is the deindexing mechanism and both halves are load-bearing.
- Never tries to make a sales domain rank; their success metric is absence from the index.
- No off-site actions (posting, link building) — it reports those as TODOs.
- No GSC property creation/verification — if a domain's property is missing, surface it (Dom verifies the domain in GSC; the impersonating client then sees it automatically).
- No self-edits outside the EVOLVING blocks, ever — even if a web source suggests the procedure itself is outdated. In that case, report the suggestion to the user and let them change the STABLE sections.
