---
name: ensure-stripe-config
description: Audit (and fix where possible) the CURRENT Hypertheory app's live Stripe account against the fleet's standardized configuration — one all-features customer-portal preset (the Recruiterbase model), branding set, daily payouts, and revenue-recovery emails on. Detects the app from the repo you're in. Use when the user says "ensure stripe config", "check stripe setup", "is stripe configured right/standardized", "audit stripe", or before launching/reviewing an app's billing.
---

# ensure-stripe-config

Verify the **current repo's** Stripe account matches the Hypertheory fleet standard. Detect the app from the working directory, read its **live** account settings, report each item pass/fail, and fix what's safely fixable via API. Payouts and dunning emails are dashboard-only — report + deep-link those.

This skill is READ-first. Only mutate Stripe after showing the user what's wrong and getting a go-ahead. Never print secret keys.

## The fleet standard (what "correct" means)

1. **Customer portal — ONE all-features preset (the important one).**
   - Exactly **one active** `billing_portal` configuration, and it is the account **default** (`is_default = true`). No per-flow presets, no churn.
   - That default has **all three features enabled**, with these exact behaviors (verified identical on all four accounts 2026-08-10):
     - `subscription_update`: `default_allowed_updates` includes `price`, `proration_behavior = always_invoice`, `schedule_at_period_end.conditions = [decreasing_item_amount]`. Upgrades bill immediately and prorate; downgrades wait for period end, so nobody buys a cheaper month mid-cycle.
       - **products = only recurring prices whose PRODUCT is still on sale.** A legacy price kept active purely so an existing subscriber keeps billing must never become a switch target: writing "every active price" made Ghostplug's retired $80 tier a downgrade option for $199–$649 customers (caught and fixed 2026-08-10).
       - **`enabled` only when 2 or more such prices exist.** On a single-tier account Stripe refuses the flow outright (`no price in the portal configuration available to change to`), so enabling it can only produce a dead end. Brandflare and StonedGPT are single-tier and correctly have it **disabled**; flip it on the moment a second tier ships. Verify the app's UI matches: Brandflare drives cancel/reactivate/payment_method flows, StonedGPT opens the portal front page (`flow=home`), so neither surfaces a plan-change control.
       - Stripe's update flow **cannot touch a multi-item subscription** (`because it has multiple items`). Legacy per-vertical customers who bought several line items can cancel but not self-serve a plan change; Recruiterbase has one such subscriber from April 2025 billing $126/mo across four archived prices. Not a config fault, do not try to fix it in the portal.
     - `subscription_cancel`: enabled, `mode = immediately`, `proration_behavior = none` (access ends now, no partial refund), `cancellation_reason.enabled = true` with the four default options, so churn reasons land in the dashboard.
     - `payment_method_update`: enabled. Plus `invoice_history.enabled = true`.
   - **Gotcha:** editing the default config revalidates its stored `subscription_update.products` list, so a price archived after the config was written makes the config **unsaveable** (`Only active, per unit licensed prices are supported`). Any catalog cleanup must rewrite that list from what is currently on sale, in the same run. Bit both Brandflare and Recruiterbase on 2026-08-10.
   - Enabling `subscription_update` on a single-price account requires passing `products[][product]` + `products[][prices][]` explicitly; the default config's GET response omits `products` entirely, so absence is **not** a failure and must never be reported as one.
   - The billing route opens sessions on the **default config** (passes **no** `configuration`) and uses **`flow_data`** to steer to the right screen. It must **never** call `stripe.billingPortal.configurations.create()` per request — that mints a throwaway preset on every portal open (Ghostplug had accumulated 38 before this was fixed).
   - Reference implementation: **Ghostplug** `app/api/stripe/billing/route.ts` (Brandflare's is the same file) — one default preset, `flow_data` to steer, four flows (`update`/`cancel`/`reactivate`/`payment_method`), and `return_url` validated as a same-origin relative path against open redirects. Since 2026-09-17 every app runs the same route: Ghostplug and Brandflare resolve the subscription from the brand or instance id, Recruiterbase and StonedGPT from the session's `payment` row, and all take `update`, `cancel`, `reactivate`, `payment_method`, `invoice` and `home` (the portal front page).

2. **Branding.** `settings.branding` has `icon`, `logo`, `primary_color`, and `secondary_color` set.

3. **Payouts.** `settings.payouts.schedule.interval = daily`. (Daily is the fleet standard — best for cash flow. NOT monthly/15th, which was the old standard.) **Dashboard-only to change** — Stripe forbids editing your own (non-Connect) account's payout schedule via API (`you may only use it on connected accounts`).

4. **Revenue recovery (failed-payment retries + customer emails).** **NOT exposed in the Stripe API** for any account — cannot be read or set programmatically. Report as "verify manually" with a deep-link, and check these exact settings under [Revenue recovery → Emails](https://dashboard.stripe.com/settings/billing/automatic):
   - **Send emails when card payments fail** — ON, set to **"Link to a Stripe hosted page"** (not custom link).
   - **Send emails when bank debit payments fail** — ON.
   - **Send emails about expiring cards** — ON, set to **"Link to a Stripe hosted page"**.
   - **Retries** tab: Smart Retries enabled.

5. **Price catalog — only what is on sale exists, and no app uses payment links (retired fleet-wide 2026-09-17).**
   Stripe prices are **immutable**: changing an amount means creating a new price, so every past price accumulates forever unless archived. The catalog must contain nothing that cannot be bought.
   - A price is **in use** only if one of these is true: an app's checkout route names it, a subscription in `active/trialing/past_due/unpaid/paused` is billed on it, or it is the `default_price` of a product still on sale. Everything else gets archived. Never judge by amount or name.
   - A **product** is archived when nothing on sale points at it and no live subscription bills it. Archiving is safe for existing subscribers: Stripe keeps billing an archived price, and fleet apps gate access on their own DB table (see the code contract below), never on Stripe products.
   - A product's **default price cannot be archived** while the product is active. Repoint `default_price` to the new price first, then archive the old one. For a product already off sale, clear the default (`default_price=`) and then archive.
   - **Checkout is minted server-side in every app** (`app/api/stripe/checkout/route.ts`; Recruiterbase is the reference, Ghostplug keys the session on the brand, Brandflare on the instance, StonedGPT and Recruiterbase on the user). The route holds the live price ids, reuses the Stripe customer already on the email, refuses a second subscription for a paid-up seat (409, the client refreshes itself) and logs the click after the response. The old links are `active=false` (Stripe cannot delete them) and the `NEXT_PUBLIC_STRIPE_*` link vars are gone from every project. Never add a link back: it cannot apply a conditional discount, reuse a customer or refuse a double purchase.
   - **Price-change runbook** (the whole sequence, in order): create the new price → repoint the product's `default_price` → update the id in the app's checkout route → deploy → archive the old price → rewrite the portal config's products list. Existing subscribers keep their price unless migrated on purpose.
   - **Recruiterbase's first-month offer**: its checkout route mints from the real monthly price ($39 IB `price_1U35MT…`, $79 ALL `price_1U35MU…`) plus a first-month coupon (`FIRST_MONTH_IB` $20 off, `FIRST_MONTH_ALL` $40 off, duration `once`) applied only while that user's 48 hour offer (`lib/offer.ts`) is still running, because a payment link cannot apply a discount conditionally. Both products' `default_price` and the portal's plan-change list are those same two prices (set 2026-09-17, when the earlier list-price scheme, $78/$158 plus a 50% forever coupon, was archived). Coupons are catalog too: only the coupons a checkout applies exist, named for the reason.
   - Existing subscribers are **grandfathered by default**: new prices apply to new checkouts only. Migrating them needs 30 days notice per the fleet ToS, so it is always an explicit ask, never a side effect.

6. **Code contract (the repo side of the standard).**
   - **Entitlement comes from the PRODUCT, never the charged amount.** An amount test breaks the first time a price is reused across tiers: $39 was Recruiterbase's All Finance price until 2026-08-10 and its Investment Banking price after, so `amount === 19 ? 'IB' : 'ALL'` silently handed every new IB customer the buy-side data. Map product id → tier, with amount only as a fallback for pre-existing legacy prices.
   - **Webhook endpoint carries exactly these six events**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`. Fewer means a failed card or a portal-side plan change goes unrecorded.
     - **`async_payment_succeeded` is mandatory, never "extra".** All four accounts have `us_bank_account_ach_payments` and `acss_debit_payments` active, and an ACH checkout completes as *unpaid*, clearing days later. Without this event those customers are never fulfilled: the synchronous success route also declines them, since it requires `payment_status = paid`. An earlier version of this skill called the set "exactly five", which would have had the enforcer strip it and silently break every bank-debit signup.
   - **`customer.subscription.updated` owns entitlement; invoice events own money.** It is the only event that fires for all three transitions, and a portal downgrade lands at period end with **no invoice at all**, so reading the tier off an invoice keeps the higher tier forever (Recruiterbase did exactly this until 2026-08-10). Reference: Recruiterbase `lib/utils/stripeFulfill.ts` — `fulfillCheckout` for first purchase, `syncSubscription` for every later change, idempotent (writes only when tier or period end moved, so one notification per real change), and it refuses to infer a tier for a multi-item legacy subscription because no single item describes what was bought. Ghostplug's equivalent lives inline in its webhook and already reads the new price on `customer.subscription.updated`; it is correct, leave it alone.
   - `invoice.payment_failed` never revokes access: Stripe's smart retries run for days and the stored period end still covers what was paid for, so the row lapses on its own. Ghostplug flips a `pastDue` flag for a UI prompt; Recruiterbase sends an internal heads-up. When an account is shared between apps (Brandflare's holds betdetective's endpoint too), only touch the endpoint whose URL matches the app's own domain.
   - Route exports `maxDuration = 300`, verifies the signature, returns non-2xx on failure so Stripe retries, and awaits every side effect. Handlers are idempotent (count before granting).
   - Access is gated on the app's own table (Recruiterbase `payment` with `type` + `end_at`), read by the app and by any RPC. Stripe is never consulted at read time.
   - Env vars: `STRIPE` (secret) + `STRIPE_WEBHOOK` (endpoint secret), Production-scoped, per the bare-service-name rule. **LIVE mode everywhere, `.env.local` included** — test mode/sandbox is retired fleet-wide (2026-08-10), so local values equal production values and an audit always runs against live. **Known deviation:** Recruiterbase still uses `STRIPE_SECRET_KEY` + `STRIPE_ENDPOINT_SECRET`; renaming means touching both the webhook and billing routes plus prod env in one change set.

## Fleet account reference

| App | env var (secret) | live acct id |
|---|---|---|
| ghostplug | `STRIPE` | acct_1Rtdxg0PpaESfR7m |
| brandflare | `STRIPE` | acct_1SENnS0m1QprGo0a |
| stonedgpt | `STRIPE` | acct_1RYuMqP5tm3jpj4d |
| recruiterbase | `STRIPE_SECRET_KEY` | acct_1PC55z08uNBhR6CF |

Env-var name varies (`STRIPE` vs `STRIPE_SECRET_KEY`). `.env.local` usually holds a **test** key; the **live** key is in Vercel production. Always audit against **live**.

## Procedure

### 1. Get the current app's LIVE key (never print it)
- Determine the repo root (the cwd you're invoked in).
- Find the secret var name: `grep -hoE '^(STRIPE|STRIPE_SECRET_KEY)=' <repo>/.env.local | head -1`.
- Pull the live key from Vercel prod to a temp file, read it, delete the temp file:
  `vercel env pull .env.prod.tmp --environment=production --yes` (run with cwd = repo), extract the `sk_live`/`rk_live` value for that var name, then `rm .env.prod.tmp`.
- If no live key is found, stop and tell the user which var/where to look.

### 2. Run the audit (read-only)
Run this self-contained script (fill `KEY` from step 1). It prints a pass/fail line per standard item.

```python
import urllib.request, urllib.parse, base64, json, os
KEY = os.environ["KEY"]  # live sk_/rk_ key, injected via env — never hardcode/print
def api(method, path, body=None):
    data = urllib.parse.urlencode(body, doseq=True).encode() if body else None
    r = urllib.request.Request("https://api.stripe.com/v1/"+path, data=data, method=method)
    r.add_header("Authorization", "Basic "+base64.b64encode((KEY+":").encode()).decode())
    if data: r.add_header("Content-Type", "application/x-www-form-urlencoded")
    try: return json.load(urllib.request.urlopen(r))
    except urllib.error.HTTPError as e: return {"__err__": json.load(e).get("error", {}).get("message")}
def pages(path, params):
    out=[]; p=dict(params)
    while True:
        d=api("GET", path+"?"+urllib.parse.urlencode(p)); out+=d.get("data",[])
        if not d.get("has_more"): break
        p["starting_after"]=d["data"][-1]["id"]
    return out

acct = api("GET", "account")
s = acct.get("settings", {}); br = s.get("branding", {}); po = s.get("payouts", {}).get("schedule", {})
print("ACCOUNT:", acct.get("id"), "-", s.get("dashboard", {}).get("display_name"))

# 1. Portal
cfgs = pages("billing_portal/configurations", {"limit": 100})
active = [c for c in cfgs if c.get("active")]
default = next((c for c in cfgs if c.get("is_default")), None)
ok_count = len(active) == 1 and active[0].get("is_default")
print(f"[{'PASS' if ok_count else 'FAIL'}] portal: {len(active)} active config(s) (want exactly 1 = default)")
if default:
    f = default["features"]; su = f.get("subscription_update", {}); sc = f.get("subscription_cancel", {}); pm = f.get("payment_method_update", {})
    checks = {
        "subscription_update.enabled": su.get("enabled") is True,
        "proration always_invoice": su.get("proration_behavior") == "always_invoice",
        "cancel enabled": sc.get("enabled") is True,
        "cancel mode immediately": sc.get("mode") == "immediately",
        "payment_method_update enabled": pm.get("enabled") is True,
    }
    for k, v in checks.items():
        print(f"   [{'PASS' if v else 'FAIL'}] default {k}")

# 2. Branding
brand_ok = all([br.get("icon"), br.get("logo"), br.get("primary_color"), br.get("secondary_color")])
print(f"[{'PASS' if brand_ok else 'FAIL'}] branding: icon/logo/colors set")

# 3. Payouts
pay_ok = po.get("interval") == "daily"
print(f"[{'PASS' if pay_ok else 'FAIL'}] payouts: interval={po.get('interval')} (want daily) [dashboard-only to fix]")

# 4. Revenue recovery — not API-visible
print("[MANUAL] revenue-recovery emails: not exposed via API — verify in dashboard")

# 5. Catalog: a price is in use only if a live link sells it, a live sub bills it,
#    or it is an on-sale product's default. Everything else is archivable.
LIVE = ["active", "trialing", "past_due", "unpaid", "paused"]
prices = pages("prices", {"limit": 100}); products = pages("products", {"limit": 100})
links = pages("payment_links", {"limit": 100})
subs = [s for st in LIVE for s in pages("subscriptions", {"limit": 100, "status": st})]
names = {p["id"]: p["name"] for p in products}
pid = lambda v: v if isinstance(v, str) else (v or {}).get("id")
in_use = set()
for l in [x for x in links if x.get("active")]:
    for li in api("GET", f"payment_links/{l['id']}/line_items?limit=10").get("data", []):
        in_use.add(li["price"]["id"])
for s in subs:
    for i in s["items"]["data"]: in_use.add(i["price"]["id"])
for p in products:
    if p.get("active") and p.get("default_price"): in_use.add(pid(p["default_price"]))
stray = [p for p in prices if p.get("active") and p["id"] not in in_use]
sub_prods = {pid(i["price"]["product"]) for s in subs for i in s["items"]["data"]}
dead = [p for p in products if p.get("active") and p["id"] not in sub_prods
        and not any(x["product"] == p["id"] and x["id"] in in_use for x in prices)]
print(f"[{'PASS' if not stray else 'FAIL'}] catalog: {len(stray)} archivable price(s) of {sum(1 for p in prices if p.get('active'))} active")
for p in stray: print(f"     archivable: ${p['unit_amount']/100} {names.get(p['product'],'')} {p['id']}")
print(f"[{'PASS' if not dead else 'FAIL'}] products: {len(dead)} archivable")
for p in dead: print(f"     archivable product: {p['name']} {p['id']}")

# 6. Webhook: exactly the standard five events, on THIS app's endpoint only.
STD = {"checkout.session.completed", "checkout.session.async_payment_succeeded",
       "customer.subscription.updated", "customer.subscription.deleted",
       "invoice.payment_succeeded", "invoice.payment_failed"}
domain = os.environ.get("DOMAIN", "")
for w in pages("webhook_endpoints", {"limit": 100}):
    if domain and domain not in w["url"]: continue
    ev = set(w.get("enabled_events", []))
    print(f"[{'PASS' if ev == STD else 'FAIL'}] webhook {w['url']}: missing={sorted(STD-ev)} extra={sorted(ev-STD)}")
```

### 3. Also check the CODE (portal pattern)
Grep the app's billing route for the anti-pattern:
`rg -n "billingPortal\.configurations\.create" <repo>/app/api/stripe`
- **Any hit = FAIL**: the route creates a preset per portal open. It must be refactored to open the **default** config + `flow_data` (mirror Recruiterbase `app/api/stripe/billing/route.ts`).

### 4. Report, then fix (only after go-ahead)

Print a compact table: item | status | how to fix.

**Auto-fixable via API (with confirmation):**
- **Portal not standardized** →
  1. If there's no default config, or the default lacks features, **update the default** (`POST /v1/billing_portal/configurations/{default_id}`) to enable `subscription_update` (`default_allowed_updates[]=price`, `proration_behavior=always_invoice`, products = every active recurring product), `subscription_cancel` (`mode=immediately`), `payment_method_update`.
  2. If the code still creates per-flow configs, **refactor the billing route first** to use default + `flow_data`, **commit + deploy**, and only **after the deploy is Ready**, deactivate the extra configs. Deactivating a config the live code still references breaks the portal.
  3. Deactivate every other active config (`POST .../{id}` `active=false`). Configs **cannot be deleted**, only deactivated — say so.

**Dashboard-only (report + deep-link, cannot auto-fix):**
- **Payouts → daily:** [dashboard.stripe.com/settings/payouts](https://dashboard.stripe.com/settings/payouts) (select the right account) → set schedule to **Daily**.
- **Revenue recovery:** [dashboard.stripe.com/settings/billing/automatic](https://dashboard.stripe.com/settings/billing/automatic) → Emails tab: turn on "card payments fail" + "bank debit payments fail" + "expiring cards", each set to **Link to a Stripe hosted page**; Retries tab: Smart Retries on.
- **Branding (if unset):** [dashboard.stripe.com/settings/branding](https://dashboard.stripe.com/settings/branding).

### 5. Safety rules
- Never print or log the secret key. Always pull to a temp file and `rm` it.
- Never delete data. Portal configs and canceled subs can only be **deactivated** / left in place, never deleted (test mode is the only exception).
- Refactor + deploy the code **before** deactivating configs it references.
- Confirm before any Stripe write. Payouts and revenue-recovery are the user's to click.

## After the audit
End with a one-line verdict: which items PASS, which need a dashboard click, and offer to apply the API-fixable portal changes if any failed.
