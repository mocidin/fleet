---
name: new-app
description: Stand up a new Hypertheory fleet app end to end, the same way every time: private GitHub repo under the fleet account, its own Supabase project with the fleet base tables and auth config, a repo scaffolded from Ghostplug's canonical fleet files with only the brand slots changed, .env.local, the hub wiring that puts the app in front of every team review the moment it exists, the Vercel project, the domain and DNS on Porkbun, and the dev server. Use when the user says "new app", "set up <name> as a new fleet app", "scaffold <name>", "add <name> to the fleet", or has just bought a domain for a product idea. Never used for the hub itself.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Agent
---

# New fleet app

> Fleet root: `~/code/hypertheory` on the laptop. Everything below is one sitting, run to completion; report what was done and the two or three things only Dom can do (a Stripe account, a Google Cloud project, a Porkbun toggle), never a task list.

The fleet is discovered, not registered: the hub's roster (`lib/fleet/roster.ts`) treats every non-archived Next repo under the `mocidin` GitHub account as an app and finds its credentials by the env convention `<APP>_SUPABASE_URL` + `<APP>_SUPABASE_SECRET` (and `<APP>_STRIPE` once it bills). So the whole registration is: the repo exists, and those hub env vars exist. Everything else here is the standard skeleton so nothing gets built per app.

## Inputs

Collect before starting, from the conversation or with one `AskUserQuestion`: the repo key (lowercase, also the Vercel project, Supabase project, env prefix and `dev` name), the product name as prose (single-cap compound, `Whaletrail` not `WhaleTrail`), the domain (bought on Porkbun already), the primary color, the typeface (one next/font/google family, distinct from the siblings: Ghostplug Space Grotesk, Brandflare Schibsted Grotesk, StonedGPT Poppins, Recruiterbase Montserrat, Whaletrail Sora), and whether the app is customer-facing now or internal first (internal skips Stripe, support mail and the legal pass until launch). The dev port is the next free `-p 30xx` pin: check both the pins (`grep -h '"dev"' ~/code/hypertheory/*/package.json`; hub 3000, Ghostplug 3001, Brandflare 3002, StonedGPT 3003, Recruiterbase 3004, Whaletrail 3005) and the ports launchd already assigned to unpinned apps (`grep -l '<string>-p</string>' ~/Library/LaunchAgents/fleet/*.plist`, the number after it), since an unpinned app such as email-landing keeps whatever free port it got and collides with a new pin.

## 1. Accounts and projects

- **GitHub**: private repo `mocidin/<app>`, no auto-init (GitHub MCP `create_repository`, or `GH_TOKEN=$(gh auth token --user mocidin) gh repo create mocidin/<app> --private`).
- **Supabase**: org `hypertheory` (`bcubtvcoizpqpxndgsno`), region `us-west-1`, name `<app>`. `get_cost` then `confirm_cost` then `create_project` (an extra project is $10 a month on this org, say so). Apply the fleet base migration below with `apply_migration`, name `fleet_base_tables`. Then set auth through the management API with the hub's `SUPABASE_PAT`: `PATCH /v1/projects/<ref>/config/auth` with `site_url` `https://<domain>/`, `uri_allow_list` `http://localhost:<port>/auth/callback,http://localhost:<port>/auth/reset,https://<domain>/auth/callback,https://<domain>/auth/reset`, `mailer_autoconfirm: true`, `external_email_enabled: true`. Read the keys with `GET /v1/projects/<ref>/api-keys?reveal=true` (the `publishable` and `secret` entries), never print them.

