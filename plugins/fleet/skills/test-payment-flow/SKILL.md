---
name: test-payment-flow
description: Programmatically test a fleet app's LIVE Stripe payment conversion end to end with zero dollars, zero human involvement, and zero permanent Stripe bloat - real hosted checkout completed headlessly via a 1-day trial session, real success redirect, real webhook fulfillment verified in the app's DB, then the churn path (cancel reverts access), then full cleanup. This is Dom's standing directive (2026-09-01) for ANY "make sure the payment flow is working", "is checkout broken", "people signed up but nobody paid" request about any fleet app - run this exact drill and confirm, never settle for code reading alone. Also use for "test the payment flow", "test checkout", "verify payments work", "test the conversion/redirect", or after any change to checkout, payment links, webhooks, or fulfillment code.
---

# Test Payment Flow (live, programmatic, $0)

Proven working on Recruiterbase 2026-09-01 (the reference run). Works on any fleet app whose checkout is Stripe-hosted (payment links or Checkout Sessions) with a webhook that fulfills.

## What it proves

1. The live hosted checkout page completes (real Stripe, real session).
2. The success redirect chain lands back in the app.
3. The webhook marks the right user paid with the right plan and expiry.
4. The churn path: canceling revokes access.

The ONLY untested step is Stripe's own card-entry box (Stripe-hosted, not our code) and an actual charge. State that caveat in the report.

## Hard rules

- **NEVER create products, prices, coupons, or payment links.** The test session reuses the app's EXISTING live price. Creating catalog objects is Stripe bloat; a 100%-off coupon is inferior to the trial trick below and leaves an object behind. The one way catalog bloat can sneak in is `price_data`/`product_data` inline params on the session-create call, which silently mint new price and product objects: BANNED, always pass the existing `price` id. Never touch test mode either; the fleet is live-mode-only and every call uses the app's live key.
- **Everything gets cleaned up, even if the test fails midway.** Cancel the subscription, delete the Stripe customer, delete the throwaway auth user, re-verify all three are gone before reporting. A trial sub left running will attempt a real invoice at trial end with no card and spray payment-failed noise.
- **Never touch real customer objects.** Only objects created inside this test may be canceled or deleted.
- Throwaway email MUST contain "test" (e.g. `<app>.payflow.test@hypertheory.ai`) so the hub's isTestEmail filter keeps it out of Activity/Metrics.
- Script and node_modules live in the session scratchpad, never the repo.
- Unavoidable residue, disclose it, don't fight it: one canceled $0 subscription + one completed $0 session in Stripe's immutable history, and the app's admin notification emails (New Subscription / Churn) will fire; tell Dom to ignore those two.
- **The hub Activity feed must NEVER show the test** (Dom directive 2026-09-02). The Stripe history events become billing cards, and deleting the throwaway customer nulls the email Stripe returns, which used to blind the isTestEmail filter and leak the cards. Fixed in hub `lib/billing/events.ts` (recovers the email from the checkout session's customer_details snapshot, which survives customer deletion). This is why `customer_email` on the test session is MANDATORY and must contain "test". After a run, confirm no conversion/churn card for the test appears in the feed's data (billing events fetch); if one does, the target app's hub reader is missing that recovery + filter, port the hub fix.

## Diagnose the funnel first (when the ask is "nobody's paying")

Before or alongside the drill, pull live data so the verdict distinguishes broken from unconverting: recent checkout sessions (created vs completed vs expired-unpaid), recent payment intents (renewals succeeding proves the webhook is alive), recent signups from the app's logs/auth, and the payment-link config (active, correct redirect). Sessions being created but expiring unpaid + healthy renewals = conversion problem, not a bug.

## Procedure

All secrets come from the app repo's `.env.local` (Stripe key is usually `STRIPE`; Supabase `NEXT_PUBLIC_SUPABASE_URL` + service role). Extract values inside shell substitutions so they never print into the transcript.

### 1. Discover the app's real flow first

- Find the checkout entry: payment link env vars or a session-creation route.
- Get the REAL success URL from the live payment link: `GET /v1/payment_links/:id` → `after_completion.redirect.url` (or from the session-creation code). The test session must use it verbatim.
- Find the webhook route and the fulfillment table/columns it writes (Recruiterbase: `payment` table keyed on `user_id` from `client_reference_id`; Ghostplug: brand row). Note how user identity rides along (usually `client_reference_id` + `prefilled_email` / `customer_email`).

### 2. Create the throwaway auth user

```
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" \
  -H "Content-Type: application/json" -d '{"email":"<app>.payflow.test@hypertheory.ai","email_confirm":true}'
```

Capture the returned user id.

### 3. Create the $0 live checkout session

The trick that makes live-mode testing free and cardless: a 1-day trial with card collection only-if-required. Checkout then completes on the email alone.

```
curl -u "$STRIPE_KEY:" https://api.stripe.com/v1/checkout/sessions \
 -d mode=subscription \
 -d "line_items[0][price]=<the app's EXISTING live price id>" \
 -d "line_items[0][quantity]=1" \
 -d "success_url=<the payment link's exact after_completion url, with {CHECKOUT_SESSION_ID}>" \
 -d client_reference_id=<throwaway user id> \
 -d customer_email=<throwaway email> \
 -d "subscription_data[trial_period_days]=1" \
 -d payment_method_collection=if_required
```

Save `id` and `url`.

### 4. Complete checkout headlessly

In the scratchpad: `npm init -y && npm install playwright-core` (drives installed Chrome via `channel: 'chrome'`, no browser download; one short headless page, respects the no-heavy-local-workloads rule).

```js
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
await page.goto(SESSION_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
const submit = page.locator('button[type="submit"], .SubmitButton').first();
await submit.waitFor({ state: 'visible', timeout: 30000 }); // label reads "Start trial"
await submit.click();
await page.waitForTimeout(10000);
await browser.close();
```

**Gotcha from the reference run**: do NOT verify completion by watching the browser URL. Fleet checkout runs on custom domains (`buy.<brand>.co/.ai`), so a `/<brand>\.co/` regex matches the checkout page itself. Verify via API instead:

```
GET /v1/checkout/sessions/:id  →  status=complete, payment_status=paid (or no_payment_required)
```

Capture `subscription` and `customer` ids from that response.

### 5. Verify fulfillment

Wait ~8s for the webhook, then read the fulfillment table for the throwaway user id. Assert: row exists, plan/type correct for the price used, expiry = trial end (tomorrow), i.e. the app's isActive logic would grant access now. If the success redirect and webhook both ran, the row upserted twice, which also proves idempotency.

### 6. Verify churn

```
curl -u "$STRIPE_KEY:" -X DELETE https://api.stripe.com/v1/subscriptions/<sub id>
```

Wait ~8s, re-read the fulfillment row: it must be gone (or access-revoking equivalent for the app).

### 7. Cleanup + audit (mandatory, even on failure)

1. Subscription: confirmed `canceled` (step 6, or do it now).
2. `DELETE /v1/customers/<cus id>` → `deleted: true`.
3. `DELETE $SUPABASE_URL/auth/v1/admin/users/<user id>` → 200; re-GET → 404.
4. Customer search by the test email → 0 matches.
5. App DB: fulfillment table and `logs` table empty for the test email.
6. Coupons and products lists unchanged (nothing created).

## Report format

Lead with the verdict (working / broken at step X). Note the two admin notification emails to ignore, and the card-entry caveat. A few sentences, per the global reply rules.
