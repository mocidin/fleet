#!/usr/bin/env node
// Deterministic candidate scanner for /security-review. Zero dependencies.
// Usage: node scan.mjs <repo path> [--json]
// Prints the small set of places a security hole can live in a Next.js + Supabase + Stripe app,
// with the evidence needed to judge each one. It never decides; the review decides.
// Same tree in, same output out, so two runs on unchanged code produce identical candidate lists.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, basename, dirname } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.argv[2] ? process.argv[2].replace(/\/$/, '') : process.cwd()
const asJson = process.argv.includes('--json')
if (!existsSync(join(root, 'package.json'))) {
  console.error(`no package.json at ${root}`)
  process.exit(2)
}

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.vercel', 'dist', 'build', 'coverage', '.turbo', 'public'])
const CODE = /\.(ts|tsx|js|jsx|mjs|cjs)$/

// Calls that prove a request was authenticated or authorized. Union across the fleet; a hit is evidence, not proof.
const AUTH = /\b(requireAdmin|requireAuth|requireUser|authenticateApiRoute|verifyBrandOwnership|verifyModuleOwnership|verifyOwnership|assertAdmin|getCurrentUser|auth\.getUser|auth\.getSession|getSession|getUser|constructEvent|cronRoute|CRON_SECRET|WEBHOOK_SECRET|timingSafeEqual|verifyOtp|exchangeCodeForSession)\b/
// Things that make a route legitimately public. Reported so the review can confirm the mechanism.
const PUBLIC_SIGNALS = [
  ['stripe signature', /constructEvent\(/],
  ['cron secret', /CRON_SECRET|cronRoute\(/],
  ['shared secret', /WEBHOOK_SECRET|timingSafeEqual|\bBearer\b/],
  ['auth callback', /exchangeCodeForSession|verifyOtp/],
  ['session', /auth\.getUser|getSession\(|getUser\(|requireAdmin|requireAuth|requireUser|authenticateApiRoute|getCurrentUser/],
  ['ownership', /verify(Brand|Module)?Ownership|assert[A-Z]\w*/],
]
const SERVICE_ROLE_ENV = /process\.env\.([A-Z0-9_]*(SERVICE_ROLE|SERVICE_KEY|SUPABASE_SECRET|_SECRET)[A-Z0-9_]*)/g
const SECRET_LITERALS = [
  ['stripe live key', /\bsk_live_[0-9a-zA-Z]{16,}/],
  ['stripe restricted key', /\brk_live_[0-9a-zA-Z]{16,}/],
  ['stripe webhook secret', /\bwhsec_[0-9a-zA-Z]{16,}/],
  ['supabase pat', /\bsbp_[0-9a-f]{20,}/],
  ['aws access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['google api key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['github token', /\bgh[pousr]_[0-9A-Za-z]{30,}/],
  ['slack token', /\bxox[baprs]-[0-9A-Za-z-]{20,}/],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['anthropic key', /\bsk-ant-[0-9A-Za-z_-]{20,}/],
  ['openai key', /\bsk-proj-[0-9A-Za-z_-]{20,}/],
  ['jwt literal', /\beyJ[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{20,}\.[0-9A-Za-z_-]{10,}/],
]

const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else if (CODE.test(name)) files.push(p)
  }
})(root)

const rel = (p) => relative(root, p)
const read = (p) => readFileSync(p, 'utf8')
const lineOf = (src, idx) => src.slice(0, idx).split('\n').length

// Brace matcher good enough for TS function bodies (skips strings, template literals, comments).
function bodyFrom(src, openIdx) {
  let depth = 0
  let i = openIdx
  let mode = null // '"' | "'" | '`' | 'line' | 'block'
  for (; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (mode === 'line') { if (c === '\n') mode = null; continue }
    if (mode === 'block') { if (c === '*' && n === '/') { mode = null; i++ } continue }
    if (mode) { if (c === '\\') { i++; continue } if (c === mode) mode = null; continue }
    if (c === '/' && n === '/') { mode = 'line'; continue }
    if (c === '/' && n === '*') { mode = 'block'; continue }
    if (c === '"' || c === "'" || c === '`') { mode = c; continue }
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return src.slice(openIdx, i + 1) }
  }
  return src.slice(openIdx)
}

// From the "(" that opens a parameter list, find the "{" that opens the function body,
// skipping the parameters themselves and any return-type annotation (which may hold braces, e.g. Promise<{ ok: boolean }>).
function bodyOpenAfterParams(src, parenIdx) {
  let i = parenIdx
  let paren = 0
  for (; i < src.length; i++) {
    const c = src[i]
    if (c === '(') paren++
    else if (c === ')') { paren--; if (paren === 0) { i++; break } }
    else if (c === '"' || c === "'" || c === '`') { const q = c; for (i++; i < src.length && src[i] !== q; i++) if (src[i] === '\\') i++ }
  }
  let angle = 0
  let brace = 0
  for (; i < src.length; i++) {
    const c = src[i]
    const n = src[i + 1]
    if (c === '=' && n === '>') { i++; continue }
    if (c === '<') angle++
    else if (c === '>') angle = Math.max(0, angle - 1)
    else if (c === '(') paren++
    else if (c === ')') paren = Math.max(0, paren - 1)
    else if (c === '{') { if (angle === 0 && paren === 0 && brace === 0) return i; brace++ }
    else if (c === '}') brace = Math.max(0, brace - 1)
    else if (c === ';') return -1
  }
  return -1
}

function exportedFunctions(src) {
  const out = []
  const re = /export\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z0-9_$]*)\s*(?:<[^>]*>)?\s*\(|export\s+const\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:<[^>]*>)?\s*\(/g
  let m
  while ((m = re.exec(src))) {
    const name = m[1] || m[2] || 'default'
    const open = bodyOpenAfterParams(src, m.index + m[0].length - 1)
    if (open < 0) continue
    const body = bodyFrom(src, open)
    out.push({ name, line: lineOf(src, m.index), body })
  }
  return out
}

const report = { root, actions: [], routes: [], serviceRole: [], secrets: [], publicEnv: [], ssrf: [], redirects: [], mutations: [], envFiles: [], edge: {}, audit: null }

// 1. Server actions: every exported function in a "use server" file and whether an auth call appears in its body.
for (const f of files) {
  const src = read(f)
  if (!/^\s*(['"])use server\1/m.test(src.slice(0, 400))) continue
  for (const fn of exportedFunctions(src)) {
    const auth = fn.body.match(AUTH)
    const firstStmt = fn.body.slice(1).replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim().slice(0, 100)
    report.actions.push({ file: rel(f), name: fn.name, line: fn.line, auth: auth ? auth[0] : null, first: firstStmt })
  }
}

// 2. API routes: handlers exported and the public/auth mechanisms visible in the file.
for (const f of files) {
  if (!/\/app\/.*\/route\.(ts|js)$/.test(f)) continue
  const src = read(f)
  const handlers = [...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b|export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g)].map((m) => m[1] || m[2])
  const mechanisms = PUBLIC_SIGNALS.filter(([, r]) => r.test(src)).map(([n]) => n)
  const imports = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
  report.routes.push({ file: rel(f), handlers, mechanisms, maxDuration: /maxDuration/.test(src), imports })
}

// 3. Service-role clients: where they are built, and who imports those modules.
const srModules = new Map()
for (const f of files) {
  const src = read(f)
  const envs = [...src.matchAll(SERVICE_ROLE_ENV)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i)
  const hasClient = /createClient\(|createServerClient\(|new SupabaseClient/.test(src)
  if (envs.length && hasClient) srModules.set(f, envs)
}
for (const [mod, envs] of srModules) {
  const stem = basename(mod).replace(/\.(ts|tsx|js|mjs)$/, '')
  const dir = basename(dirname(mod))
  const importers = files.filter((f) => f !== mod && new RegExp(`import\\s+(?!type\\b)[^;]*?from\\s+['"][^'"]*(?:${dir}/)?${stem}(?:\\.js)?['"]`, 's').test(read(f)))
    .map((f) => {
      const s = read(f)
      const isEntry = /\/app\/.*\/route\.(ts|js)$/.test(f) || /^\s*(['"])use server\1/m.test(s.slice(0, 400))
      return { file: rel(f), entry: isEntry, auth: !!s.match(AUTH), client: /^\s*(['"])use client\1/m.test(s.slice(0, 400)) }
    })
  report.serviceRole.push({ module: rel(mod), envs, importers })
}

// 4. Secrets: literal credentials in tracked files, secret-looking NEXT_PUBLIC names, tracked env files.
let tracked = []
try { tracked = execSync('git ls-files -z', { cwd: root }).toString().split('\0').filter(Boolean) } catch { tracked = files.map(rel) }
for (const t of tracked) {
  if (/(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/.test(t) || /\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|mp3|mp4|webm|pdf|zip)$/i.test(t)) continue
  const p = join(root, t)
  if (!existsSync(p) || statSync(p).size > 2_000_000) continue
  const src = read(p)
  for (const [kind, re] of SECRET_LITERALS) {
    const m = src.match(re)
    if (m) report.secrets.push({ file: t, kind, line: lineOf(src, m.index), sample: m[0].slice(0, 12) + '…' })
  }
  if (/^\.env(\..*)?$/.test(basename(t)) && !/example|sample|template/.test(t)) report.envFiles.push(t)
}
for (const f of files) {
  const src = read(f)
  for (const m of src.matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|TOKEN)[A-Z0-9_]*/g)) {
    report.publicEnv.push({ file: rel(f), line: lineOf(src, m.index), name: m[0] })
  }
}

// 5. Outbound fetches with a non-literal URL and redirects fed by request data, inside routes/actions only.
for (const f of files) {
  const src = read(f)
  const entry = /\/app\/.*\/route\.(ts|js)$/.test(f) || /^\s*(['"])use server\1/m.test(src.slice(0, 400))
  if (!entry) continue
  for (const m of src.matchAll(/\bfetch\(\s*([^,)]+)/g)) {
    const arg = m[1].trim()
    if (/^['"`](https?:\/\/|\/)/.test(arg) && !/\$\{[^}]*(url|href|link|domain|host|website|site)[^}]*\}/i.test(arg)) continue
    if (!/url|href|link|domain|host|website|site|target|endpoint/i.test(arg)) continue
    report.ssrf.push({ file: rel(f), line: lineOf(src, m.index), arg: arg.slice(0, 80), manualRedirect: /redirect:\s*['"]manual['"]/.test(src) })
  }
  for (const m of src.matchAll(/(?:NextResponse\.)?redirect\(\s*([^)]{0,120})/g)) {
    const arg = m[1]
    if (/searchParams|\bnext\b|returnTo|return_url|redirect_to|redirectTo|callback|\breq\b|request\.|params\./.test(arg)) {
      report.redirects.push({ file: rel(f), line: lineOf(src, m.index), arg: arg.slice(0, 100) })
    }
  }
}

// 6. Mutations by id from client input in routes/actions: update/delete/upsert chains and the eq() scoping they carry.
for (const f of files) {
  const src = read(f)
  const entry = /\/app\/.*\/route\.(ts|js)$/.test(f) || /^\s*(['"])use server\1/m.test(src.slice(0, 400))
  if (!entry) continue
  const admin = /supabaseAdmin|serviceRole|service_role|SERVICE_ROLE|SUPABASE_SECRET|Db\(\)|adminClient|createAdminClient/.test(src)
  const own = /verify(Brand|Module)?Ownership|brand_members|instance_members|\.eq\(\s*['"](user_id|owner_id|created_by)['"]|requireAdmin|cronRoute|constructEvent/.test(src)
  for (const m of src.matchAll(/\.from\(\s*['"]([a-z_]+)['"]\s*\)\s*\.(update|delete|upsert)\(/g)) {
    const chain = src.slice(m.index, m.index + 400).split(/\n\s*\n/)[0]
    const eqs = [...chain.matchAll(/\.(eq|in|match)\(\s*['"]([a-z_]+)['"]/g)].map((e) => e[2])
    const scoped = eqs.some((k) => /user|owner|brand|instance|tenant|account|member|created_by|email/.test(k))
    report.mutations.push({ file: rel(f), line: lineOf(src, m.index), table: m[1], op: m[2], eqs, scoped, admin, own })
  }
}

// 7. Edge layer and the framework version.
for (const name of ['proxy.ts', 'middleware.ts']) {
  const p = join(root, name)
  if (existsSync(p)) {
    const src = read(p)
    report.edge[name] = {
      lines: src.split('\n').length,
      startsWith: (src.match(/startsWith\(/g) || []).length,
      exactMatch: [...src.matchAll(/pathname\s*===\s*['"]([^'"]+)['"]/g)].map((m) => m[1]),
      publicList: [...src.matchAll(/['"](\/[a-z0-9\-/_[\]]*)['"]/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 40),
    }
  }
}
try {
  const pkg = JSON.parse(read(join(root, 'package.json')))
  report.edge.next = pkg.dependencies?.next || null
  report.edge.node = pkg.engines?.node || null
} catch {}

// 8. Dependency advisories: critical and high on direct runtime dependencies only.
try {
  const out = execSync('npm audit --omit=dev --json 2>/dev/null || true', { cwd: root, timeout: 90_000, maxBuffer: 50_000_000 }).toString()
  const j = JSON.parse(out || '{}')
  const vulns = j.vulnerabilities || {}
  const direct = new Set(Object.keys(JSON.parse(read(join(root, 'package.json'))).dependencies || {}))
  report.audit = Object.values(vulns)
    .filter((v) => (v.severity === 'critical' || v.severity === 'high') && direct.has(v.name))
    .map((v) => ({ name: v.name, severity: v.severity, range: v.range, fixAvailable: !!v.fixAvailable, titles: (v.via || []).filter((x) => typeof x === 'object').map((x) => x.title).slice(0, 3) }))
} catch (e) {
  report.audit = { error: String(e.message || e).slice(0, 120) }
}

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0) }

// Human layout: compact, one line per candidate, worst first.
const p = (s = '') => console.log(s)
p(`# security scan ${basename(root)}  (${files.length} code files, next ${report.edge.next ?? '?'}, node ${report.edge.node ?? '?'})`)

p(`\n## server actions without an auth call in the body (${report.actions.filter((a) => !a.auth).length} of ${report.actions.length})`)
for (const a of report.actions.filter((a) => !a.auth)) p(`- ${a.file}:${a.line} ${a.name}()  first: ${a.first}`)
p(`\n## server actions whose auth call is not the first statement`)
for (const a of report.actions.filter((a) => a.auth && !new RegExp(a.auth.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(a.first))) p(`- ${a.file}:${a.line} ${a.name}()  auth=${a.auth}  first: ${a.first}`)

p(`\n## api routes with no auth or public mechanism visible (${report.routes.filter((r) => !r.mechanisms.length).length} of ${report.routes.length})`)
for (const r of report.routes.filter((r) => !r.mechanisms.length)) p(`- ${r.file} [${r.handlers.join(',')}] imports: ${r.imports.filter((i) => i.startsWith('@/') || i.startsWith('.')).join(' ')}`)
p(`\n## api routes by mechanism`)
for (const r of report.routes.filter((r) => r.mechanisms.length)) p(`- ${r.file} [${r.handlers.join(',')}] ${r.mechanisms.join(', ')}${r.maxDuration ? '' : '  (no maxDuration)'}`)

p(`\n## service-role clients and their importers`)
for (const s of report.serviceRole) {
  p(`- ${s.module}  env: ${s.envs.join(', ')}`)
  for (const i of s.importers) p(`    ${i.client ? 'CLIENT COMPONENT ' : ''}${i.entry ? (i.auth ? 'entry+auth ' : 'ENTRY NO AUTH ') : 'lib '}${i.file}`)
}

p(`\n## secret literals in tracked files (${report.secrets.length})`)
for (const s of report.secrets) p(`- ${s.file}:${s.line} ${s.kind} ${s.sample}`)
p(`## tracked env files (${report.envFiles.length})`)
for (const e of report.envFiles) p(`- ${e}`)
p(`## secret-looking NEXT_PUBLIC names (${report.publicEnv.length})`)
for (const e of report.publicEnv) p(`- ${e.file}:${e.line} ${e.name}`)

p(`\n## outbound fetch with a variable url in a route or action (${report.ssrf.length})`)
for (const s of report.ssrf) p(`- ${s.file}:${s.line} fetch(${s.arg})${s.manualRedirect ? '  redirect:manual present' : ''}`)
p(`## redirects fed by request data (${report.redirects.length})`)
for (const r of report.redirects) p(`- ${r.file}:${r.line} redirect(${r.arg})`)

const risky = report.mutations.filter((m) => !m.scoped && m.admin && !m.own)
p(`\n## mutations by id through a privileged client in a file with no ownership or trusted-caller evidence (${risky.length} of ${report.mutations.length} mutations)`)
for (const m of risky) p(`- ${m.file}:${m.line} ${m.table}.${m.op} eq(${m.eqs.join(',')})`)
const rest = report.mutations.filter((m) => !m.scoped && !(m.admin && !m.own))
p(`## other unscoped mutations, file has ownership/trusted-caller evidence or uses the user's own client (${rest.length}): ${[...new Set(rest.map((m) => m.file))].join(' ')}`)

p(`\n## edge layer`)
for (const [k, v] of Object.entries(report.edge)) if (typeof v === 'object' && v) p(`- ${k}: ${v.lines} lines, startsWith x${v.startsWith}, exact-match paths: ${v.exactMatch.join(' ') || 'none'}, public: ${v.publicList.join(' ')}`)

p(`\n## dependency advisories (critical/high, direct runtime deps)`)
if (!report.audit) p('- not run')
else if (report.audit.error) p(`- audit unavailable: ${report.audit.error}`)
else if (!report.audit.length) p('- none')
else for (const a of report.audit) p(`- ${a.name} ${a.severity} ${a.range} fix:${a.fixAvailable}  ${a.titles.join(' | ')}`)