```sql
create table public.contact (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null, email text not null, message text not null, created_at timestamptz default now());
create index idx_contact_user_id on public.contact (user_id);
alter table public.contact enable row level security;
create table public.logs (id uuid primary key default gen_random_uuid(), user_id uuid, email text, event text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create index logs_created_at_idx on public.logs (created_at desc);
create index logs_event_idx on public.logs (event);
create index logs_user_id_idx on public.logs (user_id);
alter table public.logs enable row level security;
create table public.pageviews (created timestamptz default now(), visitor text, path text, source text, metadata jsonb);
create index pageviews_created_idx on public.pageviews (created);
create index pageviews_source_created_idx on public.pageviews (source, created);
alter table public.pageviews enable row level security;
create policy "anon insert" on public.pageviews for insert to anon with check (true);
```

`contact` is what the app's contact form writes (replies go out from the hub support cockpit), `logs` is where `cronRoute` heartbeats and `logEvent` rows land and what the hub reads for the app's activity, `pageviews` is the fleet's cookieless analytics.

## 2. The repo

Scaffold at `~/code/hypertheory/<app>` from Ghostplug, the canonical copy of every fleet file (Brandflare for the Supabase clients, which carry the newer key names). Delegate to one agent with the brand slots and this list; it copies, strips product code, runs `npm install`, `npx tsc --noEmit` and `npm run lint` clean, and commits on `main` with the remote set, no push.

- **Byte-identical fleet files** (keep the "Standardized across the fleet" header comments): `lib/constants/models.ts` (the model router), `app/components/{Modal,ConfirmModal,DeleteConfirmModal,PickerModal,PlatformHeader,Pulse}.tsx`, `app/components/subcomponents/*`, `app/(marketing)/components/{Footer,MarketingShell,MarketingHeader,AuthModal}.tsx`, `app/auth/*` (redirect stub, actions, callback, reset, impersonate), `app/api/contact`, `app/api/pulse`, `lib/pageview.ts`, `lib/cron.ts` (with `vercel.json` `{"crons": []}`), `lib/assets/icon.ts` plus `app/{apple-icon,opengraph-image,twitter-image}.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/supabase/{admin,browser,server}.ts`, `lib/providers/*`, the generic hooks and utils (`useUser`, `useIsMobile`, `useClickOutside`, `auth`, `actionAuth`, `apiAuth`, `dates`, `logs`, `siteConfig` from Brandflare, whose copy strips the trailing slash that drops `?payment=success`, `stripeReturn`, `validateEmail`, `topScroll`), `proxy.ts`, the security-headers block in `next.config.mjs`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`, `.gitignore`, `.claude/settings.json`.
- **Shell**: `app/(platform)` layout, AppLayout, ModalProvider, MobileNavProvider, AppSettings in the fleet App-settings model (Account section, Sign Out, Billing added at launch), ContactModal and ContactSuccess, `/home` with the fleet dashed empty state. Marketing page: MarketingShell, a minimal Hero with the `Access <Brand>` button opening AuthModal and the `?signup=1` handoff, the fleet Footer, legal pages in the fleet shell with contact through the app's own form.
- **Brand slots only**: `app/icon.svg` (24 viewBox, self-contained paths, IS the favicon), `LogoIcon.tsx` and `AppLogo.tsx`, the primary tokens in both `globals.css` color blocks, the `--font-sans`/`--font-display` family, the name and description in `layout.tsx` (root tab title is the bare brand name), `-p <port>` in `package.json` and `.claude/launch.json`.
- **Env names the code reads**: `URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE`, `SUPABASE_SECRET`, `<APP>` (the app's own internal bearer), `CRON_SECRET`, `PAGEVIEW_SALT`. Nothing else: a var no code reads is drift the Monday env check will offer to remove (`GOOGLE` in the siblings holds two different things, the fleet service account in the hub and Ghostplug, a Gemini key in Brandflare, and neither belongs in a new app).
- **Notes and ledgers**: `CLAUDE.md` in the sibling format (role line plus the identical Git workflow section), `.claude/rules/fleet.md` byte-identical from the hub (`/sync-rulebook` keeps it so), `.claude/rules/README.md` from the hub with `<app>.md` in place of `hub.md`, `.claude/rules/<app>.md` as the always-on note under 1,000 words, `.claude/settings.json` with `autoMemoryEnabled: false`, `.claude/security.md` as an empty ledger with the Public by design, Findings and Runs sections (the Sunday review appends to it; the conventions check flags a missing `models.ts` and the review a missing ledger). `package.json` pins `engines.node` to `24.x` with `@types/node` on the same major. Run `SUPABASE_ACCESS_TOKEN=<the hub's SUPABASE_PAT> npm run db:types` once so `lib/types/database.ts` exists. `layout.tsx` reads `metadataBase` from `getSiteUrl()`, never a hardcoded fallback.

