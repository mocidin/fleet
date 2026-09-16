---
name: audit-subscriptions
description: Read-only audit of Stripe subscriptions against the database `brands` table. Cross-references every Stripe subscription with the brand row that points to it, flags orphans (in one but not the other), status mismatches, period-end drift, impression drift, and duplicate customers/subscriptions per email. Takes NO actions — produces a single concise summary the user can act on. Use when the user asks to "audit subscriptions", "check Stripe sync", "find orphaned subs", "verify backend matches Stripe", or after any webhook outage / suspected discrepancy.
allowed-tools:
  - Bash
  - Read
  - TodoWrite
  - mcp__stripe__list_subscriptions
  - mcp__stripe__list_customers
  - mcp__stripe__fetch_stripe_resources
  - mcp__stripe__search_stripe_resources
  - mcp__supabase__execute_sql
  - mcp__supabase__list_tables
---

# Audit Subscriptions Skill

Reconcile two sources of truth for paying customers and find every discrepancy:

1. **Stripe** — every non-canceled subscription (`active`, `trialing`, `past_due`, `unpaid`, `incomplete`).
2. **Database** — every row in `brands` where `metadata->>'subscription'` is non-null.

The goal: report cleanly what's out of sync so the user can decide what to do. **Never act.**

## Non-negotiable rules

1. **READ-ONLY.** Never call write operations on either system. No `UPDATE`, no `INSERT`, no `DELETE`, no Stripe cancel/create/update operations. If the user asks the skill to fix something, refuse and tell them to invoke the fix manually after reviewing the audit.
2. **Never print full secrets or full customer payment details.** Subscription IDs, customer IDs, emails, brand names are fine. Card numbers, full Stripe API keys, raw JWT contents are not (the MCP tools won't return these, but be aware).
3. **Don't paginate forever.** Pull up to 100 of each resource per query — that's the Stripe/Supabase limit. If a category has >100 matches, say so explicitly in the report rather than silently truncating ("⚠ 100+ subscriptions returned, results may be incomplete — narrow the audit by status").
4. **Output is a single concise summary.** No multi-page wall of text. If everything is synced, the report is ~5 lines. If discrepancies exist, list them with enough detail (IDs, names) for the user to act manually, but no more.

## Required pre-flight

Before running the audit, verify the two MCP servers are connected:
- `mcp__supabase__execute_sql` available → Supabase MCP connected
- `mcp__stripe__list_subscriptions` available → Stripe MCP connected

If either is missing, tell the user to reconnect via `/mcp` (project Stripe is in `.mcp.json`, not the claude.ai one) and stop. Do not attempt a partial audit.

## Audit categories

Run all checks. For each, count and list specific offenders. Skip a category in the summary only if it has zero findings.

### A. Orphaned in Stripe (live in Stripe, missing from DB)
Subscriptions in Stripe with status in (`active`, `trialing`, `past_due`, `unpaid`) that no `brands` row references via `metadata->>'subscription'`.

Detection:
```sql
-- Fetch all DB subscription IDs once
SELECT metadata->>'subscription' AS sub_id
FROM brands
WHERE metadata->>'subscription' IS NOT NULL;
```
Compare against Stripe's `list_subscriptions(status='all', limit=100)` filtered to non-canceled statuses. Any Stripe sub ID not in the DB set is an orphan.

For each orphan, include: subscription ID, status, customer ID, customer email (lookup via `fetch_stripe_resources` on the customer ID).

### B. Stale in DB (referenced in DB, gone from Stripe)
Brand rows with a `subscription` ID that returns nothing or status=`canceled` when looked up in Stripe.

Detection: for each DB sub_id, call `fetch_stripe_resources(id=sub_id)`. If 404 or status=`canceled`, it's stale.

For each stale row, include: brand name, brand ID, sub ID, Stripe status (canceled / not found).

### C. Period-end drift
For each brand where `metadata->>'subscriptionEnd'` (integer epoch) differs from the matched Stripe sub's `items.data[0].current_period_end`.

Tolerance: 0 (exact match expected — the webhook handler writes `current_period_end` verbatim).

For each mismatch, include: brand name, DB end, Stripe end, delta in days.

### D. Impressions drift
For each brand where `metadata->>'impressions'` differs from the Stripe product's `metadata.impressions` (must `fetch_stripe_resources` on the product ID via the price → product chain).

For each mismatch, include: brand name, DB impressions, Stripe product impressions.

### E. Status flag drift
- Stripe status = `past_due` OR subscription has `pause_collection` set, but brand `metadata->>'pastDue'` is null → flag missing.
- Brand `metadata->>'pastDue'` is set but Stripe status is `active` and no pause → flag stale (should have cleared).
- Stripe subscription has `cancel_at_period_end=true` but brand `metadata->>'canceling'` is null → flag missing.
- Brand `metadata->>'canceling'` is set but Stripe `cancel_at_period_end=false` → flag stale.

### F. Multiple active subs per customer
Group all non-canceled subs by customer ID. Any customer with >1 active sub is suspect (legitimate in rare cases, usually a duplicate from retry-during-outage).

For each, include: customer ID, customer email, list of subscription IDs.

### G. Duplicate customer records per email
Use `list_customers` and group by email. Multiple `cus_` records for the same email indicate Stripe created a fresh customer on a re-checkout (e.g., during a webhook outage). Even if only one is currently active, flag all duplicate-email customers so the user can decide if they want to merge.

For each, include: email, list of customer IDs.

## Report format

Print exactly this structure. Sections with zero findings are still listed with the count `0`. The header `### ✅ All synced` appears only if all seven categories return zero.

```
## Subscription Sync Audit

| Category | Count |
|---|---|
| A. Orphaned in Stripe (live sub, no brand) | N |
| B. Stale in DB (brand points at gone/canceled sub) | N |
| C. Period-end drift | N |
| D. Impressions drift | N |
| E. Status flag drift (pastDue / canceling) | N |
| F. Customers with multiple active subs | N |
| G. Emails with multiple customer records | N |

### Details
[Only include sections with findings. Use the per-category detail format above.]
```

If every count is 0, replace the Details section with `### ✅ All synced` and stop.

## What the skill must NOT do

- Do not propose fixes. The user asked for a status report, not a remediation plan.
- Do not delete, update, cancel, or create anything in Stripe or the DB.
- Do not run schema migrations.
- Do not commit anything to git.
- Do not write to the `brands` table even if a discrepancy looks "obviously safe" to fix (e.g., a missing `canceling` flag). The user will choose.

## After the audit

End with a single line: `Audit complete. Tell me which discrepancies (if any) you want to act on.`

Wait for the user's response. If they ask you to fix something, only then proceed — and only on the specific items they name, one at a time, with explicit confirmation for each Stripe-side write.