Write the app's `.env.local` yourself (bare `KEY=value`, no comments, core block then one block per service): `URL=https://<domain>`, the Supabase trio, `<APP>`, `CRON_SECRET` and `PAGEVIEW_SALT` from `openssl rand -hex 32`. `chmod 600`.

## 3. The hub

The roster finds the app from two env vars, but the hub also keeps hand-written lists per app, watched by Technology's `coverage:<app>` check (`lib/teams/coverage.ts`, `REGISTRIES`): an app missing from one becomes a line on the coverage card and the fix lane hands it to a coding agent. Do the whole set in the same sitting so the card never has to. Mirror the nearest sibling entry exactly (Recruiterbase is the simplest template).

- **Env**: `.env.local` gets `<APP>_SUPABASE_URL` and `<APP>_SUPABASE_SECRET`; the same two on Vercel Production only (`printf value | vercel env add NAME production --no-sensitive --yes`, login gate first). This is what puts the app on the roster; the reviews see it after the hub's next push.
- **Client**: `lib/supabase/<app>.ts`, a copy of `brandflare.ts` renamed (service-role, every caller behind `requireAdmin()`).
- **Keys and names**: `MetricsAppKey` (`app/admin/metrics/actions.ts`), `AppKey` in `app/api/mcp/[token]/route.ts`, `StripeAppKey` and `HAND_CODED` in `lib/billing/subs.ts` (the sidebar and the dispute pack are typed on it; its consumers skip an app whose `<APP>_STRIPE` is unset), `STACK_APPS` in `lib/stack/apps.ts`, and the four name maps (`lib/teams/writeup.ts`, `app/admin/jobs/views/shared.ts`, `app/admin/ghostplug/views/ActivityView.tsx`, `app/admin/activity/views/TeamReportCard.tsx`).
- **Sidebar and admin pages**: a shared mark component in `app/components/logo/<App>Mark.tsx` (verbatim from the app's `LogoIcon`), used by `AppBadge.tsx` (`CONFIGS`: font, color, hover) and `AdminShell.tsx` (`ADMIN_PATHS`, `DEFAULT_APP_ORDER`, `APP_TABS`); the seven-file admin tree `app/admin/<app>/` (page redirect, `ontology/page.tsx`, `users/{actions,data/useOntologyData,views/OntologyView,views/index}`, `actions/impersonate.ts` with the production URL), with Ontology as the section's child in `APP_TABS` (the Launch row is derived, never listed); `lib/reads.ts` entries (`fetch<Ap>AdminUsers`, `fetch<App>Logs`) and the `lib/teams/speed.ts` route map; `DELETERS` in `lib/teams/operations.ts`.
- **Feed and metrics**: `app/admin/activity/<app>Logs.ts` plus `data/use<App>Logs.ts`, wired into `activity/page.tsx` (import, hook, load gate, spread) and `activity/contact.ts`; `<app>Stats()`, `APP_CONFIG` and the `computeAllStats` slot in `app/admin/metrics/actions.ts`; `APPS` in `app/admin/marketing/actions.ts`; `PRODUCT_DOMAINS` in `lib/marketing/email/health.ts`.
- **Prose the models and the public read**: `FLEET_CONTEXT`, `APP_DBS` and the two describe strings in the MCP route; the fleet description and repos enum in `lib/prompts/setup/watch.ts`; the project list in `lib/stack/agent.ts`; the hub's `privacy` and `anti-spam` pages; `PRESET_NAMES` in the Logo Creator; the fonts in `app/layout.tsx` and `globals.css` when the app's typeface is new to the hub.
- **Notes**: the fleet roster and product-name lines in `.claude/rules/fleet.md` (then `/sync-rulebook`), the application-domain line in `memory/domains.md`.
- **Support config at scaffold, not launch**: `lib/support/apps.ts` gets its entry the same day (name, `support@<domain>`, site, the one-paragraph product line, `tier: 'standard'`), because every mail and coverage check keys off the `contact` table the base migration creates, and the Technology mail check then places Resend, MX, SPF and the Workspace alias for the domain itself.
- **Only when customer-facing** (the launch list, section 5): `lib/support/{sweep,inbound,context}.ts`, `STRIPE_APPS` in `lib/billing/events.ts` and `lib/stack/update.ts`, `lib/disputes/{facts,evidence}.ts`, `MAPPINGS` in `lib/teams/finance.ts`, `PAYMENT_ADAPTERS` in `lib/teams/paymentAdapters.ts`, `WINBACK_APPS` in `BillingEventCard.tsx`, `lib/marketing/apps/` for cold email, the Instagram and LinkedIn brand maps, and `app/admin/jobs/catalog.ts` lines the day the app gets a cron.
- Commit the hub on `main`; push only when Dom says push.

## 4. Hosting and domain

- The first push of the new repo is part of setup (nothing is in production yet); say so plainly. Then Vercel MCP `create_git_project` with `repo: mocidin/<app>`, `teamId: team_UeaxNGIDJ3QYArNTa2bj2DAM`, project name `<app>`; add every `.env.local` key as Production-only encrypted vars (`--no-sensitive`); `add_project_domain` for the apex. Vercel's project setting for Node follows the `engines` pin.
- Porkbun DNS (`PORKBUN` + `PORKBUN_SECRET` in the hub's `.env.local`): the apex `A` record to Vercel `216.150.1.1`, TTL 600, nothing else (the siblings carry apex-only records; mail records arrive from the Technology check). A freshly bought domain arrives with Porkbun's parking records (an `ALIAS` apex and a wildcard `CNAME` to `pixie.porkbun.com`): delete both by id, then create the A record. Porkbun refuses API calls on a domain that is not opted in to API access; Dom flipped the account-wide "enable API access for all domains" switch on 2026-09-27, so new domains are reachable at once, and if `dns/retrieve` ever answers "not opted in" again, that account switch is the one Porkbun step to hand back.
- `dev <app>` starts the launchd dev server on the pinned port; read `~/Library/Logs/fleet/<app>.log` until it is clean.
- In the new repo, run `/ensure-environment-config` so `.mcp.json` carries the `mocidin` GitHub token.

## 5. At launch (customer-facing), not at scaffold

The Operations setup check (`setup:<app>:<piece>` alerts) raises one card per piece still missing, cleared by the run that finds it done, so nothing here is a list Dom keeps: Dom creates the app's own live Stripe account (the key goes in as `STRIPE` in the app and `<APP>_STRIPE` in the hub, then `/ensure-stripe-config`, the four `app/api/stripe` routes, `lib/utils/{checkout,stripeFulfill}.ts` and the Billing section in AppSettings from Ghostplug); a Google Cloud project `<app>-gc` with an OAuth client pasted into the Supabase Google provider; the hub's customer-facing registries above; support mail, which the Technology mail check places itself once `lib/support/apps.ts` has the entry; `/legal-audit`, `/optimize-seo`, `/security-review`; the final mark, typeface and color are designed in the app itself: Launch it from its sidebar section in the hub, install the Logo Creator panel there with `/logo-creator`, bake the pick in with the same skill (it writes the brand slots in the app and the hub), then mark the app's `setup:<app>:logo` card done. None of these block an internal app.
